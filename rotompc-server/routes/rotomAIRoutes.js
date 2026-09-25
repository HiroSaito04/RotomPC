// rotompc-server/routes/rotomAIRoutes.js

const express = require("express");

const {
  getRotomAIStatus,

  getRotomAIHistory,

  chatWithRotomAI,

  clearRotomAIHistory,
} = require("../controllers/rotomAIController");

const { verifyToken } = require("../middlewares/authMiddleware");

const router = express.Router();

/* =========================================================
   STATUS
========================================================= */

router.get(
  "/status",

  getRotomAIStatus,
);

/* =========================================================
   AUTHENTICATED ROTOMAI
========================================================= */

router.get(
  "/history",

  verifyToken,

  getRotomAIHistory,
);

router.post(
  "/chat",

  verifyToken,

  chatWithRotomAI,
);

router.delete(
  "/history",

  verifyToken,

  clearRotomAIHistory,
);

module.exports = router;
