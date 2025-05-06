// reset-password.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./models');
require('dotenv').config();

async function resetPassword() {
  try {
    // Use localhost em vez de mongodb quando executar fora do Docker
    const MONGODB_URI = 'mongodb://admin:senhasegura123@localhost:27017/intranet?authSource=admin';
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado ao MongoDB');
    
    const cpf = '11027478662';
    const newPassword = cpf.slice(-6); // Últimos 6 dígitos
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    const user = await User.findOne({ cpf });
    if (!user) {
      console.log('Usuário não encontrado');
      return;
    }
    
    console.log('Usuário encontrado:', user.nome);
    user.password = hashedPassword;
    await user.save();
    
    console.log('Senha redefinida com sucesso para', newPassword);
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    mongoose.disconnect();
  }
}

resetPassword();