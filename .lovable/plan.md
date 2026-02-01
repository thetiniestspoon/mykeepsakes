
# Fixing Map Issues: Invalid Dates and Infinite Pin Loop

This plan addresses two bugs preventing the map from working correctly:
1. **Invalid Date** - Day filter buttons show "Invalid Date" instead of day names
2. **Infinite Pin Loop** - Markers continuously re-animate because of a render cycle

---

## Root Cause Analysis

### Bug 1: Invalid Date

**Data Flow Issue:**

```text
useTripDays() → ItineraryDay { date: "2026-07-25" }
       ↓
useDatabaseItinerary() → LegacyDay { date: "Saturday, July 25, 2026" }
       ↓
RightColumn.filterDays → { date: "Saturday, July 25, 2026" }
       ↓
MapFilterHeader → new Date("Saturday, July 25, 2026T00:00:00") → Invalid Date
```

The `useDatabaseItinerary()` hook formats the date for display purposes, but `MapFilterHeader` expects the raw ISO date format for parsing.

### Bug 2: Infinite Pin Loop

**Render Cycle:**

```text
RightColumn renders
       ↓
allLocations useMemo creates new array (dependencies changing)
       ↓
MapFilterHeader receives new locations prop
       ↓
filteredLocations useMemo creates new array
       ↓
useEffect calls onFilteredLocationsChange(filteredLocations)
       ↓
setFilteredLocations() triggers RightColumn re-render
       ↓
OverviewMap receives new filteredLocations, clears and re-adds all markers
       ↓
Markers play drop-in animation again... LOOP
```

---

## Solution

### Fix 1: Use Raw Days Data

`RightColumn` should get raw days from `useDatabaseLocations()` (which internally uses `useTripDays`) instead of the formatted days from `useDatabaseItinerary()`.

```tsx
// RightColumn.tsx - BEFORE
const { days } = useDatabaseItinerary();
const filterDays = useMemo(() => {
  return days.map(day => ({
    id: day.id,
    date: day.date,  // ❌ Already formatted: "Saturday, July 25, 2026"
    title: day.title,
  }));
}, [days]);
```

```tsx
// RightColumn.tsx - AFTER
const { days: rawDays } = useDatabaseLocations();
const filterDays = useMemo(() => {
  return rawDays.map(day => ({
    id: day.id,
    date: day.date,  // ✅ Raw ISO: "2026-07-25"
    title: day.title,
  }));
}, [rawDays]);
```

### Fix 2: Stabilize the Filter Effect

The `useEffect` in `MapFilterHeader` that notifies the parent should not run on every render. We need to either:

**Option A**: Remove `onFilteredLocationsChange` from the effect dependencies and compare values before calling:

```tsx
// MapFilterHeader.tsx - Stabilized effect
const prevFilteredRef = useRef<MapLocation[]>([]);

useEffect(() => {
  // Only call if the filtered locations actually changed
  const prevIds = prevFilteredRef.current.map(l => l.id).join(',');
  const newIds = filteredLocations.map(l => l.id).join(',');
  
  if (prevIds !== newIds) {
    prevFilteredRef.current = filteredLocations;
    onFilteredLocationsChange(filteredLocations);
  }
}, [filteredLocations]); // Note: onFilteredLocationsChange intentionally omitted
```

**Option B**: Move the filter logic to the parent (`RightColumn`) so there's no callback needed:

```tsx
// RightColumn.tsx - Filter state lifted to parent
const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set(['all']));
const [activeDays, setActiveDays] = useState<Set<string>>(new Set(['all']));

const filteredLocations = useMemo(() => {
  // Filter logic here, no callback needed
}, [allLocations, activeCategories, activeDays]);
```

**Recommended**: Option A is simpler since it preserves the current component structure.

### Fix 3: Stabilize OverviewMap Marker Updates

The `OverviewMap` clears and re-adds ALL markers whenever `locations` changes. This should be optimized to only update changed markers:

```tsx
// OverviewMap.tsx - Add marker diffing
useEffect(() => {
  if (!mapInstanceRef.current || !markersLayerRef.current) return;

  const currentMarkerIds = new Set(
    Array.from(markersLayerRef.current.getLayers())
      .map((m: any) => m.options.locationId)
  );
  const newLocationIds = new Set(locations.map(l => l.id));

  // Only clear and rebuild if locations actually changed
  const idsMatch = currentMarkerIds.size === newLocationIds.size && 
    [...currentMarkerIds].every(id => newLocationIds.has(id));

  if (idsMatch && !highlightedPinId) return; // Skip if no change

  // ... rest of marker update logic
}, [locations, highlightedPinId]);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/RightColumn.tsx` | Use raw days from `useDatabaseLocations()` instead of formatted days |
| `src/components/dashboard/MapFilterHeader.tsx` | Add ref-based comparison to prevent redundant callbacks |
| `src/components/map/OverviewMap.tsx` | Add marker diffing to prevent unnecessary re-renders |

---

## Implementation Details

### RightColumn.tsx Changes

```tsx
// BEFORE (line 24, 97-103)
const { days } = useDatabaseItinerary();
...
const filterDays = useMemo(() => {
  return days.map(day => ({
    id: day.id,
    date: day.date,
    title: day.title,
  }));
}, [days]);

// AFTER
const { days: rawDays } = useDatabaseLocations();
...
const filterDays = useMemo(() => {
  return rawDays.map(day => ({
    id: day.id,
    date: day.date,  // Now ISO format: "2026-07-25"
    title: day.title,
  }));
}, [rawDays]);
```

Note: We'll keep using `days` from `useDatabaseItinerary()` for the activity data since `handleMarkerClick` still needs it.

### MapFilterHeader.tsx Changes

```tsx
// BEFORE (lines 89-92)
useEffect(() => {
  onFilteredLocationsChange(filteredLocations);
}, [filteredLocations, onFilteredLocationsChange]);

// AFTER
const prevFilteredRef = useRef<string>('');

useEffect(() => {
  const currentIds = filteredLocations.map(l => l.id).sort().join(',');
  if (currentIds !== prevFilteredRef.current) {
    prevFilteredRef.current = currentIds;
    onFilteredLocationsChange(filteredLocations);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [filteredLocations]);
```

### OverviewMap.tsx Changes

Add location ID tracking to markers and compare before clearing:

```tsx
// Track location IDs to detect actual changes
const prevLocationIdsRef = useRef<string>('');

useEffect(() => {
  if (!mapInstanceRef.current || !markersLayerRef.current) return;

  const newIds = locations.map(l => l.id).sort().join(',');
  const idsChanged = newIds !== prevLocationIdsRef.current;
  
  // Only rebuild markers if locations actually changed
  if (!idsChanged && !highlightedPinId) {
    return;
  }
  
  prevLocationIdsRef.current = newIds;
  
  // Clear existing markers
  markersLayerRef.current.clearLayers();
  
  // ... rest of marker creation
}, [locations, bounds, onMarkerClick, highlightedPinId]);
```

---

## Summary

| Issue | Cause | Fix |
|-------|-------|-----|
| Invalid Date | `useDatabaseItinerary` returns formatted dates, `MapFilterHeader` expects ISO | Use `rawDays` from `useDatabaseLocations` which has ISO dates |
| Infinite loop | Effect triggers callback on every render, causing state update cycle | Add ref-based comparison to only trigger callback when IDs actually change |
| Repeated animations | `OverviewMap` clears/rebuilds all markers when `locations` array reference changes | Add ID comparison to skip rebuild when locations haven't actually changed |
