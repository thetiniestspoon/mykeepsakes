import { useState, useCallback, useMemo, useRef } from 'react';
import { Loader2, Calendar, LayoutList, Clock, Ticket } from 'lucide-react';
import { 
  DndContext, 
  DragOverlay, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragMoveEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useDatabaseItinerary, type LegacyActivity } from '@/hooks/use-database-itinerary';
import { DatabaseDayCard } from '@/components/itinerary/DatabaseDayCard';
import { DatabaseActivityCard } from '@/components/itinerary/DatabaseActivityCard';
import { TodayModeToggle } from '@/components/itinerary/TodayModeToggle';
import { QuickAddButton } from '@/components/itinerary/QuickAddButton';
import { TimelineView } from '@/components/itinerary/TimelineView';
import { useTodayMode } from '@/hooks/use-today-mode';
import { getTripMode } from '@/hooks/use-trip';
import { useTimeBasedReorder, calculateSortIndexForPosition } from '@/hooks/use-time-based-reorder';
import { useFlattenedItinerary, getItemsForDay } from '@/hooks/use-flattened-itinerary';
import { 
  createDragState, 
  updateDragState, 
  formatTimeForDisplay,
  type TimeDragState 
} from '@/lib/time-drag-modifier';
import { cn } from '@/lib/utils';

type ViewMode = 'cards' | 'timeline';

export function DatabaseItineraryTab() {
  const { days, trip, isLoading, isError } = useDatabaseItinerary();
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [chosenOnly, setChosenOnly] = useState(false);

  // Does this trip have any chosen items? (Hide the toggle otherwise.)
  const hasChosenItems = useMemo(
    () => days.some(d => d.activities.some(a => a.isChosen)),
    [days]
  );

  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<LegacyActivity | null>(null);
  const [overDayId, setOverDayId] = useState<string | null>(null);
  const [previewTimes, setPreviewTimes] = useState<Map<string, string>>(new Map());
  const dragStateRef = useRef<TimeDragState | null>(null);
  
  // Hooks
  const timeReorder = useTimeBasedReorder();
  const flattenedItems = useFlattenedItinerary(days);

  // Count of chosen workshops for the aria-live status announcement.
  const chosenCount = useMemo(
    () => days.reduce((n, d) => n + d.activities.filter(a => a.isChosen).length, 0),
    [days]
  );

  // BUG-06 fix: pass unfiltered `days` so nextPlannedActivity sees all workshops,
  // not just the chosen ones. Chosen-only filter is applied below on the rendered output.
  const {
    isTodayMode,
    toggleTodayMode,
    filteredDays,
    nextPlannedActivity,
    isActiveTrip,
    hasTodayContent
  } = useTodayMode(days);

  // Apply chosen-only filter after today-mode filter for rendering only.
  // Hides non-chosen rows that have a `track` (workshop siblings); keeps everything
  // else (plenaries, meals, worship, personal options, non-track activities).
  const daysToRender = useMemo(() => {
    if (!chosenOnly) return filteredDays;
    return filteredDays.map(day => ({
      ...day,
      activities: day.activities.filter(a => a.isChosen || !a.track),
    }));
  }, [filteredDays, chosenOnly]);
  
  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const itemId = String(event.active.id);
    const item = flattenedItems.find(i => i.id === itemId);
    
    if (item) {
      setActiveId(itemId);
      setActiveItem(item.activity);
      
      // Initialize drag state for time tracking
      if (item.startTime) {
        dragStateRef.current = createDragState(item.startTime, 0);
      }
    }
  }, [flattenedItems]);
  
  // Handle drag move - track velocity and update preview time
  const handleDragMove = useCallback((event: DragMoveEvent) => {
    if (!activeId || !dragStateRef.current) return;
    
    const deltaY = event.delta.y;
    dragStateRef.current = updateDragState(dragStateRef.current, deltaY);
    
    // Update preview time for the dragged item
    const newPreviewTime = formatTimeForDisplay(dragStateRef.current.currentTime);
    if (newPreviewTime) {
      setPreviewTimes(new Map([[activeId, newPreviewTime]]));
    }
  }, [activeId]);
  
  // Handle drag over - detect which day we're hovering
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const overId = event.over?.id;
    if (!overId) {
      setOverDayId(null);
      return;
    }
    
    // Check if we're over an activity - find its day
    const overItem = flattenedItems.find(i => i.id === overId);
    if (overItem) {
      setOverDayId(overItem.dayId);
    }
  }, [flattenedItems]);
  
  // Handle drag end - persist the change
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && activeItem && dragStateRef.current) {
      const activeItemData = flattenedItems.find(i => i.id === active.id);
      const overItemData = flattenedItems.find(i => i.id === over.id);
      
      if (activeItemData && overItemData) {
        // Determine target day (could be same or different)
        const targetDayId = overItemData.dayId;
        const newTime = dragStateRef.current.currentTime;
        
        // Calculate sort index
        const targetDayItems = getItemsForDay(flattenedItems, targetDayId);
        const overIndex = targetDayItems.findIndex(i => i.id === over.id);
        const newSortIndex = calculateSortIndexForPosition(
          targetDayItems.map(i => ({ id: i.id, sortIndex: i.sortIndex })),
          overIndex
        );
        
        // Only update if something changed
        if (targetDayId !== activeItemData.dayId || newTime !== activeItemData.startTime) {
          timeReorder.mutate({
            itemId: String(active.id),
            newDayId: targetDayId,
            newStartTime: newTime,
            newSortIndex,
            originalDayId: activeItemData.dayId,
            originalStartTime: activeItemData.startTime || undefined,
          });
        }
      }
    }
    
    // Reset state
    setActiveId(null);
    setActiveItem(null);
    setOverDayId(null);
    setPreviewTimes(new Map());
    dragStateRef.current = null;
  }, [activeItem, flattenedItems, timeReorder]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !trip) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No trip itinerary found.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create a trip to get started!
        </p>
      </div>
    );
  }

  const mode = getTripMode(trip);
  
  // Format dates for display
  const startDate = new Date(trip.start_date + 'T00:00:00');
  const endDate = new Date(trip.end_date + 'T00:00:00');
  const dateRange = `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

  // Calculate overall progress
  const allActivities = days.flatMap(d => d.activities.filter(a => a.itemType === 'activity'));
  const completedCount = allActivities.filter(a => a.status === 'done').length;
  const totalCount = allActivities.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4 pb-20">
      <div className="text-center py-4">
        <h2 className="font-display text-2xl text-foreground">{trip.title}</h2>
        <p className="text-muted-foreground">{dateRange}</p>
        
        {/* Overall progress */}
        {totalCount > 0 && (
          <div className="mt-3 max-w-xs mx-auto">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Overall Progress</span>
              <span>{completedCount}/{totalCount} activities ({progressPercent}%)</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Trip mode indicator */}
        <div className="mt-2">
          {mode === 'pre' && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              Upcoming Trip
            </span>
          )}
          {mode === 'active' && (
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
              Trip in Progress
            </span>
          )}
          {mode === 'post' && (
            <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
              Trip Complete
            </span>
          )}
        </div>
        
        {/* View mode controls */}
        <div className="mt-4 flex flex-col items-center gap-3">
          {/* Today Mode Toggle - only during active trips */}
          <TodayModeToggle 
            isTodayMode={isTodayMode} 
            onToggle={toggleTodayMode}
            isActiveTrip={isActiveTrip}
          />
          
          {/* View Mode Toggle (Cards vs Timeline) */}
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setViewMode('cards')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                viewMode === 'cards'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutList className="w-4 h-4" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                viewMode === 'timeline'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Clock className="w-4 h-4" />
              <span>Timeline</span>
            </button>
          </div>

          {/* Chosen Only segmented toggle — only shown when the trip has registered picks */}
          {hasChosenItems && (
            <div
              className="flex items-center gap-1 p-1 bg-muted rounded-lg"
              role="group"
              aria-label="Filter workshop sessions"
            >
              <button
                onClick={() => setChosenOnly(false)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  !chosenOnly
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-pressed={!chosenOnly}
              >
                <span>All sessions</span>
              </button>
              <button
                onClick={() => setChosenOnly(true)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  chosenOnly
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-pressed={chosenOnly}
                title="Plenaries, meals, and worship still shown"
              >
                <Ticket className="w-4 h-4 fill-current" aria-hidden="true" />
                <span>My picks</span>
              </button>
            </div>
          )}
        </div>

        {/* A11Y-03: announce filter state changes to assistive tech */}
        <div role="status" aria-live="polite" className="sr-only">
          {chosenOnly
            ? `Showing ${chosenCount} registered workshop${chosenCount === 1 ? '' : 's'}; other workshop options hidden.`
            : 'Showing all sessions.'}
        </div>
      </div>
      
      {/* No content message for today mode */}
      {isTodayMode && !hasTodayContent && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No activities scheduled for today.</p>
          <button 
            onClick={toggleTodayMode}
            className="mt-2 text-sm text-primary hover:underline"
          >
            View full timeline
          </button>
        </div>
      )}
      
      {/* Day cards or timeline view wrapped in unified DndContext */}
      <DndContext
        /* BUG-04: disable drag in chosen-only view — the filtered list hides
           sibling items, so drop-position math would land items under hidden
           rows. Chosen-only is a read view. */
        sensors={chosenOnly ? [] : sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {viewMode === 'cards' ? (
          daysToRender.map((day) => (
            <DatabaseDayCard 
              key={day.id} 
              day={day}
              nextActivityId={nextPlannedActivity?.activityId}
              isReceivingDrag={overDayId === day.id && activeItem?.dayId !== day.id}
              previewTimes={previewTimes}
            />
          ))
        ) : (
          daysToRender.map((day) => (
            <div key={day.id} className="bg-card rounded-lg border p-4 shadow-warm">
              <h3 className="font-display text-lg mb-4">{day.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{day.dayOfWeek}, {day.date}</p>
              <TimelineView 
                day={day} 
                nextActivityId={nextPlannedActivity?.activityId}
              />
            </div>
          ))
        )}
        
        {/* Drag Overlay - shows dragged item */}
        <DragOverlay>
          {activeItem && (
            <div className="opacity-90 shadow-xl rounded-lg">
              <DatabaseActivityCard 
                activity={activeItem}
                previewTime={previewTimes.get(activeItem.id)}
                isDragging
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
      
      {/* Quick Add FAB */}
      <QuickAddButton />
    </div>
  );
}

export default DatabaseItineraryTab;
