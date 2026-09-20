// rotompc-server/models/BuddyReward.js

const mongoose = require("mongoose");

/* =========================================================
   BUDDY REWARD SCHEMA
========================================================= */

const buddyRewardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      index: true,
    },

    /*
     * PokéSocial action that
     * generated the reward.
     */
    action: {
      type: String,

      enum: ["like", "follow", "post"],

      required: true,
    },

    /*
     * Unique source of the reward.
     *
     * like:
     *   article ObjectId
     *
     * follow:
     *   followed trainer ObjectId
     *
     * post:
     *   newly-created article ObjectId
     */
    sourceId: {
      type: String,

      required: true,

      trim: true,
    },

    berries: {
      type: Number,

      required: true,

      min: 1,
    },
  },

  {
    timestamps: true,
  },
);

/* =========================================================
   ANTI-FARM INDEX
========================================================= */

/*
 * Prevent:
 *
 * like -> unlike -> like farming
 *
 * follow -> unfollow -> follow farming
 *
 * The same action on the same resource
 * can only reward berries once for
 * each trainer account.
 */
buddyRewardSchema.index(
  {
    user: 1,
    action: 1,
    sourceId: 1,
  },

  {
    unique: true,
  },
);

/* =========================================================
   EXPORT
========================================================= */

module.exports = mongoose.model("BuddyReward", buddyRewardSchema);
