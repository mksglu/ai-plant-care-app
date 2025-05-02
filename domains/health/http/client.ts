const OPEN_METEO_API_URL = process.env.OPEN_METEO_API_URL || 'https://historical-forecast-api.open-meteo.com/v1/forecast';

// Types based on the Open-Meteo API response
export type WeatherData = {
  latitude: number;
  longitude: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  daily: {
    time: string[];
    precipitation_sum: number[];
    relative_humidity_2m_mean: number[];
  };
};

type OpenMeteoParams = {
  latitude: number;
  longitude: number;
  start_date: string;
  end_date: string;
  daily: string[];
  timezone?: string;
};

/**
 * Fetch historical weather data from Open-Meteo API
 */
export async function fetchHistoricalWeather(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string
): Promise<WeatherData> {
  try {
    // Log request parameters for debugging
    console.log('Fetching historical weather data:', {
      latitude,
      longitude,
      startDate,
      endDate,
    });

    // Construct the API parameters
    const params: OpenMeteoParams = {
      latitude,
      longitude,
      start_date: startDate,
      end_date: endDate,
      daily: [
        'precipitation_sum',
        'relative_humidity_2m_mean'
      ],
    };

    // Build URL with query parameters
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        queryParams.append(key, value.join(','));
      } else {
        queryParams.append(key, String(value));
      }
    });

    const url = `${OPEN_METEO_API_URL}?${queryParams.toString()}`;
    
    // Make the API request
    const response = await fetch(url);
    
    // Check for HTTP errors
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Open-Meteo API error: ${response.status} - ${errorText}`);
    }
    
    // Parse the JSON response
    const data = await response.json();
    
    // Log the response for debugging
    console.log('Open-Meteo API response:', JSON.stringify(data, null, 2));
    
    return data as WeatherData;
  } catch (error) {
    console.error('Error fetching weather data from Open-Meteo:', error);
    throw new Error('Failed to fetch historical weather data');
  }
} 