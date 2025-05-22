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

// Middleware para rastrear visualizações de banners
const trackBannerView = async (req, res, next) => {
  // Salvar a função original de envio de resposta
  const originalSend = res.send;
  
  res.send = function(data) {
    // Se a resposta for bem-sucedida, registrar a visualização
    if (this.statusCode >= 200 && this.statusCode < 300) {
      const userId = req.usuario?.id;
      
      // Só registrar se tiver um usuário autenticado
      if (userId) {
        try {
          // Para getAllActive, registramos views para todos os banners recebidos
          if (req.path === '/' || req.path === '/all') {
            // Analisar a resposta JSON apenas se for uma string
            let banners = [];
            if (typeof data === 'string') {
              try {
                banners = JSON.parse(data);
              } catch (e) {
                console.error('Erro ao processar JSON dos banners:', e);
              }
            } else if (Array.isArray(data)) {
              banners = data;
            }
            
            // Registrar visualização para cada banner ativo
            if (Array.isArray(banners)) {
              banners.forEach(banner => {
                if (banner.active && banner._id) {
                  trackEngagement(
                    userId,
                    'banner_view',
                    banner._id.toString(),
                    'Banner',
                    null,
                    { title: banner.title || 'Banner' }
                  ).catch(err => {
                    console.error(`Erro ao registrar visualização de banner:`, err);
                  });
                }
              });
            }
          } 
          // Para solicitações de banners individuais
          else if (req.params.id) {
            trackEngagement(
              userId,
              'banner_view',
              req.params.id,
              'Banner'
            ).catch(err => {
              console.error(`Erro ao registrar visualização de banner:`, err);
            });
          }
        } catch (err) {
          console.error('Erro ao rastrear engajamento com banner:', err);
        }
      }
    }
    
    // Chamar a função original
    return originalSend.apply(this, arguments);
  };
  
  next();
};

// Middleware para rastrear cliques em banners
const trackBannerClick = async (req, res, next) => {
  try {
    const userId = req.usuario?.id;
    const bannerId = req.params.id;
    
    console.log(`Tentativa de rastrear clique em banner: userId=${userId}, bannerId=${bannerId}`);
    
    if (bannerId) { // Verificar apenas o bannerId, pois o usuário está autenticado
      trackEngagement(
        userId || 'system', // Usar 'system' como fallback (não deveria ocorrer)
        'banner_click',
        bannerId,
        'Banner'
      ).then(() => {
        console.log(`Clique registrado com sucesso para banner ${bannerId}`);
      }).catch(err => {
        console.error(`Erro ao registrar clique em banner:`, err);
      });
    } else {
      console.warn(`Tentativa de rastrear clique sem bannerId`);
    }
  } catch (err) {
    console.error('Erro ao rastrear clique em banner:', err);
  }
  
  next();
};

module.exports = {
  trackView,
  trackInteraction,
  trackLogin,
  trackBannerView,
  trackBannerClick
};