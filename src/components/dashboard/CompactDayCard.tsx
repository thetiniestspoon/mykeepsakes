import { useMemo } from 'react';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { ChevronDown, CheckCircle2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CompactActivityCard } from './CompactActivityCard';
import { WeatherBadge } from '@/components/itinerary/WeatherBadge';
import { useCollapsedSections, useToggleSection } from '@/hooks/use-trip-data';
import { useWeatherForDate } from '@/hooks/use-weather';
import type { LegacyDay } from '@/hooks/use-database-itinerary';

interface CompactDayCardProps {
  day: LegacyDay;
  nextActivityId?: string | null;
  isToday?: boolean;
}

/**
 * Compact day card for the dashboard left column.
 * Shows day header with weather and collapsible list of compact activity cards.
 */
export function CompactDayCard({ day, nextActivityId, isToday }: CompactDayCardProps) {
  const { data: collapsedSections } = useCollapsedSections();
  const toggleSection = useToggleSection();
  
  // Get weather for this day's date
  const dayDateStr = useMemo(() => {
    const date = new Date(day.date);
    return date.toISOString().split('T')[0];
  }, [day.date]);
  const weatherData = useWeatherForDate(dayDateStr);
  
  const isCollapsed = collapsedSections?.[day.id] ?? false;

  // Filter out markers for completion count
  const activityItems = day.activities.filter(a => a.itemType === 'activity');
  const completedCount = activityItems.filter(a => a.status === 'done').length;
  const totalCount = activityItems.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isDayComplete = totalCount > 0 && completedCount === totalCount;
  
  return (
    <Collapsible
      open={!isCollapsed}
      onOpenChange={(open) => toggleSection.mutate({ sectionId: day.id, isCollapsed: !open })}
    >
      <div className={cn(
        "rounded-lg border bg-card overflow-hidden",
        isToday && "ring-2 ring-primary"
      )}>
        <CollapsibleTrigger asChild>
          <button className="w-full px-3 py-2 flex items-center justify-between hover:bg-accent/30 transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className={cn(
                "w-4 h-4 flex-shrink-0",
                isToday ? "text-primary" : "text-muted-foreground"
              )} />
              <div className="text-left min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{day.title}</span>
                  {isToday && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full flex-shrink-0">
                      Today
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{day.dayOfWeek}</span>
                  {weatherData && (
                    <WeatherBadge
                      temp={weatherData.tempHigh}
                      tempHigh={weatherData.tempHigh}
                      tempLow={weatherData.tempLow}
                      condition={weatherData.condition}
                    />
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Compact progress */}
              <div className="flex items-center gap-1">
                {isDayComplete ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <span className="text-xs text-muted-foreground">{completedCount}/{totalCount}</span>
                )}
              </div>
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                !isCollapsed && "rotate-180"
              )} />
            </div>
          </button>
        </CollapsibleTrigger>
        
        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="h-0.5 bg-muted">
            <div 
              className={cn(
                "h-full transition-all duration-300",
                isDayComplete ? "bg-green-500" : "bg-primary"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
        
        <CollapsibleContent>
          <div className="p-2 space-y-1">
            {day.activities.map((activity) => (
              <CompactActivityCard
                key={activity.id}
                activity={activity}
                dayId={day.id}
                isNextActivity={activity.id === nextActivityId}
              />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
