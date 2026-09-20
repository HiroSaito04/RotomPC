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

const configuredOrigins =
  process.env.CORS_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) || [];

const corsOptions = {
  origin(origin, callback) {
    /*
     * Allow server-to-server, curl, Postman,
     * health checks, etc.
     */
    if (!origin) {
      return callback(null, true);
    }

    /*
     * Development fallback when no explicit
     * CORS_ORIGINS has been supplied.
     */
    if (configuredOrigins.length === 0) {
      return callback(null, true);
    }

    if (configuredOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn("Blocked CORS origin:", origin);

    return callback(
      new Error("Origin is not allowed by CORS."),
    );
  },

  methods: [
    "GET",
    "HEAD",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
  ],

  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

/* =========================================================
   REQUEST PARSING
========================================================= */

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

/* =========================================================
   HEALTH CHECK

   This intentionally runs BEFORE MongoDB middleware so
   you can determine whether Vercel itself is running.
========================================================= */

app.get("/", (req, res) => {
  return res.status(200).json({
    status: "success",
    message: "RotomPC server is running.",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    status: "success",
    message: "RotomPC API is online.",
    timestamp: new Date().toISOString(),
  });
});

/* =========================================================
   DATABASE MIDDLEWARE

   IMPORTANT FOR VERCEL:
   Vercel imports the Express application instead of
   relying on your local app.listen() startup path.

   connectDB() should reuse an existing Mongoose connection
   once one exists.
========================================================= */

app.use(async (req, res, next) => {
  try {
    await connectDB();

    return next();
  } catch (error) {
    console.error("Database connection error:", error);

    return res.status(503).json({
      message: "Database connection is currently unavailable.",
    });
  }
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

  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      message: "Image exceeds the 5MB upload limit.",
    });
  }

  if (error.message?.includes("Only JPG")) {
    return res.status(400).json({
      message: error.message,
    });
  }

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
   LOCAL SERVER

   Vercel uses module.exports below.

   Running `node index.js` locally still uses app.listen().
========================================================= */

const PORT = process.env.PORT || 8000;

const startLocalServer = async () => {
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

if (require.main === module) {
  startLocalServer();
}

/* =========================================================
   VERCEL EXPORT
========================================================= */

module.exports = app;