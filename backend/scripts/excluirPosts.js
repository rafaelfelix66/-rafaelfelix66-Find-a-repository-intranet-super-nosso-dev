const mongoose = require('mongoose');
const { Post } = require('../models');
require('dotenv').config({ path: '../.env' });

async function excluirPosts() {
  try {
    // Determina se estamos rodando dentro ou fora do Docker
    let MONGODB_URI = process.env.MONGODB_URI;

    // Se não estiver dentro do Docker, use localhost
    if (MONGODB_URI.includes('mongodb:27017')) {
      MONGODB_URI = MONGODB_URI.replace('mongodb:27017', 'localhost:27017');
    }

    console.log('Conectando ao MongoDB em:', MONGODB_URI.replace(/mongodb\+srv:\/\/[^:]+:[^@]+@/, '***:***@'));

    await mongoose.connect(MONGODB_URI);
    console.log('Conectado ao MongoDB');

    // Exclui todos os posts
    const resultado = await Post.deleteMany({});
    console.log(`\n${resultado.deletedCount} posts foram excluídos com sucesso.\n`);

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    mongoose.disconnect();
  }
}

excluirPosts();
