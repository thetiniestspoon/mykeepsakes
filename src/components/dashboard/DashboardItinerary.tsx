import { useMemo, useEffect, useRef, useCallback, useState } from 'react';
import { Loader2, Calendar, LayoutGrid } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragMoveEvent,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { useDatabaseItinerary, type LegacyActivity } from '@/hooks/use-database-itinerary';
import { useTodayMode } from '@/hooks/use-today-mode';
import { useDashboardSelectionOptional } from '@/contexts/DashboardSelectionContext';
import { useTimeBasedReorder, calculateSortIndexForPosition } from '@/hooks/use-time-based-reorder';
import {
  createDragState,
  updateDragState,
  formatTimeForDisplay,
  type TimeDragState
} from '@/lib/time-drag-modifier';
import { CompactDayCard } from './CompactDayCard';
import { CompactActivityCard } from './CompactActivityCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DatabaseItineraryTab } from '@/components/DatabaseItineraryTab';
import '@/preview/collage/collage.css';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { MarginNote } from '@/preview/collage/ui/MarginNote';

/**
 * Compact itinerary — migrated to Collage 2026-04-23 (Phase 4 #1).
 * Mini-session-blocks preview: DAY view trigger sits as a Rubik Mono One
 * paper-chip button; days stacked with hairline between groupings;
 * loading/error fall back to stamp + Caveat margin note. DnD/query data/
 * sensors/navigation callbacks preserved unchanged. prefers-reduced-motion
 * honored via .collage-root rules.
 */
export function DashboardItinerary() {
  const { days, trip, isLoading, isError } = useDatabaseItinerary();
  const dashboard = useDashboardSelectionOptional();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<(LegacyActivity & { dayId: string }) | null>(null);
  const [overDayId, setOverDayId] = useState<string | null>(null);
  const [previewTimes, setPreviewTimes] = useState<Map<string, string>>(new Map());
  const dragStateRef = useRef<TimeDragState | null>(null);
  
  // Hooks for drag functionality
  const timeReorder = useTimeBasedReorder();
  
  // Sensors for drag detection - 150ms delay for better mobile responsiveness
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    })
  );
  
  const { 
    filteredDays, 
    nextPlannedActivity,
  } = useTodayMode(days);
  
  // Determine which day is today
  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);
  
  // Build a lookup for activities with their day info
  const activityLookup = useMemo(() => {
    const map = new Map<string, LegacyActivity & { dayId: string }>();
    days.forEach(day => {
      day.activities.forEach(activity => {
        map.set(activity.id, { ...activity, dayId: day.id });
      });
    });
    return map;
  }, [days]);
  
  // Drag handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = String(event.active.id);
    const item = activityLookup.get(id);
    
    setActiveId(id);
    setActiveItem(item || null);
    
    if (item?.rawStartTime) {
      dragStateRef.current = createDragState(item.rawStartTime, 0);
    }
  }, [activityLookup]);
  
  const handleDragMove = useCallback((event: DragMoveEvent) => {
    if (!dragStateRef.current || !activeItem) return;
    
    const currentY = event.delta.y;
    dragStateRef.current = updateDragState(dragStateRef.current, currentY);
    
    // Update preview time for the active item
    const newPreviewTime = formatTimeForDisplay(dragStateRef.current.currentTime);
    if (newPreviewTime) {
      setPreviewTimes(new Map([[activeItem.id, newPreviewTime]]));
    }
  }, [activeItem]);
  
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const overId = event.over?.id;
    if (!overId) {
      setOverDayId(null);
      return;
    }
    
    // Check if we're over a day container or an activity
    const overIdStr = String(overId);
    
    // Find if this is a day ID
    const isDay = days.some(d => d.id === overIdStr);
    if (isDay) {
      setOverDayId(overIdStr);
      return;
    }
    
    // Find which day this activity belongs to
    const overActivity = activityLookup.get(overIdStr);
    if (overActivity) {
      setOverDayId(overActivity.dayId);
    }
  }, [days, activityLookup]);
  
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !activeItem || !dragStateRef.current) {
      // Reset state
      setActiveId(null);
      setActiveItem(null);
      setOverDayId(null);
      setPreviewTimes(new Map());
      dragStateRef.current = null;
      return;
    }
    
    const activeIdStr = String(active.id);
    const overId = String(over.id);
    
    // Determine target day
    let targetDayId = overDayId || activeItem.dayId;
    
    // If dropped on an activity, use that activity's day
    const overActivity = activityLookup.get(overId);
    if (overActivity) {
      targetDayId = overActivity.dayId;
    }
    
    // Get the new time from drag state
    const newTime = dragStateRef.current.currentTime;
    
    // Calculate sort index using helper function
    const targetDay = days.find(d => d.id === targetDayId);
    let newSortIndex = 0;
    
    if (targetDay) {
      // Filter out the moving item and build sortable list
      const otherActivities = targetDay.activities
        .filter(a => a.id !== activeIdStr)
        .map((a, idx) => ({
          id: a.id,
          sortIndex: idx,
          rawStartTime: a.rawStartTime,
        }));
      
      // Find insertion position based on new time
      let insertionIndex = 0;
      for (let i = 0; i < otherActivities.length; i++) {
        const actTime = otherActivities[i].rawStartTime;
        // Handle null times - items without time go at end
        if (!newTime && actTime) {
          insertionIndex = i + 1;
        } else if (newTime && actTime && newTime > actTime) {
          insertionIndex = i + 1;
        } else if (newTime && !actTime) {
          break;
        }
      }
      
      newSortIndex = calculateSortIndexForPosition(
        otherActivities.map(a => ({ id: a.id, sortIndex: a.sortIndex })),
        insertionIndex
      );
    }
    
    // Only update if something changed
    const timeChanged = newTime !== activeItem.rawStartTime;
    const dayChanged = targetDayId !== activeItem.dayId;
    
    if (timeChanged || dayChanged) {
      timeReorder.mutate({
        itemId: activeIdStr,
        newDayId: targetDayId,
        newStartTime: newTime,
        newSortIndex,
        originalDayId: activeItem.dayId,
        originalStartTime: activeItem.rawStartTime || undefined,
      });
    }
    
    // Reset state
    setActiveId(null);
    setActiveItem(null);
    setOverDayId(null);
    setPreviewTimes(new Map());
    dragStateRef.current = null;
  }, [activeItem, overDayId, days, activityLookup, timeReorder]);
  
  // Register scroll handler with the dashboard context
  const scrollToItem = useCallback((itemId: string) => {
    if (!scrollContainerRef.current) return;
    
    const element = scrollContainerRef.current.querySelector(`[data-activity-id="${itemId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);
  
  useEffect(() => {
    if (!dashboard) return;
    return dashboard.registerScrollHandler(scrollToItem);
  }, [dashboard, scrollToItem]);

  if (isLoading) {
    return (
      <div
        className="collage-root"
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '32px 0',
        }}
      >
        <Loader2
          className="animate-spin"
          style={{ width: 20, height: 20, color: 'var(--c-ink-muted)' }}
          aria-label="Loading"
        />
      </div>
    );
  }

  if (isError || !trip) {
    return (
      <div
        className="collage-root"
        style={{
          textAlign: 'center',
          padding: '32px 16px',
        }}
      >
        <Stamp variant="outline" size="sm" rotate={-2} style={{ marginBottom: 12 }}>
          no itinerary yet
        </Stamp>
        <MarginNote rotate={-1} size={18} style={{ display: 'block' }}>
          add a day to begin
        </MarginNote>
      </div>
    );
  }

  return (
    <div
      className="collage-root"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      {/* Day View trigger — Rubik Mono paper chip */}
      <div
        style={{
          padding: '10px 10px 8px',
          display: 'flex',
          justifyContent: 'flex-end',
          borderBottom: '1px dashed var(--c-line)',
        }}
      >
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label="Open full day view"
              style={{
                appearance: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                background: 'var(--c-paper)',
                color: 'var(--c-ink)',
                border: '1px solid var(--c-line)',
                borderRadius: 'var(--c-r-sm)',
                fontFamily: 'var(--c-font-display)',
                fontSize: 9,
                letterSpacing: '.2em',
                textTransform: 'uppercase',
                lineHeight: 1,
                transition: 'background var(--c-t-fast), border-color var(--c-t-fast)',
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
                e.currentTarget.style.borderColor = 'var(--c-ink)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'var(--c-paper)';
                e.currentTarget.style.borderColor = 'var(--c-line)';
              }}
            >
              <LayoutGrid style={{ width: 12, height: 12 }} aria-hidden />
              Day view
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[min(1400px,95vw)] w-full max-h-[95vh] h-full overflow-y-auto p-0 gap-0">
            <DialogHeader className="sr-only">
              <DialogTitle>Session Blocks — day view</DialogTitle>
              <DialogDescription>
                Trip activities grouped by time of day: morning, midday, afternoon, evening.
              </DialogDescription>
            </DialogHeader>
            <DatabaseItineraryTab />
          </DialogContent>
        </Dialog>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={scrollContainerRef}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            padding: 10,
          }}
        >
          {filteredDays.map((day) => {
            const dayDate = new Date(day.date).toISOString().split('T')[0];
            const isToday = dayDate === todayStr;
            const isReceivingDrag = activeItem !== null && overDayId === day.id;

            return (
              <CompactDayCard
                key={day.id}
                day={day}
                nextActivityId={nextPlannedActivity?.activityId}
                isToday={isToday}
                isReceivingDrag={isReceivingDrag}
                previewTimes={previewTimes}
              />
            );
          })}
        </div>

        {/* Drag overlay for visual feedback */}
        <DragOverlay>
          {activeItem && (
            <div
              style={{
                opacity: 0.92,
                boxShadow: 'var(--c-shadow)',
                borderRadius: 'var(--c-r-sm)',
              }}
            >
              <CompactActivityCard
                activity={activeItem}
                dayId={activeItem.dayId}
                previewTime={previewTimes.get(activeItem.id)}
                isDragging={true}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
