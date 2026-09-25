// rotompc-server/controllers/rotomAIController.js

const RotomAIConversation = require("../models/RotomAIConversation");

const {
  askRotomAI,
  MAIN_MODEL,
  LIVE_MODEL,
} = require("../services/rotomAIService");

/* =========================================================
   CONFIG
========================================================= */

const MAX_STORED_MESSAGES = 100;

const MAX_MODEL_HISTORY = 20;

/* =========================================================
   HELPERS
========================================================= */

const getUserId = (req) => req.user?.id || req.user?._id || null;

/* =========================================================
   SERIALIZE MESSAGE
========================================================= */

const serializeMessage = (message) => ({
  id: String(message._id),

  role: message.role,

  content: message.content,

  model: message.model || "",

  grounded: Boolean(message.grounded),

  warning: message.warning || "",

  sources: Array.isArray(message.sources) ? message.sources : [],

  createdAt: message.createdAt,
});

/* =========================================================
   STATUS
========================================================= */

const getRotomAIStatus = async (req, res) => {
  return res.status(200).json({
    status: "online",

    configured: Boolean(process.env.GEMINI_API_KEY),

    mainModel: MAIN_MODEL,

    liveModel: LIVE_MODEL,
  });
};

/* =========================================================
   GET HISTORY
========================================================= */

const getRotomAIHistory = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const conversation = await RotomAIConversation.findOne({
      user: userId,
    }).lean();

    const messages = conversation?.messages || [];

    return res.json({
      messages: messages.map(serializeMessage),

      updatedAt: conversation?.updatedAt || null,
    });
  } catch (error) {
    console.error("getRotomAIHistory error:", error);

    return res.status(500).json({
      message: "Unable to load RotomAI history.",
    });
  }
};

/* =========================================================
   CHAT
========================================================= */

const chatWithRotomAI = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const message = String(req.body?.message || "")
      .trim()
      .slice(0, 4000);

    if (!message) {
      return res.status(400).json({
        message: "Message cannot be empty.",
      });
    }

    /* =====================================================
       LOAD SERVER-SIDE HISTORY
    ===================================================== */

    const conversation = await RotomAIConversation.findOne({
      user: userId,
    })
      .select("messages")
      .lean();

    const storedMessages = conversation?.messages || [];

    /*
     * Gemini service currently accepts:
     *
     * {
     *   role: "user" | "assistant",
     *   content: "..."
     * }
     *
     * Only send recent messages to control context size.
     */

    const modelHistory = storedMessages
      .slice(-MAX_MODEL_HISTORY)
      .map((entry) => ({
        role: entry.role,

        content: entry.content,
      }));

    /* =====================================================
       GENERATE
    ===================================================== */

    const result = await askRotomAI({
      message,

      history: modelHistory,
    });

    /* =====================================================
       SAVE USER + ASSISTANT MESSAGE
    ===================================================== */

    const now = new Date();

    const userMessage = {
      role: "user",

      content: message,

      model: "",

      grounded: false,

      warning: "",

      sources: [],

      createdAt: now,
    };

    const assistantMessage = {
      role: "assistant",

      content: result.answer,

      model: result.model || "",

      grounded: Boolean(result.grounded),

      warning: result.warning || "",

      sources: Array.isArray(result.sources)
        ? result.sources.slice(0, 8).map((source) => ({
            title: String(source.title || "").slice(0, 300),

            url: String(source.url || "").slice(0, 2000),
          }))
        : [],

      createdAt: new Date(),
    };

    const updatedConversation = await RotomAIConversation.findOneAndUpdate(
      {
        user: userId,
      },

      {
        $set: {
          lastMessageAt: new Date(),
        },

        $push: {
          messages: {
            $each: [userMessage, assistantMessage],

            /*
             * MongoDB keeps only
             * the newest 100 messages.
             */
            $slice: -MAX_STORED_MESSAGES,
          },
        },
      },

      {
        new: true,

        upsert: true,

        setDefaultsOnInsert: true,
      },
    );

    const savedMessages = updatedConversation.messages;

    const savedUserMessage = savedMessages[savedMessages.length - 2];

    const savedAssistantMessage = savedMessages[savedMessages.length - 1];

    /* =====================================================
       RESPONSE
    ===================================================== */

    return res.json({
      answer: result.answer,

      model: result.model,

      sources: result.sources || [],

      grounded: Boolean(result.grounded),

      warning: result.warning || null,

      pokemonData: result.pokemonData || [],

      userMessage: serializeMessage(savedUserMessage),

      assistantMessage: serializeMessage(savedAssistantMessage),
    });
  } catch (error) {
    console.error("chatWithRotomAI error:", error);

    return res.status(error.status || 500).json({
      message: error.message || "RotomAI is unavailable.",
    });
  }
};

/* =========================================================
   CLEAR HISTORY
========================================================= */

const clearRotomAIHistory = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    await RotomAIConversation.deleteOne({
      user: userId,
    });

    return res.json({
      message: "RotomAI history cleared successfully.",
    });
  } catch (error) {
    console.error("clearRotomAIHistory error:", error);

    return res.status(500).json({
      message: "Unable to clear RotomAI history.",
    });
  }
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  getRotomAIStatus,

  getRotomAIHistory,

  chatWithRotomAI,

  clearRotomAIHistory,
};
