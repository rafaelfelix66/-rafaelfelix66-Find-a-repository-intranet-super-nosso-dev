const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Configuração do app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Conectado ao MongoDB'))
.catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Configuração de Upload de Arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Pasta para arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Modelos
const User = mongoose.model('User', new mongoose.Schema({
  nome: String,
  email: { type: String, unique: true },
  senha: String,
  cargo: String,
  departamento: String,
  avatar: String,
  dataCriacao: { type: Date, default: Date.now },
  ultimoAcesso: Date,
  permissoes: [String]
}));

const File = mongoose.model('File', new mongoose.Schema({
  nome: String,
  tipo: String,
  tamanho: Number,
  urlArquivo: String,
  proprietarioId: String,
  compartilhadoCom: [String],
  dataCriacao: { type: Date, default: Date.now },
  dataModificacao: { type: Date, default: Date.now },
  tags: [String]
}));

const Message = mongoose.model('Message', new mongoose.Schema({
  chatId: String,
  remetente: String,
  conteudo: String,
  dataEnvio: { type: Date, default: Date.now },
  lida: { type: Boolean, default: false },
  anexos: [String]
}));

const Chat = mongoose.model('Chat', new mongoose.Schema({
  participantes: [String],
  ultimaMensagem: { type: Date, default: Date.now },
  nomeSala: String
}));

// Middleware para verificar token
const verificarToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) return res.status(401).json({ mensagem: 'Token não fornecido' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ mensagem: 'Token inválido' });
    
    req.usuario = decoded;
    next();
  });
};

// Rotas de autenticação
app.post('/api/auth/registrar', async (req, res) => {
  try {
    const { nome, email, senha, cargo, departamento } = req.body;
    
    // Verificar se o usuário já existe
    const usuarioExistente = await User.findOne({ email });
    if (usuarioExistente) return res.status(400).json({ mensagem: 'Email já cadastrado' });
    
    // Criar novo usuário (em produção, use hash para a senha)
    const novoUsuario = new User({
      nome,
      email,
      senha, // Em produção, use bcrypt para hash
      cargo,
      departamento
    });
    
    await novoUsuario.save();
    
    res.status(201).json({ mensagem: 'Usuário registrado com sucesso' });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao registrar usuário', error: error.message });
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

// Configuração do socket.io para chat em tempo real
io.on('connection', (socket) => {
  console.log('Novo cliente conectado');
  
  // Autenticação do socket
  socket.on('authenticate', (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userName = decoded.nome;
      console.log(`Usuário ${decoded.nome} autenticado no socket`);
    } catch (error) {
      console.error('Erro na autenticação do socket:', error);
    }
  });
  
  // Entrar em uma sala de chat
  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
    console.log(`${socket.userName} entrou no chat ${chatId}`);
  });
  
  // Enviar mensagem
  socket.on('send-message', async (data) => {
    try {
      if (!socket.userId) {
        return;
      }
      
      const novaMensagem = new Message({
        chatId: data.chatId,
        remetente: socket.userId,
        conteudo: data.conteudo,
        anexos: data.anexos || []
      });
      
      await novaMensagem.save();
      
      // Atualizar horário da última mensagem no chat
      await Chat.findByIdAndUpdate(data.chatId, {
        ultimaMensagem: new Date()
      });
      
      // Emitir mensagem para todos no chat
      io.to(data.chatId).emit('new-message', {
        ...novaMensagem.toObject(),
        remetenteNome: socket.userName
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
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

// Criar pasta de uploads se não existir
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});