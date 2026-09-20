// rotompc-server/routes/userRoutes.js

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
  followUser,

  unfollowUser,

  getFollowers,

  getFollowing,
} = require("../controllers/socialController");

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
   MIDDLEWARE
========================================================= */

const {
  verifyToken,

  requireRole,
} = require("../middlewares/authMiddleware");

const router = express.Router();

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
   PUBLIC PROFILE
========================================================= */

router.get(
  "/profile/:username",

  getPublicProfile,
);

/* =========================================================
   POKÉSOCIAL
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

router.get(
  "/:id/followers",

  verifyToken,

  getFollowers,
);

router.get(
  "/:id/following",

  verifyToken,

  getFollowing,
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
