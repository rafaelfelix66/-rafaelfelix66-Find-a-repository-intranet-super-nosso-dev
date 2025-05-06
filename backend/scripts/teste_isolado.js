const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb://admin:senhasegura123@localhost:27017/intranet?authSource=admin';
mongoose.connect(MONGODB_URI);

const Post = require('./models/Post');

async function teste() {
  const novo = await Post.create({
    user: '6812440767dfced299ee07c2',
    text: 'Teste campo targetAudience 2',
    targetAudience: 'OPERACIONAL'
  });
  console.log(novo);
  
  mongoose.disconnect();
}

teste();