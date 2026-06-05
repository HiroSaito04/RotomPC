const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { 
  getArticles, 
  createArticle, 
  updateArticle, 
  deleteArticle 
} = require('../controllers/articleController');

router.get('/', getArticles);
router.post('/', upload.single('image'), createArticle);
router.put('/:id', upload.single('image'), updateArticle);

router.delete('/:id', deleteArticle);

module.exports = router;