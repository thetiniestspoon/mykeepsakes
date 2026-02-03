

# Fix Time-Based Drag System - Complete Bug Fix Plan

## Issues Summary

| # | Issue | Severity | Root Cause |
|---|-------|----------|------------|
| 1 | PreviewTime not passed through correctly | High | `DraggableActivity` receives `previewTime` but it's always undefined because parent doesn't pass it |
| 2 | DragOverlay missing isDragging and dragHandleProps | Medium | Overlay shows different UI than actual dragged card |
| 3 | Velocity startY hardcoded to 0 | Low | Works by accident due to cumulative delta approach |
| 4 | flattenedItems hook unused | Low | Dead code from previous implementation |
| 5 | Undo doesn't work | High | `originalDayId` and `originalStartTime` not passed to mutation |
| 6 | Sort index calculation naive | Medium | String comparison, null handling, unused helper function |
| 7 | No same-day drag feedback | Low | Visual feedback only for cross-day |
| 8 | Orphaned SortableContext | Low | Works if parent DndContext exists |
| 9 | Touch delay may feel slow | Low | 200ms could be 150ms |

---

## Fix 1: PreviewTime Flow (Critical)

**Problem**: `DraggableActivity` receives `previewTime` prop but the parent (`CompactDayCard`) passes preview time directly to `CompactActivityCard` child, not to `DraggableActivity`.

**Current flow (broken)**:
```
DashboardItinerary → previewTimes map
  ↓
CompactDayCard → previewTimes.get(activity.id) passed to CompactActivityCard
  ↓
DraggableActivity → receives NO previewTime, clones child with previewTime=undefined
  ↓
CompactActivityCard → receives previewTime from DraggableActivity (undefined)
```

**Fixed flow**:
```
DashboardItinerary → previewTimes map
  ↓
CompactDayCard → pass previewTime to DraggableActivity
  ↓
DraggableActivity → clones child with correct previewTime when isDragging
  ↓
CompactActivityCard → receives previewTime (correct)
```

**File: `src/components/dashboard/CompactDayCard.tsx`**

Change line 142-153:
```tsx
<DraggableActivity 
  key={activity.id} 
  id={activity.id} 
  originalTime={activity.rawStartTime || undefined}
>
  <CompactActivityCard
    activity={activity}
    dayId={day.id}
    isNextActivity={activity.id === nextActivityId}
    // REMOVE: previewTime={previewTimes?.get(activity.id)}
    // previewTime is now passed via DraggableActivity cloneElement
  />
</DraggableActivity>
```

**File: `src/components/dashboard/DashboardItinerary.tsx`**

The `DraggableActivity` component needs to receive the preview time. Update how we pass data:

Option A: Pass previewTime directly via context (cleaner)
Option B: Pass previewTime map to CompactDayCard, which passes individual times to DraggableActivity

Since dnd-kit's `useSortable` data doesn't support dynamic updates during drag, we need to use context or prop drilling.

**Solution**: Create a simple context for preview times OR pass the active preview time through DraggableActivity prop.

Actually, looking at `DraggableActivity.tsx` more closely - it accepts `previewTime` as a prop but we never pass it! The fix is simpler:

**File: `src/components/dashboard/CompactDayCard.tsx`**

Add a prop to get the active preview time for the currently dragging item:
```tsx
interface CompactDayCardProps {
  day: LegacyDay;
  nextActivityId?: string | null;
  isToday?: boolean;
  isReceivingDrag?: boolean;
  previewTimes?: Map<string, string>;
  activeItemId?: string | null;  // NEW: to know which item is being dragged
}

// In the mapping:
<DraggableActivity 
  key={activity.id} 
  id={activity.id} 
  originalTime={activity.rawStartTime || undefined}
  previewTime={previewTimes?.get(activity.id)}  // ADD THIS
>
  <CompactActivityCard
    activity={activity}
    dayId={day.id}
    isNextActivity={activity.id === nextActivityId}
  />
</DraggableActivity>
```

Wait, looking at `DraggableActivity` again (line 21-28):
```tsx
const childrenWithProps = React.isValidElement(children)
  ? React.cloneElement(children as React.ReactElement, {
      previewTime: isDragging ? previewTime : undefined,  // Uses the previewTime PROP
      isDragging,
      dragHandleProps: disabled ? undefined : { ...attributes, ...listeners },
    })
  : children;
```

So the fix is to pass `previewTime` TO `DraggableActivity` in `CompactDayCard.tsx`:

```tsx
<DraggableActivity 
  key={activity.id} 
  id={activity.id} 
  originalTime={activity.rawStartTime || undefined}
  previewTime={previewTimes?.get(activity.id)}  // ADD
>
```

And remove the duplicate from CompactActivityCard (line 151):
```tsx
<CompactActivityCard
  activity={activity}
  dayId={day.id}
  isNextActivity={activity.id === nextActivityId}
  // previewTime removed - now comes from DraggableActivity
/>
```

---

## Fix 2: DragOverlay Props

**Problem**: DragOverlay renders `CompactActivityCard` but without `isDragging=true` or `dragHandleProps`, making it look different.

**File: `src/components/dashboard/DashboardItinerary.tsx`**

Update lines 258-268:
```tsx
<DragOverlay>
  {activeItem && (
    <div className="opacity-90 shadow-lg rounded-md">
      <CompactActivityCard
        activity={activeItem}
        dayId={activeItem.dayId}
        previewTime={previewTimes.get(activeItem.id)}
        isDragging={true}  // ADD
        // dragHandleProps intentionally omitted - overlay doesn't need functional handle
      />
    </div>
  )}
</DragOverlay>
```

---

## Fix 3: Velocity startY Calculation

**Problem**: `createDragState` is called with `startY = 0` (line 91), but dnd-kit's `event.delta.y` is cumulative from drag start, so this works by accident.

**File: `src/components/dashboard/DashboardItinerary.tsx`**

Line 91 is correct as-is because dnd-kit's delta is already relative to start. The `startY` parameter exists for absolute position tracking, but since we use cumulative deltas, passing 0 is actually correct.

**However**, the naming is confusing. Update `time-drag-modifier.ts` for clarity:

**File: `src/lib/time-drag-modifier.ts`**

Add clarifying comment to `createDragState`:
```tsx
/**
 * Create initial drag state
 * @param originalTime - The activity's original start time in "HH:mm:ss" format
 * @param startY - Initial Y position (use 0 when using cumulative deltas like dnd-kit's event.delta.y)
 */
export function createDragState(originalTime: string, startY: number): TimeDragState {
```

And update `updateDragState` to work correctly with cumulative deltas:
```tsx
/**
 * Update drag state with new position
 * @param state - Current drag state
 * @param currentY - Current cumulative Y delta from drag start (e.g., event.delta.y)
 */
export function updateDragState(
  state: TimeDragState,
  currentY: number
): TimeDragState {
```

Actually, there's a bug in velocity calculation! Line 130:
```tsx
const yDelta = currentY - state.lastY;
```

When `currentY` is cumulative delta (like `event.delta.y`), and `state.lastY` is also cumulative delta, then `yDelta` is the delta between two cumulative values, which is correct for velocity.

But `totalDelta` on line 136 uses `currentY - state.startY`, and since `startY` is 0, this equals `currentY` - which is the cumulative delta. This is correct!

**Conclusion**: The code works correctly but naming is confusing. Low priority to clarify comments.

---

## Fix 4: Remove Unused flattenedItems

**File: `src/components/dashboard/DashboardItinerary.tsx`**

Remove lines 19 and 48:
```tsx
// Remove: import { useFlattenedItinerary } from '@/hooks/use-flattened-itinerary';
// Remove: const flattenedItems = useFlattenedItinerary(days);
```

---

## Fix 5: Fix Undo Functionality (Critical)

**Problem**: `timeReorder.mutate()` is called without `originalDayId` and `originalStartTime`, so the undo data is incomplete.

**File: `src/components/dashboard/DashboardItinerary.tsx`**

Update lines 179-186:
```tsx
if (timeChanged || dayChanged) {
  timeReorder.mutate({
    itemId: activeId,
    newDayId: targetDayId,
    newStartTime: newTime,
    newSortIndex,
    originalDayId: activeItem.dayId,          // ADD
    originalStartTime: activeItem.rawStartTime || undefined,  // ADD
  });
}
```

---

## Fix 6: Improve Sort Index Calculation

**Problem**: Current sort index calculation (lines 161-172) is naive - uses string comparison for times and doesn't use the helper function.

**File: `src/components/dashboard/DashboardItinerary.tsx`**

Replace lines 160-173 with improved logic using `calculateSortIndexForPosition`:

```tsx
import { calculateSortIndexForPosition } from '@/hooks/use-time-based-reorder';

// In handleDragEnd:
const targetDay = days.find(d => d.id === targetDayId);
let newSortIndex = 0;

if (targetDay) {
  // Filter out the moving item and map to sortable format
  const otherActivities = targetDay.activities
    .filter(a => a.id !== activeId)
    .map((a, idx) => ({
      id: a.id,
      sortIndex: idx,  // Use array index as proxy if no explicit sort_index
      rawStartTime: a.rawStartTime,
    }));
  
  // Find insertion position based on new time
  let insertionIndex = 0;
  for (let i = 0; i < otherActivities.length; i++) {
    const actTime = otherActivities[i].rawStartTime;
    // Handle null times - items without time go at end
    if (!newTime && actTime) {
      // New item has no time, existing has time -> insert after
      insertionIndex = i + 1;
    } else if (newTime && actTime && newTime > actTime) {
      // Both have times, new time is later -> insert after
      insertionIndex = i + 1;
    } else if (newTime && !actTime) {
      // New has time, existing doesn't -> new comes first
      break;
    }
  }
  
  newSortIndex = calculateSortIndexForPosition(
    otherActivities.map(a => ({ id: a.id, sortIndex: a.sortIndex })),
    insertionIndex
  );
}
```

---

## Fix 7: Add Same-Day Drag Feedback

**Problem**: `isReceivingDrag` is only true when dragging TO a different day, not within the same day.

**File: `src/components/dashboard/DashboardItinerary.tsx`**

Update line 242:
```tsx
// Current:
const isReceivingDrag = overDayId === day.id && activeItem?.dayId !== day.id;

// New - show feedback when this day is the target (regardless of source):
const isReceivingDrag = activeItem !== null && overDayId === day.id;
```

This will show the visual feedback whenever an item is being dragged over a day, even if it started from that same day.

---

## Fix 8: Touch Sensor Tuning

**File: `src/components/dashboard/DashboardItinerary.tsx`**

Update line 57:
```tsx
useSensor(TouchSensor, {
  activationConstraint: { delay: 150, tolerance: 5 },  // Changed from 200 to 150
})
```

---

## Files Summary

| File | Changes |
|------|---------|
| `src/components/dashboard/CompactDayCard.tsx` | Pass `previewTime` to `DraggableActivity`, remove from `CompactActivityCard` |
| `src/components/dashboard/DashboardItinerary.tsx` | Remove unused import, add `isDragging` to overlay, pass undo data to mutation, fix sort index calculation, improve same-day feedback, tune touch delay |
| `src/lib/time-drag-modifier.ts` | Add clarifying comments (optional) |
| `src/hooks/use-time-based-reorder.ts` | No changes needed - already supports undo |

---

## Implementation Order

1. **Fix 1** (previewTime flow) - Critical for time preview to work
2. **Fix 5** (undo data) - Critical for undo to work
3. **Fix 2** (overlay props) - Medium, visual consistency
4. **Fix 6** (sort index) - Medium, edge case handling
5. **Fix 7** (same-day feedback) - Low, UX polish
6. **Fix 4** (dead code) - Low, cleanup
7. **Fix 8** (touch delay) - Low, UX tuning
8. **Fix 3** (comments) - Optional, documentation

---

## Testing Checklist

After implementation:
- [ ] Drag an activity and verify time updates in real-time on the card
- [ ] Drop and verify "Undo" button appears in toast
- [ ] Click Undo and verify activity returns to original position/time
- [ ] Drag within same day - verify day card shows visual feedback
- [ ] Drag to different day - verify both days show appropriate feedback
- [ ] Test on mobile - verify 150ms delay feels responsive
- [ ] Verify DragOverlay shows drag handle styled consistently

