
## Fix Map Modal Rendering Issues

The map modals stop working after initially functioning because of Leaflet map instance conflicts and initialization timing issues.

---

## Root Causes Identified

1. **Multiple Leaflet Instances**: The `OverviewMap` on the Map tab maintains a persistent Leaflet map while `MapModal` tries to create another one
2. **DOM Container State**: Leaflet attaches internal state to DOM elements - if not properly cleaned up, re-initialization fails
3. **Dialog Animation Timing**: The map initializes before the dialog is fully sized, causing `invalidateSize()` to calculate incorrect dimensions
4. **Component Remounting**: When `selectedLocation` changes while the modal is open, effects may not clean up properly

---

## Solution

### 1. Add Unique Keys to Force Clean Remounts
**File:** `src/components/MapTab.tsx`, `src/components/ItineraryTab.tsx`, `src/components/GuideTab.tsx`, `src/components/FavoritesTab.tsx`, `src/components/lodging/LodgingCard.tsx`

Force the MapModal to completely remount when location changes by adding a unique key:

```tsx
// Before
<MapModal
  open={mapModalOpen}
  lat={selectedLocation.lat}
  lng={selectedLocation.lng}
  ...
/>

// After
<MapModal
  key={`${selectedLocation.lat}-${selectedLocation.lng}`}
  open={mapModalOpen}
  lat={selectedLocation.lat}
  lng={selectedLocation.lng}
  ...
/>
```

### 2. Improve MapModal Cleanup & Initialization
**File:** `src/components/map/MapModal.tsx`

- **Separate the open state from location changes** in the effect dependencies
- **Add more robust cleanup** that ensures the map container is cleared
- **Increase initialization delay** to wait for dialog animation
- **Add a fallback re-initialization** on visibility change

```tsx
useEffect(() => {
  if (!open) {
    // Clean up when closing
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    return;
  }

  if (!mapRef.current) return;

  // Ensure container is clean before initializing
  if (mapRef.current.hasChildNodes()) {
    mapRef.current.innerHTML = '';
  }

  // Wait for dialog to be fully rendered
  const timer = setTimeout(() => {
    // ... initialization code
  }, 300);

  return () => clearTimeout(timer);
}, [open]); // Only depend on open state

// Separate effect to update view when location changes
useEffect(() => {
  if (mapInstanceRef.current && open) {
    mapInstanceRef.current.setView([lat, lng], zoom);
    // Update marker position
  }
}, [lat, lng, zoom, open]);
```

### 3. Add CSS to Ensure Container Height
**File:** `src/components/map/MapModal.tsx`

Ensure the map container has a fixed, calculated height rather than relying on flexbox:

```tsx
<div 
  ref={mapRef} 
  className="w-full"
  style={{ 
    height: 'calc(100% - 120px)', // Account for header + footer
    minHeight: '300px' 
  }}
/>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/map/MapModal.tsx` | Improve cleanup, separate effects, fix container sizing |
| `src/components/MapTab.tsx` | Add key to MapModal |
| `src/components/ItineraryTab.tsx` | Add key to MapModal |
| `src/components/GuideTab.tsx` | Add key to MapModal |
| `src/components/FavoritesTab.tsx` | Add key to MapModal |
| `src/components/lodging/LodgingCard.tsx` | Add key to MapModal |

---

## Technical Details

### Why Keys Help

React's reconciliation algorithm uses keys to determine whether a component should be reused or remounted. By using the lat/lng as a key, we ensure:
- Each new location gets a completely fresh MapModal instance
- Leaflet's internal DOM state is never carried over
- No cleanup race conditions between old and new map instances

### Why Separate Effects Help

By separating the "open/close" effect from the "update location" effect:
- Opening the modal triggers full initialization
- Changing location on an already-open modal just updates the view
- Closing the modal guarantees cleanup runs

### Container Height Strategy

Using `calc()` for height instead of flexbox ensures:
- The container has a definite height when the map initializes
- `invalidateSize()` can correctly calculate tile positions
- The map doesn't "fight" with flexbox for space

---

## Expected Result

After these changes:
- Map modals will reliably show tiles every time they open
- Switching between different locations will work smoothly
- The Map tab's overview map won't interfere with the modal map
- Rapid opening/closing won't cause rendering failures
