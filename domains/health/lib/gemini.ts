'use server';

import { getHealthAssessmentType } from '../actions/health';
import { Plant } from '../../plant/actions/plant';
import { z } from 'zod';

// Get the HealthAssessment type from the return value of getHealthAssessmentType
type HealthAssessment = NonNullable<Awaited<ReturnType<typeof getHealthAssessmentType>>>;

// Define the Zod schema for AI analysis response validation (not exported)
const AIAnalysisSchema = z.object({
  summary: z.string(),
  recommendations: z.array(z.string()),
  predictionNextWeek: z.object({
    healthTrend: z.enum(['improving', 'stable', 'declining']),
    expectedScore: z.number().min(0).max(100),
    explanation: z.string(),
  }),
  potentialIssues: z.array(z.object({
    issue: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
    remedy: z.string(),
  })),
  optimalConditions: z.object({
    waterAmount: z.string(),
    humidity: z.string(),
    notes: z.string(),
  }),
});

// TypeScript type derived from the Zod schema (not exported)
type AIAnalysisResponse = z.infer<typeof AIAnalysisSchema>;

// Export the type via an async function to be compatible with 'use server'
export async function getAIAnalysisResponseType(): Promise<AIAnalysisResponse | null> {
  return null; // Just returns null, this is only for type exporting
}

/**
 * Formats plant and health data for AI analysis
 */
async function formatDataForAI(plant: Plant, healthData: HealthAssessment): Promise<string> {
  type DailyData = HealthAssessment['dailyData'][number];
  
  const dailyDataSample = healthData.dailyData.slice(0, 7).map((day: DailyData) => ({
    date: day.date,
    precipitation: Number(day.precipitation).toFixed(1),
    humidity: Number(day.humidity).toFixed(1),
    healthScore: Math.round(day.score),
    status: day.status,
    waterDeviation: Number(day.waterDeviation).toFixed(1) + '%',
    humidityDeviation: Number(day.humidityDeviation).toFixed(1) + '%'
  }));
  
  const plantData = {
    name: plant.name,
    type: plant.type,
    weeklyWaterNeed: plant.weekly_water_need,
    expectedHumidity: plant.expected_humidity,
    location: {
      latitude: plant.latitude,
      longitude: plant.longitude
    },
    currentHealth: {
      overallStatus: healthData.overallStatus,
      averageScore: Math.round(healthData.averageScore),
      period: `${healthData.startDate} to ${healthData.endDate}`,
      dailyDataSample
    }
  };
  
  return JSON.stringify(plantData, null, 2);
}

/**
 * Creates a prompt for the Gemini AI to analyze plant health
 */
async function createPrompt(plant: Plant, healthData: HealthAssessment): Promise<string> {
  const formattedData = await formatDataForAI(plant, healthData);
  
  return `As an expert botanist and plant health specialist, analyze the following plant health data and provide comprehensive insights.

Plant Data:
${formattedData}

Based on the above data, provide a detailed health analysis in the following JSON format ONLY:

{
  "summary": "A concise paragraph summarizing the plant's overall health status, key factors affecting its health, and general wellbeing",
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2",
    "Actionable recommendation 3"
  ],
  "predictionNextWeek": {
    "healthTrend": "improving/stable/declining",
    "expectedScore": 75,
    "explanation": "Explanation for the prediction based on weather patterns and current health metrics"
  },
  "potentialIssues": [
    {
      "issue": "Specific problem identified",
      "severity": "low/medium/high",
      "remedy": "Specific action to remedy this issue"
    }
  ],
  "optimalConditions": {
    "waterAmount": "Optimal watering advice based on plant type and historical data",
    "humidity": "Ideal humidity range with adjustment suggestions if needed",
    "notes": "Additional specialized care notes based on plant type and conditions"
  }
}

Important instructions:
1. The response MUST be valid JSON with NO additional text before or after.
2. Use the health score trends, precipitation, humidity, and their deviation from expected values to identify issues.
3. Consider the plant type when providing recommendations.
4. For predictionNextWeek, analyze recent trends to predict if health will improve, stay stable, or decline.
5. Base your analysis on actual data provided, not general plant care advice.
6. Focus on actionable, specific insights rather than generic advice.
7. Include at least 2-3 specific potential issues if present in the data.`;
}

/**
 * Call the Gemini API to analyze plant health
 */
export async function analyzeHealthWithAI(
  plant: Plant, 
  healthData: HealthAssessment
): Promise<AIAnalysisResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables');
  }
  
  // Using the newer Gemini 1.5 Flash API endpoint
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  
  try {
    const prompt = await createPrompt(plant, healthData);
    
    console.log('Requesting Gemini AI analysis...');
    
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048
        }
      })
    });
    
    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorDetails}`);
    }
    
    const result = await response.json();
    
    // Extract the text part from the Gemini API response
    let aiResponseText = '';
    if (result.candidates && 
        result.candidates[0] && 
        result.candidates[0].content && 
        result.candidates[0].content.parts && 
        result.candidates[0].content.parts[0] && 
        result.candidates[0].content.parts[0].text) {
      aiResponseText = result.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Unexpected Gemini API response format');
    }
    
    // Log the raw response for debugging
    console.log('AI Response Text:', aiResponseText);
    
    // Parse the JSON response
    let parsedResponse;
    try {
      // Find JSON in the response (in case there's any additional text)
      const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      
      parsedResponse = JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error parsing AI response as JSON:', error);
      throw new Error('Failed to parse AI response as JSON');
    }
    
    // Validate the response using Zod
    try {
      const validatedResponse = AIAnalysisSchema.parse(parsedResponse);
      return validatedResponse;
    } catch (validationError) {
      console.error('Zod validation error:', validationError);
      throw new Error('AI response failed validation');
    }
  } catch (error) {
    console.error('Error in AI health analysis:', error);
    throw new Error('Failed to complete AI health analysis');
  }
} 