

## Fix Map Modal Not Rendering (While Overview Map Works)

The map modals have stopped rendering because of Leaflet initialization failures related to DOM state management and dialog animation timing.

---

## Root Cause Analysis

The `OverviewMap` works because it initializes once when mounted and stays alive. The `MapModal` fails because:

1. **DOM State Corruption**: When using `innerHTML = ''` to clear the container, Leaflet's internal `_leaflet_id` property remains attached to the DOM node, causing "Map container is already initialized" errors on re-init
2. **Key-Based Remounting**: The unique `key={lat-lng}` pattern causes React to unmount/remount the component, but the cleanup effect's timer is cancelled before Leaflet can be properly destroyed
3. **Animation Timing Mismatch**: The 300ms delay may not align with when the dialog content actually reaches its final dimensions
4. **Conditional Rendering Gap**: The `{selectedLocation && <MapModal .../>}` pattern can cause the component to unmount while cleanup is still pending

---

## Solution

### 1. Add Explicit Leaflet Container Reset
**File:** `src/components/map/MapModal.tsx`

Instead of relying solely on `innerHTML = ''`, actively remove any Leaflet-attached properties from the DOM node:

```typescript
// Before initializing, ensure no Leaflet state is attached
if (mapRef.current) {
  // Clear Leaflet's internal tracking
  delete (mapRef.current as any)._leaflet_id;
  mapRef.current.innerHTML = '';
}
```

### 2. Synchronous Cleanup on Effect Return
Ensure the map is destroyed immediately when the component unmounts or `open` becomes false:

```typescript
useEffect(() => {
  if (!open) {
    // Synchronous cleanup
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    }
    // Also clean the DOM element
    if (mapRef.current) {
      delete (mapRef.current as any)._leaflet_id;
      mapRef.current.innerHTML = '';
    }
    return;
  }
  // ... initialization code
}, [open]);
```

### 3. Use Dialog's onAnimationEnd for Timing
Instead of a fixed 300ms timeout, listen for when the dialog content is fully rendered:

```typescript
// Wait for next frame after mount to ensure layout is complete
const timer = requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    // Initialize map here - two frames ensures layout is complete
  });
});
```

Or increase the timeout to 500ms to account for slower devices.

### 4. Add Error Boundary for Leaflet Initialization
Wrap the initialization in a try-catch to prevent partial initialization states:

```typescript
try {
  const map = L.map(mapRef.current, { center: [lat, lng], zoom });
  // ... rest of init
} catch (e) {
  console.error('Failed to initialize map:', e);
  // Reset state for retry
  if (mapRef.current) {
    delete (mapRef.current as any)._leaflet_id;
    mapRef.current.innerHTML = '';
  }
}
```

### 5. Add a "mounted" Guard
Prevent initialization if the component has already unmounted during the timeout:

```typescript
useEffect(() => {
  let isMounted = true;
  
  if (!open) { /* cleanup */ return; }
  
  const timer = setTimeout(() => {
    if (!isMounted || !mapRef.current || mapInstanceRef.current) return;
    // Initialize...
  }, 400);
  
  return () => {
    isMounted = false;
    clearTimeout(timer);
  };
}, [open]);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/map/MapModal.tsx` | Add Leaflet container reset, improve cleanup, increase timeout, add error handling, add mounted guard |

---

## Complete Implementation

The updated `MapModal.tsx` will:

1. **Delete `_leaflet_id`** from the container before each initialization attempt
2. **Use `isMounted` guard** to prevent stale closures
3. **Increase timeout to 400ms** for safer animation completion
4. **Wrap init in try-catch** to handle failures gracefully
5. **Clean up in effect return** AND when `open` becomes false
6. **Add a second cleanup in unmount** to catch edge cases

---

## Technical Explanation

When a React component with a `key` prop changes that key:
1. React schedules the old component for unmount
2. React creates the new component instance
3. The old effect's cleanup runs
4. The new effect runs

If the cleanup involves an async operation (like clearing a timer), the new component's init may run before cleanup completes. By:
- Deleting `_leaflet_id` synchronously before init
- Using an `isMounted` guard
- Wrapping in try-catch

We ensure that even if cleanup doesn't complete, initialization can still succeed.

---

## Expected Result

After these changes:
- Map modals will render reliably every time
- The Overview Map will continue to work independently
- Rapidly opening/closing modals won't cause failures
- Switching between different locations will work smoothly

