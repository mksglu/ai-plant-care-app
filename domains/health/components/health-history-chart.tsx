'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

type DailyHealthData = {
  date: string;
  precipitation: number;
  humidity: number;
  status: string;
  score: number;
  waterDeviation: number;
  humidityDeviation: number;
};

export interface HealthHistoryChartProps {
  data: DailyHealthData[];
  expectedHumidity?: number | null;
  expectedWaterNeedDaily?: number | null; // Daily water need
}

export function HealthHistoryChart({ 
  data, 
  expectedHumidity, 
  expectedWaterNeedDaily 
}: HealthHistoryChartProps) {
  // Format the date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data.map(d => ({
          ...d,
          // Format date for display
          formattedDate: formatDate(d.date),
        }))}
        margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis 
          dataKey="formattedDate" 
          tick={{ fontSize: 12, fill: '#666' }}
          tickLine={false}
        />
        <YAxis 
          yAxisId="left"
          orientation="left"
          label={{ value: 'Score', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#666', fontSize: 12 }}}
          domain={[0, 100]} 
          tick={{ fontSize: 12, fill: '#666' }}
          tickLine={false}
        />
        <YAxis 
          yAxisId="right"
          orientation="right"
          label={{ value: 'Values', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#666', fontSize: 12 }}}
          tick={{ fontSize: 12, fill: '#666' }}
          tickLine={false}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}
          formatter={(value, name) => {
            // Custom formatter for tooltip values
            if (name === 'Health Score') return [`${Number(value).toFixed(0)}/100`, name];
            if (name === 'Humidity') return [`${Number(value).toFixed(1)}%`, name];
            if (name === 'Precipitation') return [`${Number(value).toFixed(1)}mm`, name];
            return [value, name];
          }}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Legend />
        
        {/* Health Score Line */}
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="score"
          name="Health Score"
          stroke="hsl(var(--chart-1))"
          activeDot={{ r: 6 }}
          strokeWidth={2}
        />
        
        {/* Humidity Line */}
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="humidity"
          name="Humidity"
          stroke="hsl(var(--chart-2))"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        
        {/* Precipitation Line */}
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="precipitation"
          name="Precipitation"
          stroke="hsl(var(--chart-3))"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        
        {/* Reference Line for Expected Humidity */}
        {expectedHumidity && (
          <ReferenceLine
            yAxisId="right"
            y={expectedHumidity}
            stroke="hsl(var(--chart-2))"
            strokeDasharray="3 3"
            label={{ 
              value: 'Expected Humidity', 
              fill: 'hsl(var(--chart-2))',
              fontSize: 10,
              position: 'insideBottomRight'
            }}
          />
        )}
        
        {/* Reference Line for Expected Water Need */}
        {expectedWaterNeedDaily && (
          <ReferenceLine
            yAxisId="right"
            y={expectedWaterNeedDaily}
            stroke="hsl(var(--chart-3))"
            strokeDasharray="3 3"
            label={{ 
              value: 'Expected Water', 
              fill: 'hsl(var(--chart-3))',
              fontSize: 10,
              position: 'insideTopRight'
            }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
} 