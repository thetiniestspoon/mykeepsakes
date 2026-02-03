

# Fix Map Filter Button Z-Index

## Problem

The "Filters" button is rendering **behind** the map. This happens because:

1. Leaflet's `.leaflet-container` creates its own **stacking context**
2. Leaflet's internal controls and layers use z-index values from 100-1000
3. Our button has `z-20` which is lower than Leaflet's pane z-indices
4. Even though our button is a sibling to the map container, the map's stacking context can visually overlap

## Solution

Use a z-index value **above** Leaflet's highest z-index (which is ~1000 for controls). Using `z-[1001]` will ensure the button floats above all Leaflet elements.

---

## Change

### File: `src/components/dashboard/RightColumn.tsx`

Update the collapsed filter button's z-index from `z-20` to `z-[1001]`:

```tsx
{/* Collapsed filter button - floats over map */}
{isFilterCollapsed && (
  <div className="absolute top-3 right-3 z-[1001]">  {/* Changed from z-20 to z-[1001] */}
    <Button
      variant="secondary"
      size="sm"
      onClick={toggleFilterCollapsed}
      className="shadow-md gap-1.5"
    >
      <Filter className="w-4 h-4" />
      <span className="text-xs font-medium">Filters</span>
      {hasActiveFilters && (
        <Badge variant="default" className="h-5 px-1.5 text-xs ml-1">
          {activeFilterCount}
        </Badge>
      )}
    </Button>
  </div>
)}
```

---

## Why z-[1001]?

Leaflet uses the following z-index hierarchy:
- Map tiles: 100-200
- Markers/overlays: 400-600  
- Controls (zoom buttons): 800-1000

Using `z-[1001]` puts our button above all Leaflet layers while staying minimal.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/RightColumn.tsx` | Change `z-20` to `z-[1001]` on collapsed filter button container |

