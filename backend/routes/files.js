// routes/files.js - Versão com Permissões Corrigidas
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

// Middleware personalizado para verificar permissões de arquivo/pasta
const checkFilePermission = (action) => {
  return async (req, res, next) => {
    try {
      const { User } = require('../models');
      
      // Verificar se o usuário está autenticado
      if (!req.usuario || !req.usuario.id) {
        return res.status(401).json({ msg: 'Não autenticado' });
      }
      
      // Buscar usuário com permissões
      const user = await User.findById(req.usuario.id);
      if (!user) {
        return res.status(404).json({ msg: 'Usuário não encontrado' });
      }
      
      console.log(`Verificando permissão de arquivo: ${action}`);
      console.log('Usuário:', { id: user._id, roles: user.roles, permissions: user.permissions });
      
      // Se é admin, pode fazer qualquer coisa
      if (user.roles?.includes('admin')) {
        console.log('Usuário é admin - acesso liberado');
        return next();
      }
      
      // Verificar permissão específica
      const hasDirectPermission = user.permissions?.includes(action);
      
      if (hasDirectPermission) {
        console.log(`Permissão '${action}' encontrada diretamente`);
        return next();
      }
      
      // Verificar permissões por papel
      if (user.roles && user.roles.length > 0) {
        const { Role } = require('../models');
        const userRoles = await Role.find({ name: { $in: user.roles } });
        
        for (const role of userRoles) {
          if (role.permissions?.includes(action)) {
            console.log(`Permissão '${action}' encontrada no papel '${role.name}'`);
            return next();
          }
        }
      }
      
      console.log(`Acesso negado - permissão '${action}' não encontrada`);
      return res.status(403).json({ 
        msg: 'Acesso negado. Você não tem permissão para esta ação.',
        requiredPermission: action
      });
    } catch (err) {
      console.error('Erro na verificação de permissões:', err);
      return res.status(500).json({ 
        msg: 'Erro ao verificar permissões',
        error: err.message 
      });
    }
  };
};

// Middleware para verificar se o usuário pode editar/excluir um item específico
const checkItemPermission = (action) => {
  return async (req, res, next) => {
    try {
      const { itemType, itemId } = req.params;
      const { User } = require('../models');
      
      // Verificar se o usuário está autenticado
      if (!req.usuario || !req.usuario.id) {
        return res.status(401).json({ msg: 'Não autenticado' });
      }
      
      // Buscar usuário
      const user = await User.findById(req.usuario.id);
      if (!user) {
        return res.status(404).json({ msg: 'Usuário não encontrado' });
      }
      
      console.log(`Verificando permissão de item: ${action} para ${itemType}/${itemId}`);
      
      // Se é admin, pode fazer qualquer coisa
      if (user.roles?.includes('admin')) {
        console.log('Usuário é admin - acesso liberado');
        return next();
      }
      
      // Buscar o item
      const Model = itemType === 'file' ? File : Folder;
      const item = await Model.findById(itemId);
      
      if (!item) {
        return res.status(404).json({ msg: 'Item não encontrado' });
      }
      
      // Verificar se é proprietário
      if (item.owner.toString() === req.usuario.id) {
        console.log('Usuário é proprietário - acesso liberado');
        return next();
      }
      
      // Verificar permissão especial para gerenciar qualquer arquivo
      const specialPermission = `files:${action}_any`;
      const hasSpecialPermission = user.permissions?.includes(specialPermission);
      
      if (hasSpecialPermission) {
        console.log(`Permissão especial '${specialPermission}' encontrada`);
        return next();
      }
      
      // Verificar permissões por papel
      if (user.roles && user.roles.length > 0) {
        const { Role } = require('../models');
        const userRoles = await Role.find({ name: { $in: user.roles } });
        
        for (const role of userRoles) {
          if (role.permissions?.includes(specialPermission)) {
            console.log(`Permissão especial '${specialPermission}' encontrada no papel '${role.name}'`);
            return next();
          }
        }
      }
      
      console.log('Acesso negado - não é proprietário nem tem permissão especial');
      return res.status(403).json({ 
        msg: 'Apenas o proprietário ou administradores podem realizar esta ação.'
      });
    } catch (err) {
      console.error('Erro na verificação de permissões do item:', err);
      return res.status(500).json({ 
        msg: 'Erro ao verificar permissões',
        error: err.message 
      });
    }
  };
};

// @route   GET api/files
// @desc    Obter arquivos e pastas com filtro de departamento
// @access  Private
router.get('/', auth, checkFilePermission('files:view'), filesController.getFiles);

// @route   POST api/files/folders
// @desc    Criar nova pasta com suporte a departamentos
// @access  Private
router.post('/folders', 
  auth, 
  checkFilePermission('files:create_folder'),
  uploadFolderCover.single('coverImage'), 
  filesController.createFolder
);

// @route   POST api/files/folder (mantém compatibilidade)
// @desc    Criar nova pasta (rota antiga)
// @access  Private
router.post('/folder', 
  auth, 
  checkFilePermission('files:create_folder'),
  uploadFolderCover.single('coverImage'),
  filesController.createFolder
);

// @route   POST api/files/upload
// @desc    Upload de arquivo ou criação de link
// @access  Private
router.post('/upload', 
  auth, 
  checkFilePermission('files:upload'), 
  upload.single('file'), 
  filesController.uploadFile
);

// @route   GET api/files/info/:id
// @desc    Obter informações detalhadas do arquivo/link
// @access  Private
router.get('/info/:id', auth, checkFilePermission('files:view'), filesController.getFileInfo);

// @route   GET api/files/download/:id
// @desc    Download de arquivo (com verificação de permissão)
// @access  Private
router.get('/download/:id', auth, checkFilePermission('files:download'), filesController.downloadFile);

// @route   GET api/files/preview/:id
// @desc    Visualizar/preview do arquivo ou redirecionar link
// @access  Private
router.get('/preview/:id', auth, checkFilePermission('files:view'), filesController.getFilePreview);

// @route   POST api/files/share
// @desc    Compartilhar arquivo ou pasta
// @access  Private
router.post('/share', auth, checkFilePermission('files:share'), filesController.shareItem);

// @route   PUT api/files/:itemType/:itemId/public
// @desc    Alterar visibilidade pública do item
// @access  Private
router.put('/:itemType/:itemId/public', 
  auth,
  checkItemPermission('edit'),
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
      res.status(500).json({ msg: 'Erro no servidor', error: err.message });
    }
  }
);

// @route   PUT api/files/:itemType/:itemId/departments
// @desc    Alterar departamentos de visibilidade do item
// @access  Private
router.put('/:itemType/:itemId/departments', 
  auth,
  checkItemPermission('edit'),
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
      res.status(500).json({ msg: 'Erro no servidor', error: err.message });
    }
  }
);

// @route   PUT api/files/file/:fileId/download-permission
// @desc    Alterar permissão de download do arquivo
// @access  Private
router.put('/file/:fileId/download-permission', 
  auth,
  checkItemPermission('edit'),
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
      res.status(500).json({ msg: 'Erro no servidor', error: err.message });
    }
  }
);

// @route   PUT api/files/:itemType/:itemId/rename
// @desc    Renomear arquivo, pasta ou link
// @access  Private
router.put('/:itemType/:itemId/rename', 
  auth,
  checkItemPermission('edit'),
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
      res.status(500).json({ msg: 'Erro no servidor', error: err.message });
    }
  }
);

// @route   PUT api/files/:itemType/:itemId/description
// @desc    Atualizar descrição do item
// @access  Private
router.put('/:itemType/:itemId/description', 
  auth,
  checkItemPermission('edit'),
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
      res.status(500).json({ msg: 'Erro no servidor', error: err.message });
    }
  }
);

// @route   DELETE api/files/:itemType/:itemId
// @desc    Excluir arquivo, pasta ou link
// @access  Private
router.delete('/:itemType/:itemId', 
  auth,
  checkItemPermission('delete'),
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
    res.status(500).json({ msg: 'Erro no servidor', error: err.message });
  }
});

// @route   GET api/files/stats
// @desc    Obter estatísticas de arquivos (para admins)
// @access  Private (Admin only)
router.get('/stats', 
  auth, 
  checkFilePermission('admin:access'),
  async (req, res) => {
    try {
      console.log('Obtendo estatísticas de arquivos...');
      
      // Estatísticas básicas
      const totalFiles = await File.countDocuments({ type: 'file' });
      const totalLinks = await File.countDocuments({ type: 'link' });
      const totalFolders = await Folder.countDocuments();
      
      // Estatísticas por departamento
      const filesByDepartment = await File.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'owner',
            foreignField: '_id',
            as: 'ownerInfo'
          }
        },
        {
          $unwind: '$ownerInfo'
        },
        {
          $group: {
            _id: '$ownerInfo.departamento',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);
      
      // Estatísticas por tipo de arquivo
      const filesByType = await File.aggregate([
        {
          $match: { type: 'file' }
        },
        {
          $group: {
            _id: '$extension',
            count: { $sum: 1 },
            totalSize: { $sum: '$size' }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 10
        }
      ]);
      
      // Usuários mais ativos
      const mostActiveUsers = await File.aggregate([
        {
          $group: {
            _id: '$owner',
            fileCount: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        {
          $unwind: '$userInfo'
        },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            userName: '$userInfo.nome',
            userDepartment: '$userInfo.departamento',
            fileCount: 1
          }
        },
        {
          $sort: { fileCount: -1 }
        },
        {
          $limit: 10
        }
      ]);
      
      // Calcular tamanho total usado
      const totalSizeResult = await File.aggregate([
        {
          $match: { type: 'file', size: { $exists: true } }
        },
        {
          $group: {
            _id: null,
            totalSize: { $sum: '$size' }
          }
        }
      ]);
      
      const totalSize = totalSizeResult.length > 0 ? totalSizeResult[0].totalSize : 0;
      
      res.json({
        summary: {
          totalFiles,
          totalLinks,
          totalFolders,
          totalSize,
          totalSizeFormatted: formatFileSize(totalSize)
        },
        filesByDepartment,
        filesByType,
        mostActiveUsers
      });
    } catch (err) {
      console.error('Erro ao obter estatísticas:', err.message);
      res.status(500).json({ msg: 'Erro no servidor', error: err.message });
    }
  }
);

// Função auxiliar para formatar tamanho de arquivo
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = router;