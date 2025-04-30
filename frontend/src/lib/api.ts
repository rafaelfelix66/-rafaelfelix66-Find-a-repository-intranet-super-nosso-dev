// src/lib/api.ts
import axios from 'axios';

// Determinar a URL base da API com base no ambiente
const getBaseUrl = () => {
  // Em produção, usamos a mesma origem (ou outra URL conforme necessário)
  if (process.env.NODE_ENV === 'production') {
    return '/api';
  }
  
  // Em desenvolvimento, conecta-se ao servidor de desenvolvimento
  return 'http://localhost:3000/api';
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000, // 10 segundos
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptador para adicionar token de autenticação a todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptador para tratar erros comuns de resposta
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // O servidor respondeu com um status de erro
      if (error.response.status === 401) {
        // Token expirado ou inválido
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      // Retornar mensagem de erro do servidor se disponível
      const errorMessage = error.response.data?.message || error.response.data?.error || 'Erro desconhecido';
      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
      // A requisição foi feita, mas não houve resposta
      return Promise.reject(new Error('Servidor não respondeu. Verifique sua conexão.'));
    } else {
      // Erro ao configurar a requisição
      return Promise.reject(error);
    }
  }
);

// Função auxiliar para login
export const loginUser = async (cpf: string, password: string) => {
  try {
    // Verificar qual é a estrutura esperada pelo backend
    const requestBody = { 
      cpf, 
      senha: password  // "senha" em vez de "password"
    };
    
    //console.log('Enviando requisição de login:', requestBody);
    
    const response = await api.post('/auth/login', requestBody);
    
    if (response && response.token) {
      localStorage.setItem('token', response.token);
      return { success: true, data: response };
    }
    
    return { success: false, message: 'Resposta inválida do servidor' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao fazer login';
    return { success: false, message };
  }
};