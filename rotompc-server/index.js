// rotompc-server/index.js

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const userRoutes = require("./routes/userRoutes");

const articleRoutes = require("./routes/articleRoutes");

const buddyRoutes = require("./routes/buddyRoutes");

const rotomAIRoutes = require("./routes/rotomAIRoutes");

const app = express();

/* =========================================================
   CORS
========================================================= */

/*
 * JWT authentication uses the Authorization header,
 * not browser cookies, so credentials: true is not needed.
 *
 * CORS_ORIGINS can optionally contain:
 *
 * http://localhost:5173,https://rotompc.vercel.app
 */
const configuredOrigins =
  process.env.CORS_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) || [];

const corsOptions = {
  origin:
    configuredOrigins.length > 0
      ? (origin, callback) => {
          /*
           * Requests such as Postman/server-to-server
           * may not contain an Origin header.
           */
          if (!origin) {
            return callback(null, true);
          }

          if (configuredOrigins.includes(origin)) {
            return callback(null, true);
          }

          return callback(new Error("Origin is not allowed by CORS."));
        }
      : "*",

  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],

  optionsSuccessStatus: 204,
};

/*
 * app.use(cors()) already handles normal
 * requests and preflight OPTIONS requests.
 */
app.use(cors(corsOptions));

/* =========================================================
   REQUEST PARSING
========================================================= */

/*
 * Express already includes body parsing.
 * body-parser is unnecessary here.
 */
app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  }),
);

/*
 * Multer independently handles multipart/form-data
 * for article image uploads.
 */

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/", (req, res) => {
  return res.status(200).json({
    status: "success",

    message: "RotomPC server is running.",

    environment: process.env.NODE_ENV || "development",

    timestamp: new Date().toISOString(),
  });
});

/* =========================================================
   API ROUTES
========================================================= */

app.use("/api/users", userRoutes);

app.use("/api/articles", articleRoutes);

app.use("/api/buddy", buddyRoutes);

app.use("/api/rotom-ai", rotomAIRoutes);

/* =========================================================
   404
========================================================= */

app.use((req, res) => {
  return res.status(404).json({
    message: "API route not found.",
  });
});

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use((error, req, res, next) => {
  console.error("Unhandled server error:", error);

  /*
   * Multer file-size error.
   */
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      message: "Image exceeds the 5MB upload limit.",
    });
  }

  /*
   * Your uploadMiddleware throws
   * this for unsupported images.
   */
  if (error.message?.includes("Only JPG")) {
    return res.status(400).json({
      message: error.message,
    });
  }

  /*
   * CORS rejection.
   */
  if (error.message === "Origin is not allowed by CORS.") {
    return res.status(403).json({
      message: "Origin is not allowed.",
    });
  }

  return res.status(500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error."
        : error.message || "Internal server error.",
  });
});

/* =========================================================
   START SERVER
========================================================= */

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`RotomPC server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);

    process.exit(1);
  }
};

/*
 * Starts normally when running:
 *
 * node index.js
 * npm run dev
 *
 * But allows the Express app to be imported
 * by tests/serverless handlers without
 * automatically opening a port.
 */
if (require.main === module) {
  startServer();
}

module.exports = app;
