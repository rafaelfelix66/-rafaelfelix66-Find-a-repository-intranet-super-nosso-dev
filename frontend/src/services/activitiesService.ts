// src/services/activitiesService.ts
import { api } from './api';

// Interfaces
export interface Activity {
  id: string;
  type: 'document' | 'image' | 'comment' | 'event';
  title: string;
  description: string;
  user: {
    id: string;
    name: string;
    initials: string;
  };
  timestamp: Date;
  contentType?: string;
  target?: string;
}

// Interface para os posts da timeline
interface TimelinePost {
  _id: string;
  text: string;
  user: {
    _id: string;
    nome: string;
  };
  attachments: string[];
  createdAt: string;
  eventData?: any;
}

// Serviço para buscar atividades recentes
export const activitiesService = {
  // Buscar todas as atividades
  getAll: async (): Promise<Activity[]> => {
    try {
      // Use a rota timeline em vez de activities
      const response = await api.get('/timeline');
      
      if (Array.isArray(response)) {
        // Converter posts da timeline para o formato de atividades
        return convertTimelinePostsToActivities(response);
      }
      
      // Fallback para dados mockados se a resposta não for um array
      console.error('Resposta da timeline não é um array:', response);
      return getMockActivities();
    } catch (error) {
      console.error('Erro ao buscar atividades, usando dados mockados:', error);
      // Em caso de erro, retornar dados mockados
      return getMockActivities();
    }
  },

  // Buscar atividades por tipo
  getByType: async (type: string): Promise<Activity[]> => {
    try {
      // Buscar todos os posts da timeline
      const response = await api.get('/timeline');
      
      if (Array.isArray(response)) {
        // Converter posts da timeline para o formato de atividades
        const activities = convertTimelinePostsToActivities(response);
        
        // Filtrar pelo tipo solicitado
        return activities.filter(activity => {
          if (type === 'arquivos') return activity.type === 'document';
          if (type === 'imagens') return activity.type === 'image';
          if (type === 'comentarios') return activity.type === 'comment';
          if (type === 'eventos') return activity.type === 'event';
          return true;
        });
      }
      
      // Fallback para dados mockados filtrados
      console.error('Resposta da timeline não é um array:', response);
      const allActivities = getMockActivities();
      return allActivities.filter(activity => {
        if (type === 'arquivos') return activity.type === 'document';
        if (type === 'imagens') return activity.type === 'image';
        if (type === 'comentarios') return activity.type === 'comment';
        return true;
      });
    } catch (error) {
      console.error(`Erro ao buscar atividades do tipo ${type}, usando dados mockados:`, error);
      // Filtrar os mocks pelo tipo solicitado
      const allActivities = getMockActivities();
      return allActivities.filter(activity => {
        if (type === 'arquivos') return activity.type === 'document';
        if (type === 'imagens') return activity.type === 'image';
        if (type === 'comentarios') return activity.type === 'comment';
        return true;
      });
    }
  },

  // Adicionar uma nova atividade
  create: async (activity: Omit<Activity, 'id' | 'timestamp'>): Promise<Activity> => {
    try {
      const response = await api.post('/activities', activity);
      return response;
    } catch (error) {
      console.error('Erro ao criar atividade:', error);
      throw new Error('Não foi possível criar a atividade');
    }
  }
};

// Função para converter posts da timeline em atividades
function convertTimelinePostsToActivities(posts: TimelinePost[]): Activity[] {
  return posts.map(post => {
    // Determinar o tipo da atividade
    let type: 'document' | 'image' | 'comment' | 'event' = 'document';
    
    if (post.eventData) {
      type = 'event';
    } else if (post.attachments && post.attachments.length > 0) {
      // Verificar se há imagens nos anexos
      const hasImage = post.attachments.some(att => 
        /\.(jpg|jpeg|png|gif|webp)$/i.test(att)
      );
      if (hasImage) type = 'image';
    } else if (post.text) {
      type = 'comment';
    }
    
    // Gerar um título adequado
    let title = '';
    
    if (post.eventData && post.eventData.title) {
      title = post.eventData.title;
    } else if (post.text) {
      // Se tiver texto, usar as primeiras palavras (até 5)
      const words = post.text.split(' ').slice(0, 5).join(' ');
      title = words + (post.text.split(' ').length > 5 ? '...' : '');
    } else if (post.attachments && post.attachments.length > 0) {
      const hasImage = post.attachments.some(att => 
        /\.(jpg|jpeg|png|gif|webp)$/i.test(att)
      );
      if (hasImage) {
        title = `Compartilhou ${post.attachments.length} ${post.attachments.length === 1 ? 'imagem' : 'imagens'}`;
      } else {
        title = `Compartilhou ${post.attachments.length} ${post.attachments.length === 1 ? 'arquivo' : 'arquivos'}`;
      }
    } else {
      title = "Nova publicação";
    }
    
    // Construir objeto de atividade
    return {
      id: post._id,
      type,
      title,
      description: post.text || '',
      user: {
        id: post.user._id,
        name: post.user.nome,
        initials: getInitials(post.user.nome)
      },
      timestamp: new Date(post.createdAt),
      contentType: type,
      target: '/timeline'
    };
  });
}

// Função auxiliar para obter iniciais
function getInitials(name: string): string {
  if (!name) return '??';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

// Função para gerar dados mockados
function getMockActivities(): Activity[] {
  return [
    {
      id: '1',
      type: 'document',
      title: 'Relatório Mensal de Vendas',
      description: 'Adicionou um novo documento na pasta Relatórios',
      user: {
        id: 'user1',
        name: 'João Silva',
        initials: 'JS'
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hora atrás
      contentType: 'document',
      target: '/arquivos/relatorios'
    },
    {
      id: '2',
      type: 'image',
      title: 'Inauguração da Nova Loja',
      description: 'Adicionou 5 fotos ao evento',
      user: {
        id: 'user2',
        name: 'Maria Oliveira',
        initials: 'MO'
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 horas atrás
      contentType: 'image',
      target: '/timeline'
    },
    {
      id: '3',
      type: 'comment',
      title: 'Comentou em um documento',
      description: 'Excelente trabalho na apresentação!',
      user: {
        id: 'user3',
        name: 'Pedro Santos',
        initials: 'PS'
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 horas atrás
      contentType: 'comment',
      target: '/arquivos'
    },
    {
      id: '4',
      type: 'document',
      title: 'Guia de Treinamento',
      description: 'Atualizou o manual de procedimentos',
      user: {
        id: 'user4',
        name: 'Ana Costa',
        initials: 'AC'
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dia atrás
      contentType: 'document',
      target: '/base-conhecimento'
    },
    {
      id: '5',
      type: 'comment',
      title: 'Respondeu a uma pergunta',
      description: 'Esclareceu dúvida sobre o novo sistema',
      user: {
        id: 'user5',
        name: 'Carlos Mendes',
        initials: 'CM'
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dia atrás
      contentType: 'comment',
      target: '/base-conhecimento'
    }
  ];
}