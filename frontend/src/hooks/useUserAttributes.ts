// frontend/src/hooks/useUserAttributes.ts
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface Attribute {
  _id: string;
  name: string;
  description: string;
  color: string;
  icon?: string;
  cost: number;
}

export interface AttributeCount {
  attribute: Attribute;
  count: number;
}

export interface UserAttributesResult {
  attributes: AttributeCount[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar e gerenciar os atributos recebidos por um usuário
 * @param userId ID do usuário para buscar os atributos
 * @returns Resultado com atributos, estado de carregamento e funções auxiliares
 */
export function useUserAttributes(userId: string): UserAttributesResult {
  const [attributes, setAttributes] = useState<AttributeCount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchUserAttributes = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Buscar as transações do usuário
      const transactions = await api.get(`/supercoins/user-attributes/${userId}`);
      
      setAttributes(transactions);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar atributos do usuário:', err);
      setError('Não foi possível carregar os atributos do usuário');
      setLoading(false);
    }
  };
  
  // Buscar atributos ao montar o componente ou quando o userId mudar
  useEffect(() => {
    fetchUserAttributes();
  }, [userId]);
  
  return {
    attributes,
    loading,
    error,
    refetch: fetchUserAttributes
  };
}