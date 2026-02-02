import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { useDashboardSelection } from '@/contexts/DashboardSelectionContext';
import { OverviewMap } from '@/components/map/OverviewMap';
import { MapFilterHeader } from './MapFilterHeader';
import { useDatabaseLocations, useDatabaseItinerary } from '@/hooks/use-database-itinerary';
import { useLocations } from '@/hooks/use-locations';
import { useMemories } from '@/hooks/use-memories';
import { useActiveTrip } from '@/hooks/use-trip';
import { useFavorites } from '@/hooks/use-trip-data';
import { useLodgingOptions } from '@/hooks/use-lodging';
import { cn } from '@/lib/utils';
import type { MapLocation, PinState } from '@/types/map';
import { Button } from '@/components/ui/button';
import { MapPin, X } from 'lucide-react';
import L from 'leaflet';

// Local storage key for filter collapsed state
const FILTER_COLLAPSED_KEY = 'map-filter-collapsed';

interface RightColumnProps {
  className?: string;
}

/**
 * Right column containing the persistent Overview Map
 * with filter header and synchronized selection
 */
export function RightColumn({ className }: RightColumnProps) {
  const { days } = useDatabaseItinerary();
  const { locations: dbLocations } = useDatabaseLocations();
  const { data: trip } = useActiveTrip();
  const { data: fullLocations = [] } = useLocations(trip?.id);
  const { data: memories = [] } = useMemories(trip?.id);
  const { data: favorites = {} } = useFavorites();
  const { data: lodgingOptions = [] } = useLodgingOptions();
  
  const { 
    highlightedMapPins,
    highlightLabel,
    clearHighlightedPins,
    panToLocation,
    clearPanTarget,
    selectItem,
    scrollToItem,
    navigateToPanel,
    focusedLocation,
    clearLocationFocus
  } = useDashboardSelection();
  
  // Reference to the map container
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Reference to the Leaflet map instance for panning
  const leafletMapRef = useRef<L.Map | null>(null);

  // Filtered locations from the filter header
  const [filteredLocations, setFilteredLocations] = useState<MapLocation[]>();

  // Filter header collapsed state (persisted in localStorage)
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(() => {
    try {
      return localStorage.getItem(FILTER_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Toggle filter collapsed state
  const toggleFilterCollapsed = useCallback(() => {
    setIsFilterCollapsed(prev => {
      const newValue = !prev;
      try {
        localStorage.setItem(FILTER_COLLAPSED_KEY, String(newValue));
      } catch {
        // Ignore localStorage errors
      }
      return newValue;
    });
  }, []);

  // Calculate pin states for each location
  const getPinState = (locationId: string): PinState => {
    const hasMemory = memories.some(m => m.location_id === locationId);
    if (hasMemory) return 'has-memories';
    
    const isFavorited = favorites[locationId] ?? false;
    if (isFavorited) return 'favorited';
    
    const location = fullLocations.find(l => l.id === locationId);
    if (location?.visited_at) return 'visited';
    
    return 'planned';
  };

  // Build complete location list with lodging and pin states
  const allLocations = useMemo<MapLocation[]>(() => {
    const locations: MapLocation[] = dbLocations.map(loc => ({
      id: loc.id,
      lat: loc.lat,
      lng: loc.lng,
      name: loc.name,
      category: loc.category || 'activity',
      address: loc.address,
      dayId: loc.dayId,
      dayLabel: loc.dayLabel,
      pinState: getPinState(loc.id),
      isVisited: !!fullLocations.find(l => l.id === loc.id)?.visited_at,
      isFavorited: favorites[loc.id] ?? false,
      hasMemories: memories.some(m => m.location_id === loc.id),
    }));
    
    // Add lodging options from database
    lodgingOptions.forEach(lodging => {
      if (lodging.location_lat && lodging.location_lng) {
        locations.push({
          id: lodging.id,
          lat: lodging.location_lat,
          lng: lodging.location_lng,
          name: lodging.name,
          category: 'lodging',
          address: lodging.address || undefined,
          pinState: 'planned',
        });
      }
    });
    
    return locations;
  }, [dbLocations, lodgingOptions, fullLocations, memories, favorites]);

  // Get raw days from useDatabaseLocations for ISO date format (needed for MapFilterHeader parsing)
  const { days: rawDays } = useDatabaseLocations();

  // Days data for the filter header - use rawDays for ISO dates
  const filterDays = useMemo(() => {
    return rawDays.map(day => ({
      id: day.id,
      date: day.date,  // ISO format: "2026-07-25"
      title: day.title,
    }));
  }, [rawDays]);

  // Handle filtered locations from the filter header
  const handleFilteredLocationsChange = useCallback((locations: MapLocation[]) => {
    setFilteredLocations(locations);
  }, []);

  // Handle map ready callback
  const handleMapReady = useCallback((map: L.Map) => {
    leafletMapRef.current = map;
  }, []);

  // Handle map panning when panToLocation changes
  useEffect(() => {
    if (panToLocation && leafletMapRef.current) {
      leafletMapRef.current.flyTo(
        [panToLocation.lat, panToLocation.lng], 
        15, 
        { duration: 0.5 }
      );
      clearPanTarget();
    }
  }, [panToLocation, clearPanTarget]);

  // Track if we have a pending pan to skip auto-fit
  const hasPendingPan = panToLocation !== null;

  // Handle map marker clicks - navigate to Details panel
  const handleMarkerClick = (location: MapLocation) => {
    selectItem('location', location.id, location);
    
    // Find activities linked to this location and scroll to first one
    for (const day of days) {
      const linkedActivity = day.activities.find(a => 
        a.location?.name === location.name
      );
      if (linkedActivity) {
        scrollToItem(linkedActivity.id);
        break;
      }
    }
    
    // Navigate to Details panel (index 1)
    navigateToPanel(1);
  };

  return (
    <div ref={mapContainerRef} className={cn("flex flex-col h-full relative", className)}>
      {/* Filter Header - either floating button or full panel */}
      <MapFilterHeader
        locations={allLocations}
        days={filterDays}
        onFilteredLocationsChange={handleFilteredLocationsChange}
        focusedLocation={focusedLocation}
        onFocusConsumed={clearLocationFocus}
        isCollapsed={isFilterCollapsed}
        onToggleCollapse={toggleFilterCollapsed}
      />

      {/* Highlight banner - shown when pins are highlighted with a label */}
      {highlightedMapPins.length > 0 && highlightLabel && !isFilterCollapsed && (
        <div className="flex items-center justify-between px-3 py-2 bg-primary/10 border-b border-primary/20">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="font-medium text-primary">
              {highlightLabel}
              {highlightedMapPins.length > 1 && ` (${highlightedMapPins.length} locations)`}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearHighlightedPins}
            className="h-6 px-2 text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Show All
          </Button>
        </div>
      )}

      {/* Map Container - takes remaining space */}
      <div className="flex-1 min-h-0">
        <OverviewMap
          locations={filteredLocations || []}
          onMarkerClick={handleMarkerClick}
          highlightedPinIds={highlightedMapPins}
          onMapReady={handleMapReady}
          skipBoundsFit={hasPendingPan}
          className="h-full"
        />
      </div>
    </div>
  );
}
