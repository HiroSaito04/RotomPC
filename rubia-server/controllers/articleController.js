const Article = require('../models/Articles');

// Get all articles
const getArticles = async (req, res) => {
  try {
    const articles = await Article.find();
    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create article
const createArticle = async (req, res) => {
  try {
    console.log("Incoming Text Body Fields:", req.body);
    console.log("Incoming File Buffer Metadata Available:", !!req.file);

    const articleData = { ...req.body };

    // Separate paragraph blocks if arriving as a raw text string context
    if (typeof articleData.content === 'string') {
      articleData.content = articleData.content.split('\n\n').filter(p => p.trim() !== '');
    }

    // Process binary vs link options
    if (req.file) {
      articleData.imageBuffer = req.file.buffer;
      articleData.imageMimeType = req.file.mimetype;
      articleData.imageFallbackUrl = '';
    } else if (!articleData.image || articleData.image.trim() === '') {
      articleData.imageFallbackUrl = 'https://ik.imagekit.io/ytwzizvepv/RotomPC/placeholder.png';
    } else {
      articleData.imageFallbackUrl = articleData.image.trim();
    }

    const article = new Article(articleData);
    const newArticle = await article.save();
    res.status(201).json(newArticle);
  } catch (err) {
    console.error("Mongoose Save Error:", err.message);
    if (err.code === 11000) {
      const duplicateField = Object.keys(err.keyValue)[0];
      return res.status(400).json({ 
        message: `Database Conflict: An entry with this ${duplicateField} already exists.` 
      });
    }
    res.status(400).json({ message: err.message });
  }
};

// Update article
const updateArticle = async (req, res) => {
  try {
    console.log("Incoming Update Text Body Fields:", req.body);
    console.log("Incoming Update File Buffer Metadata Available:", !!req.file);
    
    const articleData = { ...req.body };

    if (typeof articleData.content === 'string') {
      articleData.content = articleData.content.split('\n\n').filter(p => p.trim() !== '');
    }

    // Explicit validation mapping updates
    if (req.file) {
      articleData.imageBuffer = req.file.buffer;
      articleData.imageMimeType = req.file.mimetype;
      articleData.imageFallbackUrl = ''; // Reset the URL field if a new file asset takes its place
    } else {
      // If the incoming image text field is sent from the front and no new file was chosen, map to url fallback profile
      if (articleData.image && articleData.image.trim() !== '') {
        articleData.imageFallbackUrl = articleData.image.trim();
        
        // Use $unset mapping values to clear buffer fields from the MongoDB object document layout
        await Article.findByIdAndUpdate(req.params.id, { 
          $unset: { imageBuffer: 1, imageMimeType: 1 } 
        });
      }
    }

    const updatedArticle = await Article.findByIdAndUpdate(
      req.params.id, 
      articleData, 
      { new: true }
    );
    
    if (!updatedArticle) {
      return res.status(404).json({ message: 'Article not found' });
    }
    res.json(updatedArticle);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete article
const deleteArticle = async (req, res) => {
  try {
    const deletedArticle = await Article.findByIdAndDelete(req.params.id);
    if (!deletedArticle) {
      return res.status(404).json({ message: 'Article not found' });
    }
    res.json({ message: 'Article deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getArticles,
  createArticle, 
  updateArticle, 
  deleteArticle
};