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

// Garantir que o diretório de uploads exista
const uploadsDir = path.join(__dirname, '../uploads/files');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuração do multer para uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// @route   GET api/files
// @desc    Obter arquivos e pastas
// @access  Private
router.get('/', auth, hasPermission('files:view'), filesController.getFiles);

// @route   POST api/files/folder
// @desc    Criar nova pasta
// @access  Private
router.post('/folder', auth, hasPermission('files:create_folder'), filesController.createFolder);

// @route   POST api/files/upload
// @desc    Upload de arquivo
// @access  Private
router.post('/upload', auth, hasPermission('files:upload'), upload.single('file'), filesController.uploadFile);

// Em routes/files.js
// @route   GET api/files/info/:id
// @desc    Obter informações do arquivo
// @access  Private
router.get('/info/:id', auth, hasPermission('files:view'), filesController.getFileInfo);

// @route   GET api/files/download/:id
// @desc    Download de arquivo
// @access  Private
router.get('/download/:id', auth, hasPermission('files:download'), filesController.downloadFile);

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
    const specialPermission = req.params.itemType === 'file' ? 'files:delete_any' : 'files:delete_any';
    return isOwnerOrHasPermission(model, 'itemId', specialPermission)(req, res, next);
  }, 
  filesController.deleteItem
 );

module.exports = router;