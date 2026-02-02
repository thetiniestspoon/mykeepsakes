
# "Show on Map" - Set Filters to Show Target Location

This plan changes the behavior from "reset all filters to All" to "set filters specifically to the location's category and day" so only the target pin is shown on the map.

---

## Current vs. Desired Behavior

| Current | Desired |
|---------|---------|
| Click "Show on Map" → filters reset to "All" → all pins visible | Click "Show on Map" → filters set to that item's category + day → only that pin (and similar) visible |

---

## Solution

Instead of just passing `locationId`, we pass the location's category and dayId through the context. The `MapFilterHeader` then sets both filters to those specific values.

```text
ActivityDetail                       Context                          MapFilterHeader
┌─────────────────┐                                                  ┌─────────────────┐
│  [Show on Map]  │                                                  │                 │
│                 │─────▶ focusLocation({              focusedLoc ──▶│  Set category   │
│  category:      │         id: "abc",              ──────────────▶ │  to "dining"    │
│    "dining"     │         category: "dining",                      │                 │
│  day_id: "xyz"  │         dayId: "xyz"                             │  Set day to     │
│                 │       })                                         │  "xyz"          │
└─────────────────┘                                                  └─────────────────┘
```

---

## Key Changes

### 1. Extend Context State

Change from a single `focusedLocationId: string` to a richer focus object:

```tsx
interface FocusedLocation {
  id: string;
  category?: string;  // e.g., "dining", "beach", "activity"
  dayId?: string;     // e.g., "day-uuid-123"
}

interface DashboardSelectionState {
  // ...existing
  focusedLocation: FocusedLocation | null;  // Changed from focusedLocationId
}

interface DashboardSelectionActions {
  // ...existing
  focusLocation: (focus: FocusedLocation) => void;  // Now accepts object
  clearLocationFocus: () => void;
}
```

### 2. Update MapFilterHeader

When `focusedLocation` is set, apply specific filters:

```tsx
useEffect(() => {
  if (focusedLocation) {
    // Set category filter to this location's category
    if (focusedLocation.category) {
      // Map 'restaurant' to 'dining' for consistency
      const cat = focusedLocation.category === 'restaurant' 
        ? 'dining' 
        : focusedLocation.category;
      setActiveCategories(new Set([cat as CategoryFilter]));
    } else {
      // No category info - reset to all
      setActiveCategories(new Set(['all']));
    }
    
    // Set day filter to this location's day
    if (focusedLocation.dayId) {
      setActiveDays(new Set([focusedLocation.dayId]));
    } else {
      // No day info (guide items, lodging) - reset to all
      setActiveDays(new Set(['all']));
    }
    
    onFocusConsumed?.();
  }
}, [focusedLocation, onFocusConsumed]);
```

### 3. Update Detail Panels

Pass category and dayId from the activity/location:

**ActivityDetail.tsx:**
```tsx
const handleShowOnMap = () => {
  if (activity.location?.lat && activity.location?.lng) {
    if (activity.location_id) {
      focusLocation({
        id: activity.location_id,
        category: activity.category,  // "dining", "beach", etc.
        dayId: activity.day_id,
      });
      highlightPin(activity.location_id);
    }
    panMap(activity.location.lat, activity.location.lng);
    navigateToPanel(2);
  }
};
```

**LocationDetail.tsx:**
```tsx
const handleShowOnMap = () => {
  if (lat && lng) {
    focusLocation({
      id: location.id,
      category: location.category || undefined,
      dayId: 'dayId' in location ? location.dayId : undefined,
    });
    panMap(lat, lng);
    highlightPin(location.id);
    navigateToPanel(2);
  }
};
```

### 4. Update RightColumn

Pass the full focus object instead of just ID:

```tsx
<MapFilterHeader
  locations={allLocations}
  days={filterDays}
  onFilteredLocationsChange={handleFilteredLocationsChange}
  focusedLocation={focusedLocation}  // Changed from focusedLocationId
  onFocusConsumed={clearLocationFocus}
/>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/contexts/DashboardSelectionContext.tsx` | Change `focusedLocationId` to `focusedLocation` object with category/dayId |
| `src/components/dashboard/MapFilterHeader.tsx` | Set filters to specific values based on focusedLocation |
| `src/components/dashboard/RightColumn.tsx` | Pass `focusedLocation` instead of `focusedLocationId` |
| `src/components/dashboard/DetailPanels/ActivityDetail.tsx` | Pass category and day_id to focusLocation |
| `src/components/dashboard/DetailPanels/LocationDetail.tsx` | Pass category and dayId to focusLocation |

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Activity has category + day | Filter to that category AND that day |
| Guide location (no day) | Filter to category, but "All Days" |
| Location with no category | Filter to "All" categories, specific day if available |
| Unknown category | Fall back to "All" categories |

---

## Technical Details

### Category Normalization

The database uses both "dining" and "restaurant" for food places. The filter normalizes:
- `restaurant` → treated as `dining` in filters
- Both map locations marked as "restaurant" or "dining" will be shown when "Dining" filter is active

### MapLocation Type

`MapLocation` already has `dayId` as an optional property:
```ts
export interface MapLocation {
  id: string;
  category: string;
  dayId?: string;  // Already exists
  // ...
}
```

This makes it compatible with the new focus behavior.

---

## Summary

This change ensures clicking "Show on Map" sets filters to show specifically that location's category and day, giving users a focused view of just that pin (and similar items on the same day in the same category).
