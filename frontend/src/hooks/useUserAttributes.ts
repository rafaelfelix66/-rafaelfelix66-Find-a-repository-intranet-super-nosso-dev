// frontend/src/hooks/useUserAttributes.ts (Corrigido)
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
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchUserAttributes = async () => {
    // Se não há userId, não fazer nada
    if (!userId || userId.trim() === '') {
      console.log('useUserAttributes: userId vazio, não buscando atributos');
      setLoading(false);
      setAttributes([]);
      return;
    }
    
    console.log('useUserAttributes: Buscando atributos para userId:', userId);
    setLoading(true);
    setError(null);
    
    try {
      // Buscar as transações do usuário
      const transactions = await api.get(`/supercoins/user-attributes/${userId}`);
      
      console.log('useUserAttributes: Resposta da API:', transactions);
      
      // Verificar se a resposta é um array
      if (Array.isArray(transactions)) {
        console.log(`useUserAttributes: ${transactions.length} atributos encontrados para userId ${userId}`);
        setAttributes(transactions);
      } else {
        console.warn('useUserAttributes: Resposta da API não é um array:', transactions);
        setAttributes([]);
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('useUserAttributes: Erro ao buscar atributos do usuário:', err);
      
      // Verificar se é erro 404 (usuário sem atributos) ou erro real
      if (err?.response?.status === 404) {
        console.log('useUserAttributes: Usuário não tem atributos ainda');
        setAttributes([]);
        setError(null);
      } else {
        setError('Não foi possível carregar os atributos do usuário');
      }
      
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