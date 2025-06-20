// src/components/home/EnhancedCalendarWidget.tsx - Versão corrigida
import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ChevronLeft, ChevronRight, Plus, Loader2, MapPin } from "lucide-react";
import { api } from "@/lib/api"; 
import { toast } from "@/hooks/use-toast";
import { usePermission } from '@/hooks/usePermission';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import DepartamentoSelector from "@/components/timeline/DepartamentoSelector";

// Interface para eventos do calendário
interface Event {
  id: string;
  title: string;
  date: Date;
  location: string;
  description?: string;
  postId?: string;
  createdAt?: string;
  departamento?: string[];
}

export function EnhancedCalendarWidget() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [multiEventView, setMultiEventView] = useState(false);
  const { hasPermission } = usePermission();
  const navigate = useNavigate();
  // Estados do formulário
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedDepartments, setSelectedDepartments] = useState(['TODOS']);
  
  const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const MONTHS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  
  // Função auxiliar para obter índice do mês a partir do nome
  const getMonthIndex = (monthName: string): number => {
    const months: Record<string, number> = {
      'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3,
      'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
      'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
    };
    
    return months[monthName.toLowerCase()] || -1;
  };
  
  // Função aprimorada para converter string de data para objeto Date
  const parseEventDate = (dateString: string): Date => {
  console.log(`Tentando converter data: "${dateString}"`);
  
  // Caso de string vazia ou inválida
  if (!dateString || typeof dateString !== 'string') {
    console.error(`Data inválida: ${dateString}, usando data atual como fallback`);
    return new Date();
  }
  
  // Verificar se a string já é um timestamp ISO
  if (dateString.match(/^\d{4}-\d{2}-\d{2}T/)) {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      console.log(`Data ISO válida: ${date.toISOString()}`);
      return date;
    }
  }
  
  // Formato: "15 de abril, 2025" ou "15 de abril de 2025"
  const ptDateFormat = /(\d+)\s+de\s+(\w+)(?:,?\s+|\s+de\s+)(\d{4})/i;
  const ptMatch = dateString.match(ptDateFormat);
  if (ptMatch) {
    const [_, day, monthName, year] = ptMatch;
    const monthIndex = getMonthIndex(monthName.toLowerCase());
    
    if (monthIndex !== -1) {
      const parsedDate = new Date(parseInt(year), monthIndex, parseInt(day));
      if (!isNaN(parsedDate.getTime())) {
        console.log(`Data em formato PT convertida: ${parsedDate.toISOString()}`);
        return parsedDate;
      }
    }
  }
  
  // Formato: "15/04/2025" ou "15-04-2025"
  const numericFormat = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/;
  const numericMatch = dateString.match(numericFormat);
  if (numericMatch) {
    const [_, day, month, year] = numericMatch;
    const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(parsedDate.getTime())) {
      console.log(`Data em formato numérico convertida: ${parsedDate.toISOString()}`);
      return parsedDate;
    }
  }
  
  // Formato: "abril 15, 2025" ou "Abr 15, 2025"
  const enFormat = /(\w+)\s+(\d{1,2}),\s+(\d{4})/i;
  const enMatch = dateString.match(enFormat);
  if (enMatch) {
    const [_, monthName, day, year] = enMatch;
    // Tentar converter usando construtor Date nativo que entende inglês
    const parsedDate = new Date(`${monthName} ${day}, ${year}`);
    if (!isNaN(parsedDate.getTime())) {
      console.log(`Data em formato EN convertida: ${parsedDate.toISOString()}`);
      return parsedDate;
    }
  }
  
  // Tentar construtor Date nativo como último recurso
  try {
    const nativeDate = new Date(dateString);
    if (!isNaN(nativeDate.getTime())) {
      console.log(`Data convertida via construtor nativo: ${nativeDate.toISOString()}`);
      return nativeDate;
    }
  } catch (e) {
    console.error(`Erro no construtor Date: ${e}`);
  }
  
  // Se todas as tentativas falharem, retornar a data atual
  console.error(`Não foi possível converter a data: "${dateString}" - usando data atual como fallback`);
  return new Date();
};
  
  // Função para buscar eventos da timeline no servidor
  // Função corrigida para buscar eventos da timeline
const fetchEvents = async () => {
  setIsLoading(true);
  try {
    console.log("EnhancedCalendarWidget: Buscando posts da timeline...");
    console.log("Departamentos selecionados para filtro:", selectedDepartments);
    
    // Fazendo a chamada ao backend para buscar os eventos
    const response = await api.get('/timeline');

    let timelinePosts = [];

    // CORREÇÃO: Como estamos usando @/lib/api (Axios com interceptor), 
    // a response já retorna response.data diretamente
    // Verificar novo formato com paginação
    if (response && response.posts && Array.isArray(response.posts)) {
      console.log(`EnhancedCalendarWidget: Recebidos ${response.posts.length} posts`);
      timelinePosts = response.posts;
    } 
    // FALLBACK: Formato antigo (array direto) - não deve acontecer mais com @/lib/api
    else if (Array.isArray(response)) {
      console.log(`EnhancedCalendarWidget: Recebidos ${response.length} posts (formato antigo)`);
      timelinePosts = response;
    } else {
      console.error("EnhancedCalendarWidget: Resposta não é um array nem objeto com posts:", response);
      toast({
        title: "Erro de formato",
        description: "A resposta da API não está no formato esperado",
        variant: "destructive"
      });
      return; // Sair da função se não conseguir processar
    }

    // Processar posts para extrair eventos
    const timelineEvents = [];
    
    // Iterar sobre cada post recebido
    timelinePosts.forEach(post => {
      console.log(`Processando post ${post._id}:`, {
        hasEventData: !!post.eventData,
        hasEvent: !!post.event,
        eventData: post.eventData,
        event: post.event,
        text: post.text?.substring(0, 30)
      });

      // NOVO: Filtrar por departamento antes de processar
      const shouldIncludePost = selectedDepartments.includes('TODOS') || 
          !post.departamentoVisibilidade || 
          post.departamentoVisibilidade.some(dept => 
            selectedDepartments.includes(dept) || dept === 'TODOS'
          );
      if (!shouldIncludePost) {
        console.log(`Post ${post._id} filtrado por departamento:`, {
          postDepartments: post.departamentoVisibilidade,
          selectedDepartments
        });
        return; // Pular este post
      }
      
      // 1. CORREÇÃO: Verificar se o post tem eventData OU event
      if ((post.eventData && typeof post.eventData === 'object') || 
          (post.event && typeof post.event === 'object')) {
        
        // Priorizar eventData, mas usar event como fallback
        const eventInfo = post.eventData || post.event;
        
        console.log(`Post ${post._id} tem dados de evento:`, eventInfo);
        
        try {
          // Confirmar se os campos necessários estão presentes
          if (eventInfo.title && eventInfo.date) {
            const eventDate = parseEventDate(eventInfo.date);
            
            timelineEvents.push({
              id: post._id + "-event", 
              title: eventInfo.title,
              date: eventDate,
              location: eventInfo.location || '',
              description: post.text || '',
              postId: post._id,
              createdAt: post.createdAt,
              departamento: post.departamentoVisibilidade || ['TODOS']
            });
            
            console.log(`Evento extraído: ${eventInfo.title}`);
          } else {
            console.warn(`Dados de evento incompletos no post ${post._id}:`, eventInfo);
          }
        } catch (e) {
          console.error(`Erro ao processar dados de evento do post ${post._id}:`, e);
        }
      }
      
      // 2. Para posts recém-criados que podem ter perdido eventData
      else if (post.text && post.text.toLowerCase() === 'teste') {
        const postDate = new Date(post.createdAt);
        const now = new Date();
        const isRecent = (now.getTime() - postDate.getTime()) < 24 * 60 * 60 * 1000; // Últimas 24 horas
        
        if (isRecent) {
          console.log(`Post recente encontrado que pode ser um evento: ${post._id}`);
          timelineEvents.push({
            id: post._id + "-auto", 
            title: "Evento",
            date: new Date(), // Data atual como fallback
            location: 'Localização não especificada',
            description: post.text || '',
            postId: post._id,
            createdAt: post.createdAt,
            departamento: post.departamentoVisibilidade || ['TODOS']
          });
          
          console.log(`Evento temporário criado para post recente: ${post._id}`);
        }
      }
      
      // 3. Verificar posts com formato de evento no texto
      else if (post.text && typeof post.text === 'string') {
        const eventPattern = /Título:\s*([^,\n]+)(?:,|\n)?\s*Data:\s*([^,\n]+)(?:,|\n)?\s*Local:\s*([^,\n]+)/i;
        const match = post.text.match(eventPattern);
        
        if (match) {
          console.log(`Post ${post._id} contém padrão de evento no texto`);
          const [_, eventTitle, eventDateText, eventLocation] = match;
          
          try {
            const eventDate = parseEventDate(eventDateText.trim());
            
            timelineEvents.push({
              id: post._id + "-parsed-event",
              title: eventTitle.trim(),
              date: eventDate,
              location: eventLocation.trim(),
              description: post.text || '',
              postId: post._id,
              createdAt: post.createdAt,
              departamento: post.departamentoVisibilidade || ['TODOS']
            });
            
            console.log(`Evento extraído do texto: ${eventTitle.trim()}`);
          } catch (e) {
            console.error(`Erro ao converter data do evento em texto: ${e.message}`);
          }
        }
      }
    });
    
    // Ordenar eventos por data
    timelineEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    console.log(`Encontrados ${timelineEvents.length} eventos na timeline após filtro de departamento`);
    
    // Depurar cada evento encontrado
    timelineEvents.forEach(event => {
      console.log(`Evento: ${event.title}`);
      console.log(`- Data: ${event.date.toISOString()}`);
      console.log(`- Departamento: ${event.departamento?.join(', ')}`);
      console.log(`- Dia: ${event.date.getDate()}, Mês: ${event.date.getMonth() + 1}, Ano: ${event.date.getFullYear()}`);
    });
    
    setEvents(timelineEvents);
  } catch (error) {
    console.error('Erro ao carregar eventos:', error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar os eventos",
      variant: "destructive"
    });
  } finally {
    setIsLoading(false);
  }
};
  
  // Carrega eventos ao montar o componente
  useEffect(() => {
    fetchEvents();
    console.log("EnhancedCalendarWidget montado, buscando eventos...");
  }, []);
  
  // Debug quando eventos mudam
  useEffect(() => {
    console.log(`Estado de eventos atualizado: ${events.length} eventos`);
  }, [events]);
  
  // Recarregar eventos quando o filtro de departamento mudar
	useEffect(() => {
	  if (selectedDepartments.length > 0) {
		fetchEvents();
	  }
	}, [selectedDepartments]);
  
  // Formatador de data para exibição
  const formatEventDate = (date: Date): string => {
    return format(date, "d 'de' MMMM, yyyy", { locale: ptBR });
  };
  
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };
  
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  // Melhorada função getEventsForDate para depuração
  const getEventsForDate = (date: Date): Event[] => {
    const filteredEvents = events.filter(event => {
      const isSameDay = (
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear()
      );
      
      // Para debug
      if (
        event.date.getDate() === date.getDate() && 
        event.date.getMonth() === date.getMonth()
      ) {
        console.log(`Verificando evento "${event.title}" para data ${date.toISOString()}`);
        console.log(`- Data do evento: ${event.date.toISOString()}`);
        console.log(`- Comparação: ${isSameDay ? 'CORRESPONDE' : 'NÃO CORRESPONDE'}`);
      }
      
      return isSameDay;
    });
    
    return filteredEvents;
  };
  
  const handleDateClick = (day: number) => {
    const newSelectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newSelectedDate);
    
    // Verificar quantos eventos existem para essa data
    const eventsForDay = getEventsForDate(newSelectedDate);
    
    // Se houver mais de um evento, mostrar a visão multi-evento
    if (eventsForDay.length > 1) {
      setMultiEventView(true);
    } else {
      setMultiEventView(false);
    }
    
    // Debug para eventos do dia selecionado
    console.log(`Selecionada data: ${newSelectedDate.toISOString()}`);
    console.log(`Eventos para ${formatEventDate(newSelectedDate)}: ${eventsForDay.length}`);
    eventsForDay.forEach(event => {
      console.log(`- ${event.title} (${event.date.toISOString()})`);
    });
  };
  
  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
    
    const days = [];
    
    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateForDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isSelected = selectedDate.getDate() === day && 
                      selectedDate.getMonth() === currentDate.getMonth() && 
                      selectedDate.getFullYear() === currentDate.getFullYear();
      const isToday = new Date().getDate() === day && 
                    new Date().getMonth() === currentDate.getMonth() && 
                    new Date().getFullYear() === currentDate.getFullYear();
      
      // Check if day has events
      const dayEvents = getEventsForDate(dateForDay);
      const hasEvents = dayEvents.length > 0;
      const multipleEvents = dayEvents.length > 1;
      
      days.push(
        <button
          key={day}
          className={`h-8 w-8 rounded-full flex items-center justify-center relative ${
            isSelected 
              ? "bg-supernosso-red text-white" 
              : isToday 
                ? "border border-supernosso-red text-supernosso-darkgray" 
                : "hover:bg-supernosso-light-red text-supernosso-darkgray"
          }`}
          onClick={() => handleDateClick(day)}
        >
          {day}
          {hasEvents && !isSelected && (
            <span 
              className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 ${
                multipleEvents ? "w-3 h-1 rounded-md" : "w-1 h-1 rounded-full"
              } bg-supernosso-red`} 
            />
          )}
        </button>
      );
    }
    
    return days;
  };
  
  const getEventsForSelectedDate = () => {
    return getEventsForDate(selectedDate);
  };
  
  const selectedEvents = getEventsForSelectedDate();
  
  // Reset do formulário
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setDate(selectedDate);
  };
  
  // Abrir formulário de evento
  const openEventForm = () => {
    resetForm();
    setDate(selectedDate);
    setIsEventFormOpen(true);
  };
  
  // Criar novo evento - agora garantindo que seja salvo no banco
  const handleCreateEvent = async () => {
    if (!title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, informe um título para o evento.",
        variant: "destructive"
      });
      return;
    }
    
    if (!date) {
      toast({
        title: "Data obrigatória",
        description: "Por favor, selecione uma data para o evento.",
        variant: "destructive"
      });
      return;
    }
    
    if (!location.trim()) {
      toast({
        title: "Local obrigatório",
        description: "Por favor, informe o local do evento.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Preparar dados do evento
      const eventData = {
        title: title.trim(),
        date: formatEventDate(date),
        location: location.trim()
      };
	   // Criar post com evento - isso salva no banco de dados
	  // NOVO: Preparar dados do post com departamento
	const postData = {
      text: description || '',
      eventData: eventData,
      departamentoVisibilidade: selectedDepartments // NOVO: Incluir departamentos selecionados
      };
      
      console.log("Enviando evento para o banco de dados:", eventData);
      
      
      // Enviar para a API e salvar no banco de dados
      const response = await api.post('/timeline', postData);
      console.log("Resposta da criação do evento:", response);
      
      toast({
        title: "Evento criado",
        description: "Seu evento foi salvo no banco de dados com sucesso."
      });
      
      // Adicionar o novo evento localmente para exibição imediata
      const newEvent: Event = {
        id: response._id + "-event",
        title: title.trim(),
        date: date,
        location: location.trim(),
        description: description,
        postId: response._id,
        createdAt: new Date().toISOString(),
        departamento: selectedDepartments
      };
      
      setEvents(prevEvents => [newEvent, ...prevEvents]);
      
      // Fechar o formulário
      setIsEventFormOpen(false);
    } catch (error) {
      console.error("Erro ao criar evento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o evento no banco de dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Ver detalhes do evento na timeline
  const viewEventInTimeline = (postId: string) => {
    navigate(`/timeline?post=${postId}`);
  };
  
  // Forçar atualização dos eventos do banco de dados
  const refreshEvents = () => {
    fetchEvents();
  };
  
  return (
    <Card>
            <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Calendário</CardTitle>
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={refreshEvents} 
              title="Atualizar eventos do banco de dados"
            >
              <Loader2 className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-center font-medium">
          {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {DAYS.map(day => (
            <div key={day} className="text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 justify-items-center">
          {renderCalendarDays()}
        </div>
      </CardContent>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="font-medium text-sm border-b pb-2 flex items-center justify-between">
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4 text-supernosso-red" />
              <span>Eventos para {selectedDate.getDate()} de {MONTHS[selectedDate.getMonth()]}</span>
            </div>
            {multiEventView && selectedEvents.length > 1 && (
              <Badge variant="outline" className="text-xs">
                {selectedEvents.length} eventos
              </Badge>
            )}
          </div>
          {isLoading ? (
            <div className="py-2 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : selectedEvents.length > 0 ? (
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
              {selectedEvents.map(event => (
                <div 
                  key={event.id} 
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => event.postId && viewEventInTimeline(event.postId)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-supernosso-red">{event.title}</h4>
                      <Badge variant="outline" className="text-xs bg-supernosso-light-red text-supernosso-red border-none">
                        Evento
                      </Badge>
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <MapPin className="h-3 w-3 mr-1" />
                      {event.location}
                    </div>
                    
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    
                    <div className="flex justify-end">
                      <Link to={`/timeline?post=${event.postId}`} className="text-xs text-supernosso-red hover:underline">
                        Ver na timeline
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 py-2 text-center">
              Nenhum evento para esta data
            </div>
          )}
        </div>
      </CardContent>
       {hasPermission('events:create') && (
        <CardFooter className="pt-2">
          <Button 
            variant="outline" 
            className="w-full text-supernosso-red hover:text-supernosso-red hover:border-supernosso-red"
            onClick={openEventForm}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Evento
          </Button>
        </CardFooter>
      )}
      
      {/* Formulário de Evento Integrado */}
      <Dialog open={isEventFormOpen} onOpenChange={setIsEventFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Evento</DialogTitle>
            <DialogDescription>
              Preencha os detalhes para criar um novo evento
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="event-title">Título <span className="text-red-500">*</span></Label>
              <Input
                id="event-title"
                placeholder="Ex: Reunião de Equipe"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="event-date">Data <span className="text-red-500">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                      format(date, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="event-location">Local <span className="text-red-500">*</span></Label>
              <Input
                id="event-location"
                placeholder="Ex: Sala de Reuniões, Loja Centro"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="event-description">Descrição (opcional)</Label>
              <Textarea
                id="event-description"
                placeholder="Detalhes adicionais sobre o evento"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
			
			 <div className="grid gap-2">
			  <Label>Departamentos que podem visualizar</Label>
			  <DepartamentoSelector 
				onChange={setSelectedDepartments}
			  />
			</div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEventFormOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateEvent} 
              disabled={isSubmitting}
              className="bg-supernosso-red hover:bg-supernosso-red/90 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Criar Evento"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default EnhancedCalendarWidget;