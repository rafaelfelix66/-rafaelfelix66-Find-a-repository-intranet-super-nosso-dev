// controllers/adminController.js
const { User, Role } = require('../models');

// Funções para Gerenciamento de Usuários e Permissões
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ nome: 1 });
    res.json(users);
  } catch (err) {
    console.error('Erro ao buscar usuários:', err.message);
    res.status(500).json({ mensagem: 'Erro no servidor', error: err.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-password');
    if (!user) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    }
    res.json(user);
  } catch (err) {
    console.error('Erro ao buscar usuário:', err.message);
    res.status(500).json({ mensagem: 'Erro no servidor', error: err.message });
  }
};

const updateUserRoles = async (req, res) => {
  try {
    const { roles } = req.body;
    
    // Verificar se todos os papéis existem
    if (roles && roles.length > 0) {
      const existingRoles = await Role.find({ name: { $in: roles } });
      if (existingRoles.length !== roles.length) {
        return res.status(400).json({ mensagem: 'Um ou mais papéis não existem' });
      }
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { roles: roles || [] } },
      { new: true, select: '-password' }
    );
    
    if (!user) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Erro ao atualizar papéis do usuário:', err.message);
    res.status(500).json({ mensagem: 'Erro no servidor', error: err.message });
  }
};

const updateUserPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { permissions: permissions || [] } },
      { new: true, select: '-password' }
    );
    
    if (!user) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Erro ao atualizar permissões do usuário:', err.message);
    res.status(500).json({ mensagem: 'Erro no servidor', error: err.message });
  }
};

// Funções para Gerenciamento de Papéis
const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ name: 1 });
    res.json(roles);
  } catch (err) {
    console.error('Erro ao buscar papéis:', err.message);
    res.status(500).json({ mensagem: 'Erro no servidor', error: err.message });
  }
};

const getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ mensagem: 'Papel não encontrado' });
    }
    res.json(role);
  } catch (err) {
    console.error('Erro ao buscar papel:', err.message);
    res.status(500).json({ mensagem: 'Erro no servidor', error: err.message });
  }
};

const createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    // Verificar se já existe um papel com o mesmo nome
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({ mensagem: 'Já existe um papel com este nome' });
    }
    
    const newRole = new Role({
      name,
      description,
      permissions: permissions || []
    });
    
    await newRole.save();
    res.status(201).json(newRole);
  } catch (err) {
    console.error('Erro ao criar papel:', err.message);
    res.status(500).json({ mensagem: 'Erro no servidor', error: err.message });
  }
};

const updateRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    // Verificar se já existe outro papel com o mesmo nome
    if (name) {
      const existingRole = await Role.findOne({ 
        name, 
        _id: { $ne: req.params.id } 
      });
      
      if (existingRole) {
        return res.status(400).json({ mensagem: 'Já existe outro papel com este nome' });
      }
    }
    
    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          name, 
          description, 
          permissions: permissions || [],
          updatedAt: Date.now()
        } 
      },
      { new: true }
    );
    
    if (!role) {
      return res.status(404).json({ mensagem: 'Papel não encontrado' });
    }
    
    res.json(role);
  } catch (err) {
    console.error('Erro ao atualizar papel:', err.message);
    res.status(500).json({ mensagem: 'Erro no servidor', error: err.message });
  }
};

const deleteRole = async (req, res) => {
  try {
    // Verificar uso do papel antes de excluir
    const usersWithRole = await User.countDocuments({ roles: { $in: [req.params.id] } });
    if (usersWithRole > 0) {
      return res.status(400).json({ 
        mensagem: 'Este papel não pode ser excluído porque está atribuído a usuários',
        usersCount: usersWithRole
      });
    }
    
    const role = await Role.findByIdAndDelete(req.params.id);
    if (!role) {
      return res.status(404).json({ mensagem: 'Papel não encontrado' });
    }
    
    res.json({ mensagem: 'Papel excluído com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir papel:', err.message);
    res.status(500).json({ mensagem: 'Erro no servidor', error: err.message });
  }
};

module.exports = {
  // Gerenciamento de usuários
  getAllUsers,
  getUserById,
  updateUserRoles,
  updateUserPermissions,
  
  // Gerenciamento de papéis
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole
};