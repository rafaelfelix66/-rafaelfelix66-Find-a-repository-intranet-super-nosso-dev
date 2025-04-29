// src/contexts/AuthContext.tsx (modificado)
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { activitiesService } from '@/services/activitiesService';
import { calendarService } from '@/services/calendarService';
import { api } from '@/lib/api';

interface User {
  id: string;
  name: string;
  cpf: string;  // Adicionado CPF
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
  login: (cpf: string, password: string) => Promise<void>;  // Modificado para CPF
  register: (cpf: string, password: string) => Promise<void>;  // Modificado para apenas CPF e senha
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
              cpf: result.data.cpf, // Adicionado CPF
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

  const login = async (cpf: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await loginUser(cpf, password);
      if (result.success) {
        // Adaptar o formato de dados do backend para o formato esperado pelo frontend
        const userData = {
          id: result.data.usuario.id,
          name: result.data.usuario.nome,
          cpf: result.data.usuario.cpf, // Adicionado CPF
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
        
        // Verificar se é primeiro acesso
        if (result.data.primeiroAcesso) {
          toast({
            title: "Primeiro Acesso",
            description: "Recomendamos que você altere sua senha no menu de configurações.",
          });
        } else {
          toast({
            title: "Login bem-sucedido",
            description: `Bem-vindo, ${result.data.usuario.nome}!`,
          });
        }
        
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

  // Função de registro simplificada para CPF e senha
  const register = async (cpf: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await registerUser(cpf, password);
      if (result.success) {
        if (result.data.usuario) {
          const userData = {
            id: result.data.usuario.id,
            name: result.data.usuario.nome,
            cpf: result.data.usuario.cpf,
            email: result.data.usuario.email,
            department: result.data.usuario.departamento,
            avatar: result.data.usuario.avatar,
            roles: result.data.usuario.roles || [],
            permissions: result.data.usuario.permissions || []
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
            description: `Bem-vindo, ${userData.name}!`,
          });
        } else {
          toast({
            title: "Registro realizado",
            description: "Por favor, faça login com suas credenciais.",
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

  // Função para verificar autenticação
  const isAuthenticated = () => {
    return !!localStorage.getItem('token');
  };

  // Função de logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setUser(null);
    
    toast({
      title: "Logout realizado",
      description: "Você saiu da sua conta com sucesso.",
    });
    
    navigate('/login');
  };

  // Função auxiliar para obter dados do usuário
  const getUserData = async () => {
    try {
      const response = await api.get('/auth/user');
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
      return { success: false, error };
    }
  };

  // Função auxiliar para login
  const loginUser = async (cpf: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { cpf, senha: password });
      
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

  // Função auxiliar para registro
  const registerUser = async (cpf: string, password: string) => {
    try {
      const response = await api.post('/auth/register', { cpf, senha: password });
      
      if (response && response.token) {
        localStorage.setItem('token', response.token);
        return { success: true, data: response };
      }
      
      return { success: false, message: 'Resposta inválida do servidor' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao registrar';
      return { success: false, message };
    }
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