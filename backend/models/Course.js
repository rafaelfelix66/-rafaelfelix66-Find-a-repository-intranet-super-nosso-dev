// backend/models/Course.js - ATUALIZADO SEM INSTRUTOR
const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['video', 'pdf', 'document', 'image', 'link', 'audio'],
    required: true
  },
  url: String, // Para links externos
  filePath: String, // Para arquivos locais
  size: String,
  duration: String, // Para vídeos/áudios
  order: {
    type: Number,
    default: 0
  },
  description: String,
  isRequired: {
    type: Boolean,
    default: false
  }
});

const LessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['video', 'text', 'quiz', 'assignment'],
    default: 'video'
  },
  content: String, // Para conteúdo textual
  videoUrl: String, // Para vídeos externos (YouTube, Vimeo, etc.)
  videoPath: String, // Para vídeos locais
  duration: String,
  order: {
    type: Number,
    required: true
  },
  materials: [MaterialSchema],
  isPublished: {
    type: Boolean,
    default: false
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
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

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  thumbnail: String,
  category: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['Iniciante', 'Intermediário', 'Avançado', 'Obrigatório'],
    default: 'Iniciante'
  },
  // REMOVIDO: campo instructor
  estimatedDuration: String, // Ex: "8 horas"
  objectives: [String], // Objetivos do curso
  requirements: [String], // Pré-requisitos
  
  // Controle de visibilidade por departamento
  departamentoVisibilidade: {
    type: [String],
    default: ['TODOS'],
    validate: {
      validator: function(v) {
        return Array.isArray(v);
      },
      message: props => `${props.value} não é um array válido!`
    }
  },
  
  // Controle de publicação
  isPublished: {
    type: Boolean,
    default: false
  },
  
  // Configurações do curso
  allowDownload: {
    type: Boolean,
    default: true
  },
  
  certificateEnabled: {
    type: Boolean,
    default: false
  },
  
  passingScore: {
    type: Number,
    default: 70 // Porcentagem mínima para aprovação
  },
  
  // Estatísticas
  enrollmentCount: {
    type: Number,
    default: 0
  },
  
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  
  lessons: [LessonSchema],
  
  tags: [String],
  
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
CourseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Índices para melhor performance
CourseSchema.index({ title: 'text', description: 'text' });
CourseSchema.index({ category: 1 });
CourseSchema.index({ departamentoVisibilidade: 1 });
CourseSchema.index({ isPublished: 1 });
CourseSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Course', CourseSchema);