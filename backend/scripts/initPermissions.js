// scripts/initPermissions.js
const mongoose = require('mongoose');
require('dotenv').config();

// Adicionar logs para depuração
console.log('Importando modelos...');
const models = require('../models');
console.log('Modelos disponíveis:', Object.keys(models));

const { Role, User } = models;
console.log('Role definido:', !!Role);
console.log('User definido:', !!User);

// Papéis padrão
const defaultRoles = [
  {
    name: 'admin',
    description: 'Administrador do sistema com acesso completo',
    permissions: [
      // Todas as permissões
      'admin:access',
      'users:view', 'users:create', 'users:edit', 'users:delete',
      'roles:manage',
      'timeline:view', 'timeline:create', 'timeline:edit_own', 'timeline:delete_own', 'timeline:delete_any', 'timeline:comment', 'timeline:delete_comment_own', 'timeline:delete_comment_any',
      'files:view', 'files:upload', 'files:download', 'files:delete_own', 'files:delete_any', 'files:create_folder', 'files:share',
      'knowledge:view', 'knowledge:create', 'knowledge:edit_own', 'knowledge:edit_any', 'knowledge:delete_own', 'knowledge:delete_any',
      'banners:view', 'banners:create', 'banners:edit', 'banners:delete'
    ]
  },
  {
    name: 'editor',
    description: 'Editor de conteúdo',
    permissions: [
      'timeline:view', 'timeline:create', 'timeline:edit_own', 'timeline:delete_own', 'timeline:comment', 'timeline:delete_comment_own',
      'files:view', 'files:upload', 'files:download', 'files:delete_own', 'files:create_folder', 'files:share',
      'knowledge:view', 'knowledge:create', 'knowledge:edit_own', 'knowledge:delete_own'
    ]
  },
  {
    name: 'user',
    description: 'Usuário comum',
    permissions: [
      'timeline:view', 'timeline:comment',
      'files:view', 'files:download',
      'knowledge:view'
    ]
  }
];

// Conectar ao MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Conectado ao MongoDB');

    try {
      // Criar papéis padrão
      for (const roleData of defaultRoles) {
        console.log(`Processando papel: ${roleData.name}`);
        
        // Verificar se Role.findOne está disponível
        if (typeof Role.findOne !== 'function') {
          console.error('Role.findOne não é uma função!');
          console.error('Tipo de Role:', typeof Role);
          console.error('Propriedades de Role:', Object.keys(Role));
          process.exit(1);
        }
        
        const existingRole = await Role.findOne({ name: roleData.name });
        
        if (existingRole) {
          console.log(`Papel "${roleData.name}" já existe, atualizando permissões...`);
          existingRole.permissions = roleData.permissions;
          await existingRole.save();
        } else {
          console.log(`Criando novo papel "${roleData.name}"...`);
          await Role.create(roleData);
        }
      }
      
      // Atualizar usuário admin se existir
      const adminEmail = process.env.ADMIN_EMAIL || 'rafael.felix@supernosso.com.br';
      console.log(`Procurando usuário admin com email: ${adminEmail}`);
      
      const adminUser = await User.findOne({ email: adminEmail });
      
      if (adminUser) {
        console.log(`Usuário admin encontrado, atualizando papéis...`);
        adminUser.roles = ['admin'];
        await adminUser.save();
      } else {
        console.log(`Usuário admin não encontrado. Crie um usuário com o email ${adminEmail} para ter acesso administrativo.`);
      }
      
      console.log('Inicialização de permissões concluída com sucesso!');
    } catch (error) {
      console.error('Erro na inicialização de permissões:', error);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch((err) => {
    console.error('Erro ao conectar ao MongoDB:', err);
  });