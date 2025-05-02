import { getPlantById } from '../../../domains/plant/actions/plant';
import { getPlantHealth, HealthStatus } from '../../../domains/health/actions/health';
import Link from 'next/link';
import RefreshAnalysisButton from '../../../domains/health/components/refresh-analysis-button';

// Helper function to generate dates for default view
function getDateRange(daysBack = 14) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - daysBack);
  
  // Format dates as YYYY-MM-DD
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}

interface PlantDetailParams {
  params: {
    id: string;
  }
}

export default async function PlantDetail({ params }: PlantDetailParams) {
  const { id } = params;
  const plant = await getPlantById(Number(id));
  
  if (!plant) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          &larr; Back to Dashboard
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          Plant not found. The requested plant may have been deleted.
        </div>
      </main>
    );
  }
  
  // Get default date range (last 14 days)
  const { startDate, endDate } = getDateRange();
  
  // Only try to fetch health data if plant has required fields
  let healthData = null;
  if (plant.weekly_water_need !== null && plant.expected_humidity !== null) {
    try {
      // Include AI analysis in the health assessment
      healthData = await getPlantHealth(plant.id, startDate, endDate, true);
    } catch (error) {
      console.error('Error fetching health data:', error);
    }
  }
  
  // Format health status badge color
  function getStatusColor(status: HealthStatus | string): string {
    switch (status) {
      case 'Good': return 'bg-green-100 text-green-800';
      case 'Needs Water': return 'bg-yellow-100 text-yellow-800';
      case 'Too Much Water': return 'bg-blue-100 text-blue-800';
      case 'Low Humidity': return 'bg-orange-100 text-orange-800';
      case 'High Humidity': return 'bg-indigo-100 text-indigo-800';
      case 'Alert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  // Format the AI prediction trend with appropriate color
  function getTrendColor(trend: string): string {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'stable': return 'text-blue-600';
      case 'declining': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }
  
  // Format issue severity with appropriate color
  function getSeverityColor(severity: string): string {
    switch (severity) {
      case 'low': return 'text-yellow-600';
      case 'medium': return 'text-orange-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }
  
  return (
    <main className="container mx-auto px-4 py-8">
      <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
        &larr; Back to Dashboard
      </Link>
      
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold">{plant.name}</h1>
          <button className="text-gray-600 hover:text-gray-800">Edit</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Plant Details</h2>
            <ul className="space-y-2">
              <li><span className="font-medium">Type:</span> {plant.type || 'Not specified'}</li>
              <li>
                <span className="font-medium">Weekly Water Need:</span> 
                {plant.weekly_water_need ? `${plant.weekly_water_need}L` : 'Not specified'}
              </li>
              <li>
                <span className="font-medium">Expected Humidity:</span> 
                {plant.expected_humidity ? `${plant.expected_humidity}%` : 'Not specified'}
              </li>
              <li>
                <span className="font-medium">Location:</span> 
                {`${plant.latitude.toFixed(4)}, ${plant.longitude.toFixed(4)}`}
              </li>
            </ul>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-2">Health Status</h2>
            {!healthData ? (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded p-3">
                {!plant.weekly_water_need || !plant.expected_humidity 
                  ? 'Please add water need and humidity requirements to view health data.'
                  : 'Unable to fetch health data at this time.'}
              </div>
            ) : (
              <div className="space-y-3">
                <div className={`inline-block px-3 py-1 rounded-full text-sm ${getStatusColor(healthData.overallStatus)}`}>
                  {healthData.overallStatus}
                </div>
                <div>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ width: `${healthData.averageScore}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm font-medium">{Math.round(healthData.averageScore)}/100</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Health Score (Average)</p>
                </div>
                
                <p className="text-sm">
                  Data from {new Date(healthData.startDate).toLocaleDateString()} to {new Date(healthData.endDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* AI Analysis Section */}
      {healthData?.aiAnalysis && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              <span className="mr-2">AI-Powered Analysis</span>
              <span className="inline-block px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">Gemini AI</span>
            </h2>
            
            {/* Refresh Analysis Button */}
            <RefreshAnalysisButton
              plantId={plant.id}
              startDate={startDate} 
              endDate={endDate}
            />
          </div>
          
          <div className="space-y-6">
            {/* Summary section */}
            <div>
              <h3 className="font-medium mb-2">Summary</h3>
              <p className="text-gray-700">{healthData.aiAnalysis.summary}</p>
            </div>
            
            {/* Recommendations section */}
            <div>
              <h3 className="font-medium mb-2">Recommendations</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {healthData.aiAnalysis.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
            
            {/* Next week prediction */}
            <div>
              <h3 className="font-medium mb-2">Next Week Prediction</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="font-medium">Health Trend:</span>
                  <span className={`ml-2 capitalize ${getTrendColor(healthData.aiAnalysis.predictionNextWeek.healthTrend)}`}>
                    {healthData.aiAnalysis.predictionNextWeek.healthTrend}
                  </span>
                </div>
                <div className="flex items-center mb-3">
                  <span className="font-medium">Expected Score:</span>
                  <span className="ml-2">{healthData.aiAnalysis.predictionNextWeek.expectedScore}/100</span>
                </div>
                <p className="text-sm text-gray-700">{healthData.aiAnalysis.predictionNextWeek.explanation}</p>
              </div>
            </div>
            
            {/* Potential issues */}
            <div>
              <h3 className="font-medium mb-2">Potential Issues</h3>
              <div className="space-y-3">
                {healthData.aiAnalysis.potentialIssues.map((issue, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{issue.issue}</span>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs capitalize ${getSeverityColor(issue.severity)}`}>
                        {issue.severity} severity
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{issue.remedy}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Optimal conditions */}
            <div>
              <h3 className="font-medium mb-2">Optimal Conditions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="block font-medium mb-1">Water</span>
                  <p className="text-sm text-gray-700">{healthData.aiAnalysis.optimalConditions.waterAmount}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="block font-medium mb-1">Humidity</span>
                  <p className="text-sm text-gray-700">{healthData.aiAnalysis.optimalConditions.humidity}</p>
                </div>
                <div className="col-span-full bg-gray-50 p-3 rounded-lg">
                  <span className="block font-medium mb-1">Additional Notes</span>
                  <p className="text-sm text-gray-700">{healthData.aiAnalysis.optimalConditions.notes}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Health History</h2>
        
        {!healthData ? (
          <div className="bg-gray-50 border border-gray-200 text-gray-800 rounded p-4 text-center">
            No health history available.
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Date Range</h3>
                <button className="text-sm text-blue-600 hover:text-blue-800">Change Dates</button>
              </div>
              <div className="flex gap-2">
                <div className="border rounded px-3 py-1.5 text-sm flex-1 text-center">
                  {new Date(healthData.startDate).toLocaleDateString()}
                </div>
                <span className="self-center">to</span>
                <div className="border rounded px-3 py-1.5 text-sm flex-1 text-center">
                  {new Date(healthData.endDate).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <div className="h-64 bg-gray-50 border rounded-lg flex items-center justify-center">
              <p className="text-gray-600">
                Chart component will be implemented here
              </p>
            </div>
            
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Date</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-left py-2 px-4">Score</th>
                    <th className="text-left py-2 px-4">Precipitation</th>
                    <th className="text-left py-2 px-4">Humidity</th>
                  </tr>
                </thead>
                <tbody>
                  {healthData.dailyData.map((day, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 px-4">{new Date(day.date).toLocaleDateString()}</td>
                      <td className="py-2 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs ${getStatusColor(day.status)}`}>
                          {day.status}
                        </span>
                      </td>
                      <td className="py-2 px-4">{Math.round(day.score)}/100</td>
                      <td className="py-2 px-4">{day.precipitation.toFixed(1)}mm</td>
                      <td className="py-2 px-4">{day.humidity.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
} 