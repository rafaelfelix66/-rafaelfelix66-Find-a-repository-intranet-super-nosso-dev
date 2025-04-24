// src/auth.ts
import axios from 'axios';

// Função para determinar a URL da API com base no ambiente
const getAuthUrl = (endpoint: string) => {
  // Em produção, usamos o proxy configurado no nginx
  if (window.location.hostname !== 'localhost') {
    return `/api/auth${endpoint}`;
  }
  // Em desenvolvimento local, conectamos diretamente ao backend
  return `http://localhost:3000/api/auth${endpoint}`;
};

export async function loginUser(email: string, password: string) {
  try {
    const response = await axios.post(getAuthUrl('/login'), { 
      email, 
      password // Ajustado para corresponder ao backend
    });
    
    // Armazenar o token e o ID do usuário
    localStorage.setItem('token', response.data.token);
    if (response.data.usuario && response.data.usuario.id) {
      localStorage.setItem('userId', response.data.usuario.id);
    }
    
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Erro ao fazer login:', error);
    return { 
      success: false, 
      message: error.response?.data?.mensagem || 'Erro ao fazer login' 
    };
  }
}

export async function registerUser(
  nome: string, 
  email: string, 
  password: string, 
  cargo: string = '', 
  departamento: string = ''
) {
  try {
    const response = await axios.post(getAuthUrl('/register'), { 
      nome, 
      email, 
      password, // Ajustado para corresponder ao backend
      cargo,
      departamento
    });
    
    // Armazenar o token
    localStorage.setItem('token', response.data.token);
    
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Erro ao registrar:', error);
    return { 
      success: false, 
      message: error.response?.data?.mensagem || 'Erro ao registrar' 
    };
  }
}

export async function getUserData() {
  const token = localStorage.getItem('token');
  if (!token) return { success: false, message: 'Usuário não autenticado' };
  
  try {
    const response = await axios.get(getAuthUrl('/user'), {
      headers: { 
        'Authorization': `Bearer ${token}`, // Ajustado para usar Bearer conforme boas práticas
        'Accept': 'application/json'
      },
    });
    
    // Garantir que o ID do usuário esteja armazenado
    if (response.data && response.data._id) {
      localStorage.setItem('userId', response.data._id);
    }
    
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Erro ao obter dados do usuário:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    return { 
      success: false, 
      message: error.response?.data?.mensagem || 'Sessão expirada' 
    };
  }
}

export function logoutUser() {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
}

export function isAuthenticated() {
  return !!localStorage.getItem('token');
}