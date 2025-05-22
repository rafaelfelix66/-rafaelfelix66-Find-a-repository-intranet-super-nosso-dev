// middleware/permissions.js
// backend/middleware/permissions.js - Versão simplificada para debug
const { User, Role } = require('../models');

// Middleware para verificar permissão específica
const hasPermission = (requiredPermission) => {
  return async (req, res, next) => {
    console.log(`Verificando permissão: ${requiredPermission}`);
    console.log('Usuário na requisição:', req.usuario?.id);
    
    try {
      // Verificar se o usuário está autenticado
      if (!req.usuario || !req.usuario.id) {
        console.log('Usuário não autenticado');
        return res.status(401).json({ mensagem: 'Não autenticado' });
      }
      
      // Para verificação rápida, bypassa a verificação se for uma função do controller
      if (res === undefined) {
        // Chamado diretamente de um controller, não como middleware
        const user = await User.findById(req.usuario.id).select('roles permissions');
        if (!user) return false;
        
        // Verificar permissões diretas
        if (user.permissions?.includes(requiredPermission)) return true;
        
        // Verificar permissões por papel
        if (user.roles && user.roles.length > 0) {
          const userRoles = await Role.find({ name: { $in: user.roles } });
          for (const role of userRoles) {
            if (role.permissions?.includes(requiredPermission)) return true;
          }
        }
        
        return false;
      }
      
      // Buscar usuário com permissões completas do banco de dados
      const user = await User.findById(req.usuario.id);
      if (!user) {
        console.log('Usuário não encontrado no banco');
        return res.status(404).json({ mensagem: 'Usuário não encontrado' });
      }
      
      // Debug - mostrar as permissões do usuário
      console.log('Permissões do usuário:', user.permissions || []);
      console.log('Papéis do usuário:', user.roles || []);
      
      // Verificar permissões explícitas do usuário
      if (user.permissions?.includes(requiredPermission)) {
        console.log('Permissão encontrada diretamente:', requiredPermission);
        return next();
      }
      
      // Se o usuário não tem a permissão específica, verificar se tem por papel
      if (user.roles && user.roles.length > 0) {
        // Buscar todos os papéis do usuário
        const userRoles = await Role.find({ name: { $in: user.roles } });
        
        // Debug
        console.log('Papéis encontrados:', userRoles.map(r => r.name));
        
        // Verificar se algum papel tem a permissão necessária
        for (const role of userRoles) {
          console.log(`Verificando permissões em papel ${role.name}:`, role.permissions || []);
          if (role.permissions?.includes(requiredPermission)) {
            console.log(`Permissão ${requiredPermission} encontrada no papel ${role.name}`);
            return next();
          }
        }
      }
      
      // Se chegou aqui, o usuário não tem a permissão necessária
      console.log('Acesso negado - permissão não encontrada');
      return res.status(403).json({ 
        mensagem: 'Acesso negado. Você não tem permissão para esta ação.',
        requiredPermission
      });
    } catch (err) {
      console.error('Erro na verificação de permissões:', err);
      return res.status(500).json({ 
        mensagem: 'Erro ao verificar permissões', 
        error: err.message 
      });
    }
  };
};

// Middleware para verificar se o usuário é proprietário do recurso ou tem permissão especial
const isOwnerOrHasPermission = (model, paramIdField, specialPermission) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramIdField];
      if (!resourceId) {
        return res.status(400).json({ mensagem: 'ID de recurso não fornecido' });
      }
      
      // Verificar se o usuário está autenticado
      if (!req.usuario || !req.usuario.id) {
        return res.status(401).json({ mensagem: 'Não autenticado' });
      }
      
      // Buscar usuário com permissões
      const user = await User.findById(req.usuario.id);
      if (!user) {
        return res.status(404).json({ mensagem: 'Usuário não encontrado' });
      }
      
      // Verificar permissão especial diretamente no usuário
      if (user.permissions?.includes(specialPermission)) {
        return next();
      }
      
      // Verificar permissão por papel
      if (user.roles && user.roles.length > 0) {
        const userRoles = await Role.find({ name: { $in: user.roles } });
        for (const role of userRoles) {
          if (role.permissions?.includes(specialPermission)) {
            return next();
          }
        }
      }
      
      // Buscar o recurso para verificar propriedade
      const resource = await model.findById(resourceId);
      if (!resource) {
        return res.status(404).json({ mensagem: 'Recurso não encontrado' });
      }
      
      // Verificar se o usuário é o proprietário do recurso
      const ownerId = resource.author || resource.user || resource.owner || resource.createdBy;
      
      if (ownerId && ownerId.toString() === user._id.toString()) {
        return next();
      }
      
      // Se chegou aqui, o usuário não é proprietário nem tem permissão especial
      return res.status(403).json({ mensagem: 'Acesso negado. Você não tem permissão para esta ação.' });
    } catch (err) {
      console.error('Erro na verificação de propriedade/permissão:', err);
      return res.status(500).json({ 
        mensagem: 'Erro ao verificar permissões',
        error: err.message 
      });
    }
  };
};

module.exports = { hasPermission, isOwnerOrHasPermission };