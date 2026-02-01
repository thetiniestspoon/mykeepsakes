
# Map Filtering & Bidirectional Navigation

This plan restores the full filtering functionality from the original Map tabs and adds bidirectional navigation between the Details panel and Map panel in the new dashboard architecture.

---

## Current State

The old `DatabaseMapTab.tsx` has robust filtering with:
- **Category filters**: All, Beaches, Dining, Activities, Stay, Transport, Events, Lodging
- **Day filters**: All Days, Mon, Tue, Wed, etc.
- **Scrollable rows** with `ScrollArea` and horizontal `ScrollBar`
- **Toggle logic**: Selecting "All" clears other filters; deselecting all reverts to "All"

The new `RightColumn.tsx` has a simplified placeholder with just day chips that don't function.

---

## Architecture

### Filtering Header at Top of Map

```text
┌──────────────────────────────────────────────┐
│  Categories     [All] [Beaches] [Dining] ▶   │  ← Scrollable row
├──────────────────────────────────────────────┤
│  Days           [All] [Mon] [Tue] [Wed] ▶    │  ← Scrollable row
├──────────────────────────────────────────────┤
│                                              │
│              OVERVIEW MAP                    │
│           (filtered locations)               │
│                                              │
└──────────────────────────────────────────────┘
```

### Bidirectional Navigation Flow

```text
DETAILS PANEL                         MAP PANEL
┌─────────────────┐                 ┌─────────────────┐
│  Activity/Loc   │                 │   Filtered Map  │
│                 │                 │                 │
│  [Show on Map]──┼────────────────▶│   Pin selected  │
│                 │                 │   Map pans to   │
│                 │                 │   location      │
│                 │                 │                 │
│                 │◀────────────────┼── [Pin Clicked] │
│  Detail shown   │                 │                 │
└─────────────────┘                 └─────────────────┘
         │                                   │
         └───── Context navigateToPanel(2) ──┘
                         │
         ┌───── Context navigateToPanel(1) ──┐
         ▼                                   │
    Details panel                      Map panel
```

---

## Key Changes

### 1. Add Panel Navigation to Context

Extend `DashboardSelectionContext` with:
- `navigateToPanel: (index: 0 | 1 | 2) => void` - programmatic panel navigation
- `registerPanelNavigator: (handler) => () => void` - for SwipeableDashboard to register

This allows Detail panels to navigate to the Map panel (index 2) when "Show on Map" is clicked.

### 2. Extract Map Filter Header Component

Create a new `MapFilterHeader.tsx` that:
- Contains category and day filter state
- Renders two scrollable rows with toggle buttons
- Exposes filtered location list via callback/state
- Icons match the original: Waves (beach), Utensils (dining), Activity, Home (stay), etc.

### 3. Update RightColumn

- Remove the old simplified filter chips at the bottom
- Add `MapFilterHeader` at the top
- Pass filtered locations to `OverviewMap`
- Marker clicks: select location → navigate to Details panel (index 1)

### 4. Update Detail Panels

- "Show on Map" button: call `navigateToPanel(2)` + `panMap()` + `highlightPin()`
- This navigates to the Map panel and centers on the location

---

## Component Changes

### New File: `src/components/dashboard/MapFilterHeader.tsx`

```tsx
interface MapFilterHeaderProps {
  locations: MapLocation[];
  days: Day[];
  onFilteredLocationsChange: (locations: MapLocation[]) => void;
  onLocationFocus?: (locationId: string) => void;
}

function MapFilterHeader({ 
  locations, 
  days, 
  onFilteredLocationsChange,
  onLocationFocus 
}: MapFilterHeaderProps) {
  const [activeCategories, setActiveCategories] = useState<Set<CategoryFilter>>(new Set(['all']));
  const [activeDays, setActiveDays] = useState<Set<string>>(new Set(['all']));

  // Filter logic (same as DatabaseMapTab)
  const filteredLocations = useMemo(() => {
    // Category filtering
    // Day filtering  
    // Deduplication
  }, [locations, activeCategories, activeDays]);

  // Notify parent of filtered results
  useEffect(() => {
    onFilteredLocationsChange(filteredLocations);
  }, [filteredLocations, onFilteredLocationsChange]);

  // Focus on specific location (e.g., from context)
  useEffect(() => {
    if (onLocationFocus) {
      // Set filters to show this location
    }
  }, [onLocationFocus]);

  return (
    <div className="border-b border-border bg-card/95 backdrop-blur-sm">
      {/* Category Row */}
      <div className="px-3 py-2 space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Categories</p>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-1.5 pb-1">
            {/* Filter buttons with icons */}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      
      {/* Day Row */}
      <div className="px-3 py-2 space-y-1 border-t border-border/50">
        <p className="text-xs font-medium text-muted-foreground">Days</p>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-1.5 pb-1">
            {/* Day buttons */}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
```

### Modified: `src/contexts/DashboardSelectionContext.tsx`

Add panel navigation capability:

```tsx
interface DashboardSelectionActions {
  // ... existing actions
  
  /** Navigate to a specific panel (0=Itinerary, 1=Details, 2=Map) */
  navigateToPanel: (index: 0 | 1 | 2) => void;
  
  /** Register panel navigator (used by SwipeableDashboard) */
  registerPanelNavigator: (handler: (index: number) => void) => () => void;
}
```

### Modified: `src/components/dashboard/SwipeableDashboard.tsx`

Register the panel navigator with context:

```tsx
const { registerPanelNavigator } = useDashboardSelection();

useEffect(() => {
  return registerPanelNavigator(scrollToPanel);
}, [registerPanelNavigator, scrollToPanel]);
```

### Modified: `src/components/dashboard/RightColumn.tsx`

Complete rewrite to:
- Add MapFilterHeader at top
- Remove old filter chips at bottom
- Use filtered locations from header
- On marker click: navigate to Details panel

### Modified: `src/components/dashboard/DetailPanels/ActivityDetail.tsx`

Update "Show on Map" to navigate:

```tsx
const handleShowOnMap = () => {
  if (activity.location?.lat && activity.location?.lng) {
    panMap(activity.location.lat, activity.location.lng);
    highlightPin(activity.location_id);
    navigateToPanel(2); // Navigate to Map panel
  }
};
```

### Modified: `src/components/dashboard/DetailPanels/LocationDetail.tsx`

Same pattern - "Show on Map" navigates to panel 2.

---

## Filter Button Styling

Compact buttons that work on narrow screens:

```tsx
<Button
  size="sm"
  variant={active ? 'default' : 'outline'}
  onClick={onClick}
  className="shrink-0 h-7 px-2 text-xs"
>
  <Icon className="w-3.5 h-3.5 mr-1" />
  {label}
</Button>
```

Category config matches the original:
- beach: Waves icon, seafoam color
- dining: Utensils icon, coral color
- activity: Activity icon, blue color
- accommodation: Home icon, purple color
- lodging: Building icon, pink color
- transport: Car icon, gray color
- event: PartyPopper icon, gold color

---

## Files Summary

### New Files (1)

| File | Purpose |
|------|---------|
| `src/components/dashboard/MapFilterHeader.tsx` | Scrollable category and day filter rows |

### Modified Files (5)

| File | Changes |
|------|---------|
| `src/contexts/DashboardSelectionContext.tsx` | Add `navigateToPanel` and `registerPanelNavigator` |
| `src/components/dashboard/SwipeableDashboard.tsx` | Register panel navigator with context |
| `src/components/dashboard/RightColumn.tsx` | Add filter header, remove old chips, wire up bidirectional nav |
| `src/components/dashboard/DetailPanels/ActivityDetail.tsx` | "Show on Map" navigates to Map panel |
| `src/components/dashboard/DetailPanels/LocationDetail.tsx` | "Show on Map" navigates to Map panel |

---

## Technical Details

### Filter State Management

Filters are local to `MapFilterHeader` since they're map-specific. The component calls `onFilteredLocationsChange` whenever filters change, and the parent `RightColumn` passes filtered locations to `OverviewMap`.

### Focus on Specific Location

When "Show on Map" is clicked from Details:
1. `navigateToPanel(2)` - swipes to Map panel
2. `panMap(lat, lng)` - tells map to fly to coordinates  
3. `highlightPin(locationId)` - highlights the pin with pulsing animation

Optionally, filters could auto-adjust to ensure the location is visible (e.g., if filtering by "Beaches" but the location is a restaurant, we could reset to "All").

### ScrollArea Constraint

Using `ScrollArea` with `whitespace-nowrap` and `shrink-0` on buttons ensures the filter rows scroll horizontally without wrapping or overflowing the container.

---

## Implementation Order

1. **Add context navigation** - `navigateToPanel` + `registerPanelNavigator` in context
2. **Register navigator** - SwipeableDashboard registers its `scrollToPanel` function
3. **Create MapFilterHeader** - Extract filter UI and logic into reusable component
4. **Update RightColumn** - Integrate MapFilterHeader, wire up bidirectional navigation
5. **Update Detail panels** - "Show on Map" calls `navigateToPanel(2)`
6. **Test end-to-end** - Verify filtering works, bidirectional nav works in both layout modes
