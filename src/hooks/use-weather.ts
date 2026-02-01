import { useQuery } from '@tanstack/react-query';
import { useActiveTrip } from '@/hooks/use-trip';

interface WeatherData {
  date: string;
  tempHigh: number;
  tempLow: number;
  condition: string;
  icon: string;
}

interface ForecastDay {
  dt: number;
  main: {
    temp_min: number;
    temp_max: number;
    temp: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
}

// Edge function that wraps the OpenWeatherMap API
// This will be created as a Supabase edge function
async function fetchWeatherFromEdge(lat: number, lng: number): Promise<WeatherData[]> {
  // For now, return mock data until the edge function and API key are set up
  // The edge function will be at /functions/v1/get-weather
  
  const today = new Date();
  const mockData: WeatherData[] = [];
  
  // Generate 5 days of mock weather
  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    const conditions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Rain', 'Sunny'];
    const baseTemp = 70 + Math.random() * 20;
    
    mockData.push({
      date: date.toISOString().split('T')[0],
      tempHigh: Math.round(baseTemp + 5),
      tempLow: Math.round(baseTemp - 10),
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      icon: '01d'
    });
  }
  
  return mockData;
}

export function useWeather() {
  const { data: trip } = useActiveTrip();
  
  // For now, use a default location (Cape Cod) 
  // In production, this would use the trip's location coordinates
  const lat = 41.6688;
  const lng = -70.2962;
  
  return useQuery({
    queryKey: ['weather', lat, lng],
    queryFn: () => fetchWeatherFromEdge(lat, lng),
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
    enabled: !!trip,
    // Return empty array instead of throwing on error
    placeholderData: []
  });
}

// Get weather for a specific date
export function useWeatherForDate(dateStr: string) {
  const { data: weatherData = [] } = useWeather();
  
  return weatherData.find(w => w.date === dateStr) || null;
}
