// controllers/adminController.js - CORRIGIDO
const { User, Role } = require('../models');

// Funções para Gerenciamento de Usuários e Permissões
const getAllUsers = async (req, res) => {
  try {
    console.log('Buscando todos os usuários...');
    const users = await User.find({}, '-password').sort({ nome: 1 });
    
    // CORREÇÃO: Normalizar o formato das permissões para o frontend
    const normalizedUsers = users.map(user => ({
      ...user.toObject(),
      permissions: user.permissoes || user.permissions || [] // Mapear permissoes para permissions
    }));
    
    console.log(`${normalizedUsers.length} usuários encontrados`);
    res.json(normalizedUsers);
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
    
    // CORREÇÃO: Normalizar o formato das permissões
    const normalizedUser = {
      ...user.toObject(),
      permissions: user.permissoes || user.permissions || []
    };
    
    res.json(normalizedUser);
  } catch (err) {
    console.error('Erro ao buscar usuário:', err.message);
    res.status(500).json({ mensagem: 'Erro no servidor', error: err.message });
  }
};

const updateUserRoles = async (req, res) => {
  try {
    const { roles } = req.body;
    
    console.log(`Atualizando papéis do usuário ${req.params.id}:`, roles);
    
    // NOVA VALIDAÇÃO: Permitir apenas um papel
    if (roles && roles.length > 1) {
      return res.status(400).json({ 
        mensagem: 'Um usuário pode ter apenas um papel atribuído' 
      });
    }
    
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
    
    // CORREÇÃO: Retornar com formato normalizado
    const normalizedUser = {
      ...user.toObject(),
      permissions: user.permissoes || user.permissions || []
    };
    
    console.log('Papéis atualizados com sucesso para o usuário:', user.nome);
    res.json(normalizedUser);
  } catch (err) {
    console.error('Erro ao atualizar papéis do usuário:', err.message);
    res.status(500).json({ mensagem: 'Erro no servidor', error: err.message });
  }
};

const updateUserPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    
    console.log(`Atualizando permissões do usuário ${req.params.id}:`, permissions);
    
    // CORREÇÃO: Validar se as permissões são válidas (opcional)
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ mensagem: 'Permissões devem ser um array' });
    }
    
    // CORREÇÃO: Atualizar tanto 'permissoes' quanto 'permissions' para compatibilidade
    const updateData = {
      permissoes: permissions || [],
      permissions: permissions || [] // Adicionar para garantir compatibilidade
    };
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, select: '-password' }
    );
    
    if (!user) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    }
    
    // CORREÇÃO: Retornar com formato normalizado
    const normalizedUser = {
      ...user.toObject(),
      permissions: user.permissoes || user.permissions || []
    };
    
    console.log('Permissões atualizadas com sucesso para o usuário:', user.nome);
    console.log('Novas permissões:', normalizedUser.permissions);
    
    res.json(normalizedUser);
  } catch (err) {
    console.error('Erro ao atualizar permissões do usuário:', err.message);
    res.status(500).json({ mensagem: 'Erro no servidor', error: err.message });
  }
};

// Funções para Gerenciamento de Papéis
const getAllRoles = async (req, res) => {
  try {
    console.log('Buscando todos os papéis...');
    const roles = await Role.find().sort({ name: 1 });
    console.log(`${roles.length} papéis encontrados`);
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
    
    console.log('Criando novo papel:', { name, description, permissions });
    
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
    console.log('Papel criado com sucesso:', newRole.name);
    res.status(201).json(newRole);
  } catch (err) {
    console.error('Erro ao criar papel:', err.message);
    res.status(500).json({ mensagem: 'Erro no servidor', error: err.message });
  }
};

const updateRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    console.log(`Atualizando papel ${req.params.id}:`, { name, description, permissions });
    
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
    
    console.log('Papel atualizado com sucesso:', role.name);
    res.json(role);
  } catch (err) {
    console.error('Erro ao atualizar papel:', err.message);
    res.status(500).json({ mensagem: 'Erro no servidor', error: err.message });
  }
};

const deleteRole = async (req, res) => {
  try {
    console.log(`Tentando excluir papel ${req.params.id}`);
    
    // Verificar uso do papel antes de excluir
    const usersWithRole = await User.countDocuments({ roles: { $in: [req.params.id] } });
    if (usersWithRole > 0) {
      console.log(`Papel está sendo usado por ${usersWithRole} usuário(s)`);
      return res.status(400).json({ 
        mensagem: 'Este papel não pode ser excluído porque está atribuído a usuários',
        usersCount: usersWithRole
      });
    }
    
    const role = await Role.findByIdAndDelete(req.params.id);
    if (!role) {
      return res.status(404).json({ mensagem: 'Papel não encontrado' });
    }
    
    console.log('Papel excluído com sucesso:', role.name);
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