import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { useDashboardSelection } from '@/contexts/DashboardSelectionContext';
import { OverviewMap } from '@/components/map/OverviewMap';
import { MapFilterHeader } from './MapFilterHeader';
import { useDatabaseLocations, useDatabaseItinerary } from '@/hooks/use-database-itinerary';
import { useLocations } from '@/hooks/use-locations';
import { useMemories } from '@/hooks/use-memories';
import { useActiveTrip } from '@/hooks/use-trip';
import { useFavorites } from '@/hooks/use-trip-data';
import { useAccommodations } from '@/hooks/use-accommodations';
import { cn } from '@/lib/utils';
import type { MapLocation, PinState } from '@/types/map';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, X, Filter } from 'lucide-react';
import L from 'leaflet';

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
  const { data: accommodations = [] } = useAccommodations();
  
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

  // Filter collapsed state with localStorage persistence
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(() => {
    try {
      return localStorage.getItem(FILTER_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

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
    
    // Add accommodations from database
    accommodations.forEach(accommodation => {
      if (accommodation.location_lat && accommodation.location_lng) {
        locations.push({
          id: accommodation.id,
          lat: accommodation.location_lat,
          lng: accommodation.location_lng,
          name: accommodation.title,
          category: 'lodging',
          address: accommodation.address || undefined,
          pinState: 'planned',
        });
      }
    });
    
    return locations;
  }, [dbLocations, accommodations, fullLocations, memories, favorites]);

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

  // Handle map marker clicks - navigate to Details panel with full activity data
  const handleMarkerClick = (location: MapLocation) => {
    // Find activity linked to this location
    let foundActivity: typeof days[0]['activities'][0] | null = null;
    let foundDayId: string | null = null;
    
    for (const day of days) {
      const linkedActivity = day.activities.find(a => 
        a.location?.id === location.id
      );
      if (linkedActivity) {
        foundActivity = linkedActivity;
        foundDayId = day.id;
        scrollToItem(linkedActivity.id);
        break;
      }
    }
    
    if (foundActivity && foundDayId) {
      // Build ItineraryItem-shaped data for ActivityDetail
      const activityData = {
        id: foundActivity.id,
        title: foundActivity.title,
        description: foundActivity.description,
        start_time: foundActivity.rawStartTime || null,
        end_time: foundActivity.rawEndTime || null,
        category: foundActivity.category,
        status: foundActivity.status,
        location_id: foundActivity.location?.id || null,
        location: foundActivity.location ? {
          id: foundActivity.location.id,
          name: foundActivity.location.name,
          lat: foundActivity.location.lat,
          lng: foundActivity.location.lng,
          category: foundActivity.location.category || foundActivity.category,
          trip_id: trip?.id || '',
          address: foundActivity.location.address || null,
          phone: null,
          url: null,
          notes: null,
          visited_at: null,
          created_at: '',
          updated_at: '',
        } : null,
        link: foundActivity.link,
        link_label: foundActivity.linkLabel,
        phone: foundActivity.phone,
        notes: foundActivity.notes,
        day_id: foundDayId,
        trip_id: trip?.id || '',
        item_type: foundActivity.itemType,
        source: 'manual' as const,
        external_ref: null,
        sort_index: 0,
        completed_at: foundActivity.completedAt || null,
        created_at: '',
        updated_at: '',
      };
      
      selectItem('activity', foundActivity.id, activityData);
    } else {
      // Fallback for locations without activities (e.g., lodging)
      selectItem('location', location.id, location);
    }
    
    // Navigate to Details panel (index 1)
    navigateToPanel(1);
  };

  // Calculate active filter count for the collapsed button badge
  const activeFilterCount = filteredLocations ? allLocations.length - filteredLocations.length : 0;
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div ref={mapContainerRef} className={cn("flex flex-col h-full relative", className)}>
      {/* Collapsed filter button - floats over map */}
      {isFilterCollapsed && (
        <div className="absolute top-3 right-3 z-[1001]">
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleFilterCollapsed}
            className="shadow-md gap-1.5"
          >
            <Filter className="w-4 h-4" />
            <span className="text-xs font-medium">Filters</span>
            {hasActiveFilters && (
              <Badge variant="default" className="h-5 px-1.5 text-xs ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>
      )}
      
      {/* Filter Header - only renders when expanded */}
      {!isFilterCollapsed && (
        <MapFilterHeader
          locations={allLocations}
          days={filterDays}
          onFilteredLocationsChange={handleFilteredLocationsChange}
          focusedLocation={focusedLocation}
          onFocusConsumed={clearLocationFocus}
          onToggleCollapse={toggleFilterCollapsed}
        />
      )}
      
      {/* Highlight banner - shown when pins are highlighted with a label (and not collapsed) */}
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
