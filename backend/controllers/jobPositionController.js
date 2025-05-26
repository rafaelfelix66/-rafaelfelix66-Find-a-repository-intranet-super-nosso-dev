// backend/controllers/jobPositionController.js
const JobPosition = require('../models/JobPosition');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/job-positions');
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
    if (type === 'external') {
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

// Obter todas as vagas ativas
const getJobPositions = async (req, res) => {
  try {
    const positions = await JobPosition.find({ active: true })
      .sort({ order: 1 })
      .populate('createdBy', 'nome')
      .lean();
      
    const normalizedPositions = positions.map(position => ({
      ...position,
      attachmentUrl: position.attachmentUrl.startsWith('/') ? position.attachmentUrl : `/${position.attachmentUrl}`
    }));
      
    res.json(normalizedPositions);
  } catch (error) {
    console.error('Erro ao buscar vagas:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar vagas' });
  }
};

// Obter todas as vagas (incluindo inativas) para administração
const getAllJobPositions = async (req, res) => {
  try {
    const positions = await JobPosition.find()
      .sort({ order: 1 })
      .populate('createdBy', 'nome')
      .lean();
      
    const normalizedPositions = positions.map(position => ({
      ...position,
      attachmentUrl: position.attachmentUrl.startsWith('/') ? position.attachmentUrl : `/${position.attachmentUrl}`
    }));
      
    res.json(normalizedPositions);
  } catch (error) {
    console.error('Erro ao buscar vagas:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar vagas' });
  }
};

// Criar nova vaga
const createJobPosition = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      layout, 
      attachmentType, 
      linkUrl, 
      linkType, 
      youtubeUrl,
      department,
      location,
      employmentType,
      salaryRange,
      requirements,
      benefits,
      applicationDeadline,
      contactEmail
    } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ mensagem: 'Título é obrigatório' });
    }
    
    if (!department || !department.trim()) {
      return res.status(400).json({ mensagem: 'Departamento é obrigatório' });
    }
    
    if (!location || !location.trim()) {
      return res.status(400).json({ mensagem: 'Localização é obrigatória' });
    }
    
    if (!employmentType) {
      return res.status(400).json({ mensagem: 'Tipo de contratação é obrigatório' });
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
      
      attachmentUrl = `/uploads/job-positions/${req.file.filename}`;
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
    const lastPosition = await JobPosition.findOne().sort({ order: -1 });
    const nextOrder = lastPosition ? lastPosition.order + 1 : 0;
    
    const newPosition = new JobPosition({
      title: title.trim(),
      description: description ? description.trim() : '',
      layout,
      attachmentType,
      attachmentUrl,
      youtubeVideoId,
      linkUrl: processedLinkUrl,
      linkType,
      department: department.trim(),
      location: location.trim(),
      employmentType,
      salaryRange: salaryRange || '',
      requirements: requirements || '',
      benefits: benefits || '',
      applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
      contactEmail: contactEmail || '',
      order: nextOrder,
      createdBy: req.usuario.id
    });
    
    await newPosition.save();
    await newPosition.populate('createdBy', 'nome');
    
    console.log(`Nova vaga criada: ${title} por ${req.usuario.id}`);
    
    res.status(201).json(newPosition);
  } catch (error) {
    console.error('Erro ao criar vaga:', error);
    res.status(500).json({ mensagem: 'Erro ao criar vaga', error: error.message });
  }
};

// Atualizar vaga
const updateJobPosition = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      layout, 
      attachmentType, 
      linkUrl, 
      linkType, 
      youtubeUrl, 
      active,
      department,
      location,
      employmentType,
      salaryRange,
      requirements,
      benefits,
      applicationDeadline,
      contactEmail
    } = req.body;
    const positionId = req.params.id;
    
    const position = await JobPosition.findById(positionId);
    if (!position) {
      return res.status(404).json({ mensagem: 'Vaga não encontrada' });
    }
    
    // Atualizar campos básicos
    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ mensagem: 'Título é obrigatório' });
      }
      position.title = title.trim();
    }
    if (description !== undefined) position.description = description.trim();
    if (layout !== undefined) position.layout = layout;
    if (active !== undefined) position.active = active;
    
    // Atualizar campos específicos de vaga
    if (department !== undefined) position.department = department.trim();
    if (location !== undefined) position.location = location.trim();
    if (employmentType !== undefined) position.employmentType = employmentType;
    if (salaryRange !== undefined) position.salaryRange = salaryRange;
    if (requirements !== undefined) position.requirements = requirements;
    if (benefits !== undefined) position.benefits = benefits;
    if (applicationDeadline !== undefined) {
      position.applicationDeadline = applicationDeadline ? new Date(applicationDeadline) : null;
    }
    if (contactEmail !== undefined) position.contactEmail = contactEmail;
    
    // Processar link se fornecido
    if (linkUrl !== undefined) {
      if (linkUrl && linkUrl.trim()) {
        const validation = validateUrl(linkUrl, linkType);
        if (!validation.valid) {
          return res.status(400).json({ mensagem: validation.message });
        }
        position.linkUrl = validation.url;
        position.linkType = linkType;
      } else {
        position.linkUrl = null;
        position.linkType = null;
      }
    }
    
    // Se mudou o tipo de anexo ou enviou novo arquivo
    if (attachmentType) {
      position.attachmentType = attachmentType;
      
      if (attachmentType === 'youtube') {
        if (youtubeUrl) {
          const videoId = extractYouTubeVideoId(youtubeUrl);
          if (!videoId) {
            return res.status(400).json({ mensagem: 'URL do YouTube inválida' });
          }
          
          if (position.attachmentUrl && !position.attachmentUrl.includes('youtube')) {
            const oldPath = path.join(__dirname, '..', position.attachmentUrl);
            if (fs.existsSync(oldPath)) {
              try {
                fs.unlinkSync(oldPath);
                console.log(`Arquivo anterior removido: ${oldPath}`);
              } catch (err) {
                console.error(`Erro ao remover arquivo anterior: ${err.message}`);
              }
            }
          }
          
          position.youtubeVideoId = videoId;
          position.attachmentUrl = youtubeUrl;
        }
      } else if (req.file) {
        if (position.attachmentUrl && !position.attachmentUrl.includes('youtube')) {
          const oldPath = path.join(__dirname, '..', position.attachmentUrl);
          if (fs.existsSync(oldPath)) {
            try {
              fs.unlinkSync(oldPath);
              console.log(`Arquivo anterior removido: ${oldPath}`);
            } catch (err) {
              console.error(`Erro ao remover arquivo anterior: ${err.message}`);
            }
          }
        }
        
        position.attachmentUrl = `/uploads/job-positions/${req.file.filename}`;
        position.youtubeVideoId = null;
      }
    }
    
    await position.save();
    await position.populate('createdBy', 'nome');
    
    console.log(`Vaga atualizada: ${position.title} por ${req.usuario.id}`);
    
    res.json(position);
  } catch (error) {
    console.error('Erro ao atualizar vaga:', error);
    res.status(500).json({ mensagem: 'Erro ao atualizar vaga', error: error.message });
  }
};

// Excluir vaga
const deleteJobPosition = async (req, res) => {
  try {
    const position = await JobPosition.findById(req.params.id);
    if (!position) {
      return res.status(404).json({ mensagem: 'Vaga não encontrada' });
    }
    
    // Remover arquivo se não for YouTube
    if (position.attachmentUrl && !position.attachmentUrl.includes('youtube')) {
      const filePath = path.join(__dirname, '..', position.attachmentUrl);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Arquivo removido: ${filePath}`);
        } catch (err) {
          console.error(`Erro ao remover arquivo: ${err.message}`);
        }
      }
    }
    
    const deletedTitle = position.title;
    await position.deleteOne();
    
    // Reordenar as vagas restantes
    const remainingPositions = await JobPosition.find().sort({ order: 1 });
    for (let i = 0; i < remainingPositions.length; i++) {
      if (remainingPositions[i].order !== i) {
        remainingPositions[i].order = i;
        await remainingPositions[i].save();
      }
    }
    
    console.log(`Vaga excluída: ${deletedTitle} por ${req.usuario.id}`);
    
    res.json({ mensagem: 'Vaga excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir vaga:', error);
    res.status(500).json({ mensagem: 'Erro ao excluir vaga' });
  }
};

// Alterar ordem das vagas
const updateOrder = async (req, res) => {
  try {
    const { positions } = req.body;
    
    if (!Array.isArray(positions)) {
      return res.status(400).json({ mensagem: 'Formato de dados inválido' });
    }
    
    const positionIds = positions.map(item => item.id);
    const existingPositions = await JobPosition.find({ _id: { $in: positionIds } });
    
    if (existingPositions.length !== positions.length) {
      return res.status(400).json({ mensagem: 'Uma ou mais vagas não foram encontradas' });
    }
    
    const bulkOps = positions.map(item => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { order: item.order } }
      }
    }));
    
    await JobPosition.bulkWrite(bulkOps);
    
    console.log(`Ordem das vagas atualizada por ${req.usuario.id}`);
    
    res.json({ mensagem: 'Ordem atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar ordem:', error);
    res.status(500).json({ mensagem: 'Erro ao atualizar ordem' });
  }
};

// Função para servir arquivos estaticamente
const serveFile = async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/job-positions', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ mensagem: 'Arquivo não encontrado' });
    }
    
    const stats = fs.statSync(filePath);
    const ext = path.extname(filename).toLowerCase();
    
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
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('ETag', `"${stats.mtime.getTime()}-${stats.size}"`);
    
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
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    }
    
  } catch (error) {
    console.error('Erro ao servir arquivo:', error);
    res.status(500).json({ mensagem: 'Erro ao acessar arquivo' });
  }
};

module.exports = {
  getJobPositions,
  getAllJobPositions,
  createJobPosition,
  updateJobPosition,
  deleteJobPosition,
  updateOrder,
  serveFile,
  upload
};