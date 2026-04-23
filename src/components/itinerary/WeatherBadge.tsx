import { Cloud, CloudRain, Sun, CloudSun, Snowflake, CloudFog, Wind } from 'lucide-react';
import '@/preview/collage/collage.css';

interface WeatherBadgeProps {
  temp: number;
  tempHigh?: number;
  tempLow?: number;
  condition: string;
  className?: string;
}

/**
 * WeatherBadge — migrated to Collage direction (Phase 4 #2 support).
 * Small sticker pill with weather icon in ink + Caveat condition text for
 * warmth. Temp legibility in IBM Plex Serif, small caps numerals. Respects
 * prefers-reduced-motion via instant render (no animation in this primitive).
 * Logic unchanged; pure presentation swap.
 */
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

// Caveat word for the condition, script-accented.
function conditionWord(condition: string): string {
  const lc = condition.toLowerCase();
  if (lc.includes('drizzle')) return 'drizzle';
  if (lc.includes('shower')) return 'showers';
  if (lc.includes('rain')) return 'rain';
  if (lc.includes('snow')) return 'snow';
  if (lc.includes('clear') || lc.includes('sunny')) return 'sunny';
  if (lc.includes('partly')) return 'partly sun';
  if (lc.includes('scattered')) return 'scattered';
  if (lc.includes('overcast')) return 'overcast';
  if (lc.includes('cloud')) return 'clouds';
  if (lc.includes('fog') || lc.includes('mist')) return 'fog';
  if (lc.includes('wind')) return 'windy';
  return condition.toLowerCase();
}

export function WeatherBadge({ temp, tempHigh, tempLow, condition, className }: WeatherBadgeProps) {
  const Icon = getWeatherIcon(condition);
  const word = conditionWord(condition);

  return (
    <span
      className={`collage-root ${className ?? ''}`}
      role="img"
      aria-label={`Weather: ${condition}, ${tempHigh !== undefined && tempLow !== undefined ? `high ${Math.round(tempHigh)} low ${Math.round(tempLow)}` : `${Math.round(temp)} degrees Fahrenheit`}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        background: 'var(--c-paper)',
        border: '1px solid var(--c-line)',
        borderRadius: 'var(--c-r-sm)',
        boxShadow: 'var(--c-shadow-sm)',
        lineHeight: 1,
        verticalAlign: 'middle',
      }}
    >
      <Icon style={{ width: 14, height: 14, color: 'var(--c-ink)' }} aria-hidden />
      <span
        aria-hidden
        style={{
          fontFamily: 'var(--c-font-body)',
          fontSize: 11,
          fontWeight: 500,
          color: 'var(--c-ink)',
          letterSpacing: '.01em',
        }}
      >
        {tempHigh !== undefined && tempLow !== undefined ? (
          <>
            {Math.round(tempHigh)}
            <span style={{ color: 'var(--c-ink-muted)' }}>°/{Math.round(tempLow)}°</span>
          </>
        ) : (
          <>{Math.round(temp)}°F</>
        )}
      </span>
      <span
        aria-hidden
        style={{
          fontFamily: 'var(--c-font-script)',
          fontWeight: 600,
          fontSize: 14,
          color: 'var(--c-pen)',
          lineHeight: 1,
          marginLeft: 2,
        }}
      >
        {word}
      </span>
    </span>
  );
}
