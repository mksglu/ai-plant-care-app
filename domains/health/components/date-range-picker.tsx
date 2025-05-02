'use client';

import * as React from 'react';
import { format, isValid, parse, addDays, subDays } from 'date-fns';
import { Calendar } from '../../../components/ui/calendar';
import { Button } from '../../../components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { cn } from '../../../lib/utils';
import { DateRange } from 'react-day-picker';
import { CalendarIcon } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  onChange: (startDate: string, endDate: string) => void;
  className?: string;
}

export function DateRangePicker({ startDate, endDate, onChange, className }: DateRangePickerProps) {
  // Define some preset ranges
  const presets = [
    { name: 'Last 7 days', start: subDays(new Date(), 7), end: new Date() },
    { name: 'Last 14 days', start: subDays(new Date(), 14), end: new Date() },
    { name: 'Last 30 days', start: subDays(new Date(), 30), end: new Date() },
  ];
  
  // Parse string dates to Date objects
  const parseDate = (dateStr: string) => {
    return parse(dateStr, 'yyyy-MM-dd', new Date());
  };
  
  // Format Date objects to string dates
  const formatDate = (date: Date) => {
    if (!isValid(date)) return '';
    return format(date, 'yyyy-MM-dd');
  };
  
  // Initialize date range state
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: parseDate(startDate),
    to: parseDate(endDate)
  });

  // Handle date range changes
  const handleDateChange = (range: DateRange | undefined) => {
    setDate(range);
    if (range?.from) {
      const newStartDate = formatDate(range.from);
      const newEndDate = range.to ? formatDate(range.to) : newStartDate;
      onChange(newStartDate, newEndDate);
    }
  };
  
  // Handle preset selections
  const handlePresetChange = (preset: { start: Date; end: Date }) => {
    const range = { from: preset.start, to: preset.end };
    setDate(range);
    onChange(formatDate(preset.start), formatDate(preset.end));
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal border-slate-200 bg-white hover:bg-slate-50 focus:ring-2 focus:ring-slate-200 transition-colors",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col sm:flex-row">
            <div className="border-r p-2">
              <div className="px-3 py-2 text-sm font-medium">Presets</div>
              <div className="grid gap-2 p-2">
                {presets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => handlePresetChange(preset)}
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleDateChange}
              numberOfMonths={2}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 