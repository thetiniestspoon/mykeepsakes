import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { MapPin, Waves, Utensils, Activity, Home, Car, PartyPopper, Building, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MapLocation } from '@/types/map';
import '@/preview/collage/collage.css';

type CategoryFilter = 'all' | 'beach' | 'dining' | 'activity' | 'accommodation' | 'transport' | 'event' | 'lodging';

const categoryConfig: Record<string, { label: string; icon: React.ComponentType<{ style?: React.CSSProperties }> }> = {
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
  onToggleCollapse?: () => void;
  className?: string;
}

/**
 * Map filter header — migrated to Collage 2026-04-23 (Phase 4 #1).
 * Row of StickerPill-style filter chips (pen active, ghost inactive) for
 * categories and days. Stamp label above each row; counter chip shown inline.
 * All filter state/effect plumbing preserved verbatim — presentation only.
 */
export function MapFilterHeader({
  locations,
  days,
  onFilteredLocationsChange,
  focusedLocation,
  onFocusConsumed,
  onToggleCollapse,
  className,
}: MapFilterHeaderProps) {
  const [activeCategories, setActiveCategories] = useState<Set<CategoryFilter>>(new Set(['all']));
  const [activeDays, setActiveDays] = useState<Set<string>>(new Set(['all']));

  const availableCategories = useMemo(() => {
    const cats = new Set(locations.map((l) => l.category));
    if (cats.has('restaurant')) cats.add('dining');
    cats.delete('restaurant');
    return cats;
  }, [locations]);

  const filteredLocations = useMemo(() => {
    let filtered = locations;

    if (!activeCategories.has('all')) {
      filtered = filtered.filter((loc) => {
        if (activeCategories.has('dining') && (loc.category === 'dining' || loc.category === 'restaurant')) {
          return true;
        }
        return activeCategories.has(loc.category as CategoryFilter);
      });
    }

    if (!activeDays.has('all')) {
      filtered = filtered.filter((loc) => {
        if (!loc.dayId) return false;
        return activeDays.has(loc.dayId);
      });
    }

    const seen = new Set<string>();
    return filtered.filter((loc) => {
      const key = `${loc.name}-${loc.lat}-${loc.lng}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [locations, activeCategories, activeDays]);

  const prevFilteredIdsRef = useRef<string>('');
  const justAppliedFocusRef = useRef(false);

  useEffect(() => {
    const currentIds = filteredLocations.map((l) => l.id).sort().join(',');
    if (currentIds !== prevFilteredIdsRef.current) {
      prevFilteredIdsRef.current = currentIds;
      onFilteredLocationsChange(filteredLocations);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredLocations]);

  useEffect(() => {
    if (focusedLocation) {
      if (focusedLocation.category) {
        const cat = focusedLocation.category === 'restaurant' ? 'dining' : focusedLocation.category;
        setActiveCategories(new Set([cat as CategoryFilter]));
      } else {
        setActiveCategories(new Set(['all']));
      }

      if (focusedLocation.dayId) {
        setActiveDays(new Set([focusedLocation.dayId]));
      } else {
        setActiveDays(new Set(['all']));
      }

      justAppliedFocusRef.current = true;
    }
  }, [focusedLocation]);

  useEffect(() => {
    if (justAppliedFocusRef.current) {
      justAppliedFocusRef.current = false;
      requestAnimationFrame(() => {
        onFocusConsumed?.();
      });
    }
  }, [filteredLocations, onFocusConsumed]);

  const toggleCategory = useCallback((cat: CategoryFilter) => {
    setActiveCategories((prev) => {
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
    setActiveDays((prev) => {
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

  return (
    <div
      className={cn('collage-root', className)}
      style={{
        background: 'var(--c-paper)',
        borderBottom: '1px solid var(--c-line)',
      }}
    >
      {/* Category Row */}
      <div style={{ padding: '10px 12px 8px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
            gap: 8,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--c-font-display)',
              fontSize: 9,
              letterSpacing: '.22em',
              textTransform: 'uppercase',
              color: 'var(--c-ink-muted)',
            }}
          >
            Categories
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontFamily: 'var(--c-font-display)',
                fontSize: 9,
                letterSpacing: '.18em',
                textTransform: 'uppercase',
                color: 'var(--c-creme)',
                background: 'var(--c-ink)',
                padding: '4px 8px',
                borderRadius: 'var(--c-r-sm)',
                boxShadow: 'var(--c-shadow-sm)',
                lineHeight: 1,
              }}
            >
              {filteredLocations.length} {filteredLocations.length === 1 ? 'location' : 'locations'}
            </span>
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label="Collapse filters"
                style={{
                  appearance: 'none',
                  cursor: 'pointer',
                  width: 24,
                  height: 24,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'transparent',
                  color: 'var(--c-ink)',
                  border: '1px solid var(--c-line)',
                  borderRadius: 'var(--c-r-sm)',
                  transition: 'background var(--c-t-fast)',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 2px var(--c-pen)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'var(--c-creme)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <ChevronUp style={{ width: 14, height: 14 }} aria-hidden />
              </button>
            )}
          </div>
        </div>
        <ScrollArea className="w-full whitespace-nowrap">
          <div style={{ display: 'flex', gap: 6, paddingBottom: 4 }}>
            <FilterChip
              active={activeCategories.has('all')}
              onClick={() => toggleCategory('all')}
              icon={<MapPin style={{ width: 12, height: 12 }} aria-hidden />}
            >
              All
            </FilterChip>
            {Object.entries(categoryConfig)
              .filter(([key]) => key !== 'restaurant' && availableCategories.has(key))
              .map(([key, config]) => {
                const Icon = config.icon;
                const active = activeCategories.has(key as CategoryFilter);
                return (
                  <FilterChip
                    key={key}
                    active={active}
                    onClick={() => toggleCategory(key as CategoryFilter)}
                    icon={<Icon style={{ width: 12, height: 12 }} />}
                  >
                    {config.label}
                  </FilterChip>
                );
              })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Day Row */}
      {days.length > 0 && (
        <div
          style={{
            padding: '10px 12px 10px',
            borderTop: '1px dashed var(--c-line)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--c-font-display)',
              fontSize: 9,
              letterSpacing: '.22em',
              textTransform: 'uppercase',
              color: 'var(--c-ink-muted)',
              marginBottom: 8,
            }}
          >
            Days
          </div>
          <ScrollArea className="w-full whitespace-nowrap">
            <div style={{ display: 'flex', gap: 6, paddingBottom: 4 }}>
              <FilterChip
                active={activeDays.has('all')}
                onClick={() => toggleDay('all')}
              >
                All Days
              </FilterChip>
              {days.map((day) => {
                const dayOfWeek = new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
                const active = activeDays.has(day.id);
                return (
                  <FilterChip
                    key={day.id}
                    active={active}
                    onClick={() => toggleDay(day.id)}
                  >
                    {dayOfWeek}
                  </FilterChip>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .collage-root button { transition: none !important; }
        }
      `}</style>
    </div>
  );
}

/** Internal StickerPill-style filter chip. */
function FilterChip({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        appearance: 'none',
        cursor: 'pointer',
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '6px 10px',
        background: active ? 'var(--c-pen)' : 'var(--c-paper)',
        color: active ? 'var(--c-creme)' : 'var(--c-ink)',
        border: `1px solid ${active ? 'var(--c-pen)' : 'var(--c-line)'}`,
        borderRadius: 'var(--c-r-sm)',
        boxShadow: active ? 'var(--c-shadow-sm)' : 'none',
        fontFamily: 'var(--c-font-display)',
        fontSize: 9,
        letterSpacing: '.18em',
        textTransform: 'uppercase',
        lineHeight: 1,
        transition: 'background var(--c-t-fast) var(--c-ease-out), border-color var(--c-t-fast)',
        outline: 'none',
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = `0 0 0 2px var(--c-pen)${active ? ', var(--c-shadow-sm)' : ''}`;
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = active ? 'var(--c-shadow-sm)' : 'none';
      }}
      onMouseOver={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'var(--c-creme)';
          e.currentTarget.style.borderColor = 'var(--c-ink)';
        }
      }}
      onMouseOut={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'var(--c-paper)';
          e.currentTarget.style.borderColor = 'var(--c-line)';
        }
      }}
    >
      {icon}
      {children}
    </button>
  );
}
