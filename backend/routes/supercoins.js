// /backend/routes/supercoins.js
const express = require('express');
const router = express.Router();
const superCoinController = require('../controllers/superCoinController');
const auth = require('../middleware/auth');
const { hasPermission } = require('../middleware/permissions');

// Middleware de autenticação para todas as rotas
router.use(auth);

// Rota para obter o saldo do usuário autenticado
router.get('/balance', superCoinController.getBalance);

// Rota para obter o saldo de um usuário específico (apenas para administradores)
router.get('/balance/:userId', hasPermission('supercoins:manage'), superCoinController.getBalance);

// Rota para enviar moedas para outro usuário
router.post('/send', hasPermission('supercoins:send'), superCoinController.sendCoins);

// Rota para obter o ranking de Super Coins
router.get('/ranking', hasPermission('supercoins:view_ranking'), superCoinController.getCoinRanking);

// Rotas administrativas para gerenciar atributos e configurações
router.get('/attributes', superCoinController.getAttributes);
router.post('/attributes', hasPermission('supercoins:manage'), superCoinController.createAttribute);
router.put('/attributes/:id', hasPermission('supercoins:manage'), superCoinController.updateAttribute);
router.delete('/attributes/:id', hasPermission('supercoins:manage'), superCoinController.deleteAttribute);

// Rota para obter configurações do sistema
router.get('/config', hasPermission('supercoins:manage'), superCoinController.getConfig);
router.put('/config', hasPermission('supercoins:manage'), superCoinController.updateConfig);

// Rota para obter histórico de transações do usuário
router.get('/transactions', superCoinController.getUserTransactions);

// Rota para obter histórico de transações de um usuário específico (apenas para administradores)
router.get('/transactions/:userId', hasPermission('supercoins:manage'), superCoinController.getUserTransactions);

module.exports = router;