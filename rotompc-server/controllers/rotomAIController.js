// rotompc-server/controllers/rotomAIController.js

const {
  askRotomAI,
  MAIN_MODEL,
  LIVE_MODEL,
} = require("../services/rotomAIService");

/* =========================================================
   CHAT
========================================================= */

const chatWithRotomAI = async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();

    const history = Array.isArray(req.body?.history) ? req.body.history : [];

    if (!message) {
      return res.status(400).json({
        message: "Message is required.",
      });
    }

    if (message.length > 4000) {
      return res.status(400).json({
        message: "Message cannot exceed 4,000 characters.",
      });
    }

    const result = await askRotomAI({
      message,
      history,
    });

    return res.json({
      answer: result.answer,

      model: result.model,

      grounded: Boolean(result.grounded),

      sources: result.sources || [],

      pokemonData: result.pokemonData || [],

      warning: result.warning || null,
    });
  } catch (error) {
    console.error("RotomAI chat error:", error);

    const status = Number(error.status) || 500;

    return res.status(status >= 400 && status < 600 ? status : 500).json({
      message:
        status === 429
          ? "RotomAI is recharging. The free AI quota is temporarily busy; try again shortly."
          : error.message || "RotomAI is unavailable.",
    });
  }
};

/* =========================================================
   STATUS
========================================================= */

const getRotomAIStatus = async (req, res) => {
  return res.json({
    online: Boolean(process.env.GEMINI_API_KEY),

    primaryModel: MAIN_MODEL,

    liveModel: LIVE_MODEL,

    pokemonData: "PokéAPI",

    liveSearch: true,
  });
};

module.exports = {
  chatWithRotomAI,
  getRotomAIStatus,
};
