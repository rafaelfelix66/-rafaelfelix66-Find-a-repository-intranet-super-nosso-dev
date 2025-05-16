// /backend/middleware/trackEngagement.js
const { trackEngagement } = require('../controllers/engagementController');

// Middleware para rastrear visualizações
const trackView = (modelName) => {
  return async (req, res, next) => {
    // Salvar a função original de envio de resposta
    const originalSend = res.send;
    
    res.send = function(data) {
      // Se a resposta for bem-sucedida, registrar a visualização
      if (this.statusCode >= 200 && this.statusCode < 300) {
        const userId = req.usuario?.id;
        const targetId = req.params.id || null;
        
        // Só registrar se tiver um usuário autenticado
        if (userId) {
          try {
            // Registrar ação de visualização assincronamente
            trackEngagement(
              userId, 
              `${modelName.toLowerCase()}_view`, 
              targetId, 
              modelName
            ).catch(err => {
              console.error(`Erro ao registrar visualização de ${modelName}:`, err);
            });
          } catch (err) {
            console.error('Erro ao rastrear engajamento:', err);
            // Continua mesmo com erro para não interromper a resposta
          }
        }
      }
      
      // Chama a função original
      return originalSend.apply(this, arguments);
    };
    
    next();
  };
};

// Middleware para rastrear interações como likes e comentários
const trackInteraction = (actionType, modelName) => {
  return async (req, res, next) => {
    // Executar o middleware normalmente
    next();
    
    // Após a resposta ser processada, se foi bem-sucedida, registrar a interação
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.usuario?.id;
        const targetId = req.params.id || null;
        
        if (userId && targetId) {
          try {
            trackEngagement(
              userId, 
              actionType, 
              targetId, 
              modelName
            ).catch(err => {
              console.error(`Erro ao registrar ${actionType}:`, err);
            });
          } catch (err) {
            console.error('Erro ao rastrear engajamento:', err);
          }
        }
      }
    });
  };
};

// Middleware para rastrear login de usuário
const trackLogin = () => {
  return async (req, res, next) => {
    // Executar o middleware normalmente
    next();
    
    // Após a resposta ser processada, se foi bem-sucedida, registrar o login
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.body && req.body.cpf) {
        try {
          // Extrair o ID do usuário da resposta (assumindo que está em res.locals.userId)
          const userId = res.locals.userId;
          
          if (userId) {
            trackEngagement(
              userId, 
              'login', 
              userId, 
              'User'
            ).catch(err => {
              console.error('Erro ao registrar login:', err);
            });
          }
        } catch (err) {
          console.error('Erro ao rastrear login:', err);
        }
      }
    });
  };
};

module.exports = {
  trackView,
  trackInteraction,
  trackLogin
};