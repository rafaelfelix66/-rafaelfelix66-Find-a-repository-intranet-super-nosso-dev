// frontend/src/components/notifications/NotificationItem.tsx
import React from 'react';
import { Notification } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bell, Coins, Calendar, MessageSquare, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const { _id, title, message, type, data, isRead, createdAt } = notification;
  
  // Formatar data relativa (ex: "há 5 minutos")
  const formattedDate = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
    locale: ptBR
  });
  
  // Determinar ícone com base no tipo de notificação
  const getIcon = () => {
    switch (type) {
      case 'supercoins':
        return <Coins className="h-5 w-5 text-yellow-500" />;
      case 'event':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'message':
        return <MessageSquare className="h-5 w-5 text-purple-500" />;
      case 'system':
        return <Bell className="h-5 w-5 text-gray-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };
  
  // Verificar se há dados de remetente para Super Coins
  const hasSenderData = type === 'supercoins' && data?.senderId && data?.senderName;
  
  return (
    <div 
      className={`p-3 flex items-start gap-3 ${isRead ? 'bg-transparent' : 'bg-blue-50 dark:bg-blue-900/10'}`}
    >
      {hasSenderData ? (
        <UserAvatar 
          user={{
            id: data.senderId,
            name: data.senderName,
            avatar: data.senderAvatar
          }}
          size="sm"
        />
      ) : (
        <div className="p-2 rounded-full bg-gray-100">
          {getIcon()}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{message}</p>
        
        {/* Mostrar detalhes específicos para cada tipo de notificação */}
        {type === 'supercoins' && data?.attributeName && (
          <div 
            className="mt-1 text-xs py-0.5 px-2 rounded-full inline-flex items-center gap-1"
            style={{ 
              backgroundColor: `${data.color || '#e60909'}20`,
              color: data.color || '#e60909'
            }}
          >
            <Coins className="h-3 w-3" />
            <span>{data.attributeName}</span>
          </div>
        )}
        
        <p className="mt-1 text-xs text-muted-foreground">{formattedDate}</p>
      </div>
      
      {!isRead && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs h-7 shrink-0"
          onClick={() => onMarkAsRead(_id)}
        >
          Marcar como lida
        </Button>
      )}
    </div>
  );
}