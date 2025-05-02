
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
router.get('/', auth, timelineController.getPosts);
// @route   GET api/timeline
// @desc    Obter todas as publicações (filtrado por departamento)
// @access  Private
router.get('/', auth, filterPostsByDepartment, timelineController.getPosts); // Adicionar middleware
// @route   POST api/timeline
// @desc    Criar uma publicação
// @access  Private
router.post('/', auth, hasPermission('timeline:create'), upload.array('attachments', 5), (req, res) => {
  console.log('Requisição POST /api/timeline recebida:', { 
    body: req.body, 
    files: req.files?.map(f => ({ name: f.originalname, path: f.path, type: f.mimetype })) || [] 
  });
  timelineController.createPost(req, res);
});

// @route   POST api/timeline/comment/:id
// @desc    Adicionar comentário a uma publicação
// @access  Private
router.post('/:id/comment', auth, hasPermission('timeline:comment'), timelineController.addComment);

// @route   PUT api/timeline/like/:id
// @desc    Curtir uma publicação
// @access  Private
router.put('/:id/like', auth, timelineController.likePost);
console.log('Rotas da timeline registradas com sucesso');

// @route   DELETE api/timeline/:id
// @desc    Excluir uma publicação
// @access  Private
router.delete('/:id', auth, isOwnerOrHasPermission(Post, 'id', 'timeline:delete_any'), timelineController.deletePost);
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