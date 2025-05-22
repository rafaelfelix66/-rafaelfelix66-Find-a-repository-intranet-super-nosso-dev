// backend/routes/notifications.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

// Aplicar middleware de autenticação a todas as rotas
router.use(auth);

// Obter notificações do usuário
router.get('/', notificationController.getUserNotifications);

// Marcar notificação como lida
router.put('/:id/read', notificationController.markAsRead);

// Marcar todas as notificações como lidas
router.put('/read-all', notificationController.markAllAsRead);

// Excluir notificação
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;