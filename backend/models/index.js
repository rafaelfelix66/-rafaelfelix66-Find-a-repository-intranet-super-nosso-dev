// models/index.js (CORRIGIDO)
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Role = mongoose.model('Role', require('./Role').schema);
const UsefulLink = require('./UsefulLink');
const JobPosition = require('./JobPosition');
const UserSchema = new mongoose.Schema({
  nome: String,
  cpf: { 
    type: String, 
    unique: true, 
    required: true, 
    index: true 
  },
  email: { 
    type: String, 
    unique: true 
  },
  password: String,
  cargo: String,
  departamento: String,
  avatar: String,
  dataCriacao: { type: Date, default: Date.now },
  ultimoAcesso: Date,
  roles: {
  type: [String],
  validate: {
    validator: function(roles) {
      return roles.length <= 1; // Permitir no máximo 1 papel
    },
    message: 'Um usuário pode ter apenas um papel atribuído'
  }
},
  permissoes: [String],
  permissions: [String],
  ativo: { type: Boolean, default: true },
  ultimaSincronizacao: { type: Date, default: null },
  chapa:  { type: String, default: null },
  filial:  { type: String, default: null },
  dataNascimento: { type: Date, default: null },
  dataAdmissao: { type: Date, default: null },
});

// NOVO: Middleware para sincronizar os campos permissions e permissoes
UserSchema.pre('save', function(next) {
  // Se permissions foi modificado, sincronizar com permissoes
  if (this.isModified('permissions')) {
    this.permissoes = this.permissions;
  }
  
  // Se permissoes foi modificado, sincronizar com permissions
  if (this.isModified('permissoes')) {
    this.permissions = this.permissoes;
  }
  
  // Se ambos estão vazios, garantir que ambos existam como arrays vazios
  if (!this.permissions) this.permissions = [];
  if (!this.permissoes) this.permissoes = [];
  
  next();
});

// NOVO: Virtual para sempre retornar permissions atualizado
UserSchema.virtual('normalizedPermissions').get(function() {
  return this.permissions || this.permissoes || [];
});


// Hash de senha antes de salvar
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
   // console.log('Password não modificado, pulando hash');
    return next();
  }
  
  // Verificar se a senha já está em formato de hash
  if (this.password.startsWith('$2')) {
   // console.log('ALERTA: A senha já parece estar em formato de hash. Isso pode causar problemas!');
   // console.log('Password atual:', this.password.substring(0, 10) + '...');
  } else {
   // console.log('Password em formato correto (texto plano):', this.password.length < 20 ? this.password : '(senha longa)');
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
   // console.log('Hash aplicado com sucesso:', this.password.substring(0, 10) + '...');
    next();
  } catch (error) {
    console.error('Erro no hash de senha:', error);
    next(error);
  }
});
// Método para comparar senha
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // Log da senha armazenada no formato completo para debug
    //console.log('Debug comparePassword:');
    //console.log('- Senha armazenada hash completa:', this.password);
    //console.log('- Senha fornecida:', candidatePassword);
    //console.log('- Formato da senha armazenada:', {
    //  startsWith$2: this.password.startsWith('$2'),
    //  startsWith$2a: this.password.startsWith('$2a'),
    //  startsWith$2b: this.password.startsWith('$2b'),
    //  length: this.password.length
    //});
    
    // Verificar versão do bcrypt em uso
    const bcrypt = require('bcryptjs');
    //console.log('- Versão bcryptjs:', require('bcryptjs/package.json').version);
    
    // Testar uma comparação conhecida
    const testHash = '$2a$10$abcdefghijklmnopqrstuuVwxyz0123456789ABCDEFGHIJ0123'; // Hash de teste
    const testResult = await bcrypt.compare('test', testHash);
    //console.log('- Teste de comparação bcrypt:', {
    //  testPassword: 'test',
    //  testHash: testHash.substring(0, 10) + '...',
    //  result: testResult
    //});
    
    // Fazer várias tentativas com configurações diferentes
    // 1. Comparação direta padrão
    const standardResult = await bcrypt.compare(candidatePassword, this.password);
    //console.log('- Resultado comparação padrão:', standardResult);
    
    // 2. Tentar criar um novo hash e comparar
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(candidatePassword, salt);
    //console.log('- Novo hash gerado para comparação:', newHash.substring(0, 10) + '...');
    
    // 3. Verificar o hash gerado com a mesma senha
    const verificationResult = await bcrypt.compare(candidatePassword, newHash);
    //console.log('- Verificação do novo hash:', verificationResult);
    
    // Retornar o resultado da comparação padrão
    return standardResult;
  } catch (error) {
    //console.error('Erro detalhado na verificação de senha:', error);
    return false;
  }
};
// NOVO: Método para verificar permissões (considera ambos os campos)
UserSchema.methods.hasPermission = function(permission) {
  const userPermissions = this.permissions || this.permissoes || [];
  return userPermissions.includes(permission);
};
// Método para verificar permissões
UserSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

// Método para verificar papel
UserSchema.methods.hasRole = function(role) {
  return this.roles.includes(role);
};
// NOVO: Método para obter permissões normalizadas
UserSchema.methods.getNormalizedPermissions = function() {
  return this.permissions || this.permissoes || [];
};
// NOVO: Método para definir permissões (atualiza ambos os campos)
UserSchema.methods.setPermissions = function(permissions) {
  this.permissions = permissions;
  this.permissoes = permissions;
  return this;
};
  
// CORRIGIDO: Schema do Post agora inclui eventData
const PostSchema = new mongoose.Schema({
  text: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attachments: [{
    type: String, // Caminho do arquivo
    contentType: String // Tipo MIME
  }],
  // ADICIONADO: Campo eventData para armazenar informações de eventos
  eventData: {
    type: mongoose.Schema.Types.Mixed, // Para armazenar dados de evento (título, data, local)
    default: null
  },
  departamentoVisibilidade: {
  type: [String],
  default: ['TODOS'],
  validate: {
    validator: function(v) {
      return Array.isArray(v);
    },
    message: props => `${props.value} não é um array válido!`
  }
},
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reactions: [{
    emoji: { type: String, required: true },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    count: { type: Number, default: 0 }
  }],
  comments: [{
    text: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

const ArticleSchema = new mongoose.Schema({
  title: String,
  content: String,
  category: String,
  tags: [String],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attachments: [{
    type: String, // Caminho do arquivo
    contentType: String,
    name: String // Nome original
  }],
  createdAt: { type: Date, default: Date.now }
});

const ChatSchema = new mongoose.Schema({
  name: String,
  type: { type: String, enum: ['direct', 'group'], default: 'group' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastActivity: { type: Date, default: Date.now },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
  text: String,
  attachments: [{
    type: String, // Caminho do arquivo
    contentType: String,
    name: String // Nome original
  }],
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const FileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  path: {
    type: String,
    required: function() {
      return this.type === 'file'; // Só obrigatório para arquivos físicos
    }
  },
  originalName: {
    type: String,
    required: function() {
      return this.type === 'file';
    }
  },
  mimeType: {
    type: String,
    required: function() {
      return this.type === 'file';
    }
  },
  size: {
    type: Number,
    required: function() {
      return this.type === 'file';
    }
  },
  extension: {
    type: String
  },
  // NOVO: Tipo do item (file ou link)
  type: {
    type: String,
    enum: ['file', 'link'],
    default: 'file'
  },
  // NOVO: URL para links
  linkUrl: {
    type: String,
    required: function() {
      return this.type === 'link';
    }
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    access: {
      type: String,
      enum: ['read', 'edit'],
      default: 'read'
    }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  // NOVO: Controle de download
  allowDownload: {
    type: Boolean,
    default: true
  },
    // NOVO: Flag para permitir uso no RAG/IA
  allowRAG: {
    type: Boolean,
    default: false,
    index: true // Indexar para buscas mais rápidas
  },
  // NOVO: Departamentos que podem visualizar
  departamentoVisibilidade: {
    type: [String],
    default: ['TODOS'],
    validate: {
      validator: function(v) {
        return Array.isArray(v);
      },
      message: props => `${props.value} não é um array válido!`
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const FolderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String, 
    default: '' 
  },
  coverImage: { 
    type: String, 
    default: null 
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    access: {
      type: String,
      enum: ['read', 'edit'],
      default: 'read'
    }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
    // NOVO: Flag para permitir que arquivos desta pasta sejam usados no RAG por padrão
  allowRAG: {
    type: Boolean,
    default: false,
    index: true
  },
  // NOVO: Departamentos que podem visualizar
  departamentoVisibilidade: {
    type: [String],
    default: ['TODOS'],
    validate: {
      validator: function(v) {
        return Array.isArray(v);
      },
      message: props => `${props.value} não é um array válido!`
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Schema para Banner
const BannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  link: {
    type: String
  },
  active: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
   departamentoVisibilidade: {
    type: [String],
    default: ['TODOS']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = {
  User: mongoose.model('User', UserSchema),
  Post: mongoose.model('Post', PostSchema),
  Article: mongoose.model('Article', ArticleSchema),
  Chat: mongoose.model('Chat', ChatSchema),
  Message: mongoose.model('Message', MessageSchema),
  File: mongoose.model('File', FileSchema),
  Folder: mongoose.model('Folder', FolderSchema),
  Banner: mongoose.model('Banner', BannerSchema),
  UsefulLink,
  Role,
  JobPosition
};