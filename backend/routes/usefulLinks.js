// backend/routes/usefulLinks.js
const express = require('express');
const router = express.Router();
const usefulLinksController = require('../controllers/usefulLinksController');
const auth = require('../middleware/auth');
const { hasPermission } = require('../middleware/permissions');

// Todas as rotas requerem autenticação
router.use(auth);

// @route   GET /api/useful-links
// @desc    Obter todos os links úteis
// @access  Private
router.get('/', usefulLinksController.getAllLinks);

// @route   GET /api/useful-links/categories
// @desc    Obter categorias disponíveis
// @access  Private
router.get('/categories', usefulLinksController.getCategories);

// @route   GET /api/useful-links/:id
// @desc    Obter um link específico
// @access  Private
router.get('/:id', usefulLinksController.getLinkById);

// @route   POST /api/useful-links
// @desc    Criar novo link
// @access  Private (Admin only)
router.post('/', 
  hasPermission('useful_links:manage'), 
  usefulLinksController.createLink
);

// @route   PUT /api/useful-links/:id
// @desc    Atualizar link
// @access  Private (Admin only)
router.put('/:id', 
  hasPermission('useful_links:manage'), 
  usefulLinksController.updateLink
);

// @route   DELETE /api/useful-links/:id
// @desc    Excluir link
// @access  Private (Admin only)
router.delete('/:id', 
  hasPermission('useful_links:manage'), 
  usefulLinksController.deleteLink
);

// @route   PUT /api/useful-links/reorder
// @desc    Reordenar links
// @access  Private (Admin only)
router.put('/reorder/links', 
  hasPermission('useful_links:manage'), 
  usefulLinksController.reorderLinks
);

module.exports = router;