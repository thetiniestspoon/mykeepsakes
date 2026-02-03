
# Codebase Improvement Plan

This plan addresses the technical debt, incomplete features, and improvement opportunities identified in the codebase review.

---

## Priority 1: Critical TODOs and Broken Handlers

### 1.1 Wire Up Edit/Delete Handlers in DatabaseDayCard

**File**: `src/components/itinerary/DatabaseDayCard.tsx`

The swipe menu exposes Edit, Delete, and Memory buttons that currently do nothing.

**Current Code (lines 288-348)**:
```tsx
onEdit={() => {/* TODO: Open editor */}}
onDelete={() => {/* TODO: Implement delete */}}
onAddPhoto={() => {
  // TODO: Open memory capture dialog
})
```

**Implementation**:
1. Add state for activity editor:
   ```tsx
   const [editorOpen, setEditorOpen] = useState(false);
   const [editingActivity, setEditingActivity] = useState<LegacyActivity | null>(null);
   ```

2. Add state for memory capture:
   ```tsx
   const [memoryCaptureOpen, setMemoryCaptureOpen] = useState(false);
   const [memoryTargetActivity, setMemoryTargetActivity] = useState<LegacyActivity | null>(null);
   ```

3. Import and use existing hooks:
   - `useDeleteItem()` from `use-itinerary.ts` for delete
   - Create new `DatabaseActivityEditor` component that works with the new schema

4. Wire up handlers:
   ```tsx
   onEdit={() => {
     setEditingActivity(activity);
     setEditorOpen(true);
   }}
   onDelete={() => deleteItem.mutate(activity.id)}
   onAddPhoto={() => {
     setMemoryTargetActivity(activity);
     setMemoryCaptureOpen(true);
   }}
   ```

5. Add the dialog components at the bottom of the component (before closing fragment).

---

### 1.2 Memory Capture from Completion Dialog

**File**: `src/components/itinerary/DatabaseDayCard.tsx`

When user marks activity complete and clicks "Add Photo" in the `MemoryPromptDialog`, it should open the memory capture dialog.

**Change**:
```tsx
<MemoryPromptDialog
  ...
  onAddPhoto={() => {
    setMemoryCaptureOpen(true);
    setMemoryTargetActivity(completedActivity);
  }}
/>
```

---

## Priority 2: Type Safety Improvements

### 2.1 Fix `any` Types in Hooks

**File**: `src/hooks/use-itinerary.ts` (line 110)

**Current**:
```tsx
const { location, ...dbUpdates } = updates as any;
```

**Fix**:
```tsx
const { location, ...dbUpdates } = updates as Omit<Partial<ItineraryItem>, 'id'>;
```

---

**File**: `src/hooks/use-memories.ts` (line 117)

**Current**:
```tsx
const { media, day, itinerary_item, location, ...dbUpdates } = updates as any;
```

**Fix**:
```tsx
type MemoryJoinedFields = 'media' | 'day' | 'itinerary_item' | 'location';
const { media, day, itinerary_item, location, ...dbUpdates } = updates as Omit<Partial<Memory>, MemoryJoinedFields>;
```

---

**File**: `src/hooks/use-sharing.ts` (line 111)

**Current**:
```tsx
return data as TripShareLink & { trip: any };
```

**Fix**:
Create proper type:
```tsx
import type { Trip } from '@/types/trip';

// At return:
return data as TripShareLink & { trip: Trip };
```

---

**File**: `src/components/itinerary/TimelineView.tsx` (line 11)

**Current**:
```tsx
onActivityClick?: (activity: any) => void;
```

**Fix**:
```tsx
import type { LegacyActivity } from '@/hooks/use-database-itinerary';

onActivityClick?: (activity: LegacyActivity) => void;
```

---

## Priority 3: Remove Debug Console Logs

### Files to Clean:

| File | Line | Content | Action |
|------|------|---------|--------|
| `src/hooks/use-leaflet-map.ts` | 42-46 | `logDebug` function and all calls | Remove debug mode entirely or gate behind `import.meta.env.DEV` |
| `src/components/photos/PhotoViewer.tsx` | 88 | `console.log('Share cancelled or failed')` | Remove (acceptable user action, not an error) |
| `src/hooks/use-itinerary.ts` | 97, 131, 213 | `console.error` in mutations | Keep - these are error cases worth logging |
| `src/hooks/use-memories.ts` | 104, 133, etc. | `console.error` in mutations | Keep - these are error cases |
| `src/hooks/use-database-itinerary.ts` | 172 | `console.error` | Keep - error case |

**For use-leaflet-map.ts**: Gate debug logging:
```tsx
const logDebug = useCallback((message: string, data?: unknown) => {
  if (import.meta.env.DEV && optionsRef.current.debug) {
    console.log(`[LeafletMap] ${message}`, data ?? '');
  }
}, []);
```

**For PhotoViewer.tsx**: Remove the log entirely:
```tsx
} catch (error) {
  // User cancelled share - this is expected behavior, no action needed
}
```

---

## Priority 4: Memory CRUD Completion

### 4.1 Delete Memory from Album Views

**Files to update**:
- `src/components/album/DayPhotoGrid.tsx`
- `src/components/album/PlacePhotoGrid.tsx`
- `src/components/album/RecentPhotoGrid.tsx`

**Implementation**:
Add long-press or delete button to photo thumbnails:

```tsx
import { useDeleteMemory } from '@/hooks/use-memories';

// In component:
const deleteMemory = useDeleteMemory();

// Add delete action to photo grid items
<button
  onClick={() => deleteMemory.mutate(memory.id)}
  className="absolute top-1 right-1 p-1 bg-destructive/80 rounded-full opacity-0 group-hover:opacity-100"
>
  <Trash2 className="w-3 h-3 text-white" />
</button>
```

### 4.2 Edit Memory Title/Note

**New component**: `src/components/album/MemoryEditDialog.tsx`

Simple dialog with:
- Title input
- Note textarea
- Save/Cancel buttons

Uses `useUpdateMemory()` hook which already exists.

---

## Priority 5: Activity Editor from Detail Panel

### File: `src/components/dashboard/DetailPanels/ActivityDetail.tsx`

**Add inline edit capability**:

1. Add Edit button to the icon action row:
```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={handleEdit}>
      <Pencil className="h-5 w-5" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Edit activity</TooltipContent>
</Tooltip>
```

2. Add state and dialog:
```tsx
const [editorOpen, setEditorOpen] = useState(false);

// Create new component: DatabaseActivityEditorSheet.tsx
// that works with ItineraryItem type (not legacy Activity)
```

---

## Priority 6: Test Coverage Foundation

### New Test Files to Create:

**File**: `src/test/hooks/use-trip.test.tsx`

Test critical trip selection logic:
```tsx
describe('useActiveTrip', () => {
  it('respects localStorage selection over date-based auto-select');
  it('falls back to date-based selection when localStorage trip deleted');
  it('returns active trip when dates span current date');
});
```

**File**: `src/test/hooks/use-accommodations.test.tsx`

Test accommodation CRUD:
```tsx
describe('useAccommodations', () => {
  it('orders by deprioritized then sort_order');
  it('useSelectAccommodation marks as selected');
  it('useReorderAccommodations updates sort_order in batch');
});
```

**File**: `src/test/components/DatabaseDayCard.test.tsx`

Test swipe interactions and status updates.

---

## Implementation Order

| Phase | Task | Effort |
|-------|------|--------|
| **Phase 1** | Wire up DatabaseDayCard TODOs | 2-3 hours |
| **Phase 2** | Fix type safety issues | 1 hour |
| **Phase 3** | Clean console logs | 30 min |
| **Phase 4** | Memory delete from album views | 1-2 hours |
| **Phase 5** | Activity edit from detail panel | 2-3 hours |
| **Phase 6** | Add core test coverage | 3-4 hours |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/itinerary/DatabaseDayCard.tsx` | Add editor, memory capture, delete handlers |
| `src/hooks/use-itinerary.ts` | Fix `any` type |
| `src/hooks/use-memories.ts` | Fix `any` type |
| `src/hooks/use-sharing.ts` | Fix `any` type |
| `src/hooks/use-leaflet-map.ts` | Gate debug logging behind DEV |
| `src/components/photos/PhotoViewer.tsx` | Remove console.log |
| `src/components/itinerary/TimelineView.tsx` | Add proper type for callback |
| `src/components/album/DayPhotoGrid.tsx` | Add delete action |
| `src/components/album/PlacePhotoGrid.tsx` | Add delete action |
| `src/components/album/RecentPhotoGrid.tsx` | Add delete action |
| `src/components/dashboard/DetailPanels/ActivityDetail.tsx` | Add edit button |

## New Files

| File | Purpose |
|------|---------|
| `src/components/itinerary/DatabaseActivityEditor.tsx` | New activity editor for database schema |
| `src/components/album/MemoryEditDialog.tsx` | Edit memory title/note |
| `src/test/hooks/use-trip.test.tsx` | Trip hook tests |
| `src/test/hooks/use-accommodations.test.tsx` | Accommodation hook tests |

---

## Deferred for Later

These items from the original list are lower priority and would be addressed in future iterations:

- **Guide section filtering** - Requires schema changes to categorize guide items
- **Offline mode** - Significant architecture change, needs service worker
- **Trip templates** - New feature, not fixing existing issues
- **Collaborative editing** - Requires authentication + real-time sync
- **Export improvements** - Enhancement, current export works
- **Keyboard shortcuts** - Nice-to-have polish
- **Onboarding flow** - UX enhancement
