// backend/models/UsefulLink.js
const mongoose = require('mongoose');

const UsefulLinkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  url: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'URL deve começar com http:// ou https://'
    }
  },
  category: {
    type: String,
    default: 'Geral',
    trim: true,
    maxlength: 50
  },
  icon: {
    type: String,
    default: 'ExternalLink'
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware para atualizar updatedAt
UsefulLinkSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Índices para melhor performance
UsefulLinkSchema.index({ category: 1, order: 1 });
UsefulLinkSchema.index({ isActive: 1 });

module.exports = mongoose.model('UsefulLink', UsefulLinkSchema);