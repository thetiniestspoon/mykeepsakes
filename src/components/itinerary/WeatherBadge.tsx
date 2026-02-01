import { Cloud, CloudRain, Sun, CloudSun, Snowflake, CloudFog, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeatherBadgeProps {
  temp: number;
  tempHigh?: number;
  tempLow?: number;
  condition: string;
  className?: string;
}

// Map weather condition codes to icons
function getWeatherIcon(condition: string) {
  const lowerCondition = condition.toLowerCase();
  
  if (lowerCondition.includes('clear') || lowerCondition.includes('sunny')) {
    return Sun;
  }
  if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle') || lowerCondition.includes('shower')) {
    return CloudRain;
  }
  if (lowerCondition.includes('snow')) {
    return Snowflake;
  }
  if (lowerCondition.includes('fog') || lowerCondition.includes('mist')) {
    return CloudFog;
  }
  if (lowerCondition.includes('wind')) {
    return Wind;
  }
  if (lowerCondition.includes('partly') || lowerCondition.includes('scattered')) {
    return CloudSun;
  }
  if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
    return Cloud;
  }
  
  return Sun; // Default
}

// Get appropriate color based on temperature (Fahrenheit)
function getTempColor(temp: number): string {
  if (temp < 32) return 'text-blue-500';
  if (temp < 50) return 'text-cyan-500';
  if (temp < 65) return 'text-green-500';
  if (temp < 80) return 'text-amber-500';
  return 'text-orange-500';
}

export function WeatherBadge({ temp, tempHigh, tempLow, condition, className }: WeatherBadgeProps) {
  const Icon = getWeatherIcon(condition);
  const colorClass = getTempColor(tempHigh ?? temp);
  
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-full",
      className
    )}>
      <Icon className={cn("w-4 h-4", colorClass)} />
      {tempHigh !== undefined && tempLow !== undefined ? (
        <span className="text-xs font-medium">
          <span className={colorClass}>{Math.round(tempHigh)}°</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">{Math.round(tempLow)}°</span>
        </span>
      ) : (
        <span className={cn("text-xs font-medium", colorClass)}>
          {Math.round(temp)}°F
        </span>
      )}
    </div>
  );
}
