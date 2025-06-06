// controllers/filesController.js - Versão Corrigida
const { File, Folder, User } = require('../models');
const path = require('path');
const fs = require('fs');

// CORREÇÃO na função getFiles - Garantir que allowRAG seja retornado
const getFiles = async (req, res) => {
  try {
    const { folderId } = req.query;
    
    console.log('=== GET FILES DEBUG (RAG) ===');
    console.log('folderId:', folderId);
    console.log('usuarioId:', req.usuario.id);
    
    // Obter dados do usuário para verificar permissões
    const user = await User.findById(req.usuario.id);
    if (!user) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }
    
    const userDepartment = user.departamento || 'PUBLICO';
    const isAdmin = user.roles?.includes('admin') || false;
    
    console.log('Usuário:', {
      id: user._id,
      nome: user.nome,
      departamento: userDepartment,
      isAdmin,
      roles: user.roles
    });
    
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

    console.log('DEBUG - User department:', userDepartment);
    console.log('DEBUG - Is admin:', isAdmin);

    // Para admins, não aplicar filtros de acesso
    if (!isAdmin) {
      const accessConditions = [
        { owner: req.usuario.id },
        { 'sharedWith.user': req.usuario.id },
        { isPublic: true },
        { departamentoVisibilidade: { $in: ['TODOS'] } },
        { departamentoVisibilidade: { $in: [userDepartment] } },
        { departamentoVisibilidade: { $exists: false } },
        { departamentoVisibilidade: { $eq: [] } }
      ];
      
      fileQuery.$or = accessConditions;
      folderQuery.$or = accessConditions;
    }

    console.log('DEBUG - File query:', JSON.stringify(fileQuery, null, 2));
    console.log('DEBUG - Folder query:', JSON.stringify(folderQuery, null, 2));
    
    // CORREÇÃO: Buscar arquivos e pastas com TODOS os campos, incluindo allowRAG
    const files = await File.find(fileQuery)
      .populate('owner', ['nome', 'departamento'])
      .sort({ createdAt: -1 });
      
    const folders = await Folder.find(folderQuery)
      .populate('owner', ['nome', 'departamento'])
      .sort({ name: 1 });
    
    console.log(`Encontrados ${folders.length} pastas e ${files.length} arquivos`);
    
    // CORREÇÃO: Log detalhado para verificar allowRAG
    console.log('=== VERIFICAÇÃO ALLOWRAG ===');
    folders.forEach((folder, index) => {
      console.log(`Pasta ${index + 1}: ${folder.name}`, {
        id: folder._id,
        allowRAG: folder.allowRAG,
        allowRAGType: typeof folder.allowRAG,
        allowRAGValue: String(folder.allowRAG),
        owner: folder.owner?.nome,
        departamentoVisibilidade: folder.departamentoVisibilidade,
        isPublic: folder.isPublic
      });
    });
    
    files.forEach((file, index) => {
      console.log(`Arquivo ${index + 1}: ${file.name}`, {
        id: file._id,
        type: file.type,
        allowRAG: file.allowRAG,
        allowRAGType: typeof file.allowRAG,
        allowRAGValue: String(file.allowRAG),
        owner: file.owner?.nome,
        departamentoVisibilidade: file.departamentoVisibilidade,
        isPublic: file.isPublic
      });
    });
    
    // CORREÇÃO: Garantir que allowRAG seja incluído na resposta
    const responseData = {
      folders: folders.map(folder => ({
        _id: folder._id,
        name: folder.name,
        description: folder.description,
        coverImage: folder.coverImage,
        parentId: folder.parentId,
        owner: folder.owner,
        departamentoVisibilidade: folder.departamentoVisibilidade,
        isPublic: folder.isPublic,
        allowRAG: Boolean(folder.allowRAG), // CORREÇÃO: Garantir que seja boolean
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt
      })),
      files: files.map(file => ({
        _id: file._id,
        name: file.name,
        description: file.description,
        type: file.type,
        size: file.size,
        extension: file.extension,
        mimeType: file.mimeType,
        originalName: file.originalName,
        linkUrl: file.linkUrl,
        allowDownload: file.allowDownload,
        allowRAG: Boolean(file.allowRAG), // CORREÇÃO: Garantir que seja boolean
        folderId: file.folderId,
        owner: file.owner,
        departamentoVisibilidade: file.departamentoVisibilidade,
        isPublic: file.isPublic,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt
      }))
    };
    
    console.log('=== RESPOSTA FINAL ===');
    console.log('Pastas com allowRAG:', responseData.folders.filter(f => f.allowRAG).map(f => f.name));
    console.log('Arquivos com allowRAG:', responseData.files.filter(f => f.allowRAG).map(f => f.name));
    
    res.json(responseData);
  } catch (err) {
    console.error('Erro ao buscar arquivos:', err.message);
    res.status(500).json({ msg: 'Erro no servidor', error: err.message });
  }
};

const createFolder = async (req, res) => {
  try {
    console.log('=== CREATE FOLDER DEBUG ===');
    console.log('Body recebido:', req.body);
    console.log('Arquivo recebido:', req.file);
    
    const { name, parentId, description, departamentoVisibilidade, allowRAG } = req.body;
    
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
      parentId: parentId || null
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
    // Processar flag RAG
let ragEnabled = false;
if (allowRAG !== undefined) {
  ragEnabled = allowRAG === 'true' || allowRAG === true;
}

console.log('Processando allowRAG:', { allowRAG, ragEnabled });

const newFolder = new Folder({
  name,
  description: description || '',
  coverImage: coverImageUrl,
  parentId: parentId || null,
  owner: req.usuario.id,
  departamentoVisibilidade: deptVisibilidade,
  isPublic: deptVisibilidade.includes('TODOS'),
  allowRAG: ragEnabled  // ADICIONAR ESTA LINHA
});
    
    const folder = await newFolder.save();
    const populatedFolder = await Folder.findById(folder._id).populate('owner', ['nome', 'departamento']);
    
    console.log('Pasta criada:', populatedFolder);
    res.json(populatedFolder);
  } catch (err) {
    console.error('Erro ao criar pasta:', err.message);
    res.status(500).json({ msg: 'Erro no servidor', error: err.message });
  }
};

const uploadFile = async (req, res) => {
  try {
    const { 
      folderId, 
      description, 
      departamentoVisibilidade, 
      allowDownload,
      allowRAG,
      type,
      linkUrl,
      linkName
    } = req.body;
    
    console.log('=== UPLOAD FILE DEBUG ===');
    console.log('Body recebido:', req.body);
    console.log('Arquivo recebido:', req.file);
    console.log('Tipo:', type);
    console.log('Allow RAG:', allowRAG);
    
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
      
      // Processar flag RAG
      const ragEnabled = allowRAG === 'true' || allowRAG === true;
      
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
        allowDownload: false, // Links não têm download
        allowRAG: ragEnabled
      });
      
      const savedLink = await newLink.save();
      const populatedLink = await File.findById(savedLink._id).populate('owner', ['nome', 'departamento']);
      
      console.log('Link criado:', populatedLink);
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
      
      // Processar flag RAG
      let ragEnabled = allowRAG === 'true' || allowRAG === true;
      
      // Se o arquivo está sendo criado dentro de uma pasta, herdar a configuração RAG da pasta
      if (folderId && !allowRAG) {
        try {
          const parentFolder = await Folder.findById(folderId);
          if (parentFolder && parentFolder.allowRAG) {
            ragEnabled = true;
            console.log('Herdando flag RAG da pasta pai:', parentFolder.name);
          }
        } catch (err) {
          console.error('Erro ao buscar pasta pai para herdar flag RAG:', err.message);
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
        allowDownload: allowDownload !== 'false', // Permitir download por padrão
        allowRAG: ragEnabled
      });
      
      const savedFile = await newFile.save();
      const populatedFile = await File.findById(savedFile._id).populate('owner', ['nome', 'departamento']);
      
      console.log('Arquivo criado:', populatedFile);
      return res.json(populatedFile);
    }
  } catch (err) {
    console.error('Erro ao fazer upload:', err.message);
    res.status(500).json({ msg: 'Erro no servidor', error: err.message });
  }
};

const downloadFile = async (req, res) => {
  try {
    console.log('=== DOWNLOAD FILE DEBUG ===');
    console.log('fileId:', req.params.id);
    console.log('usuarioId:', req.usuario.id);
    
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
    
    // Verificar acesso - CORREÇÃO: Permitir acesso para admins
    const user = await User.findById(req.usuario.id);
    const userDepartment = user?.departamento || 'PUBLICO';
    const isAdmin = user?.roles?.includes('admin') || false;
    
    console.log('Verificação de acesso:', {
      fileOwner: file.owner.toString(),
      currentUser: req.usuario.id,
      isOwner: file.owner.toString() === req.usuario.id,
      isPublic: file.isPublic,
      userDepartment,
      fileDepartments: file.departamentoVisibilidade,
      isAdmin
    });
    
    const hasAccess = 
      isAdmin || // Admin pode baixar qualquer arquivo
      file.owner.toString() === req.usuario.id || 
      file.isPublic || 
      file.sharedWith.some(share => share.user.toString() === req.usuario.id) ||
      file.departamentoVisibilidade.includes('TODOS') ||
      file.departamentoVisibilidade.includes(userDepartment);
      
    if (!hasAccess) {
      console.log('Acesso negado ao download');
      return res.status(401).json({ msg: 'Acesso negado' });
    }
    
    // Verificar se o arquivo físico existe
    if (!fs.existsSync(file.path)) {
      console.log('Arquivo físico não encontrado:', file.path);
      return res.status(404).json({ msg: 'Arquivo físico não encontrado' });
    }
    
    console.log('Download autorizado, enviando arquivo');
    res.download(file.path, file.originalName);
  } catch (err) {
    console.error('Erro ao baixar arquivo:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Arquivo não encontrado' });
    }
    res.status(500).json({ msg: 'Erro no servidor', error: err.message });
  }
};

const getFilePreview = async (req, res) => {
  try {
    console.log('=== GET FILE PREVIEW DEBUG ===');
    console.log('fileId:', req.params.id);
    console.log('usuarioId:', req.usuario?.id);
    console.log('Query params:', req.query);
    
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ msg: 'Arquivo não encontrado' });
    }
    
    console.log('Arquivo encontrado:', {
      id: file._id,
      name: file.name,
      owner: file.owner,
      type: file.type,
      departamentoVisibilidade: file.departamentoVisibilidade,
      isPublic: file.isPublic
    });
    
    // Se for um link, retornar informações do link
    if (file.type === 'link') {
      return res.json({
        type: 'link',
        url: file.linkUrl,
        name: file.name,
        description: file.description
      });
    }
    
    // Buscar dados do usuário - CORREÇÃO: Verificar se req.usuario existe
    if (!req.usuario || !req.usuario.id) {
      console.log('ERRO: Usuário não autenticado no preview');
      return res.status(401).json({ msg: 'Não autenticado' });
    }
    
    const { User } = require('../models');
    const user = await User.findById(req.usuario.id);
    if (!user) {
      console.log('ERRO: Usuário não encontrado no banco');
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }
    
    const userDepartment = user?.departamento || 'PUBLICO';
    const isAdmin = user?.roles?.includes('admin') || false;
    
    console.log('Dados do usuário para preview:', {
      userId: user._id,
      userDepartment,
      isAdmin,
      userRoles: user.roles
    });
    
    // CORREÇÃO: Lógica simplificada de acesso
    let hasAccess = false;
    
    // Admin pode ver tudo
    if (isAdmin) {
      hasAccess = true;
      console.log('Acesso liberado: usuário é admin');
    }
    // Proprietário pode ver
    else if (file.owner.toString() === req.usuario.id) {
      hasAccess = true;
      console.log('Acesso liberado: usuário é proprietário');
    }
    // Se é público
    else if (file.isPublic) {
      hasAccess = true;
      console.log('Acesso liberado: arquivo é público');
    }
    // Se está compartilhado diretamente
    else if (file.sharedWith && file.sharedWith.some(share => share.user.toString() === req.usuario.id)) {
      hasAccess = true;
      console.log('Acesso liberado: arquivo compartilhado');
    }
    // Se departamentoVisibilidade contém TODOS
    else if (file.departamentoVisibilidade && file.departamentoVisibilidade.includes('TODOS')) {
      hasAccess = true;
      console.log('Acesso liberado: visível para TODOS');
    }
    // Se departamentoVisibilidade contém o departamento do usuário
    else if (file.departamentoVisibilidade && userDepartment && file.departamentoVisibilidade.includes(userDepartment)) {
      hasAccess = true;
      console.log('Acesso liberado: visível para departamento do usuário');
    }
    // Se não tem departamentoVisibilidade (sem restrições)
    else if (!file.departamentoVisibilidade || file.departamentoVisibilidade.length === 0) {
      hasAccess = true;
      console.log('Acesso liberado: sem restrições de departamento');
    }
    
    if (!hasAccess) {
      console.log('ACESSO NEGADO ao preview');
      console.log('Detalhes:', {
        fileOwner: file.owner.toString(),
        requestUserId: req.usuario.id,
        isOwner: file.owner.toString() === req.usuario.id,
        isPublic: file.isPublic,
        fileDepartments: file.departamentoVisibilidade,
        userDepartment,
        isAdmin
      });
      return res.status(403).json({ msg: 'Acesso negado' });
    }
    
    console.log('ACESSO PERMITIDO ao preview');
    
    // Verificar se o arquivo físico existe
    const fs = require('fs');
    if (!fs.existsSync(file.path)) {
      console.log('Arquivo físico não encontrado:', file.path);
      return res.status(404).json({ msg: 'Arquivo físico não encontrado' });
    }
    
    console.log('Preview autorizado, servindo arquivo');
    
    // CORREÇÃO: Definir headers apropriados para evitar problemas de CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, x-auth-token');
    
    // Lógica de preview baseada no tipo MIME
    const mimeType = file.mimeType.toLowerCase();
    
    if (mimeType.startsWith('image/')) {
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return fs.createReadStream(file.path).pipe(res);
    }
    
    if (mimeType === 'application/pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Cache-Control', 'public, max-age=3600');
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
          'Content-Type': file.mimeType,
          'Access-Control-Allow-Origin': '*'
        });
        
        return fileStream.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': file.mimeType,
          'Accept-Ranges': 'bytes',
          'Access-Control-Allow-Origin': '*'
        });
        
        return fs.createReadStream(file.path).pipe(res);
      }
    }
    
    if (mimeType.startsWith('audio/')) {
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return fs.createReadStream(file.path).pipe(res);
    }
    
    if (mimeType.startsWith('text/') || 
        mimeType === 'application/json' ||
        mimeType === 'application/xml') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      const fileContent = fs.readFileSync(file.path, { encoding: 'utf8', flag: 'r' });
      const preview = fileContent.substring(0, 10240); // Primeiros 10KB
      
      return res.send(preview);
    }
    
    // Para outros tipos, retornar informações do arquivo
    return res.json({
      fileName: file.originalName,
      fileType: file.mimeType,
      fileSize: file.size,
      message: 'Este tipo de arquivo requer download para visualização'
    });
    
  } catch (err) {
    console.error('Erro ao obter preview do arquivo:', err.message);
    res.status(500).json({ msg: 'Erro no servidor', error: err.message });
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
    
    // CORREÇÃO: Verificar se é proprietário ou admin
    const user = await User.findById(req.usuario.id);
    const isAdmin = user?.roles?.includes('admin') || false;
    
    if (!isAdmin && item.owner.toString() !== req.usuario.id) {
      return res.status(401).json({ msg: 'Apenas o proprietário ou administradores podem compartilhar' });
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
    res.status(500).json({ msg: 'Erro no servidor', error: err.message });
  }
};

const deleteItem = async (req, res) => {
  try {
    const { itemId, itemType } = req.params;
    
    console.log('=== DELETE ITEM DEBUG ===');
    console.log('itemId:', itemId);
    console.log('itemType:', itemType);
	console.log('req.params:', req.params);
    console.log('req.url:', req.url);
    console.log('usuarioId:', req.usuario.id);
    
    let item;
    
    if (itemType === 'file' || itemType === 'link') { // MODIFICADO: aceitar tanto 'file' quanto 'link'
      item = await File.findById(itemId);
      if (!item) {
        return res.status(404).json({ msg: 'Arquivo não encontrado' });
      }
      
      // CORREÇÃO: Verificar se é proprietário ou admin
      const user = await User.findById(req.usuario.id);
      const isAdmin = user?.roles?.includes('admin') || false;
      
      console.log('Verificação de permissão:', {
        isAdmin,
        isOwner: item.owner.toString() === req.usuario.id,
        fileOwner: item.owner.toString(),
        currentUser: req.usuario.id
      });
      
      if (!isAdmin && item.owner.toString() !== req.usuario.id) {
        return res.status(401).json({ msg: 'Não autorizado' });
      }
      
      // Deletar arquivo físico apenas se for um arquivo, não um link
      if (item.type === 'file' && item.path && fs.existsSync(item.path)) {
        console.log('Deletando arquivo físico:', item.path);
        fs.unlinkSync(item.path);
      }
      
      await item.deleteOne();
      console.log('Arquivo excluído do banco de dados');
      
    } else if (itemType === 'folder') {
      item = await Folder.findById(itemId);
      if (!item) {
        return res.status(404).json({ msg: 'Pasta não encontrada' });
      }
      
      // CORREÇÃO: Verificar se é proprietário ou admin
      const user = await User.findById(req.usuario.id);
      const isAdmin = user?.roles?.includes('admin') || false;
      
      if (!isAdmin && item.owner.toString() !== req.usuario.id) {
        return res.status(401).json({ msg: 'Não autorizado' });
      }
      
      const deleteFolder = async (folderId) => {
        const folder = await Folder.findById(folderId);
        if (!folder) return;
        
        console.log('Deletando pasta:', folder.name);
        
        // Deletar imagem de capa se existir
        if (folder.coverImage) {
          try {
            const imagePath = folder.coverImage.replace(/^\/uploads\//, '');
            const fullImagePath = path.join(__dirname, '..', 'uploads', imagePath);
            
            if (fs.existsSync(fullImagePath)) {
              console.log('Deletando imagem de capa:', fullImagePath);
              fs.unlinkSync(fullImagePath);
            }
          } catch (err) {
            console.error(`Erro ao deletar imagem de capa: ${err.message}`);
          }
        }
        
        // Deletar todos os arquivos da pasta
        const files = await File.find({ folderId });
        for (const file of files) {
          console.log('Deletando arquivo da pasta:', file.name);
          if (file.type === 'file' && file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
          await file.deleteOne();
        }
        
        // Deletar subpastas recursivamente
        const subFolders = await Folder.find({ parentId: folderId });
        for (const subFolder of subFolders) {
          await deleteFolder(subFolder._id);
        }
        
        // Deletar a pasta
        await Folder.findByIdAndDelete(folderId);
      };
      
      await deleteFolder(itemId);
      console.log('Pasta e conteúdo excluídos');
      
    } else {
      return res.status(400).json({ msg: 'Tipo de item inválido' });
    }
    
    res.json({ msg: 'Item excluído com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir item:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Item não encontrado' });
    }
    res.status(500).json({ msg: 'Erro no servidor', error: err.message });
  }
};

const getFileInfo = async (req, res) => {
  try {
    console.log('=== GET FILE INFO DEBUG ===');
    console.log('fileId:', req.params.id);
    console.log('usuarioId:', req.usuario.id);
    
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ msg: 'Arquivo não encontrado' });
    }
    
    // Verificar acesso - CORREÇÃO: Permitir acesso para admins
    const user = await User.findById(req.usuario.id);
    const userDepartment = user?.departamento || 'PUBLICO';
    const isAdmin = user?.roles?.includes('admin') || false;
    
    const hasAccess = 
      isAdmin || // Admin pode ver qualquer arquivo
      file.owner.toString() === req.usuario.id || 
      file.isPublic || 
      file.sharedWith.some(share => share.user.toString() === req.usuario.id) ||
      file.departamentoVisibilidade.includes('TODOS') ||
      file.departamentoVisibilidade.includes(userDepartment);
      
    if (!hasAccess) {
      console.log('Acesso negado às informações do arquivo');
      return res.status(401).json({ msg: 'Acesso negado' });
    }
    
    console.log('Acesso autorizado às informações do arquivo');
    
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
    res.status(500).json({ msg: 'Erro no servidor', error: err.message });
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