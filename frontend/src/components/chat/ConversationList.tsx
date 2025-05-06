// src/components/chat/ConversationList.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle, MoreVertical, Trash2, MessageSquare } from 'lucide-react';
import { Conversation } from '@/services/conversationService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (conversationId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  searchQuery,
  setSearchQuery,
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho com busca */}
      <div className="p-3 border-b">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-medium text-lg">Conversas</h2>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onNewConversation}
            className="text-gray-500 hover:text-gray-900"
          >
            <PlusCircle className="h-5 w-5" />
          </Button>
        </div>
        
        <div className={`relative transition-all ${isSearchFocused ? 'ring-2 ring-supernosso-red' : ''}`}>
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar conversas..."
            className="pl-8 focus-visible:ring-supernosso-red focus-visible:ring-offset-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
        </div>
      </div>
      
      {/* Lista de conversas */}
      <div className="flex-1 overflow-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500">
            <MessageSquare className="h-12 w-12 mb-3 text-gray-300" />
            <p className="font-medium">Nenhuma conversa ainda</p>
            <p className="text-sm mt-1">
              Inicie uma nova conversa com o assistente
            </p>
            <Button 
              className="mt-4 bg-supernosso-red hover:bg-supernosso-red/90" 
              onClick={onNewConversation}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Nova Conversa
            </Button>
          </div>
        ) : (
          <ul className="divide-y">
            {conversations.map((conversation) => (
              <li 
                key={conversation.id}
                className={`hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer group ${
                  activeConversationId === conversation.id ? 'bg-gray-50 dark:bg-gray-800' : ''
                }`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="flex items-center justify-between p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{conversation.title}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {formatDistanceToNow(new Date(conversation.updatedAt), { 
                        addSuffix: true,
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-red-600 dark:text-red-400 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conversation.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir conversa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};