import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Map, Waves, Utensils, Activity, Home, Car, PartyPopper, MapPin, Building, Layers, Loader2, Check, Star, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MapModal } from '@/components/map/MapModal';
import { OverviewMap } from '@/components/map/OverviewMap';
import { LocationBottomSheet } from '@/components/map/LocationBottomSheet';
import { StaggeredList } from '@/components/ui/staggered-list';
import { useDatabaseLocations } from '@/hooks/use-database-itinerary';
import { useLocations } from '@/hooks/use-locations';
import { useMemories } from '@/hooks/use-memories';
import { useActiveTrip } from '@/hooks/use-trip';
import { useFavorites } from '@/hooks/use-trip-data';
import { useAccommodations } from '@/hooks/use-accommodations';
import type { MapLocation, PinState } from '@/types/map';
import type { Location } from '@/types/trip';

type CategoryFilter = 'all' | 'beach' | 'dining' | 'activity' | 'accommodation' | 'transport' | 'event' | 'lodging';

const categoryConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; mapColor: string }> = {
  beach: { label: 'Beaches', icon: Waves, color: 'bg-beach-seafoam text-beach-ocean-deep', mapColor: '#47D3CB' },
  dining: { label: 'Dining', icon: Utensils, color: 'bg-beach-sunset-coral/20 text-beach-sunset-coral', mapColor: '#FF8366' },
  restaurant: { label: 'Restaurants', icon: Utensils, color: 'bg-beach-sunset-coral/20 text-beach-sunset-coral', mapColor: '#FF8366' },
  activity: { label: 'Activities', icon: Activity, color: 'bg-beach-ocean-light text-beach-ocean-deep', mapColor: '#3B82F6' },
  accommodation: { label: 'Stay', icon: Home, color: 'bg-secondary text-secondary-foreground', mapColor: '#A855F7' },
  transport: { label: 'Transport', icon: Car, color: 'bg-muted text-muted-foreground', mapColor: '#6B7280' },
  event: { label: 'Events', icon: PartyPopper, color: 'bg-beach-sunset-gold/20 text-beach-sunset-gold', mapColor: '#F59E0B' },
  lodging: { label: 'Lodging', icon: Building, color: 'bg-pink-100 text-pink-600', mapColor: '#EC4899' },
};

interface SelectedLocation {
  lat: number;
  lng: number;
  name: string;
  address?: string;
}

export function DatabaseMapTab() {
  const [activeCategories, setActiveCategories] = useState<Set<CategoryFilter>>(new Set(['all']));
  const [activeDays, setActiveDays] = useState<Set<string>>(new Set(['all']));
  const [showOverview, setShowOverview] = useState(true);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedMapLocation, setSelectedMapLocation] = useState<{ lat: number; lng: number; name: string; address?: string } | null>(null);
  
  const { data: trip } = useActiveTrip();
  const { locations: dbLocations, isLoading, days } = useDatabaseLocations();
  const { data: fullLocations = [] } = useLocations(trip?.id);
  const { data: memories = [] } = useMemories(trip?.id);
  const { data: favorites = {} } = useFavorites();
  const { data: accommodations = [] } = useAccommodations();
  
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
  const allLocations = useMemo(() => {
    const locations: MapLocation[] = dbLocations.map(loc => ({
      ...loc,
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
  
  // Filter locations
  const filteredLocations = useMemo(() => {
    let filtered = allLocations;
    
    // Filter by category
    if (!activeCategories.has('all')) {
      filtered = filtered.filter(loc => {
        if (activeCategories.has('dining') && (loc.category === 'dining' || loc.category === 'restaurant')) {
          return true;
        }
        return activeCategories.has(loc.category as CategoryFilter);
      });
    }
    
    // Filter by day - when specific days are selected, only show locations with matching dayId
    if (!activeDays.has('all')) {
      filtered = filtered.filter(loc => {
        // Exclude items without a dayId (guide items, lodging) when filtering by specific days
        if (!loc.dayId) return false;
        return activeDays.has(loc.dayId);
      });
    }
    
    // Deduplicate by name (same location might appear multiple times)
    const seen = new Set<string>();
    return filtered.filter(loc => {
      const key = `${loc.name}-${loc.lat}-${loc.lng}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [allLocations, activeCategories, activeDays]);
  
  const toggleCategory = (cat: CategoryFilter) => {
    setActiveCategories(prev => {
      const next = new Set(prev);
      if (cat === 'all') {
        return new Set(['all']);
      }
      next.delete('all');
      if (next.has(cat)) {
        next.delete(cat);
        if (next.size === 0) next.add('all');
      } else {
        next.add(cat);
      }
      return next;
    });
  };
  
  const toggleDay = (dayId: string) => {
    setActiveDays(prev => {
      const next = new Set(prev);
      if (dayId === 'all') {
        return new Set(['all']);
      }
      next.delete('all');
      if (next.has(dayId)) {
        next.delete(dayId);
        if (next.size === 0) next.add('all');
      } else {
        next.add(dayId);
      }
      return next;
    });
  };
  
  const handleMarkerClick = (mapLocation: MapLocation) => {
    // Find the full location from our database locations
    const fullLocation = fullLocations.find(l => l.id === mapLocation.id);
    
    if (fullLocation) {
      // Open bottom sheet for database locations
      setSelectedLocation(fullLocation);
      setBottomSheetOpen(true);
    } else {
      // Fall back to map modal for lodging/non-database locations
      setSelectedMapLocation({
        lat: mapLocation.lat,
        lng: mapLocation.lng,
        name: mapLocation.name,
        address: mapLocation.address,
      });
      setMapModalOpen(true);
    }
  };

  // Get unique categories that have locations
  const availableCategories = useMemo(() => {
    const cats = new Set(allLocations.map(l => l.category));
    // Merge dining and restaurant
    if (cats.has('restaurant')) cats.add('dining');
    cats.delete('restaurant');
    return cats;
  }, [allLocations]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4 pb-20">
      <div className="text-center py-4">
        <h2 className="font-display text-2xl text-foreground">Trip Map</h2>
        <p className="text-muted-foreground">All locations at a glance</p>
      </div>
      
      {/* Toggle for overview map */}
      <div className="px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-muted-foreground" />
          <Label htmlFor="overview-toggle" className="text-sm">Overview Map</Label>
        </div>
        <Switch 
          id="overview-toggle" 
          checked={showOverview} 
          onCheckedChange={setShowOverview}
        />
      </div>
      
      {/* Overview Map */}
      {showOverview && (
        <Card className="shadow-warm mx-4 overflow-hidden">
          <OverviewMap 
            locations={filteredLocations}
            onMarkerClick={handleMarkerClick}
            className="h-[300px] rounded-lg"
          />
        </Card>
      )}
      
      {/* Category filters */}
      <div className="px-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Categories</p>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            <Button
              size="sm"
              variant={activeCategories.has('all') ? 'default' : 'outline'}
              onClick={() => toggleCategory('all')}
              className="shrink-0"
            >
              <MapPin className="w-4 h-4 mr-1" />
              All
            </Button>
            {Object.entries(categoryConfig)
              .filter(([key]) => key !== 'restaurant' && availableCategories.has(key))
              .map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <Button
                    key={key}
                    size="sm"
                    variant={activeCategories.has(key as CategoryFilter) ? 'default' : 'outline'}
                    onClick={() => toggleCategory(key as CategoryFilter)}
                    className="shrink-0"
                  >
                    <Icon className="w-4 h-4 mr-1" />
                    {config.label}
                  </Button>
                );
              })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      
      {/* Day filters */}
      <div className="px-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Days</p>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            <Button
              size="sm"
              variant={activeDays.has('all') ? 'default' : 'outline'}
              onClick={() => toggleDay('all')}
              className="shrink-0"
            >
              All Days
            </Button>
            {days.map(day => {
              const dayOfWeek = new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
              return (
                <Button
                  key={day.id}
                  size="sm"
                  variant={activeDays.has(day.id) ? 'default' : 'outline'}
                  onClick={() => toggleDay(day.id)}
                  className="shrink-0"
                >
                  {dayOfWeek}
                </Button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      
      {/* Location count */}
      <div className="px-4">
        <Badge variant="secondary" className="text-sm">
          {filteredLocations.length} location{filteredLocations.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      
      {/* Location list */}
      <Card className="shadow-warm mx-4">
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Map className="w-4 h-4" />
            Locations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pt-0">
          {filteredLocations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No locations match the current filters.
            </p>
          ) : (
            <StaggeredList className="space-y-1" staggerDelay={40}>
              {filteredLocations.map((location) => {
                const config = categoryConfig[location.category] || categoryConfig.activity;
                const Icon = config.icon;
                
                return (
                  <button 
                    key={location.id}
                    onClick={() => handleMarkerClick(location)}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/30 transition-colors group w-full text-left"
                  >
                    <div 
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 relative",
                        location.pinState === 'visited' && "ring-2 ring-green-500",
                        location.pinState === 'favorited' && "ring-2 ring-amber-500",
                        location.pinState === 'has-memories' && "ring-2 ring-pink-500"
                      )}
                      style={{ backgroundColor: `${config.mapColor}20`, color: config.mapColor }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{location.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {location.dayLabel || config.label}
                      </p>
                    </div>
                    {/* State indicators */}
                    <div className="flex items-center gap-1 shrink-0">
                      {location.hasMemories && (
                        <Camera className="w-3.5 h-3.5 text-pink-500" />
                      )}
                      {location.isFavorited && (
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                      )}
                      {location.isVisited && (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      )}
                      <MapPin className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                    </div>
                  </button>
                );
              })}
            </StaggeredList>
          )}
        </CardContent>
      </Card>
      
      {/* Legend */}
      <Card className="shadow-warm mx-4 bg-muted/30">
        <CardContent className="py-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Map Legend</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(categoryConfig)
              .filter(([key]) => key !== 'restaurant' && availableCategories.has(key))
              .map(([key, config]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: config.mapColor }}
                  />
                  <span className="text-xs text-muted-foreground">{config.label}</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Map Modal for non-database locations */}
      {selectedMapLocation && (
        <MapModal
          key={`${selectedMapLocation.lat}-${selectedMapLocation.lng}`}
          open={mapModalOpen}
          onOpenChange={setMapModalOpen}
          lat={selectedMapLocation.lat}
          lng={selectedMapLocation.lng}
          name={selectedMapLocation.name}
          address={selectedMapLocation.address}
        />
      )}

      {/* Location Bottom Sheet */}
      <LocationBottomSheet
        location={selectedLocation}
        open={bottomSheetOpen}
        onOpenChange={setBottomSheetOpen}
        tripId={trip?.id}
        days={days}
        allLocations={fullLocations}
      />
    </div>
  );
}

export default DatabaseMapTab;
