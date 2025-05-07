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
  isStreaming?: boolean; // Nova propriedade para indicar mensagens em streaming
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
  sendMessage: async (
    message: string, 
	conversationHistory: ChatMessage[] = [],
	onProgress?: (text: string) => void
  ): Promise<LLMResponse> => {
    try {
      // Extrair apenas o texto e o remetente do histórico de conversa
      const history = conversationHistory.map(msg => ({
        role: msg.sender,
        content: msg.text
      }));
      
     // Verificar se temos uma função de callback para streaming
      if (onProgress) {
        // Usar streaming
        return await sendMessageWithStreaming(message, history, onProgress);
      } else {
        // Usar o método original para compatibilidade com código existente
        const response: LLMResponse = await api.post('/llm/chat', {
          message,
          conversationHistory: history
        }, {
          timeout: 600000
        });
        
        return response;
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem para o LLM:', error);
      throw new Error(error instanceof Error ? error.message : 'Falha ao comunicar com o LLM');
    }
  }
};


// Função auxiliar para processar streaming
async function sendMessageWithStreaming(
  message: string,
  conversationHistory: any[],
  onProgress: (text: string) => void
): Promise<LLMResponse> {
  // Obter token de autenticação
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Usuário não autenticado');
  }
  
  // Criar um controller para abortar a requisição se necessário
  const controller = new AbortController(); // Aqui está a definição do controller
  
  // Determinar a URL base da API com base no ambiente
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:3000/api';
  
  try {
    // Fazer a requisição em formato de streaming
    const response = await fetch(`${baseUrl}/llm/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({ 
        message, 
        conversationHistory
      }),
      signal: controller.signal
    });
    
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status}`);
    }
    
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('ReadableStream não suportado pelo navegador');
    }
    
    const decoder = new TextDecoder();
    let fullResponse = '';
    let sources: any[] = [];
    
    // Processar o stream
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      // Decodificar o chunk recebido
      const chunk = decoder.decode(value, { stream: true });
      
      // Processar eventos SSE no formato 'data: {...}'
      const lines = chunk
        .split('\n\n')
        .filter(line => line.startsWith('data: '))
        .map(line => line.substring(6));
        
      for (const line of lines) {
        try {
          const event = JSON.parse(line);
          
          if (event.type === 'metadata') {
            // Armazenar as fontes
            sources = event.sources || [];
          } 
          else if (event.type === 'token') {
            // Acumular tokens recebidos
            fullResponse += event.content;
            
            // Chamar callback de progresso
            onProgress(fullResponse);
          }
          else if (event.type === 'error') {
            throw new Error(event.message);
          }
        } catch (e) {
          console.warn('Erro ao processar evento de streaming:', e);
        }
      }
    }
    
    // Retornar a resposta completa com fontes
    return {
      message: fullResponse,
      sources
    };
  } catch (error) {
    // Certificar-se de abortar a requisição em caso de erro
    controller.abort();
    throw error;
  }
}