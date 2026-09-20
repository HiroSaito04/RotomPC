// rotompc-server/controllers/articleController.js

const mongoose = require("mongoose");

const crypto = require("crypto");

const Article = require("../models/Articles");

const User = require("../models/User");

const ArticleLike = require("../models/ArticleLike");

const ArticleComment = require("../models/ArticleComment");

const { awardBerriesOnce } = require("../services/buddyService");

/* =========================================================
   CONFIG
========================================================= */

const ARTICLE_LIST_FIELDS = [
  "id",
  "name",
  "title",
  "desc",
  "author",
  "userId",
  "status",
  "color",
  "date",
  "imageUrl",
  "imageMimeType",
  "createdAt",
  "updatedAt",
].join(" ");

const PRIVILEGED_ARTICLE_ROLES = ["admin", "editor"];

/* =========================================================
   HELPERS
========================================================= */

const createBaseSlug = (text) =>
  String(text || "article")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "article";

const createUniqueSlug = async (title) => {
  const baseSlug = createBaseSlug(title);

  let slug = baseSlug;

  let counter = 1;

  while (
    await Article.exists({
      name: slug,
    })
  ) {
    counter += 1;

    slug = `${baseSlug}-${counter}`;
  }

  return slug;
};

const normalizeContent = (content) => {
  if (Array.isArray(content)) {
    return content.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof content === "string") {
    const value = content.trim();

    return value ? [value] : [];
  }

  return [];
};

const isArticleManager = (role) => PRIVILEGED_ARTICLE_ROLES.includes(role);

const canModifyArticle = (req, article) => {
  if (isArticleManager(req.user.role)) {
    return true;
  }

  return String(article.userId) === String(req.user.id);
};

const isValidId = (id) => mongoose.isValidObjectId(id);

/* =========================================================
   LIKE METADATA
========================================================= */

const getLikeMetadata = async (articleId, userId = null) => {
  const queries = [
    ArticleLike.countDocuments({
      article: articleId,
    }),
  ];

  if (userId) {
    queries.push(
      ArticleLike.exists({
        article: articleId,

        user: userId,
      }),
    );
  }

  const results = await Promise.all(queries);

  return {
    likesCount: results[0] || 0,

    liked: userId ? Boolean(results[1]) : false,
  };
};

/* =========================================================
   CREATE ARTICLE
========================================================= */

const createArticle = async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();

    const desc = String(req.body.desc || "").trim();

    const content = normalizeContent(req.body.content);

    const color = String(req.body.color || "bg-zinc-500").trim();

    if (!title) {
      return res.status(400).json({
        message: "Article title is required.",
      });
    }

    if (content.length === 0) {
      return res.status(400).json({
        message: "Article content is required.",
      });
    }

    /*
     * Server determines the
     * authenticated owner.
     */
    const user = await User.findById(req.user.id).select(
      "username firstName isActive",
    );

    if (!user || user.isActive === false) {
      return res.status(403).json({
        message: "Your trainer account is unavailable.",
      });
    }

    const articleData = {
      id: `ART-${crypto.randomUUID()}`,

      name: await createUniqueSlug(title),

      title,
      desc,
      content,

      userId: user._id,

      author: user.username || user.firstName || "trainer",

      status: "active",

      color,
    };

    /* -----------------------------------------------------
         IMAGE
      ----------------------------------------------------- */

    if (req.file) {
      articleData.imageBuffer = req.file.buffer;

      articleData.imageMimeType = req.file.mimetype;

      articleData.imageUrl = "";
    } else {
      articleData.imageUrl = String(req.body.image || "").trim();
    }

    const article = await Article.create(articleData);

    /* -----------------------------------------------------
         +10 BERRIES FOR POST
      ----------------------------------------------------- */

    let berryReward = 0;
    let berries = null;

    try {
      const reward = await awardBerriesOnce(user._id, "post", article._id);

      berryReward = reward.amount || 0;

      berries = reward.berries ?? null;
    } catch (rewardError) {
      /*
       * Do not destroy an already
       * published article just
       * because its reward ledger
       * encountered an error.
       */
      console.error("Post berry reward error:", rewardError);
    }

    const response = article.toObject();

    response.berryReward = berryReward;

    response.berries = berries;

    response.likesCount = 0;

    response.liked = false;

    return res.status(201).json(response);
  } catch (error) {
    console.error("createArticle error:", error);

    return res.status(400).json({
      message: error.message || "Unable to create article.",
    });
  }
};

/* =========================================================
   GET ARTICLES
========================================================= */

const getArticles = async (req, res) => {
  try {
    const articles = await Article.find({
      status: "active",
    })
      .select(ARTICLE_LIST_FIELDS)
      .sort({
        createdAt: -1,
      })
      .lean();

    /*
     * Add counts without requiring
     * likes to be stored inside the
     * Article model.
     */
    const ids = articles.map((article) => article._id);

    let countMap = new Map();

    if (ids.length > 0) {
      const counts = await ArticleLike.aggregate([
        {
          $match: {
            article: {
              $in: ids,
            },
          },
        },

        {
          $group: {
            _id: "$article",

            count: {
              $sum: 1,
            },
          },
        },
      ]);

      countMap = new Map(counts.map((row) => [String(row._id), row.count]));
    }

    let likedSet = new Set();

    if (req.user?.id && ids.length > 0) {
      const liked = await ArticleLike.find({
        article: {
          $in: ids,
        },

        user: req.user.id,
      })
        .select("article")
        .lean();

      likedSet = new Set(liked.map((row) => String(row.article)));
    }

    const result = articles.map((article) => ({
      ...article,

      likesCount: countMap.get(String(article._id)) || 0,

      liked: likedSet.has(String(article._id)),
    }));

    return res.json(result);
  } catch (error) {
    console.error("getArticles error:", error);

    return res.status(500).json({
      message: "Unable to load articles.",
    });
  }
};

/* =========================================================
   GET ARTICLE BY SLUG
========================================================= */

const getArticleByName = async (req, res) => {
  try {
    const name = String(req.params.name || "").trim();

    if (!name) {
      return res.status(400).json({
        message: "Article name is required.",
      });
    }

    const article = await Article.findOne({
      name,
      status: "active",
    })
      .select(
        [
          "id",
          "name",
          "title",
          "desc",
          "content",
          "author",
          "userId",
          "status",
          "color",
          "date",
          "imageUrl",
          "imageMimeType",
          "createdAt",
          "updatedAt",
        ].join(" "),
      )
      .lean();

    if (!article) {
      return res.status(404).json({
        message: "Article not found.",
      });
    }

    const likeData = await getLikeMetadata(article._id, req.user?.id || null);

    return res.json({
      ...article,
      ...likeData,
    });
  } catch (error) {
    console.error("getArticleByName error:", error);

    return res.status(500).json({
      message: "Unable to load article.",
    });
  }
};

/* =========================================================
   ARTICLE IMAGE
========================================================= */

const getArticleImage = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid article ID.",
      });
    }

    const article = await Article.findOne({
      _id: req.params.id,

      status: "active",
    })
      /*
       * +imageBuffer matters if
       * schema has select:false.
       */
      .select("+imageBuffer imageMimeType imageUrl")
      .lean();

    if (!article) {
      return res.status(404).json({
        message: "Article not found.",
      });
    }

    if (article.imageBuffer && article.imageMimeType) {
      let imageData = article.imageBuffer;

      if (imageData?.buffer) {
        imageData = imageData.buffer;
      }

      if (imageData?.data) {
        imageData = Buffer.from(imageData.data);
      }

      res.set("Content-Type", article.imageMimeType);

      res.set("Cache-Control", "public, max-age=86400");

      return res.end(imageData);
    }

    if (article.imageUrl) {
      return res.redirect(article.imageUrl);
    }

    return res.status(404).json({
      message: "Article has no image.",
    });
  } catch (error) {
    console.error("getArticleImage error:", error);

    return res.status(500).json({
      message: "Unable to load article image.",
    });
  }
};

/* =========================================================
   ARTICLES BY USER
========================================================= */

const getArticlesByUser = async (req, res) => {
  try {
    const userId = String(req.params.userId || "").trim();

    if (!isValidId(userId)) {
      return res.status(400).json({
        message: "Invalid trainer ID.",
      });
    }

    const requestedLimit = Number.parseInt(req.query.limit, 10);

    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 20)
      : 4;

    const articles = await Article.find({
      userId,
      status: "active",
    })
      .select(ARTICLE_LIST_FIELDS)
      .sort({
        createdAt: -1,
      })
      .limit(limit)
      .lean();

    if (articles.length === 0) {
      return res.json([]);
    }

    const ids = articles.map((article) => article._id);

    const counts = await ArticleLike.aggregate([
      {
        $match: {
          article: {
            $in: ids,
          },
        },
      },

      {
        $group: {
          _id: "$article",

          count: {
            $sum: 1,
          },
        },
      },
    ]);

    const countMap = new Map(counts.map((row) => [String(row._id), row.count]));

    return res.json(
      articles.map((article) => ({
        ...article,

        likesCount: countMap.get(String(article._id)) || 0,
      })),
    );
  } catch (error) {
    console.error("getArticlesByUser error:", error);

    return res.status(500).json({
      message: "Unable to load trainer articles.",
    });
  }
};

/* =========================================================
   UPDATE ARTICLE
========================================================= */

const updateArticle = async (req, res) => {
  try {
    const articleId = String(req.params.id);

    if (!isValidId(articleId)) {
      return res.status(400).json({
        message: "Invalid article ID.",
      });
    }

    const article = await Article.findById(articleId);

    if (!article) {
      return res.status(404).json({
        message: "Article not found.",
      });
    }

    if (!canModifyArticle(req, article)) {
      return res.status(403).json({
        message: "You cannot edit this article.",
      });
    }

    if (req.body.title !== undefined) {
      const title = String(req.body.title).trim();

      if (!title) {
        return res.status(400).json({
          message: "Article title cannot be empty.",
        });
      }

      article.title = title;
    }

    if (req.body.desc !== undefined) {
      article.desc = String(req.body.desc || "").trim();
    }

    if (req.body.content !== undefined) {
      const content = normalizeContent(req.body.content);

      if (content.length === 0) {
        return res.status(400).json({
          message: "Article content cannot be empty.",
        });
      }

      article.content = content;
    }

    if (req.body.color !== undefined) {
      article.color = String(req.body.color || "bg-zinc-500").trim();
    }

    if (req.body.status !== undefined && isArticleManager(req.user.role)) {
      article.status = String(req.body.status).trim();
    }

    if (req.file) {
      article.imageBuffer = req.file.buffer;

      article.imageMimeType = req.file.mimetype;

      article.imageUrl = "";
    } else if (req.body.image !== undefined) {
      article.imageUrl = String(req.body.image || "").trim();

      article.imageBuffer = undefined;

      article.imageMimeType = undefined;
    }

    const updatedArticle = await article.save();

    const likeData = await getLikeMetadata(
      updatedArticle._id,
      req.user?.id || null,
    );

    return res.json({
      ...updatedArticle.toObject(),
      ...likeData,
    });
  } catch (error) {
    console.error("updateArticle error:", error);

    return res.status(400).json({
      message: error.message || "Unable to update article.",
    });
  }
};

/* =========================================================
   DELETE ARTICLE
========================================================= */

const deleteArticle = async (req, res) => {
  try {
    const articleId = String(req.params.id);

    if (!isValidId(articleId)) {
      return res.status(400).json({
        message: "Invalid article ID.",
      });
    }

    const article = await Article.findById(articleId);

    if (!article) {
      return res.status(404).json({
        message: "Article not found.",
      });
    }

    if (!canModifyArticle(req, article)) {
      return res.status(403).json({
        message: "You cannot delete this article.",
      });
    }

    await Promise.all([
      article.deleteOne(),

      ArticleLike.deleteMany({
        article: article._id,
      }),

      ArticleComment.deleteMany({
        article: article._id,
      }),
    ]);

    return res.json({
      message: "Article deleted successfully.",
    });
  } catch (error) {
    console.error("deleteArticle error:", error);

    return res.status(500).json({
      message: "Unable to delete article.",
    });
  }
};

/* =========================================================
   LIKE ARTICLE
========================================================= */

const likeArticle = async (req, res) => {
  try {
    const articleId = String(req.params.id || "");

    if (!isValidId(articleId)) {
      return res.status(400).json({
        message: "Invalid article ID.",
      });
    }

    const user = await User.findById(req.user.id).select("isActive");

    if (!user || !user.isActive) {
      return res.status(403).json({
        message: "Trainer account is unavailable.",
      });
    }

    const article = await Article.findOne({
      _id: articleId,

      status: "active",
    }).select("_id userId");

    if (!article) {
      return res.status(404).json({
        message: "Article not found.",
      });
    }

    /*
     * Do not allow self-like berry
     * farming.
     */
    if (String(article.userId) === String(req.user.id)) {
      return res.status(400).json({
        message: "You cannot like your own report.",
      });
    }

    let created = false;

    try {
      await ArticleLike.create({
        article: article._id,

        user: req.user.id,
      });

      created = true;
    } catch (error) {
      if (error?.code !== 11000) {
        throw error;
      }
    }

    let reward = {
      amount: 0,
      berries: null,
    };

    if (created) {
      reward = await awardBerriesOnce(req.user.id, "like", article._id);
    }

    const likesCount = await ArticleLike.countDocuments({
      article: article._id,
    });

    return res.json({
      liked: true,

      likesCount,

      berryReward: reward.amount || 0,

      berries: reward.berries ?? null,

      message: created
        ? reward.amount > 0
          ? `Report liked. +${reward.amount} berry.`
          : "Report liked."
        : "Report already liked.",
    });
  } catch (error) {
    console.error("likeArticle error:", error);

    return res.status(500).json({
      message: "Unable to like report.",
    });
  }
};

/* =========================================================
   UNLIKE ARTICLE
========================================================= */

const unlikeArticle = async (req, res) => {
  try {
    const articleId = String(req.params.id || "");

    if (!isValidId(articleId)) {
      return res.status(400).json({
        message: "Invalid article ID.",
      });
    }

    await ArticleLike.deleteOne({
      article: articleId,

      user: req.user.id,
    });

    /*
     * BuddyReward is intentionally
     * NOT removed.
     *
     * Unlike -> like again does not
     * grant another berry.
     */
    const likesCount = await ArticleLike.countDocuments({
      article: articleId,
    });

    return res.json({
      liked: false,

      likesCount,

      berryReward: 0,

      message: "Like removed.",
    });
  } catch (error) {
    console.error("unlikeArticle error:", error);

    return res.status(500).json({
      message: "Unable to remove like.",
    });
  }
};

/* =========================================================
   LIKE STATUS
========================================================= */

const getLikeStatus = async (req, res) => {
  try {
    const articleId = String(req.params.id || "");

    if (!isValidId(articleId)) {
      return res.status(400).json({
        message: "Invalid article ID.",
      });
    }

    const articleExists = await Article.exists({
      _id: articleId,

      status: "active",
    });

    if (!articleExists) {
      return res.status(404).json({
        message: "Article not found.",
      });
    }

    const { likesCount, liked } = await getLikeMetadata(
      articleId,
      req.user?.id || null,
    );

    return res.json({
      liked,
      likesCount,
    });
  } catch (error) {
    console.error("getLikeStatus error:", error);

    return res.status(500).json({
      message: "Unable to load like status.",
    });
  }
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  getArticles,
  getArticlesByUser,
  getArticleByName,
  getArticleImage,

  createArticle,
  updateArticle,
  deleteArticle,

  likeArticle,
  unlikeArticle,
  getLikeStatus,
};
