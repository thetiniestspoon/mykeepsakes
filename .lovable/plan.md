

# Tailwind Preflight CSS Fix for Leaflet Tiles

This plan adds CSS overrides to prevent Tailwind's base styles from breaking Leaflet map tiles in modals.

---

## Root Cause Analysis

Tailwind's preflight CSS includes:
```css
img, video {
  max-width: 100%;
  height: auto;
}
```

This breaks Leaflet tiles because:
- Leaflet expects tiles to be exactly 256x256 pixels
- Tailwind's `max-width: 100%` constrains them based on the container
- During Dialog animations, the container dimensions change, causing tiles to resize incorrectly
- This results in grey areas, misaligned tiles, or blank maps

The `OverviewMap` works because it's in a stable, pre-sized container. The `MapModal` fails because the Dialog portal/animation causes container dimension issues during initialization.

---

## Solution: CSS Overrides

Add Leaflet-specific CSS rules that override Tailwind's preflight for map tiles.

### File to Modify: `src/index.css`

Add after the existing utility classes (at the end of the file):

```css
/* ==============================================
   Leaflet + Tailwind Compatibility Fix
   Tailwind's preflight sets max-width: 100% on images,
   which breaks Leaflet tiles that require exact 256x256 sizing.
   ============================================== */

/* Reset Tailwind's image constraints for Leaflet containers */
.leaflet-container img {
  max-width: none !important;
  max-height: none !important;
}

/* Ensure tile images maintain exact sizing */
.leaflet-container .leaflet-tile-pane img {
  width: 256px !important;
  height: 256px !important;
}

/* Fix for tile layer visibility during animations */
.leaflet-container .leaflet-tile {
  visibility: visible !important;
}

/* Ensure popup and control images also aren't constrained */
.leaflet-container .leaflet-control img,
.leaflet-container .leaflet-popup img {
  max-width: none !important;
}
```

---

## Why This Works

1. **`max-width: none`**: Prevents Tailwind from constraining tile dimensions based on container width
2. **Explicit 256x256**: Ensures tiles are always the correct size Leaflet expects
3. **`visibility: visible`**: Prevents tiles from being hidden during CSS transitions
4. **`!important`**: Necessary to override Tailwind's preflight which has equal specificity

---

## Files Summary

| File | Action | Changes |
|------|--------|---------|
| `src/index.css` | MODIFY | Add Leaflet CSS overrides at end of file |

---

## Testing Checklist

After implementation, verify:
- [ ] MapModal tiles render correctly on first open
- [ ] No grey areas or missing tiles
- [ ] Tiles don't flash or resize during Dialog animation
- [ ] OverviewMap continues to work (regression check)
- [ ] Marker icons display correctly
- [ ] Popups render properly

---

## Alternative Debug Approach (If Needed)

If the CSS fix alone doesn't fully resolve the issue, we can add tile load event handlers to the hook for diagnostics:

```typescript
// In use-leaflet-map.ts initializeMap()
const tileLayer = L.tileLayer('...', { ... });

tileLayer.on('tileload', () => logDebug('Tile loaded'));
tileLayer.on('tileerror', (e) => logDebug('Tile error', e));

tileLayer.addTo(map);
```

This would help identify if tiles are failing to load vs being rendered incorrectly.

