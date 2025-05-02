'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DateRangePicker } from './date-range-picker';

interface DateRangeSelectorProps {
  plantId: number;
  startDate: string;
  endDate: string;
}

export function DateRangeSelector({ plantId, startDate, endDate }: DateRangeSelectorProps) {
  const router = useRouter();
  const [isChanging, setIsChanging] = useState(false);
  
  const handleDateChange = (newStartDate: string, newEndDate: string) => {
    setIsChanging(true);
    
    // Update URL with new date range
    const url = `/plant/${plantId}?start=${newStartDate}&end=${newEndDate}`;
    router.push(url);
  };
  
  return (
    <div className="w-full">
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onChange={handleDateChange}
        className={isChanging ? "opacity-50 pointer-events-none" : ""}
      />
      {isChanging && (
        <div className="flex justify-center mt-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      )}
    </div>
  );
} 