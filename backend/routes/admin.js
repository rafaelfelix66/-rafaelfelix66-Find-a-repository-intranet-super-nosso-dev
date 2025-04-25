// routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const { hasPermission } = require('../middleware/permissions');

// Middleware para restringir acesso à área administrativa
router.use(auth);
router.use(hasPermission('admin:access'));

// Rotas de gerenciamento de usuários
router.get('/users', hasPermission('users:view'), (req, res) => {
  console.log('Rota de usuários acessada');
  console.log('Usuário autenticado:', req.usuario);
  
  try {
    adminController.getAllUsers(req, res);
  } catch (error) {
    console.error('Erro na rota de usuários:', error);
    res.status(500).json({ 
      mensagem: 'Erro interno', 
      error: error.message 
    });
  }
});
router.get('/users/:id', hasPermission('users:view'), adminController.getUserById);
router.put('/users/:id/roles', hasPermission('users:edit'), adminController.updateUserRoles);
router.put('/users/:id/permissions', hasPermission('users:edit'), adminController.updateUserPermissions);

// Rotas de gerenciamento de papéis
router.get('/roles', hasPermission('roles:manage'), (req, res) => {
  console.log('Rota de papéis acessada');
  console.log('Usuário autenticado:', req.usuario);
  
  try {
    adminController.getAllRoles(req, res);
  } catch (error) {
    console.error('Erro na rota de papéis:', error);
    res.status(500).json({ 
      mensagem: 'Erro interno', 
      error: error.message 
    });
  }
});
router.get('/roles/:id', hasPermission('roles:manage'), adminController.getRoleById);
router.post('/roles', hasPermission('roles:manage'), adminController.createRole);
router.put('/roles/:id', hasPermission('roles:manage'), adminController.updateRole);
router.delete('/roles/:id', hasPermission('roles:manage'), adminController.deleteRole);

module.exports = router;