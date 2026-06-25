const Article = require('../models/Articles');
const crypto = require('crypto');

const createBaseSlug = (text) => {
  return String(text || 'article')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'article';
};

const createUniqueSlug = async (title) => {
  const baseSlug = createBaseSlug(title);
  let slug = baseSlug;
  let counter = 1;

  while (await Article.exists({ name: slug })) {
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
};

const createArticle = async (req, res) => {
  try {
    let { title, desc, content, userId, author, status, color } = req.body;

    if (author && typeof author === 'string' && author.trim().startsWith('{')) {
      const parsedAuthor = JSON.parse(author);
      author = parsedAuthor.username || parsedAuthor.firstName || parsedAuthor.name || 'unknown-trainer';
    }

    const articleData = {
      id: `ART-${crypto.randomUUID()}`,
      name: await createUniqueSlug(title),
      title,
      desc,
      content: typeof content === 'string' ? [content] : content,
      userId,
      author,
      status: status || 'active',
      color: color || 'bg-zinc-500'
    };

    if (req.file) {
      articleData.imageBuffer = req.file.buffer;
      articleData.imageMimeType = req.file.mimetype;
      articleData.imageUrl = '';
    } else if (!req.body.image || req.body.image.trim() === '') {
      articleData.imageUrl = 'https://ik.imagekit.io/ytwzizvepv/RotomPC/placeholder.png';
    } else {
      articleData.imageUrl = req.body.image.trim();
    }

    const article = new Article(articleData);
    const newArticle = await article.save();

    res.status(201).json(newArticle);
  } catch (err) {
    console.error('Mongoose Save Error:', err.message);
    res.status(400).json({ message: err.message });
  }
};

const getArticles = async (req, res) => {
  try {
    const articles = await Article.find({ status: 'active' })
      .select('id name title desc author status color date imageUrl imageMimeType createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const getArticleByName = async (req, res) => {
  try {
    const { name } = req.params;

    const article = await Article.findOne({ name })
      .select(
        'id name title desc content author userId status color date imageUrl imageMimeType imageBuffer createdAt updatedAt'
      )
      .lean();

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    res.json(article);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 

const getArticleImage = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
      .select('imageBuffer imageMimeType imageUrl')
      .lean();

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    if (article.imageBuffer && article.imageMimeType) {
      let imageData = article.imageBuffer;

      if (imageData?.buffer) {
        imageData = imageData.buffer;
      }

      if (imageData?.data) {
        imageData = Buffer.from(imageData.data);
      }

      res.set('Content-Type', article.imageMimeType);
      res.set('Cache-Control', 'public, max-age=86400');

      return res.end(imageData);
    }

    if (article.imageUrl) {
      return res.redirect(article.imageUrl);
    }

    return res.redirect('https://ik.imagekit.io/ytwzizvepv/RotomPC/placeholder.png');
  } catch (err) {
    console.error('Article image fetch error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

const getArticlesByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const limit = Math.min(Number(req.query.limit) || 4, 20);

    const articles = await Article.find({
      userId,
      status: 'active'
    })
      .select('id name title desc author status color date imageUrl imageMimeType createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateArticle = async (req, res) => {
  try {
    const articleData = { ...req.body };

    if (typeof articleData.content === 'string') {
      articleData.content = [articleData.content];
    }

    if (articleData.title && articleData.name) {
      const existingArticle = await Article.findOne({
        name: articleData.name,
        _id: { $ne: req.params.id }
      });

      if (existingArticle) {
        articleData.name = await createUniqueSlug(articleData.title);
      }
    }

    if (req.file) {
      articleData.imageBuffer = req.file.buffer;
      articleData.imageMimeType = req.file.mimetype;
      articleData.imageUrl = '';
    } else if (articleData.image && articleData.image.trim() !== '') {
      articleData.imageUrl = articleData.image.trim();

      await Article.findByIdAndUpdate(req.params.id, {
        $unset: { imageBuffer: 1, imageMimeType: 1 }
      });
    }

    delete articleData.image;

    const updatedArticle = await Article.findByIdAndUpdate(
      req.params.id,
      articleData,
      { new: true, runValidators: true }
    );

    if (!updatedArticle) {
      return res.status(404).json({ message: 'Article not found' });
    }

    res.json(updatedArticle);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

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
  getArticlesByUser,
  getArticleByName,
  getArticleImage,
  createArticle,
  updateArticle,
  deleteArticle
};