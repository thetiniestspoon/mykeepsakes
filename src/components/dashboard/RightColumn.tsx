import { useMemo } from 'react';
import { useDashboardSelection } from '@/contexts/DashboardSelectionContext';
import { OverviewMap } from '@/components/map/OverviewMap';
import { useDatabaseLocations, useDatabaseItinerary } from '@/hooks/use-database-itinerary';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { MapLocation } from '@/types/map';

interface RightColumnProps {
  className?: string;
}

/**
 * Right column containing the persistent Overview Map
 * with filter chips and synchronized selection
 */
export function RightColumn({ className }: RightColumnProps) {
  const { days } = useDatabaseItinerary();
  const { locations } = useDatabaseLocations();
  const { 
    highlightedMapPin, 
    selectItem,
    scrollToItem 
  } = useDashboardSelection();

  // Convert locations to MapLocation format
  const mapLocations = useMemo<MapLocation[]>(() => {
    return locations.map(loc => ({
      id: loc.id,
      lat: loc.lat,
      lng: loc.lng,
      name: loc.name,
      category: loc.category || 'activity',
      address: loc.address,
      dayId: loc.dayId,
      dayLabel: loc.dayLabel,
    }));
  }, [locations]);

  // Handle map marker clicks
  const handleMarkerClick = (location: MapLocation) => {
    selectItem('location', location.id, location);
    
    // Find activities linked to this location and scroll to first one
    // Compare by name since activities have location objects without IDs
    for (const day of days) {
      const linkedActivity = day.activities.find(a => 
        a.location?.name === location.name
      );
      if (linkedActivity) {
        scrollToItem(linkedActivity.id);
        break;
      }
    }
  };

  // Day filter state
  // TODO: Implement day filtering with chips below map

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Map Container - takes most of the space */}
      <div className="flex-1 min-h-0">
        <OverviewMap
          locations={mapLocations}
          onMarkerClick={handleMarkerClick}
          className="h-full"
        />
      </div>
      
      {/* Filter Chips */}
      <div className="border-t border-border bg-card/80 backdrop-blur-sm p-2">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2">
            <FilterChip label="All" active />
            {days.slice(0, 7).map((day, index) => (
              <FilterChip 
                key={day.id}
                label={`Day ${index + 1}`}
                // TODO: Wire up day filtering
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}

interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <Badge
      variant={active ? "default" : "outline"}
      className={cn(
        "cursor-pointer transition-colors whitespace-nowrap",
        active 
          ? "bg-primary text-primary-foreground hover:bg-primary/90" 
          : "hover:bg-accent"
      )}
      onClick={onClick}
    >
      {label}
    </Badge>
  );
}
