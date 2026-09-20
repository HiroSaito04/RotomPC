// rotompc-server/controllers/articleInteractionController.js

const mongoose = require("mongoose");

const Article = require("../models/Articles");

const ArticleLike = require("../models/ArticleLike");

const User = require("../models/User");

const { awardBerriesOnce } = require("../services/buddyService");

/* =========================================================
   HELPERS
========================================================= */

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/* =========================================================
   LIKE
========================================================= */

const likeArticle = async (req, res) => {
  try {
    const articleId = String(req.params.id || "");

    /* ---------------------------------------------------
         VALIDATE ARTICLE ID
      --------------------------------------------------- */

    if (!isValidId(articleId)) {
      return res.status(400).json({
        message: "Invalid article ID.",
      });
    }

    /* ---------------------------------------------------
         VALIDATE TRAINER
      --------------------------------------------------- */

    const user = await User.findById(req.user.id).select("isActive");

    if (!user || user.isActive === false) {
      return res.status(403).json({
        message: "Trainer account is unavailable.",
      });
    }

    /* ---------------------------------------------------
         ARTICLE
      --------------------------------------------------- */

    const article = await Article.findOne({
      _id: articleId,

      status: "active",
    }).select("_id userId");

    if (!article) {
      return res.status(404).json({
        message: "Article not found.",
      });
    }

    /* ---------------------------------------------------
         NO SELF-LIKE FARMING
      --------------------------------------------------- */

    if (String(article.userId) === String(req.user.id)) {
      return res.status(400).json({
        message: "You cannot like your own report.",
      });
    }

    /* ---------------------------------------------------
         CREATE LIKE ONCE
      --------------------------------------------------- */

    let created = false;

    try {
      await ArticleLike.create({
        article: article._id,

        user: req.user.id,
      });

      created = true;
    } catch (error) {
      /*
       * Unique article/user index means
       * repeated requests cannot create
       * duplicate likes.
       */

      if (error?.code !== 11000) {
        throw error;
      }
    }

    /* ---------------------------------------------------
         BERRY REWARD

         Only a newly-created like can attempt
         to award a berry.

         awardBerriesOnce() still protects the
         reward permanently, so unlike -> like
         cannot farm another berry.
      --------------------------------------------------- */

    let reward = {
      amount: 0,
      berries: null,
    };

    if (created) {
      reward = await awardBerriesOnce(req.user.id, "like", article._id);
    }

    /* ---------------------------------------------------
         CURRENT COUNT
      --------------------------------------------------- */

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
    console.error("likeArticle:", error);

    return res.status(500).json({
      message: "Unable to like report.",
    });
  }
};

/* =========================================================
   UNLIKE
========================================================= */

const unlikeArticle = async (req, res) => {
  try {
    const articleId = String(req.params.id || "");

    if (!isValidId(articleId)) {
      return res.status(400).json({
        message: "Invalid article ID.",
      });
    }

    const article = await Article.exists({
      _id: articleId,

      status: "active",
    });

    if (!article) {
      return res.status(404).json({
        message: "Article not found.",
      });
    }

    await ArticleLike.deleteOne({
      article: articleId,

      user: req.user.id,
    });

    /*
     * IMPORTANT:
     *
     * BuddyReward is intentionally NOT deleted.
     *
     * Therefore:
     *
     * like
     * -> receive berry
     * -> unlike
     * -> like again
     *
     * does NOT award another berry.
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
    console.error("unlikeArticle:", error);

    return res.status(500).json({
      message: "Unable to remove like.",
    });
  }
};

/* =========================================================
   STATUS
========================================================= */

const getLikeStatus = async (req, res) => {
  try {
    const articleId = String(req.params.id || "");

    if (!isValidId(articleId)) {
      return res.status(400).json({
        message: "Invalid article ID.",
      });
    }

    const article = await Article.exists({
      _id: articleId,

      status: "active",
    });

    if (!article) {
      return res.status(404).json({
        message: "Article not found.",
      });
    }

    const [liked, likesCount] = await Promise.all([
      ArticleLike.exists({
        article: articleId,

        user: req.user.id,
      }),

      ArticleLike.countDocuments({
        article: articleId,
      }),
    ]);

    return res.json({
      liked: Boolean(liked),

      likesCount,
    });
  } catch (error) {
    console.error("getLikeStatus:", error);

    return res.status(500).json({
      message: "Unable to load like status.",
    });
  }
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  likeArticle,
  unlikeArticle,
  getLikeStatus,
};
