// backend/models/CourseProgress.js
const mongoose = require('mongoose');

const LessonProgressSchema = new mongoose.Schema({
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
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
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  attempts: {
    type: Number,
    default: 0
  },
  notes: String,
  lastPosition: {
    type: Number,
    default: 0 // para vídeos, posição em segundos
  }
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
  
  // Progresso geral
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'failed'],
    default: 'not_started'
  },
  
  // Aulas
  lessonsProgress: [LessonProgressSchema],
  
  // Timestamps
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
  
  // Aula atual
  lastLessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  },
  
  // Tempo total gasto no curso (em segundos)
  totalTimeSpent: {
    type: Number,
    default: 0
  },
  
  // Nota final (se aplicável)
  finalScore: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // Certificado
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateIssuedAt: {
    type: Date
  },
  certificateUrl: String
});

// Índices para melhor performance
CourseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });
CourseProgressSchema.index({ userId: 1, lastAccessedAt: -1 });
CourseProgressSchema.index({ courseId: 1, progress: -1 });

// Middleware para atualizar lastAccessedAt
CourseProgressSchema.pre('save', function(next) {
  this.lastAccessedAt = new Date();
  next();
});

// Método para calcular o progresso
CourseProgressSchema.methods.calculateProgress = function() {
  if (!this.lessonsProgress || this.lessonsProgress.length === 0) {
    this.progress = 0;
    this.status = 'not_started';
    return;
  }
  
  const completedLessons = this.lessonsProgress.filter(lesson => lesson.completed).length;
  const totalLessons = this.lessonsProgress.length;
  
  this.progress = Math.round((completedLessons / totalLessons) * 100);
  
  // Atualizar status
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

// Método para marcar aula como concluída
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
  
  this.totalTimeSpent += timeSpent;
  this.lastLessonId = lessonId;
  
  // Recalcular progresso
  this.calculateProgress();
};

// Método para obter estatísticas do progresso
CourseProgressSchema.methods.getStats = function() {
  const completedLessons = this.lessonsProgress.filter(lesson => lesson.completed).length;
  const totalLessons = this.lessonsProgress.length;
  
  return {
    progress: this.progress,
    status: this.status,
    completedLessons,
    totalLessons,
    totalTimeSpent: this.totalTimeSpent,
    averageScore: this.getAverageScore(),
    enrolledAt: this.enrolledAt,
    lastAccessedAt: this.lastAccessedAt,
    completedAt: this.completedAt
  };
};

// Método para calcular nota média
CourseProgressSchema.methods.getAverageScore = function() {
  const lessonsWithScores = this.lessonsProgress.filter(lesson => 
    lesson.completed && lesson.score !== undefined && lesson.score !== null
  );
  
  if (lessonsWithScores.length === 0) return null;
  
  const totalScore = lessonsWithScores.reduce((sum, lesson) => sum + lesson.score, 0);
  return Math.round(totalScore / lessonsWithScores.length);
};

// Método estático para obter ranking de usuários em um curso
CourseProgressSchema.statics.getCourseRanking = function(courseId, limit = 10) {
  return this.find({ courseId })
    .populate('userId', 'nome email avatar')
    .sort({ progress: -1, completedAt: 1 })
    .limit(limit)
    .lean();
};

// Método estático para obter estatísticas do curso
CourseProgressSchema.statics.getCourseStats = function(courseId) {
  return this.aggregate([
    { $match: { courseId: mongoose.Types.ObjectId(courseId) } },
    {
      $group: {
        _id: null,
        totalEnrollments: { $sum: 1 },
        completedStudents: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        averageProgress: { $avg: '$progress' },
        totalTimeSpent: { $sum: '$totalTimeSpent' },
        averageTimeSpent: { $avg: '$totalTimeSpent' }
      }
    }
  ]);
};

module.exports = mongoose.model('CourseProgress', CourseProgressSchema);