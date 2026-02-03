

# Integrate Time-Based Drag Into Dashboard

## Problem Identified

The **Time-Based Itinerary Drag** system was implemented in `DatabaseItineraryTab.tsx`, but this component is **not currently used anywhere in the app**. 

The main dashboard (`Index.tsx`) renders:
- `LeftColumn` → `DashboardItinerary` → `CompactDayCard` → `CompactActivityCard`

This is a separate, compact view designed for the dashboard's left column. It displays activities but has no drag-and-drop functionality.

---

## Two Integration Options

### Option A: Replace Compact View with Full Itinerary Tab

Replace `DashboardItinerary` with `DatabaseItineraryTab` in the left column.

**Pros:**
- All the new drag functionality immediately available
- Single source of truth for itinerary UI

**Cons:**
- `DatabaseItineraryTab` was designed as a full-page view, not a compact column
- May have layout/scrolling issues in the narrow left column
- Progress header, view mode toggles, etc. may be too large

---

### Option B: Add Drag Functionality to Compact View (Recommended)

Keep the compact dashboard design but wire in the time-based drag system.

**Changes Required:**

#### 1. Lift DndContext to DashboardItinerary

**File: `src/components/dashboard/DashboardItinerary.tsx`**

Add unified `DndContext` wrapping all `CompactDayCard` components:

```tsx
import { DndContext, DragOverlay, DragStartEvent, DragMoveEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { useFlattenedItinerary } from '@/hooks/use-flattened-itinerary';
import { useTimeBasedReorder } from '@/hooks/use-time-based-reorder';
import { createDragState, updateDragState, formatTimeForDisplay } from '@/lib/time-drag-modifier';

// Add state for drag tracking
const [activeId, setActiveId] = useState<string | null>(null);
const [activeItem, setActiveItem] = useState<LegacyActivity | null>(null);
const [overDayId, setOverDayId] = useState<string | null>(null);
const [previewTimes, setPreviewTimes] = useState<Map<string, string>>(new Map());
const dragStateRef = useRef<TimeDragState | null>(null);

// Use flattened items and reorder mutation
const flattenedItems = useFlattenedItinerary(days);
const timeReorder = useTimeBasedReorder();

// Wrap existing content with DndContext
<DndContext
  sensors={sensors}
  onDragStart={handleDragStart}
  onDragMove={handleDragMove}
  onDragOver={handleDragOver}
  onDragEnd={handleDragEnd}
>
  {/* existing day cards */}
  <DragOverlay>...</DragOverlay>
</DndContext>
```

#### 2. Add Sortable Wrapper to CompactActivityCard

**File: `src/components/dashboard/CompactDayCard.tsx`**

Add `SortableContext` for activities within each day:

```tsx
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DraggableActivity } from '@/components/itinerary/DraggableActivity';

<CollapsibleContent>
  <SortableContext items={day.activities.map(a => a.id)} strategy={verticalListSortingStrategy}>
    <div className="p-2 space-y-1">
      {day.activities.map((activity) => (
        <DraggableActivity key={activity.id} id={activity.id} originalTime={activity.rawStartTime}>
          <CompactActivityCard
            activity={activity}
            dayId={day.id}
            isNextActivity={activity.id === nextActivityId}
            previewTime={previewTimes?.get(activity.id)}
          />
        </DraggableActivity>
      ))}
    </div>
  </SortableContext>
</CollapsibleContent>
```

#### 3. Add Props to CompactDayCard

**File: `src/components/dashboard/CompactDayCard.tsx`**

Add receiving state and preview times:

```tsx
interface CompactDayCardProps {
  day: LegacyDay;
  nextActivityId?: string | null;
  isToday?: boolean;
  isReceivingDrag?: boolean;         // NEW
  previewTimes?: Map<string, string>; // NEW
}

// Visual feedback when receiving drag
<div className={cn(
  "rounded-lg border bg-card overflow-hidden",
  isToday && "ring-2 ring-primary",
  isReceivingDrag && "ring-2 ring-dashed ring-primary/50 animate-day-expand"
)}>
```

#### 4. Update CompactActivityCard for Preview Time

**File: `src/components/dashboard/CompactActivityCard.tsx`**

Accept and display preview time during drag:

```tsx
interface CompactActivityCardProps {
  activity: LegacyActivity;
  dayId: string;
  isNextActivity?: boolean;
  previewTime?: string;  // NEW
}

// Display preview time with highlight
{(previewTime || activity.time) && (
  <span className={cn(
    "text-xs",
    previewTime ? "text-primary font-medium" : "text-muted-foreground"
  )}>
    {previewTime || activity.time}
  </span>
)}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/DashboardItinerary.tsx` | Add unified DndContext, drag handlers, velocity tracking |
| `src/components/dashboard/CompactDayCard.tsx` | Add SortableContext, DraggableActivity wrapper, receiving state |
| `src/components/dashboard/CompactActivityCard.tsx` | Accept previewTime prop, display with highlight |

---

## Implementation Notes

1. **Reuse existing hooks** - The `useFlattenedItinerary`, `useTimeBasedReorder`, and `time-drag-modifier` utilities created for `DatabaseItineraryTab` work perfectly here

2. **Compact drag handle** - The existing `DraggableActivity` component already has the always-visible handle design; it just needs to wrap `CompactActivityCard` instead of `DatabaseActivityCard`

3. **Smaller visual scale** - The compact cards are already smaller, so the drag interactions will feel proportionally the same

4. **Cross-day movement** - Works identically since the logic is in the parent `DndContext`

---

## Alternative: Keep Both Views

If you want BOTH the compact dashboard view AND a full itinerary view:

1. Add a "View Full Itinerary" button/link in the dashboard
2. Create a route or modal that shows `DatabaseItineraryTab`
3. Keep drag-and-drop only in the full view

This would require less immediate work but means users have two places to manage their itinerary.

---

## Recommendation

**Option B** - Add drag to the compact dashboard view. This:
- Uses the existing dashboard layout users are familiar with
- Leverages all the hooks and utilities already created
- Provides a consistent experience without navigation

