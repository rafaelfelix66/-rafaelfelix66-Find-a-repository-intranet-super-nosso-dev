const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const fs = require('fs');
//jobs
const { startBackupScheduler } = require('./jobs/backupScheduler');
const { scheduleSuperCoinsRecharge } = require('./jobs/superCoinsRechargeJob');



// Importar modelos
const { User, File, Message, Chat, Folder } = require('./models');
const InstitutionalArea = require('./models/InstitutionalArea');

// Configuração do app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Definir caminhos de diretórios para uploads
const uploadsPath = path.join(__dirname, 'uploads');
const uploadsTimelinePath = path.join(uploadsPath, 'timeline');
const uploadsDir = path.join(__dirname, 'uploads');
const publicPath = path.join(__dirname, 'public');


// Garantir que o diretório public existe para placeholder
if (!fs.existsSync(publicPath)) {
  fs.mkdirSync(publicPath, { recursive: true });
  console.log(`Diretório ${publicPath} criado com sucesso`);
  
  // Criar um placeholder de exemplo se não existir
  const placeholderPath = path.join(publicPath, 'placeholder.png');
  if (!fs.existsSync(placeholderPath)) {
    try {
      // Criar um arquivo de placeholder simples (1x1 pixel transparente em base64)
      const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(placeholderPath, buffer);
      console.log(`Arquivo placeholder criado: ${placeholderPath}`);
    } catch (err) {
      console.error(`Erro ao criar placeholder: ${err.message}`);
    }
  }
}

// Garantir que todos os diretórios de upload existam
const createRequiredDirs = () => {
  const dirs = [
    uploadsPath,
    path.join(uploadsPath, 'chat'),
    path.join(uploadsPath, 'files'),
    path.join(uploadsPath, 'knowledge'),
    path.join(uploadsPath, 'timeline'),
    path.join(uploadsPath, 'banners'),
	path.join(uploadsPath, 'institutional')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Diretório ${dir} criado com sucesso`);
      } catch (err) {
        console.error(`Erro ao criar diretório ${dir}:`, err);
      }
    }
  });
};

createRequiredDirs();

// Middleware para logging de requisições
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, {
    headers: {
      'content-type': req.headers['content-type'],
      'authorization': req.headers['authorization'] ? 'Bearer [REDACTED]' : 'none'
    },
    body: req.body ? '[PRESENT]' : '[EMPTY]'
  });
  next();
});

// Configuração de CORS para desenvolvimento e produção
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Origem não permitida pelo CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  exposedHeaders: ['Content-Length', 'X-Requested-With', 'Authorization'],
  optionsSuccessStatus: 204
};

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/admin', require('./routes/admin'));

// Configuração do MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://admin:admin123@mongodb:27017/intranet?authSource=admin';

mongoose
  .connect(mongoURI)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch((err) => console.error('Erro ao conectar ao MongoDB:', err));

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Middleware para verificar token (unificado)
const verificarToken = (req, res, next) => {
  console.log('Método:', req.method, 'URL:', req.url);
  const token = req.headers['x-auth-token'] || req.headers['authorization']?.split(' ')[1];
  console.log('Token recebido:', token ? 'Presente (oculto)' : 'Ausente');
  if (!token) {
    console.log('Erro: Token não fornecido');
    return res.status(401).json({ mensagem: 'Token não fornecido' });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('Erro: Token inválido', err.message);
      return res.status(403).json({ mensagem: 'Token inválido' });
    }
    console.log('Token válido, usuário:', decoded.id);
    req.usuario = decoded;
    next();
  });
};

// Configuração para servir arquivos estáticos com tratamento de erros melhorado
// Middleware para uploads/timeline (mais específico primeiro)
app.use('/uploads/timeline', (req, res, next) => {
  const filename = req.path.replace(/^\/+/, '');
  const filePath = path.join(uploadsTimelinePath, filename);
  
  console.log(`Requisição para arquivo de timeline: ${filename}`);
  console.log(`Caminho completo: ${filePath}`);
  
  // Verificar se o arquivo existe
  fs.access(filePath, fs.constants.R_OK, (err) => {
    if (err) {
      console.error(`Arquivo não encontrado: ${filePath}`);
      console.error(`Erro: ${err.message}`);
      
      // Fornecer um placeholder para imagens que não existem
      if (req.path.match(/\.(jpg|jpeg|png|gif)$/i)) {
        const placeholderPath = path.join(publicPath, 'placeholder.png');
        
        if (fs.existsSync(placeholderPath)) {
          console.log(`Servindo placeholder para ${req.path}`);
          return res.sendFile(placeholderPath);
        }
      }
    }
    next();
  });
});

// Middleware para uploads gerais (depois do específico)
app.use('/uploads', (req, res, next) => {
  const reqPath = req.path;
  const fullPath = path.join(uploadsPath, reqPath);
  
  console.log(`[DEBUG] Requisição de arquivo: ${reqPath}`);
  console.log(`[DEBUG] Caminho completo: ${fullPath}`);
  
  // Verificar se o arquivo existe
  fs.access(fullPath, fs.constants.R_OK, (err) => {
    if (err) {
      console.error(`[DEBUG] ERRO: Arquivo não acessível: ${fullPath}`);
      console.error(`[DEBUG] Erro: ${err.message}`);
      
      // Em vez de falhar, servir uma imagem de placeholder
      if (reqPath.match(/\.(jpg|jpeg|png|gif)$/i)) {
        // Para imagens, enviar um placeholder
        const placeholderPath = path.join(publicPath, 'placeholder.png');
        
        if (fs.existsSync(placeholderPath)) {
          console.log(`[DEBUG] Servindo placeholder para ${reqPath}`);
          return res.sendFile(placeholderPath);
        }
      }
    } else {
      console.log(`[DEBUG] Arquivo encontrado e acessível: ${fullPath}`);
    }
    next();
  });
});

// Configuração para servir arquivos estáticos (após os middlewares)
app.use('/uploads/timeline', express.static(path.join(__dirname, 'uploads/timeline')));
app.use('/uploads/banners', express.static(path.join(__dirname, 'uploads/banners')));
app.use('/uploads/avatars', express.static(path.join(__dirname, 'uploads/avatars')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/folders', express.static(path.join(__dirname, 'uploads/folders')));
app.use('/uploads/emojis', express.static(path.join(__dirname, 'uploads/emojis')));
app.use('/uploads/institutional', express.static(path.join(__dirname, 'uploads/institutional')));

// Rota de diagnóstico para verificar arquivos
app.get('/api/check-file', (req, res) => {
  const filePath = req.query.path;
  if (!filePath) {
    return res.status(400).json({ error: 'Caminho do arquivo não fornecido' });
  }
  
  const fullPath = path.join(__dirname, filePath.startsWith('/') ? filePath.substring(1) : filePath);
  
  fs.access(fullPath, fs.constants.R_OK, (err) => {
    if (err) {
      // Criar diretório se não existir
      const dirPath = path.dirname(fullPath);
      if (!fs.existsSync(dirPath)) {
        try {
          fs.mkdirSync(dirPath, { recursive: true });
          console.log(`Diretório ${dirPath} criado para futuros uploads`);
        } catch (mkdirErr) {
          console.error(`Erro ao criar diretório ${dirPath}:`, mkdirErr);
        }
      }
      
      return res.status(404).json({ 
        error: 'Arquivo não encontrado ou não acessível',
        path: fullPath,
        exists: false,
        message: err.message,
        parentDirExists: fs.existsSync(dirPath)
      });
    }
    
    fs.stat(fullPath, (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao obter informações do arquivo', message: err.message });
      }
      
      res.json({
        exists: true,
        path: fullPath,
        size: stats.size,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        created: stats.birthtime,
        modified: stats.mtime
      });
    });
  });
});

// Acesso público para visualização de arquivos
app.get('/public/files/preview/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    console.log(`Requisição de visualização pública para arquivo ${fileId}`);
    
    // Buscar o arquivo no banco de dados
    const file = await File.findById(fileId);
    if (!file) {
      console.error(`Arquivo ${fileId} não encontrado`);
      return res.status(404).send('Arquivo não encontrado');
    }
    
    // Verificar se o arquivo é público
    if (!file.isPublic) {
      console.error(`Arquivo ${fileId} não é público`);
      return res.status(403).send('Arquivo não é público');
    }
    
    // Verificar se o arquivo físico existe
    if (!fs.existsSync(file.path)) {
      console.error(`Arquivo físico ${file.path} não encontrado`);
      return res.status(404).send('Arquivo físico não encontrado');
    }
    
    // Determinar o tipo de conteúdo
    const mimeType = file.mimeType.toLowerCase();
    
    // Definir cabeçalhos apropriados
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
    
    // Para vídeos, implementar streaming
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
        
        fileStream.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': file.mimeType
        });
        
        fs.createReadStream(file.path).pipe(res);
      }
      
      return;
    }
    
    // Para outros tipos de arquivos, enviar diretamente
    fs.createReadStream(file.path).pipe(res);
    
    // Registrar visualização
    console.log(`Arquivo ${fileId} visualizado publicamente`);
    
  } catch (err) {
    console.error('Erro ao visualizar arquivo público:', err.message);
    res.status(500).send('Erro interno do servidor');
  }
});

// Debug de arquivos na pasta uploads
fs.readdir(uploadsPath, (err, files) => {
  if (err) {
    console.error('Erro ao ler diretório de uploads:', err);
  } else {
    console.log('Arquivos na pasta uploads:', files);
    
    // Verificar pasta timeline especificamente
    if (fs.existsSync(uploadsTimelinePath)) {
      fs.readdir(uploadsTimelinePath, (err, timelineFiles) => {
        if (err) {
          console.error('Erro ao ler diretório de timeline:', err);
        } else {
          console.log('Arquivos na pasta timeline:', timelineFiles);
        }
      });
    } else {
      console.error('Pasta uploads/timeline não existe!');
      fs.mkdirSync(uploadsTimelinePath, { recursive: true });
      console.log('Pasta uploads/timeline criada');
    }
  }
});

// Configuração específica para pré-voo de upload de arquivos
app.options('/api/files/upload', cors(corsOptions));

// Rotas
const llmRoutes = require('./routes/llm');
const engagementRoutes = require('./routes/engagement');
const notificationRoutes = require('./routes/notifications');
app.use('/api/auth', require('./routes/auth'));
app.use('/api/timeline', require('./routes/timeline'));
app.use('/api/knowledge', require('./routes/knowledge'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/files', require('./routes/files'));
app.use('/api/banners', require('./routes/banners'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/admin/engagement', require('./routes/adminEngagement'));
app.use('/api/supercoins', require('./routes/supercoins'));
app.use('/api/institutional', require('./routes/institutional'));
app.use('/api/llm', llmRoutes);
app.use('/api/engagement', engagementRoutes);
app.use('/api/notifications', notificationRoutes);



// Rotas de autenticação
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nome, email, senha, cargo, departamento } = req.body;
    const usuarioExistente = await User.findOne({ email });
    if (usuarioExistente) return res.status(400).json({ mensagem: 'Email já cadastrado' });
    const novoUsuario = new User({ nome, email, senha, cargo, departamento });
    await novoUsuario.save();
    const token = jwt.sign(
      { id: novoUsuario._id, email, nome },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.status(201).json({ mensagem: 'Usuário registrado com sucesso', token });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao registrar usuário', error: error.message });
  }
});

app.get('/api/auth/user', verificarToken, async (req, res) => {
  try {
    const usuario = await User.findById(req.usuario.id, '-senha');
    if (!usuario) return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar usuário', error: error.message });
  }
});    
 
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    // Verificar se o usuário existe
    const usuario = await User.findOne({ email });
    if (!usuario) return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    
    // Verificar senha (em produção, compare com bcrypt)
    if (usuario.senha !== senha) return res.status(401).json({ mensagem: 'Senha incorreta' });
    
    // Atualizar último acesso
    usuario.ultimoAcesso = new Date();
    await usuario.save();
    
    // Gerar token JWT
    const token = jwt.sign(
      { id: usuario._id, email: usuario.email, nome: usuario.nome },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        cargo: usuario.cargo,
        departamento: usuario.departamento,
        avatar: usuario.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro no login', error: error.message });
  }
});

// Rotas de usuários
app.get('/api/usuarios', verificarToken, async (req, res) => {
  try {
    const usuarios = await User.find({}, '-senha');
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar usuários', error: error.message });
  }
});

app.get('/api/usuarios/eu', verificarToken, async (req, res) => {
  try {
    const usuario = await User.findById(req.usuario.id, '-senha');
    if (!usuario) return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar usuário', error: error.message });
  }
});

// Rotas de arquivos
app.post('/api/arquivos/upload', verificarToken, upload.single('arquivo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ mensagem: 'Nenhum arquivo enviado' });
    
    const novoArquivo = new File({
      nome: req.file.originalname,
      tipo: req.file.mimetype,
      tamanho: req.file.size,
      urlArquivo: `/uploads/${req.file.filename}`,
      proprietarioId: req.usuario.id,
      tags: req.body.tags ? req.body.tags.split(',') : []
    });
    
    await novoArquivo.save();
    
    res.status(201).json(novoArquivo);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao fazer upload', error: error.message });
  }
});

app.get('/api/arquivos', verificarToken, async (req, res) => {
  try {
    const arquivos = await File.find({
      $or: [
        { proprietarioId: req.usuario.id },
        { compartilhadoCom: req.usuario.id }
      ]
    });
    
    res.json(arquivos);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar arquivos', error: error.message });
  }
});

app.post('/api/arquivos/compartilhar/:id', verificarToken, async (req, res) => {
  try {
    const { usuariosIds } = req.body;
    
    const arquivo = await File.findById(req.params.id);
    if (!arquivo) return res.status(404).json({ mensagem: 'Arquivo não encontrado' });
    
    if (arquivo.proprietarioId !== req.usuario.id) {
      return res.status(403).json({ mensagem: 'Você não tem permissão para compartilhar este arquivo' });
    }
    
    // Adicionar usuários na lista de compartilhamento
    arquivo.compartilhadoCom = [...new Set([...arquivo.compartilhadoCom, ...usuariosIds])];
    await arquivo.save();
    
    res.json(arquivo);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao compartilhar arquivo', error: error.message });
  }
});

// Rotas de chat
app.post('/api/chats', verificarToken, async (req, res) => {
  try {
    const { participantes, nomeSala } = req.body;
    
    // Garantir que o criador está incluído
    const todosParticipantes = [...new Set([req.usuario.id, ...participantes])];
    
    const novoChat = new Chat({
      participantes: todosParticipantes,
      nomeSala
    });
    
    await novoChat.save();
    
    res.status(201).json(novoChat);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao criar chat', error: error.message });
  }
});

app.get('/api/chats', verificarToken, async (req, res) => {
  try {
    const chats = await Chat.find({
      participantes: req.usuario.id
    });
    
    res.json(chats);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar chats', error: error.message });
  }
});

app.get('/api/chats/:id/mensagens', verificarToken, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ mensagem: 'Chat não encontrado' });
    
    if (!chat.participantes.includes(req.usuario.id)) {
      return res.status(403).json({ mensagem: 'Você não tem acesso a este chat' });
    }
    
    const mensagens = await Message.find({ chatId: req.params.id })
      .sort({ dataEnvio: 1 });
    
    res.json(mensagens);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar mensagens', error: error.message });
  }
});

// Rota para API para tornar um arquivo público ou privado
app.put('/api/files/:itemType/:itemId/public', verificarToken, async (req, res) => {
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
    
    // Verificar se o usuário é o proprietário ou tem permissões especiais
    if (item.owner.toString() !== req.usuario.id) {
      const user = await User.findById(req.usuario.id);
      const hasSpecialPermission = user.permissions?.includes('files:manage_any') || 
                                  user.roles?.includes('admin');
      
      if (!hasSpecialPermission) {
        return res.status(403).json({ msg: 'Acesso negado' });
      }
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
});

// Iniciar agendador de backup de usuários
if (process.env.NODE_ENV !== 'test') {
  startBackupScheduler();
  scheduleSuperCoinsRecharge();
}


// Middleware para autenticação de socket
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Autenticação necessária'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userName = decoded.nome;
    next();
  } catch (err) {
    next(new Error('Token inválido'));
  }
});

// Configuração do socket.io para chat em tempo real
io.on('connection', (socket) => {
  console.log('Novo cliente conectado');
  
  // Entrar em uma sala de chat
  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
    console.log(`${socket.userName} entrou no chat ${chatId}`);
  });
  
  // Enviar mensagem
  socket.on('send-message', async (data) => {
    try {
      if (!socket.userId) return;
      const novaMensagem = new Message({
        chatId: data.chatId,
        remetente: socket.userId,
        conteudo: data.conteudo,
        anexos: data.anexos || []
      });
      await novaMensagem.save();
      await Chat.findByIdAndUpdate(data.chatId, { ultimaMensagem: new Date() });
      const populatedMessage = await Message.findById(novaMensagem._id).populate('remetente', 'nome');
      io.to(data.chatId).emit('new-message', {
        ...populatedMessage.toObject(),
        remetenteNome: socket.userName
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  });
  
  // Ouvir por marcação de leitura
  socket.on('markAsRead', async (data) => {
    try {
      const { chatId } = data;  // Ajustado para seu modelo
      await Message.updateMany(
        { chatId, remetente: { $ne: socket.userId }, lida: false },
        { $set: { lida: true } }
      );
      io.to(chatId).emit('messagesRead', { chatId, userId: socket.userId });
    } catch (err) {
      console.error('Erro ao marcar mensagens como lidas:', err);
    }
  });
  
  // Notificação de "digitando"
  socket.on('typing', (data) => {
    socket.to(data.chatId).emit('user-typing', {
      userId: socket.userId,
      userName: socket.userName
    });
  });
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});