// backend/middleware/departamento.js
const { User } = require('../models');

// Middleware para filtrar posts por departamento
const filterPostsByDepartment = async (req, res, next) => {
  try {
    // Buscar usuário com suas informações de departamento
    const user = await User.findById(req.usuario.id);
    if (!user) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    }

    // Adicionar informação do departamento do usuário para a query
    req.userDepartment = user.departamento || 'PUBLICO';
    
    next();
  } catch (err) {
    console.error('Erro no middleware de departamento:', err);
    return res.status(500).json({ mensagem: 'Erro interno do servidor' });
  }
};

module.exports = {
  filterPostsByDepartment
};