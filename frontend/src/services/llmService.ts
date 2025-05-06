// src/services/llmService.ts
import { api } from "@/lib/api";

export interface LLMResponse {
  message: string;
  sources: {
    id: string;
    name: string;
    similarity: number;
  }[];
}

export interface LLMStatus {
  status: 'online' | 'offline';
  model?: string;
  modelAvailable?: boolean;
  message?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: Date;
  sources?: {
    id: string;
    name: string;
    similarity: number;
  }[];
  isLoading?: boolean;
}

export const llmService = {
  // Verificar status do LLM
  checkStatus: async (): Promise<LLMStatus> => {
    try {
      const response: LLMStatus = await api.get('/llm/status');
      return response;
    } catch (error) {
      console.error('Erro ao verificar status do LLM:', error);
      return { 
        status: 'offline', 
        message: error instanceof Error ? error.message : 'Serviço LLM indisponível'
      };
    }
  },
  
  // Enviar mensagem para o LLM
  sendMessage: async (message: string, conversationHistory: ChatMessage[] = []): Promise<LLMResponse> => {
    try {
      // Extrair apenas o texto e o remetente do histórico de conversa
      const history = conversationHistory.map(msg => ({
        role: msg.sender,
        content: msg.text
      }));
      
      const response: LLMResponse = await api.post('/llm/chat', {
        message,
        conversationHistory: history
      },{
	    timeout : 600000
	  });
      
      return response;
    } catch (error) {
      console.error('Erro ao enviar mensagem para o LLM:', error);
      throw new Error(error instanceof Error ? error.message : 'Falha ao comunicar com o LLM');
    }
  }
};