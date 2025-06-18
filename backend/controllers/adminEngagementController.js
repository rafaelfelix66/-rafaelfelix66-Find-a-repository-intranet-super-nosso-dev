// backend/controllers/adminEngagementController.js - versão atualizada

const { Engagement, EngagementAction } = require('../models/Engagement');
const { Post, Article, File, User } = require('../models');
const { 
  SuperCoinTransaction, 
  SuperCoinAttribute, 
  SuperCoinBalance 
} = require('../models/SuperCoin');
const mongoose = require('mongoose');

// Obter estatísticas de engajamento com banners
const getBannerEngagementStats = async (req, res) => {
  try {
    const { from, to } = req.query;
    
    const startDate = new Date(from || Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date(to || Date.now());
    
    const { Engagement } = require('../models/Engagement');
    const { Banner } = require('../models');
    
    // Buscar todos os banners
    const banners = await Banner.find({}, 'title description');
    const bannerIds = banners.map(banner => banner._id);
    
    // Obter estatísticas gerais de visualizações e cliques
    const overallStats = await Engagement.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          actionType: { $in: ['banner_view', 'banner_click'] },
          targetModel: 'Banner'
        }
      },
      {
        $group: {
          _id: '$actionType',
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          _id: 0,
          actionType: '$_id',
          count: 1,
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      }
    ]);
    
    // Calcular estatísticas de visualizações e cliques por dia
    const dailyStats = await Engagement.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          actionType: { $in: ['banner_view', 'banner_click'] },
          targetModel: 'Banner'
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            actionType: '$actionType'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);
    
    // Consolidar estatísticas diárias
    const days = new Set();
    dailyStats.forEach(stat => days.add(stat._id.date));
    
    const formattedDailyStats = Array.from(days).map(date => {
      const dayStats = { date };
      
      dailyStats.forEach(stat => {
        if (stat._id.date === date) {
          if (stat._id.actionType === 'banner_view') {
            dayStats.views = stat.count;
          } else if (stat._id.actionType === 'banner_click') {
            dayStats.clicks = stat.count;
          }
        }
      });
      
      // Garantir que todos os campos existam
      dayStats.views = dayStats.views || 0;
      dayStats.clicks = dayStats.clicks || 0;
      
      // Calcular CTR
      dayStats.ctr = dayStats.views > 0 ? (dayStats.clicks / dayStats.views) * 100 : 0;
      
      return dayStats;
    });
    
    // Ordenar por data
    formattedDailyStats.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Obter estatísticas por banner
    const bannerStats = await Engagement.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          actionType: { $in: ['banner_view', 'banner_click'] },
          targetModel: 'Banner',
          targetId: { $in: bannerIds.map(id => new mongoose.Types.ObjectId(id)) }
        }
      },
      {
        $group: {
          _id: {
            bannerId: '$targetId',
            actionType: '$actionType'
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Preparar estatísticas por banner
    const formattedBannerStats = banners.map(banner => {
      const stats = {
        bannerId: banner._id,
        title: banner.title,
        description: banner.description,
        views: 0,
        clicks: 0,
        uniqueViewers: 0,
        uniqueClickers: 0,
        ctr: 0
      };
      
      bannerStats.forEach(stat => {
        if (stat._id.bannerId.equals(banner._id)) {
          if (stat._id.actionType === 'banner_view') {
            stats.views = stat.count;
            stats.uniqueViewers = stat.uniqueUsers.length;
          } else if (stat._id.actionType === 'banner_click') {
            stats.clicks = stat.count;
            stats.uniqueClickers = stat.uniqueUsers.length;
          }
        }
      });
      
      // Calcular CTR
      stats.ctr = stats.views > 0 ? (stats.clicks / stats.views) * 100 : 0;
      
      return stats;
    });
    
    // Ordenar por visualizações (decrescente)
    formattedBannerStats.sort((a, b) => b.views - a.views);
    
    // Extrair dados de visualizações e cliques
    const viewsStats = overallStats.find(stat => stat.actionType === 'banner_view') || { 
      count: 0, 
      uniqueUsers: 0 
    };
    
    const clicksStats = overallStats.find(stat => stat.actionType === 'banner_click') || { 
      count: 0, 
      uniqueUsers: 0 
    };
    
    // Calcular CTR global
    const globalCtr = viewsStats.count > 0 ? (clicksStats.count / viewsStats.count) * 100 : 0;
    
    res.json({
      period: {
        from: startDate,
        to: endDate
      },
      overall: {
        views: viewsStats.count,
        clicks: clicksStats.count,
        uniqueViewers: viewsStats.uniqueUsers,
        uniqueClickers: clicksStats.uniqueUsers,
        ctr: globalCtr
      },
      dailyStats: formattedDailyStats,
      bannerStats: formattedBannerStats
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de banners:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar estatísticas', error: error.message });
  }
};

// Obter timeline de engajamento
const getEngagementTimeline = async (req, res) => {
  try {
    const { from, to, contentType } = req.query;
    
    const matchStage = {
      timestamp: {
        $gte: new Date(from),
        $lte: new Date(to)
      }
    };
    
    if (contentType && contentType !== 'all') {
      matchStage.targetModel = contentType;
    }
    
    const timeline = await Engagement.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }
          },
          views: {
            $sum: {
              $cond: [{ $in: ["$actionType", ["article_view", "post_view", "file_view"]] }, "$points", 0]
            }
          },
          interactions: {
            $sum: {
              $cond: [{ $in: ["$actionType", ["post_like", "post_comment", "file_share"]] }, "$points", 0]
            }
          },
          totalPoints: { $sum: "$points" },
          uniqueUsers: { $addToSet: "$userId" }
        }
      },
      {
        $project: {
          date: "$_id.date",
          views: 1,
          interactions: 1,
          totalPoints: 1,
          uniqueUsers: { $size: "$uniqueUsers" }
        }
      },
      { $sort: { date: 1 } }
    ]);
    
    res.json(timeline);
  } catch (error) {
    console.error('Erro ao buscar timeline:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar dados' });
  }
};

// Obter estatísticas de conteúdo
const getContentStats = async (req, res) => {
  try {
    const { from, to, contentType } = req.query;
    
    const matchStage = {
      timestamp: {
        $gte: new Date(from),
        $lte: new Date(to)
      }
    };
    
    if (contentType && contentType !== 'all') {
      matchStage.targetModel = contentType;
    }
    
    const stats = await Engagement.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            contentId: "$targetId",
            contentType: "$targetModel"
          },
          views: {
            $sum: {
              $cond: [{ $in: ["$actionType", ["article_view", "post_view", "file_view"]] }, "$points", 0]
            }
          },
          interactions: {
            $sum: {
              $cond: [{ $in: ["$actionType", ["post_like", "post_comment", "file_share"]] }, "$points", 0]
            }
          },
          totalPoints: { $sum: "$points" },
          uniqueUsers: { $addToSet: "$userId" }
        }
      },
      {
        $project: {
          contentId: "$_id.contentId",
          contentType: "$_id.contentType",
          views: 1,
          interactions: 1,
          totalPoints: 1,
          uniqueUsers: { $size: "$uniqueUsers" }
        }
      },
      { $sort: { totalPoints: -1 } },
      { $limit: 20 }
    ]);
    
    // Buscar títulos dos conteúdos
    for (const stat of stats) {
      let title = "Conteúdo não encontrado";
      
      if (!stat.contentId) {
        stat.title = "Conteúdo sem ID";
        continue;
      }
      
      try {
        switch (stat.contentType) {
          case 'Post':
            const post = await Post.findById(stat.contentId);
            title = post?.text?.substring(0, 50) || "Post sem texto";
            break;
          case 'Article':
            const article = await Article.findById(stat.contentId);
            title = article?.title || "Artigo sem título";
            break;
          case 'File':
            const file = await File.findById(stat.contentId);
            title = file?.name || "Arquivo sem nome";
            break;
          default:
            title = `${stat.contentType || 'Tipo desconhecido'} sem título`;
        }
      } catch (error) {
        console.error(`Erro ao buscar conteúdo ${stat.contentId}:`, error);
      }
      
      stat.title = title;
    }
    
    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar dados' });
  }
};

// Obter usuários mais ativos - adaptado para sua estrutura
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
          totalPoints: { $sum: "$points" },
          totalActions: { $sum: 1 },
          views: {
            $sum: {
              $cond: [{ $in: ["$actionType", ["article_view", "post_view", "file_view"]] }, 1, 0]
            }
          },
          interactions: {
            $sum: {
              $cond: [{ $in: ["$actionType", ["post_like", "post_comment", "file_share"]] }, 1, 0]
            }
          },
          postCreations: {
            $sum: {
              $cond: [{ $eq: ["$actionType", "post_create"] }, 1, 0]
            }
          },
          loginCount: {
            $sum: {
              $cond: [{ $eq: ["$actionType", "login"] }, 1, 0]
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
      { 
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          nome: { $ifNull: ["$userDetails.nome", "Usuário Desconhecido"] },
          departamento: { $ifNull: ["$userDetails.departamento", ""] },
          cargo: { $ifNull: ["$userDetails.cargo", ""] },
          avatar: { $ifNull: ["$userDetails.avatar", null] },
          totalPoints: 1,
          totalActions: 1,
          views: 1,
          interactions: 1,
          postCreations: 1,
          loginCount: 1,
          lastActivity: 1
        }
      },
      { $sort: { totalPoints: -1 } },
      { $limit: parseInt(limit) }
    ]);
    
    res.json(activeUsers);
  } catch (error) {
    console.error('Erro ao buscar usuários ativos:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar usuários ativos' });
  }
};

// Obter estatísticas dos tipos de ações de engajamento
const getActionStats = async (req, res) => {
  try {
    const { from, to } = req.query;
    
    const startDate = new Date(from);
    const endDate = new Date(to);
    
    const actionStats = await Engagement.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: "$actionType",
          count: { $sum: 1 },
          totalPoints: { $sum: "$points" },
          uniqueUsers: { $addToSet: "$userId" }
        }
      },
      {
        $lookup: {
          from: "engagementactions",
          localField: "_id",
          foreignField: "actionType",
          as: "actionDetails"
        }
      },
      {
        $project: {
          actionType: "$_id",
          displayName: { 
            $ifNull: [
              { $arrayElemAt: ["$actionDetails.displayName", 0] }, 
              "$_id"
            ]
          },
          description: { 
            $ifNull: [
              { $arrayElemAt: ["$actionDetails.description", 0] }, 
              ""
            ]
          },
          count: 1,
          totalPoints: 1,
          uniqueUsers: { $size: "$uniqueUsers" }
        }
      },
      { $sort: { totalPoints: -1 } }
    ]);
    
    res.json(actionStats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas de ações:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar estatísticas de ações' });
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
      { 
        $unwind: {
          path: "$attributeDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      // NOVA ETAPA: Filtrar usuários que NÃO são administradores
      {
        $match: {
          $and: [
            { 'userDetails.roles': { $not: { $in: ['admin', 'administrator'] } } },
            { 'userDetails.permissions': { $not: { $in: ['admin:access', 'admin:dashboard'] } } }
          ]
        }
      },
      {
        $project: {
          _id: 0,
          attributeId: "$_id",
          name: { $ifNull: ["$attributeDetails.name", "Atributo Desconhecido"] },
          description: { $ifNull: ["$attributeDetails.description", ""] },
          cost: { $ifNull: ["$attributeDetails.cost", 0] },
          icon: { $ifNull: ["$attributeDetails.icon", ""] },
          color: { $ifNull: ["$attributeDetails.color", "#e60909"] },
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
        { 
          $unwind: {
            path: "$userDetails",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 0,
            userId: "$_id",
            name: { $ifNull: ["$userDetails.nome", "Usuário Desconhecido"] },
            department: { $ifNull: ["$userDetails.departamento", ""] },
            avatar: { $ifNull: ["$userDetails.avatar", null] },
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
        { 
          $unwind: {
            path: "$userDetails",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 0,
            userId: "$_id",
            name: { $ifNull: ["$userDetails.nome", "Usuário Desconhecido"] },
            department: { $ifNull: ["$userDetails.departamento", ""] },
            avatar: { $ifNull: ["$userDetails.avatar", null] },
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

const getOverallEngagementStats = async (req, res) => {
  try {
    const { from, to } = req.query;
    
    const startDate = new Date(from || Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date(to || Date.now());
    
    const { Engagement, EngagementAction } = require('../models/Engagement');
    
    // Obter contagem de ações por tipo
    const actionCounts = await Engagement.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: "$actionType",
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: "$userId" }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Obter contagem total de engajamento
    const totalCount = await Engagement.countDocuments({
      timestamp: { $gte: startDate, $lte: endDate }
    });
    
    // Obter contagem de usuários únicos
    const uniqueUsers = await Engagement.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          users: { $addToSet: "$userId" }
        }
      },
      {
        $project: {
          _id: 0,
          count: { $size: "$users" }
        }
      }
    ]);
    
    // Obter pontos de engajamento totais
    const totalPoints = await Engagement.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$points" }
        }
      }
    ]);
    
    // Agrupar ações por categoria
    const actionsByCategory = {
      content: ['post_view', 'post_create', 'post_like', 'post_comment', 'article_view', 'article_create'],
      files: ['file_view', 'file_share', 'file_download'],
      banners: ['banner_view', 'banner_click'],
      system: ['login', 'profile_update']
    };
    
    const categoryCounts = {};
    
    Object.entries(actionsByCategory).forEach(([category, actions]) => {
      const count = actionCounts
        .filter(item => actions.includes(item._id))
        .reduce((sum, item) => sum + item.count, 0);
      
      categoryCounts[category] = count;
    });
    
    // Obter tendências diárias
    const dailyTrends = await Engagement.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            category: {
              $switch: {
                branches: [
                  { 
                    case: { $in: ["$actionType", ['post_view', 'post_create', 'post_like', 'post_comment', 'article_view', 'article_create']] }, 
                    then: "content" 
                  },
                  { 
                    case: { $in: ["$actionType", ['file_view', 'file_share', 'file_download']] }, 
                    then: "files" 
                  },
                  { 
                    case: { $in: ["$actionType", ['banner_view', 'banner_click']] }, 
                    then: "banners" 
                  }
                ],
                default: "system"
              }
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          categories: {
            $push: {
              category: "$_id.category",
              count: "$count"
            }
          },
          total: { $sum: "$count" }
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]);
    
    // Formatar tendências diárias
    const formattedDailyTrends = dailyTrends.map(day => {
      const result = {
        date: day._id,
        total: day.total
      };
      
      // Adicionar contagens por categoria
      day.categories.forEach(cat => {
        result[cat.category] = cat.count;
      });
      
      // Garantir que todas as categorias existam
      Object.keys(actionsByCategory).forEach(category => {
        if (!result[category]) {
          result[category] = 0;
        }
      });
      
      return result;
    });
    
    // Estatísticas específicas de banner
    const bannerStats = await Engagement.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          actionType: { $in: ['banner_view', 'banner_click'] }
        }
      },
      {
        $group: {
          _id: "$actionType",
          count: { $sum: 1 }
        }
      }
    ]);
    
    const bannerViews = bannerStats.find(stat => stat._id === 'banner_view')?.count || 0;
    const bannerClicks = bannerStats.find(stat => stat._id === 'banner_click')?.count || 0;
    const bannerCTR = bannerViews > 0 ? (bannerClicks / bannerViews) * 100 : 0;
    
    res.json({
      period: {
        from: startDate,
        to: endDate
      },
      summary: {
        totalActions: totalCount,
        uniqueUsers: uniqueUsers[0]?.count || 0,
        totalPoints: totalPoints[0]?.total || 0
      },
      actionCounts: actionCounts.map(item => ({
        type: item._id,
        count: item.count,
        uniqueUsers: item.uniqueUsers.length
      })),
      categoryCounts,
      bannerEngagement: {
        views: bannerViews,
        clicks: bannerClicks,
        ctr: bannerCTR
      },
      dailyTrends: formattedDailyTrends
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas gerais de engajamento:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar estatísticas', error: error.message });
  }
};

// Adicione as novas funções ao módulo exportado
module.exports = {
  getEngagementTimeline,
  getBannerEngagementStats,
  getContentStats,
  getActiveUsers,
  getActionStats,
  getSuperCoinsStats,
  getOverallEngagementStats
};