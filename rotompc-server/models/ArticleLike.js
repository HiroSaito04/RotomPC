// rotompc-server/models/ArticleLike.js

const mongoose = require("mongoose");

const articleLikeSchema = new mongoose.Schema(
  {
    article: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

articleLikeSchema.index(
  {
    article: 1,
    user: 1,
  },
  {
    unique: true,
  },
);

module.exports =
  mongoose.models.ArticleLike ||
  mongoose.model("ArticleLike", articleLikeSchema);
