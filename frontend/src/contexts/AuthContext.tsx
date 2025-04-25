// src/contexts/AuthContext.tsx - Versão atualizada com as novas implementações

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, getUserData, logoutUser, isAuthenticated } from '../auth';
import { useToast } from "@/hooks/use-toast";
import { activitiesService } from '@/services/activitiesService';
import { calendarService } from '@/services/calendarService';
import { api } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  department?: string;
  avatar?: string;
  roles?: string[];
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, cargo?: string, departamento?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Inicializa os serviços após autenticação bem-sucedida
  const initializeServices = (userId: string) => {
    try {
      // Inicializar preferências ou carregar dados iniciais
      activitiesService.getAll().catch(err => 
        console.warn('Falha ao pré-carregar atividades:', err)
      );
      
      calendarService.getEvents().catch(err => 
        console.warn('Falha ao pré-carregar eventos:', err)
      );
      
      console.log('Serviços inicializados para o usuário:', userId);
    } catch (error) {
      console.error('Erro ao inicializar serviços:', error);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      if (isAuthenticated()) {
        try {
          const result = await getUserData();
          if (result.success && result.data) {
            // Adaptar o formato de dados do backend para o formato esperado pelo frontend
            const userData = {
              id: result.data._id,
              name: result.data.nome,
              email: result.data.email,
              department: result.data.departamento,
              avatar: result.data.avatar,
			  roles: result.data.roles,
			  permissions: result.data.permissions
            };
            
            setUser(userData);
            
            // Garantir que o ID do usuário está armazenado no localStorage
            if (result.data._id) {
              localStorage.setItem('userId', result.data._id);
              // Inicializar serviços com o ID do usuário
              initializeServices(result.data._id);
            }
          }
        } catch (error) {
          console.error('Erro ao carregar usuário:', error);
          // Se houver erro, podemos limpar o token
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          
          toast({
            title: "Sessão expirada",
            description: "Sua sessão expirou. Por favor, faça login novamente.",
            variant: "destructive"
          });
        }
      }
      setIsLoading(false);
    };
    
    loadUser();
  }, []);

 const login = async (email: string, password: string) => {
  setIsLoading(true);
  try {
    const result = await loginUser(email, password);
    if (result.success) {
      // Adaptar o formato de dados do backend para o formato esperado pelo frontend
      const userData = {
        id: result.data.usuario.id,
        name: result.data.usuario.nome,
        email: result.data.usuario.email,
        department: result.data.usuario.departamento,
        avatar: result.data.usuario.avatar,
        roles: result.data.usuario.roles || [],
        permissions: result.data.usuario.permissions || []
      };
      
      // Buscar permissões detalhadas (adicional)
      try {
        const userWithPermissions = await api.get(`/auth/user-permissions`);
        console.log('Permissões obtidas:', userWithPermissions);
        if (userWithPermissions) {
          userData.roles = userWithPermissions.roles || userData.roles;
          userData.permissions = userWithPermissions.permissions || userData.permissions;
        }
      } catch (permissionError) {
        console.error('Erro ao buscar permissões detalhadas:', permissionError);
        // Continuar com os dados básicos em caso de erro
        // Se necessário, atribuir permissões mínimas para funcionar
        if (!userData.permissions || userData.permissions.length === 0) {
          userData.permissions = ['timeline:view', 'knowledge:view', 'files:view'];
        }
      }
      
      console.log('Dados do usuário após login:', userData);
      
      setUser(userData);
      
      // Armazenar o ID do usuário no localStorage
      if (result.data.usuario.id) {
        localStorage.setItem('userId', result.data.usuario.id);
        
        // Inicializar serviços após login bem-sucedido
        initializeServices(result.data.usuario.id);
      }
      
      toast({
        title: "Login bem-sucedido",
        description: `Bem-vindo, ${result.data.usuario.nome}!`,
      });
      
      navigate('/');
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erro no login:', error);
    
    toast({
      title: "Erro no login",
      description: error instanceof Error ? error.message : "Falha no login. Verifique suas credenciais.",
      variant: "destructive",
    });
    
    throw error;
  } finally {
    setIsLoading(false);
  }
};

  const register = async (name: string, email: string, password: string, cargo: string = '', departamento: string = '') => {
    setIsLoading(true);
    try {
      const result = await registerUser(name, email, password, cargo, departamento);
      if (result.success) {
        // Se o backend retornar informações do usuário, podemos usá-las
        if (result.data.usuario) {
          const userData = {
            id: result.data.usuario.id,
            name: result.data.usuario.nome || name,
            email: result.data.usuario.email || email,
            department: result.data.usuario.departamento || departamento,
            avatar: result.data.usuario.avatar
          };
          
          setUser(userData);
          
          // Armazenar o ID do usuário no localStorage
          if (result.data.usuario.id) {
            localStorage.setItem('userId', result.data.usuario.id);
            
            // Inicializar serviços após registro bem-sucedido
            initializeServices(result.data.usuario.id);
          }
          
          toast({
            title: "Registro bem-sucedido",
            description: `Bem-vindo, ${name}!`,
          });
        } else {
          // Se o backend não retornar info do usuário, precisamos fazer uma requisição getUserData
          // ou navegar para o login para que o usuário faça login
          toast({
            title: "Registro realizado",
            description: "Por favor, faça login com suas novas credenciais.",
          });
          
          navigate('/login');
          return;
        }
        
        navigate('/');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Erro no registro:', error);
      
      toast({
        title: "Erro no registro",
        description: error instanceof Error ? error.message : "Não foi possível completar o registro.",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    logoutUser();
    setUser(null);
    
    // Limpar dados específicos do usuário
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    
    toast({
      title: "Logout realizado",
      description: "Você saiu da sua conta com sucesso.",
    });
    
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};