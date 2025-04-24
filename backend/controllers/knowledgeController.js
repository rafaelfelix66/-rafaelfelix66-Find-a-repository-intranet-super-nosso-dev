// controllers/knowledgeController.js
const { Article } = require('../models');

const getArticles = async (req, res) => {
  try {
    const articles = await Article.find()
      .sort({ createdAt: -1 })
      .populate('author', ['nome']); // Ajustado
    res.json(articles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
};

const getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate('author', ['nome']);
    if (!article) {
      return res.status(404).json({ msg: 'Artigo não encontrado' });
    }
    res.json(article);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Artigo não encontrado' });
    }
    res.status(500).send('Erro no servidor');
  }
};

const createArticle = async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    const attachments = req.files ? req.files.map(file => ({
      type: file.path,
      contentType: file.mimetype,
      name: file.originalname
    })) : [];
    const newArticle = new Article({
      title,
      content,
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      author: req.usuario.id, // Ajustado
      attachments
    });
    const article = await newArticle.save();
    const populatedArticle = await Article.findById(article._id)
      .populate('author', ['nome']);
    res.json(populatedArticle);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
};

const updateArticle = async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ msg: 'Artigo não encontrado' });
    }
    if (article.author.toString() !== req.usuario.id) { // Ajustado, removido role
      return res.status(401).json({ msg: 'Usuário não autorizado' });
    }
    if (title) article.title = title;
    if (content) article.content = content;
    if (category) article.category = category;
    if (tags) article.tags = tags.split(',').map(tag => tag.trim());
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(file => ({
        type: file.path,
        contentType: file.mimetype,
        name: file.originalname
      }));
      article.attachments = [...article.attachments, ...newAttachments];
    }
    await article.save();
    const updatedArticle = await Article.findById(article._id)
      .populate('author', ['nome']);
    res.json(updatedArticle);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Artigo não encontrado' });
    }
    res.status(500).send('Erro no servidor');
  }
};

const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ msg: 'Artigo não encontrado' });
    }
    if (article.author.toString() !== req.usuario.id) { // Ajustado
      return res.status(401).json({ msg: 'Usuário não autorizado' });
    }
    await article.deleteOne(); // Ajustado de remove() para deleteOne()
    res.json({ msg: 'Artigo removido' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Artigo não encontrado' });
    }
    res.status(500).send('Erro no servidor');
  }
};

module.exports = { getArticles, getArticleById, createArticle, updateArticle, deleteArticle };