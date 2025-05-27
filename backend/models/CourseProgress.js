// backend/models/CourseProgress.js
const mongoose = require('mongoose');

const LessonProgressSchema = new mongoose.Schema({
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  timeSpent: {
    type: Number,
    default: 0 // em segundos
  },
  lastPosition: {
    type: Number,
    default: 0 // Para vídeos, posição em segundos
  },
  attempts: {
    type: Number,
    default: 0
  },
  score: Number, // Para quizzes/avaliações
  notes: String // Anotações do usuário
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
  startedAt: Date,
  completedAt: Date,
  
  // Progresso geral
  progress: {
    type: Number,
    default: 0, // Porcentagem (0-100)
    min: 0,
    max: 100
  },
  
  // Status do curso
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'paused'],
    default: 'not_started'
  },
  
  // Progresso por aula
  lessonsProgress: [LessonProgressSchema],
  
  // Tempo total gasto no curso
  totalTimeSpent: {
    type: Number,
    default: 0 // em segundos
  },
  
  // Última atividade
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  
  lastLessonId: mongoose.Schema.Types.ObjectId,
  
  // Avaliação do curso pelo usuário
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  
  feedback: String,
  
  // Certificado
  certificateIssued: {
    type: Boolean,
    default: false
  },
  
  certificateIssuedAt: Date,
  
  finalScore: Number,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Índices únicos para evitar duplicatas
CourseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// Índices para consultas
CourseProgressSchema.index({ userId: 1 });
CourseProgressSchema.index({ courseId: 1 });
CourseProgressSchema.index({ status: 1 });
CourseProgressSchema.index({ lastAccessedAt: -1 });

// Middleware para atualizar updatedAt
CourseProgressSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
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
  
  next();
});

// Método para calcular progresso
CourseProgressSchema.methods.calculateProgress = function() {
  if (!this.lessonsProgress || this.lessonsProgress.length === 0) {
    return 0;
  }
  
  const completedLessons = this.lessonsProgress.filter(lesson => lesson.completed).length;
  const totalLessons = this.lessonsProgress.length;
  
  this.progress = Math.round((completedLessons / totalLessons) * 100);
  return this.progress;
};

// Método para marcar aula como completa
CourseProgressSchema.methods.completeLesson = function(lessonId, timeSpent = 0, score = null) {
  let lessonProgress = this.lessonsProgress.find(
    lp => lp.lessonId.toString() === lessonId.toString()
  );
  
  if (!lessonProgress) {
    lessonProgress = {
      lessonId: lessonId,
      completed: false,
      timeSpent: 0,
      attempts: 0
    };
    this.lessonsProgress.push(lessonProgress);
  }
  
  lessonProgress.completed = true;
  lessonProgress.completedAt = new Date();
  lessonProgress.timeSpent += timeSpent;
  lessonProgress.attempts += 1;
  
  if (score !== null) {
    lessonProgress.score = score;
  }
  
  this.lastLessonId = lessonId;
  this.lastAccessedAt = new Date();
  this.totalTimeSpent += timeSpent;
  
  // Recalcular progresso
  this.calculateProgress();
  
  return this.save();
};

module.exports = mongoose.model('CourseProgress', CourseProgressSchema);