

# MapModal Container Structure Fix

## Problem Identified

The map container has a nested div structure where `mapRef` is on an inner div, not the outer flex-1 container. This can cause dimension inheritance issues:

```text
Current Structure:
┌─ wrapper div (flex-1 min-h-[300px]) ─┐
│  ┌─ mapRef div (w-full h-full) ─┐    │
│  │     Leaflet map              │    │
│  └──────────────────────────────┘    │
│  + Loading overlay                    │
│  + Error overlay                      │
└──────────────────────────────────────┘
```

The inner div relies on `h-full` to inherit height, but percentage heights can fail if the parent doesn't have an explicit height (flex-1 doesn't always translate to a computable height for children).

---

## Solution

Restructure so the `mapRef` is directly on the flex-1 container, with overlays positioned absolutely on top.

### File: `src/components/map/MapModal.tsx`

**Changes:**
1. Move `ref={mapRef}` to the outer wrapper div
2. Keep the flex-1 sizing on that same element
3. Remove the nested map container div
4. Overlays remain as absolute positioned children (they'll sit on top of the map)

```text
New Structure:
┌─ mapRef div (flex-1 min-h-[300px] relative) ─┐
│     Leaflet map (fills entire container)      │
│  ┌─ Loading overlay (absolute) ─┐             │
│  └──────────────────────────────┘             │
│  ┌─ Error overlay (absolute) ─┐               │
│  └──────────────────────────────┘             │
└──────────────────────────────────────────────┘
```

### Updated JSX (lines 90-118):

```jsx
{/* Map container - flex-1 takes remaining space */}
<div 
  ref={mapRef}
  className={cn(
    "flex-1 min-h-[300px] relative",
    !isReady && "invisible"
  )}
  onAnimationEnd={handleAnimationEnd}
>
  {/* Loading state overlay */}
  {!isReady && !error && (
    <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10 visible">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  )}
  
  {/* Error state overlay */}
  {error && (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/50 z-10 visible">
      <AlertCircle className="w-8 h-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Failed to load map</p>
    </div>
  )}
</div>
```

Note: Added `visible` class to overlays so they remain visible even when parent has `invisible` class.

---

## Debug Logging Enhancement

### File: `src/hooks/use-leaflet-map.ts`

Add explicit logging when containerRef is null to help diagnose timing issues:

**Update effect (lines 116-153):**

```typescript
useEffect(() => {
  if (!options.enabled) {
    logDebug('Map disabled, skipping observation');
    return;
  }
  
  if (!containerRef.current) {
    logDebug('containerRef.current is null - Dialog may not have mounted yet');
    return;
  }

  logDebug('Starting container observation', {
    width: containerRef.current.offsetWidth,
    height: containerRef.current.offsetHeight
  });

  // ... rest of ResizeObserver logic
}, [options.enabled, containerRef, initializeMap, logDebug]);
```

---

## Files Summary

| File | Action | Changes |
|------|--------|---------|
| `src/components/map/MapModal.tsx` | MODIFY | Move mapRef to flex-1 container, remove nested wrapper |
| `src/hooks/use-leaflet-map.ts` | MODIFY | Add debug logging for null containerRef |

---

## Why This Fixes the Issue

1. **Direct flex-1 sizing**: The mapRef div is now the direct recipient of flex-based sizing from the Dialog's flex-col layout
2. **No percentage height inheritance**: Removing the nested div eliminates the need for `h-full` to calculate correctly
3. **Overlays remain functional**: Using `visible` class ensures loading/error states display even when map container is invisible
4. **Better debugging**: Explicit null-check logging helps identify if the issue is ref timing vs container sizing

---

## Testing After Implementation

- [ ] Open MapModal from itinerary - map tiles should render without grey areas
- [ ] Loading spinner should appear briefly during initialization
- [ ] Error state should display if map fails to load
- [ ] Marker and popup should be visible and correctly positioned
- [ ] Console should show helpful debug messages when `debug: true`

