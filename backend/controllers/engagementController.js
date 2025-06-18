// controllers/engagementController.js
const { Engagement, EngagementAction } = require('../models/Engagement');
const { User } = require('../models');

// Registrar uma ação de engajamento
const trackEngagement = async (userId, actionType, targetId = null, targetModel = null, customActionType = null) => {
  try {
    // Verificar se o usuário existe
    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      console.error(`Tentativa de registrar engajamento para usuário inexistente: ${userId}`);
      return null;
    }
    
    // Buscar configuração da ação
    let pointsValue = 1; // Valor padrão
    
    try {
      const actionConfig = await EngagementAction.findOne({ 
        actionType: customActionType || actionType,
        active: true 
      });
      
      if (actionConfig && actionConfig.points) {
        pointsValue = actionConfig.points;
      }
    } catch (err) {
      console.error('Erro ao buscar configuração da ação:', err);
      // Continue com o valor padrão
    }
    
    // Criar registro de engajamento
    const engagement = new Engagement({
      userId,
      actionType,
      customActionType,
      points: pointsValue,
      targetId,
      targetModel,
      timestamp: new Date()
    });
    
    // Salvar o registro
    await engagement.save();
    console.log(`Engajamento registrado: ${actionType} por ${userId} - ${pointsValue} pontos`);
    
    return engagement;
  } catch (error) {
    console.error('Erro ao registrar engajamento:', error);
    throw error;
  }
};

// Obter ranking de engajamento
const getEngagementRanking = async (req, res) => {
  try {
    const { period = 'month', limit = 10 } = req.query;
    
    // Calcular data inicial baseada no período
    let startDate = new Date();
    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        const dayOfWeek = startDate.getDay(); // 0 = Domingo, 1 = Segunda, ...
        startDate.setDate(startDate.getDate() - dayOfWeek); // Voltar para o início da semana (domingo)
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate.setDate(1); // Primeiro dia do mês
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        startDate.setMonth(0, 1); // 1º de janeiro
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate = new Date(0); // Todos os tempos
    }
    
    const ranking = await Engagement.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$userId',
          totalPoints: { $sum: '$points' },
          actionsCount: { $sum: 1 }
        }
      },
      {

        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      // NOVA ETAPA: Filtrar usuários que NÃO são administradores
      {
        $match: {
          $and: [
            { 'user.roles': { $not: { $in: ['admin', 'administrator'] } } },
            { 'user.permissions': { $not: { $in: ['admin:access', 'admin:dashboard'] } } }
          ]
        }
      },
      {
        $sort: { totalPoints: -1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          userId: '$_id',
          userName: '$user.nome',
          userAvatar: '$user.avatar',
          userDepartment: '$user.departamento',
          totalPoints: 1,
          actionsCount: 1
        }
      }
    ]);
    
    res.json(ranking);
  } catch (error) {
    console.error('Erro ao buscar ranking:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar ranking' });
  }
};

// CRUD para ações de engajamento
const createEngagementAction = async (req, res) => {
  try {
    const { actionType, displayName, points, description } = req.body;
    
    const newAction = new EngagementAction({
      actionType,
      displayName,
      points,
      description
    });
    
    await newAction.save();
    res.status(201).json(newAction);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao criar ação', error: error.message });
  }
};

module.exports = {
  trackEngagement,
  getEngagementRanking,
  createEngagementAction
};