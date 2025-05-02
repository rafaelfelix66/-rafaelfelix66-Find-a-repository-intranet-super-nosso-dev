// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verificarToken = require('../middleware/auth'); // Atualizado

// @route   POST api/auth/register
// @desc    Registrar usuário
// @access  Public
router.post('/register', authController.register);

// @route   POST api/auth/login
// @desc    Autenticar usuário
// @access  Public
router.post('/login', authController.login);

// @route   GET api/auth/user
// @desc    Obter dados do usuário
// @access  Private
router.get('/user', verificarToken, async (req, res) => {
  const { User } = require('../models'); // Importar aqui
  try {
    const user = await User.findById(req.usuario.id).select('-senha');
    if (!user) return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ mensagem: 'Erro no servidor' });
  }
});

// @route   GET api/auth/user-permissions
// @desc    Obter dados do usuário com permissões expandidas
// @access  Private
router.get('/user-permissions', verificarToken, async (req, res) => {
  try {
    //console.log('Rota de permissões de usuário acessada');
    //console.log('ID do usuário:', req.usuario.id);
	
    const { User, Role } = require('../models');

    const user = await User.findById(req.usuario.id).select('-password');
    if (!user) {
      console.log('Usuário não encontrado');
      return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    }
    
    console.log('Usuário encontrado:', user._id);
    
    // Preparar o objeto de resposta
    const userResponse = {
      _id: user._id,
      nome: user.nome,
      email: user.email,
      cargo: user.cargo,
      departamento: user.departamento,
      avatar: user.avatar,
      roles: user.roles || [],
      permissions: user.permissoes || [] // Mapear permissoes para o nome esperado pelo frontend
    };
    
    // Se o usuário tem papéis, buscar permissões associadas
    if (user.roles && user.roles.length > 0) {
      try {
        //console.log('Buscando papéis para:', user.roles);
        const userRoles = await Role.find({ name: { $in: user.roles } });
        //console.log('Papéis encontrados:', userRoles.length);
        
        for (const role of userRoles) {
          if (role.permissions && role.permissions.length > 0) {
            userResponse.permissions = [
              ...userResponse.permissions,
              ...role.permissions
            ];
          }
        }
        
        // Remover duplicatas
        userResponse.permissions = [...new Set(userResponse.permissions)];
      } catch (err) {
        console.error('Erro ao buscar papéis:', err.message);
      }
    }
    
    //console.log('Permissões atribuídas:', userResponse.permissions);
    
    res.json(userResponse);
  } catch (err) {
    console.error('Erro ao buscar permissões do usuário:', err);
    res.status(500).json({ mensagem: 'Erro no servidor', error: err.message });
  }
});

module.exports = router;