// controllers/filesController.js - Versão atualizada
const { File, Folder, User } = require('../models');
const path = require('path');
const fs = require('fs');

const getFiles = async (req, res) => {
  try {
    const { folderId } = req.query;
    
    // Obter dados do usuário para filtrar por departamento
    const user = await User.findById(req.usuario.id);
    if (!user) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }
    
    const userDepartment = user.departamento || 'PUBLICO';
    
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
    
    // Aplicar filtros de acesso e departamento
    const accessFilter = {
      $and: [
        {
          $or: [
            { owner: req.usuario.id },
            { 'sharedWith.user': req.usuario.id },
            { isPublic: true }
          ]
        },
        {
          $or: [
            { departamentoVisibilidade: 'TODOS' },
            { departamentoVisibilidade: userDepartment },
            { owner: req.usuario.id } // Proprietário sempre vê seus arquivos
          ]
        }
      ]
    };
    
    fileQuery = { ...fileQuery, ...accessFilter };
    folderQuery = { ...folderQuery, ...accessFilter };
    
    // Buscar arquivos e pastas
    const files = await File.find(fileQuery)
      .populate('owner', ['nome'])
      .sort({ createdAt: -1 });
      
    const folders = await Folder.find(folderQuery)
      .populate('owner', ['nome'])
      .sort({ name: 1 });
    
    console.log(`Usuário ${req.usuario.id} (${userDepartment}) acessando pasta ${folderId || 'root'}`);
    console.log(`Encontrados ${folders.length} pastas e ${files.length} arquivos`);
    
    res.json({ folders, files });
  } catch (err) {
    console.error('Erro ao buscar arquivos:', err.message);
    res.status(500).send('Erro no servidor');
  }
};

const createFolder = async (req, res) => {
  try {
    console.log('=== CREATE FOLDER DEBUG ===');
    console.log('Body recebido:', req.body);
    console.log('Arquivo recebido:', req.file);
    
    const { name, parentId, description, departamentoVisibilidade } = req.body;
    
    console.log('Dados extraídos:', {
      name,
      description,
      parentId,
      departamentoVisibilidade,
      hasFile: !!req.file
    });
    
    // Verificar se já existe uma pasta com este nome no mesmo local
    const existingFolder = await Folder.findOne({
      name,
      parentId: parentId || null,
      $or: [
        { owner: req.usuario.id },
        { 'sharedWith.user': req.usuario.id, 'sharedWith.access': 'edit' }
      ]
    });
    
    if (existingFolder) {
      return res.status(400).json({ msg: 'Já existe uma pasta com este nome neste local' });
    }
    
    // Processar a imagem de capa se foi enviada
    let coverImageUrl = null;
    if (req.file) {
      coverImageUrl = `/uploads/folders/${req.file.filename}`;
    }
    
    // Processar departamentos de visibilidade
    let deptVisibilidade = ['TODOS'];
    if (departamentoVisibilidade) {
      try {
        if (typeof departamentoVisibilidade === 'string') {
          deptVisibilidade = JSON.parse(departamentoVisibilidade);
        } else if (Array.isArray(departamentoVisibilidade)) {
          deptVisibilidade = departamentoVisibilidade;
        }
      } catch (e) {
        console.error('Erro ao processar departamentoVisibilidade:', e);
      }
    }
    
    // Criar nova pasta
    const newFolder = new Folder({
      name,
      description: description || '',
      coverImage: coverImageUrl,
      parentId: parentId || null,
      owner: req.usuario.id,
      departamentoVisibilidade: deptVisibilidade,
      isPublic: deptVisibilidade.includes('TODOS')
    });
    
    const folder = await newFolder.save();
    const populatedFolder = await Folder.findById(folder._id).populate('owner', ['nome']);
    
    res.json(populatedFolder);
  } catch (err) {
    console.error('Erro ao criar pasta:', err.message);
    res.status(500).send('Erro no servidor');
  }
};

const uploadFile = async (req, res) => {
  try {
    const { 
      folderId, 
      description, 
      departamentoVisibilidade, 
      allowDownload,
      type,
      linkUrl,
      linkName
    } = req.body;
    
    console.log('=== UPLOAD FILE DEBUG ===');
    console.log('Body recebido:', req.body);
    console.log('Arquivo recebido:', req.file);
    console.log('Tipo:', type);
    
    // Validar tipo
    const fileType = type || 'file';
    
    if (fileType === 'link') {
      // Para links, não precisamos de arquivo físico
      if (!linkUrl || !linkName) {
        return res.status(400).json({ msg: 'URL e nome são obrigatórios para links' });
      }
      
      // Processar departamentos de visibilidade
      let deptVisibilidade = ['TODOS'];
      if (departamentoVisibilidade) {
        try {
          if (typeof departamentoVisibilidade === 'string') {
            deptVisibilidade = JSON.parse(departamentoVisibilidade);
          } else if (Array.isArray(departamentoVisibilidade)) {
            deptVisibilidade = departamentoVisibilidade;
          }
        } catch (e) {
          console.error('Erro ao processar departamentoVisibilidade:', e);
        }
      }
      
      // Criar link
      const newLink = new File({
        name: linkName,
        description: description || '',
        type: 'link',
        linkUrl: linkUrl,
        folderId: folderId || null,
        owner: req.usuario.id,
        departamentoVisibilidade: deptVisibilidade,
        isPublic: deptVisibilidade.includes('TODOS'),
        allowDownload: false // Links não têm download
      });
      
      const savedLink = await newLink.save();
      const populatedLink = await File.findById(savedLink._id).populate('owner', ['nome']);
      
      return res.json(populatedLink);
    } else {
      // Para arquivos físicos
      if (!req.file) {
        return res.status(400).json({ msg: 'Nenhum arquivo enviado' });
      }
      
      const file = req.file;
      const fileExt = path.extname(file.originalname).substring(1);
      
      // Corrigir encoding do nome
      let fixedName = file.originalname;
      if (fixedName.includes('Ã¡') || fixedName.includes('Ã©') || fixedName.includes('Ã§')) {
        fixedName = Buffer.from(file.originalname, 'latin1').toString('utf8');
      }
      
      // Processar departamentos de visibilidade
      let deptVisibilidade = ['TODOS'];
      if (departamentoVisibilidade) {
        try {
          if (typeof departamentoVisibilidade === 'string') {
            deptVisibilidade = JSON.parse(departamentoVisibilidade);
          } else if (Array.isArray(departamentoVisibilidade)) {
            deptVisibilidade = departamentoVisibilidade;
          }
        } catch (e) {
          console.error('Erro ao processar departamentoVisibilidade:', e);
        }
      }
      
      // Criar arquivo
      const newFile = new File({
        name: path.basename(fixedName, path.extname(fixedName)),
        description: description || '',
        path: file.path,
        originalName: fixedName,
        mimeType: file.mimetype,
        size: file.size,
        extension: fileExt,
        type: 'file',
        folderId: folderId || null,
        owner: req.usuario.id,
        departamentoVisibilidade: deptVisibilidade,
        isPublic: deptVisibilidade.includes('TODOS'),
        allowDownload: allowDownload !== 'false' // Permitir download por padrão
      });
      
      const savedFile = await newFile.save();
      const populatedFile = await File.findById(savedFile._id).populate('owner', ['nome']);
      
      return res.json(populatedFile);
    }
  } catch (err) {
    console.error('Erro ao fazer upload:', err.message);
    res.status(500).send('Erro no servidor');
  }
};

const downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ msg: 'Arquivo não encontrado' });
    }
    
    // Verificar se é um link
    if (file.type === 'link') {
      return res.status(400).json({ msg: 'Este é um link, não um arquivo para download' });
    }
    
    // Verificar se download é permitido
    if (!file.allowDownload) {
      return res.status(403).json({ msg: 'Download não permitido para este arquivo' });
    }
    
    // Verificar acesso
    const user = await User.findById(req.usuario.id);
    const userDepartment = user?.departamento || 'PUBLICO';
    
    const hasAccess = 
      file.owner.toString() === req.usuario.id || 
      file.isPublic || 
      file.sharedWith.some(share => share.user.toString() === req.usuario.id) ||
      file.departamentoVisibilidade.includes('TODOS') ||
      file.departamentoVisibilidade.includes(userDepartment);
      
    if (!hasAccess) {
      return res.status(401).json({ msg: 'Acesso negado' });
    }
    
    // Verificar se o arquivo físico existe
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ msg: 'Arquivo físico não encontrado' });
    }
    
    res.download(file.path, file.originalName);
  } catch (err) {
    console.error('Erro ao baixar arquivo:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Arquivo não encontrado' });
    }
    res.status(500).send('Erro no servidor');
  }
};

const getFilePreview = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ msg: 'Arquivo não encontrado' });
    }
    
    // Se for um link, redirecionar
    if (file.type === 'link') {
      return res.json({
        type: 'link',
        url: file.linkUrl,
        name: file.name,
        description: file.description
      });
    }
    
    // Verificar acesso
    const user = await User.findById(req.usuario.id);
    const userDepartment = user?.departamento || 'PUBLICO';
    
    const hasAccess = 
      file.owner.toString() === req.usuario.id || 
      file.isPublic || 
      file.sharedWith.some(share => share.user.toString() === req.usuario.id) ||
      file.departamentoVisibilidade.includes('TODOS') ||
      file.departamentoVisibilidade.includes(userDepartment);
      
    if (!hasAccess) {
      return res.status(401).json({ msg: 'Acesso negado' });
    }
    
    // Verificar se o arquivo físico existe
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ msg: 'Arquivo físico não encontrado' });
    }
    
    // Resto da lógica de preview permanece igual...
    const mimeType = file.mimeType.toLowerCase();
    
    if (mimeType.startsWith('image/')) {
      res.setHeader('Content-Type', file.mimeType);
      return fs.createReadStream(file.path).pipe(res);
    }
    
    if (mimeType === 'application/pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      return fs.createReadStream(file.path).pipe(res);
    }
    
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
    
    if (mimeType.startsWith('text/') || 
        mimeType === 'application/json' ||
        mimeType === 'application/xml') {
      res.setHeader('Content-Type', 'text/plain');
      
      const fileContent = fs.readFileSync(file.path, { encoding: 'utf8', flag: 'r' });
      const preview = fileContent.substring(0, 10240);
      
      return res.send(preview);
    }
    
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

// Resto das funções permanecem iguais...
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
      
      // Deletar arquivo físico apenas se for um arquivo, não um link
      if (item.type === 'file' && item.path && fs.existsSync(item.path)) {
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
        const folder = await Folder.findById(folderId);
        if (!folder) return;
        
        if (folder.coverImage) {
          try {
            const imagePath = folder.coverImage.replace(/^\/uploads\//, '');
            const fullImagePath = path.join(__dirname, '..', 'uploads', imagePath);
            
            if (fs.existsSync(fullImagePath)) {
              fs.unlinkSync(fullImagePath);
            }
          } catch (err) {
            console.error(`Erro ao deletar imagem de capa: ${err.message}`);
          }
        }
        
        const files = await File.find({ folderId });
        for (const file of files) {
          if (file.type === 'file' && file.path && fs.existsSync(file.path)) {
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
    
    const user = await User.findById(req.usuario.id);
    const userDepartment = user?.departamento || 'PUBLICO';
    
    const hasAccess = 
      file.owner.toString() === req.usuario.id || 
      file.isPublic || 
      file.sharedWith.some(share => share.user.toString() === req.usuario.id) ||
      file.departamentoVisibilidade.includes('TODOS') ||
      file.departamentoVisibilidade.includes(userDepartment);
      
    if (!hasAccess) {
      return res.status(401).json({ msg: 'Acesso negado' });
    }
    
    res.json({
      _id: file._id,
      name: file.name,
      description: file.description,
      originalName: file.originalName,
      extension: file.extension,
      mimeType: file.mimeType,
      size: file.size,
      type: file.type,
      linkUrl: file.linkUrl,
      allowDownload: file.allowDownload,
      departamentoVisibilidade: file.departamentoVisibilidade,
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
  getFilePreview
};