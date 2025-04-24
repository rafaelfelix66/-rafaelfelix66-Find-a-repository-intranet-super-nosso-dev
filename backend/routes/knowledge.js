// routes/knowledge.js
const express = require('express');
const router = express.Router();
const knowledgeController = require('../controllers/knowledgeController');
const auth = require('../middleware/auth');
const { hasPermission, isOwnerOrHasPermission } = require('../middleware/permissions');
const { Article } = require('../models');
const multer = require('multer');
const path = require('path');

// Configuração do multer para uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/knowledge/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Filtro para tipos de arquivo
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

// @route   GET api/knowledge
// @desc    Obter todos os artigos
// @access  Private
router.get('/', auth, hasPermission('knowledge:view'), knowledgeController.getArticles);

// @route   GET api/knowledge/:id
// @desc    Obter artigo por ID
// @access  Private
router.get('/:id', auth, hasPermission('knowledge:view'), knowledgeController.getArticleById);

// @route   POST api/knowledge
// @desc    Criar artigo
// @access  Private
router.post('/', auth, hasPermission('knowledge:create'), upload.array('attachments', 5), knowledgeController.createArticle);

// @route   PUT api/knowledge/:id
// @desc    Atualizar artigo
// @access  Private
router.put('/:id', auth, isOwnerOrHasPermission(Article, 'id', 'knowledge:edit_any'), upload.array('attachments', 5), knowledgeController.updateArticle);

// @route   DELETE api/knowledge/:id
// @desc    Excluir artigo
// @access  Private
router.delete('/:id', auth, isOwnerOrHasPermission(Article, 'id', 'knowledge:delete_any'), knowledgeController.deleteArticle);

module.exports = router;