// rotompc-server/controllers/socialController.js

const mongoose = require("mongoose");

const User = require("../models/User");

const { awardBerriesOnce } = require("../services/buddyService");

/* =========================================================
   CONFIG
========================================================= */

const PUBLIC_TRAINER_FIELDS = [
  "_id",
  "username",
  "trainerCode",
  "firstName",
  "lastName",
  "gender",
  "region",
  "favoriteType",
  "favoritePokemon",
  "bio",
  "profileVisibility",
  "isActive",
  "createdAt",
].join(" ");

/* =========================================================
   HELPERS
========================================================= */

const isValidId = (id) => mongoose.isValidObjectId(id);

const normalizeId = (value) => String(value || "").trim();

const serializePokemon = (pokemon) => {
  if (!pokemon) {
    return {
      id: null,
      name: "",
    };
  }

  return {
    id: pokemon.id ?? null,

    name: pokemon.name || "",
  };
};

const serializeTrainer = (trainer, options = {}) => {
  if (!trainer) {
    return null;
  }

  const { includeCounts = false } = options;

  const result = {
    id: trainer._id,

    _id: trainer._id,

    username: trainer.username || "",

    trainerCode: trainer.trainerCode || "",

    firstName: trainer.firstName || "",

    lastName: trainer.lastName || "",

    gender: trainer.gender || "",

    region: trainer.region || "",

    favoriteType: trainer.favoriteType || "",

    favoritePokemon: serializePokemon(trainer.favoritePokemon),

    bio: trainer.bio || "",

    profileVisibility: trainer.profileVisibility || "public",

    createdAt: trainer.createdAt || null,
  };

  if (includeCounts) {
    result.followersCount = Array.isArray(trainer.followers)
      ? trainer.followers.length
      : 0;

    result.followingCount = Array.isArray(trainer.following)
      ? trainer.following.length
      : 0;
  }

  return result;
};

const getTrainer = async (id) => {
  if (!isValidId(id)) {
    return null;
  }

  return User.findById(id).select(
    [PUBLIC_TRAINER_FIELDS, "followers", "following"].join(" "),
  );
};

const getPublicTrainer = async (id) => {
  const trainer = await getTrainer(id);

  if (!trainer) {
    return {
      trainer: null,

      error: {
        status: 404,

        message: "Trainer not found.",
      },
    };
  }

  if (trainer.isActive === false) {
    return {
      trainer: null,

      error: {
        status: 404,

        message: "Trainer not found.",
      },
    };
  }

  if (trainer.profileVisibility === "private") {
    return {
      trainer: null,

      error: {
        status: 403,

        message: "This trainer profile is private.",
      },
    };
  }

  return {
    trainer,

    error: null,
  };
};

/* =========================================================
   GET SOCIAL PROFILE

   Public Trainer-ID-style information.
========================================================= */

const getSocialProfile = async (req, res) => {
  try {
    const targetUserId = normalizeId(req.params.userId || req.params.id);

    if (!isValidId(targetUserId)) {
      return res.status(400).json({
        message: "Invalid trainer ID.",
      });
    }

    const { trainer, error } = await getPublicTrainer(targetUserId);

    if (error) {
      return res.status(error.status).json({
        message: error.message,
      });
    }

    return res.json({
      profile: serializeTrainer(trainer, {
        includeCounts: true,
      }),
    });
  } catch (error) {
    console.error("getSocialProfile error:", error);

    return res.status(500).json({
      message: "Unable to load trainer profile.",
    });
  }
};

/* =========================================================
   FOLLOW USER
========================================================= */

const followUser = async (req, res) => {
  try {
    const currentUserId = normalizeId(req.user?.id);

    const targetUserId = normalizeId(req.params.userId || req.params.id);

    if (!isValidId(currentUserId) || !isValidId(targetUserId)) {
      return res.status(400).json({
        message: "Invalid trainer ID.",
      });
    }

    if (currentUserId === targetUserId) {
      return res.status(400).json({
        message: "You cannot follow yourself.",
      });
    }

    const [currentUser, targetUser] = await Promise.all([
      getTrainer(currentUserId),

      getTrainer(targetUserId),
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({
        message: "Trainer not found.",
      });
    }

    if (currentUser.isActive === false || targetUser.isActive === false) {
      return res.status(403).json({
        message: "Trainer account is unavailable.",
      });
    }

    if (targetUser.profileVisibility === "private") {
      return res.status(403).json({
        message: "This trainer profile is private.",
      });
    }

    const alreadyFollowing =
      Array.isArray(currentUser.following) &&
      currentUser.following.some((id) => String(id) === targetUserId);

    /* -----------------------------------------------------
       ALREADY FOLLOWING

       Repair the reverse edge if an old record happened
       to become inconsistent.
    ----------------------------------------------------- */

    if (alreadyFollowing) {
      await User.updateOne(
        {
          _id: targetUserId,
        },

        {
          $addToSet: {
            followers: currentUser._id,
          },
        },
      );

      const [refreshedCurrent, refreshedTarget] = await Promise.all([
        User.findById(currentUserId).select("following"),

        User.findById(targetUserId).select("followers following"),
      ]);

      return res.json({
        following: true,

        followsYou:
          refreshedTarget?.following?.some(
            (id) => String(id) === currentUserId,
          ) || false,

        berryReward: 0,

        followersCount: refreshedTarget?.followers?.length || 0,

        followingCount: refreshedTarget?.following?.length || 0,

        yourFollowingCount: refreshedCurrent?.following?.length || 0,

        message: "Already following trainer.",
      });
    }

    /* -----------------------------------------------------
       CREATE RELATIONSHIP
    ----------------------------------------------------- */

    await Promise.all([
      User.updateOne(
        {
          _id: currentUserId,
        },

        {
          $addToSet: {
            following: targetUser._id,
          },
        },
      ),

      User.updateOne(
        {
          _id: targetUserId,
        },

        {
          $addToSet: {
            followers: currentUser._id,
          },
        },
      ),
    ]);

    /* -----------------------------------------------------
       +5 BERRIES ONCE

       BuddyReward ledger prevents:
       follow -> unfollow -> follow farming.
    ----------------------------------------------------- */

    let reward = {
      amount: 0,

      berries: null,
    };

    try {
      reward = await awardBerriesOnce(
        currentUser._id,

        "follow",

        targetUser._id,
      );
    } catch (rewardError) {
      console.error("Follow berry reward error:", rewardError);
    }

    const [refreshedCurrent, refreshedTarget] = await Promise.all([
      User.findById(currentUserId).select("following"),

      User.findById(targetUserId).select("followers following"),
    ]);

    return res.json({
      following: true,

      followsYou:
        refreshedTarget?.following?.some(
          (id) => String(id) === currentUserId,
        ) || false,

      berryReward: reward.amount || 0,

      berries: reward.berries ?? null,

      followersCount: refreshedTarget?.followers?.length || 0,

      followingCount: refreshedTarget?.following?.length || 0,

      yourFollowingCount: refreshedCurrent?.following?.length || 0,

      message:
        reward.amount > 0
          ? `Trainer followed. +${reward.amount} berries.`
          : "Trainer followed.",
    });
  } catch (error) {
    console.error("followUser error:", error);

    return res.status(500).json({
      message: "Unable to follow trainer.",
    });
  }
};

/* =========================================================
   UNFOLLOW USER
========================================================= */

const unfollowUser = async (req, res) => {
  try {
    const currentUserId = normalizeId(req.user?.id);

    const targetUserId = normalizeId(req.params.userId || req.params.id);

    if (!isValidId(currentUserId) || !isValidId(targetUserId)) {
      return res.status(400).json({
        message: "Invalid trainer ID.",
      });
    }

    if (currentUserId === targetUserId) {
      return res.status(400).json({
        message: "You cannot unfollow yourself.",
      });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId).select("_id following isActive"),

      User.findById(targetUserId).select("_id followers following isActive"),
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({
        message: "Trainer not found.",
      });
    }

    await Promise.all([
      User.updateOne(
        {
          _id: currentUserId,
        },

        {
          $pull: {
            following: targetUser._id,
          },
        },
      ),

      User.updateOne(
        {
          _id: targetUserId,
        },

        {
          $pull: {
            followers: currentUser._id,
          },
        },
      ),
    ]);

    /*
     * BuddyReward is intentionally NOT deleted.
     */

    const [refreshedCurrent, refreshedTarget] = await Promise.all([
      User.findById(currentUserId).select("following"),

      User.findById(targetUserId).select("followers following"),
    ]);

    return res.json({
      following: false,

      followsYou:
        refreshedTarget?.following?.some(
          (id) => String(id) === currentUserId,
        ) || false,

      berryReward: 0,

      followersCount: refreshedTarget?.followers?.length || 0,

      followingCount: refreshedTarget?.following?.length || 0,

      yourFollowingCount: refreshedCurrent?.following?.length || 0,

      message: "Trainer unfollowed.",
    });
  } catch (error) {
    console.error("unfollowUser error:", error);

    return res.status(500).json({
      message: "Unable to unfollow trainer.",
    });
  }
};

/* =========================================================
   FOLLOW STATUS
========================================================= */

const getFollowStatus = async (req, res) => {
  try {
    const currentUserId = normalizeId(req.user?.id);

    const targetUserId = normalizeId(req.params.userId || req.params.id);

    if (!isValidId(currentUserId) || !isValidId(targetUserId)) {
      return res.status(400).json({
        message: "Invalid trainer ID.",
      });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId).select("following followers"),

      User.findById(targetUserId).select(
        ["followers", "following", "profileVisibility", "isActive"].join(" "),
      ),
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({
        message: "Trainer not found.",
      });
    }

    if (targetUser.isActive === false) {
      return res.status(404).json({
        message: "Trainer not found.",
      });
    }

    const following =
      currentUser.following?.some((id) => String(id) === targetUserId) || false;

    const followsYou =
      targetUser.following?.some((id) => String(id) === currentUserId) || false;

    return res.json({
      following,

      followsYou,

      followersCount: targetUser.followers?.length || 0,

      followingCount: targetUser.following?.length || 0,
    });
  } catch (error) {
    console.error("getFollowStatus error:", error);

    return res.status(500).json({
      message: "Unable to load follow status.",
    });
  }
};

/* =========================================================
   GET FOLLOWERS
========================================================= */

const getFollowers = async (req, res) => {
  try {
    const userId = normalizeId(
      req.params.userId || req.params.id || req.user?.id,
    );

    if (!isValidId(userId)) {
      return res.status(400).json({
        message: "Invalid trainer ID.",
      });
    }

    const user = await User.findById(userId)
      .select(["followers", "profileVisibility", "isActive"].join(" "))
      .populate({
        path: "followers",

        select: PUBLIC_TRAINER_FIELDS,

        match: {
          isActive: true,

          profileVisibility: "public",
        },
      });

    if (!user) {
      return res.status(404).json({
        message: "Trainer not found.",
      });
    }

    if (user.isActive === false) {
      return res.status(404).json({
        message: "Trainer not found.",
      });
    }

    const isOwner = req.user?.id && String(req.user.id) === userId;

    if (user.profileVisibility === "private" && !isOwner) {
      return res.status(403).json({
        message: "This trainer profile is private.",
      });
    }

    const followers = (user.followers || [])
      .filter(Boolean)
      .map((trainer) => serializeTrainer(trainer));

    return res.json({
      followers,

      count: followers.length,
    });
  } catch (error) {
    console.error("getFollowers error:", error);

    return res.status(500).json({
      message: "Unable to load followers.",
    });
  }
};

/* =========================================================
   GET FOLLOWING
========================================================= */

const getFollowing = async (req, res) => {
  try {
    const userId = normalizeId(
      req.params.userId || req.params.id || req.user?.id,
    );

    if (!isValidId(userId)) {
      return res.status(400).json({
        message: "Invalid trainer ID.",
      });
    }

    const user = await User.findById(userId)
      .select(["following", "profileVisibility", "isActive"].join(" "))
      .populate({
        path: "following",

        select: PUBLIC_TRAINER_FIELDS,

        match: {
          isActive: true,

          profileVisibility: "public",
        },
      });

    if (!user) {
      return res.status(404).json({
        message: "Trainer not found.",
      });
    }

    if (user.isActive === false) {
      return res.status(404).json({
        message: "Trainer not found.",
      });
    }

    const isOwner = req.user?.id && String(req.user.id) === userId;

    if (user.profileVisibility === "private" && !isOwner) {
      return res.status(403).json({
        message: "This trainer profile is private.",
      });
    }

    const following = (user.following || [])
      .filter(Boolean)
      .map((trainer) => serializeTrainer(trainer));

    return res.json({
      following,

      count: following.length,
    });
  } catch (error) {
    console.error("getFollowing error:", error);

    return res.status(500).json({
      message: "Unable to load following trainers.",
    });
  }
};

/* =========================================================
   REMOVE FOLLOWER
========================================================= */

const removeFollower = async (req, res) => {
  try {
    const currentUserId = normalizeId(req.user?.id);

    const followerId = normalizeId(req.params.userId || req.params.id);

    if (!isValidId(currentUserId) || !isValidId(followerId)) {
      return res.status(400).json({
        message: "Invalid trainer ID.",
      });
    }

    if (currentUserId === followerId) {
      return res.status(400).json({
        message: "Invalid follower.",
      });
    }

    const [currentUser, follower] = await Promise.all([
      User.findById(currentUserId).select("_id followers"),

      User.findById(followerId).select("_id following"),
    ]);

    if (!currentUser || !follower) {
      return res.status(404).json({
        message: "Trainer not found.",
      });
    }

    await Promise.all([
      User.updateOne(
        {
          _id: currentUser._id,
        },

        {
          $pull: {
            followers: follower._id,
          },
        },
      ),

      User.updateOne(
        {
          _id: follower._id,
        },

        {
          $pull: {
            following: currentUser._id,
          },
        },
      ),
    ]);

    const refreshed = await User.findById(currentUserId).select(
      "followers following",
    );

    return res.json({
      message: "Follower removed.",

      followersCount: refreshed?.followers?.length || 0,

      followingCount: refreshed?.following?.length || 0,
    });
  } catch (error) {
    console.error("removeFollower error:", error);

    return res.status(500).json({
      message: "Unable to remove follower.",
    });
  }
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  getSocialProfile,

  followUser,
  unfollowUser,

  followTrainer: followUser,

  unfollowTrainer: unfollowUser,

  getFollowStatus,

  getFollowers,
  getFollowing,

  removeFollower,
};
