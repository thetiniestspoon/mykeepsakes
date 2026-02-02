

# Fix "Show on Map" Filter Functionality

## Problem Summary

When clicking "Show on Map" from the Details panel, the map does not filter to show the selected item's location. The investigation revealed multiple issues:

---

## Root Causes Identified

### Issue 1: Broken Map Panning

**File:** `src/components/dashboard/RightColumn.tsx` (lines 116-126)

The code attempts to access the Leaflet map instance via `element._leaflet_map`, but this property doesn't exist. Leaflet doesn't expose the map instance on the DOM element this way.

```tsx
// Current broken code
const mapElement = mapContainerRef.current.querySelector('.leaflet-container');
if (mapElement && (mapElement as HTMLElement & { _leaflet_map?: L.Map })._leaflet_map) {
  const map = (mapElement as HTMLElement & { _leaflet_map?: L.Map })._leaflet_map!;
  map.flyTo([panToLocation.lat, panToLocation.lng], 15, { duration: 0.5 });
}
```

This means `panMap()` calls silently fail - the map never pans to the target location.

### Issue 2: Category Mismatch Between Tables

**Tables involved:** `itinerary_items.category` vs `locations.category`

| itinerary_items.category | locations.category | Filter Result |
|--------------------------|-------------------|---------------|
| `dining` | `restaurant` | Works (special handling) |
| `dining` | `dining` | Works |
| `event` | `activity` | **Fails** - filter for "event" won't show location with category "activity" |

The filter has special handling for `dining`/`restaurant` but not for other mismatches like `event`/`activity`.

### Issue 3: Location dayId May Not Match Activity day_id

**File:** `src/hooks/use-database-itinerary.ts` (lines 212-214)

When building `MapLocation` objects, the code finds the **first** itinerary item linked to a location and uses that item's `day_id`. If the same location appears on multiple days, the dayId may not match the activity you clicked "Show on Map" from.

---

## Solution

### Fix 1: Expose Map Instance for Panning

Modify `OverviewMap` to expose its map instance via a callback or ref, allowing `RightColumn` to call `flyTo()` properly.

**Changes to `OverviewMap.tsx`:**
```tsx
interface OverviewMapProps {
  // ... existing props
  onMapReady?: (map: L.Map) => void;  // New callback
}

// In the initialization effect:
useEffect(() => {
  if (!mapRef.current || mapInstanceRef.current) return;
  
  const map = L.map(mapRef.current).setView(defaultCenter, zoom);
  mapInstanceRef.current = map;
  
  // ... tile layer setup
  
  // Notify parent when map is ready
  onMapReady?.(map);
  
  return () => { /* cleanup */ };
}, []);
```

**Changes to `RightColumn.tsx`:**
```tsx
// Store map reference from OverviewMap
const leafletMapRef = useRef<L.Map | null>(null);

const handleMapReady = useCallback((map: L.Map) => {
  leafletMapRef.current = map;
}, []);

// Updated pan effect
useEffect(() => {
  if (panToLocation && leafletMapRef.current) {
    leafletMapRef.current.flyTo(
      [panToLocation.lat, panToLocation.lng], 
      15, 
      { duration: 0.5 }
    );
    clearPanTarget();
  }
}, [panToLocation, clearPanTarget]);

// In render:
<OverviewMap
  locations={filteredLocations}
  onMarkerClick={handleMarkerClick}
  highlightedPinId={highlightedMapPin}
  onMapReady={handleMapReady}  // New prop
  className="h-full"
/>
```

### Fix 2: Use Location's Category Instead of Activity's Category

When calling `focusLocation()`, use the **location's category** (from the joined data) rather than the activity's category. This ensures the filter matches the actual map pins.

**Changes to `ActivityDetail.tsx`:**
```tsx
const handleShowOnMap = () => {
  if (activity.location?.lat && activity.location?.lng) {
    if (activity.location_id) {
      focusLocation({
        id: activity.location_id,
        // Use location's category, not activity's category
        category: activity.location.category || activity.category,
        dayId: activity.day_id,
      });
      highlightPin(activity.location_id);
    }
    panMap(activity.location.lat, activity.location.lng);
    navigateToPanel(2);
  }
};
```

### Fix 3: Prevent Map Bounds Reset When Filtering to Single Location

Currently, `OverviewMap` calls `fitBounds()` whenever locations change. When filtering to a single location, it sets the view to that location at zoom 15 - which is correct. But we also have `panMap()` trying to fly to specific coordinates.

The fix is to skip bounds fitting when there's a pending pan target, or to coordinate these actions better.

**Changes to `OverviewMap.tsx`:**
```tsx
interface OverviewMapProps {
  // ... existing
  skipBoundsFit?: boolean;  // New prop to prevent auto-fitting
}

// In the markers update effect:
if (!skipBoundsFit) {
  if (bounds && locations.length > 1) {
    mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30] });
  } else if (locations.length === 1) {
    mapInstanceRef.current.setView([locations[0].lat, locations[0].lng], 15);
  }
}
```

**Changes to `RightColumn.tsx`:**
```tsx
// Track if we have a pending pan to skip auto-fit
const hasPendingPan = panToLocation !== null;

<OverviewMap
  locations={filteredLocations}
  onMarkerClick={handleMarkerClick}
  highlightedPinId={highlightedMapPin}
  onMapReady={handleMapReady}
  skipBoundsFit={hasPendingPan}  // Prevent bounds reset when panning
  className="h-full"
/>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/map/OverviewMap.tsx` | Add `onMapReady` callback and `skipBoundsFit` prop |
| `src/components/dashboard/RightColumn.tsx` | Use map ref from callback, pass `skipBoundsFit` when panning |
| `src/components/dashboard/DetailPanels/ActivityDetail.tsx` | Use location's category instead of activity's category |

---

## Technical Details

### Why Location Category vs Activity Category?

The map pins are built from the `locations` table data via `useDatabaseLocations()`. When the filter runs, it checks `loc.category` which comes from the locations table. Using the activity's category (from `itinerary_items`) can cause mismatches.

For example:
- User clicks "Show on Map" on a dinner reservation (activity.category = "dining")
- The restaurant in the locations table has category = "restaurant"
- Filter is set to "dining"
- Filter logic correctly includes "restaurant" because of special handling
- But if we had an event at a park, activity.category = "event" while location.category = "activity"
- This would fail without the fix

### Order of Operations After Fix

1. User clicks "Show on Map" in ActivityDetail
2. `focusLocation({ id, category: location.category, dayId })` - sets filter target
3. `panMap(lat, lng)` - sets pan target, triggers `skipBoundsFit`
4. `highlightPin(id)` - marks pin for highlight
5. `navigateToPanel(2)` - switches to Map panel (portrait mode)
6. MapFilterHeader receives focusedLocation, sets filters
7. Filtered locations update, map redraws markers (no bounds fit due to skipBoundsFit)
8. Pan effect fires, map flies to target location
9. Pin is highlighted with pulsing animation

---

## Testing Checklist

- [ ] Click "Show on Map" on a dining activity - verify map filters to that category and day
- [ ] Click "Show on Map" on a beach activity - verify correct filtering
- [ ] Click "Show on Map" when map is already filtered to a different category - verify filters update
- [ ] Test on mobile/portrait - verify panel navigation works
- [ ] Test with location that appears on multiple days - verify correct day is filtered

