import React from 'react';
// import { refreshPlantAIAnalysis } from '../actions/health';

interface RefreshAnalysisButtonProps {
  plantId: number;
  startDate: string;
  endDate: string;
}

export default function RefreshAnalysisButton({ plantId, startDate, endDate }: RefreshAnalysisButtonProps) {
  // const [isPending, startTransition] = useTransition();
  // const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  
  // const handleRefresh = () => {
  //   startTransition(async () => {
  //     try {
  //       // This will trigger a fresh AI analysis and update the UI
  //       await refreshPlantAIAnalysis(plantId, startDate, endDate);
  //       setLastRefreshed(new Date());
  //     } catch (error) {
  //       console.error('Error refreshing analysis:', error);
  //     }
  //   });
  // };
  
  return (
    <div className="flex flex-col items-end">
      {/* <button
        onClick={handleRefresh}
        disabled={isPending}
        className={`flex items-center px-3 py-1.5 rounded text-sm ${
          isPending
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 mr-1.5 ${isPending ? 'animate-spin' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        {isPending ? 'Refreshing...' : 'Refresh Analysis'}
      </button>
      
      {lastRefreshed && (
        <span className="text-xs text-gray-500 mt-1">
          Last refreshed: {lastRefreshed.toLocaleTimeString()}
        </span>
      )} */}
    </div>
  );
} 