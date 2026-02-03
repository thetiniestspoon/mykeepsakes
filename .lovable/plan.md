
# Fix Map Filter Button Visibility

## Problem

The "Filters" button that should appear when the filter header is collapsed is not visible on the map panel. Looking at the screenshot:

- The Leaflet zoom controls (+/-) are at the **top-left** of the map
- Our filter button is positioned at `top-3 left-3` (12px from top-left)
- These positions overlap, and Leaflet's control container creates a stacking context with high z-index values (800-1000) that can visually override our button

## Root Cause

Leaflet's `.leaflet-container` and its control elements create their own stacking context with high z-index values. Our button has `z-20` (z-index: 20) but is positioned as a sibling to the map container, not accounting for Leaflet's internal stacking.

## Solution

Move the collapsed filter button to the **top-right corner** to avoid overlapping with Leaflet's default zoom controls. This is a cleaner UX approach than fighting z-index battles.

**Alternative considered**: Increasing z-index to `z-[1001]` would also work but creates fragile CSS coupling with Leaflet internals.

---

## Changes

### File: `src/components/dashboard/RightColumn.tsx`

Update the button position from `left-3` to `right-3`:

```tsx
{/* Collapsed filter button - floats over map */}
{isFilterCollapsed && (
  <div className="absolute top-3 right-3 z-20">  {/* Changed from left-3 to right-3 */}
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

## Visual Layout After Fix

```text
┌────────────────────────────────────────────────┐
│ [+]                              [🔍 Filters]  │
│ [-]                                            │
│                                                │
│                    MAP                         │
│                                                │
│                                                │
└────────────────────────────────────────────────┘
  ↑                                    ↑
  Leaflet zoom                         Our filter
  controls (top-left)                  button (top-right)
```

---

## Why This Works

1. **No z-index conflicts**: Button is in a different corner than Leaflet controls
2. **Standard pattern**: Many map apps put filter/layer controls on the right side
3. **Touch-friendly**: Right side is easier to reach with right thumb on mobile
4. **Simple fix**: Single class change, no complex CSS overrides needed

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/RightColumn.tsx` | Change `left-3` to `right-3` on the collapsed filter button container |
