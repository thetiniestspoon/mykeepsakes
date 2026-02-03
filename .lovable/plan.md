

# Ensure Map Filter Can Be Reopened

## Current State

The collapsible filter functionality **already exists** in the codebase:

1. **`MapFilterHeader.tsx` (lines 201-219)**: When `isCollapsed` is `true`, renders a floating button:
   ```tsx
   if (isCollapsed) {
     return (
       <div className="absolute top-3 left-3 z-10">
         <Button variant="secondary" size="sm" onClick={onToggleCollapse}>
           <Filter className="w-4 h-4" />
           {hasActiveFilters && <Badge>...</Badge>}
         </Button>
       </div>
     );
   }
   ```

2. **`RightColumn.tsx` (lines 59-77)**: Manages collapsed state with localStorage persistence

## The Problem

The floating button uses `absolute top-3 left-3` positioning, but when `MapFilterHeader` returns only this absolutely-positioned element, it creates a **zero-height container**. The button renders correctly due to the `relative` parent in `RightColumn`, but may:
- Overlap with Leaflet's default zoom controls
- Be positioned inside the filter component's space rather than clearly in the map area
- Need higher z-index to ensure visibility over map tiles

## Solution

Move the collapsed button rendering **to the parent (`RightColumn.tsx`)** instead of inside `MapFilterHeader`. This provides clearer positioning control and separation of concerns.

---

## Changes Required

### File: `src/components/dashboard/RightColumn.tsx`

**Current structure:**
```tsx
<div className="flex flex-col h-full relative">
  <MapFilterHeader isCollapsed={isFilterCollapsed} ... />
  {/* highlight banner */}
  <div className="flex-1 min-h-0">
    <OverviewMap ... />
  </div>
</div>
```

**New structure:**
```tsx
<div className="flex flex-col h-full relative">
  {/* Collapsed filter button - floats over map */}
  {isFilterCollapsed && (
    <div className="absolute top-3 left-3 z-20">
      <Button variant="secondary" size="sm" onClick={toggleFilterCollapsed} className="shadow-md gap-1.5">
        <Filter className="w-4 h-4" />
        <span className="text-xs">Filters</span>
        {/* Show badge if filters active */}
      </Button>
    </div>
  )}
  
  {/* Filter header - only renders when expanded */}
  {!isFilterCollapsed && (
    <MapFilterHeader
      locations={allLocations}
      days={filterDays}
      onFilteredLocationsChange={handleFilteredLocationsChange}
      focusedLocation={focusedLocation}
      onFocusConsumed={clearLocationFocus}
      onToggleCollapse={toggleFilterCollapsed}
    />
  )}
  
  {/* highlight banner */}
  {/* Map container */}
</div>
```

### File: `src/components/dashboard/MapFilterHeader.tsx`

Remove the collapsed state handling from this component - it will now only render when expanded:
- Delete lines 201-220 (the `if (isCollapsed)` block)
- Remove `isCollapsed` from props interface (keep `onToggleCollapse` for the collapse button in expanded mode)

---

## Visual Improvements

The button in `RightColumn` will:
1. Use `z-20` (higher than map tiles/markers)
2. Include "Filters" text label for better discoverability
3. Show active filter count badge when filters are applied
4. Have consistent shadow for floating appearance

**Button design:**
```
┌────────────────────────────────────────────┐
│  [Filters ⌄]        (top-left of map)      │
│                                             │
│                    MAP                      │
│                                             │
└────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/RightColumn.tsx` | Add collapsed filter button, conditionally render MapFilterHeader |
| `src/components/dashboard/MapFilterHeader.tsx` | Remove collapsed state rendering, simplify to only render expanded state |

---

## Benefits

1. **Clearer responsibility**: Parent controls visibility, child handles content
2. **Reliable positioning**: Button is direct child of the `relative` container
3. **Higher z-index**: Ensures button is always clickable over map elements
4. **Better discoverability**: Adding "Filters" label makes purpose clearer

