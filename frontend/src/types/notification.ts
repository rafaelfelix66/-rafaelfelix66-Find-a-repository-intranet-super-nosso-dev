// frontend/src/types/notification.ts
export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'system' | 'supercoins' | 'message' | 'timeline' | 'event';
  data: any;
  isRead: boolean;
  createdAt: string;
}

// Tipos específicos para os dados de cada tipo de notificação

export interface SuperCoinsNotificationData {
  transactionId: string;
  attributeId: string;
  attributeName: string;
  amount: number;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  color?: string;
}

export interface MessageNotificationData {
  messageId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  chatId?: string;
  chatName?: string;
}

export interface EventNotificationData {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  creatorId?: string;
  creatorName?: string;
}

export interface TimelineNotificationData {
  postId: string;
  postType: 'comment' | 'like' | 'mention';
  userId: string;
  userName: string;
  userAvatar?: string;
}