// backend/routes/supercoins.js
const express = require('express');
const router = express.Router();
const superCoinController = require('../controllers/superCoinController');
const auth = require('../middleware/auth');
const { hasPermission } = require('../middleware/permissions');

// Debugar requisições
router.use((req, res, next) => {
  console.log(`Requisição para supercoins: ${req.method} ${req.path}`);
  next();
});

// Middleware de autenticação para todas as rotas
router.use(auth);

// Rota para obter atributos recebidos por um usuário (estatísticas dos SuperCoins)
router.get('/user-attributes/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log('Buscando atributos do usuário:', userId);
    
    // Buscar transações para o usuário
    const { SuperCoinTransaction } = require('../models/SuperCoin');
    const transactions = await SuperCoinTransaction.find({ toUserId: userId })
      .populate('attributeId')
      .exec();
    
    // Agrupar por atributo e contar
    const attributeCounts = {};
    for (const transaction of transactions) {
      if (transaction.attributeId) {
        const attributeId = transaction.attributeId._id.toString();
        
        if (!attributeCounts[attributeId]) {
          attributeCounts[attributeId] = {
            attribute: {
              _id: attributeId,
              name: transaction.attributeId.name,
              description: transaction.attributeId.description,
              color: transaction.attributeId.color || '#e60909',
              icon: transaction.attributeId.icon
            },
            count: 0
          };
        }
        
        attributeCounts[attributeId].count++;
      }
    }
    
    // Converter para array e ordenar por contagem
    const result = Object.values(attributeCounts)
      .sort((a, b) => b.count - a.count);
    
    console.log(`Encontrados ${result.length} atributos para o usuário ${userId}`);
    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar atributos do usuário:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar atributos do usuário' });
  }
});

// Rota para obter o saldo do usuário autenticado
router.get('/balance', async (req, res) => {
  try {
    console.log('Obtendo saldo para o usuário:', req.usuario.id);
    await superCoinController.getBalance(req, res);
  } catch (error) {
    console.error('Erro na rota de saldo:', error);
    res.status(500).json({ mensagem: 'Erro ao obter saldo', error: error.message });
  }
});

// Rota para obter o saldo de um usuário específico (apenas para administradores)
router.get('/balance/:userId', hasPermission('supercoins:manage'), async (req, res) => {
  try {
    console.log('Obtendo saldo para o usuário específico:', req.params.userId);
    await superCoinController.getBalance(req, res);
  } catch (error) {
    console.error('Erro na rota de saldo específico:', error);
    res.status(500).json({ mensagem: 'Erro ao obter saldo', error: error.message });
  }
});

// Rota para enviar moedas para outro usuário
router.post('/send', async (req, res) => {
  try {
    console.log('Enviando moedas, dados:', req.body);
    await superCoinController.sendCoins(req, res);
  } catch (error) {
    console.error('Erro na rota de envio de moedas:', error);
    res.status(500).json({ mensagem: 'Erro ao enviar moedas', error: error.message });
  }
});

// Rota para obter o ranking de Super Coins
router.get('/ranking', async (req, res) => {
  try {
    console.log('Obtendo ranking, tipo:', req.query.type);
    await superCoinController.getCoinRanking(req, res);
  } catch (error) {
    console.error('Erro na rota de ranking:', error);
    res.status(500).json({ mensagem: 'Erro ao obter ranking', error: error.message });
  }
});

// Rota para executar recarga manual (apenas para administradores)
router.post('/recharge', hasPermission('supercoins:manage'), superCoinController.executeManualRecharge);

// Rotas para gerenciar atributos
router.get('/attributes', async (req, res) => {
  try {
    console.log('Obtendo atributos');
    await superCoinController.getAttributes(req, res);
  } catch (error) {
    console.error('Erro na rota de atributos:', error);
    res.status(500).json({ mensagem: 'Erro ao obter atributos', error: error.message });
  }
});

router.post('/attributes', hasPermission('supercoins:manage'), async (req, res) => {
  try {
    console.log('Criando atributo, dados:', req.body);
    await superCoinController.createAttribute(req, res);
  } catch (error) {
    console.error('Erro na rota de criação de atributo:', error);
    res.status(500).json({ mensagem: 'Erro ao criar atributo', error: error.message });
  }
});

router.put('/attributes/:id', hasPermission('supercoins:manage'), async (req, res) => {
  try {
    console.log('Atualizando atributo, id:', req.params.id, 'dados:', req.body);
    await superCoinController.updateAttribute(req, res);
  } catch (error) {
    console.error('Erro na rota de atualização de atributo:', error);
    res.status(500).json({ mensagem: 'Erro ao atualizar atributo', error: error.message });
  }
});

router.delete('/attributes/:id', hasPermission('supercoins:manage'), async (req, res) => {
  try {
    console.log('Excluindo atributo, id:', req.params.id);
    await superCoinController.deleteAttribute(req, res);
  } catch (error) {
    console.error('Erro na rota de exclusão de atributo:', error);
    res.status(500).json({ mensagem: 'Erro ao excluir atributo', error: error.message });
  }
});

// Rota para obter configurações do sistema
router.get('/config', hasPermission('supercoins:manage'), async (req, res) => {
  try {
    console.log('Obtendo configurações');
    await superCoinController.getConfig(req, res);
  } catch (error) {
    console.error('Erro na rota de configurações:', error);
    res.status(500).json({ mensagem: 'Erro ao obter configurações', error: error.message });
  }
});

router.put('/config', hasPermission('supercoins:manage'), async (req, res) => {
  try {
    console.log('Atualizando configurações, dados:', req.body);
    await superCoinController.updateConfig(req, res);
  } catch (error) {
    console.error('Erro na rota de atualização de configurações:', error);
    res.status(500).json({ mensagem: 'Erro ao atualizar configurações', error: error.message });
  }
});

// Rota para obter estatísticas do sistema
router.get('/stats', hasPermission('supercoins:manage'), superCoinController.getSystemStats);

// Rota para obter histórico de transações do usuário
router.get('/transactions', async (req, res) => {
  try {
    console.log('Obtendo transações para o usuário:', req.usuario.id);
    await superCoinController.getUserTransactions(req, res);
  } catch (error) {
    console.error('Erro na rota de transações:', error);
    res.status(500).json({ mensagem: 'Erro ao obter transações', error: error.message });
  }
});

// Rota para obter histórico de transações de um usuário específico (apenas para administradores)
router.get('/transactions/:userId', hasPermission('supercoins:manage'), async (req, res) => {
  try {
    console.log('Obtendo transações para o usuário específico:', req.params.userId);
    await superCoinController.getUserTransactions(req, res);
  } catch (error) {
    console.error('Erro na rota de transações específicas:', error);
    res.status(500).json({ mensagem: 'Erro ao obter transações', error: error.message });
  }
});

module.exports = router;