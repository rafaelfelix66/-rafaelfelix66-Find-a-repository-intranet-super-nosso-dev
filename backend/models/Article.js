// models/Article.js
const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  tags: [String],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attachments: [{
    type: String, // caminho do arquivo
    contentType: String, // tipo de conteúdo
    name: String // nome original do arquivo
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware para atualizar a data de atualização
ArticleSchema.pre('save', function(next) {
  if (this.isModified('content') || this.isModified('title') || this.isModified('category')) {
    this.updatedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('Article', ArticleSchema);