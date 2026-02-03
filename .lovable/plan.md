
# Time-Based Itinerary Drag Implementation Plan

## Executive Summary

Transform the position-based drag-and-drop reordering into a time-based drag system where vertical movement adjusts start times with velocity-sensitive increments, enabling cross-day movement.

---

## Current Architecture

The existing implementation has:
- **Isolated DndContext per day**: Each `DatabaseDayCard` wraps its activities in its own `DndContext`, limiting drag to within a single day
- **Sort-index based reordering**: `useReorderDayItems` updates `sort_index` values after drag
- **Time stored separately**: `start_time` and `end_time` in database, formatted via `formatTime()` for display
- **LegacyActivity interface**: Includes `rawStartTime` and `rawEndTime` for access to raw database values

---

## Implementation Phases

### Phase 1: Tap Interactions (Quick Win)
Make time/title clickable to open activity details in the center panel.

**File: `src/components/itinerary/DatabaseActivityCard.tsx`**

Add clickable region for time and title:
```tsx
// Add prop for selecting activity
interface DatabaseActivityCardProps {
  activity: LegacyActivity;
  onSelect?: () => void;  // NEW
  onOpenMap?: ...
}

// Wrap time/title in clickable div
<div 
  onClick={onSelect}
  className={cn(
    "flex-1 min-w-0",
    onSelect && "cursor-pointer hover:bg-muted/30 rounded-md -mx-1 px-1 py-0.5 transition-colors"
  )}
>
  {/* category badge, time, title */}
</div>
```

**File: `src/components/itinerary/DatabaseDayCard.tsx`**

Wire up selection via `useDashboardSelection`:
```tsx
const { setSelectedActivity } = useDashboardSelection();

<DatabaseActivityCard 
  activity={activity}
  onSelect={() => setSelectedActivity(activity)}
  ...
/>
```

---

### Phase 2: Drag Handle Redesign
Make the drag handle always visible for better affordance.

**File: `src/components/itinerary/DraggableActivity.tsx`**

Current: Handle hidden, appears on hover  
New: Always visible on left edge with subtle styling

```tsx
<button
  className={cn(
    "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 p-1",
    "text-muted-foreground/50 hover:text-muted-foreground",
    "cursor-grab active:cursor-grabbing touch-none",
    "transition-colors"  // Remove opacity transition, keep color
  )}
  {...attributes}
  {...listeners}
  aria-label="Drag to reorder"
>
  <GripVertical className="w-4 h-4" />
</button>
```

---

### Phase 3: Lift DndContext to Parent Level
Enable cross-day dragging by unifying the drag context.

**File: `src/components/DatabaseItineraryTab.tsx`**

Add unified DndContext wrapping all days:

```tsx
import { DndContext, DragOverlay, DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';

const [activeId, setActiveId] = useState<string | null>(null);
const [activeItem, setActiveItem] = useState<LegacyActivity | null>(null);
const [overDayId, setOverDayId] = useState<string | null>(null);

const allItems = useMemo(() => 
  days.flatMap(day => day.activities.map(a => ({
    ...a,
    dayId: day.id,
    dayDate: day.date
  }))),
  [days]
);

function handleDragStart(event: DragStartEvent) {
  const item = allItems.find(a => a.id === event.active.id);
  setActiveId(String(event.active.id));
  setActiveItem(item || null);
}

function handleDragOver(event: DragOverEvent) {
  // Detect which day we're over
  const overId = event.over?.id;
  // ... determine target day
}

function handleDragEnd(event: DragEndEvent) {
  // Calculate new time and day based on drop position
  // Call timeReorder mutation
}

return (
  <DndContext
    sensors={sensors}
    onDragStart={handleDragStart}
    onDragOver={handleDragOver}
    onDragEnd={handleDragEnd}
  >
    {daysToRender.map(day => (
      <DatabaseDayCard 
        key={day.id} 
        day={day}
        isReceivingDrag={overDayId === day.id && activeItem?.dayId !== day.id}
      />
    ))}
    
    <DragOverlay>
      {activeItem && <DraggedActivityPreview activity={activeItem} />}
    </DragOverlay>
  </DndContext>
);
```

**File: `src/components/itinerary/DatabaseDayCard.tsx`**

Remove internal DndContext, keep SortableContext:

```tsx
// Remove: <DndContext> wrapper
// Keep: <SortableContext items={day.activities.map(a => a.id)}>

// Add receiving state prop
interface DatabaseDayCardProps {
  day: LegacyDay;
  isReceivingDrag?: boolean;  // NEW
}

// Add visual indication when receiving
<Card className={cn(
  "shadow-warm overflow-hidden",
  isReceivingDrag && "ring-2 ring-dashed ring-primary/50 bg-primary/5"
)}>
```

---

### Phase 4: Flattened Item List Hook
Create utility for unified item management across days.

**File: `src/hooks/use-flattened-itinerary.ts` (NEW)**

```tsx
export interface FlattenedItem {
  id: string;
  dayId: string;
  dayDate: string;      // ISO date "2026-07-15"
  dayIndex: number;     // Day position (0-based)
  startTime: string | null;  // "HH:mm:ss" or null
  endTime: string | null;
  sortIndex: number;
  globalIndex: number;  // Position across ALL items
  title: string;
  category: string;
}

export function useFlattenedItinerary(days: LegacyDay[]): FlattenedItem[] {
  return useMemo(() => {
    let globalIdx = 0;
    return days.flatMap((day, dayIndex) => 
      day.activities.map(activity => ({
        id: activity.id,
        dayId: day.id,
        dayDate: extractISODate(day.date),  // Parse formatted date back to ISO
        dayIndex,
        startTime: activity.rawStartTime || null,
        endTime: activity.rawEndTime || null,
        sortIndex: globalIdx,
        globalIndex: globalIdx++,
        title: activity.title,
        category: activity.category,
      }))
    );
  }, [days]);
}
```

---

### Phase 5: Velocity-Sensitive Time Drag
Track drag velocity to determine time increment granularity.

**File: `src/lib/time-drag-modifier.ts` (NEW)**

```tsx
export interface TimeDragState {
  startY: number;
  lastY: number;
  lastTimestamp: number;
  velocity: number;       // px/ms
  accumulatedDelta: number;
  currentTime: string;    // Preview time during drag
  originalTime: string;
}

const PIXELS_PER_MINUTE_SLOW = 8;   // Slow drag: 8px = 1 min
const PIXELS_PER_MINUTE_FAST = 24;  // Fast drag: 24px = 1 min

export function calculateTimeIncrement(velocity: number): number {
  const absVelocity = Math.abs(velocity);
  if (absVelocity < 0.3) return 5;   // Slow: 5-min increments
  if (absVelocity < 0.8) return 15;  // Medium: 15-min increments
  return 30;                          // Fast: 30-min increments
}

export function calculateNewTime(
  originalTime: string,
  deltaY: number,
  velocity: number
): string {
  const increment = calculateTimeIncrement(velocity);
  const pixelsPerIncrement = velocity < 0.3 ? PIXELS_PER_MINUTE_SLOW * increment : PIXELS_PER_MINUTE_FAST;
  
  const steps = Math.floor(Math.abs(deltaY) / pixelsPerIncrement);
  const direction = deltaY < 0 ? -1 : 1;  // Up = earlier, Down = later
  const minutesDelta = steps * increment * direction;
  
  return addMinutesToTime(originalTime, minutesDelta);
}

export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m, s] = time.split(':').map(Number);
  let totalMinutes = h * 60 + m + minutes;
  
  // Clamp to 00:00 - 23:59
  totalMinutes = Math.max(0, Math.min(23 * 60 + 59, totalMinutes));
  
  const newH = Math.floor(totalMinutes / 60);
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}:${String(s || 0).padStart(2, '0')}`;
}
```

---

### Phase 6: Live Time Preview During Drag
Update the activity's displayed time in real-time during drag.

**File: `src/components/itinerary/DraggableActivity.tsx`**

Extend to track velocity and expose preview time:

```tsx
interface DraggableActivityProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
  originalTime?: string;
  onTimePreview?: (previewTime: string | null) => void;
}

export function DraggableActivity({ 
  id, 
  children, 
  disabled, 
  originalTime,
  onTimePreview 
}: DraggableActivityProps) {
  const dragState = useRef<TimeDragState | null>(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id, 
    disabled,
    // Custom data for time tracking
    data: { originalTime }
  });
  
  // Track velocity during drag
  useEffect(() => {
    if (isDragging && transform) {
      // Update preview time based on Y delta
      const newTime = calculateNewTime(originalTime, transform.y, dragState.current?.velocity || 0);
      onTimePreview?.(newTime);
    } else {
      onTimePreview?.(null);
    }
  }, [isDragging, transform?.y]);
  
  // Render children with cloned time prop
  const childrenWithPreview = React.cloneElement(children as React.ReactElement, {
    previewTime: isDragging ? previewTime : undefined
  });
  
  return (
    <div ref={setNodeRef} style={style} className={cn(...)}>
      {/* drag handle */}
      {childrenWithPreview}
    </div>
  );
}
```

**File: `src/components/itinerary/DatabaseActivityCard.tsx`**

Accept and display preview time:

```tsx
interface DatabaseActivityCardProps {
  activity: LegacyActivity;
  previewTime?: string;  // NEW: formatted time during drag
  ...
}

// In render:
{(previewTime || activity.time) && (
  <span className={cn(
    "text-sm",
    previewTime ? "text-primary font-medium" : "text-muted-foreground"
  )}>
    {previewTime || activity.time}
  </span>
)}
```

---

### Phase 7: Time-Based Persistence
Update the mutation to save new day and time after drag.

**File: `src/hooks/use-time-based-reorder.ts` (NEW)**

```tsx
export interface TimeReorderPayload {
  itemId: string;
  newDayId: string;
  newStartTime: string;  // "HH:mm:ss"
  newSortIndex: number;
}

export function useTimeBasedReorder() {
  const queryClient = useQueryClient();
  const { data: trip } = useActiveTrip();
  
  return useMutation({
    mutationFn: async (payload: TimeReorderPayload) => {
      // Calculate end time (preserve duration if known)
      const { data: item } = await supabase
        .from('itinerary_items')
        .select('start_time, end_time')
        .eq('id', payload.itemId)
        .single();
      
      let newEndTime: string | null = null;
      if (item?.start_time && item?.end_time) {
        const duration = timeDifferenceInMinutes(item.start_time, item.end_time);
        newEndTime = addMinutesToTime(payload.newStartTime, duration);
      }
      
      const { error } = await supabase
        .from('itinerary_items')
        .update({
          day_id: payload.newDayId,
          start_time: payload.newStartTime,
          end_time: newEndTime,
          sort_index: payload.newSortIndex,
        })
        .eq('id', payload.itemId);
      
      if (error) throw error;
    },
    onMutate: async (payload) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['all-itinerary-items', trip?.id] });
      const previous = queryClient.getQueryData(['all-itinerary-items', trip?.id]);
      
      queryClient.setQueryData(['all-itinerary-items', trip?.id], (old: ItineraryItem[]) => 
        old.map(item => item.id === payload.itemId ? {
          ...item,
          day_id: payload.newDayId,
          start_time: payload.newStartTime,
          sort_index: payload.newSortIndex
        } : item)
      );
      
      return { previous };
    },
    onError: (err, payload, context) => {
      queryClient.setQueryData(['all-itinerary-items', trip?.id], context?.previous);
      toast.error('Failed to move activity');
    },
    onSuccess: () => {
      // Show undo toast
      toast.success('Activity moved', {
        action: {
          label: 'Undo',
          onClick: () => {/* revert mutation */}
        }
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['all-itinerary-items', trip?.id] });
    }
  });
}
```

---

### Phase 8: Cross-Day Visual Feedback
Add "drawer opening" animation when dragging to a different day.

**File: `src/index.css`**

Add new animations:
```css
@keyframes day-expand {
  from { 
    transform: scaleY(1);
    border-style: solid;
  }
  to { 
    transform: scaleY(1.02);
    border-style: dashed;
  }
}

.day-receiving-drag {
  animation: day-expand 200ms ease-out forwards;
  border-color: hsl(var(--primary) / 0.5);
  background-color: hsl(var(--primary) / 0.03);
}
```

**File: `tailwind.config.ts`**

Add animation definition:
```ts
keyframes: {
  // ... existing
  "day-expand": {
    "0%": { transform: "scaleY(1)" },
    "100%": { transform: "scaleY(1.02)" },
  },
},
animation: {
  // ... existing
  "day-expand": "day-expand 0.2s ease-out forwards",
}
```

---

### Phase 9: Map Button Redesign
Make the map button more prominent.

**File: `src/components/itinerary/DatabaseActivityCard.tsx`**

Update map button to be a filled, circular button:

```tsx
{activity.location && onOpenMap && (
  <button
    onClick={() => onOpenMap({...})}
    className={cn(
      "w-8 h-8 rounded-full flex items-center justify-center",
      "bg-accent/10 text-accent hover:bg-accent/20",
      "transition-colors shadow-sm"
    )}
    aria-label="Show on map"
  >
    <MapPin className="w-4 h-4" />
  </button>
)}
```

---

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/DatabaseItineraryTab.tsx` | MODIFY | Add unified DndContext, drag overlay |
| `src/components/itinerary/DatabaseDayCard.tsx` | MODIFY | Remove internal DndContext, add receiving state |
| `src/components/itinerary/DraggableActivity.tsx` | MODIFY | Always-visible handle, velocity tracking, time preview |
| `src/components/itinerary/DatabaseActivityCard.tsx` | MODIFY | Clickable time/title, map button redesign, preview time display |
| `src/hooks/use-flattened-itinerary.ts` | CREATE | Unified item list across days |
| `src/hooks/use-time-based-reorder.ts` | CREATE | Time-aware mutation with optimistic updates |
| `src/lib/time-drag-modifier.ts` | CREATE | Velocity calculation and time math |
| `src/index.css` | MODIFY | Add day-expand animation |
| `tailwind.config.ts` | MODIFY | Add animation keyframe |

---

## Implementation Order

| Priority | Phase | Effort | Risk |
|----------|-------|--------|------|
| 1 | Tap Interactions (Phase 1) | 1hr | Low |
| 2 | Drag Handle (Phase 2) | 30min | Low |
| 3 | Unified DndContext (Phase 3) | 2hr | Medium |
| 4 | Flattened Hook (Phase 4) | 1hr | Low |
| 5 | Velocity Drag (Phase 5-6) | 3hr | Medium |
| 6 | Persistence (Phase 7) | 2hr | Medium |
| 7 | Cross-Day Visuals (Phase 8) | 1hr | Low |
| 8 | Map Button (Phase 9) | 30min | Low |

---

## Open Design Decisions (Pre-Resolved)

| Question | Decision |
|----------|----------|
| Time preview position | Update time in the item itself as it drags |
| Velocity thresholds | Start with 0.3/0.8 px/ms, tune based on testing |
| Stack limit for overlaps | None - keep all visible with offset |
| Undo support | Yes - show "Undo" action in success toast |

---

## Testing Checklist

After implementation:
- [ ] Tap activity title opens details in center panel
- [ ] Drag handle is visible without hovering
- [ ] Dragging up/down changes the displayed time in real-time
- [ ] Slow drag = 5-min increments, fast = 30-min increments
- [ ] Dragging to another day shows visual feedback
- [ ] Drop updates both day_id and start_time in database
- [ ] Undo toast appears and works after move
- [ ] Cross-day drag works on mobile (touch)
