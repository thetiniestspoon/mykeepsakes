import { Loader2, Calendar } from 'lucide-react';
import { useDatabaseItinerary } from '@/hooks/use-database-itinerary';
import { DatabaseDayCard } from '@/components/itinerary/DatabaseDayCard';
import { getTripMode } from '@/hooks/use-trip';

export function DatabaseItineraryTab() {
  const { days, trip, isLoading, isError } = useDatabaseItinerary();

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
      </div>
      
      {days.map((day) => (
        <DatabaseDayCard key={day.id} day={day} />
      ))}
    </div>
  );
}

export default DatabaseItineraryTab;
