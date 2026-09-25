// rotompc-server/models/RotomAIConversation.js

const mongoose = require("mongoose");

/* =========================================================
   SOURCE
========================================================= */

const sourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },

    url: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
  },
  {
    _id: false,
  },
);

/* =========================================================
   MESSAGE
========================================================= */

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },

    content: {
      type: String,
      required: true,
      maxlength: 15000,
    },

    model: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    grounded: {
      type: Boolean,
      default: false,
    },

    warning: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    sources: {
      type: [sourceSchema],
      default: [],
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  },
);

/* =========================================================
   CONVERSATION
========================================================= */

const rotomAIConversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    messages: {
      type: [messageSchema],
      default: [],
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

/* =========================================================
   MODEL
========================================================= */

module.exports =
  mongoose.models.RotomAIConversation ||
  mongoose.model("RotomAIConversation", rotomAIConversationSchema);
