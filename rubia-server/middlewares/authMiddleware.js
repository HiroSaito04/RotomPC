// rubia-server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // Grab the authorization header token
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Parses out "Bearer <TOKEN>"

  if (!token) {
    return res.status(401).json({ message: "Access Denied: No authentication token registered." });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Assigns payload data (id, email, role) to the request object
    next();
  } catch (error) {
    return res.status(403).json({ message: "Session expired or invalid key map matrix." });
  }
};

module.exports = { verifyToken };