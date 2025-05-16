//backend/controllers/superCoinController.js
const {
  SuperCoinTransaction,
  SuperCoinBalance,
  SuperCoinAttribute,
  SuperCoinConfig
} = require('../models/SuperCoin');

// Enviar moedas para outro usuário
const sendCoins = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { toUserId, attributeId, message } = req.body;
    const fromUserId = req.usuario.id;
    
    // Verificar se o usuário não está enviando para si mesmo
    if (fromUserId === toUserId) {
      throw new Error('Você não pode enviar moedas para si mesmo');
    }
    
    // Buscar atributo e verificar se está ativo
    const attribute = await SuperCoinAttribute.findById(attributeId);
    if (!attribute || !attribute.active) {
      throw new Error('Atributo inválido ou inativo');
    }
    
    // Verificar saldo do remetente
    let senderBalance = await SuperCoinBalance.findOne({ userId: fromUserId });
    if (!senderBalance) {
      // Criar saldo inicial se não existir
      senderBalance = new SuperCoinBalance({ userId: fromUserId, balance: 0 });
      await senderBalance.save({ session });
    }
    
    if (senderBalance.balance < attribute.cost) {
      throw new Error('Saldo insuficiente');
    }
    
    // Buscar ou criar saldo do destinatário
    let receiverBalance = await SuperCoinBalance.findOne({ userId: toUserId });
    if (!receiverBalance) {
      receiverBalance = new SuperCoinBalance({ userId: toUserId, balance: 0 });
    }
    
    // Realizar a transação
    const transaction = new SuperCoinTransaction({
      fromUserId,
      toUserId,
      amount: attribute.cost,
      attributeId,
      message
    });
    
    // Atualizar saldos
    senderBalance.balance -= attribute.cost;
    senderBalance.totalGiven += attribute.cost;
    await senderBalance.save({ session });
    
    receiverBalance.balance += attribute.cost;
    receiverBalance.totalReceived += attribute.cost;
    await receiverBalance.save({ session });
    
    await transaction.save({ session });
    
    await session.commitTransaction();
    
    res.json({
      success: true,
      transaction,
      newBalance: senderBalance.balance
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ mensagem: error.message });
  } finally {
    session.endSession();
  }
};

// Obter saldo do usuário
const getBalance = async (req, res) => {
  try {
    const userId = req.params.userId || req.usuario.id;
    
    let balance = await SuperCoinBalance.findOne({ userId });
    if (!balance) {
      balance = new SuperCoinBalance({ userId, balance: 0 });
      await balance.save();
    }
    
    res.json(balance);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar saldo' });
  }
};

// Recarga mensal automática (deve ser executada por um job)
const monthlyRecharge = async () => {
  try {
    const config = await SuperCoinConfig.findOne({ active: true });
    if (!config) return;
    
    const today = new Date().getDate();
    if (today !== config.rechargeDay) return;
    
    // Buscar todos os usuários ativos
    const users = await User.find({ ativo: true });
    
    for (const user of users) {
      let balance = await SuperCoinBalance.findOne({ userId: user._id });
      if (!balance) {
        balance = new SuperCoinBalance({ userId: user._id });
      }
      
      // Verificar se já foi recarregado este mês
      const lastRecharge = balance.lastRecharge;
      const now = new Date();
      if (
        lastRecharge &&
        lastRecharge.getMonth() === now.getMonth() &&
        lastRecharge.getFullYear() === now.getFullYear()
      ) {
        continue; // Já foi recarregado este mês
      }
      
      balance.balance += config.monthlyRechargeAmount;
      balance.lastRecharge = now;
      await balance.save();
    }
  } catch (error) {
    console.error('Erro na recarga mensal:', error);
  }
};

// Ranking de Super Coins
const getCoinRanking = async (req, res) => {
  try {
    const { type = 'received' } = req.query;
    
    const sortField = type === 'received' ? 'totalReceived' : 'totalGiven';
    
    const ranking = await SuperCoinBalance.find()
      .sort({ [sortField]: -1 })
      .limit(10)
      .populate('userId', 'nome avatar departamento');
    
    res.json(ranking);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar ranking' });
  }
};

const getAttributes = async (req, res) => {
  try {
    const attributes = await SuperCoinAttribute.find({ active: true });
    res.json(attributes);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar atributos' });
  }
};

const createAttribute = async (req, res) => {
  try {
    const { name, description, cost, icon, color } = req.body;
    
    // Verificar se já existe um atributo com o mesmo nome
    const existingAttribute = await SuperCoinAttribute.findOne({ name });
    if (existingAttribute) {
      return res.status(400).json({ mensagem: 'Já existe um atributo com este nome' });
    }
    
    const attribute = new SuperCoinAttribute({
      name,
      description,
      cost,
      icon,
      color
    });
    
    await attribute.save();
    res.status(201).json(attribute);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao criar atributo' });
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
    if (cost !== undefined) attribute.cost = cost;
    if (icon !== undefined) attribute.icon = icon;
    if (color !== undefined) attribute.color = color;
    if (active !== undefined) attribute.active = active;
    
    await attribute.save();
    res.json(attribute);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao atualizar atributo' });
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
    res.status(500).json({ mensagem: 'Erro ao excluir atributo' });
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
    res.status(500).json({ mensagem: 'Erro ao buscar configurações' });
  }
};

const updateConfig = async (req, res) => {
  try {
    const { monthlyRechargeAmount, rechargeDay } = req.body;
    
    let config = await SuperCoinConfig.findOne({ active: true });
    if (!config) {
      config = new SuperCoinConfig();
    }
    
    if (monthlyRechargeAmount !== undefined) config.monthlyRechargeAmount = monthlyRechargeAmount;
    if (rechargeDay !== undefined) config.rechargeDay = rechargeDay;
    
    await config.save();
    res.json(config);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao atualizar configurações' });
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
    .populate('fromUserId', 'nome avatar')
    .populate('toUserId', 'nome avatar')
    .populate('attributeId');
    
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar transações' });
  }
};
// Obter usuários mais ativos
const getActiveUsers = async (req, res) => {
  try {
    const { from, to, limit = 10 } = req.query;
    
    const startDate = new Date(from);
    const endDate = new Date(to);
    
    // Agregação para encontrar os usuários mais ativos
    const activeUsers = await Engagement.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: "$userId",
          totalActions: { $sum: 1 },
          views: {
            $sum: {
              $cond: [{ $in: ["$actionType", ["article_view", "file_view", "post_view"]] }, 1, 0]
            }
          },
          interactions: {
            $sum: {
              $cond: [{ $in: ["$actionType", ["post_like", "post_comment", "file_share"]] }, 1, 0]
            }
          },
          lastActivity: { $max: "$timestamp" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          nome: "$userDetails.nome",
          departamento: "$userDetails.departamento",
          cargo: "$userDetails.cargo",
          avatar: "$userDetails.avatar",
          totalActions: 1,
          views: 1,
          interactions: 1,
          lastActivity: 1
        }
      },
      { $sort: { totalActions: -1 } },
      { $limit: parseInt(limit) }
    ]);
    
    res.json(activeUsers);
  } catch (error) {
    console.error('Erro ao buscar usuários ativos:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar usuários ativos' });
  }
};

// Obter estatísticas de Super Coins
const getSuperCoinsStats = async (req, res) => {
  try {
    const { from, to } = req.query;
    
    const startDate = new Date(from);
    const endDate = new Date(to);
    
    // 1. Estatísticas gerais
    const generalStats = await SuperCoinTransaction.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalCoinsTransferred: { $sum: "$amount" },
          uniqueSenders: { $addToSet: "$fromUserId" },
          uniqueReceivers: { $addToSet: "$toUserId" }
        }
      },
      {
        $project: {
          _id: 0,
          totalTransactions: 1,
          totalCoinsTransferred: 1,
          uniqueSenders: { $size: "$uniqueSenders" },
          uniqueReceivers: { $size: "$uniqueReceivers" }
        }
      }
    ]);
    
    // 2. Tendência diária
    const dailyTrends = await SuperCoinTransaction.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          transactions: { $sum: 1 },
          coinsTransferred: { $sum: "$amount" }
        }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          transactions: 1,
          coinsTransferred: 1
        }
      },
      { $sort: { date: 1 } }
    ]);
    
    // 3. Atributos mais populares
    const popularAttributes = await SuperCoinTransaction.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: "$attributeId",
          totalUsed: { $sum: 1 },
          totalCoins: { $sum: "$amount" }
        }
      },
      {
        $lookup: {
          from: "superCoinAttributes",
          localField: "_id",
          foreignField: "_id",
          as: "attributeDetails"
        }
      },
      { $unwind: "$attributeDetails" },
      {
        $project: {
          _id: 0,
          attributeId: "$_id",
          name: "$attributeDetails.name",
          description: "$attributeDetails.description",
          cost: "$attributeDetails.cost",
          icon: "$attributeDetails.icon",
          color: "$attributeDetails.color",
          totalUsed: 1,
          totalCoins: 1
        }
      },
      { $sort: { totalUsed: -1 } },
      { $limit: 10 }
    ]);
    
    // 4. Maiores doadores e recebedores
    const topUsers = await Promise.all([
      // Top senders
      SuperCoinTransaction.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: "$fromUserId",
            totalSent: { $sum: "$amount" },
            transactions: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "userDetails"
          }
        },
        { $unwind: "$userDetails" },
        {
          $project: {
            _id: 0,
            userId: "$_id",
            name: "$userDetails.nome",
            department: "$userDetails.departamento",
            avatar: "$userDetails.avatar",
            totalSent: 1,
            transactions: 1
          }
        },
        { $sort: { totalSent: -1 } },
        { $limit: 5 }
      ]),
      
      // Top receivers
      SuperCoinTransaction.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: "$toUserId",
            totalReceived: { $sum: "$amount" },
            transactions: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "userDetails"
          }
        },
        { $unwind: "$userDetails" },
        {
          $project: {
            _id: 0,
            userId: "$_id",
            name: "$userDetails.nome",
            department: "$userDetails.departamento",
            avatar: "$userDetails.avatar",
            totalReceived: 1,
            transactions: 1
          }
        },
        { $sort: { totalReceived: -1 } },
        { $limit: 5 }
      ])
    ]);
    
    res.json({
      generalStats: generalStats[0] || {
        totalTransactions: 0,
        totalCoinsTransferred: 0,
        uniqueSenders: 0,
        uniqueReceivers: 0
      },
      dailyTrends,
      popularAttributes,
      topSenders: topUsers[0],
      topReceivers: topUsers[1]
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de Super Coins:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar estatísticas de Super Coins' });
  }
};

module.exports = {
  sendCoins,
  getBalance,
  monthlyRecharge,
  getCoinRanking,
  getAttributes,
  createAttribute,
  updateAttribute,
  deleteAttribute,
  getConfig,
  updateConfig,
  getUserTransactions};