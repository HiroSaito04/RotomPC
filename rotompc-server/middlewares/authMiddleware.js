// rotompc-server/middlewares/authMiddleware.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");

/* =========================================================
   VERIFY JWT
========================================================= */

const verifyToken = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication required.",
    });
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      message: "Authentication required.",
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!payload?.id) {
      return res.status(401).json({
        message: "Invalid authentication token.",
      });
    }

    /*
     * Read the current account instead
     * of trusting the role stored in an
     * old JWT.
     */
    const user = await User.findById(payload.id).select(
      "_id email role isActive",
    );

    if (!user) {
      return res.status(401).json({
        message: "Account no longer exists.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account is inactive.",
      });
    }

    req.user = {
      id: String(user._id),
      email: user.email,
      role: user.role,
    };

    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Your session has expired. Please sign in again.",
      });
    }

    console.error("verifyToken error:", error.message);

    return res.status(401).json({
      message: "Invalid authentication token.",
    });
  }
};

/* =========================================================
   ROLE AUTHORIZATION
========================================================= */

const requireRole =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action.",
      });
    }

    return next();
  };

module.exports = {
  verifyToken,
  requireRole,
};
