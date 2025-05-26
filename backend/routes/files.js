// routes/files.js - Versão atualizada
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
// @desc    Obter arquivos e pastas com filtro de departamento
// @access  Private
router.get('/', auth, hasPermission('files:view'), filesController.getFiles);

// @route   POST api/files/folders
// @desc    Criar nova pasta com suporte a departamentos
// @access  Private
router.post('/folders', 
  auth, 
  hasPermission('files:create_folder'),
  uploadFolderCover.single('coverImage'), 
  filesController.createFolder
);

// @route   POST api/files/folder (mantém compatibilidade)
// @desc    Criar nova pasta (rota antiga)
// @access  Private
router.post('/folder', 
  auth, 
  hasPermission('files:create_folder'),
  uploadFolderCover.single('coverImage'),
  filesController.createFolder
);

// @route   POST api/files/upload
// @desc    Upload de arquivo ou criação de link
// @access  Private
router.post('/upload', 
  auth, 
  hasPermission('files:upload'), 
  upload.single('file'), 
  filesController.uploadFile
);

// @route   GET api/files/info/:id
// @desc    Obter informações detalhadas do arquivo/link
// @access  Private
router.get('/info/:id', auth, hasPermission('files:view'), filesController.getFileInfo);

// @route   GET api/files/download/:id
// @desc    Download de arquivo (com verificação de permissão)
// @access  Private
router.get('/download/:id', auth, hasPermission('files:download'), filesController.downloadFile);

// @route   GET api/files/preview/:id
// @desc    Visualizar/preview do arquivo ou redirecionar link
// @access  Private
router.get('/preview/:id', auth, hasPermission('files:view'), filesController.getFilePreview);

// @route   POST api/files/share
// @desc    Compartilhar arquivo ou pasta
// @access  Private
router.post('/share', auth, hasPermission('files:share'), filesController.shareItem);

// @route   PUT api/files/:itemType/:itemId/public
// @desc    Alterar visibilidade pública do item
// @access  Private
router.put('/:itemType/:itemId/public', 
  auth,
  (req, res, next) => {
    const model = req.params.itemType === 'file' ? File : Folder;
    const specialPermission = 'files:manage_any';
    return isOwnerOrHasPermission(model, 'itemId', specialPermission)(req, res, next);
  }, 
  async (req, res) => {
    try {
      const { itemType, itemId } = req.params;
      const { isPublic } = req.body;
      
      if (itemType !== 'file' && itemType !== 'folder') {
        return res.status(400).json({ msg: 'Tipo de item inválido' });
      }
      
      const Model = itemType === 'file' ? File : Folder;
      const item = await Model.findById(itemId);
      
      if (!item) {
        return res.status(404).json({ msg: 'Item não encontrado' });
      }
      
      // Atualizar visibilidade
      item.isPublic = isPublic;
      await item.save();
      
      res.json({ 
        _id: item._id,
        isPublic: item.isPublic 
      });
    } catch (err) {
      console.error('Erro ao atualizar visibilidade do item:', err.message);
      res.status(500).send('Erro no servidor');
    }
  }
);

// @route   PUT api/files/:itemType/:itemId/departments
// @desc    Alterar departamentos de visibilidade do item
// @access  Private
router.put('/:itemType/:itemId/departments', 
  auth,
  (req, res, next) => {
    const model = req.params.itemType === 'file' ? File : Folder;
    const specialPermission = 'files:manage_any';
    return isOwnerOrHasPermission(model, 'itemId', specialPermission)(req, res, next);
  }, 
  async (req, res) => {
    try {
      const { itemType, itemId } = req.params;
      const { departamentoVisibilidade } = req.body;
      
      if (itemType !== 'file' && itemType !== 'folder') {
        return res.status(400).json({ msg: 'Tipo de item inválido' });
      }
      
      const Model = itemType === 'file' ? File : Folder;
      const item = await Model.findById(itemId);
      
      if (!item) {
        return res.status(404).json({ msg: 'Item não encontrado' });
      }
      
      // Atualizar departamentos de visibilidade
      item.departamentoVisibilidade = departamentoVisibilidade || ['TODOS'];
      item.isPublic = departamentoVisibilidade.includes('TODOS');
      await item.save();
      
      res.json({ 
        _id: item._id,
        departamentoVisibilidade: item.departamentoVisibilidade,
        isPublic: item.isPublic
      });
    } catch (err) {
      console.error('Erro ao atualizar departamentos do item:', err.message);
      res.status(500).send('Erro no servidor');
    }
  }
);

// @route   PUT api/files/file/:fileId/download-permission
// @desc    Alterar permissão de download do arquivo
// @access  Private
router.put('/file/:fileId/download-permission', 
  auth,
  (req, res, next) => {
    return isOwnerOrHasPermission(File, 'fileId', 'files:manage_any')(req, res, next);
  }, 
  async (req, res) => {
    try {
      const { fileId } = req.params;
      const { allowDownload } = req.body;
      
      const file = await File.findById(fileId);
      
      if (!file) {
        return res.status(404).json({ msg: 'Arquivo não encontrado' });
      }
      
      if (file.type === 'link') {
        return res.status(400).json({ msg: 'Links não possuem permissão de download' });
      }
      
      // Atualizar permissão de download
      file.allowDownload = allowDownload;
      await file.save();
      
      res.json({ 
        _id: file._id,
        allowDownload: file.allowDownload
      });
    } catch (err) {
      console.error('Erro ao atualizar permissão de download:', err.message);
      res.status(500).send('Erro no servidor');
    }
  }
);

// @route   PUT api/files/:itemType/:itemId/rename
// @desc    Renomear arquivo, pasta ou link
// @access  Private
router.put('/:itemType/:itemId/rename', 
  auth,
  (req, res, next) => {
    const model = req.params.itemType === 'file' ? File : Folder;
    const specialPermission = 'files:edit_any';
    return isOwnerOrHasPermission(model, 'itemId', specialPermission)(req, res, next);
  }, 
  async (req, res) => {
    try {
      const { itemType, itemId } = req.params;
      const { newName } = req.body;
      
      if (!newName || !newName.trim()) {
        return res.status(400).json({ msg: 'Nome é obrigatório' });
      }
      
      if (itemType !== 'file' && itemType !== 'folder') {
        return res.status(400).json({ msg: 'Tipo de item inválido' });
      }
      
      const Model = itemType === 'file' ? File : Folder;
      const item = await Model.findById(itemId);
      
      if (!item) {
        return res.status(404).json({ msg: 'Item não encontrado' });
      }
      
      // Atualizar nome
      item.name = newName.trim();
      item.updatedAt = new Date();
      await item.save();
      
      res.json({ 
        _id: item._id,
        name: item.name,
        updatedAt: item.updatedAt
      });
    } catch (err) {
      console.error('Erro ao renomear item:', err.message);
      res.status(500).send('Erro no servidor');
    }
  }
);

// @route   PUT api/files/:itemType/:itemId/description
// @desc    Atualizar descrição do item
// @access  Private
router.put('/:itemType/:itemId/description', 
  auth,
  (req, res, next) => {
    const model = req.params.itemType === 'file' ? File : Folder;
    const specialPermission = 'files:edit_any';
    return isOwnerOrHasPermission(model, 'itemId', specialPermission)(req, res, next);
  }, 
  async (req, res) => {
    try {
      const { itemType, itemId } = req.params;
      const { description } = req.body;
      
      if (itemType !== 'file' && itemType !== 'folder') {
        return res.status(400).json({ msg: 'Tipo de item inválido' });
      }
      
      const Model = itemType === 'file' ? File : Folder;
      const item = await Model.findById(itemId);
      
      if (!item) {
        return res.status(404).json({ msg: 'Item não encontrado' });
      }
      
      // Atualizar descrição
      item.description = description || '';
      item.updatedAt = new Date();
      await item.save();
      
      res.json({ 
        _id: item._id,
        description: item.description,
        updatedAt: item.updatedAt
      });
    } catch (err) {
      console.error('Erro ao atualizar descrição:', err.message);
      res.status(500).send('Erro no servidor');
    }
  }
);

// @route   DELETE api/files/:itemType/:itemId
// @desc    Excluir arquivo, pasta ou link
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

// @route   GET api/files/link/:linkId/redirect
// @desc    Redirecionar para URL do link (com tracking)
// @access  Public (com token opcional)
router.get('/link/:linkId/redirect', async (req, res) => {
  try {
    const { linkId } = req.params;
    
    const link = await File.findById(linkId);
    if (!link || link.type !== 'link') {
      return res.status(404).json({ msg: 'Link não encontrado' });
    }
    
    // TODO: Registrar acesso ao link para analytics
    
    // Redirecionar para a URL
    res.redirect(link.linkUrl);
  } catch (err) {
    console.error('Erro ao redirecionar link:', err.message);
    res.status(500).send('Erro no servidor');
  }
});

module.exports = router;