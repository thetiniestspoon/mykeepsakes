
# Long-Press Drag to Move Map Pins

## Overview

Enable users to long-press (hold) a map pin to pick it up and drag it to a new position. When released, the location's coordinates will be updated in the database, reflecting everywhere that location is used (itinerary items, memories, etc.).

## User Experience Flow

```text
1. User long-presses pin (500ms hold)
   ↓
2. Visual feedback: Pin lifts, glows, map dragging disables
   ↓
3. User drags pin to new position
   ↓
4. User releases pin
   ↓
5. Pin drops with animation + coordinates saved to database
   ↓
6. Toast confirmation: "Location updated"
```

---

## Technical Approach

### Key Insight: Leaflet Draggable Markers

Leaflet markers support `draggable: true` option, but we don't want pins always draggable (interferes with normal clicking/tapping). Instead:

1. **Default state**: Markers are NOT draggable
2. **Long-press trigger**: After 500ms hold, enable dragging on that specific marker
3. **Drag end**: Save new lat/lng to database, disable dragging

### Implementation Components

| Component | Responsibility |
|-----------|----------------|
| `OverviewMap.tsx` | Add long-press detection and drag handlers to markers |
| `RightColumn.tsx` | Pass update callback to OverviewMap |
| `use-locations.ts` | Already has `useUpdateLocation()` mutation (ready to use) |

---

## Changes Required

### 1. OverviewMap.tsx

**Add new prop for location updates:**
```tsx
interface OverviewMapProps {
  // ... existing props
  /** Callback when a location is dragged to a new position */
  onLocationDrag?: (locationId: string, newLat: number, newLng: number) => void;
}
```

**Add long-press + drag logic in marker creation (inside the `forEach` loop):**

```tsx
// Track long-press state per marker
let longPressTimer: NodeJS.Timeout | null = null;
let isDragging = false;

// Create marker (starts as non-draggable)
const marker = L.marker([location.lat, location.lng], { 
  icon,
  draggable: false  // Will enable on long-press
});

// Long-press detection using mousedown/touchstart
const startLongPress = (e: L.LeafletMouseEvent) => {
  L.DomEvent.stopPropagation(e);
  
  longPressTimer = setTimeout(() => {
    // Enable dragging after 500ms hold
    marker.dragging?.enable();
    isDragging = true;
    
    // Visual feedback - add "dragging" class
    const el = marker.getElement();
    el?.classList.add('marker-dragging');
    
    // Disable map dragging while moving pin
    mapInstanceRef.current?.dragging.disable();
  }, 500);
};

const cancelLongPress = () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
};

// Mouse/touch events for long-press
marker.on('mousedown', startLongPress);
marker.on('touchstart', startLongPress);
marker.on('mouseup', cancelLongPress);
marker.on('mouseleave', cancelLongPress);
marker.on('touchend', cancelLongPress);
marker.on('touchcancel', cancelLongPress);

// Handle drag end - save new position
marker.on('dragend', (e) => {
  if (!isDragging) return;
  
  const newLatLng = marker.getLatLng();
  
  // Disable dragging again
  marker.dragging?.disable();
  isDragging = false;
  
  // Re-enable map dragging
  mapInstanceRef.current?.dragging.enable();
  
  // Remove visual feedback
  const el = marker.getElement();
  el?.classList.remove('marker-dragging');
  
  // Call callback with new position
  onLocationDrag?.(location.id, newLatLng.lat, newLatLng.lng);
});
```

**Add CSS for dragging visual feedback (in the marker styles):**
```css
.marker-dragging .marker-pin {
  transform: scale(1.2) rotate(-45deg) translateY(-8px) !important;
  box-shadow: 0 12px 24px rgba(0,0,0,0.4) !important;
  filter: brightness(1.1);
  transition: all 0.15s ease-out;
}
```

---

### 2. RightColumn.tsx

**Add mutation hook and callback:**

```tsx
import { useUpdateLocation } from '@/hooks/use-locations';

// Inside component:
const updateLocation = useUpdateLocation();

// Handler for drag completion
const handleLocationDrag = useCallback((locationId: string, newLat: number, newLng: number) => {
  updateLocation.mutate({
    id: locationId,
    lat: newLat,
    lng: newLng,
  });
}, [updateLocation]);

// Pass to OverviewMap:
<OverviewMap
  locations={filteredLocations || []}
  onMarkerClick={handleMarkerClick}
  onLocationDrag={handleLocationDrag}  // NEW
  highlightedPinIds={highlightedMapPins}
  onMapReady={handleMapReady}
  skipBoundsFit={hasPendingPan}
  className="h-full"
/>
```

---

### 3. Handling Accommodations

Accommodations are stored in a different table (`accommodations`) with `location_lat` and `location_lng` fields. Need to detect which type is being dragged:

**In RightColumn:**
```tsx
const handleLocationDrag = useCallback((itemId: string, newLat: number, newLng: number) => {
  // Check if it's an accommodation
  const isAccommodation = accommodations.some(a => a.id === itemId);
  
  if (isAccommodation) {
    // Update accommodation coordinates
    // (will need to add useUpdateAccommodation hook or use existing)
    updateAccommodation.mutate({
      id: itemId,
      location_lat: newLat,
      location_lng: newLng,
    });
  } else {
    // Update location coordinates
    updateLocation.mutate({
      id: itemId,
      lat: newLat,
      lng: newLng,
    });
  }
}, [updateLocation, updateAccommodation, accommodations]);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/map/OverviewMap.tsx` | Add `onLocationDrag` prop, long-press detection, drag handlers, dragging visual styles |
| `src/components/dashboard/RightColumn.tsx` | Add `useUpdateLocation` hook, create drag handler, pass callback to OverviewMap |
| `src/hooks/use-accommodations.ts` | Check if update mutation exists; add if needed for accommodation dragging |

---

## Edge Cases Handled

1. **Accidental drags**: 500ms delay prevents accidental moves
2. **Map panning conflict**: Disable map drag while pin is being moved
3. **Tap vs long-press**: Clear timer on quick releases to allow normal taps/clicks
4. **Touch vs mouse**: Both mousedown/touchstart handled for cross-device support
5. **Visual clarity**: Lifted/glowing pin makes it clear which pin is being moved

---

## Benefits

- **Universal update**: Changing a location's coordinates updates everywhere it's referenced (itinerary items, memories, favorites)
- **Intuitive gesture**: Long-press is a standard mobile pattern for "edit mode"
- **Non-destructive**: Normal tapping still works for viewing details
- **Immediate feedback**: Visual lift + glow + drop animation
