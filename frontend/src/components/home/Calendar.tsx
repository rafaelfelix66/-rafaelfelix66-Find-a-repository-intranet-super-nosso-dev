
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Event {
  id: string;
  title: string;
  date: Date;
  type: "meeting" | "event" | "deadline";
}

const events: Event[] = [
  {
    id: "1",
    title: "Reunião de Equipe",
    date: new Date(2023, 5, 15, 10, 0),
    type: "meeting"
  },
  {
    id: "2",
    title: "Prazo: Relatório Trimestral",
    date: new Date(2023, 5, 20, 18, 0),
    type: "deadline"
  },
  {
    id: "3",
    title: "Treinamento de Produto",
    date: new Date(2023, 5, 18, 14, 30),
    type: "event"
  }
];

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function CalendarWidget() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
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
  
  const handleDateClick = (day: number) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
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
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isSelected = selectedDate.getDate() === day && 
                         selectedDate.getMonth() === currentDate.getMonth() && 
                         selectedDate.getFullYear() === currentDate.getFullYear();
      const isToday = new Date().getDate() === day && 
                     new Date().getMonth() === currentDate.getMonth() && 
                     new Date().getFullYear() === currentDate.getFullYear();
      
      // Check if day has events
      const hasEvent = events.some(event => 
        event.date.getDate() === day && 
        event.date.getMonth() === currentDate.getMonth() && 
        event.date.getFullYear() === currentDate.getFullYear()
      );
      
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
          {hasEvent && !isSelected && (
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-supernosso-red rounded-full" />
          )}
        </button>
      );
    }
    
    return days;
  };
  
  const getEventsForSelectedDate = () => {
    return events.filter(event => 
      event.date.getDate() === selectedDate.getDate() && 
      event.date.getMonth() === selectedDate.getMonth() && 
      event.date.getFullYear() === selectedDate.getFullYear()
    );
  };
  
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "meeting": return "bg-supernosso-light-red text-supernosso-red";
      case "event": return "bg-supernosso-light-red text-supernosso-red";
      case "deadline": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  const selectedEvents = getEventsForSelectedDate();
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Calendário</CardTitle>
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
          <div className="font-medium text-sm border-b pb-2 flex items-center">
            <CalendarIcon className="mr-2 h-4 w-4 text-supernosso-red" />
            Eventos para {selectedDate.getDate()} de {MONTHS[selectedDate.getMonth()]}
          </div>
          {selectedEvents.length > 0 ? (
            selectedEvents.map(event => (
              <div key={event.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`px-2 py-1 rounded-full text-xs ${getEventTypeColor(event.type)}`}>
                    {event.type === "meeting" ? "Reunião" : 
                     event.type === "event" ? "Evento" : "Prazo"}
                  </div>
                  <div className="text-sm">{event.title}</div>
                </div>
                <div className="text-xs text-gray-500">
                  {event.date.getHours().toString().padStart(2, '0')}:
                  {event.date.getMinutes().toString().padStart(2, '0')}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500 py-2 text-center">
              Nenhum evento para esta data
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button variant="outline" className="w-full text-supernosso-red hover:text-supernosso-red hover:border-supernosso-red">
          <CalendarIcon className="mr-2 h-4 w-4" />
          Adicionar Evento
        </Button>
      </CardFooter>
    </Card>
  );
}
