// src/services/calendarService.ts
import { api } from '@/lib/api';

// Interfaces
export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  location?: string;
  description?: string;
  allDay: boolean;
  start?: Date;
  end?: Date;
  createdBy: string;
}

// Serviço para gerenciar eventos de calendário
export const calendarService = {
  // Buscar todos os eventos
  getEvents: async (): Promise<CalendarEvent[]> => {
    try {
      // Tente buscar da API primeiro
      // const response = await api.get('/events');
      // return response.data;
      
      // Temporariamente, retornar dados mockados
      return getMockEvents();
    } catch (error) {
      console.error('Erro ao buscar eventos, usando dados mockados:', error);
      return getMockEvents();
    }
  },

  // Buscar eventos por data
  getEventsByDate: async (date: Date): Promise<CalendarEvent[]> => {
    try {
      const formattedDate = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      // const response = await api.get(`/events?date=${formattedDate}`);
      // return response.data;
      
      // Temporariamente, filtrar os dados mockados
      const mockEvents = getMockEvents();
      return mockEvents.filter(event => {
        const eventDate = new Date(event.date);
        return (
          eventDate.getDate() === date.getDate() &&
          eventDate.getMonth() === date.getMonth() &&
          eventDate.getFullYear() === date.getFullYear()
        );
      });
    } catch (error) {
      console.error(`Erro ao buscar eventos para a data ${date}:`, error);
      
      // Retornar dados mockados filtrados para a data específica
      const mockEvents = getMockEvents();
      return mockEvents.filter(event => {
        const eventDate = new Date(event.date);
        return (
          eventDate.getDate() === date.getDate() &&
          eventDate.getMonth() === date.getMonth() &&
          eventDate.getFullYear() === date.getFullYear()
        );
      });
    }
  },

  // Criar um novo evento
  createEvent: async (event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> => {
    try {
      // Em um ambiente real:
      // const response = await api.post('/events', event);
      // return response.data;
      
      // Simulação para desenvolvimento
      await new Promise(resolve => setTimeout(resolve, 500)); // Simular latência
      const newId = `event-${Date.now()}`;
      return {
        ...event,
        id: newId,
        date: event.date || new Date()
      };
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      throw new Error('Não foi possível criar o evento');
    }
  },

  // Atualizar um evento existente
  updateEvent: async (id: string, eventData: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    try {
      // Em um ambiente real:
      // const response = await api.put(`/events/${id}`, eventData);
      // return response.data;
      
      // Simulação para desenvolvimento
      await new Promise(resolve => setTimeout(resolve, 500)); // Simular latência
      return {
        ...eventData,
        id,
        date: eventData.date || new Date(),
        allDay: eventData.allDay || false,
        createdBy: eventData.createdBy || "current-user"
      } as CalendarEvent;
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      throw new Error('Não foi possível atualizar o evento');
    }
  },

  // Excluir um evento
  deleteEvent: async (id: string): Promise<void> => {
    try {
      // Em um ambiente real:
      // await api.delete(`/events/${id}`);
      
      // Simulação para desenvolvimento
      await new Promise(resolve => setTimeout(resolve, 500)); // Simular latência
      console.log(`Evento ${id} excluído com sucesso (simulação)`);
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      throw new Error('Não foi possível excluir o evento');
    }
  }
};

// Função para gerar dados mockados
function getMockEvents(): CalendarEvent[] {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  return [
    {
      id: '1',
      title: 'Reunião de Equipe',
      date: new Date(currentYear, currentMonth, 15, 10, 0),
      location: 'Sala de Reuniões',
      description: 'Discussão sobre metas do trimestre',
      allDay: false,
      start: new Date(currentYear, currentMonth, 15, 10, 0),
      end: new Date(currentYear, currentMonth, 15, 11, 30),
      createdBy: 'user1'
    },
    {
      id: '2',
      title: 'Prazo: Relatório Trimestral',
      date: new Date(currentYear, currentMonth, 20, 18, 0),
      description: 'Entrega do relatório financeiro do trimestre',
      allDay: true,
      createdBy: 'user2'
    },
    {
      id: '3',
      title: 'Treinamento de Produto',
      date: new Date(currentYear, currentMonth, 18, 14, 30),
      location: 'Sala de Treinamento',
      description: 'Capacitação sobre novos produtos',
      allDay: false,
      start: new Date(currentYear, currentMonth, 18, 14, 30),
      end: new Date(currentYear, currentMonth, 18, 16, 30),
      createdBy: 'user3'
    },
    {
      id: '4',
      title: 'Lançamento da Campanha',
      date: new Date(currentYear, currentMonth, currentDate.getDate(), 9, 0),
      location: 'Auditório Principal',
      description: 'Apresentação da nova campanha de marketing',
      allDay: false,
      start: new Date(currentYear, currentMonth, currentDate.getDate(), 9, 0),
      end: new Date(currentYear, currentMonth, currentDate.getDate(), 10, 30),
      createdBy: 'user2'
    }
  ];
}