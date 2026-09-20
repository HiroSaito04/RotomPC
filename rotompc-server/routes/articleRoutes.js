// rotompc-server/routes/articleRoutes.js

const express = require("express");

const upload = require("../middlewares/uploadMiddleware");

const { verifyToken } = require("../middlewares/authMiddleware");

const {
  getArticles,
  getArticlesByUser,
  getArticleByName,
  getArticleImage,

  createArticle,
  updateArticle,
  deleteArticle,
} = require("../controllers/articleController");

const {
  likeArticle,
  unlikeArticle,
  getLikeStatus,
} = require("../controllers/articleInteractionController");

const {
  getArticleComments,
  createArticleComment,
  deleteArticleComment,
} = require("../controllers/articleCommentController");

const router = express.Router();

/* =========================================================
   PUBLIC READ ROUTES
========================================================= */

router.get("/", getArticles);

router.get("/user/:userId", getArticlesByUser);

router.get("/name/:name", getArticleByName);

router.get("/:id/image", getArticleImage);

/* =========================================================
   AUTHENTICATED INTERACTIONS
========================================================= */

router.post("/:id/like", verifyToken, likeArticle);

router.delete("/:id/like", verifyToken, unlikeArticle);

router.get("/:id/like-status", verifyToken, getLikeStatus);

router.get("/:id/comments", getArticleComments);

router.post("/:id/comments", verifyToken, createArticleComment);

router.delete("/:id/comments/:commentId", verifyToken, deleteArticleComment);

/* =========================================================
   AUTHENTICATED ARTICLE MUTATIONS
========================================================= */

router.post("/", verifyToken, upload.single("image"), createArticle);

router.put("/:id", verifyToken, upload.single("image"), updateArticle);

router.delete("/:id", verifyToken, deleteArticle);

module.exports = router;
