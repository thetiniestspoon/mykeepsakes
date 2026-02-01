import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { LegacyActivity } from '@/hooks/use-database-itinerary';

interface NowIndicatorProps {
  activities: LegacyActivity[];
}

export function NowIndicator({ activities }: NowIndicatorProps) {
  const position = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Calculate current time as hours from 6 AM
    const startHour = 6;
    const endHour = 23;
    const hoursFromStart = currentHour - startHour + currentMinute / 60;
    const totalHours = endHour - startHour;
    
    // Return percentage position
    const percentage = (hoursFromStart / totalHours) * 100;
    return Math.max(0, Math.min(100, percentage));
  }, []);
  
  const timeLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }, []);
  
  return (
    <div 
      className="absolute left-0 right-0 flex items-center z-10"
      style={{ top: `${position}%` }}
    >
      <div className="flex items-center gap-2 -ml-1">
        <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg" />
        <span className="text-xs font-bold text-red-500 bg-background px-1">
          NOW
        </span>
      </div>
      <div className="flex-1 h-0.5 bg-red-500" />
    </div>
  );
}
