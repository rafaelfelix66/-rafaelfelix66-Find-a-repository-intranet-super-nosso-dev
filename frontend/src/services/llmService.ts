// src/services/llmService.ts - Versão melhorada mantendo funcionalidades existentes
import { api } from "@/services/api";

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

class LLMService {
  // Verificar status do LLM
  async checkStatus(): Promise<LLMStatus> {
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
  }

  // Enviar mensagem para o LLM
  async sendMessage(
    message: string, 
    conversationHistory: ChatMessage[] = [],
    onProgress?: (text: string) => void
  ): Promise<LLMResponse> {
    try {
      console.log('LLMService: Enviando mensagem para o backend');
      
      // Extrair apenas o texto e o remetente do histórico de conversa
      const history = conversationHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : msg.sender === 'assistant' ? 'assistant' : 'system',
        content: msg.text
      }));
      
      // Verificar se temos uma função de callback para streaming
      if (onProgress) {
        // Usar streaming
        return await this.sendMessageWithStreaming(message, history, onProgress);
      } else {
        // Usar o método original para compatibilidade com código existente
        const response: LLMResponse = await api.post('/llm/chat', {
          message,
          conversationHistory: history
        }, false);
        
        return response;
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem para o LLM:', error);
      throw new Error(error instanceof Error ? error.message : 'Falha ao comunicar com o LLM');
    }
  }

  // Função privada para processar streaming
  private async sendMessageWithStreaming(
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
    const controller = new AbortController();
    
    // Determinar a URL base da API com base no ambiente
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? '/api' 
      : 'http://localhost:3000/api';
    
    try {
      console.log('LLMService: Iniciando requisição de streaming');
      
      // Fazer a requisição em formato de streaming
      const response = await fetch(`${baseUrl}/llm/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token,
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({ 
          message, 
          conversationHistory
        }),
        signal: controller.signal
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na requisição de streaming:', response.status, errorText);
        
        let errorMessage = `Erro ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.mensagem || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      // Verificar se é realmente streaming
      const contentType = response.headers.get('Content-Type') || '';
      if (!contentType.includes('text/event-stream')) {
        // Fallback para resposta JSON normal
        console.log('LLMService: Resposta não é streaming, processando como JSON');
        const data = await response.json();
        return {
          message: data.message || data.response || '',
          sources: data.sources || []
        };
      }
      
      // Processar o stream de resposta
      return await this.handleStreamingResponse(response, onProgress);
      
    } catch (error) {
      // Certificar-se de abortar a requisição em caso de erro
      controller.abort();
      console.error('Erro no streaming do LLM:', error);
      throw error;
    }
  }

  // Função privada para lidar com streaming
  private async handleStreamingResponse(
    response: Response, 
    onProgress: (text: string) => void
  ): Promise<LLMResponse> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('ReadableStream não suportado pelo navegador');
    }
    
    const decoder = new TextDecoder();
    let fullResponse = '';
    let sources: any[] = [];
    
    try {
      console.log('LLMService: Iniciando processamento do stream');
      
      // Processar o stream
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('LLMService: Stream finalizado');
          break;
        }
        
        // Decodificar o chunk recebido
        const chunk = decoder.decode(value, { stream: true });
        
        // Processar eventos SSE no formato 'data: {...}'
        const lines = chunk
          .split('\n')
          .filter(line => line.trim() !== '')
          .filter(line => line.startsWith('data: '))
          .map(line => line.substring(6));
          
        for (const line of lines) {
          try {
            const event = JSON.parse(line);
            
            if (event.type === 'metadata') {
              // Armazenar as fontes
              sources = event.sources || [];
              console.log('LLMService: Metadados recebidos:', sources.length, 'fontes');
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
            else if (event.type === 'done') {
              console.log('LLMService: Evento de finalização recebido');
              break;
            }
          } catch (e) {
            console.warn('LLMService: Erro ao processar evento de streaming:', e);
          }
        }
      }
      
      console.log('LLMService: Streaming concluído com sucesso');
      console.log('LLMService: Resposta final:', fullResponse.length, 'caracteres');
      console.log('LLMService: Fontes encontradas:', sources.length);
      
      // Retornar a resposta completa com fontes
      return {
        message: fullResponse,
        sources
      };
      
    } catch (error) {
      console.error('LLMService: Erro durante o streaming:', error);
      throw error;
    } finally {
      reader.releaseLock();
    }
  }
}

// Exportar instância única do serviço
export const llmService = new LLMService();