
# Implementation Plan: Move Album to Tabs & Collapsible Map Filter

## Summary

This plan reorganizes the dashboard navigation to:
1. Move the Photo Album from the bottom of the left column to a fourth tab in the quick access icons
2. Create dedicated detail views for Stay and Packing (previously just sections within Guide)
3. Make the map filter header collapsible into a floating button

---

## Part 1: Extend Selection Types

**File:** `src/contexts/DashboardSelectionContext.tsx`

Add 'stay' and 'packing' to the SelectionType union:

```typescript
export type SelectionType = 'activity' | 'location' | 'guide' | 'photo' | 'accommodation' | 'album' | 'stay' | 'packing';
```

---

## Part 2: Restructure Tab Navigation

**File:** `src/components/dashboard/QuickIconRow.tsx`

**Changes:**
- Import `Images` icon from lucide-react
- Restructure buttons array with 4 tabs, each with its own `type` field
- Reorder: Guide → Packing → Stay → Album
- Update click handlers to use each button's type
- Update active state logic to check `selectedItem?.type === type`

**New buttons array:**
```typescript
const buttons = [
  { id: 'guide', icon: Book, label: 'Guide', type: 'guide' as SelectionType, section: 'overview' },
  { id: 'packing', icon: ListChecks, label: 'Packing', type: 'packing' as SelectionType, section: 'packing' },
  { id: 'stay', icon: Home, label: 'Stay', type: 'stay' as SelectionType, section: 'lodging' },
  { id: 'album', icon: Images, label: 'Album', type: 'album' as SelectionType, section: 'album' },
];
```

---

## Part 3: Remove Album from Left Column

**File:** `src/components/dashboard/LeftColumn.tsx`

- Remove `AlbumSummaryCard` import
- Remove the `<AlbumSummaryCard />` component and its wrapper `<div className="border-t border-border">` from the JSX

---

## Part 4: Create StayDetail Component

**New File:** `src/components/dashboard/DetailPanels/StayDetail.tsx`

Full-page detail view for accommodation:

**Features:**
- Header with Home icon and "Accommodation" title
- Display selected lodging from `useSelectedLodging()` hook
- Show: name, description, address, beds/baths/guests, amenities list
- Action buttons: "Show on Map" and "Get Directions"
- Empty state when no lodging is selected

**Dependencies:**
- `useSelectedLodging` from `@/hooks/use-lodging`
- `useDashboardSelection` for map navigation
- Icons: Home, ExternalLink, MapPin, Navigation, Bed, Bath, Users

---

## Part 5: Create PackingDetail Component

**New File:** `src/components/dashboard/DetailPanels/PackingDetail.tsx`

Full-page packing list view:

**Features:**
- Header with Backpack icon and "Packing List" title
- Progress bar showing packed/total items
- Items grouped by category (Beach, Clothing, Kids, etc.)
- Each category shows completion badge (e.g., "3/5")
- Checkbox for each item with strike-through when completed

**Dependencies:**
- `PACKING_LIST` from `@/lib/itinerary-data`
- `useChecklistItems`, `useToggleChecklistItem` from `@/hooks/use-trip-data`
- `Progress` component
- `Checkbox` component
- Icons: Backpack, Check

---

## Part 6: Update Center Column Routing

**File:** `src/components/dashboard/CenterColumn.tsx`

**Changes:**
- Import new detail components:
  ```typescript
  import { StayDetail } from './DetailPanels/StayDetail';
  import { PackingDetail } from './DetailPanels/PackingDetail';
  ```
- Add cases in `renderContent()` switch:
  ```typescript
  case 'stay':
    return <StayDetail />;
  case 'packing':
    return <PackingDetail />;
  ```

---

## Part 7: Simplify GuideTab

**File:** `src/components/GuideTab.tsx`

**Removals:**
- Remove imports: `Backpack`, `Home`, `PACKING_LIST`, `PackingItem`, `useChecklistItems`, `useToggleChecklistItem`, `useSelectedLodging`, `StayCard`, `PhotoAlbumSection`, `Checkbox`
- Remove `PackingItemRow` component entirely
- Remove hooks: `useChecklistItems()`, `useSelectedLodging()`
- Remove computed values: `packingByCategory`, `packedCount`, `totalItems`

**JSX Removals:**
- Photo Album accordion item (`<PhotoAlbumSection ... />`)
- Stay accordion item (entire `<AccordionItem value="stay">` block)
- Packing List accordion item (entire `<AccordionItem value="packing">` block)

**Remaining accordion items:** Activities, Events, Beaches, Restaurants

---

## Part 8: Collapsible Map Filter Header

**File:** `src/components/dashboard/MapFilterHeader.tsx`

**Changes:**
- Import `Filter`, `ChevronUp` from lucide-react
- Extend props interface:
  ```typescript
  interface MapFilterHeaderProps {
    // ...existing props
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
  }
  ```
- Calculate `hasActiveFilters` based on whether filters are not 'all'
- Conditional render:
  - **Collapsed:** Return a floating button with Filter icon and badge showing active filter count
  - **Expanded:** Add collapse button (ChevronUp) next to the location count badge

**Collapsed state UI:**
```tsx
if (isCollapsed) {
  return (
    <div className="absolute top-3 left-3 z-10">
      <Button
        variant="secondary"
        size="sm"
        onClick={onToggleCollapse}
        className="shadow-md gap-1.5"
      >
        <Filter className="w-4 h-4" />
        {hasActiveFilters && (
          <Badge variant="default" className="h-5 px-1.5 text-xs">
            {activeFilterCount}
          </Badge>
        )}
      </Button>
    </div>
  );
}
```

---

## Part 9: Update RightColumn for Collapsed State

**File:** `src/components/dashboard/RightColumn.tsx`

**Changes:**
- Add localStorage persistence for collapsed state:
  ```typescript
  const FILTER_COLLAPSED_KEY = 'map-filter-collapsed';
  
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(() => {
    try {
      return localStorage.getItem(FILTER_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  ```
- Add toggle callback with localStorage sync
- Add `relative` class to map container div for absolute positioning of collapsed button
- Pass new props to `MapFilterHeader`:
  ```tsx
  <MapFilterHeader
    isCollapsed={isFilterCollapsed}
    onToggleCollapse={toggleFilterCollapsed}
    // ...existing props
  />
  ```
- Conditionally hide highlight banner when collapsed

---

## Files Summary

| File | Action |
|------|--------|
| `DashboardSelectionContext.tsx` | Add 'stay' and 'packing' to SelectionType |
| `QuickIconRow.tsx` | Restructure with 4 tabs, each with own type |
| `LeftColumn.tsx` | Remove AlbumSummaryCard |
| `StayDetail.tsx` | **NEW** - Accommodation detail view |
| `PackingDetail.tsx` | **NEW** - Packing list detail view |
| `CenterColumn.tsx` | Add routing for stay/packing types |
| `GuideTab.tsx` | Remove Photo Album, Stay, Packing sections |
| `MapFilterHeader.tsx` | Add collapsed state rendering |
| `RightColumn.tsx` | Manage collapsed state with localStorage |

---

## Testing Checklist

- [ ] Tap Guide tab → shows simplified GuideTab (Activities, Events, Beaches, Restaurants only)
- [ ] Tap Packing tab → shows PackingDetail with progress bar and checkboxes
- [ ] Tap Stay tab → shows StayDetail with selected lodging or empty state
- [ ] Tap Album tab → shows AlbumExperience in center column
- [ ] Collapse map filter → shows floating Filter button
- [ ] Expand map filter → shows full filter rows with collapse button
- [ ] Filter state persists across page reloads via localStorage
- [ ] Active filter count badge appears on collapsed button when filters are applied

