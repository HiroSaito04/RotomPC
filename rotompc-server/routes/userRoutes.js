// filepath: rotompc-server/routes/userRoutes.js

const express = require("express");

/* =========================================================
   AUTH
========================================================= */

const {
  loginUser,
  googleAuth,
  facebookAuth,
} = require("../controllers/authController");

/* =========================================================
   PROFILE
========================================================= */

const {
  getMyProfile,
  updateTrainerProfile,
  completeProfile,
  getPublicProfile,
} = require("../controllers/profileController");

/* =========================================================
   SOCIAL
========================================================= */

const {
  getSocialProfile,

  followUser,
  unfollowUser,

  getFollowStatus,

  getFollowers,
  getFollowing,

  removeFollower,
} = require("../controllers/socialController");

/* =========================================================
   TRAINER AVATARS
========================================================= */

const {
  getTrainerAvatarCatalog,

  getMyTrainerAvatar,

  getTrainerAvatar,

  updateMyTrainerAvatar,

  clearMyTrainerAvatar,
} = require("../controllers/trainerAvatarController");

/* =========================================================
   USERS
========================================================= */

const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

/* =========================================================
   ANALYTICS
========================================================= */

const {
  recordWebsiteVisit,
  getAnalyticsSummary,
} = require("../controllers/analyticsController");

/* =========================================================
   MIDDLEWARE
========================================================= */

const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

const router = express.Router();

/* =========================================================
   ANALYTICS ROLE GUARD
========================================================= */

const requireAnalyticsRole = (req, res, next) => {
  const role = String(req.user?.role || "")
    .trim()
    .toLowerCase();

  if (!["admin", "editor"].includes(role)) {
    return res.status(403).json({
      message: "Admin or editor access required.",
    });
  }

  return next();
};

/* =========================================================
   AUTH
========================================================= */

router.post(
  "/login",

  loginUser,
);

router.post(
  "/auth/google",

  googleAuth,
);

router.post(
  "/auth/facebook",

  facebookAuth,
);

/* =========================================================
   ANALYTICS
========================================================= */

router.post(
  "/analytics/visit",

  recordWebsiteVisit,
);

router.get(
  "/analytics/summary",

  verifyToken,

  requireAnalyticsRole,

  getAnalyticsSummary,
);

/* =========================================================
   TRAINER AVATAR CATALOG

   This route must be authenticated now because the
   available characters depend on the user's role.
========================================================= */

router.get(
  "/trainer-avatars",

  verifyToken,

  getTrainerAvatarCatalog,
);

/* =========================================================
   CURRENT TRAINER
========================================================= */

router.get(
  "/me",

  verifyToken,

  getMyProfile,
);

router.patch(
  "/me/profile",

  verifyToken,

  updateTrainerProfile,
);

router.patch(
  "/me/complete-profile",

  verifyToken,

  completeProfile,
);

/* =========================================================
   CURRENT TRAINER AVATAR
========================================================= */

router.get(
  "/me/trainer-avatar",

  verifyToken,

  getMyTrainerAvatar,
);

router.put(
  "/me/trainer-avatar",

  verifyToken,

  updateMyTrainerAvatar,
);

router.delete(
  "/me/trainer-avatar",

  verifyToken,

  clearMyTrainerAvatar,
);

/* =========================================================
   PUBLIC PROFILE BY USERNAME
========================================================= */

router.get(
  "/profile/:username",

  getPublicProfile,
);

/* =========================================================
   PUBLIC TRAINER AVATAR
========================================================= */

router.get(
  "/:id/trainer-avatar",

  getTrainerAvatar,
);

/* =========================================================
   SOCIAL PROFILE
========================================================= */

router.get(
  "/:id/social-profile",

  getSocialProfile,
);

/* =========================================================
   FOLLOW STATUS
========================================================= */

router.get(
  "/:id/follow-status",

  verifyToken,

  getFollowStatus,
);

/* =========================================================
   FOLLOW / UNFOLLOW
========================================================= */

router.post(
  "/:id/follow",

  verifyToken,

  followUser,
);

router.delete(
  "/:id/follow",

  verifyToken,

  unfollowUser,
);

/* =========================================================
   FOLLOWERS / FOLLOWING
========================================================= */

router.get(
  "/:id/followers",

  getFollowers,
);

router.get(
  "/:id/following",

  getFollowing,
);

/* =========================================================
   REMOVE FOLLOWER
========================================================= */

router.delete(
  "/:id/follower",

  verifyToken,

  removeFollower,
);

/* =========================================================
   ADMIN / USER MANAGEMENT
========================================================= */

router
  .route("/")
  .get(
    verifyToken,

    requireRole("admin"),

    getUsers,
  )
  .post(createUser);

router
  .route("/:id")
  .put(
    verifyToken,

    updateUser,
  )
  .delete(
    verifyToken,

    requireRole("admin"),

    deleteUser,
  );

module.exports = router;
