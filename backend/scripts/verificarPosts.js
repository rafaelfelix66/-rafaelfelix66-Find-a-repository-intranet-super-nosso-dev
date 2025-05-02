// scripts/verificarPosts.js
const mongoose = require('mongoose');
const { Post } = require('../models');
require('dotenv').config({ path: '../.env' });

async function verificarPosts() {
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

    const posts = await Post.find({}).lean();
    
    console.log(`\nEncontrados ${posts.length} posts:\n`);
    
    posts.forEach(post => {
      console.log('Post:', post._id);
      console.log('  text:', post.text);
      console.log('  targetDepartment:', post.targetDepartment);
      console.log('  targetDepartment type:', typeof post.targetDepartment);
      console.log('  JSON stringify:', JSON.stringify(post.targetDepartment));
      console.log('-------------------');
    });
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    mongoose.disconnect();
  }
}

verificarPosts();