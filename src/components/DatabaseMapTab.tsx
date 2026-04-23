import { useState, useMemo } from 'react';
import { Map as MapIcon, Waves, Utensils, Activity, Home, Car, PartyPopper, MapPin, Building, Loader2, Check, Star, Camera } from 'lucide-react';
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
import { Stamp } from '@/preview/collage/ui/Stamp';
import { StickerPill } from '@/preview/collage/ui/StickerPill';
import { MarginNote } from '@/preview/collage/ui/MarginNote';
import { Tape } from '@/preview/collage/ui/Tape';
import '@/preview/collage/collage.css';
import type { MapLocation, PinState } from '@/types/map';
import type { Location } from '@/types/trip';

/**
 * DatabaseMapTab — migrated to Collage direction (Phase 4 #6 — Annotated Pinboard).
 * All data flow preserved: useDatabaseLocations / useLocations / useMemories /
 * useFavorites / useAccommodations / useActiveTrip still drive pin state, filtering,
 * and click-to-open handling. The LocationBottomSheet / MapModal dispatch logic is
 * unchanged. Only the presentation moved — outer wrapper is `collage-root`, chrome
 * uses Stamp/StickerPill/MarginNote, the map sits in a framed paper container, and
 * the location list reads as a field-notebook index. Pins themselves are styled in
 * OverviewMap.tsx via a DivIcon based on this surface's pinState.
 *
 * MapTab.tsx (the static/legacy variant) is intentionally not migrated — it's
 * orphaned and DatabaseMapTab is the live surface in the trip dashboard.
 */

type CategoryFilter = 'all' | 'beach' | 'dining' | 'activity' | 'accommodation' | 'transport' | 'event' | 'lodging';

const categoryConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string; size?: number }>; color: string }> = {
  beach:         { label: 'Beaches',       icon: Waves,       color: '#5b7fa8' },
  dining:        { label: 'Dining',        icon: Utensils,    color: '#C27814' },
  restaurant:    { label: 'Restaurants',   icon: Utensils,    color: '#C27814' },
  activity:      { label: 'Activities',    icon: Activity,    color: '#1F3CC6' },
  accommodation: { label: 'Stay',          icon: Home,        color: '#4A4843' },
  transport:     { label: 'Transport',     icon: Car,         color: '#6B7280' },
  event:         { label: 'Events',        icon: PartyPopper, color: '#F6D55C' },
  lodging:       { label: 'Lodging',       icon: Building,    color: '#8ba66e' },
};

export function DatabaseMapTab() {
  const [activeCategories, setActiveCategories] = useState<Set<CategoryFilter>>(new Set(['all']));
  const [activeDays, setActiveDays] = useState<Set<string>>(new Set(['all']));
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
      <div className="collage-root" style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--c-ink-muted)' }} />
      </div>
    );
  }

  // Shared filter-chip styles. Inactive = cream + ink border, active = pen-blue.
  const chipBase: React.CSSProperties = {
    appearance: 'none',
    cursor: 'pointer',
    padding: '7px 12px',
    fontFamily: 'var(--c-font-display)',
    fontSize: 10,
    letterSpacing: '.22em',
    textTransform: 'uppercase',
    borderRadius: 'var(--c-r-sm)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap',
    flexShrink: 0,
    transition: 'transform 140ms ease-out',
  };
  const chipInactive: React.CSSProperties = {
    ...chipBase,
    background: 'var(--c-paper)',
    color: 'var(--c-ink)',
    border: '1.5px solid var(--c-ink)',
  };
  const chipActive: React.CSSProperties = {
    ...chipBase,
    background: 'var(--c-pen)',
    color: 'var(--c-creme)',
    border: '1.5px solid var(--c-pen)',
  };

  return (
    <div className="collage-root space-y-6 pb-20 px-4 sm:px-8 pt-6">
      {/* Header */}
      <header style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <Stamp variant="outline" size="sm" rotate={-2}>the map · pinboard</Stamp>
        <h2
          style={{
            fontFamily: 'var(--c-font-body)',
            fontSize: 'clamp(24px, 3vw, 32px)',
            fontWeight: 500,
            color: 'var(--c-ink)',
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          {trip?.title ?? 'Trip Map'}
        </h2>
        <p
          style={{
            fontFamily: 'var(--c-font-body)',
            fontStyle: 'italic',
            fontSize: 14,
            color: 'var(--c-ink-muted)',
            margin: 0,
          }}
        >
          {trip?.location_name ? `${trip.location_name} · ` : ''}
          {filteredLocations.length} location{filteredLocations.length === 1 ? '' : 's'} pinned
        </p>
        <MarginNote rotate={-2} size={18} style={{ marginTop: 2 }}>
          pinned where we'll actually be — not to scale
        </MarginNote>
      </header>

      {/* Framed map */}
      <div
        className="collage-mapframe-wrap"
        style={{
          position: 'relative',
          border: '1.5px solid var(--c-ink)',
          boxShadow: 'var(--c-shadow)',
          background: 'var(--c-creme)',
          overflow: 'hidden',
          minHeight: 340,
        }}
      >
        <OverviewMap
          locations={filteredLocations}
          onMarkerClick={handleMarkerClick}
          className="h-[360px]"
        />
        {/* Corner tape — purely decorative, over the map */}
        <Tape position="top-left" rotate={-8} width={78} style={{ zIndex: 500 }} />
        <Tape position="top-right" rotate={6} width={78} style={{ zIndex: 500 }} />
      </div>

      {/* Category filters */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Stamp variant="plain" size="sm" style={{ color: 'var(--c-ink-muted)', padding: 0 }}>
          categories
        </Stamp>
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 4,
          }}
        >
          <button
            type="button"
            onClick={() => toggleCategory('all')}
            style={activeCategories.has('all') ? chipActive : chipInactive}
          >
            <MapPin size={12} />
            All
          </button>
          {Object.entries(categoryConfig)
            .filter(([key]) => key !== 'restaurant' && availableCategories.has(key))
            .map(([key, config]) => {
              const Icon = config.icon;
              const isActive = activeCategories.has(key as CategoryFilter);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleCategory(key as CategoryFilter)}
                  style={isActive ? chipActive : chipInactive}
                >
                  <Icon size={12} />
                  {config.label}
                </button>
              );
            })}
        </div>
      </section>

      {/* Day filters */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Stamp variant="plain" size="sm" style={{ color: 'var(--c-ink-muted)', padding: 0 }}>
          days
        </Stamp>
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 4,
          }}
        >
          <button
            type="button"
            onClick={() => toggleDay('all')}
            style={activeDays.has('all') ? chipActive : chipInactive}
          >
            All Days
          </button>
          {days.map(day => {
            const dayOfWeek = new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
            const isActive = activeDays.has(day.id);
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => toggleDay(day.id)}
                style={isActive ? chipActive : chipInactive}
              >
                {dayOfWeek}
              </button>
            );
          })}
        </div>
      </section>

      {/* Location count */}
      <div>
        <StickerPill variant="ink" style={{ fontSize: 10 }}>
          {filteredLocations.length} location{filteredLocations.length !== 1 ? 's' : ''}
        </StickerPill>
      </div>

      {/* Location list */}
      <section
        style={{
          background: 'var(--c-paper)',
          border: '1px solid var(--c-line)',
          boxShadow: 'var(--c-shadow-sm)',
        }}
      >
        <header
          style={{
            padding: '10px 14px',
            borderBottom: '1px solid var(--c-line)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <MapIcon size={14} style={{ color: 'var(--c-ink-muted)' }} />
          <Stamp variant="plain" size="sm" style={{ color: 'var(--c-ink)', padding: 0 }}>
            locations
          </Stamp>
        </header>
        <div style={{ padding: '6px 8px' }}>
          {filteredLocations.length === 0 ? (
            <p
              style={{
                fontFamily: 'var(--c-font-body)',
                fontStyle: 'italic',
                fontSize: 14,
                color: 'var(--c-ink-muted)',
                textAlign: 'center',
                padding: '18px 0',
                margin: 0,
              }}
            >
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
                    className="group w-full text-left"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 8px',
                      background: 'transparent',
                      border: 0,
                      cursor: 'pointer',
                      transition: 'background 140ms ease-out',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--c-creme)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center shrink-0 relative',
                      )}
                      style={{
                        width: 34,
                        height: 34,
                        background: config.color,
                        color: '#FFFFFF',
                        border: '1.5px solid var(--c-ink)',
                        borderRadius: 'var(--c-r-sm)',
                        boxShadow: location.pinState === 'has-memories'
                          ? '0 0 0 2px #A83232'
                          : location.pinState === 'favorited'
                          ? '0 0 0 2px var(--c-tape)'
                          : location.pinState === 'visited'
                          ? '0 0 0 2px #3C7A4E'
                          : 'var(--c-shadow-sm)',
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontFamily: 'var(--c-font-body)',
                          fontWeight: 500,
                          fontSize: 15,
                          color: 'var(--c-ink)',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {location.name}
                      </p>
                      <p
                        style={{
                          fontFamily: 'var(--c-font-body)',
                          fontStyle: 'italic',
                          fontSize: 12,
                          color: 'var(--c-ink-muted)',
                          margin: '2px 0 0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {location.dayLabel || config.label}
                      </p>
                    </div>
                    {/* State indicators */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      {location.hasMemories && (
                        <Camera size={14} style={{ color: '#A83232' }} />
                      )}
                      {location.isFavorited && (
                        <Star size={14} style={{ color: 'var(--c-ink)', fill: 'var(--c-tape)' }} />
                      )}
                      {location.isVisited && (
                        <Check size={14} style={{ color: '#3C7A4E' }} />
                      )}
                      <MapPin size={14} style={{ color: 'var(--c-ink-muted)' }} />
                    </div>
                  </button>
                );
              })}
            </StaggeredList>
          )}
        </div>
      </section>

      {/* Legend */}
      <section
        style={{
          background: 'var(--c-creme)',
          border: '1px dashed var(--c-line)',
          padding: '10px 14px',
        }}
      >
        <Stamp variant="plain" size="sm" style={{ color: 'var(--c-ink-muted)', padding: 0, marginBottom: 8, display: 'block' }}>
          map legend
        </Stamp>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {Object.entries(categoryConfig)
            .filter(([key]) => key !== 'restaurant' && availableCategories.has(key))
            .map(([key, config]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  aria-hidden
                  style={{
                    width: 12,
                    height: 12,
                    background: config.color,
                    border: '1.5px solid var(--c-ink)',
                    borderRadius: 999,
                  }}
                />
                <span
                  style={{
                    fontFamily: 'var(--c-font-display)',
                    fontSize: 9,
                    letterSpacing: '.2em',
                    textTransform: 'uppercase',
                    color: 'var(--c-ink)',
                  }}
                >
                  {config.label}
                </span>
              </div>
            ))}
        </div>
      </section>

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
