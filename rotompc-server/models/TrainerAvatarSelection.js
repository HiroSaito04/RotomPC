// rotompc-server/models/TrainerAvatarSelection.js

const mongoose = require("mongoose");

/* =========================================================
   SCHEMA
========================================================= */

const trainerAvatarSelectionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      unique: true,

      index: true,
    },

    avatarId: {
      type: String,

      required: true,

      trim: true,

      lowercase: true,
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
  mongoose.models.TrainerAvatarSelection ||
  mongoose.model(
    "TrainerAvatarSelection",

    trainerAvatarSelectionSchema,
  );
