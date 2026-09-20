// rotompc-server/middlewares/uploadMiddleware.js

const multer = require("multer");
const path = require("path");

/* =========================================================
   STORAGE
========================================================= */

const storage = multer.memoryStorage();

/* =========================================================
   ALLOWED IMAGE TYPES
========================================================= */

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
]);

/* =========================================================
   FILTER
========================================================= */

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();

  const mimeType = String(file.mimetype || "").toLowerCase();

  const validExtension = ALLOWED_EXTENSIONS.has(extension);

  const validMimeType = ALLOWED_MIME_TYPES.has(mimeType);

  if (validExtension && validMimeType) {
    return cb(null, true);
  }

  return cb(
    new Error("Only JPG, JPEG, PNG, GIF, and WEBP images are supported."),
  );
};

/* =========================================================
   MULTER
========================================================= */

const upload = multer({
  storage,

  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = upload;
