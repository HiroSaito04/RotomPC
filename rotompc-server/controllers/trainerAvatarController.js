// filepath: rotompc-server/controllers/trainerAvatarController.js

const mongoose = require("mongoose");

const User = require("../models/User");

const TrainerAvatarSelection = require("../models/TrainerAvatarSelection");

const {
  TRAINER_AVATARS,
  getTrainerAvatarById,
} = require("../constants/trainerAvatars");

/* =========================================================
   HELPERS
========================================================= */

const normalizeId = (value) => String(value || "").trim();

const isValidId = (value) => mongoose.isValidObjectId(value);

const serializeAvatar = (avatar) => {
  if (!avatar) {
    return null;
  }

  return {
    id: avatar.id,

    label: avatar.label,

    category: avatar.category,

    imageUrl: avatar.imageUrl,

    credit: avatar.credit,

    source: avatar.source,
  };
};

const getSelection = async (userId) => {
  const selection = await TrainerAvatarSelection.findOne({
    user: userId,
  })
    .select("avatarId updatedAt")
    .lean();

  if (!selection) {
    return {
      avatar: null,

      selected: false,

      updatedAt: null,
    };
  }

  const avatar = getTrainerAvatarById(selection.avatarId);

  /*
   * The database can contain an old avatar ID
   * after an avatar is removed from the catalog.
   *
   * Never return a broken sprite URL.
   */
  if (!avatar) {
    return {
      avatar: null,

      selected: false,

      updatedAt: selection.updatedAt || null,
    };
  }

  return {
    avatar: serializeAvatar(avatar),

    selected: true,

    updatedAt: selection.updatedAt || null,
  };
};

/* =========================================================
   CATALOG
========================================================= */

const getTrainerAvatarCatalog = async (req, res) => {
  return res.json({
    avatars: TRAINER_AVATARS.map(serializeAvatar),

    count: TRAINER_AVATARS.length,

    source: {
      name: "Pokémon Showdown",

      note: "Trainer sprites are served unmodified. Individual artist credits are included with each avatar.",
    },
  });
};

/* =========================================================
   CURRENT TRAINER AVATAR
========================================================= */

const getMyTrainerAvatar = async (req, res) => {
  try {
    const userId = normalizeId(req.user?.id);

    if (!isValidId(userId)) {
      return res.status(400).json({
        message: "Invalid trainer ID.",
      });
    }

    const user = await User.findById(userId).select("_id isActive").lean();

    if (!user) {
      return res.status(404).json({
        message: "Trainer not found.",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        message: "Trainer account is unavailable.",
      });
    }

    const selection = await getSelection(userId);

    return res.json(selection);
  } catch (error) {
    console.error("getMyTrainerAvatar error:", error);

    return res.status(500).json({
      message: "Unable to load Trainer avatar.",
    });
  }
};

/* =========================================================
   PUBLIC TRAINER AVATAR
========================================================= */

const getTrainerAvatar = async (req, res) => {
  try {
    const userId = normalizeId(req.params.userId || req.params.id);

    if (!isValidId(userId)) {
      return res.status(400).json({
        message: "Invalid trainer ID.",
      });
    }

    const user = await User.findById(userId)
      .select("_id isActive profileVisibility")
      .lean();

    if (!user || user.isActive === false) {
      return res.status(404).json({
        message: "Trainer not found.",
      });
    }

    /*
     * Keep the avatar privacy behavior aligned
     * with public/social Trainer profiles.
     */
    if (user.profileVisibility === "private") {
      return res.status(403).json({
        message: "This trainer profile is private.",
      });
    }

    const selection = await getSelection(userId);

    return res.json(selection);
  } catch (error) {
    console.error("getTrainerAvatar error:", error);

    return res.status(500).json({
      message: "Unable to load Trainer avatar.",
    });
  }
};

/* =========================================================
   SAVE CURRENT TRAINER AVATAR
========================================================= */

const updateMyTrainerAvatar = async (req, res) => {
  try {
    const userId = normalizeId(req.user?.id);

    const avatarId = String(req.body?.avatarId || "")
      .trim()
      .toLowerCase();

    if (!isValidId(userId)) {
      return res.status(400).json({
        message: "Invalid trainer ID.",
      });
    }

    if (!avatarId) {
      return res.status(400).json({
        message: "Trainer avatar ID is required.",
      });
    }

    const avatar = getTrainerAvatarById(avatarId);

    if (!avatar) {
      return res.status(400).json({
        message: "Invalid Trainer avatar.",
      });
    }

    const user = await User.findById(userId).select("_id isActive").lean();

    if (!user) {
      return res.status(404).json({
        message: "Trainer not found.",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        message: "Trainer account is unavailable.",
      });
    }

    const selection = await TrainerAvatarSelection.findOneAndUpdate(
      {
        user: userId,
      },

      {
        $set: {
          avatarId: avatar.id,
        },
      },

      {
        new: true,

        upsert: true,

        runValidators: true,

        setDefaultsOnInsert: true,
      },
    );

    return res.json({
      message: "Trainer character updated.",

      selected: true,

      avatar: serializeAvatar(avatar),

      updatedAt: selection.updatedAt,
    });
  } catch (error) {
    console.error("updateMyTrainerAvatar error:", error);

    /*
     * Very unlikely, but two simultaneous first-time
     * avatar selections could race against the unique
     * user index.
     */
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "Trainer avatar was updated by another request. Please try again.",
      });
    }

    return res.status(500).json({
      message: "Unable to update Trainer character.",
    });
  }
};

/* =========================================================
   CLEAR CURRENT TRAINER AVATAR
========================================================= */

const clearMyTrainerAvatar = async (req, res) => {
  try {
    const userId = normalizeId(req.user?.id);

    if (!isValidId(userId)) {
      return res.status(400).json({
        message: "Invalid trainer ID.",
      });
    }

    /*
     * Make sure an authenticated but deleted/stale
     * account cannot mutate avatar state.
     */
    const user = await User.findById(userId).select("_id isActive").lean();

    if (!user) {
      return res.status(404).json({
        message: "Trainer not found.",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        message: "Trainer account is unavailable.",
      });
    }

    await TrainerAvatarSelection.deleteOne({
      user: userId,
    });

    return res.json({
      message: "Trainer character cleared.",

      selected: false,

      avatar: null,
    });
  } catch (error) {
    console.error("clearMyTrainerAvatar error:", error);

    return res.status(500).json({
      message: "Unable to clear Trainer character.",
    });
  }
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  getTrainerAvatarCatalog,

  getMyTrainerAvatar,

  getTrainerAvatar,

  updateMyTrainerAvatar,

  clearMyTrainerAvatar,
};
