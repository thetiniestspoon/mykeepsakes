import { useMemo, useEffect, useRef, useCallback, useState } from 'react';
import { Loader2, Calendar } from 'lucide-react';
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
import { useFlattenedItinerary } from '@/hooks/use-flattened-itinerary';
import { useTimeBasedReorder } from '@/hooks/use-time-based-reorder';
import { 
  createDragState, 
  updateDragState, 
  formatTimeForDisplay,
  type TimeDragState 
} from '@/lib/time-drag-modifier';
import { CompactDayCard } from './CompactDayCard';
import { CompactActivityCard } from './CompactActivityCard';

/**
 * Compact itinerary view for the dashboard left column.
 * Shows all days with compact activity cards that sync with the selection context.
 * Now with time-based drag-and-drop for reordering and cross-day movement.
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
  const flattenedItems = useFlattenedItinerary(days);
  const timeReorder = useTimeBasedReorder();
  
  // Sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
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
    
    const activeId = String(active.id);
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
    
    // Find sort index based on position
    const targetDay = days.find(d => d.id === targetDayId);
    let newSortIndex = 0;
    
    if (targetDay) {
      // Find where to insert based on time
      const targetActivities = targetDay.activities.filter(a => a.id !== activeId);
      for (let i = 0; i < targetActivities.length; i++) {
        const actTime = targetActivities[i].rawStartTime;
        if (actTime && newTime > actTime) {
          newSortIndex = i + 1;
        }
      }
    }
    
    // Only update if something changed
    const timeChanged = newTime !== activeItem.rawStartTime;
    const dayChanged = targetDayId !== activeItem.dayId;
    
    if (timeChanged || dayChanged) {
      timeReorder.mutate({
        itemId: activeId,
        newDayId: targetDayId,
        newStartTime: newTime,
        newSortIndex,
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
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !trip) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No itinerary found.</p>
      </div>
    );
  }
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div ref={scrollContainerRef} className="space-y-2 p-2">
        {filteredDays.map((day) => {
          // Check if this day is today
          const dayDate = new Date(day.date).toISOString().split('T')[0];
          const isToday = dayDate === todayStr;
          const isReceivingDrag = overDayId === day.id && activeItem?.dayId !== day.id;
          
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
          <div className="opacity-90 shadow-lg rounded-md">
            <CompactActivityCard
              activity={activeItem}
              dayId={activeItem.dayId}
              previewTime={previewTimes.get(activeItem.id)}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
