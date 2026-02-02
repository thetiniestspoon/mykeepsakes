import { useState } from 'react';
import { Clock, MapPin, Phone, Link, StickyNote, Check, Camera, Undo2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ItineraryItem } from '@/types/trip';
import { useDashboardSelection } from '@/contexts/DashboardSelectionContext';
import { useUpdateItemStatus } from '@/hooks/use-database-itinerary';
import { MemoryCaptureDialog } from '@/components/album/MemoryCaptureDialog';
import { useTripDays } from '@/hooks/use-trip';
import { useActiveTrip } from '@/hooks/use-trip';
import { useLocations } from '@/hooks/use-locations';
import { cn } from '@/lib/utils';

interface ActivityDetailProps {
  activity: ItineraryItem | null;
}

/**
 * Detailed view of a single activity for the center column
 */
export function ActivityDetail({ activity }: ActivityDetailProps) {
  const { panMap, highlightPin, navigateToPanel, focusLocation } = useDashboardSelection();
  const { data: trip } = useActiveTrip();
  const { data: days } = useTripDays(trip?.id);
  const { data: locations } = useLocations(trip?.id);
  const updateStatus = useUpdateItemStatus();
  const [memoryDialogOpen, setMemoryDialogOpen] = useState(false);

  if (!activity) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Select an activity to see details</p>
      </div>
    );
  }

  const formatTime = (time: string | null) => {
    if (!time) return null;
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleShowOnMap = () => {
    if (activity.location?.lat && activity.location?.lng) {
      // Set map filters to show this location's category and day
      if (activity.location_id) {
        focusLocation({
          id: activity.location_id,
          category: activity.category,
          dayId: activity.day_id,
        });
        highlightPin(activity.location_id);
      }
      panMap(activity.location.lat, activity.location.lng);
      // Navigate to Map panel (index 2)
      navigateToPanel(2);
    }
  };

  const handleToggleComplete = () => {
    const newStatus = activity.status === 'done' ? 'planned' : 'done';
    updateStatus.mutate({ itemId: activity.id, status: newStatus });
  };

  const handleAddMemory = () => {
    setMemoryDialogOpen(true);
  };

  const isCompleted = activity.status === 'done';

  // Convert days data to format needed by MemoryCaptureDialog
  const legacyDays = days?.map((day, index) => ({
    id: day.id,
    date: day.date,
    dayOfWeek: new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }),
    title: day.title || `Day ${index + 1}`,
    activities: [],
  })) || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <h2 className={cn(
            "text-xl font-semibold text-foreground",
            isCompleted && "line-through text-muted-foreground"
          )}>
            {activity.title}
          </h2>
          <Badge variant={isCompleted ? 'default' : 'secondary'} className={cn(
            isCompleted && "bg-green-600"
          )}>
            {isCompleted ? 'Completed' : 'Planned'}
          </Badge>
        </div>
        
        {activity.start_time && (
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <Clock className="w-4 h-4" />
            {formatTime(activity.start_time)}
            {activity.end_time && ` - ${formatTime(activity.end_time)}`}
          </p>
        )}
      </div>

      {/* Description */}
      {activity.description && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-foreground">{activity.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Location */}
      {activity.location && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="font-medium">{activity.location.name}</p>
            {activity.location.address && (
              <p className="text-sm text-muted-foreground">{activity.location.address}</p>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={handleShowOnMap}
            >
              Show on Map
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Contact Info */}
      {activity.phone && (
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <a href={`tel:${activity.phone}`} className="text-sm hover:underline">
              {activity.phone}
            </a>
          </CardContent>
        </Card>
      )}

      {/* Link */}
      {activity.link && (
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Link className="w-4 h-4 text-muted-foreground" />
            <a 
              href={activity.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline truncate"
            >
              {activity.link_label || activity.link}
            </a>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {activity.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <StickyNote className="w-4 h-4" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {activity.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          className="flex-1" 
          variant={isCompleted ? 'outline' : 'default'}
          onClick={handleToggleComplete}
          disabled={updateStatus.isPending}
        >
          {isCompleted ? (
            <>
              <Undo2 className="w-4 h-4 mr-2" />
              Undo Complete
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Mark Complete
            </>
          )}
        </Button>
        <Button variant="outline" className="flex-1" onClick={handleAddMemory}>
          <Camera className="w-4 h-4 mr-2" />
          Add Memory
        </Button>
      </div>

      {/* Memory Capture Dialog */}
      <MemoryCaptureDialog
        open={memoryDialogOpen}
        onOpenChange={setMemoryDialogOpen}
        tripId={trip?.id}
        days={legacyDays}
        locations={locations || []}
        preselectedDayId={activity.day_id}
        preselectedLocationId={activity.location_id || undefined}
      />
    </div>
  );
}
