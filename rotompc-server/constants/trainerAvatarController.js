// filepath: rotompc-server/controllers/trainerAvatarController.js

const mongoose = require("mongoose");

const User = require("../models/User");

const TrainerAvatarSelection = require("../models/TrainerAvatarSelection");

const {
  TRAINER_AVATARS: BASE_TRAINER_AVATARS,
} = require("../constants/trainerAvatars");

const {
  ADDITIONAL_TRAINER_AVATARS,
} = require("../constants/additionalTrainerAvatars");

const {
  normalizeUserRole,

  canUseSpecialTrainerAvatars,
} = require("../constants/userRoles");

/* =========================================================
   CATALOG
========================================================= */

/*
 * Existing avatars did not previously contain access
 * metadata, so normalize them as public NPC avatars.
 */
const NORMALIZED_BASE_AVATARS = BASE_TRAINER_AVATARS.map((avatar) => ({
  ...avatar,

  characterType: avatar.characterType || "npc",

  access: avatar.access || "public",

  allowedRoles: Array.isArray(avatar.allowedRoles) ? avatar.allowedRoles : [],
}));

const TRAINER_AVATARS = [
  ...NORMALIZED_BASE_AVATARS,

  ...ADDITIONAL_TRAINER_AVATARS,
];

/* =========================================================
   HELPERS
========================================================= */

const normalizeId = (value) => String(value || "").trim();

const isValidId = (value) => mongoose.isValidObjectId(value);

const getTrainerAvatarById = (avatarId) => {
  const normalized = String(avatarId || "")
    .trim()
    .toLowerCase();

  return TRAINER_AVATARS.find((avatar) => avatar.id === normalized) || null;
};

/* =========================================================
   ACCESS
========================================================= */

const canRoleUseAvatar = (role, avatar) => {
  if (!avatar) {
    return false;
  }

  /*
   * Existing NPC avatars and additional NPC avatars
   * remain available to everyone.
   */
  if (avatar.access !== "privileged") {
    return true;
  }

  return canUseSpecialTrainerAvatars(role);
};

const getAvailableAvatarsForRole = (role) => {
  return TRAINER_AVATARS.filter((avatar) => canRoleUseAvatar(role, avatar));
};

/* =========================================================
   SERIALIZE
========================================================= */

const serializeAvatar = (avatar) => {
  if (!avatar) {
    return null;
  }

  return {
    id: avatar.id,

    label: avatar.label,

    category: avatar.category,

    gender: avatar.gender || "unspecified",

    characterType: avatar.characterType || "npc",

    access: avatar.access || "public",

    imageUrl: avatar.imageUrl,

    animatedImageUrl: avatar.animatedImageUrl || null,

    staticImageUrl: avatar.staticImageUrl || null,

    isAnimated: Boolean(avatar.isAnimated),

    credit: avatar.credit,

    source: avatar.source,
  };
};

/* =========================================================
   SELECTION
========================================================= */

const getSelection = async (userId, role) => {
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
   * Avatar may have been removed from the catalog.
   */
  if (!avatar) {
    return {
      avatar: null,

      selected: false,

      updatedAt: selection.updatedAt || null,
    };
  }

  /*
   * Also prevent an account that was demoted from keeping
   * access to a restricted named avatar.
   *
   * The DB selection is retained in case the account is
   * promoted again later, but it will not be returned while
   * the current role lacks permission.
   */
  if (!canRoleUseAvatar(role, avatar)) {
    return {
      avatar: null,

      selected: false,

      restricted: true,

      updatedAt: selection.updatedAt || null,
    };
  }

  return {
    avatar: serializeAvatar(avatar),

    selected: true,

    restricted: false,

    updatedAt: selection.updatedAt || null,
  };
};

/* =========================================================
   CATALOG

   Authenticated routes pass req.user.

   Normal Trainers receive:
   - existing NPC avatars
   - additional NPC avatars

   admin / professor / editor / champion additionally receive:
   - named Champions
   - named Professors
========================================================= */

const getTrainerAvatarCatalog = async (req, res) => {
  try {
    const userId = normalizeId(req.user?.id || req.user?._id);

    let role = "";

    if (isValidId(userId)) {
      const user = await User.findById(userId)
        .select("_id role isActive")
        .lean();

      if (!user || user.isActive === false) {
        return res.status(403).json({
          message: "Trainer account is unavailable.",
        });
      }

      role = normalizeUserRole(user.role);
    }

    const available = getAvailableAvatarsForRole(role);

    return res.json({
      avatars: available.map(serializeAvatar),

      count: available.length,

      role: role || null,

      specialCharactersAvailable: canUseSpecialTrainerAvatars(role),

      source: {
        name: "Pokémon Showdown / Bulbagarden Archives",

        note: "Trainer sprites are served without modification. Named character avatars are restricted by account role.",
      },
    });
  } catch (error) {
    console.error("getTrainerAvatarCatalog error:", error);

    return res.status(500).json({
      message: "Unable to load Trainer avatars.",
    });
  }
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

    const user = await User.findById(userId).select("_id isActive role").lean();

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

    const selection = await getSelection(userId, user.role);

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
      .select("_id isActive profileVisibility role")
      .lean();

    if (!user || user.isActive === false) {
      return res.status(404).json({
        message: "Trainer not found.",
      });
    }

    if (user.profileVisibility === "private") {
      return res.status(403).json({
        message: "This trainer profile is private.",
      });
    }

    const selection = await getSelection(userId, user.role);

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

    const user = await User.findById(userId).select("_id isActive role").lean();

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

    /* ---------------------------------------------------
         RESTRICT NAMED CHARACTER AVATARS
      --------------------------------------------------- */

    if (!canRoleUseAvatar(user.role, avatar)) {
      return res.status(403).json({
        message:
          "This named Trainer character is only available to Admins, Professors, Editors, and Champions.",
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
