import { useState, useCallback } from 'react';
import { Loader2, Calendar, LayoutList, Clock } from 'lucide-react';
import { useDatabaseItinerary } from '@/hooks/use-database-itinerary';
import { DatabaseDayCard } from '@/components/itinerary/DatabaseDayCard';
import { TodayModeToggle } from '@/components/itinerary/TodayModeToggle';
import { QuickAddButton } from '@/components/itinerary/QuickAddButton';
import { TimelineView } from '@/components/itinerary/TimelineView';
import { useTodayMode } from '@/hooks/use-today-mode';
import { getTripMode } from '@/hooks/use-trip';
import { cn } from '@/lib/utils';

type ViewMode = 'cards' | 'timeline';

export function DatabaseItineraryTab() {
  const { days, trip, isLoading, isError } = useDatabaseItinerary();
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  
  const { 
    isTodayMode, 
    toggleTodayMode, 
    filteredDays, 
    nextPlannedActivity,
    isActiveTrip,
    hasTodayContent 
  } = useTodayMode(days);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !trip) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No trip itinerary found.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create a trip to get started!
        </p>
      </div>
    );
  }

  const mode = getTripMode(trip);
  
  // Format dates for display
  const startDate = new Date(trip.start_date + 'T00:00:00');
  const endDate = new Date(trip.end_date + 'T00:00:00');
  const dateRange = `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

  // Calculate overall progress
  const allActivities = days.flatMap(d => d.activities.filter(a => a.itemType === 'activity'));
  const completedCount = allActivities.filter(a => a.status === 'done').length;
  const totalCount = allActivities.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Show days to render based on today mode
  const daysToRender = filteredDays;

  return (
    <div className="space-y-4 pb-20">
      <div className="text-center py-4">
        <h2 className="font-display text-2xl text-foreground">{trip.title}</h2>
        <p className="text-muted-foreground">{dateRange}</p>
        
        {/* Overall progress */}
        {totalCount > 0 && (
          <div className="mt-3 max-w-xs mx-auto">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Overall Progress</span>
              <span>{completedCount}/{totalCount} activities ({progressPercent}%)</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Trip mode indicator */}
        <div className="mt-2">
          {mode === 'pre' && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              Upcoming Trip
            </span>
          )}
          {mode === 'active' && (
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
              Trip in Progress
            </span>
          )}
          {mode === 'post' && (
            <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
              Trip Complete
            </span>
          )}
        </div>
        
        {/* View mode controls */}
        <div className="mt-4 flex flex-col items-center gap-3">
          {/* Today Mode Toggle - only during active trips */}
          <TodayModeToggle 
            isTodayMode={isTodayMode} 
            onToggle={toggleTodayMode}
            isActiveTrip={isActiveTrip}
          />
          
          {/* View Mode Toggle (Cards vs Timeline) */}
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setViewMode('cards')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                viewMode === 'cards' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutList className="w-4 h-4" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                viewMode === 'timeline' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Clock className="w-4 h-4" />
              <span>Timeline</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* No content message for today mode */}
      {isTodayMode && !hasTodayContent && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No activities scheduled for today.</p>
          <button 
            onClick={toggleTodayMode}
            className="mt-2 text-sm text-primary hover:underline"
          >
            View full timeline
          </button>
        </div>
      )}
      
      {/* Day cards or timeline view */}
      {viewMode === 'cards' ? (
        daysToRender.map((day) => (
          <DatabaseDayCard 
            key={day.id} 
            day={day}
            nextActivityId={nextPlannedActivity?.activityId}
          />
        ))
      ) : (
        daysToRender.map((day) => (
          <div key={day.id} className="bg-card rounded-lg border p-4 shadow-warm">
            <h3 className="font-display text-lg mb-4">{day.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{day.dayOfWeek}, {day.date}</p>
            <TimelineView 
              day={day} 
              nextActivityId={nextPlannedActivity?.activityId}
            />
          </div>
        ))
      )}
      
      {/* Quick Add FAB */}
      <QuickAddButton />
    </div>
  );
}

export default DatabaseItineraryTab;
