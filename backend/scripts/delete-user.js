// delete-user.js
const mongoose = require('mongoose');
const { User } = require('./models');
require('dotenv').config();

async function deleteUser() {
  try {
    // Use localhost em vez de mongodb quando executar fora do Docker
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
    
    // Excluir o usuário
    await User.deleteOne({ cpf });
    
    console.log('Usuário excluído com sucesso');
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    mongoose.disconnect();
  }
}

deleteUser();