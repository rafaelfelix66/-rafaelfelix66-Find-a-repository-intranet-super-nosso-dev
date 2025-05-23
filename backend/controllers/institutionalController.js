// backend/controllers/institutionalController.js - Versão Atualizada
const InstitutionalArea = require('../models/InstitutionalArea');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/institutional');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|mp4|webm|ogg|avi|mov/;
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
  limits: { 
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// Função auxiliar para extrair ID do YouTube
const extractYouTubeVideoId = (url) => {
  if (!url) return null;
  
  // Padrões de URL do YouTube
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    /m\.youtube\.com\/watch\?v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

// Função auxiliar para validar URL
const validateUrl = (url, type) => {
  if (!url) return { valid: false, message: 'URL é obrigatória' };
  
  try {
    // Para links externos, validar se é uma URL válida
    if (type === 'external') {
      // Adicionar protocolo se não tiver
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      new URL(url);
    }
    
    return { valid: true, url };
  } catch (error) {
    return { valid: false, message: 'URL inválida' };
  }
};

// Obter todas as áreas institucionais ativas
const getAreas = async (req, res) => {
  try {
    const areas = await InstitutionalArea.find({ active: true })
      .sort({ order: 1 })
      .populate('createdBy', 'nome')
      .lean();
      
    // Normalizar URLs dos anexos
    const normalizedAreas = areas.map(area => ({
      ...area,
      attachmentUrl: area.attachmentUrl.startsWith('/') ? area.attachmentUrl : `/${area.attachmentUrl}`
    }));
      
    res.json(normalizedAreas);
  } catch (error) {
    console.error('Erro ao buscar áreas institucionais:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar áreas institucionais' });
  }
};

// Obter todas as áreas (incluindo inativas) para administração
const getAllAreas = async (req, res) => {
  try {
    const areas = await InstitutionalArea.find()
      .sort({ order: 1 })
      .populate('createdBy', 'nome')
      .lean();
      
    // Normalizar URLs dos anexos
    const normalizedAreas = areas.map(area => ({
      ...area,
      attachmentUrl: area.attachmentUrl.startsWith('/') ? area.attachmentUrl : `/${area.attachmentUrl}`
    }));
      
    res.json(normalizedAreas);
  } catch (error) {
    console.error('Erro ao buscar áreas institucionais:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar áreas institucionais' });
  }
};

// Criar nova área institucional
const createArea = async (req, res) => {
  try {
    const { title, description, layout, attachmentType, linkUrl, linkType, youtubeUrl } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ mensagem: 'Título é obrigatório' });
    }
    
    let attachmentUrl = '';
    let youtubeVideoId = null;
    let processedLinkUrl = linkUrl;
    
    // Se for vídeo do YouTube
    if (attachmentType === 'youtube') {
      if (!youtubeUrl) {
        return res.status(400).json({ mensagem: 'URL do YouTube é obrigatória' });
      }
      
      youtubeVideoId = extractYouTubeVideoId(youtubeUrl);
      if (!youtubeVideoId) {
        return res.status(400).json({ mensagem: 'URL do YouTube inválida' });
      }
      
      attachmentUrl = youtubeUrl;
    } else {
      // Se for upload de arquivo
      if (!req.file) {
        return res.status(400).json({ mensagem: 'Arquivo é obrigatório' });
      }
      
      attachmentUrl = `/uploads/institutional/${req.file.filename}`;
    }
    
    // Validar link se fornecido
    if (linkUrl && linkUrl.trim()) {
      const validation = validateUrl(linkUrl, linkType);
      if (!validation.valid) {
        return res.status(400).json({ mensagem: validation.message });
      }
      processedLinkUrl = validation.url;
    }
    
    // Obter a próxima ordem
    const lastArea = await InstitutionalArea.findOne().sort({ order: -1 });
    const nextOrder = lastArea ? lastArea.order + 1 : 0;
    
    const newArea = new InstitutionalArea({
      title: title.trim(),
      description: description ? description.trim() : '',
      layout,
      attachmentType,
      attachmentUrl,
      youtubeVideoId,
      linkUrl: processedLinkUrl,
      linkType,
      order: nextOrder,
      createdBy: req.usuario.id
    });
    
    await newArea.save();
    await newArea.populate('createdBy', 'nome');
    
    console.log(`Nova área institucional criada: ${title} por ${req.usuario.id}`);
    
    res.status(201).json(newArea);
  } catch (error) {
    console.error('Erro ao criar área institucional:', error);
    res.status(500).json({ mensagem: 'Erro ao criar área institucional', error: error.message });
  }
};

// Atualizar área institucional
const updateArea = async (req, res) => {
  try {
    const { title, description, layout, attachmentType, linkUrl, linkType, youtubeUrl, active } = req.body;
    const areaId = req.params.id;
    
    const area = await InstitutionalArea.findById(areaId);
    if (!area) {
      return res.status(404).json({ mensagem: 'Área não encontrada' });
    }
    
    // Atualizar campos básicos
    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ mensagem: 'Título é obrigatório' });
      }
      area.title = title.trim();
    }
    if (description !== undefined) area.description = description.trim();
    if (layout !== undefined) area.layout = layout;
    if (active !== undefined) area.active = active;
    
    // Processar link se fornecido
    if (linkUrl !== undefined) {
      if (linkUrl && linkUrl.trim()) {
        const validation = validateUrl(linkUrl, linkType);
        if (!validation.valid) {
          return res.status(400).json({ mensagem: validation.message });
        }
        area.linkUrl = validation.url;
        area.linkType = linkType;
      } else {
        area.linkUrl = null;
        area.linkType = null;
      }
    }
    
    // Se mudou o tipo de anexo ou enviou novo arquivo
    if (attachmentType) {
      area.attachmentType = attachmentType;
      
      if (attachmentType === 'youtube') {
        if (youtubeUrl) {
          const videoId = extractYouTubeVideoId(youtubeUrl);
          if (!videoId) {
            return res.status(400).json({ mensagem: 'URL do YouTube inválida' });
          }
          
          // Se mudou para YouTube e havia arquivo anterior, remover
          if (area.attachmentUrl && !area.attachmentUrl.includes('youtube')) {
            const oldPath = path.join(__dirname, '..', area.attachmentUrl);
            if (fs.existsSync(oldPath)) {
              try {
                fs.unlinkSync(oldPath);
                console.log(`Arquivo anterior removido: ${oldPath}`);
              } catch (err) {
                console.error(`Erro ao remover arquivo anterior: ${err.message}`);
              }
            }
          }
          
          area.youtubeVideoId = videoId;
          area.attachmentUrl = youtubeUrl;
        }
      } else if (req.file) {
        // Se enviou novo arquivo, remover o antigo
        if (area.attachmentUrl && !area.attachmentUrl.includes('youtube')) {
          const oldPath = path.join(__dirname, '..', area.attachmentUrl);
          if (fs.existsSync(oldPath)) {
            try {
              fs.unlinkSync(oldPath);
              console.log(`Arquivo anterior removido: ${oldPath}`);
            } catch (err) {
              console.error(`Erro ao remover arquivo anterior: ${err.message}`);
            }
          }
        }
        
        area.attachmentUrl = `/uploads/institutional/${req.file.filename}`;
        area.youtubeVideoId = null;
      }
    }
    
    await area.save();
    await area.populate('createdBy', 'nome');
    
    console.log(`Área institucional atualizada: ${area.title} por ${req.usuario.id}`);
    
    res.json(area);
  } catch (error) {
    console.error('Erro ao atualizar área institucional:', error);
    res.status(500).json({ mensagem: 'Erro ao atualizar área institucional', error: error.message });
  }
};

// Excluir área institucional
const deleteArea = async (req, res) => {
  try {
    const area = await InstitutionalArea.findById(req.params.id);
    if (!area) {
      return res.status(404).json({ mensagem: 'Área não encontrada' });
    }
    
    // Remover arquivo se não for YouTube
    if (area.attachmentUrl && !area.attachmentUrl.includes('youtube')) {
      const filePath = path.join(__dirname, '..', area.attachmentUrl);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Arquivo removido: ${filePath}`);
        } catch (err) {
          console.error(`Erro ao remover arquivo: ${err.message}`);
        }
      }
    }
    
    const deletedTitle = area.title;
    await area.deleteOne();
    
    // Reordenar as áreas restantes
    const remainingAreas = await InstitutionalArea.find().sort({ order: 1 });
    for (let i = 0; i < remainingAreas.length; i++) {
      if (remainingAreas[i].order !== i) {
        remainingAreas[i].order = i;
        await remainingAreas[i].save();
      }
    }
    
    console.log(`Área institucional excluída: ${deletedTitle} por ${req.usuario.id}`);
    
    res.json({ mensagem: 'Área excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir área institucional:', error);
    res.status(500).json({ mensagem: 'Erro ao excluir área institucional' });
  }
};

// Alterar ordem das áreas
const updateOrder = async (req, res) => {
  try {
    const { areas } = req.body;
    
    if (!Array.isArray(areas)) {
      return res.status(400).json({ mensagem: 'Formato de dados inválido' });
    }
    
    // Validar se todas as áreas existem
    const areaIds = areas.map(item => item.id);
    const existingAreas = await InstitutionalArea.find({ _id: { $in: areaIds } });
    
    if (existingAreas.length !== areas.length) {
      return res.status(400).json({ mensagem: 'Uma ou mais áreas não foram encontradas' });
    }
    
    // Atualizar as ordens em batch
    const bulkOps = areas.map(item => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { order: item.order } }
      }
    }));
    
    await InstitutionalArea.bulkWrite(bulkOps);
    
    console.log(`Ordem das áreas institucionais atualizada por ${req.usuario.id}`);
    
    res.json({ mensagem: 'Ordem atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar ordem:', error);
    res.status(500).json({ mensagem: 'Erro ao atualizar ordem' });
  }
};

// Função para servir arquivos estaticamente com headers apropriados
const serveFile = async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/institutional', filename);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ mensagem: 'Arquivo não encontrado' });
    }
    
    // Obter informações do arquivo
    const stats = fs.statSync(filePath);
    const ext = path.extname(filename).toLowerCase();
    
    // Definir content-type baseado na extensão
    let contentType = 'application/octet-stream';
    
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogg': 'video/ogg'
    };
    
    contentType = mimeTypes[ext] || contentType;
    
    // Configurar headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache por 1 ano
    res.setHeader('ETag', `"${stats.mtime.getTime()}-${stats.size}"`);
    
    // Suporte para range requests (para vídeos)
    if (req.headers.range && contentType.startsWith('video/')) {
      const range = req.headers.range;
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunksize = (end - start) + 1;
      
      const stream = fs.createReadStream(filePath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType
      });
      
      stream.pipe(res);
    } else {
      // Servir arquivo completo
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    }
    
  } catch (error) {
    console.error('Erro ao servir arquivo:', error);
    res.status(500).json({ mensagem: 'Erro ao acessar arquivo' });
  }
};

module.exports = {
  getAreas,
  getAllAreas,
  createArea,
  updateArea,
  deleteArea,
  updateOrder,
  serveFile,
  upload
};