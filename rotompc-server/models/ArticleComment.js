const mongoose = require("mongoose");

const articleCommentSchema = new mongoose.Schema(
  {
    article: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Article",

      required: true,

      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      index: true,
    },

    author: {
      type: String,

      required: true,

      trim: true,

      maxlength: 40,
    },

    body: {
      type: String,

      required: true,

      trim: true,

      maxlength: 500,
    },
  },
  {
    timestamps: true,

    versionKey: false,

    collection: "articlecomments",
  },
);

articleCommentSchema.index({
  article: 1,
  createdAt: 1,
});

module.exports =
  mongoose.models.ArticleComment ||
  mongoose.model("ArticleComment", articleCommentSchema);
