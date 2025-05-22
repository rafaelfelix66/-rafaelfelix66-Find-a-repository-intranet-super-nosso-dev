// routes/timeline.js
const express = require('express');
const router = express.Router();
const timelineController = require('../controllers/timelineController');
const auth = require('../middleware/auth');
const { hasPermission, isOwnerOrHasPermission } = require('../middleware/permissions');
const { filterPostsByDepartment } = require('../middleware/departamento');
const { Post } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// NOVO: Importar o middleware de rastreamento de engajamento
const { trackView, trackInteraction } = require('../middleware/trackEngagement');

// Configuração do multer para uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Altera o destino para o novo diretório padronizado
    const uploadDir = path.join(__dirname, '../uploads/timeline');
    // Garante que o diretório existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
    const fullPath = path.join(path.join(__dirname, '../uploads/timeline'), uniqueFilename);
    console.log(`Tentando salvar arquivo em: ${fullPath}`);
    cb(null, uniqueFilename);
  }
});

// Filtro para tipos de arquivo
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|mp4|webm|pdf|doc|docx|avi|mov|wmv/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  }
  
  cb(new Error('Tipo de arquivo não suportado'), false);
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

console.log('Registrando rotas da timeline...');

// @route   GET api/timeline
// @desc    Obter todas as publicações
// @access  Private
router.get('/', auth, filterPostsByDepartment, timelineController.getPosts);

// @route   GET api/timeline/:id
// @desc    Obter uma publicação específica
// @access  Private
// NOVO: Adicionar middleware de rastreamento de visualização para publicações específicas
router.get('/:id', auth, trackView('Post'), timelineController.getPostById);

// @route   POST api/timeline
// @desc    Criar uma publicação
// @access  Private
// NOVO: Adicionar middleware de rastreamento de criação de post
router.post('/', 
  auth, 
  hasPermission('timeline:create'), 
  upload.array('attachments', 5), 
  trackInteraction('post_create', 'Post'),
  (req, res) => {
    console.log('Requisição POST /api/timeline recebida:', { 
      body: req.body, 
      files: req.files?.map(f => ({ name: f.originalname, path: f.path, type: f.mimetype })) || [] 
    });
    timelineController.createPost(req, res);
  }
);

// @route   POST api/timeline/comment/:id
// @desc    Adicionar comentário a uma publicação
// @access  Private
// NOVO: Adicionar middleware de rastreamento de comentário
router.post('/:id/comment', 
  auth, 
  hasPermission('timeline:comment'), 
  trackInteraction('post_comment', 'Post'),
  timelineController.addComment
);

// @route   PUT api/timeline/like/:id
// @desc    Curtir uma publicação
// @access  Private
// NOVO: Adicionar middleware de rastreamento de curtida
router.put('/:id/like', 
  auth, 
  trackInteraction('post_like', 'Post'),
  timelineController.likePost
);

// @route   PUT api/timeline/:postId/comment/:commentId/like
// @desc    Curtir um comentário específico
// @access  Private
router.put('/:postId/comment/:commentId/like', 
  auth, 
  hasPermission('timeline:like_comment'),
  trackInteraction('comment_like', 'Post'),
  timelineController.likeComment
);

// @route   PUT api/timeline/:postId/comment/:commentId/like
// @desc    Curtir um comentário específico
// @access  Private
router.put('/:postId/comment/:commentId/like', 
  auth, 
  hasPermission('timeline:like_comment'),
  trackInteraction('comment_like', 'Post'),
  timelineController.likeComment
);

// @route   PUT api/timeline/:id/reaction
// @desc    Adicionar/remover reação a uma publicação
// @access  Private
router.put('/:id/reaction', 
  auth, 
  hasPermission('timeline:react'),
  trackInteraction('post_react', 'Post'),
  timelineController.addReaction
);

// @route   DELETE api/timeline/:postId/comment/:commentId
// @desc    Excluir um comentário (apenas admins)
// @access  Private (Admin only)
router.delete('/:postId/comment/:commentId', 
  auth, 
  hasPermission('timeline:delete_any_comment'),
  timelineController.deleteComment
);

console.log('Rotas da timeline registradas com sucesso');

// @route   DELETE api/timeline/:id
// @desc    Excluir uma publicação
// @access  Private
router.delete('/:id', 
  auth, 
  isOwnerOrHasPermission(Post, 'id', 'timeline:delete_any'), 
  timelineController.deletePost
);

console.log('Rota de exclusão de post registrada com sucesso');

// @route   GET api/timeline/check-image/:filename
// @desc    Verificar se uma imagem específica existe e pode ser acessada
// @access  Public
router.get('/check-image/:filename', (req, res) => {
  const filename = req.params.filename;
  const timelinePath = path.join(__dirname, '../uploads/timeline');
  const filePath = path.join(timelinePath, filename);
  
  console.log(`Verificando arquivo: ${filename}`);
  console.log(`Caminho completo: ${filePath}`);
  
  // Verificar se o arquivo existe
  fs.access(filePath, fs.constants.R_OK, (err) => {
    if (err) {
      console.error(`Arquivo não encontrado: ${filePath}`);
      return res.status(404).json({ 
        error: 'Arquivo não encontrado',
        exists: false,
        filename,
        path: filePath
      });
    }
    
    // Verificar detalhes do arquivo
    fs.stat(filePath, (err, stats) => {
      if (err) {
        return res.status(500).json({ 
          error: 'Erro ao obter informações do arquivo',
          message: err.message
        });
      }
      
      console.log(`Arquivo encontrado: ${filePath}`);
      console.log(`Tamanho: ${stats.size} bytes`);
      
      res.json({
        exists: true,
        filename,
        path: filePath,
        size: stats.size,
        isFile: stats.isFile(),
        created: stats.birthtime,
        modified: stats.mtime,
        url: `/uploads/timeline/${filename}`
      });
    });
  });
});

module.exports = router;