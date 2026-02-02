import { useMemo } from 'react';
import { 
  Utensils,
  Waves,
  Home,
  Car,
  PartyPopper,
  Activity,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardSelectionOptional } from '@/contexts/DashboardSelectionContext';
import type { LegacyActivity } from '@/hooks/use-database-itinerary';

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  activity: Activity,
  dining: Utensils,
  beach: Waves,
  accommodation: Home,
  transport: Car,
  event: PartyPopper,
};

const categoryColors: Record<string, string> = {
  activity: 'bg-beach-ocean-light/50 border-beach-ocean-light',
  dining: 'bg-beach-sunset-coral/10 border-beach-sunset-coral/30',
  beach: 'bg-beach-seafoam/50 border-beach-seafoam',
  accommodation: 'bg-secondary/50 border-secondary',
  transport: 'bg-muted/50 border-muted',
  event: 'bg-beach-sunset-gold/10 border-beach-sunset-gold/30',
};

interface CompactActivityCardProps {
  activity: LegacyActivity;
  isNextActivity?: boolean;
  dayId: string;
}

/**
 * Compact activity card for the dashboard left column.
 * Single line display with time + title + status indicator.
 * Clicking selects the activity and syncs with center + map.
 */
export function CompactActivityCard({ activity, isNextActivity, dayId }: CompactActivityCardProps) {
  const dashboard = useDashboardSelectionOptional();
  
  const Icon = categoryIcons[activity.category] || Activity;
  const isCompleted = activity.status === 'done';
  const isSelected = dashboard?.selectedItem?.id === activity.id;
  
  // Convert LegacyActivity to ItineraryItem-like shape for the context
  const activityData = useMemo(() => ({
    id: activity.id,
    title: activity.title,
    description: activity.description,
    start_time: activity.rawStartTime || null,  // Use raw database time
    end_time: activity.rawEndTime || null,      // Use raw database end time
    category: activity.category,
    status: activity.status,
    location_id: activity.location?.id || null,
    location: activity.location ? {
      id: activity.location.id,
      name: activity.location.name,
      lat: activity.location.lat,
      lng: activity.location.lng,
      category: activity.location.category || activity.category,
      trip_id: '',
      address: activity.location.address || null,
      phone: null,
      url: null,
      notes: null,
      visited_at: null,
      created_at: '',
      updated_at: '',
    } : null,
    link: activity.link,
    link_label: activity.linkLabel,
    phone: activity.phone,
    notes: activity.notes,
    day_id: dayId,
    trip_id: '',
    item_type: activity.itemType,
    source: 'manual' as const,
    external_ref: null,
    sort_index: 0,
    completed_at: null,
    created_at: '',
    updated_at: '',
  }), [activity, dayId]);
  
  const handleClick = () => {
    if (!dashboard) return;
    
    // Select this activity
    dashboard.selectItem('activity', activity.id, activityData);
    
    // Pan map to location if available
    if (activity.location?.lat && activity.location?.lng) {
      dashboard.panMap(activity.location.lat, activity.location.lng);
    }
  };
  
  return (
    <button
      onClick={handleClick}
      data-activity-id={activity.id}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-all",
        "border hover:bg-accent/50",
        categoryColors[activity.category],
        isCompleted && "opacity-50",
        isSelected && "ring-2 ring-primary ring-offset-1 bg-accent",
        isNextActivity && !isSelected && "ring-1 ring-primary/50 bg-primary/5"
      )}
    >
      {/* Category icon */}
      <div className={cn(
        "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
        isCompleted ? "bg-green-100" : "bg-background/80"
      )}>
        {isCompleted ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
        ) : (
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </div>
      
      {/* Time + Title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {activity.time && (
            <span className="text-xs text-muted-foreground font-mono flex-shrink-0">
              {activity.time}
            </span>
          )}
          <span className={cn(
            "text-sm truncate",
            isCompleted && "line-through text-muted-foreground"
          )}>
            {activity.title}
          </span>
        </div>
      </div>
      
      {/* Location indicator */}
      {activity.location && (
        <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
      )}
    </button>
  );
}
