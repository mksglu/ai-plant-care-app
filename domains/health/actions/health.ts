'use server';

import postgres from 'postgres';
import { fetchHistoricalWeather, WeatherData } from '../http/client';
import { Plant } from '../../plant/actions/plant';
import { analyzeHealthWithAI, AIAnalysisResponse } from '../lib/gemini';

// Get the database connection
const sql = postgres(process.env.DATABASE_URL || '', {
  ssl: 'require',
});

// Health status enumeration
export enum HealthStatus {
  Good = 'Good',
  NeedsWater = 'Needs Water',
  TooMuchWater = 'Too Much Water',
  LowHumidity = 'Low Humidity',
  HighHumidity = 'High Humidity',
  Alert = 'Alert', // Multiple issues
}

// Health data for a specific day
export type DailyHealthData = {
  date: string;
  precipitation: number;
  humidity: number;
  status: HealthStatus;
  score: number; // 0-100 scale for health score
  waterDeviation: number; // % deviation from expected
  humidityDeviation: number; // % deviation from expected
};

// Overall health assessment result
export type HealthAssessment = {
  plantId: number;
  plantName: string;
  overallStatus: HealthStatus;
  averageScore: number;
  startDate: string;
  endDate: string;
  dailyData: DailyHealthData[];
  aiAnalysis?: AIAnalysisResponse; // Optional AI-enhanced analysis
};

// Saved health analysis from database
export type SavedHealthAnalysis = {
  id: number;
  plant_id: number;
  start_date: string;
  end_date: string;
  created_at: Date;
  overall_status: string;
  average_score: number;
  ai_summary: string;
  ai_recommendations: string[];
  ai_prediction_trend: string;
  ai_prediction_score: number;
  ai_prediction_explanation: string;
  ai_potential_issues: any[];
  ai_optimal_conditions: any;
};

/**
 * Save health analysis to the database
 */
async function saveHealthAnalysisToDb(
  plantId: number,
  startDate: string,
  endDate: string,
  overallStatus: string,
  averageScore: number,
  aiAnalysis: AIAnalysisResponse
): Promise<number> {
  try {
    // Convert AI analysis to database format
    const results = await sql`
      INSERT INTO health_analysis (
        plant_id,
        start_date,
        end_date,
        overall_status,
        average_score,
        ai_summary,
        ai_recommendations,
        ai_prediction_trend,
        ai_prediction_score,
        ai_prediction_explanation,
        ai_potential_issues,
        ai_optimal_conditions,
        raw_ai_response
      ) VALUES (
        ${plantId},
        ${startDate},
        ${endDate},
        ${overallStatus},
        ${averageScore},
        ${aiAnalysis.summary},
        ${JSON.stringify(aiAnalysis.recommendations)},
        ${aiAnalysis.predictionNextWeek.healthTrend},
        ${aiAnalysis.predictionNextWeek.expectedScore},
        ${aiAnalysis.predictionNextWeek.explanation},
        ${JSON.stringify(aiAnalysis.potentialIssues)},
        ${JSON.stringify(aiAnalysis.optimalConditions)},
        ${JSON.stringify(aiAnalysis)}
      )
      ON CONFLICT (plant_id, start_date, end_date) 
      DO UPDATE SET
        overall_status = EXCLUDED.overall_status,
        average_score = EXCLUDED.average_score,
        ai_summary = EXCLUDED.ai_summary,
        ai_recommendations = EXCLUDED.ai_recommendations,
        ai_prediction_trend = EXCLUDED.ai_prediction_trend,
        ai_prediction_score = EXCLUDED.ai_prediction_score,
        ai_prediction_explanation = EXCLUDED.ai_prediction_explanation,
        ai_potential_issues = EXCLUDED.ai_potential_issues,
        ai_optimal_conditions = EXCLUDED.ai_optimal_conditions,
        raw_ai_response = EXCLUDED.raw_ai_response,
        created_at = CURRENT_TIMESTAMP
      RETURNING id
    `;
    
    return results[0]?.id;
  } catch (error) {
    console.error('Error saving health analysis to database:', error);
    throw new Error('Failed to save health analysis');
  }
}

/**
 * Get saved health analysis from the database
 */
export async function getSavedHealthAnalysis(
  plantId: number,
  startDate: string,
  endDate: string
): Promise<SavedHealthAnalysis | null> {
  console.log('Called getSavedHealthAnalysis with plantId:', plantId);
  try {
    const results = await sql<SavedHealthAnalysis[]>`
      SELECT *
      FROM health_analysis
      WHERE plant_id = ${plantId}
        AND start_date = ${startDate}
        AND end_date = ${endDate}
    `;
    
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Error fetching saved health analysis:', error);
    return null;
  }
}

/**
 * Convert saved health analysis to AIAnalysisResponse format
 */
async function convertSavedAnalysisToAIResponse(savedAnalysis: SavedHealthAnalysis): Promise<AIAnalysisResponse> {
  return {
    summary: savedAnalysis.ai_summary,
    recommendations: savedAnalysis.ai_recommendations,
    predictionNextWeek: {
      healthTrend: savedAnalysis.ai_prediction_trend as 'improving' | 'stable' | 'declining',
      expectedScore: savedAnalysis.ai_prediction_score,
      explanation: savedAnalysis.ai_prediction_explanation,
    },
    potentialIssues: savedAnalysis.ai_potential_issues,
    optimalConditions: savedAnalysis.ai_optimal_conditions,
  };
}

/**
 * Fetches plant health assessment based on weather data for the given date range
 * With optional AI analysis if requested
 */
export async function getPlantHealth(
  plantId: number,
  startDate: string,
  endDate: string,
  includeAIAnalysis: boolean = false,
  forceRefreshAI: boolean = false
): Promise<HealthAssessment> {
  console.log('Called getPlantHealth with plantId:', plantId);
  try {
    console.log(`Fetching health data for plant ID ${plantId} from ${startDate} to ${endDate}`);
    
    // Fetch plant details first
    const plants = await sql<Plant[]>`
      SELECT * FROM plant
      WHERE id = ${plantId}
    `;
    
    if (plants.length === 0) {
      throw new Error(`Plant with ID ${plantId} not found`);
    }
    
    const plant = plants[0];
    
    // Fetch historical weather data
    const weatherData = await fetchHistoricalWeather(
      plant.latitude,
      plant.longitude,
      startDate,
      endDate
    );
    
    // Process the data to calculate health
    const healthAssessment = await calculateHealthFromWeatherData(plant, weatherData, startDate, endDate);
    
    // If AI analysis is requested, check if we have a saved analysis or need to fetch a new one
    if (includeAIAnalysis && process.env.GEMINI_API_KEY) {
      try {
        // Check if we have a saved analysis (unless a refresh is forced)
        let savedAnalysis = null;
        if (!forceRefreshAI) {
          savedAnalysis = await getSavedHealthAnalysis(plantId, startDate, endDate);
        }
        
        if (savedAnalysis && !forceRefreshAI) {
          console.log('Using saved AI analysis from database');
          healthAssessment.aiAnalysis = await convertSavedAnalysisToAIResponse(savedAnalysis);
        } else {
          console.log('Requesting new AI analysis from Gemini...');
          const aiAnalysis = await analyzeHealthWithAI(plant, healthAssessment);
          healthAssessment.aiAnalysis = aiAnalysis;
          
          // Save the new analysis to the database
          await saveHealthAnalysisToDb(
            plant.id,
            startDate,
            endDate,
            healthAssessment.overallStatus,
            healthAssessment.averageScore,
            aiAnalysis
          );
        }
      } catch (aiError) {
        console.error('Error getting AI analysis:', aiError);
        // Don't fail the whole request if AI analysis fails
      }
    }
    
    return healthAssessment;
  } catch (error) {
    console.error('Error in getPlantHealth:', error);
    throw new Error('Failed to fetch plant health assessment');
  }
}

/**
 * Force a refresh of the AI analysis for a plant
 */
export async function refreshPlantAIAnalysis(
  plantId: number,
  startDate: string,
  endDate: string
): Promise<HealthAssessment> {
  console.log('Called refreshPlantAIAnalysis with plantId:', plantId);
  return getPlantHealth(plantId, startDate, endDate, true, true);
}

/**
 * Calculates health status based on precipitation and humidity data
 */
async function calculateHealthFromWeatherData(
  plant: Plant,
  weatherData: WeatherData,
  startDate: string,
  endDate: string
): Promise<HealthAssessment> {
  // Validate we have the required plant data
  if (plant.weekly_water_need === null || plant.expected_humidity === null) {
    throw new Error('Plant is missing required data for health calculation (water need or humidity)');
  }
  
  const dailyData: DailyHealthData[] = [];
  let totalScore = 0;
  
  // Get the daily precipitation and humidity from weather data
  const { time, precipitation_sum, relative_humidity_2m_mean } = weatherData.daily;
  
  // Calculate daily water need (convert weekly to daily)
  const dailyWaterNeed = plant.weekly_water_need / 7;
  
  // Process each day's data
  for (let i = 0; i < time.length; i++) {
    const date = time[i];
    const precipitation = precipitation_sum[i];
    const humidity = relative_humidity_2m_mean[i];
    
    // Calculate deviations from expected values
    const waterDeviation = ((precipitation - dailyWaterNeed) / dailyWaterNeed) * 100;
    const humidityDeviation = ((humidity - plant.expected_humidity) / plant.expected_humidity) * 100;
    
    // Log the calculation inputs and outputs
    console.log('Health calculation inputs/outputs:', {
      date,
      expected: {
        dailyWaterNeed,
        expectedHumidity: plant.expected_humidity,
      },
      actual: {
        precipitation,
        humidity,
      },
      deviation: {
        waterDeviation,
        humidityDeviation,
      },
    });
    
    // Determine health status and score
    let status = HealthStatus.Good;
    let score = 100;
    
    // Water assessment (severely penalize if more than 50% deviation)
    if (waterDeviation < -30) {
      status = HealthStatus.NeedsWater;
      score -= Math.min(40, Math.abs(waterDeviation));
    } else if (waterDeviation > 50) {
      status = HealthStatus.TooMuchWater;
      score -= Math.min(40, Math.abs(waterDeviation) / 2);
    } else if (waterDeviation < 0) {
      // Minor water deficit
      score -= Math.abs(waterDeviation) / 2;
    } else if (waterDeviation > 0) {
      // Minor excess water
      score -= Math.min(15, waterDeviation / 3);
    }
    
    // Humidity assessment
    if (humidityDeviation < -20) {
      // Low humidity is problematic for many plants
      status = status !== HealthStatus.Good ? HealthStatus.Alert : HealthStatus.LowHumidity;
      score -= Math.min(30, Math.abs(humidityDeviation) / 2);
    } else if (humidityDeviation > 30) {
      // High humidity can lead to fungal issues
      status = status !== HealthStatus.Good ? HealthStatus.Alert : HealthStatus.HighHumidity;
      score -= Math.min(30, humidityDeviation / 2);
    } else if (Math.abs(humidityDeviation) > 10) {
      // Minor humidity deviation
      score -= Math.abs(humidityDeviation) / 4;
    }
    
    // Ensure score stays in 0-100 range
    score = Math.max(0, Math.min(100, score));
    totalScore += score;
    
    // Add this day's data
    dailyData.push({
      date,
      precipitation,
      humidity,
      status,
      score,
      waterDeviation,
      humidityDeviation,
    });
  }
  
  // Calculate overall health status and average score
  const averageScore = dailyData.length > 0 ? totalScore / dailyData.length : 0;
  
  // Determine overall status based on average score
  let overallStatus = HealthStatus.Good;
  if (averageScore < 60) {
    overallStatus = HealthStatus.Alert;
  } else {
    // Count occurrences of each status
    const statusCounts = dailyData.reduce((counts, day) => {
      counts[day.status] = (counts[day.status] || 0) + 1;
      return counts;
    }, {} as Record<HealthStatus, number>);
    
    // Find most frequent status (excluding Good)
    const statuses = Object.entries(statusCounts)
      .filter(([status]) => status !== HealthStatus.Good)
      .sort((a, b) => b[1] - a[1]);
    
    if (statuses.length > 0 && statuses[0][1] > dailyData.length / 3) {
      // If a specific issue occurs in more than 1/3 of days, use it as overall status
      overallStatus = statuses[0][0] as HealthStatus;
    }
  }
  
  return {
    plantId: plant.id,
    plantName: plant.name,
    overallStatus,
    averageScore,
    startDate,
    endDate,
    dailyData,
  };
} 