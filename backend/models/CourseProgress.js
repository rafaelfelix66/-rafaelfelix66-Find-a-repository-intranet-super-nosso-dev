// backend/models/CourseProgress.js - MODELO CORRIGIDO

const mongoose = require('mongoose');

const LessonProgressSchema = new mongoose.Schema({
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course.lessons',
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  timeSpent: {
    type: Number,
    default: 0 // em segundos
  },
  lastPosition: {
    type: Number,
    default: 0 // para vídeos, posição em segundos
  },
  attempts: {
    type: Number,
    default: 0
  },
  score: {
    type: Number // para quizzes
  },
  notes: String // anotações do usuário
});

const CourseProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'dropped'],
    default: 'not_started'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastLessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course.lessons'
  },
  totalTimeSpent: {
    type: Number,
    default: 0 // em segundos
  },
  lessonsProgress: [LessonProgressSchema],
  finalScore: {
    type: Number // pontuação final do curso
  },
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateIssuedAt: {
    type: Date
  }
});

// Índices para performance
CourseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });
CourseProgressSchema.index({ courseId: 1 });
CourseProgressSchema.index({ userId: 1 });
CourseProgressSchema.index({ status: 1 });

// Método para calcular progresso
CourseProgressSchema.methods.calculateProgress = function() {
  if (!this.lessonsProgress || this.lessonsProgress.length === 0) {
    this.progress = 0;
    this.status = 'not_started';
    return;
  }
  
  const completedLessons = this.lessonsProgress.filter(lp => lp.completed).length;
  const totalLessons = this.lessonsProgress.length;
  
  this.progress = Math.round((completedLessons / totalLessons) * 100);
  
  // Atualizar status baseado no progresso
  if (this.progress === 0) {
    this.status = 'not_started';
  } else if (this.progress === 100) {
    this.status = 'completed';
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  } else {
    this.status = 'in_progress';
    if (!this.startedAt) {
      this.startedAt = new Date();
    }
  }
};

// Middleware para atualizar lastAccessedAt
CourseProgressSchema.pre('save', function(next) {
  this.lastAccessedAt = new Date();
  
  // Calcular progresso automaticamente
  this.calculateProgress();
  
  next();
});

module.exports = mongoose.model('CourseProgress', CourseProgressSchema);