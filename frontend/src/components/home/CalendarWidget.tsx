// src/components/home/CalendarWidget.tsx
import { useState, useEffect } from "react";
import { 
  CalendarEvent, 
  calendarService 
} from "@/services/calendarService";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X, MapPin, Clock } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CalendarWidgetProps {
  userId?: string;
}

export const CalendarWidget = ({ userId = "current-user" }: CalendarWidgetProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para controlar o diálogo de criar evento
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: "",
    date: new Date(),
    allDay: true,
    createdBy: userId
  });
  
  // Controle de horários para eventos não-integrais
  const [startHour, setStartHour] = useState("09");
  const [startMinute, setStartMinute] = useState("00");
  const [endHour, setEndHour] = useState("10");
  const [endMinute, setEndMinute] = useState("00");
  
  const { toast } = useToast();
  
  // Buscar eventos ao carregar o componente
  useEffect(() => {
    fetchEvents();
  }, []);
  
  // Buscar eventos do mês atual quando a data muda
  useEffect(() => {
    fetchEventsByMonth(currentDate);
  }, [currentDate]);
  
  // Buscar eventos por dia quando a data selecionada muda
  useEffect(() => {
    if (selectedDate) {
      fetchEventsByDate(selectedDate);
    }
  }, [selectedDate]);
  
  // Buscar todos os eventos
  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await calendarService.getEvents();
      setEvents(data);
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
      setError("Não foi possível carregar os eventos");
      toast({
        title: "Erro",
        description: "Não foi possível carregar os eventos do calendário.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Buscar eventos para o mês exibido
  const fetchEventsByMonth = async (date: Date) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Na implementação real, você buscaria os eventos do mês
      // Por enquanto, vamos filtrar os eventos já carregados
      const data = await calendarService.getEvents();
      setEvents(data);
    } catch (error) {
      console.error("Erro ao carregar eventos do mês:", error);
      setError("Não foi possível carregar os eventos");
      toast({
        title: "Erro",
        description: "Não foi possível carregar os eventos do mês.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Buscar eventos para um dia específico
  const fetchEventsByDate = async (date: Date) => {
    try {
      // Para evitar chamadas desnecessárias à API, vamos filtrar localmente
      // No futuro, você pode implementar uma chamada API específica
      const filteredEvents = events.filter(event => 
        isSameDay(new Date(event.date), date)
      );
      
      // Se houver menos de X eventos, faça a chamada para obter dados atualizados
      if (filteredEvents.length < 2) {
        const freshEvents = await calendarService.getEventsByDate(date);
        // Não precisamos atualizar todos os eventos, só os do dia selecionado
      }
    } catch (error) {
      console.error("Erro ao carregar eventos do dia:", error);
      // Não mostrar erro neste caso, pois não é crítico
    }
  };
  
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
    return events.some(event => isSameDay(new Date(event.date), date));
  };
  
  // Resetar o formulário de evento
  const resetEventForm = () => {
    setNewEvent({
      title: "",
      date: new Date(),
      allDay: true,
      createdBy: userId
    });
    setStartHour("09");
    setStartMinute("00");
    setEndHour("10");
    setEndMinute("00");
  };
  
  // Abrir o modal de novo evento com a data selecionada
  const openNewEventDialog = () => {
    resetEventForm();
    // Usar a data selecionada para o novo evento
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
    
    try {
      // Se não for um evento que dura o dia todo, adicionar horários de início e fim
      if (!newEvent.allDay && newEvent.date) {
        const startDate = new Date(newEvent.date);
        startDate.setHours(parseInt(startHour), parseInt(startMinute));
        
        const endDate = new Date(newEvent.date);
        endDate.setHours(parseInt(endHour), parseInt(endMinute));
        
        newEvent.start = startDate;
        newEvent.end = endDate;
      }
      
      const createdEvent = await calendarService.createEvent(newEvent as Omit<CalendarEvent, 'id'>);
      setEvents(prev => [...prev, createdEvent]);
      
      setIsCreateEventOpen(false);
      resetEventForm();
      
      toast({
        title: "Evento criado",
        description: "O evento foi criado com sucesso!",
      });
      
      // Atualizar eventos do dia
      fetchEventsByDate(selectedDate);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o evento.",
        variant: "destructive"
      });
    }
  };
  
  // Gerar opções de horas
  const getHourOptions = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i.toString().padStart(2, '0'));
    }
    return hours;
  };
  
  // Gerar opções de minutos
  const getMinuteOptions = () => {
    const minutes = [];
    for (let i = 0; i < 60; i += 15) {
      minutes.push(i.toString().padStart(2, '0'));
    }
    return minutes;
  };
  
  // Renderizar dias do calendário
  const renderCalendarDays = () => {
    const daysInMonth = new Date(
      currentDate.getFullYear(), 
      currentDate.getMonth() + 1, 
      0
    ).getDate();
    
    const firstDayOfMonth = new Date(
      currentDate.getFullYear(), 
      currentDate.getMonth(), 
      1
    ).getDay();
    
    const days = [];
    
    // Adicionar células vazias para os dias antes do primeiro dia do mês
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }
    
    // Adicionar os dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isSelected = selectedDate && 
                         selectedDate.getDate() === day && 
                         selectedDate.getMonth() === currentDate.getMonth() && 
                         selectedDate.getFullYear() === currentDate.getFullYear();
      const isTodayDate = 
        new Date().getDate() === day && 
        new Date().getMonth() === currentDate.getMonth() && 
        new Date().getFullYear() === currentDate.getFullYear();
      
      const dayHasEvents = hasEvents(day);
      
      days.push(
        <button
          key={day}
          className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center relative",
            isSelected 
              ? "bg-supernosso-red text-white" 
              : isTodayDate 
                ? "border border-supernosso-red text-supernosso-darkgray" 
                : "hover:bg-supernosso-light-red text-supernosso-darkgray"
          )}
          onClick={() => handleDateClick(day)}
        >
          {day}
          {dayHasEvents && !isSelected && (
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-supernosso-red rounded-full" />
          )}
        </button>
      );
    }
    
    return days;
  };
  
  // Obter eventos para a data selecionada
  const getEventsForSelectedDate = () => {
    if (!selectedDate) return [];
    
    return events.filter(event => 
      isSameDay(new Date(event.date), selectedDate)
    );
  };
  
  // Formatar a exibição da hora
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
  
  // Eventos filtrados para o dia selecionado
  const selectedEvents = getEventsForSelectedDate();
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Calendário</h2>
        <div className="flex space-x-1">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="text-center font-medium">
        {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(day => (
          <div key={day} className="text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1 justify-items-center">
        {renderCalendarDays()}
      </div>
      
      <div className="space-y-3 pt-4">
        <div className="font-medium text-sm border-b pb-2 flex items-center">
          <CalendarIcon className="mr-2 h-4 w-4 text-supernosso-red" />
          Eventos para {format(selectedDate, 'd MMMM', { locale: ptBR })}
        </div>
        
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-supernosso-red mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Carregando eventos...</p>
          </div>
        ) : selectedEvents.length > 0 ? (
          <div className="space-y-2">
            {selectedEvents.map(event => (
              <div key={event.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                <div className="flex flex-col">
                  <div className="font-medium text-sm">{event.title}</div>
                  {event.location && (
                    <div className="text-xs text-gray-500 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {event.location}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
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
        className="w-full text-supernosso-red hover:text-supernosso-red hover:border-supernosso-red"
        onClick={openNewEventDialog}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
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
            >
              Criar Evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};