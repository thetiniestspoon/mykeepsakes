

# Fix "Show on Map" Filter Functionality

## Problem Summary

When clicking "Show on Map" from the Details panel, the map filters don't update correctly to show the selected item's location.

---

## Root Causes Identified

### Issue 1: Timing - Focus Consumed Before Filters Applied

In `MapFilterHeader.tsx`, `onFocusConsumed()` is called immediately after setting state, but React's batched updates mean the `filteredLocations` memo hasn't recalculated yet.

```tsx
// Current flow (problematic):
useEffect(() => {
  if (focusedLocation) {
    setActiveCategories(...);  // State queued
    setActiveDays(...);        // State queued
    onFocusConsumed?.();       // Called IMMEDIATELY - focus cleared before filters apply
  }
}, [focusedLocation, onFocusConsumed]);
```

### Issue 2: Category Mapping Incomplete

The filter only handles `restaurant` → `dining` mapping, but the database shows other mismatches:
- `item_category: event` ↔ `location_category: activity`

The filter won't show a pin categorized as "activity" when the activity category is "event".

---

## Solution

### Fix 1: Delay Focus Consumption Until Filters Propagate

Use a separate effect to consume focus AFTER the filtered locations have been passed to the parent:

```tsx
// Track if we just applied focus filters
const justAppliedFocusRef = useRef(false);

// Effect 1: Apply filters from focused location
useEffect(() => {
  if (focusedLocation) {
    if (focusedLocation.category) {
      const cat = normalizeCategory(focusedLocation.category);
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

// Effect 2: Consume focus AFTER filters have propagated
useEffect(() => {
  if (justAppliedFocusRef.current && focusedLocation) {
    justAppliedFocusRef.current = false;
    onFocusConsumed?.();
  }
}, [filteredLocations, focusedLocation, onFocusConsumed]);
```

### Fix 2: Normalize More Categories

Add a helper function that maps database categories to filter categories:

```tsx
function normalizeCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    'restaurant': 'dining',
    // Add more mappings as needed based on database data
  };
  return categoryMap[category] || category;
}
```

### Fix 3: Ensure Day Filter Includes Location With Matching dayId

The filter logic at line 80-86 already correctly filters by dayId. However, we need to ensure the activity's `day_id` matches how locations store their `dayId`.

Currently in `use-database-itinerary.ts`:
```tsx
// Line 213: dayId comes from the first associated itinerary item
const item = (itemsQuery.data || []).find(i => i.location_id === loc.id);
// ...
dayId: item?.day_id,
```

If a location is used on multiple days, only the first day's ID is stored. We need to pass the **activity's day_id** through focusLocation, which we're already doing correctly.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/MapFilterHeader.tsx` | Split focus effect into two phases - apply then consume |

---

## Detailed Code Changes

### MapFilterHeader.tsx

```tsx
// Add ref to track focus application
const justAppliedFocusRef = useRef(false);

// Effect 1: Apply filters from focused location (remove onFocusConsumed dependency)
useEffect(() => {
  if (focusedLocation) {
    // Set category filter
    if (focusedLocation.category) {
      const cat = focusedLocation.category === 'restaurant' 
        ? 'dining' 
        : focusedLocation.category;
      setActiveCategories(new Set([cat as CategoryFilter]));
    } else {
      setActiveCategories(new Set(['all']));
    }
    
    // Set day filter
    if (focusedLocation.dayId) {
      setActiveDays(new Set([focusedLocation.dayId]));
    } else {
      setActiveDays(new Set(['all']));
    }
    
    // Mark that we just applied focus
    justAppliedFocusRef.current = true;
  }
}, [focusedLocation]); // Note: onFocusConsumed removed from deps

// Effect 2: Consume focus after filters have been applied and propagated
useEffect(() => {
  if (justAppliedFocusRef.current) {
    justAppliedFocusRef.current = false;
    // Small delay to ensure state has propagated
    requestAnimationFrame(() => {
      onFocusConsumed?.();
    });
  }
}, [filteredLocations, onFocusConsumed]);
```

---

## Technical Details

### Why Two Effects?

React batches state updates, so when we call `setActiveCategories()` and `setActiveDays()`, the `filteredLocations` useMemo hasn't recalculated yet. By splitting into two effects:

1. **First effect**: Sets filter state, marks that focus was applied
2. **Second effect**: Runs when `filteredLocations` changes (which happens after state updates), then consumes focus

This ensures the filters are actually applied before we clear the focus trigger.

### Order of Operations After Fix

1. User clicks "Show on Map" in ActivityDetail
2. `focusLocation({ id, category, dayId })` called - context state updated
3. `panMap()` called - sets pan target
4. `highlightPin()` called - marks pin for highlight  
5. `navigateToPanel(2)` called - switches to Map panel
6. MapFilterHeader receives `focusedLocation` via props
7. **Effect 1 fires**: Sets `activeCategories` and `activeDays` state, sets ref flag
8. React recalculates `filteredLocations` memo
9. **Effect that notifies parent fires**: `onFilteredLocationsChange(filteredLocations)`
10. **Effect 2 fires**: Sees ref flag is true, calls `onFocusConsumed()` via rAF
11. Map receives new filtered locations, redraws markers
12. Pan effect in RightColumn fires, map flies to target

---

## Testing Checklist

- Click "Show on Map" on a dining activity - verify filters update to show that category and day
- Click "Show on Map" on a beach activity - verify correct filtering
- Click "Show on Map" when already filtered to different category - verify filters change
- Test on mobile - verify panel navigation to map works
- Verify pin is highlighted after navigation

