// controllers/chatController.js
const { Message, Chat, User } = require('../models'); // Ajustado ChatRoom para Chat

const getChatRooms = async (req, res) => {
  try {
    const chatRooms = await Chat.find({
      participants: req.usuario.id // Ajustado
    })
      .populate('participants', ['nome'])
      .populate('lastMessage')
      .sort({ lastActivity: -1 });
    res.json(chatRooms);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
};

const createChatRoom = async (req, res) => {
  try {
    const { name, type, participants } = req.body;
    if (type === 'direct' && participants.length === 1) {
      const existingRoom = await Chat.findOne({
        type: 'direct',
        participants: { $all: [req.usuario.id, participants[0]] }
      });
      if (existingRoom) {
        return res.json(existingRoom);
      }
    }
    const allParticipants = [...new Set([...participants, req.usuario.id])];
    const newChatRoom = new Chat({
      name: name || 'Chat',
      type,
      participants: allParticipants,
      createdBy: req.usuario.id
    });
    const chatRoom = await newChatRoom.save();
    const populatedRoom = await Chat.findById(chatRoom._id)
      .populate('participants', ['nome']);
    res.json(populatedRoom);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
};

const getChatMessages = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const messages = await Message.find({ roomId })
      .populate('sender', ['nome'])
      .sort({ createdAt: 1 });
    await Message.updateMany(
      { roomId, sender: { $ne: req.usuario.id }, isRead: false },
      { $set: { isRead: true } }
    );
    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
};

const sendMessage = async (req, res) => {
  try {
    const { text, roomId } = req.body;
    const chatRoom = await Chat.findById(roomId);
    if (!chatRoom) {
      return res.status(404).json({ msg: 'Sala de chat não encontrada' });
    }
    if (!chatRoom.participants.includes(req.usuario.id)) {
      return res.status(401).json({ msg: 'Usuário não é participante desta sala' });
    }
    const attachments = req.files ? req.files.map(file => ({
      type: file.path,
      contentType: file.mimetype,
      name: file.originalname
    })) : [];
    const newMessage = new Message({
      sender: req.usuario.id,
      roomId,
      text,
      attachments
    });
    const message = await newMessage.save();
    chatRoom.lastActivity = Date.now();
    chatRoom.lastMessage = message._id;
    await chatRoom.save();
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', ['nome']);
    res.json(populatedMessage);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
};

module.exports = { getChatRooms, createChatRoom, getChatMessages, sendMessage };