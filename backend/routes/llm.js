// routes/llm.js
const express = require('express');
const router = express.Router();
const llmController = require('../controllers/llmController');
const auth = require('../middleware/auth');

// Verificar status do LLM
router.get('/status', auth, llmController.checkLLMStatus);

// Enviar mensagem para o LLM
router.post('/chat', auth, llmController.sendMessage);

module.exports = router;