// routes/chat.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configuração do multer para uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/chat/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// @route   GET api/chat/rooms
// @desc    Obter salas de chat do usuário
// @access  Private
router.get('/rooms', auth, chatController.getChatRooms);

// @route   POST api/chat/rooms
// @desc    Criar nova sala de chat
// @access  Private
router.post('/rooms', auth, chatController.createChatRoom);

// @route   GET api/chat/messages/:roomId
// @desc    Obter mensagens de uma sala de chat
// @access  Private
router.get('/messages/:roomId', auth, chatController.getChatMessages);

// @route   POST api/chat/messages
// @desc    Enviar mensagem
// @access  Private
router.post('/messages', auth, upload.array('attachments', 3), chatController.sendMessage);

module.exports = router;