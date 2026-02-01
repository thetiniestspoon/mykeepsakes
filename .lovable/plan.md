
# Robust MapModal Fix Implementation Plan

This plan replaces the fragile timing-based Leaflet initialization with a proper lifecycle-aware solution using ResizeObserver, Dialog events, and a reusable hook.

---

## Problem Analysis

### Current Issues
1. **Arbitrary Timeouts**: Uses 400ms + 100ms delays hoping the dialog animation completes
2. **Fragile DOM Manipulation**: Manually deletes `_leaflet_id` and clears `innerHTML`
3. **Unreliable Container Sizing**: Uses `calc(100% - 120px)` which can compute incorrectly during animation
4. **No Feedback States**: Users see blank space if map fails to initialize

### Root Cause
Leaflet requires a container with non-zero dimensions before initialization. The current approach guesses when the Dialog animation is complete rather than detecting it properly.

---

## Solution Overview

Create a `useLeafletMap` hook that:
- Uses **ResizeObserver** to detect when container has valid dimensions
- Only initializes when explicitly **enabled** (dialog ready)
- Provides **loading/error states** for UI feedback
- Includes optional **debug logging** for troubleshooting

---

## Phase 1: Create useLeafletMap Hook

### New File: `src/hooks/use-leaflet-map.ts`

```text
Purpose: Encapsulate Leaflet map lifecycle with proper container observation

Interface:
interface UseLeafletMapOptions {
  center: [number, number];
  zoom: number;
  enabled: boolean;           // External signal that container is ready
  markerPopup?: string;       // Optional popup content for center marker
  onReady?: () => void;       // Callback when map is initialized
  debug?: boolean;            // Enable console logging
}

interface UseLeafletMapResult {
  map: L.Map | null;
  marker: L.Marker | null;
  isReady: boolean;
  error: string | null;
  updateView: (lat: number, lng: number, zoom?: number) => void;
  updateMarker: (lat: number, lng: number, popupContent?: string) => void;
}

Implementation Details:
- ResizeObserver watches container for dimensions > 0
- Only initializes when: enabled=true AND dimensions are valid
- Debounces dimension checks (50ms) to handle rapid resizes
- Calls invalidateSize() after initialization
- Returns cleanup function that properly removes map instance
- Debug mode logs: container dimensions, init attempts, success/failure
```

---

## Phase 2: Refactor MapModal Component

### Modify: `src/components/map/MapModal.tsx`

### Key Changes:

**1. Track Dialog Ready State**
```text
Use Radix Dialog's onOpenAutoFocus event to detect animation completion:

const [dialogReady, setDialogReady] = useState(false);

// Reset when dialog closes
useEffect(() => {
  if (!open) setDialogReady(false);
}, [open]);

<DialogContent onOpenAutoFocus={() => setDialogReady(true)}>
```

**2. Use the New Hook**
```text
const { map, isReady, error, updateView, updateMarker } = useLeafletMap(mapRef, {
  center: [lat, lng],
  zoom,
  enabled: open && dialogReady,  // Only init when Dialog is fully rendered
  markerPopup: `<strong>${name}</strong>${address ? '<br/>' + address : ''}`,
  debug: false,  // Enable for troubleshooting
});
```

**3. Add Loading/Error States**
```text
{!isReady && !error && (
  <div className="flex-1 flex items-center justify-center bg-muted/50">
    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
  </div>
)}

{error && (
  <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
    <AlertCircle className="w-8 h-8" />
    <p className="text-sm">Failed to load map</p>
  </div>
)}
```

**4. Fix Container Sizing with Flex Layout**
```text
Current (problematic):
<div ref={mapRef} style={{ height: 'calc(100% - 120px)' }} />

Fixed:
<DialogContent className="flex flex-col h-[85vh]">
  <DialogHeader className="shrink-0">...</DialogHeader>
  <div 
    ref={mapRef} 
    className={cn(
      "flex-1 min-h-[300px] w-full",
      !isReady && "invisible"  // Hide until ready
    )}
  />
  <footer className="shrink-0">...</footer>
</DialogContent>
```

**5. Simplify Location Updates**
```text
// Separate effect for location changes (when map already exists)
useEffect(() => {
  if (!isReady) return;
  updateView(lat, lng, zoom);
  updateMarker(lat, lng, `<strong>${name}</strong>${address ? '<br/>' + address : ''}`);
}, [lat, lng, zoom, name, address, isReady, updateView, updateMarker]);
```

**6. Remove Old Cleanup Code**
```text
Remove:
- cleanupContainer() function (innerHTML clearing)
- _leaflet_id deletion
- All setTimeout calls
- Manual mapInstanceRef and markerRef management
```

---

## Phase 3: Hook Implementation Details

### ResizeObserver Logic
```text
useEffect(() => {
  if (!enabled || !containerRef.current) return;
  
  const observer = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    
    const { width, height } = entry.contentRect;
    logDebug('Container dimensions', { width, height });
    
    if (width > 0 && height > 0 && !mapRef.current) {
      initializeMap();
    }
  });
  
  observer.observe(containerRef.current);
  
  return () => observer.disconnect();
}, [enabled]);
```

### Initialization Function
```text
const initializeMap = () => {
  if (!containerRef.current || mapRef.current) return;
  
  logDebug('Initializing map at', options.center);
  
  try {
    const map = L.map(containerRef.current, {
      center: options.center,
      zoom: options.zoom,
    });
    
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '...'
    }).addTo(map);
    
    // Add marker if popup content provided
    if (options.markerPopup) {
      const marker = L.marker(options.center).addTo(map);
      marker.bindPopup(options.markerPopup).openPopup();
      markerRef.current = marker;
    }
    
    mapRef.current = map;
    setIsReady(true);
    
    // Final size invalidation
    requestAnimationFrame(() => map.invalidateSize());
    
    options.onReady?.();
    logDebug('Map ready');
    
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : 'Unknown error';
    setError(errorMsg);
    logDebug('Map initialization failed', e);
  }
};
```

### Cleanup Logic
```text
// On unmount OR when enabled becomes false
useEffect(() => {
  return () => {
    if (mapRef.current) {
      logDebug('Cleanup triggered');
      mapRef.current.remove();
      mapRef.current = null;
      markerRef.current = null;
      setIsReady(false);
    }
  };
}, []);

// Separate effect to cleanup when disabled
useEffect(() => {
  if (!enabled && mapRef.current) {
    logDebug('Disabling map');
    mapRef.current.remove();
    mapRef.current = null;
    markerRef.current = null;
    setIsReady(false);
  }
}, [enabled]);
```

---

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/use-leaflet-map.ts` | CREATE | Reusable hook for Leaflet lifecycle management |
| `src/components/map/MapModal.tsx` | MODIFY | Major refactor to use new hook |
| `src/types/leaflet.d.ts` | KEEP | Already has LeafletHTMLElement type |

---

## Implementation Order

| Step | Task | Risk |
|------|------|------|
| 1 | Create `useLeafletMap` hook with ResizeObserver + debug logging | Low |
| 2 | Update MapModal container to use flex layout (sizing fix) | Low |
| 3 | Add `dialogReady` state with `onOpenAutoFocus` | Low |
| 4 | Wire MapModal to use new hook | Medium |
| 5 | Add loading/error UI states | Low |
| 6 | Test across all 6 usage locations | - |
| 7 | Enable debug mode temporarily for verification | - |
| 8 | Remove old cleanup code once verified | Low |

---

## Testing Checklist

After implementation, verify these scenarios work:
- [ ] Open MapModal from DatabaseDayCard (itinerary activity)
- [ ] Open MapModal from GuideTab (attractions)
- [ ] Open MapModal from FavoritesTab
- [ ] Open MapModal from MapTab / DatabaseMapTab
- [ ] Switch between different locations rapidly
- [ ] Close and reopen the same location
- [ ] Loading spinner appears briefly
- [ ] Map renders without grey tiles
- [ ] Marker popup displays correctly

---

## Expected Outcome

1. Maps render reliably on first open in all modal contexts
2. No arbitrary timing delays - initialization is event-driven
3. Debug logs help diagnose any future issues
4. Loading state provides visual feedback during init
5. Error state handles edge cases gracefully
6. Cleaner separation of concerns (hook encapsulates Leaflet logic)
7. Consistent behavior across all 6 MapModal usages
