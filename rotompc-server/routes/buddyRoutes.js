// filepath: rotompc-server/routes/buddyRoutes.js

const express = require("express");

const { verifyToken } = require("../middlewares/authMiddleware");

const {
  getBuddy,
  selectBuddy,
  pet,
  play,
  feed,
} = require("../controllers/buddyController");

const { getPublicBuddy } = require("../controllers/publicBuddyController");

const router = express.Router();

/* =========================================================
   PUBLIC TRAINER BUDDY

   Read-only.

   The public Trainer Profile modal uses this
   only to display the Trainer's Buddy Pokémon.
========================================================= */

router.get("/trainer/:userId", getPublicBuddy);

/* =========================================================
   AUTHENTICATED BUDDY STATE
========================================================= */

router.get("/", verifyToken, getBuddy);

/* =========================================================
   BUDDY POKÉMON
========================================================= */

router.patch("/pokemon", verifyToken, selectBuddy);

/* =========================================================
   REAL INTERACTIONS

   These modify actual Buddy state and are
   intentionally authenticated.
========================================================= */

router.post("/pet", verifyToken, pet);

router.post("/play", verifyToken, play);

router.post("/feed", verifyToken, feed);

module.exports = router;
