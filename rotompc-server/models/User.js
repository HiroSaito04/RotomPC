// rotompc-server/models/User.js

const mongoose = require("mongoose");

const { POKEMON_TYPES } = require("../constants/pokemon");

const userSchema = new mongoose.Schema(
  {
    /* ===============================================
         ACCOUNT
      ================================================ */

    firstName: {
      type: String,
      trim: true,
      default: "",
      maxlength: 50,
    },

    lastName: {
      type: String,
      trim: true,
      default: "",
      maxlength: 50,
    },

    age: {
      type: Number,
      default: null,
      min: 18,
      max: 100,
    },

    gender: {
      type: String,

      enum: ["male", "female", "other", ""],

      default: "",
    },

    contactNumber: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },

    password: {
      type: String,
      select: false,
      default: null,
    },

    address: {
      type: String,
      trim: true,
      default: "",
      maxlength: 200,
    },

    role: {
      type: String,

      enum: ["admin", "professor", "trainer", "editor"],

      default: "trainer",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    /*
     * False for a new Google/Apple
     * trainer until missing fields
     * have been completed.
     */
    profileCompleted: {
      type: Boolean,
      default: true,
    },

    /* ===============================================
         AUTH PROVIDERS
      ================================================ */

    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    appleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    /* ===============================================
         TRAINER PROFILE
      ================================================ */

    trainerCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    bio: {
      type: String,
      maxlength: 160,
      default: "",
      trim: true,
    },

    region: {
      type: String,
      maxlength: 30,
      default: "",
      trim: true,
    },

    favoritePokemon: {
      id: {
        type: Number,
        min: 1,
        max: 1025,
        default: null,
      },

      name: {
        type: String,
        lowercase: true,
        trim: true,
        maxlength: 50,
        default: "",
      },
    },

    favoriteType: {
      type: String,

      enum: [...POKEMON_TYPES, ""],

      default: "",
    },

    profileVisibility: {
      type: String,

      enum: ["public", "private"],

      default: "public",
    },

    /* ===============================================
         POKÉSOCIAL
      ================================================ */

    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,

        ref: "User",
      },
    ],

    following: [
      {
        type: mongoose.Schema.Types.ObjectId,

        ref: "User",
      },
    ],
  },

  {
    timestamps: true,
  },
);

/* =========================================================
   PUBLIC TRAINER PROFILE
========================================================= */

userSchema.methods.toPublicProfile = function () {
  return {
    id: this._id,

    username: this.username,

    firstName: this.firstName,

    role: this.role,

    gender: this.gender,

    trainerCode: this.trainerCode,

    bio: this.bio,

    region: this.region,

    favoritePokemon: this.favoritePokemon,

    favoriteType: this.favoriteType,

    followersCount: this.followers?.length || 0,

    followingCount: this.following?.length || 0,

    profileVisibility: this.profileVisibility,

    createdAt: this.createdAt,
  };
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
