// backend/routes/engagement.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const engagementController = require('../controllers/engagementController');
const auth = require('../middleware/auth');
const { hasPermission } = require('../middleware/permissions');

/**
 * @route   GET /api/engagement/ranking
 * @desc    Obter ranking de engajamento
 * @access  Private
 */
router.get('/ranking', auth, async (req, res) => {
  try {
    await engagementController.getEngagementRanking(req, res);
  } catch (error) {
    console.error('Erro na rota de ranking:', error);
    res.status(500).json({ mensagem: 'Erro interno do servidor', error: error.message });
  }
});

/**
 * @route   POST /api/engagement/track
 * @desc    Registrar uma ação de engajamento manualmente
 * @access  Private (Admin)
 */
router.post('/track', auth, hasPermission('admin:access'), async (req, res) => {
  try {
    const { userId, actionType, targetId, targetModel, customActionType } = req.body;
    
    if (!userId || !actionType) {
      return res.status(400).json({ mensagem: 'UserId e actionType são obrigatórios' });
    }
    
    const engagement = await engagementController.trackEngagement(
      userId,
      actionType,
      targetId,
      targetModel,
      customActionType
    );
    
    res.status(201).json(engagement);
  } catch (error) {
    console.error('Erro ao registrar engajamento:', error);
    res.status(500).json({ mensagem: 'Erro ao registrar engajamento', error: error.message });
  }
});

/**
 * @route   GET /api/engagement/user/:userId
 * @desc    Obter histórico de engajamento de um usuário
 * @access  Private
 */
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, page = 1 } = req.query;
    
    const { Engagement } = require('../models/Engagement');
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const engagements = await Engagement.find({ userId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalCount = await Engagement.countDocuments({ userId });
    
    res.json({
      engagements,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar histórico de engajamento:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar histórico', error: error.message });
  }
});

/**
 * @route   GET /api/engagement/summary
 * @desc    Obter resumo de engajamento do usuário atual
 * @access  Private
 */
router.get('/summary', auth, async (req, res) => {
  try {
    const userId = req.usuario.id;
    
    const { Engagement } = require('../models/Engagement');
    
    // Calcular estatísticas do usuário
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    // Totais
    const totalPoints = await Engagement.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: "$points" } } }
    ]);
    
    // Pontos hoje
    const todayPoints = await Engagement.aggregate([
      { 
        $match: { 
          userId: mongoose.Types.ObjectId(userId),
          timestamp: { $gte: today } 
        } 
      },
      { $group: { _id: null, total: { $sum: "$points" } } }
    ]);
    
    // Pontos este mês
    const monthPoints = await Engagement.aggregate([
      { 
        $match: { 
          userId: mongoose.Types.ObjectId(userId),
          timestamp: { $gte: thisMonth } 
        } 
      },
      { $group: { _id: null, total: { $sum: "$points" } } }
    ]);
    
    // Posição no ranking
    const userRanking = await Engagement.aggregate([
      { $group: { _id: "$userId", total: { $sum: "$points" } } },
      { $sort: { total: -1 } },
      { 
        $group: { 
          _id: null,
          users: { $push: { userId: "$_id", total: "$total" } }
        }
      },
      { $unwind: { path: "$users", includeArrayIndex: "position" } },
      { $match: { "users.userId": mongoose.Types.ObjectId(userId) } },
      { $project: { position: 1, total: "$users.total" } }
    ]);
    
    res.json({
      totalPoints: totalPoints.length > 0 ? totalPoints[0].total : 0,
      todayPoints: todayPoints.length > 0 ? todayPoints[0].total : 0,
      monthPoints: monthPoints.length > 0 ? monthPoints[0].total : 0,
      ranking: userRanking.length > 0 ? userRanking[0].position + 1 : null,
      totalEngagements: await Engagement.countDocuments({ userId })
    });
  } catch (error) {
    console.error('Erro ao buscar resumo de engajamento:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar resumo', error: error.message });
  }
});

/**
 * @route   GET /api/engagement/actions
 * @desc    Obter lista de tipos de ações de engajamento
 * @access  Private (Admin)
 */
router.get('/actions', auth, hasPermission('admin:access'), async (req, res) => {
  try {
    const { EngagementAction } = require('../models/Engagement');
    const actions = await EngagementAction.find().sort({ actionType: 1 });
    res.json(actions);
  } catch (error) {
    console.error('Erro ao buscar ações de engajamento:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar ações', error: error.message });
  }
});

/**
 * @route   POST /api/engagement/actions
 * @desc    Criar novo tipo de ação de engajamento
 * @access  Private (Admin)
 */
router.post('/actions', auth, hasPermission('admin:access'), async (req, res) => {
  try {
    await engagementController.createEngagementAction(req, res);
  } catch (error) {
    console.error('Erro ao criar ação de engajamento:', error);
    res.status(500).json({ mensagem: 'Erro ao criar ação', error: error.message });
  }
});

/**
 * @route   PUT /api/engagement/actions/:actionType
 * @desc    Atualizar tipo de ação de engajamento
 * @access  Private (Admin)
 */
router.put('/actions/:actionType', auth, hasPermission('admin:access'), async (req, res) => {
  try {
    const { actionType } = req.params;
    const { displayName, points, description, active } = req.body;
    
    const { EngagementAction } = require('../models/Engagement');
    
    const updatedAction = await EngagementAction.findOneAndUpdate(
      { actionType },
      { 
        $set: { 
          displayName, 
          points, 
          description, 
          active
        } 
      },
      { new: true }
    );
    
    if (!updatedAction) {
      return res.status(404).json({ mensagem: 'Ação não encontrada' });
    }
    
    res.json(updatedAction);
  } catch (error) {
    console.error('Erro ao atualizar ação de engajamento:', error);
    res.status(500).json({ mensagem: 'Erro ao atualizar ação', error: error.message });
  }
});

/**
 * @route   DELETE /api/engagement/actions/:actionType
 * @desc    Remover tipo de ação de engajamento
 * @access  Private (Admin)
 */
router.delete('/actions/:actionType', auth, hasPermission('admin:access'), async (req, res) => {
  try {
    const { actionType } = req.params;
    
    const { EngagementAction, Engagement } = require('../models/Engagement');
    
    // Verificar se existem registros usando este tipo de ação
    const usageCount = await Engagement.countDocuments({ 
      $or: [
        { actionType },
        { customActionType: actionType }
      ]
    });
    
    if (usageCount > 0) {
      return res.status(400).json({ 
        mensagem: 'Esta ação não pode ser excluída porque está em uso',
        usageCount
      });
    }
    
    const deletedAction = await EngagementAction.findOneAndDelete({ actionType });
    
    if (!deletedAction) {
      return res.status(404).json({ mensagem: 'Ação não encontrada' });
    }
    
    res.json({ mensagem: 'Ação excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir ação de engajamento:', error);
    res.status(500).json({ mensagem: 'Erro ao excluir ação', error: error.message });
  }
});

module.exports = router;