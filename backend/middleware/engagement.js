//backend/middleware/engagement.js
const { trackEngagement } = require('../controllers/engagementController');

const trackViewMiddleware = (actionType) => {
  return async (req, res, next) => {
    // Salvar o método original send
    const originalSend = res.send;
    
    res.send = function(data) {
      // Se a resposta foi bem-sucedida, registrar a visualização
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.usuario?.id;
        const targetId = req.params.id;
        const targetModel = getModelFromActionType(actionType);
        
        if (userId && targetId) {
          trackEngagement(userId, actionType, targetId, targetModel).catch(err => {
            console.error('Erro ao registrar engajamento:', err);
          });
        }
      }
      
      // Chamar o método original
      originalSend.apply(res, arguments);
    };
    
    next();
  };
};

const getModelFromActionType = (actionType) => {
  switch (actionType) {
    case 'post_view': return 'Post';
    case 'article_view': return 'Article';
    case 'file_view': return 'File';
    default: return null;
  }
};

module.exports = { trackViewMiddleware };