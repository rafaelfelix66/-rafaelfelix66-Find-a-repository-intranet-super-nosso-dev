// backend/controllers/notificationController.js
const { Notification } = require('../models/Notification');

// Obter notificações do usuário
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const { limit = 20, skip = 0, includeRead = false } = req.query;
    
    // Construir query
    const query = { userId };
    if (includeRead === 'false' || includeRead === false) {
      query.isRead = false;
    }
    
    // Buscar notificações
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));
    
    // Contar total não lidas
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });
    
    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar notificações' });
  }
};

// Marcar notificação como lida
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.usuario.id;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { $set: { isRead: true } },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ mensagem: 'Notificação não encontrada' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    res.status(500).json({ mensagem: 'Erro ao atualizar notificação' });
  }
};

// Marcar todas as notificações como lidas
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.usuario.id;
    
    await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } }
    );
    
    res.json({ success: true, mensagem: 'Todas as notificações foram marcadas como lidas' });
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    res.status(500).json({ mensagem: 'Erro ao atualizar notificações' });
  }
};

// Excluir notificação
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.usuario.id;
    
    const notification = await Notification.findOneAndDelete({ _id: id, userId });
    
    if (!notification) {
      return res.status(404).json({ mensagem: 'Notificação não encontrada' });
    }
    
    res.json({ success: true, mensagem: 'Notificação excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir notificação:', error);
    res.status(500).json({ mensagem: 'Erro ao excluir notificação' });
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};