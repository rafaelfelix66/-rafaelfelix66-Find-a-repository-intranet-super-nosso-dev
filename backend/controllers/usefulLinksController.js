// backend/controllers/usefulLinksController.js
const UsefulLink = require('../models/UsefulLink');

// Obter todos os links úteis (apenas ativos para usuários normais)
const getAllLinks = async (req, res) => {
  try {
    const { includeInactive = false } = req.query;
    
    // Se o usuário tem permissão administrativa, pode ver todos
    const { User } = require('../models');
    const user = await User.findById(req.usuario.id);
    const isAdmin = user?.roles?.includes('admin') || 
                   user?.permissions?.includes('useful_links:manage');

    // Filtros baseados nas permissões
    const filter = {};
    if (!isAdmin || includeInactive === 'false') {
      filter.isActive = true;
    }

    const links = await UsefulLink.find(filter)
      .populate('createdBy', 'nome email')
      .sort({ category: 1, order: 1, title: 1 });

    // Agrupar por categoria
    const groupedLinks = {};
    links.forEach(link => {
      const category = link.category || 'Geral';
      if (!groupedLinks[category]) {
        groupedLinks[category] = [];
      }
      groupedLinks[category].push(link);
    });

    res.json(groupedLinks);
  } catch (error) {
    console.error('Erro ao buscar links úteis:', error);
    res.status(500).json({ 
      mensagem: 'Erro ao buscar links úteis', 
      error: error.message 
    });
  }
};

// Obter um link específico
const getLinkById = async (req, res) => {
  try {
    const link = await UsefulLink.findById(req.params.id)
      .populate('createdBy', 'nome email');

    if (!link) {
      return res.status(404).json({ mensagem: 'Link não encontrado' });
    }

    res.json(link);
  } catch (error) {
    console.error('Erro ao buscar link:', error);
    res.status(500).json({ 
      mensagem: 'Erro ao buscar link', 
      error: error.message 
    });
  }
};

// Criar novo link
const createLink = async (req, res) => {
  try {
    const { title, description, url, category, icon, order } = req.body;

    // Validações
    if (!title || !description || !url) {
      return res.status(400).json({ 
        mensagem: 'Título, descrição e URL são obrigatórios' 
      });
    }

    // Validar URL
    if (!url.match(/^https?:\/\/.+/)) {
      return res.status(400).json({ 
        mensagem: 'URL deve começar com http:// ou https://' 
      });
    }

    const newLink = new UsefulLink({
      title: title.trim(),
      description: description.trim(),
      url: url.trim(),
      category: category?.trim() || 'Geral',
      icon: icon || 'ExternalLink',
      order: order || 0,
      createdBy: req.usuario.id
    });

    await newLink.save();

    const populatedLink = await UsefulLink.findById(newLink._id)
      .populate('createdBy', 'nome email');

    res.status(201).json(populatedLink);
  } catch (error) {
    console.error('Erro ao criar link:', error);
    res.status(500).json({ 
      mensagem: 'Erro ao criar link', 
      error: error.message 
    });
  }
};

// Atualizar link
const updateLink = async (req, res) => {
  try {
    const { title, description, url, category, icon, order, isActive } = req.body;

    const link = await UsefulLink.findById(req.params.id);
    if (!link) {
      return res.status(404).json({ mensagem: 'Link não encontrado' });
    }

    // Validar URL se fornecida
    if (url && !url.match(/^https?:\/\/.+/)) {
      return res.status(400).json({ 
        mensagem: 'URL deve começar com http:// ou https://' 
      });
    }

    // Atualizar campos
    if (title !== undefined) link.title = title.trim();
    if (description !== undefined) link.description = description.trim();
    if (url !== undefined) link.url = url.trim();
    if (category !== undefined) link.category = category.trim() || 'Geral';
    if (icon !== undefined) link.icon = icon;
    if (order !== undefined) link.order = order;
    if (isActive !== undefined) link.isActive = isActive;

    await link.save();

    const updatedLink = await UsefulLink.findById(link._id)
      .populate('createdBy', 'nome email');

    res.json(updatedLink);
  } catch (error) {
    console.error('Erro ao atualizar link:', error);
    res.status(500).json({ 
      mensagem: 'Erro ao atualizar link', 
      error: error.message 
    });
  }
};

// Excluir link
const deleteLink = async (req, res) => {
  try {
    const link = await UsefulLink.findById(req.params.id);
    if (!link) {
      return res.status(404).json({ mensagem: 'Link não encontrado' });
    }

    await UsefulLink.findByIdAndDelete(req.params.id);

    res.json({ mensagem: 'Link excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir link:', error);
    res.status(500).json({ 
      mensagem: 'Erro ao excluir link', 
      error: error.message 
    });
  }
};

// Reordenar links
const reorderLinks = async (req, res) => {
  try {
    const { links } = req.body; // Array de { id, order }

    if (!Array.isArray(links)) {
      return res.status(400).json({ 
        mensagem: 'Dados de reordenação inválidos' 
      });
    }

    // Atualizar ordem de cada link
    const updatePromises = links.map(({ id, order }) => 
      UsefulLink.findByIdAndUpdate(id, { order }, { new: true })
    );

    await Promise.all(updatePromises);

    res.json({ mensagem: 'Links reordenados com sucesso' });
  } catch (error) {
    console.error('Erro ao reordenar links:', error);
    res.status(500).json({ 
      mensagem: 'Erro ao reordenar links', 
      error: error.message 
    });
  }
};

// Obter categorias disponíveis
const getCategories = async (req, res) => {
  try {
    const categories = await UsefulLink.distinct('category', { isActive: true });
    res.json(categories.sort());
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ 
      mensagem: 'Erro ao buscar categorias', 
      error: error.message 
    });
  }
};

module.exports = {
  getAllLinks,
  getLinkById,
  createLink,
  updateLink,
  deleteLink,
  reorderLinks,
  getCategories
};