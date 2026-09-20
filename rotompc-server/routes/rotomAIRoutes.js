// rotompc-server/routes/rotomAIRoutes.js

const express = require("express");

const {
  chatWithRotomAI,
  getRotomAIStatus,
} = require("../controllers/rotomAIController");

const rotomAIRateLimit = require("../middlewares/rotomAIRateLimit");

const router = express.Router();

/* =========================================================
   STATUS
========================================================= */

router.get("/status", getRotomAIStatus);

/* =========================================================
   CHAT
========================================================= */

router.post("/chat", rotomAIRateLimit, chatWithRotomAI);

module.exports = router;
