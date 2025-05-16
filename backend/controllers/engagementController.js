//backend/controllers/engagementController.js

const { Engagement, EngagementAction } = require('../models/Engagement');
const { User } = require('../models');

// Registrar uma ação de engajamento
const trackEngagement = async (userId, actionType, targetId = null, targetModel = null, customActionType = null) => {
  try {
    // Buscar configuração da ação
    const actionConfig = await EngagementAction.findOne({ 
      actionType: customActionType || actionType,
      active: true 
    });
    
    const points = actionConfig?.points || 1;
    
    const engagement = new Engagement({
      userId,
      actionType,
      customActionType,
      points,
      targetId,
      targetModel,
      timestamp: new Date()
    });
    
    await engagement.save();
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
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
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
        $sort: { totalPoints: -1 }
      },
      {
        $limit: parseInt(limit)
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
  createEngagementAction,
  // Adicionar outras funções CRUD conforme necessário
};