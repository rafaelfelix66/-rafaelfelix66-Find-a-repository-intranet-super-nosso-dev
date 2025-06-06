// backend/models/JobPosition.js
const mongoose = require('mongoose');

const JobPositionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  layout: {
    type: String,
    enum: ['small', 'large'], // small = 1 coluna, large = 2 colunas
    required: true
  },
  attachmentType: {
    type: String,
    enum: ['image', 'document', 'video', 'youtube'],
    required: true
  },
  attachmentUrl: {
    type: String,
    required: true
  },
  youtubeVideoId: {
    type: String, // Para vídeos do YouTube, armazenar apenas o ID
    default: null
  },
  linkUrl: {
    type: String,
    default: null
  },
  linkType: {
    type: String,
    enum: ['internal', 'external', null],
    default: null
  },
  // Campos específicos para vagas
  department: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship'],
    required: true
  },
  salaryRange: {
    type: String,
    default: ''
  },
  requirements: {
    type: String,
    default: ''
  },
  benefits: {
    type: String,
    default: ''
  },
  applicationDeadline: {
    type: Date,
    default: null
  },
  contactEmail: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    default: 0
  },
  active: {
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

// Middleware para atualizar a data de modificação
JobPositionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('JobPosition', JobPositionSchema);