// backend/controllers/superCoinController.js
const mongoose = require('mongoose');
const { User } = require('../models');
const { manualRecharge, performMonthlyRecharge } = require('../jobs/superCoinsRechargeJob');
const {
  SuperCoinTransaction,
  SuperCoinBalance,
  SuperCoinAttribute,
  SuperCoinConfig
} = require('../models/SuperCoin');

// Enviar moedas para outro usuário - Versão sem transações
const sendCoins = async (req, res) => {
  try {
    const { toUserId, attributeId, message } = req.body;
    const fromUserId = req.usuario.id;
    
    console.log('Tentando enviar moedas:', {
      fromUserId,
      toUserId,
      attributeId,
      message: message || 'Sem mensagem'
    });
    
    // Verificar se o usuário não está enviando para si mesmo
    if (fromUserId === toUserId) {
      throw new Error('Você não pode enviar moedas para si mesmo');
    }
    
    // Buscar atributo e verificar se está ativo
    const attribute = await SuperCoinAttribute.findById(attributeId);
    if (!attribute || !attribute.active) {
      throw new Error('Atributo inválido ou inativo');
    }
    
    // Verificação de permissão para mensagem - CORRIGIDA
    let canSendMessage = false;
    // Só verificamos a permissão se houver uma mensagem
    if (message && message.trim().length > 0) {
      try {
        // Buscar permissões do usuário
        const user = await User.findById(fromUserId);
        if (user && user.permissions) {
          canSendMessage = user.permissions.includes('supercoins:send_message');
        }
        
        // Verificar também nas roles (papéis)
        if (!canSendMessage && user.roles && user.roles.length > 0) {
          const { Role } = require('../models');
          const userRoles = await Role.find({ name: { $in: user.roles } });
          
          // Verificar se algum papel tem a permissão
          for (const role of userRoles) {
            if (role.permissions && role.permissions.includes('supercoins:send_message')) {
              canSendMessage = true;
              break;
            }
          }
        }
        
        // Se não tem permissão e tentou enviar mensagem
        if (!canSendMessage) {
          console.log('Usuário não tem permissão para enviar mensagens');
        }
      } catch (permError) {
        console.error('Erro ao verificar permissão:', permError);
        // Em caso de erro, presumimos que o usuário não tem permissão
        canSendMessage = false;
      }
    }
    
    // Se não tem permissão para enviar mensagem e tentou enviar uma
    if (message && message.trim().length > 0 && !canSendMessage) {
      console.log('Tentativa de enviar mensagem sem permissão');
      // Em vez de lançar erro, apenas ignoramos a mensagem
      console.log('Mensagem será ignorada');
    }
    
    // Verificar saldo do remetente
    let senderBalance = await SuperCoinBalance.findOne({ userId: fromUserId });
    if (!senderBalance) {
      // Criar saldo inicial se não existir
      console.log('Criando saldo inicial para o remetente:', fromUserId);
      senderBalance = new SuperCoinBalance({ userId: fromUserId, balance: 0 });
      await senderBalance.save();
    }
    
    if (senderBalance.balance < attribute.cost) {
      throw new Error('Saldo insuficiente');
    }
    
    // Buscar ou criar saldo do destinatário
    let receiverBalance = await SuperCoinBalance.findOne({ userId: toUserId });
    if (!receiverBalance) {
      console.log('Criando saldo inicial para o destinatário:', toUserId);
      receiverBalance = new SuperCoinBalance({ userId: toUserId, balance: 0 });
      await receiverBalance.save();
    }
    
    // Realizar a transação - CORRIGIDO
    const finalMessage = canSendMessage ? (message || '') : '';
    const transaction = new SuperCoinTransaction({
      fromUserId,
      toUserId,
      amount: attribute.cost,
      attributeId,
      message: finalMessage // Usar mensagem só se tiver permissão
    });
    
    // Atualizar saldos
    senderBalance.balance -= attribute.cost;
    senderBalance.totalGiven += attribute.cost;
    await senderBalance.save();
    
    receiverBalance.balance += attribute.cost;
    receiverBalance.totalReceived += attribute.cost;
    await receiverBalance.save();
    
    await transaction.save();
    
    // Criar notificação para o destinatário
    try {
      const { Notification } = require('../models/Notification');
      const senderUser = await User.findById(fromUserId).select('nome avatar');
      
      const notification = new Notification({
        userId: toUserId,
        title: 'Super Coins Recebidas',
        message: `${senderUser ? senderUser.nome : 'Alguém'} enviou ${attribute.cost} Super Coins para você${finalMessage ? ': ' + finalMessage : '!'}`,
        type: 'supercoins',
        data: {
          transactionId: transaction._id,
          attributeId: attribute._id,
          attributeName: attribute.name,
          amount: attribute.cost,
          senderId: fromUserId,
          senderName: senderUser ? senderUser.nome : null,
          senderAvatar: senderUser ? senderUser.avatar : null,
          color: attribute.color
        },
        isRead: false
      });
      
      await notification.save();
      console.log('Notificação criada para o usuário:', toUserId);
    } catch (notifError) {
      console.error('Erro ao criar notificação:', notifError);
      // Continuar o fluxo mesmo se a notificação falhar
    }
    
    console.log('Transação de moedas realizada com sucesso:', transaction._id);
    
    res.json({
      success: true,
      transaction,
      newBalance: senderBalance.balance
    });
  } catch (error) {
    console.error('Erro ao enviar moedas:', error.message);
    res.status(400).json({ mensagem: error.message });
  }
};

// Obter saldo do usuário
const getBalance = async (req, res) => {
  try {
    const userId = req.params.userId || req.usuario.id;
    
    console.log('Buscando saldo do usuário:', userId);
    
    let balance = await SuperCoinBalance.findOne({ userId });
    if (!balance) {
      console.log('Saldo não encontrado, criando novo para:', userId);
      balance = new SuperCoinBalance({ userId, balance: 0 });
      await balance.save();
    }
    
    res.json(balance);
  } catch (error) {
    console.error('Erro ao buscar saldo:', error.message);
    res.status(500).json({ mensagem: 'Erro ao buscar saldo' });
  }
};

// Recarga mensal automática (executada por cron)
const monthlyRecharge = async () => {
  try {
    return await performMonthlyRecharge();
  } catch (error) {
    console.error('Erro na recarga mensal:', error);
    return { success: false, error: error.message };
  }
};

// Executar recarga manual (via API)
const executeManualRecharge = async (req, res) => {
  try {
    // Verificar permissão
    if (!req.usuario || !req.usuario.id) {
      return res.status(401).json({ mensagem: 'Não autorizado' });
    }
    
    const result = await manualRecharge();
    res.json(result);
  } catch (error) {
    console.error('Erro na recarga manual:', error);
    res.status(500).json({ mensagem: 'Erro na recarga manual', error: error.message });
  }
};

// Ranking de Super Coins
const getCoinRanking = async (req, res) => {
  try {
    const { type = 'received' } = req.query;
    console.log('Buscando ranking de tipo:', type);
    
    // Definir o campo para ordenação
    const sortField = type === 'received' ? 'totalReceived' : 'totalGiven';
    
    // Buscar balances com valores > 0 para o campo específico
    const balances = await SuperCoinBalance.find({
      [sortField]: { $gt: 0 }
    })
    .sort({ [sortField]: -1 })
    .limit(10);
    
    // Preencher os detalhes do usuário manualmente para evitar erros de população
    const formattedRanking = [];
    
    for (const balance of balances) {
      try {
        // Buscar o usuário associado ao saldo
        const user = await User.findById(balance.userId).select('nome avatar departamento');
        
        // Adicionar ao ranking formatado
        formattedRanking.push({
          userId: balance.userId.toString(),
          userName: user ? user.nome : 'Usuário Desconhecido',
          userAvatar: user ? user.avatar : null,
          userDepartment: user ? user.departamento : null,
          totalPoints: type === 'received' ? balance.totalReceived : balance.totalGiven
        });
      } catch (userError) {
        console.error(`Erro ao buscar usuário ${balance.userId}:`, userError);
        // Incluir no ranking mesmo se não encontrar o usuário
        formattedRanking.push({
          userId: balance.userId.toString(),
          userName: 'Usuário Desconhecido',
          userAvatar: null,
          userDepartment: null,
          totalPoints: type === 'received' ? balance.totalReceived : balance.totalGiven
        });
      }
    }
    
    console.log(`Ranking formatado com ${formattedRanking.length} usuários`);
    res.json(formattedRanking);
  } catch (error) {
    console.error('Erro ao buscar ranking:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar ranking de moedas' });
  }
};

const getAttributes = async (req, res) => {
  try {
    const attributes = await SuperCoinAttribute.find({ active: true });
    console.log(`Encontrados ${attributes.length} atributos ativos`);
    res.json(attributes);
  } catch (error) {
    console.error('Erro ao buscar atributos:', error.message);
    res.status(500).json({ mensagem: 'Erro ao buscar atributos' });
  }
};

const createAttribute = async (req, res) => {
  try {
    const { name, description, cost, icon, color } = req.body;

	// Verificar valores obrigatórios
    if (!name || !cost) {
      return res.status(400).json({ mensagem: 'Nome e custo são obrigatórios' });    
	}
    // Verificar se já existe um atributo com o mesmo nome
    const existingAttribute = await SuperCoinAttribute.findOne({ name });
    if (existingAttribute) {
      return res.status(400).json({ mensagem: 'Já existe um atributo com este nome' });
    }
    
    const attribute = new SuperCoinAttribute({
      name,
      description,
      cost: Number(cost),
      icon,
      color: color || '#e60909'
    });
    
    await attribute.save();
    res.status(201).json(attribute);
  } catch (error) {
    console.error('Erro ao criar atributo:', error);
    res.status(500).json({ mensagem: 'Erro ao criar atributo', error: error.message });
  }
};

const updateAttribute = async (req, res) => {
  try {
    const { name, description, cost, icon, color, active } = req.body;
    
    // Verificar se o atributo existe
    const attribute = await SuperCoinAttribute.findById(req.params.id);
    if (!attribute) {
      return res.status(404).json({ mensagem: 'Atributo não encontrado' });
    }
    
    // Verificar se já existe outro atributo com o mesmo nome
    if (name && name !== attribute.name) {
      const existingAttribute = await SuperCoinAttribute.findOne({ name });
      if (existingAttribute) {
        return res.status(400).json({ mensagem: 'Já existe outro atributo com este nome' });
      }
    }
    
    // Atualizar os campos
    if (name) attribute.name = name;
    if (description !== undefined) attribute.description = description;
    if (cost !== undefined) attribute.cost = Number(cost);
    if (icon !== undefined) attribute.icon = icon;
    if (color !== undefined) attribute.color = color;
    if (active !== undefined) attribute.active = active;
    
    await attribute.save();
    res.json(attribute);
  } catch (error) {
    console.error('Erro ao atualizar atributo:', error);
    res.status(500).json({ mensagem: 'Erro ao atualizar atributo', error: error.message });
  }
};

const deleteAttribute = async (req, res) => {
  try {
    // Verificar se o atributo existe
    const attribute = await SuperCoinAttribute.findById(req.params.id);
    if (!attribute) {
      return res.status(404).json({ mensagem: 'Atributo não encontrado' });
    }
    
    // Verificar se há transações usando este atributo
    const transactionsCount = await SuperCoinTransaction.countDocuments({ attributeId: req.params.id });
    if (transactionsCount > 0) {
      // Em vez de excluir, apenas marcar como inativo
      attribute.active = false;
      await attribute.save();
      return res.json({ 
        mensagem: 'Atributo marcado como inativo pois já possui transações vinculadas',
        deactivated: true
      });
    }
    
    // Se não houver transações, excluir efetivamente
    await attribute.deleteOne();
    res.json({ mensagem: 'Atributo excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir atributo:', error);
    res.status(500).json({ mensagem: 'Erro ao excluir atributo', error: error.message });
  }
};

// Funções de configuração
const getConfig = async (req, res) => {
  try {
    let config = await SuperCoinConfig.findOne({ active: true });
    if (!config) {
      // Criar configuração padrão se não existir
      config = new SuperCoinConfig();
      await config.save();
    }
    res.json(config);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error.message);
    res.status(500).json({ mensagem: 'Erro ao buscar configurações' });
  }
};

const updateConfig = async (req, res) => {
  try {
    const { monthlyRechargeAmount, rechargeDay, rechargeMode } = req.body;
    
    let config = await SuperCoinConfig.findOne({ active: true });
    if (!config) {
      config = new SuperCoinConfig();
    }
    // Validar valores
    if (monthlyRechargeAmount !== undefined) {
      const amount = Number(monthlyRechargeAmount);
      if (isNaN(amount) || amount < 0) {
        return res.status(400).json({ mensagem: 'Valor de recarga mensal inválido' });
      }
      config.monthlyRechargeAmount = amount;
    }
    
    if (rechargeDay !== undefined) {
      const day = Number(rechargeDay);
      if (isNaN(day) || day < 1 || day > 28) {
        return res.status(400).json({ mensagem: 'Dia de recarga deve ser entre 1 e 28' });
      }
      config.rechargeDay = day;
    }
    
    if (rechargeMode !== undefined) {
      if (!['reset', 'complement'].includes(rechargeMode)) {
        return res.status(400).json({ mensagem: 'Modo de recarga inválido. Use "reset" ou "complement"' });
      }
      config.rechargeMode = rechargeMode;
    }
    
    await config.save();
    res.json(config);
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({ mensagem: 'Erro ao atualizar configurações', error: error.message });
  }
};

// Função para obter transações do usuário
const getUserTransactions = async (req, res) => {
  try {
    const userId = req.params.userId || req.usuario.id;
    
    // Buscar todas as transações onde o usuário é remetente ou destinatário
    const transactions = await SuperCoinTransaction.find({
      $or: [
        { fromUserId: userId },
        { toUserId: userId }
      ]
    })
    .sort({ timestamp: -1 })
    .populate('fromUserId', 'nome avatar departamento')
    .populate('toUserId', 'nome avatar departamento')
    .populate('attributeId');
    
    res.json(transactions);
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar transações', error: error.message });
  }
};

// Estatísticas do sistema de moedas
const getSystemStats = async (req, res) => {
  try {
    // Total de usuários com saldo
    const usersWithBalance = await SuperCoinBalance.countDocuments();
    
    // Total de moedas em circulação
    const totalCoinsResult = await SuperCoinBalance.aggregate([
      { $group: { _id: null, total: { $sum: "$balance" } } }
    ]);
    const totalCoins = totalCoinsResult.length > 0 ? totalCoinsResult[0].total : 0;
    
    // Total de transações
    const totalTransactions = await SuperCoinTransaction.countDocuments();
    
    // Total de atributos
    const totalAttributes = await SuperCoinAttribute.countDocuments();
    
    // Transações nos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTransactions = await SuperCoinTransaction.countDocuments({
      timestamp: { $gte: thirtyDaysAgo }
    });
    
    // Valor total de moedas transacionadas
    const totalAmountResult = await SuperCoinTransaction.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalAmount = totalAmountResult.length > 0 ? totalAmountResult[0].total : 0;
    
    res.json({
      usersWithBalance,
      totalCoins,
      totalTransactions,
      totalAttributes,
      recentTransactions,
      totalAmount
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar estatísticas', error: error.message });
  }
};
module.exports = {
  sendCoins,
  getBalance,
  monthlyRecharge,
  executeManualRecharge,
  getCoinRanking,
  getAttributes,
  createAttribute,
  updateAttribute,
  deleteAttribute,
  getConfig,
  updateConfig,
  getUserTransactions,
  getSystemStats
};