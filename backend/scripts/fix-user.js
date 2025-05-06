// fix-user.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./models');
require('dotenv').config();

async function fixUser() {
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
    
    // Definir a senha como os últimos 6 dígitos do CPF
    const newPassword = cpf.slice(-6);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Atualizar diretamente o documento para evitar hooks de pre-save
    await User.updateOne(
      { _id: user._id },
      { 
        $set: { 
          password: hashedPassword,
          roles: ['admin', 'user'] // Garantir ambas as roles
        } 
      }
    );
    
    console.log('Senha e papéis atualizados com sucesso');
    console.log('Nova senha:', newPassword);
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    mongoose.disconnect();
    console.log('Desconectado do MongoDB');
  }
}

fixUser();