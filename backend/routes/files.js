// routes/files.js
const express = require('express');
const router = express.Router();
const filesController = require('../controllers/filesController');
const auth = require('../middleware/auth');
const { hasPermission, isOwnerOrHasPermission } = require('../middleware/permissions');
const { File, Folder } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Garantir que os diretórios de uploads existam
const uploadsDir = path.join(__dirname, '../uploads/files');
const folderUploadsDir = path.join(__dirname, '../uploads/folders');

// Criar diretórios se não existirem
[uploadsDir, folderUploadsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configuração do multer para upload de arquivos
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

// Configuração do multer para upload de capas de pastas
const folderStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, folderUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `cover-${uniqueSuffix}${ext}`);
  }
});

// Filtro para aceitar apenas imagens nas capas
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Apenas imagens são permitidas para capa de pasta'));
};

// Configuração do multer para arquivos
const upload = multer({
  storage: fileStorage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// Configuração do multer para capas de pastas
const uploadFolderCover = multer({
  storage: folderStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB para imagens
  fileFilter: imageFilter
});

// @route   GET api/files
// @desc    Obter arquivos e pastas
// @access  Private
router.get('/', auth, hasPermission('files:view'), filesController.getFiles);

// @route   POST api/files/folders (atualizado para folders com 's')
// @desc    Criar nova pasta
// @access  Private
router.post('/folders', 
  auth, 
  hasPermission('files:create_folder'),
  uploadFolderCover.single('coverImage'), 
  filesController.createFolder
);

// @route   POST api/files/folder (mantém a rota antiga para compatibilidade)
// @desc    Criar nova pasta (rota antiga)
// @access  Private
router.post('/folder', 
  auth, 
  hasPermission('files:create_folder'),
  filesController.createFolder
);

// @route   POST api/files/upload
// @desc    Upload de arquivo
// @access  Private
router.post('/upload', 
  auth, 
  hasPermission('files:upload'), 
  upload.single('file'), 
  filesController.uploadFile
);

// @route   GET api/files/info/:id
// @desc    Obter informações do arquivo
// @access  Private
router.get('/info/:id', auth, hasPermission('files:view'), filesController.getFileInfo);

// @route   GET api/files/download/:id
// @desc    Download de arquivo
// @access  Private
router.get('/download/:id', auth, hasPermission('files:download'), filesController.downloadFile);

// @route   GET api/files/preview/:id
// @desc    Visualizar/preview do arquivo
// @access  Private
router.get('/preview/:id', auth, hasPermission('files:view'), filesController.getFilePreview);

// @route   POST api/files/share
// @desc    Compartilhar arquivo ou pasta
// @access  Private
router.post('/share', auth, hasPermission('files:share'), filesController.shareItem);

// @route   DELETE api/files/:itemType/:itemId
// @desc    Excluir arquivo ou pasta
// @access  Private
router.delete('/:itemType/:itemId', 
  auth,
  (req, res, next) => {
    const model = req.params.itemType === 'file' ? File : Folder;
    const specialPermission = 'files:delete_any';
    return isOwnerOrHasPermission(model, 'itemId', specialPermission)(req, res, next);
  }, 
  filesController.deleteItem
);

module.exports = router;