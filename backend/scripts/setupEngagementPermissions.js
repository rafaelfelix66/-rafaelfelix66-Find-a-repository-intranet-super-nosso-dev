// /backend/scripts/setupEngagementPermissions.js
const mongoose = require('mongoose');
const { Role } = require('../models');
require('dotenv').config();

// Função para conectar ao MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado ao MongoDB');
  } catch (err) {
    console.error('Erro ao conectar ao MongoDB:', err);
    process.exit(1);
  }
};

// Função para configurar permissões
const setupPermissions = async () => {
  try {
    // Definir permissões de engajamento e SuperCoins
    const engagementPermissions = [
      'admin:dashboard',        // Acesso ao dashboard administrativo
      'engagement:view_stats',  // Visualizar estatísticas de engajamento
      'engagement:manage',      // Gerenciar configurações de engajamento
      'supercoins:send',        // Enviar Super Coins
      'supercoins:manage',      // Gerenciar atributos e configurações
      'supercoins:view_ranking' // Visualizar ranking de Super Coins
    ];
    
    // Buscar papéis existentes
    const adminRole = await Role.findOne({ name: 'admin' });
    const userRole = await Role.findOne({ name: 'user' });
    
    // Se o papel admin existe, adicionar todas as permissões
    if (adminRole) {
      // Atualizar apenas se alguma permissão estiver faltando
      const missingPermissions = engagementPermissions.filter(
        perm => !adminRole.permissions.includes(perm)
      );
      
      if (missingPermissions.length > 0) {
        adminRole.permissions = [...new Set([...adminRole.permissions, ...missingPermissions])];
        await adminRole.save();
        console.log(`${missingPermissions.length} permissões adicionadas ao papel admin`);
      } else {
        console.log('Papel admin já possui todas as permissões necessárias');
      }
    } else {
      console.log('Papel admin não encontrado. Você deve criá-lo primeiro.');
    }
    
    // Se o papel user existe, adicionar permissões básicas
    if (userRole) {
      const basicPermissions = [
        'supercoins:send',
        'supercoins:view_ranking'
      ];
      
      // Atualizar apenas se alguma permissão estiver faltando
      const missingPermissions = basicPermissions.filter(
        perm => !userRole.permissions.includes(perm)
      );
      
      if (missingPermissions.length > 0) {
        userRole.permissions = [...new Set([...userRole.permissions, ...missingPermissions])];
        await userRole.save();
        console.log(`${missingPermissions.length} permissões adicionadas ao papel user`);
      } else {
        console.log('Papel user já possui todas as permissões necessárias');
      }
    } else {
      console.log('Papel user não encontrado. Você deve criá-lo primeiro.');
    }
    
    // Criar um novo papel específico para gestores
    const managerRole = await Role.findOne({ name: 'manager' });
    
    if (managerRole) {
      const managerPermissions = [
        'supercoins:send',
        'supercoins:view_ranking',
        'engagement:view_stats'
      ];
      
      // Atualizar apenas se alguma permissão estiver faltando
      const missingPermissions = managerPermissions.filter(
        perm => !managerRole.permissions.includes(perm)
      );
      
      if (missingPermissions.length > 0) {
        managerRole.permissions = [...new Set([...managerRole.permissions, ...missingPermissions])];
        await managerRole.save();
        console.log(`${missingPermissions.length} permissões adicionadas ao papel manager`);
      } else {
        console.log('Papel manager já possui todas as permissões necessárias');
      }
    } else {
      // Criar o papel manager se não existir
      const newManagerRole = new Role({
        name: 'manager',
        description: 'Gerentes com acesso a estatísticas e funcionalidades de incentivo',
        permissions: [
          'supercoins:send',
          'supercoins:view_ranking',
          'engagement:view_stats'
        ]
      });
      
      await newManagerRole.save();
      console.log('Papel manager criado com permissões');
    }
    
    console.log('Configuração de permissões concluída com sucesso!');
  } catch (err) {
    console.error('Erro ao configurar permissões:', err);
  }
};

// Executar a configuração
const setup = async () => {
  try {
    await connectDB();
    await setupPermissions();
    await mongoose.disconnect();
    console.log('Desconectado do MongoDB');
  } catch (err) {
    console.error('Erro durante a configuração:', err);
  }
};

setup();