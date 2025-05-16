// /backend/routes/adminEngagement.js
const express = require('express');
const router = express.Router();
const adminEngagementController = require('../controllers/adminEngagementController');
const auth = require('../middleware/auth');
const { hasPermission } = require('../middleware/permissions');

// Middleware para restringir acesso apenas a usuários autenticados com permissão adequada
router.use(auth);
router.use(hasPermission('admin:dashboard'));

// Rota para obter timeline de engajamento
router.get('/timeline', adminEngagementController.getEngagementTimeline);

// Rota para obter estatísticas de conteúdo
router.get('/content-stats', adminEngagementController.getContentStats);

// Rota para obter usuários mais ativos
router.get('/active-users', adminEngagementController.getActiveUsers);

// Rota para obter estatísticas de tipos de ações
router.get('/action-stats', adminEngagementController.getActionStats);

// Rota para obter estatísticas de Super Coins
router.get('/supercoins-stats', adminEngagementController.getSuperCoinsStats);

module.exports = router;