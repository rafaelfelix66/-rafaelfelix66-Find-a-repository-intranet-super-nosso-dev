//backend/models/Engagement.js
const mongoose = require('mongoose');

const EngagementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actionType: {
    type: String,
    required: true,
    // Adicione mais tipos conforme necessário
    enum: [
      'post_view', 'post_create', 'post_like', 'post_comment', 
	  'comment_like', 'post_react',
      'article_view', 'article_create', 
      'file_view', 'file_share', 'file_download',
	  'banner_view', 'banner_click',
      'login', 'profile_update', 'custom'
    ]
  },
  customActionType: {
    type: String,
    required: function() {
      return this.actionType === 'custom';
    }
  },
  points: {
    type: Number,
    default: 1
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'targetModel'
  },
  targetModel: {
    type: String,
    enum: ['Post', 'Article', 'File', 'User', 'Banner']
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Índices para melhor performance
EngagementSchema.index({ userId: 1, timestamp: -1 });
EngagementSchema.index({ actionType: 1, timestamp: -1 });

const EngagementActionSchema = new mongoose.Schema({
  actionType: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    required: true,
    default: 1
  },
  description: String,
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = {
  Engagement: mongoose.model('Engagement', EngagementSchema),
  EngagementAction: mongoose.model('EngagementAction', EngagementActionSchema)
};