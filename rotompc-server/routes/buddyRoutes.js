// rotompc-server/routes/buddyRoutes.js

const express = require("express");

const { verifyToken } = require("../middlewares/authMiddleware");

const {
  getBuddy,
  selectBuddy,
  pet,
  play,
  feed,
} = require("../controllers/buddyController");

const router = express.Router();

router.get("/", verifyToken, getBuddy);

router.patch("/pokemon", verifyToken, selectBuddy);

router.post("/pet", verifyToken, pet);

router.post("/play", verifyToken, play);

router.post("/feed", verifyToken, feed);

module.exports = router;
