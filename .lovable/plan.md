
# Refined Plan: Multi-Location "Show on Map"

## Overview

Extend the existing **`DashboardSelectionContext`** (not a new `MapHighlightContext`) to support highlighting multiple locations simultaneously, enabling "Show Day on Map" functionality with auto-zoom and a dismissible banner.

---

## Current Architecture Summary

The app uses `DashboardSelectionContext` for all cross-panel synchronization:
- **`focusLocation()`** - sets category/day filters via `focusedLocation` state
- **`highlightPin()`** - highlights a single pin via `highlightedMapPin` state
- **`panMap()`** - triggers map panning via `panToLocation` state
- **`navigateToPanel()`** - switches to Map panel (index 2) on mobile

**Important:** There is no `MapHighlightContext.tsx` - the user's original plan referenced a non-existent file.

---

## Phase 1: Extend DashboardSelectionContext

**File:** `src/contexts/DashboardSelectionContext.tsx`

### Changes to State
```tsx
// Before (line ~43-44)
highlightedMapPin: string | null;

// After - support array + label
highlightedMapPins: string[];  // Array of location IDs (empty = no highlight)
highlightLabel: string | null; // Label for the group, e.g., "Friday - Beach Day"
```

### Changes to Actions
```tsx
// Keep single-pin function for backward compatibility
highlightPin: (locationId: string | null) => void;

// Add new multi-location function
highlightPins: (locationIds: string[], label: string) => void;

// Add clear function (already exists as clearSelection, but make explicit)
clearHighlightedPins: () => void;
```

### Implementation
```tsx
// State
const [highlightedMapPins, setHighlightedMapPins] = useState<string[]>([]);
const [highlightLabel, setHighlightLabel] = useState<string | null>(null);

// Single pin (backward compatible - wraps into array)
const highlightPin = useCallback((locationId: string | null) => {
  if (locationId) {
    setHighlightedMapPins([locationId]);
    setHighlightLabel(null);
  } else {
    setHighlightedMapPins([]);
    setHighlightLabel(null);
  }
}, []);

// Multiple pins
const highlightPins = useCallback((locationIds: string[], label: string) => {
  setHighlightedMapPins(locationIds);
  setHighlightLabel(label);
}, []);

// Clear all
const clearHighlightedPins = useCallback(() => {
  setHighlightedMapPins([]);
  setHighlightLabel(null);
}, []);
```

---

## Phase 2: Update RightColumn (Map Panel)

**File:** `src/components/dashboard/RightColumn.tsx`

### Changes

1. **Receive new state from context:**
```tsx
const { 
  highlightedMapPins,  // Changed from highlightedMapPin
  highlightLabel,
  clearHighlightedPins,
  // ... other existing
} = useDashboardSelection();
```

2. **Add dismissible banner when pins are highlighted:**
```tsx
{highlightedMapPins.length > 0 && highlightLabel && (
  <div className="flex items-center justify-between px-3 py-2 bg-primary/10 border-b border-primary/20">
    <div className="flex items-center gap-2 text-sm">
      <MapPin className="w-4 h-4 text-primary" />
      <span className="font-medium text-primary">
        {highlightLabel}
        {highlightedMapPins.length > 1 && ` (${highlightedMapPins.length} locations)`}
      </span>
    </div>
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={clearHighlightedPins}
      className="h-6 px-2 text-xs"
    >
      <X className="w-3 h-3 mr-1" />
      Show All
    </Button>
  </div>
)}
```

3. **Pass highlighted IDs to OverviewMap:**
```tsx
<OverviewMap
  locations={filteredLocations || []}
  onMarkerClick={handleMarkerClick}
  highlightedPinIds={highlightedMapPins}  // Array instead of single ID
  onMapReady={handleMapReady}
  skipBoundsFit={hasPendingPan}
  className="h-full"
/>
```

---

## Phase 3: Update OverviewMap to Support Multiple Highlights

**File:** `src/components/map/OverviewMap.tsx`

### Changes to Props
```tsx
interface OverviewMapProps {
  // Before
  highlightedPinId?: string | null;
  
  // After
  highlightedPinIds?: string[];
}
```

### Changes to Marker Logic (around line 218)
```tsx
const isHighlighted = highlightedPinIds?.includes(location.id) ?? false;
```

### Changes to Diff Logic (around line 203)
```tsx
const newHighlightIds = (highlightedPinIds || []).sort().join(',');
const highlightChanged = newHighlightIds !== prevHighlightedPinsRef.current;
// ...
prevHighlightedPinsRef.current = newHighlightIds;
```

---

## Phase 4: Add "Show Day on Map" Button to DatabaseDayCard

**File:** `src/components/itinerary/DatabaseDayCard.tsx`

### Add to Imports
```tsx
import { useDashboardSelection } from '@/contexts/DashboardSelectionContext';
import { toast } from 'sonner';
import { Map } from 'lucide-react';
```

### Add Hook and Handler
```tsx
const { highlightPins, navigateToPanel } = useDashboardSelection();

const handleShowDayOnMap = useCallback(() => {
  // Get activities with valid location coordinates
  const locationsWithCoords = day.activities
    .filter(a => a.location?.lat && a.location?.lng && a.location_id)
    .map(a => a.location_id!);
  
  if (locationsWithCoords.length === 0) {
    toast.info('No locations to show on map for this day');
    return;
  }
  
  // Highlight all pins for this day
  highlightPins(locationsWithCoords, `${day.dayOfWeek} - ${day.title}`);
  
  // Navigate to Map panel
  navigateToPanel(2);
}, [day, highlightPins, navigateToPanel]);
```

### Add Button in Header (around line 202, next to progress indicator)
```tsx
<div className="flex items-center gap-3">
  {/* Show on Map button */}
  <button
    onClick={(e) => {
      e.stopPropagation(); // Prevent collapsible toggle
      handleShowDayOnMap();
    }}
    className="p-1.5 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-accent transition-colors"
    title="Show day on map"
  >
    <Map className="w-4 h-4" />
  </button>
  
  {/* Existing progress indicator */}
  <div className="flex items-center gap-2">
    {progressPercent === 100 && (
      <CheckCircle2 className="w-4 h-4 text-green-600 animate-bounce-in" />
    )}
    {/* ... rest */}
  </div>
</div>
```

---

## Phase 5: Update Existing Single-Item Calls

The following files already use `highlightPin()` for single items - they will continue to work because we're keeping backward compatibility:

| File | Current Usage | Change Needed |
|------|--------------|---------------|
| `ActivityDetail.tsx` | `highlightPin(activity.location_id)` | None - works as-is |
| `LocationDetail.tsx` | `highlightPin(location.id)` | None - works as-is |
| `DatabaseActivityCard.tsx` | Uses `onOpenMap` prop | None - parent handles it |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/contexts/DashboardSelectionContext.tsx` | Add `highlightedMapPins[]`, `highlightLabel`, `highlightPins()`, `clearHighlightedPins()` |
| `src/components/dashboard/RightColumn.tsx` | Add highlight banner, pass array to OverviewMap |
| `src/components/map/OverviewMap.tsx` | Change `highlightedPinId` to `highlightedPinIds[]` |
| `src/components/itinerary/DatabaseDayCard.tsx` | Add "Show Day on Map" button with handler |

---

## Technical Details

### Why Extend Existing Context vs New Context?

1. **Single source of truth** - All dashboard synchronization already flows through `DashboardSelectionContext`
2. **Avoids prop drilling** - Components already consume this context
3. **Simpler state management** - No need to coordinate between multiple contexts
4. **Backward compatible** - Existing `highlightPin(id)` calls continue working

### Auto-Zoom Behavior

When multiple pins are highlighted, `OverviewMap` already has bounds-fitting logic:
- If `locations.length > 1`, it calls `fitBounds()` with padding
- When filtering to highlighted pins, the map will auto-zoom to encompass all of them
- The `skipBoundsFit` prop prevents this during manual panning

### Banner UX

The dismissible banner provides:
- Visual feedback showing what's being filtered
- Location count for context
- "Show All" button to clear filters and return to normal view

---

## Future Extensions (Not in This Scope)

- **Show Favorites on Map** - Add button in FavoritesTab header
- **Show Completed on Map** - Filter to visited/completed locations
- **Show Category on Map** - Already exists via category filter buttons

---

## Testing Checklist

- [ ] Single item "Show on Map" still works (backward compatibility)
- [ ] Day "Show Day on Map" button shows all day's locations on map
- [ ] Banner shows correct label and location count
- [ ] Map auto-zooms to fit all highlighted pins
- [ ] "Show All" button clears highlight and removes banner
- [ ] Toast appears when day has no locations with coordinates
- [ ] Button click doesn't collapse/expand day card
- [ ] Mobile: Panel navigation works correctly

