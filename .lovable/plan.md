
# Fix Map Filter Sync When Navigating from Activity Cards

## Problem Identified

When the user taps the map button on an activity card:
1. The map panel opens correctly
2. The pin is highlighted (via `highlightPin`)
3. **BUT** the filter adjustment doesn't happen

### Root Cause

The `MapFilterHeader` component only renders when `isFilterCollapsed === false` (see line 295 in `RightColumn.tsx`). When filters are collapsed:
- The `focusedLocation` prop is never passed to `MapFilterHeader`
- No filter logic runs
- The targeted pin may be filtered out entirely

---

## Solution

When a `focusedLocation` is set from navigation (like the activity card's map button), **automatically expand the filter header** so it can process the focus and apply the correct filters.

---

## Implementation

### File: `src/components/dashboard/RightColumn.tsx`

Add an effect that auto-expands filters when `focusedLocation` is set:

```typescript
// Auto-expand filters when a location focus is requested
// This ensures the MapFilterHeader can process the focusedLocation
useEffect(() => {
  if (focusedLocation && isFilterCollapsed) {
    setIsFilterCollapsed(false);
    // Don't persist to localStorage - this is temporary for viewing the focused item
  }
}, [focusedLocation, isFilterCollapsed]);
```

This ensures:
1. When `focusedLocation` arrives from context, collapsed filters auto-expand
2. `MapFilterHeader` mounts and receives the `focusedLocation` prop
3. `MapFilterHeader`'s existing logic applies the category/day filters
4. The targeted pin becomes visible and highlighted

---

## Alternative Considered

Another approach would be to handle filtering in `RightColumn` when collapsed. However, this would duplicate the filter logic already in `MapFilterHeader`. Auto-expanding is simpler and maintains the single source of truth for filtering.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/RightColumn.tsx` | Add `useEffect` to auto-expand filters when `focusedLocation` is set |

---

## Expected Behavior After Fix

1. User taps map button on "Breakfast at Beach Café" activity
2. Map panel slides into view
3. Filter header automatically expands (if it was collapsed)
4. Filters adjust to show the matching category and day
5. Map pans to the location
6. Pin is highlighted with pulse animation
