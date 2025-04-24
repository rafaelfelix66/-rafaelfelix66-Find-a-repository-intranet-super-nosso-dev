// src/components/home/HomeCalendar.tsx
import { useState, useEffect } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight, MapPin, Clock, Plus, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { format, isToday, isSameMonth, isSameDay, addMonths, subMonths, getDaysInMonth, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// Interface para o evento
interface CalendarEvent {
  id?: string;
  _id?: string;
  title: string;
  date: Date;
  location?: string;
  description?: string;
  allDay?: boolean;
  start?: Date;
  end?: Date;
}

// Interface para eventos vindo da timeline
interface TimelineEvent {
  _id: string;
  text: string;
  user: {
    _id: string;
    nome: string;
  };
  eventData?: {
    title: string;
    date: string;
    location: string;
  };
  createdAt: string;
}

// Props para o componente
interface HomeCalendarProps {
  events?: CalendarEvent[];
  timelinePosts?: TimelineEvent[];
  isLoading?: boolean;
  userId?: string;
  onEventAdded?: (event: CalendarEvent) => void;
}

export const HomeCalendar = ({ 
  events = [], 
  timelinePosts = [],
  isLoading = false, 
  userId = "current-user",
  onEventAdded
}: HomeCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Estado para novo evento
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: "",
    date: new Date(),
    allDay: true,
  });
  
  // Estados para controle de horários
  const [startHour, setStartHour] = useState("09");
  const [startMinute, setStartMinute] = useState("00");
  const [endHour, setEndHour] = useState("10");
  const [endMinute, setEndMinute] = useState("00");

  // Processar eventos da timeline para eventos do calendário
  useEffect(() => {
    if (!timelinePosts || timelinePosts.length === 0) return;
    
    const timelineEvents: CalendarEvent[] = timelinePosts
      .filter(post => post.eventData && post.eventData.title && post.eventData.date)
      .map(post => ({
        id: post._id,
        title: post.eventData?.title || "Evento",
        date: new Date(post.eventData?.date || post.createdAt),
        location: post.eventData?.location,
        description: post.text,
        allDay: true
      }));
    
    // Combinar eventos do calendário e da timeline
    const combinedEvents = [...events, ...timelineEvents];
    
    // Remover duplicatas por id
    const uniqueEvents = combinedEvents.reduce((acc, current) => {
      const idToCheck = current.id || current._id;
      const exists = acc.find(event => (event.id === idToCheck || event._id === idToCheck));
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, [] as CalendarEvent[]);
    
    setAllEvents(uniqueEvents);
  }, [events, timelinePosts]);
  
  // Filtrar eventos para a data selecionada
  useEffect(() => {
    if (!selectedDate || allEvents.length === 0) {
      setFilteredEvents([]);
      return;
    }
    
    const filtered = allEvents.filter(event => {
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, selectedDate);
    });
    
    setFilteredEvents(filtered);
  }, [selectedDate, allEvents]);
  
  // Navegar para o mês anterior
  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };
  
  // Navegar para o próximo mês
  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };
  
  // Selecionar uma data
  const handleDateClick = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
  };
  
  // Verificar se um dia tem eventos
  const hasEvents = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return allEvents.some(event => {
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, date);
    });
  };
  
  // Resetar o formulário de evento
  const resetEventForm = () => {
    setNewEvent({
      title: "",
      date: selectedDate,
      allDay: true,
    });
    setStartHour("09");
    setStartMinute("00");
    setEndHour("10");
    setEndMinute("00");
  };
  
  // Abrir o modal de novo evento com a data selecionada
  const openNewEventDialog = () => {
    resetEventForm();
    setNewEvent(prev => ({ ...prev, date: selectedDate }));
    setIsCreateEventOpen(true);
  };
  
  // Criar um novo evento
  const handleCreateEvent = async () => {
    if (!newEvent.title?.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, insira um título para o evento.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Preparar dados do evento
      const eventData: any = { 
        ...newEvent,
        createdBy: userId
      };
      
      // Se não for um evento que dura o dia todo, adicionar horários de início e fim
      if (!newEvent.allDay && newEvent.date) {
        const startDate = new Date(newEvent.date);
        startDate.setHours(parseInt(startHour), parseInt(startMinute));
        
        const endDate = new Date(newEvent.date);
        endDate.setHours(parseInt(endHour), parseInt(endMinute));
        
        eventData.start = startDate;
        eventData.end = endDate;
      }
      
      // Enviar para API - aqui vamos enviar para a timeline como um post com eventData
      // Isso garante que o evento seja salvo no sistema e apareça em ambos os lugares
      const response = await api.post('/timeline', {
        text: newEvent.description || `Evento: ${newEvent.title}`,
        eventData: {
          title: newEvent.title,
          date: format(newEvent.date || new Date(), "yyyy-MM-dd"),
          location: newEvent.location || ""
        }
      });
      
      const createdEvent: CalendarEvent = {
        id: response._id || `event-${Date.now()}`,
        title: newEvent.title,
        date: newEvent.date || new Date(),
        location: newEvent.location,
        description: newEvent.description,
        allDay: newEvent.allDay
      };
      
      // Adicionar o novo evento à lista local
      setAllEvents(prev => [...prev, createdEvent]);
      
      // Se houver callback de evento adicionado, chamar
      if (onEventAdded) onEventAdded(createdEvent);
      
      toast({
        title: "Evento criado",
        description: "O evento foi criado com sucesso!",
      });
      
      setIsCreateEventOpen(false);
      resetEventForm();
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o evento. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Gerar opções de horas (00-23)
  const getHourOptions = () => {
    return Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  };
  
  // Gerar opções de minutos (00, 15, 30, 45)
  const getMinuteOptions = () => {
    return ['00', '15', '30', '45'];
  };
  
  // Formatar a hora do evento
  const formatEventTime = (event: CalendarEvent) => {
    if (event.allDay) return "Dia inteiro";
    
    if (event.start && event.end) {
      return `${format(new Date(event.start), 'HH:mm')} - ${format(new Date(event.end), 'HH:mm')}`;
    }
    
    if (event.start) {
      return format(new Date(event.start), 'HH:mm');
    }
    
    return format(new Date(event.date), 'HH:mm');
  };
  
  // Renderizar o calendário
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getDay(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
    
    // Nomes dos dias da semana
    const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    
    // Renderizar cabeçalho da semana
    const renderWeekDays = () => (
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>
    );
    
    // Renderizar os dias do mês
    const renderDays = () => {
      const days = [];
      
      // Espaços vazios para os dias antes do primeiro dia do mês
      for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
      }
      
      // Dias do mês
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const isSelected = isSameDay(date, selectedDate);
        const isTodayDate = isToday(date);
        const dayHasEvents = hasEvents(day);
        
        days.push(
          <button
            key={day}
            className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center relative",
              isSelected 
                ? "bg-supernosso-red text-white" 
                : isTodayDate 
                  ? "border border-supernosso-red text-gray-900" 
                  : "hover:bg-supernosso-light-red text-gray-700"
            )}
            onClick={() => handleDateClick(day)}
          >
            {day}
            {dayHasEvents && !isSelected && (
              <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-supernosso-red rounded-full" />
            )}
          </button>
        );
      }
      
      return days;
    };
    
    return (
      <div className="mt-2">
        {renderWeekDays()}
        <div className="grid grid-cols-7 gap-1 justify-items-center">
          {renderDays()}
        </div>
      </div>
    );
  };
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Calendário</h2>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="text-center font-medium mb-3">
        {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
      </div>
      
      {isLoading ? (
        // Skeleton para o calendário
        <div className="space-y-2">
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }).map((_, dayIndex) => (
                <Skeleton key={`day-${weekIndex}-${dayIndex}`} className="h-8 w-8 rounded-full" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        renderCalendar()
      )}
      
      <div className="mt-5 space-y-3">
        <div className="font-medium text-sm border-b border-gray-200 pb-2 flex items-center">
          <CalendarIcon className="mr-2 h-4 w-4 text-supernosso-red" />
          Eventos para {format(selectedDate, 'd' + (currentDate.getMonth() !== selectedDate.getMonth() ? ' MMM' : ''), { locale: ptBR })}
        </div>
        
        {isLoading ? (
          // Skeleton para lista de eventos
          <div className="space-y-2 py-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-2">
                <Skeleton className="h-8 w-8" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="space-y-2">
            {filteredEvents.map(event => (
              <div key={event.id || event._id} className="p-2 rounded-md hover:bg-gray-50 transition-colors">
                <div className="flex flex-col">
                  <div className="font-medium text-sm">{event.title}</div>
                  {event.location && (
                    <div className="text-xs text-gray-500 flex items-center mt-1">
                      <MapPin className="h-3 w-3 mr-1 text-supernosso-red" />
                      {event.location}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 flex items-center mt-1">
                    <Clock className="h-3 w-3 mr-1 text-supernosso-red" />
                    {formatEventTime(event)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">Nenhum evento para esta data</p>
          </div>
        )}
      </div>
      
      <Button 
        variant="outline" 
        className="w-full mt-4 text-supernosso-red hover:text-supernosso-red hover:border-supernosso-red flex items-center justify-center"
        onClick={openNewEventDialog}
      >
        <Plus className="mr-2 h-4 w-4" />
        Adicionar Evento
      </Button>
      
      {/* Diálogo para criar novo evento */}
      <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Evento</DialogTitle>
            <DialogDescription>
              Crie um novo evento para {format(selectedDate, "d 'de' MMMM, yyyy", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título*</Label>
              <Input
                id="title"
                placeholder="Título do evento"
                value={newEvent.title || ""}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                    id="date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newEvent.date ? format(newEvent.date, "d 'de' MMMM, yyyy", { locale: ptBR }) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newEvent.date || undefined}
                    onSelect={(date) => setNewEvent({ ...newEvent, date: date || new Date() })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={newEvent.allDay || false}
                onCheckedChange={(checked) => setNewEvent({ ...newEvent, allDay: checked })}
                id="all-day"
              />
              <Label htmlFor="all-day">Dia Inteiro</Label>
            </div>
            
            {!newEvent.allDay && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Horário de Início</Label>
                  <div className="flex gap-2">
                    <Select value={startHour} onValueChange={setStartHour}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Hora" />
                      </SelectTrigger>
                      <SelectContent>
                        {getHourOptions().map(hour => (
                          <SelectItem key={`start-hour-${hour}`} value={hour}>{hour}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="flex items-center">:</span>
                    <Select value={startMinute} onValueChange={setStartMinute}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        {getMinuteOptions().map(minute => (
                          <SelectItem key={`start-min-${minute}`} value={minute}>{minute}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Horário de Término</Label>
                  <div className="flex gap-2">
                    <Select value={endHour} onValueChange={setEndHour}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Hora" />
                      </SelectTrigger>
                      <SelectContent>
                        {getHourOptions().map(hour => (
                          <SelectItem key={`end-hour-${hour}`} value={hour}>{hour}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="flex items-center">:</span>
                    <Select value={endMinute} onValueChange={setEndMinute}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        {getMinuteOptions().map(minute => (
                          <SelectItem key={`end-min-${minute}`} value={minute}>{minute}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="location">Local</Label>
              <Input
                id="location"
                placeholder="Local do evento"
                value={newEvent.location || ""}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Detalhes do evento"
                value={newEvent.description || ""}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateEventOpen(false)}>
              Cancelar
            </Button>
            <Button 
              className="bg-supernosso-red hover:bg-supernosso-red/90"
              onClick={handleCreateEvent}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Evento"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};