// assign-admin-role.js
const mongoose = require('mongoose');
const { User } = require('./models');
require('dotenv').config();

async function assignAdminRole() {
  try {
    // Use localhost quando executar fora do Docker
    const MONGODB_URI = 'mongodb://admin:senhasegura123@localhost:27017/intranet?authSource=admin';
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado ao MongoDB');
    
    const cpf = '11027478662';
    
    // Encontrar o usuário pelo CPF
    const user = await User.findOne({ cpf });
    if (!user) {
      console.log('Usuário não encontrado');
      return;
    }
    
    console.log('Usuário encontrado:', user.nome);
    
    // Atribuir papel de admin ao usuário
    if (!user.roles) {
      user.roles = ['admin'];
    } else if (!user.roles.includes('admin')) {
      user.roles.push('admin');
    } else {
      console.log('Usuário já possui o papel de admin');
    }
    
    // Salvar usuário
    await user.save();
    
    console.log('Papel de admin atribuído com sucesso');
    console.log('Papéis do usuário:', user.roles);
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    mongoose.disconnect();
  }
}

assignAdminRole();