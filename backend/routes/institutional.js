// backend/routes/institutional.js - Versão Atualizada
const express = require('express');
const router = express.Router();
const institutionalController = require('../controllers/institutionalController');
const auth = require('../middleware/auth');
const { hasPermission } = require('../middleware/permissions');

// Rotas públicas (para visualização)
router.get('/', institutionalController.getAreas);

// Rota para servir arquivos estaticamente
router.get('/files/:filename', institutionalController.serveFile);

// Rotas administrativas (requerem autenticação e permissão)
router.use(auth); // Todas as rotas abaixo requerem autenticação

// Obter todas as áreas (incluindo inativas) - admin
router.get('/all', hasPermission('institutional:manage'), institutionalController.getAllAreas);

// Criar nova área
router.post('/', 
  hasPermission('institutional:create'), 
  institutionalController.upload.single('attachment'),
  institutionalController.createArea
);

// Atualizar área
router.put('/:id', 
  hasPermission('institutional:edit'), 
  institutionalController.upload.single('attachment'),
  institutionalController.updateArea
);

// Excluir área
router.delete('/:id', 
  hasPermission('institutional:delete'), 
  institutionalController.deleteArea
);

// Atualizar ordem das áreas
router.put('/order/update', 
  hasPermission('institutional:manage'), 
  institutionalController.updateOrder
);

module.exports = router;