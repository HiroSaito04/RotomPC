// rotompc-server/models/BuddyState.js

const mongoose = require("mongoose");

const buddyStateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    pokemon: {
      id: {
        type: Number,
        default: null,
      },

      name: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
        maxlength: 50,
      },
    },

    /*
     * Affection is equal to the number
     * of successful pet interactions,
     * capped at 100.
     */
    affection: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    petCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    energy: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },

    /*
     * Every account begins with 5.
     */
    berries: {
      type: Number,
      default: 5,
      min: 0,
    },

    restingUntil: {
      type: Date,
      default: null,
    },

    totalPlays: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalBerriesFed: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastInteractionAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("BuddyState", buddyStateSchema);
