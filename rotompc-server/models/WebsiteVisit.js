// filepath: rotompc-server/models/WebsiteVisit.js

const mongoose = require("mongoose");

/* =========================================================
   WEBSITE VISIT
========================================================= */

const websiteVisitSchema = new mongoose.Schema(
  {
    /*
     * SHA-256/HMAC hash of the anonymous browser identifier.
     *
     * The raw visitor ID is NEVER stored in MongoDB.
     */
    visitorHash: {
      type: String,
      required: true,
      trim: true,
      maxlength: 128,
      index: true,
    },

    /*
     * SPA pathname only.
     *
     * Query strings and hashes are intentionally excluded.
     */
    path: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
      index: true,
    },

    /*
     * Broad site section for reporting.
     */
    section: {
      type: String,
      enum: ["public", "auth", "dashboard", "other"],
      default: "public",
      index: true,
    },
  },

  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },

    versionKey: false,
  },
);

/* =========================================================
   INDEXES
========================================================= */

websiteVisitSchema.index({
  createdAt: -1,
});

websiteVisitSchema.index({
  path: 1,
  createdAt: -1,
});

websiteVisitSchema.index({
  section: 1,
  createdAt: -1,
});

websiteVisitSchema.index({
  visitorHash: 1,
  createdAt: -1,
});

/* =========================================================
   MODEL
========================================================= */

module.exports =
  mongoose.models.WebsiteVisit ||
  mongoose.model("WebsiteVisit", websiteVisitSchema);
