// filepath: rotompc-server/routes/trainerAvatarRoutes.js

const express = require("express");

const { verifyToken } = require("../middlewares/authMiddleware");

const {
  getTrainerAvatarCatalog,
} = require("../controllers/trainerAvatarController");

const router = express.Router();

/* =========================================================
   TRAINER AVATAR CATALOG

   Authenticated because the returned catalog is
   role-sensitive.

   trainer:
   generic Trainer/NPC avatars

   admin/professor/editor/champion:
   generic avatars + named characters
========================================================= */

router.get(
  "/",

  verifyToken,

  getTrainerAvatarCatalog,
);

module.exports = router;
