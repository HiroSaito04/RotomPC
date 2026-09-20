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
  "bio",
  "profileVisibility",
  "isActive",
  "createdAt",
].join(" ");

/* =========================================================
   HELPERS
========================================================= */

const isValidId = (id) => mongoose.isValidObjectId(id);

const serializeTrainer = (trainer) => {
  if (!trainer) {
    return null;
  }

  return {
    id: trainer._id,

    _id: trainer._id,

    username: trainer.username || "",

    trainerCode: trainer.trainerCode || "",

    firstName: trainer.firstName || "",

    lastName: trainer.lastName || "",

    gender: trainer.gender || "",

    region: trainer.region || "",

    favoriteType: trainer.favoriteType || "",

    bio: trainer.bio || "",

    profileVisibility: trainer.profileVisibility || "public",

    createdAt: trainer.createdAt || null,
  };
};

const getTrainer = async (id) =>
  User.findById(id).select(
    [PUBLIC_TRAINER_FIELDS, "followers", "following"].join(" "),
  );

/* =========================================================
   FOLLOW USER
========================================================= */

const followUser = async (req, res) => {
  try {
    const currentUserId = String(req.user.id);

    const targetUserId = String(req.params.userId || req.params.id || "");

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

    const alreadyFollowing = currentUser.following?.some(
      (id) => String(id) === targetUserId,
    );

    if (alreadyFollowing) {
      return res.json({
        following: true,

        berryReward: 0,

        followersCount: targetUser.followers?.length || 0,

        followingCount: currentUser.following?.length || 0,

        message: "Already following trainer.",
      });
    }

    /*
     * Query includes $ne so only one
     * concurrent request can actually
     * establish this new relationship.
     */
    const updatedCurrentUser = await User.findOneAndUpdate(
      {
        _id: currentUserId,

        following: {
          $ne: targetUser._id,
        },
      },

      {
        $addToSet: {
          following: targetUser._id,
        },
      },

      {
        new: true,
      },
    ).select("following isActive");

    /*
     * If this became null another
     * request beat us to the follow.
     */
    if (!updatedCurrentUser) {
      const refreshed = await getTrainer(targetUserId);

      return res.json({
        following: true,

        berryReward: 0,

        followersCount: refreshed?.followers?.length || 0,

        message: "Already following trainer.",
      });
    }

    const updatedTarget = await User.findByIdAndUpdate(
      targetUserId,

      {
        $addToSet: {
          followers: currentUser._id,
        },
      },

      {
        new: true,
      },
    ).select("followers");

    /* -----------------------------------------------------
         +5 BERRY REWARD
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
      /*
       * Following succeeded.
       * Do not roll it back just
       * because the reward service
       * encountered an unexpected
       * failure.
       */
      console.error("Follow berry reward error:", rewardError);
    }

    return res.json({
      following: true,

      berryReward: reward.amount || 0,

      berries: reward.berries ?? null,

      followersCount: updatedTarget?.followers?.length || 0,

      followingCount: updatedCurrentUser?.following?.length || 0,

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
    const currentUserId = String(req.user.id);

    const targetUserId = String(req.params.userId || req.params.id || "");

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

      User.findById(targetUserId).select("_id followers isActive"),
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({
        message: "Trainer not found.",
      });
    }

    const currentlyFollowing = currentUser.following?.some(
      (id) => String(id) === targetUserId,
    );

    if (!currentlyFollowing) {
      return res.json({
        following: false,

        berryReward: 0,

        followersCount: targetUser.followers?.length || 0,

        followingCount: currentUser.following?.length || 0,

        message: "Trainer is not currently followed.",
      });
    }

    const [updatedCurrentUser, updatedTarget] = await Promise.all([
      User.findByIdAndUpdate(
        currentUserId,

        {
          $pull: {
            following: targetUser._id,
          },
        },

        {
          new: true,
        },
      ).select("following"),

      User.findByIdAndUpdate(
        targetUserId,

        {
          $pull: {
            followers: currentUser._id,
          },
        },

        {
          new: true,
        },
      ).select("followers"),
    ]);

    /*
     * IMPORTANT:
     *
     * BuddyReward is deliberately
     * left untouched. If the trainer
     * follows this same user again,
     * awardBerriesOnce() sees the
     * old reward ledger row and
     * returns zero.
     */
    return res.json({
      following: false,

      berryReward: 0,

      followersCount: updatedTarget?.followers?.length || 0,

      followingCount: updatedCurrentUser?.following?.length || 0,

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
    const currentUserId = String(req.user.id);

    const targetUserId = String(req.params.userId || req.params.id || "");

    if (!isValidId(currentUserId) || !isValidId(targetUserId)) {
      return res.status(400).json({
        message: "Invalid trainer ID.",
      });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId).select("following"),

      User.findById(targetUserId).select("followers isActive"),
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({
        message: "Trainer not found.",
      });
    }

    const following =
      currentUser.following?.some((id) => String(id) === targetUserId) || false;

    return res.json({
      following,

      followersCount: targetUser.followers?.length || 0,
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
    const userId = String(
      req.params.userId || req.params.id || req.user?.id || "",
    );

    if (!isValidId(userId)) {
      return res.status(400).json({
        message: "Invalid trainer ID.",
      });
    }

    const user = await User.findById(userId)
      .select("followers profileVisibility isActive")
      .populate({
        path: "followers",

        select: PUBLIC_TRAINER_FIELDS,

        match: {
          isActive: true,
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

    /*
     * Owner can always inspect their
     * own list. Public profiles are
     * visible to everyone.
     */
    const isOwner = req.user?.id && String(req.user.id) === String(userId);

    if (user.profileVisibility === "private" && !isOwner) {
      return res.status(403).json({
        message: "This trainer profile is private.",
      });
    }

    const followers = (user.followers || [])
      .filter(Boolean)
      .map(serializeTrainer);

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
    const userId = String(
      req.params.userId || req.params.id || req.user?.id || "",
    );

    if (!isValidId(userId)) {
      return res.status(400).json({
        message: "Invalid trainer ID.",
      });
    }

    const user = await User.findById(userId)
      .select("following profileVisibility isActive")
      .populate({
        path: "following",

        select: PUBLIC_TRAINER_FIELDS,

        match: {
          isActive: true,
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

    const isOwner = req.user?.id && String(req.user.id) === String(userId);

    if (user.profileVisibility === "private" && !isOwner) {
      return res.status(403).json({
        message: "This trainer profile is private.",
      });
    }

    const following = (user.following || [])
      .filter(Boolean)
      .map(serializeTrainer);

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
    const currentUserId = String(req.user.id);

    const followerId = String(req.params.userId || req.params.id || "");

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

    return res.json({
      message: "Follower removed.",
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
  followUser,
  unfollowUser,

  /*
   * Aliases so your existing routes
   * can use trainer naming if they
   * already do.
   */
  followTrainer: followUser,

  unfollowTrainer: unfollowUser,

  getFollowStatus,

  getFollowers,
  getFollowing,

  removeFollower,
};
