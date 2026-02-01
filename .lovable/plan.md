
# "Show on Map" Filter Focus & Panel Navigation

This plan ensures that clicking "Show on Map" anywhere in the app:
1. Resets map filters so the target location is visible
2. Navigates to the Map panel (in portrait/swipe mode)
3. Pans the map and highlights the pin

---

## Current Behavior

When "Show on Map" is clicked:
- `panMap(lat, lng)` - tells the map to fly to coordinates
- `highlightPin(locationId)` - highlights the pin with pulsing animation
- `navigateToPanel(2)` - swipes to Map panel (portrait mode)

**Problem**: If the user has filtered the map (e.g., showing only "Beaches"), the target location may not be visible because filters hide it.

---

## Solution Architecture

```text
Detail Panel                         Context                          MapFilterHeader
┌─────────────────┐                                                  ┌─────────────────┐
│  [Show on Map]  │─────▶ focusLocation(id) ─────▶ focusedLocationId ─▶ Reset to "All"
│                 │                                                   │  filters
│                 │─────▶ panMap(lat, lng) ─────────────────────────▶│  Map pans
│                 │                                                   │  Pin highlights
│                 │─────▶ navigateToPanel(2) ───────────────────────▶│  [Portrait only]
└─────────────────┘                                                  └─────────────────┘
```

---

## Key Changes

### 1. Extend DashboardSelectionContext

Add a new state and action for focusing on a specific location:

| Addition | Purpose |
|----------|---------|
| `focusedLocationId: string \| null` | ID of location to focus on (triggers filter reset) |
| `focusLocation(id: string)` | Set the focused location, auto-clears after use |

This keeps the context as the single source of truth for cross-panel coordination.

### 2. Update MapFilterHeader

When `focusedLocationId` changes to a non-null value:
- Reset both category and day filters to "All"
- This ensures the focused location will be visible regardless of previous filter state

### 3. Update Detail Panels

The `handleShowOnMap` function in both `ActivityDetail` and `LocationDetail` should:
1. Call `focusLocation(locationId)` to reset filters
2. Call `panMap(lat, lng)` to pan the map
3. Call `highlightPin(locationId)` to highlight the pin
4. Call `navigateToPanel(2)` to switch to Map panel (works in portrait)

---

## Implementation Details

### DashboardSelectionContext Changes

```tsx
// New state
const [focusedLocationId, setFocusedLocationId] = useState<string | null>(null);

// New action
const focusLocation = useCallback((locationId: string) => {
  setFocusedLocationId(locationId);
}, []);

// Clear focus after it's been consumed
const clearLocationFocus = useCallback(() => {
  setFocusedLocationId(null);
}, []);
```

### MapFilterHeader Changes

The component needs to receive `focusedLocationId` and reset filters when it changes:

```tsx
interface MapFilterHeaderProps {
  locations: MapLocation[];
  days: Day[];
  onFilteredLocationsChange: (locations: MapLocation[]) => void;
  focusedLocationId?: string | null;
  onFocusConsumed?: () => void;
  className?: string;
}

// Inside component:
useEffect(() => {
  if (focusedLocationId) {
    // Reset all filters to "All" to ensure location is visible
    setActiveCategories(new Set(['all']));
    setActiveDays(new Set(['all']));
    // Notify parent that focus has been consumed
    onFocusConsumed?.();
  }
}, [focusedLocationId, onFocusConsumed]);
```

### RightColumn Changes

Pass the focus props from context to MapFilterHeader:

```tsx
const { focusedLocationId, clearLocationFocus, ... } = useDashboardSelection();

<MapFilterHeader
  locations={allLocations}
  days={filterDays}
  onFilteredLocationsChange={handleFilteredLocationsChange}
  focusedLocationId={focusedLocationId}
  onFocusConsumed={clearLocationFocus}
/>
```

### ActivityDetail Changes

Update the handler to also call focusLocation:

```tsx
const { panMap, highlightPin, navigateToPanel, focusLocation } = useDashboardSelection();

const handleShowOnMap = () => {
  if (activity.location?.lat && activity.location?.lng) {
    // Reset map filters to show this location
    if (activity.location_id) {
      focusLocation(activity.location_id);
      highlightPin(activity.location_id);
    }
    panMap(activity.location.lat, activity.location.lng);
    // Navigate to Map panel (index 2)
    navigateToPanel(2);
  }
};
```

### LocationDetail Changes

Same pattern:

```tsx
const { panMap, highlightPin, navigateToPanel, focusLocation } = useDashboardSelection();

const handleShowOnMap = () => {
  if (lat && lng) {
    focusLocation(location.id);
    panMap(lat, lng);
    highlightPin(location.id);
    // Navigate to Map panel (index 2)
    navigateToPanel(2);
  }
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/contexts/DashboardSelectionContext.tsx` | Add `focusedLocationId` state, `focusLocation()` and `clearLocationFocus()` actions |
| `src/components/dashboard/MapFilterHeader.tsx` | Accept `focusedLocationId` prop, reset filters when set |
| `src/components/dashboard/RightColumn.tsx` | Pass focus props from context to MapFilterHeader |
| `src/components/dashboard/DetailPanels/ActivityDetail.tsx` | Call `focusLocation()` in handleShowOnMap |
| `src/components/dashboard/DetailPanels/LocationDetail.tsx` | Call `focusLocation()` in handleShowOnMap |

---

## Technical Details

### Why Reset to "All" Filters?

When focusing on a specific location, we can't know which category or day filters would include it. The safest approach is to reset both to "All" so the location is guaranteed to be visible.

An alternative would be to auto-detect the category and day of the focused location and set filters accordingly, but this adds complexity and may be confusing (suddenly switching to "Dining" filter when clicking on a restaurant).

### Focus Lifecycle

1. User clicks "Show on Map" in a detail panel
2. `focusLocation(id)` sets `focusedLocationId` in context
3. `MapFilterHeader` detects the change, resets filters to "All"
4. `MapFilterHeader` calls `onFocusConsumed()` to clear the focus
5. Meanwhile, `panMap()` and `highlightPin()` update the map
6. `navigateToPanel(2)` swipes to the Map (portrait mode only)

### No External Links

The "Get Directions" button opens Google Maps externally, but "Show on Map" always stays within the app. This is already the current behavior and will be preserved.

---

## Summary

This enhancement ensures that clicking "Show on Map" always works correctly by:
1. Automatically resetting any active filters that might hide the target location
2. Panning to the location and highlighting its pin
3. Switching to the Map panel in portrait/swipe mode

The user never has to manually clear filters to see their selected location.
