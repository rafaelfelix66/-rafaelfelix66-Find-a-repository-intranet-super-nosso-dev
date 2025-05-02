// models/Post.js
const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    default: ""
  },
  targetAudience: {
    type: String,
    enum: ['TODOS', 'A CLASSIFICAR', 'ADMINISTRATIVA', 'ADMINISTRATIVO', 'LIDERANÇA', 'OPERACIONAL'],
    default: 'TODOS'
  },
  attachments: [String], 
  // Adicionar campo de imagens
  images: [String],
  
  eventData: {
    type: mongoose.Schema.Types.Mixed, // Para armazenar dados de evento (título, data, local)
    default: null
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Post', PostSchema);