// frontend/src/services/superCoinsService.ts - Versão corrigida
import { api } from '@/lib/api';

// Interfaces
export interface CoinBalance {
  _id?: string;
  userId?: string;
  balance: number;
  totalReceived: number;
  totalGiven: number;
  lastRecharge?: string;
  updatedAt?: string;
}

export interface CoinAttribute {
  _id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  color: string;
  active?: boolean;
  createdAt?: string;
}

export interface Transaction {
  _id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  attributeId: string;
  message: string;
  timestamp: string;
}

export interface RankingUser {
  userId: string;
  userName: string;
  userAvatar?: string;
  userDepartment?: string;
  totalPoints: number;
}

// Parâmetros para envio de moedas
export interface SendCoinsParams {
  toUserId: string;
  attributeId: string;
  message?: string;
}

// Serviço para Super Coins
export const superCoinsService = {
  // Obter saldo do usuário
  getBalance: async (): Promise<CoinBalance> => {
    try {
      const response = await api.get('/supercoins/balance');
      console.log('Resposta do saldo:', response);
      return response;
    } catch (error) {
      console.error('Erro ao buscar saldo:', error);
      throw error;
    }
  },
  
  // Obter atributos disponíveis
  getAttributes: async (): Promise<CoinAttribute[]> => {
    try {
      const response = await api.get('/supercoins/attributes');
      console.log('Resposta de atributos:', response);
      return response;
    } catch (error) {
      console.error('Erro ao buscar atributos:', error);
      throw error;
    }
  },
  
  // Enviar moedas para outro usuário - VERSÃO CORRIGIDA
  sendCoins: async (params: SendCoinsParams): Promise<{ success: boolean; transaction: Transaction; newBalance: number }> => {
    try {
      // Garantir que a mensagem seja enviada como string vazia se não estiver definida
      const finalParams = {
        ...params,
        message: params.message || ''
      };
      
      console.log('Enviando moedas com parâmetros:', finalParams);
      const response = await api.post('/supercoins/send', finalParams);
      console.log('Resposta do envio de moedas:', response);
      return response;
    } catch (error) {
      console.error('Erro ao enviar moedas:', error);
      throw error;
    }
  },
  
  // Obter ranking
  getRanking: async (type: 'received' | 'given' = 'received'): Promise<RankingUser[]> => {
    try {
      const response = await api.get(`/supercoins/ranking?type=${type}`);
      console.log(`Resposta do ranking (${type}):`, response);
      return response;
    } catch (error) {
      console.error('Erro ao buscar ranking:', error);
      throw error;
    }
  },
  
  // Obter histórico de transações
  getTransactions: async (): Promise<Transaction[]> => {
    try {
      const response = await api.get('/supercoins/transactions');
      return response;
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      throw error;
    }
  },
};