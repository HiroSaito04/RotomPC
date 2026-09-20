const mongoose = require("mongoose");

const Article = require("../models/Articles");

const ArticleComment = require("../models/ArticleComment");

const User = require("../models/User");

const PRIVILEGED_ROLES = ["admin", "editor"];

const isValidId = (id) => mongoose.isValidObjectId(id);

/* =========================================================
   GET COMMENTS
========================================================= */

const getArticleComments = async (req, res) => {
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

    const comments = await ArticleComment.find({
      article: articleId,
    })
      .sort({
        createdAt: 1,
      })
      .lean();

    return res.json(comments);
  } catch (error) {
    console.error("getArticleComments error:", error);

    return res.status(500).json({
      message: "Unable to load comments.",
    });
  }
};

/* =========================================================
   CREATE COMMENT
========================================================= */

const createArticleComment = async (req, res) => {
  try {
    const articleId = String(req.params.id || "");

    if (!isValidId(articleId)) {
      return res.status(400).json({
        message: "Invalid article ID.",
      });
    }

    const body = String(req.body.body || "").trim();

    if (!body) {
      return res.status(400).json({
        message: "Comment cannot be empty.",
      });
    }

    if (body.length > 500) {
      return res.status(400).json({
        message: "Comment cannot exceed 500 characters.",
      });
    }

    const [article, user] = await Promise.all([
      Article.findOne({
        _id: articleId,

        status: "active",
      })
        .select("_id")
        .lean(),

      User.findById(req.user.id).select("username firstName isActive").lean(),
    ]);

    if (!article) {
      return res.status(404).json({
        message: "Article not found.",
      });
    }

    if (!user || user.isActive === false) {
      return res.status(403).json({
        message: "Trainer account is unavailable.",
      });
    }

    const comment = await ArticleComment.create({
      article: articleId,

      user: user._id,

      author: user.username || user.firstName || "Trainer",

      body,
    });

    return res.status(201).json(comment.toObject());
  } catch (error) {
    console.error("createArticleComment error:", error);

    return res.status(500).json({
      message: "Unable to post comment.",
    });
  }
};

/* =========================================================
   DELETE COMMENT
========================================================= */

const deleteArticleComment = async (req, res) => {
  try {
    const articleId = String(req.params.id || "");

    const commentId = String(req.params.commentId || "");

    if (!isValidId(articleId) || !isValidId(commentId)) {
      return res.status(400).json({
        message: "Invalid comment request.",
      });
    }

    const comment = await ArticleComment.findOne({
      _id: commentId,

      article: articleId,
    });

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found.",
      });
    }

    const isOwner = String(comment.user) === String(req.user.id);

    const isPrivileged = PRIVILEGED_ROLES.includes(req.user.role);

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({
        message: "You cannot delete this comment.",
      });
    }

    await comment.deleteOne();

    return res.json({
      deleted: true,

      commentId: String(comment._id),
    });
  } catch (error) {
    console.error("deleteArticleComment error:", error);

    return res.status(500).json({
      message: "Unable to delete comment.",
    });
  }
};

module.exports = {
  getArticleComments,
  createArticleComment,
  deleteArticleComment,
};
