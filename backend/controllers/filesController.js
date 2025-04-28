// controllers/filesController.js (Versão corrigida)
const { File, Folder } = require('../models');
const path = require('path');
const fs = require('fs');

const getFiles = async (req, res) => {
  try {
    const { folderId } = req.query;
    
    // Definir consultas base
    let fileQuery = {};
    let folderQuery = {};
    
    // Filtrar por pasta atual
    if (folderId) {
      fileQuery.folderId = folderId;
      folderQuery.parentId = folderId;
    } else {
      fileQuery.folderId = null;
      folderQuery.parentId = null;
    }
    
    // CORREÇÃO: Modificar as consultas para mostrar:
    // 1. Arquivos/pastas do próprio usuário
    // 2. Arquivos/pastas compartilhados com o usuário
    // 3. Arquivos/pastas públicas (acessíveis a todos)
    fileQuery.$or = [
      { owner: req.usuario.id },
      { 'sharedWith.user': req.usuario.id },
      { isPublic: true }
    ];
    
    folderQuery.$or = [
      { owner: req.usuario.id },
      { 'sharedWith.user': req.usuario.id },
      { isPublic: true }
    ];
    
    // Buscar arquivos e pastas
    const files = await File.find(fileQuery)
      .populate('owner', ['nome'])
      .sort({ createdAt: -1 });
      
    const folders = await Folder.find(folderQuery)
      .populate('owner', ['nome'])
      .sort({ name: 1 });
    
    // Log para debug
    console.log(`Usuário ${req.usuario.id} acessando pasta ${folderId || 'root'}`);
    console.log(`Encontrados ${folders.length} pastas e ${files.length} arquivos`);
    
    res.json({ folders, files });
  } catch (err) {
    console.error('Erro ao buscar arquivos:', err.message);
    res.status(500).send('Erro no servidor');
  }
};

const createFolder = async (req, res) => {
  try {
    const { name, parentId } = req.body;
    
    // Verificar se já existe uma pasta com este nome no mesmo local
    const existingFolder = await Folder.findOne({
      name,
      parentId: parentId || null,
      $or: [
        { owner: req.usuario.id },
        { 'sharedWith.user': req.usuario.id, 'sharedWith.access': 'write' }
      ]
    });
    
    if (existingFolder) {
      return res.status(400).json({ msg: 'Já existe uma pasta com este nome neste local' });
    }
    
    // Criar nova pasta - Por padrão, definir como pública para compartilhamento
    const newFolder = new Folder({
      name,
      parentId: parentId || null,
      owner: req.usuario.id,
      isPublic: true // CORREÇÃO: Tornar pastas públicas por padrão
    });
    
    const folder = await newFolder.save();
    res.json(folder);
  } catch (err) {
    console.error('Erro ao criar pasta:', err.message);
    res.status(500).send('Erro no servidor');
  }
};

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'Nenhum arquivo enviado' });
    }
    
    const { folderId } = req.body;
    const file = req.file;
    const fileExt = path.extname(file.originalname).substring(1);
    
    // CORREÇÃO: Arquivos são públicos por padrão para compartilhamento
    const newFile = new File({
      name: path.basename(file.originalname, path.extname(file.originalname)),
      path: file.path,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      extension: fileExt,
      folderId: folderId || null,
      owner: req.usuario.id,
      isPublic: true // CORREÇÃO: Tornar arquivos públicos por padrão
    });
    
    const savedFile = await newFile.save();
    
    // Retornar arquivo com informações do proprietário
    const populatedFile = await File.findById(savedFile._id)
      .populate('owner', ['nome']);
      
    res.json(populatedFile);
  } catch (err) {
    console.error('Erro ao fazer upload de arquivo:', err.message);
    res.status(500).send('Erro no servidor');
  }
};

const downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ msg: 'Arquivo não encontrado' });
    }
    
    // Verificar acesso
    const hasAccess = 
      file.owner.toString() === req.usuario.id || 
      file.isPublic || 
      file.sharedWith.some(share => share.user.toString() === req.usuario.id);
      
    if (!hasAccess) {
      return res.status(401).json({ msg: 'Acesso negado' });
    }
    
    // Verificar se o arquivo físico existe
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ msg: 'Arquivo físico não encontrado' });
    }
    
    // Função para registrar visualização do arquivo - implementação futura
    // await registerFileView(file._id, req.usuario.id);
    
    res.download(file.path, file.originalName);
  } catch (err) {
    console.error('Erro ao baixar arquivo:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Arquivo não encontrado' });
    }
    res.status(500).send('Erro no servidor');
  }
};

// NOVA FUNÇÃO: Obter preview/visualização do arquivo
const getFilePreview = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ msg: 'Arquivo não encontrado' });
    }
    
    // Verificar acesso
    const hasAccess = 
      file.owner.toString() === req.usuario.id || 
      file.isPublic || 
      file.sharedWith.some(share => share.user.toString() === req.usuario.id);
      
    if (!hasAccess) {
      return res.status(401).json({ msg: 'Acesso negado' });
    }
    
    // Verificar se o arquivo físico existe
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ msg: 'Arquivo físico não encontrado' });
    }
    
    // Mapear tipos MIME para tratamento específico
    const mimeType = file.mimeType.toLowerCase();
    
    // 1. Para imagens: enviar diretamente
    if (mimeType.startsWith('image/')) {
      res.setHeader('Content-Type', file.mimeType);
      return fs.createReadStream(file.path).pipe(res);
    }
    
    // 2. Para PDFs: enviar diretamente
    if (mimeType === 'application/pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      return fs.createReadStream(file.path).pipe(res);
    }
    
    // 3. Para vídeos: streaming
    if (mimeType.startsWith('video/')) {
      const stat = fs.statSync(file.path);
      const fileSize = stat.size;
      const range = req.headers.range;
      
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const fileStream = fs.createReadStream(file.path, { start, end });
        
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': file.mimeType
        });
        
        return fileStream.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': file.mimeType
        });
        
        return fs.createReadStream(file.path).pipe(res);
      }
    }
    
    // 4. Para textos: enviar preview
    if (mimeType.startsWith('text/') || 
        mimeType === 'application/json' ||
        mimeType === 'application/xml') {
      res.setHeader('Content-Type', 'text/plain');
      
      // Ler apenas o início do arquivo para preview
      const fileContent = fs.readFileSync(file.path, { encoding: 'utf8', flag: 'r' });
      // Limitar a 10KB para preview
      const preview = fileContent.substring(0, 10240);
      
      return res.send(preview);
    }
    
    // 5. Para outros tipos, enviar informações sobre como baixar
    return res.json({
      fileName: file.originalName,
      fileType: file.mimeType,
      fileSize: file.size,
      message: 'Este tipo de arquivo requer download para visualização'
    });
    
  } catch (err) {
    console.error('Erro ao obter preview do arquivo:', err.message);
    res.status(500).send('Erro no servidor');
  }
};

const shareItem = async (req, res) => {
  try {
    const { itemId, itemType, userId, access } = req.body;
    let item;
    
    if (itemType === 'file') {
      item = await File.findById(itemId);
    } else if (itemType === 'folder') {
      item = await Folder.findById(itemId);
    } else {
      return res.status(400).json({ msg: 'Tipo de item inválido' });
    }
    
    if (!item) {
      return res.status(404).json({ msg: 'Item não encontrado' });
    }
    
    if (item.owner.toString() !== req.usuario.id) {
      return res.status(401).json({ msg: 'Apenas o proprietário pode compartilhar' });
    }
    
    // Atualizar compartilhamento
    const shareIndex = item.sharedWith.findIndex(
      share => share.user.toString() === userId
    );
    
    if (shareIndex !== -1) {
      item.sharedWith[shareIndex].access = access;
    } else {
      item.sharedWith.push({ user: userId, access });
    }
    
    await item.save();
    res.json(item);
  } catch (err) {
    console.error('Erro ao compartilhar item:', err.message);
    res.status(500).send('Erro no servidor');
  }
};

const deleteItem = async (req, res) => {
  try {
    const { itemId, itemType } = req.params;
    let item;
    
    if (itemType === 'file') {
      item = await File.findById(itemId);
      if (!item) {
        return res.status(404).json({ msg: 'Arquivo não encontrado' });
      }
      
      if (item.owner.toString() !== req.usuario.id) {
        return res.status(401).json({ msg: 'Não autorizado' });
      }
      
      if (fs.existsSync(item.path)) {
        fs.unlinkSync(item.path);
      }
      
      await item.deleteOne();
    } else if (itemType === 'folder') {
      item = await Folder.findById(itemId);
      if (!item) {
        return res.status(404).json({ msg: 'Pasta não encontrada' });
      }
      
      if (item.owner.toString() !== req.usuario.id) {
        return res.status(401).json({ msg: 'Não autorizado' });
      }
      
      const deleteFolder = async (folderId) => {
        const files = await File.find({ folderId });
        for (const file of files) {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
          await file.deleteOne();
        }
        
        const subFolders = await Folder.find({ parentId: folderId });
        for (const subFolder of subFolders) {
          await deleteFolder(subFolder._id);
        }
        
        await Folder.findByIdAndDelete(folderId);
      };
      
      await deleteFolder(itemId);
    } else {
      return res.status(400).json({ msg: 'Tipo de item inválido' });
    }
    
    res.json({ msg: 'Item excluído com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir item:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Item não encontrado' });
    }
    res.status(500).send('Erro no servidor');
  }
};

const getFileInfo = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ msg: 'Arquivo não encontrado' });
    }
    
    const hasAccess = 
      file.owner.toString() === req.usuario.id || 
      file.isPublic || 
      file.sharedWith.some(share => share.user.toString() === req.usuario.id);
      
    if (!hasAccess) {
      return res.status(401).json({ msg: 'Acesso negado' });
    }
    
    res.json({
      _id: file._id,
      name: file.name,
      originalName: file.originalName,
      extension: file.extension,
      mimeType: file.mimeType,
      size: file.size,
      createdAt: file.createdAt,
      owner: file.owner
    });
  } catch (err) {
    console.error('Erro ao obter informações do arquivo:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Arquivo não encontrado' });
    }
    res.status(500).send('Erro no servidor');
  }
};

module.exports = { 
  getFiles, 
  createFolder, 
  uploadFile, 
  downloadFile, 
  shareItem, 
  deleteItem,
  getFileInfo,
  getFilePreview // Nova função
};