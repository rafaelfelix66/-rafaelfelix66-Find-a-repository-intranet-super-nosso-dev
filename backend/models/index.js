// models/index.js (CORRIGIDO)
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Role = mongoose.model('Role', require('./Role').schema);

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
  roles: [String],
  permissoes: [String],
  ativo: { type: Boolean, default: true },
  ultimaSincronizacao: { type: Date, default: null }
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
// Método para verificar permissões
UserSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

// Método para verificar papel
UserSchema.methods.hasRole = function(role) {
  return this.roles.includes(role);
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
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    text: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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
  name: String,
  path: String,
  originalName: String,
  mimeType: String,
  size: Number,
  extension: String,
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sharedWith: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    access: { type: String, enum: ['read', 'write'], default: 'read' }
  }],
  isPublic: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const FolderSchema = new mongoose.Schema({
  name: String,
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sharedWith: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    access: { type: String, enum: ['read', 'write'], default: 'read' }
  }],
  isPublic: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
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
  Role
};