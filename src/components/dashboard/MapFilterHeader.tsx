import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MapPin, Waves, Utensils, Activity, Home, Car, PartyPopper, Building, Filter, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MapLocation } from '@/types/map';

type CategoryFilter = 'all' | 'beach' | 'dining' | 'activity' | 'accommodation' | 'transport' | 'event' | 'lodging';

const categoryConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  beach: { label: 'Beaches', icon: Waves },
  dining: { label: 'Dining', icon: Utensils },
  restaurant: { label: 'Restaurants', icon: Utensils },
  activity: { label: 'Activities', icon: Activity },
  accommodation: { label: 'Stay', icon: Home },
  transport: { label: 'Transport', icon: Car },
  event: { label: 'Events', icon: PartyPopper },
  lodging: { label: 'Lodging', icon: Building },
};

interface Day {
  id: string;
  date: string;
  title?: string | null;
}

interface FocusedLocation {
  id: string;
  category?: string;
  dayId?: string;
}

interface MapFilterHeaderProps {
  locations: MapLocation[];
  days: Day[];
  onFilteredLocationsChange: (locations: MapLocation[]) => void;
  focusedLocation?: FocusedLocation | null;
  onFocusConsumed?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

/**
 * Scrollable filter header for the map with category and day filters
 * Supports collapsed state with a floating filter button
 */
export function MapFilterHeader({ 
  locations, 
  days, 
  onFilteredLocationsChange,
  focusedLocation,
  onFocusConsumed,
  isCollapsed = false,
  onToggleCollapse,
  className 
}: MapFilterHeaderProps) {
  const [activeCategories, setActiveCategories] = useState<Set<CategoryFilter>>(new Set(['all']));
  const [activeDays, setActiveDays] = useState<Set<string>>(new Set(['all']));

  // Get unique categories that have locations
  const availableCategories = useMemo(() => {
    const cats = new Set(locations.map(l => l.category));
    // Merge dining and restaurant
    if (cats.has('restaurant')) cats.add('dining');
    cats.delete('restaurant');
    return cats;
  }, [locations]);

  // Filter locations based on active filters
  const filteredLocations = useMemo(() => {
    let filtered = locations;
    
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
  }, [locations, activeCategories, activeDays]);

  // Track previous filtered IDs to prevent redundant callbacks
  const prevFilteredIdsRef = useRef<string>('');
  
  // Track if we just applied focus filters (for phased focus consumption)
  const justAppliedFocusRef = useRef(false);

  // Calculate if filters are active (not 'all')
  const hasActiveFilters = !activeCategories.has('all') || !activeDays.has('all');
  const activeFilterCount = 
    (activeCategories.has('all') ? 0 : activeCategories.size) + 
    (activeDays.has('all') ? 0 : activeDays.size);

  // Notify parent of filtered results - only when IDs actually change
  useEffect(() => {
    const currentIds = filteredLocations.map(l => l.id).sort().join(',');
    if (currentIds !== prevFilteredIdsRef.current) {
      prevFilteredIdsRef.current = currentIds;
      onFilteredLocationsChange(filteredLocations);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredLocations]);

  // Effect 1: Apply filters from focused location (from "Show on Map" actions)
  // Note: onFocusConsumed is NOT called here - we wait for filters to propagate
  useEffect(() => {
    if (focusedLocation) {
      // Set category filter to this location's category
      if (focusedLocation.category) {
        // Map 'restaurant' to 'dining' for consistency
        const cat = focusedLocation.category === 'restaurant' 
          ? 'dining' 
          : focusedLocation.category;
        setActiveCategories(new Set([cat as CategoryFilter]));
      } else {
        // No category info - reset to all
        setActiveCategories(new Set(['all']));
      }
      
      // Set day filter to this location's day
      if (focusedLocation.dayId) {
        setActiveDays(new Set([focusedLocation.dayId]));
      } else {
        // No day info (guide items, lodging) - reset to all
        setActiveDays(new Set(['all']));
      }
      
      // Mark that we just applied focus - consumption happens in next effect
      justAppliedFocusRef.current = true;
    }
  }, [focusedLocation]);

  // Effect 2: Consume focus AFTER filters have been applied and propagated
  // This runs when filteredLocations changes, ensuring state is fully updated
  useEffect(() => {
    if (justAppliedFocusRef.current) {
      justAppliedFocusRef.current = false;
      // Use rAF to ensure React has completed its render cycle
      requestAnimationFrame(() => {
        onFocusConsumed?.();
      });
    }
  }, [filteredLocations, onFocusConsumed]);

  const toggleCategory = useCallback((cat: CategoryFilter) => {
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
  }, []);

  const toggleDay = useCallback((dayId: string) => {
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
  }, []);

  // Collapsed state - show floating filter button
  if (isCollapsed) {
    return (
      <div className="absolute top-3 left-3 z-10">
        <Button
          variant="secondary"
          size="sm"
          onClick={onToggleCollapse}
          className="shadow-md gap-1.5"
        >
          <Filter className="w-4 h-4" />
          {hasActiveFilters && (
            <Badge variant="default" className="h-5 px-1.5 text-xs ml-1">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("border-b border-border bg-card/95 backdrop-blur-sm", className)}>
      {/* Category Row */}
      <div className="px-3 py-2 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Categories</p>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs h-5">
              {filteredLocations.length} location{filteredLocations.length !== 1 ? 's' : ''}
            </Badge>
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="h-6 w-6 p-0"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-1.5 pb-1">
            <Button
              size="sm"
              variant={activeCategories.has('all') ? 'default' : 'outline'}
              onClick={() => toggleCategory('all')}
              className="shrink-0 h-7 px-2 text-xs"
            >
              <MapPin className="w-3.5 h-3.5 mr-1" />
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
                    className="shrink-0 h-7 px-2 text-xs"
                  >
                    <Icon className="w-3.5 h-3.5 mr-1" />
                    {config.label}
                  </Button>
                );
              })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      
      {/* Day Row */}
      {days.length > 0 && (
        <div className="px-3 py-2 space-y-1 border-t border-border/50">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Days</p>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-1.5 pb-1">
              <Button
                size="sm"
                variant={activeDays.has('all') ? 'default' : 'outline'}
                onClick={() => toggleDay('all')}
                className="shrink-0 h-7 px-2 text-xs"
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
                    className="shrink-0 h-7 px-2 text-xs"
                  >
                    {dayOfWeek}
                  </Button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
