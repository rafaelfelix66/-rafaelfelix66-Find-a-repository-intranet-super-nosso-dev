// delete-all-user.js
const mongoose = require('mongoose');
const { User } = require('./models'); // Certifique-se de que o caminho para o modelo User esteja correto
require('dotenv').config();

async function deleteAllUsers() {
  try {
    // Use localhost em vez de mongodb quando executar fora do Docker
    const MONGODB_URI = 'mongodb://admin:senhasegura123@localhost:27017/intranet?authSource=admin';
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado ao MongoDB');

    // Encontrar todos os usuários
    const users = await User.find({});
    if (users.length === 0) {
      console.log('Nenhum usuário encontrado para excluir');
      return;
    }

    console.log(`Encontrados ${users.length} usuários`);

    // Excluir cada usuário encontrado
    for (const user of users) {
      await User.deleteOne({ _id: user._id });
      console.log('Usuário excluído:', user.nome);
    }

    console.log('Todos os usuários foram excluídos com sucesso');
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    mongoose.disconnect();
  }
}

deleteAllUsers();
