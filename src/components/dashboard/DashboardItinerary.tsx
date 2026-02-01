import { useMemo, useEffect, useRef, useCallback } from 'react';
import { Loader2, Calendar } from 'lucide-react';
import { useDatabaseItinerary } from '@/hooks/use-database-itinerary';
import { useTodayMode } from '@/hooks/use-today-mode';
import { useDashboardSelectionOptional } from '@/contexts/DashboardSelectionContext';
import { CompactDayCard } from './CompactDayCard';
import { ScrollArea } from '@/components/ui/scroll-area';

/**
 * Compact itinerary view for the dashboard left column.
 * Shows all days with compact activity cards that sync with the selection context.
 */
export function DashboardItinerary() {
  const { days, trip, isLoading, isError } = useDatabaseItinerary();
  const dashboard = useDashboardSelectionOptional();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const { 
    filteredDays, 
    nextPlannedActivity,
  } = useTodayMode(days);
  
  // Determine which day is today
  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);
  
  // Register scroll handler with the dashboard context
  const scrollToItem = useCallback((itemId: string) => {
    if (!scrollContainerRef.current) return;
    
    const element = scrollContainerRef.current.querySelector(`[data-activity-id="${itemId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);
  
  useEffect(() => {
    if (!dashboard) return;
    return dashboard.registerScrollHandler(scrollToItem);
  }, [dashboard, scrollToItem]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !trip) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No itinerary found.</p>
      </div>
    );
  }
  
  return (
    <div ref={scrollContainerRef} className="space-y-2 p-2">
      {filteredDays.map((day) => {
        // Check if this day is today
        const dayDate = new Date(day.date).toISOString().split('T')[0];
        const isToday = dayDate === todayStr;
        
        return (
          <CompactDayCard
            key={day.id}
            day={day}
            nextActivityId={nextPlannedActivity?.activityId}
            isToday={isToday}
          />
        );
      })}
    </div>
  );
}
