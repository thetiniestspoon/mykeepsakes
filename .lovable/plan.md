
# MapModal Debugging & Fixes Plan

## Investigation Summary

Based on extensive testing with the browser automation tools, I discovered:

### What's Working:
1. **CSS Tile Fix** - Tiles ARE loading correctly at zoom levels 12 and 13 (200 status codes observed)
2. **useLeafletMap Hook** - The ResizeObserver + onOpenAutoFocus approach is functioning
3. **Flex Layout** - The `flex-col` + `flex-1` layout provides proper container sizing

### Remaining Issues Found:

**Issue 1: Race Condition with `onOpenAutoFocus`**
The `onOpenAutoFocus` event fires when focus is moved to the dialog, but this may happen slightly before the CSS transitions complete. In some cases, the map container might still have zero dimensions when observed.

**Issue 2: Missing `invalidateSize` After Resize**
The hook only calls `invalidateSize()` once during initial map creation, but if the dialog completes its entrance animation AFTER the map initializes, tiles could render incorrectly.

**Issue 3: Console Warning About Refs**
The warning "Function components cannot be given refs" is caused by `DropdownMenu` receiving a ref. This is a minor issue but indicates improper component composition.

---

## Proposed Fixes

### Fix 1: Add Animation Completion Detection

Instead of relying solely on `onOpenAutoFocus`, also trigger a size recalculation after the dialog's animation completes.

**File: `src/components/map/MapModal.tsx`**

Add a delayed `invalidateSize` call using `onAnimationEnd` on the container:

```text
Changes:
1. Add onAnimationEnd to the map wrapper div
2. Call map.invalidateSize() when the animation completes
3. Pass the map instance down for this purpose
```

### Fix 2: Add Continuous Size Monitoring

Enhance the `useLeafletMap` hook to continue monitoring container size and call `invalidateSize` when dimensions change after initialization.

**File: `src/hooks/use-leaflet-map.ts`**

```text
Changes:
1. Keep ResizeObserver active after map init
2. Call invalidateSize() when container dimensions change
3. Add debouncing to prevent excessive calls
```

### Fix 3: Fallback Timer for Slow Animations

Add a small fallback timer (300ms after enabled becomes true) to ensure `invalidateSize` is called even if events don't fire as expected.

**File: `src/hooks/use-leaflet-map.ts`**

```text
Changes:
1. Add a setTimeout(300ms) fallback when enabled becomes true
2. Ensure map dimensions are valid after dialog animation completes
3. Clean up timer on unmount or when disabled
```

### Fix 4: Remove Console Warning

Fix the DropdownMenu ref warning by ensuring proper component structure.

**File: `src/components/map/MapModal.tsx`**

```text
Changes:
1. The DropdownMenu trigger already uses `asChild` correctly
2. This warning may be from a stale build - verify after rebuild
```

---

## Implementation Details

### useLeafletMap Hook Updates

```text
// After map initialization, continue observing for resize
useEffect(() => {
  if (!mapRef.current || !containerRef.current) return;

  const observer = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    
    // Debounced invalidateSize when container resizes
    requestAnimationFrame(() => {
      mapRef.current?.invalidateSize();
    });
  });

  observer.observe(containerRef.current);
  
  return () => observer.disconnect();
}, [isReady]);
```

### MapModal Fallback Timer

```text
// Add fallback invalidateSize after dialog animation
useEffect(() => {
  if (!isReady) return;
  
  // Fallback: ensure tiles are correct after animation
  const timer = setTimeout(() => {
    // Hook's updateView already handles this, but add explicit invalidateSize
  }, 350);
  
  return () => clearTimeout(timer);
}, [isReady]);
```

---

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/use-leaflet-map.ts` | MODIFY | Add continuous resize monitoring + fallback timer |
| `src/components/map/MapModal.tsx` | MODIFY | Add animation completion handler |

---

## Technical Details

### Why This Fixes the Issue

The core problem is that Leaflet calculates tile positions based on container dimensions at initialization time. If those dimensions change afterward (due to CSS animations), tiles can appear misaligned or missing.

The solution is to:
1. **Monitor for size changes** after initialization
2. **Call `invalidateSize()`** whenever dimensions stabilize
3. **Use a fallback timer** to catch edge cases where ResizeObserver misses changes

### Performance Considerations

- ResizeObserver is very efficient and doesn't impact performance
- `invalidateSize()` is a lightweight DOM measurement operation
- Fallback timer only runs once per dialog open

---

## Testing Checklist

After implementation:
- [ ] Open MapModal immediately after page load
- [ ] Open MapModal after scrolling through itinerary
- [ ] Open multiple MapModals in quick succession
- [ ] Verify no grey tiles appear
- [ ] Check that marker and popup display correctly
- [ ] Confirm console warning is resolved

