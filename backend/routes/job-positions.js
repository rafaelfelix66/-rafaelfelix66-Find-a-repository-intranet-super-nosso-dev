// backend/routes/job-positions.js
const express = require('express');
const router = express.Router();
const jobPositionController = require('../controllers/jobPositionController');
const auth = require('../middleware/auth');
const { hasPermission } = require('../middleware/permissions');

// Rotas públicas (para visualização)
router.get('/', jobPositionController.getJobPositions);

// Rota para servir arquivos estaticamente
router.get('/files/:filename', jobPositionController.serveFile);

// Rotas administrativas (requerem autenticação e permissão)
router.use(auth); // Todas as rotas abaixo requerem autenticação

// Obter todas as vagas (incluindo inativas) - admin
router.get('/all', hasPermission('jobs:manage'), jobPositionController.getAllJobPositions);

// Criar nova vaga
router.post('/', 
  hasPermission('jobs:create'), 
  jobPositionController.upload.single('attachment'),
  jobPositionController.createJobPosition
);

// Atualizar vaga
router.put('/:id', 
  hasPermission('jobs:edit'), 
  jobPositionController.upload.single('attachment'),
  jobPositionController.updateJobPosition
);

// Excluir vaga
router.delete('/:id', 
  hasPermission('jobs:delete'), 
  jobPositionController.deleteJobPosition
);

// Atualizar ordem das vagas
router.put('/order/update', 
  hasPermission('jobs:manage'), 
  jobPositionController.updateOrder
);

module.exports = router;