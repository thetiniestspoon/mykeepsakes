import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { TimelineItem } from './TimelineItem';
import { NowIndicator } from './NowIndicator';
import type { LegacyDay, LegacyActivity } from '@/hooks/use-database-itinerary';
import { getTripMode, useActiveTrip } from '@/hooks/use-trip';

interface TimelineViewProps {
  day: LegacyDay;
  nextActivityId?: string | null;
  onActivityClick?: (activity: LegacyActivity) => void;
}

// Parse time string like "10:00 AM" to minutes from midnight
function parseTimeToMinutes(timeStr: string): number | null {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  return hours * 60 + minutes;
}

// Generate hour labels from 6 AM to 11 PM
const HOUR_LABELS = Array.from({ length: 18 }, (_, i) => {
  const hour = i + 6;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return { hour, label: `${displayHour} ${period}` };
});

export function TimelineView({ day, nextActivityId, onActivityClick }: TimelineViewProps) {
  const { data: trip } = useActiveTrip();
  const mode = trip ? getTripMode(trip) : 'pre';
  const showNowIndicator = mode === 'active';
  
  // Separate activities with and without times
  const { timedActivities, untimedActivities } = useMemo(() => {
    const timed: Array<{ activity: typeof day.activities[0]; minutes: number }> = [];
    const untimed: typeof day.activities = [];
    
    day.activities.forEach(activity => {
      if (activity.itemType === 'marker') return; // Skip markers in timeline view
      
      if (activity.time) {
        const minutes = parseTimeToMinutes(activity.time);
        if (minutes !== null) {
          timed.push({ activity, minutes });
        } else {
          untimed.push(activity);
        }
      } else {
        untimed.push(activity);
      }
    });
    
    // Sort timed activities by time
    timed.sort((a, b) => a.minutes - b.minutes);
    
    return { timedActivities: timed, untimedActivities: untimed };
  }, [day.activities]);
  
  return (
    <div className="space-y-4">
      {/* Untimed activities section */}
      {untimedActivities.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Anytime
          </h4>
          <div className="space-y-2">
            {untimedActivities.map(activity => (
              <TimelineItem
                key={activity.id}
                activity={activity}
                isNext={activity.id === nextActivityId}
                onClick={() => onActivityClick?.(activity)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Timed activities timeline */}
      {timedActivities.length > 0 && (
        <div className="relative">
          {/* Hour markers */}
          <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col">
            {HOUR_LABELS.filter((_, i) => i % 2 === 0).map(({ hour, label }) => (
              <div 
                key={hour}
                className="flex-1 flex items-start"
              >
                <span className="text-xs text-muted-foreground -translate-y-1/2">
                  {label}
                </span>
              </div>
            ))}
          </div>
          
          {/* Timeline track */}
          <div className="ml-16 border-l-2 border-muted relative min-h-[400px] pl-4 space-y-3">
            {showNowIndicator && <NowIndicator activities={day.activities} />}
            
            {timedActivities.map(({ activity }) => (
              <TimelineItem
                key={activity.id}
                activity={activity}
                isNext={activity.id === nextActivityId}
                onClick={() => onActivityClick?.(activity)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {timedActivities.length === 0 && untimedActivities.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No activities scheduled for this day
        </div>
      )}
    </div>
  );
}
