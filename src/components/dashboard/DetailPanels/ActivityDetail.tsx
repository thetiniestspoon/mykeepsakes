import { Clock, MapPin, Phone, Link, StickyNote, Check, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ItineraryItem } from '@/types/trip';
import { useDashboardSelection } from '@/contexts/DashboardSelectionContext';
import { cn } from '@/lib/utils';

interface ActivityDetailProps {
  activity: ItineraryItem | null;
}

/**
 * Detailed view of a single activity for the center column
 */
export function ActivityDetail({ activity }: ActivityDetailProps) {
  const { panMap } = useDashboardSelection();

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
      panMap(activity.location.lat, activity.location.lng);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-xl font-semibold text-foreground">{activity.title}</h2>
          <Badge variant={activity.status === 'done' ? 'default' : 'secondary'}>
            {activity.status === 'done' ? 'Completed' : 'Planned'}
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
        <Button className="flex-1" variant={activity.status === 'done' ? 'outline' : 'default'}>
          <Check className="w-4 h-4 mr-2" />
          {activity.status === 'done' ? 'Undo Complete' : 'Mark Complete'}
        </Button>
        <Button variant="outline" className="flex-1">
          <Camera className="w-4 h-4 mr-2" />
          Add Memory
        </Button>
      </div>
    </div>
  );
}
