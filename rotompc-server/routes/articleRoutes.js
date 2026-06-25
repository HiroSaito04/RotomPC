const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');

const {
  getArticles,
  getArticlesByUser,
  getArticleByName,
  getArticleImage,
  createArticle,
  updateArticle,
  deleteArticle
} = require('../controllers/articleController');

router.get('/', getArticles);
router.get('/user/:userId', getArticlesByUser);
router.get('/name/:name', getArticleByName);
router.get('/:id/image', getArticleImage);

router.post('/', upload.single('image'), createArticle);
router.put('/:id', upload.single('image'), updateArticle);
router.delete('/:id', deleteArticle);

module.exports = router;