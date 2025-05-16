//frontend/src/components/ui/date-range-picker.tsx
"use client";

import * as React from "react";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  className?: string;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export function DateRangePicker({
  className,
  dateRange,
  onDateRangeChange,
}: DateRangePickerProps) {
  
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                  {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : (
                format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
              )
            ) : (
              <span>Selecione um período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={onDateRangeChange}
            numberOfMonths={2}
            locale={ptBR}
          />
          <div className="flex justify-between p-3 border-t border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDateRangeChange(undefined)}
            >
              Limpar
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  onDateRangeChange({
                    from: today,
                    to: today,
                  });
                }}
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const weekStart = new Date(today);
                  weekStart.setDate(today.getDate() - today.getDay());
                  const weekEnd = new Date(weekStart);
                  weekEnd.setDate(weekStart.getDate() + 6);
                  onDateRangeChange({
                    from: weekStart,
                    to: weekEnd,
                  });
                }}
              >
                Esta semana
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const monthStart = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    1
                  );
                  const monthEnd = new Date(
                    today.getFullYear(),
                    today.getMonth() + 1,
                    0
                  );
                  onDateRangeChange({
                    from: monthStart,
                    to: monthEnd,
                  });
                }}
              >
                Este mês
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}