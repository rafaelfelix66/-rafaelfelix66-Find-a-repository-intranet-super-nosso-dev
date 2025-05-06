// src/services/conversationService.ts
import { ChatMessage } from "./llmService";

// Interface para uma conversa salva
export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// Chave para armazenamento local
const STORAGE_KEY = 'intranet_conversations';

// Serviço para gerenciar conversas
export const conversationService = {
  // Obter todas as conversas
  getAllConversations: (): Conversation[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const conversations = JSON.parse(stored) as Conversation[];
      
      // Garantir que as datas sejam objetos Date
      return conversations.map(conv => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: conv.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      return [];
    }
  },
  
  // Obter uma conversa por ID
  getConversationById: (id: string): Conversation | null => {
    const conversations = conversationService.getAllConversations();
    const conversation = conversations.find(c => c.id === id);
    
    if (!conversation) return null;
    
    return conversation;
  },
  
  // Criar uma nova conversa
  createConversation: (title: string, initialMessages: ChatMessage[] = []): Conversation => {
    const conversations = conversationService.getAllConversations();
    
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      title,
      messages: initialMessages,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const updatedConversations = [newConversation, ...conversations];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConversations));
    
    return newConversation;
  },
  
  // Atualizar uma conversa existente
  updateConversation: (id: string, updates: Partial<Conversation>): Conversation | null => {
    const conversations = conversationService.getAllConversations();
    const index = conversations.findIndex(c => c.id === id);
    
    if (index === -1) return null;
    
    const updatedConversation = {
      ...conversations[index],
      ...updates,
      updatedAt: new Date()
    };
    
    conversations[index] = updatedConversation;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    
    return updatedConversation;
  },
  
  // Adicionar mensagem a uma conversa
  addMessageToConversation: (conversationId: string, message: ChatMessage): Conversation | null => {
    const conversations = conversationService.getAllConversations();
    const index = conversations.findIndex(c => c.id === conversationId);
    
    if (index === -1) return null;
    
    const updatedConversation = {
      ...conversations[index],
      messages: [...conversations[index].messages, message],
      updatedAt: new Date()
    };
    
    conversations[index] = updatedConversation;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    
    return updatedConversation;
  },
  
  // Excluir uma conversa
  deleteConversation: (id: string): boolean => {
    const conversations = conversationService.getAllConversations();
    const filteredConversations = conversations.filter(c => c.id !== id);
    
    if (filteredConversations.length === conversations.length) {
      return false; // Nenhuma conversa foi excluída
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredConversations));
    return true;
  },
  
  // Limpar todas as conversas
  clearAllConversations: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  }
};