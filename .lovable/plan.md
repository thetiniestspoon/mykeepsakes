

## Fix Day Filter to Show Only Tagged Locations

Currently, when filtering by day, the map still shows all guide items (beaches, restaurants) and lodging because they don't have a `dayId`. This plan updates the filter logic so that toggling a specific day shows **only** the itinerary locations for that day.

---

## Current Behavior vs Expected

| Scenario | Current | Expected |
|----------|---------|----------|
| Filter: "All Days" | Shows all locations | Shows all locations (no change) |
| Filter: "Saturday" | Shows Saturday itinerary items + ALL beaches + ALL restaurants + ALL lodging | Shows **only** Saturday itinerary items |
| Filter: "Mon + Tue" | Shows Mon/Tue items + ALL guide items | Shows **only** Mon + Tue itinerary items |

---

## Implementation

### File: `src/components/MapTab.tsx`

**Change the day filter logic (lines 125-131)**

Current code:
```typescript
// Filter by day
if (!activeDays.has('all')) {
  filtered = filtered.filter(loc => {
    if (!loc.dayId) return true; // Include guide items and lodging
    return activeDays.has(loc.dayId);
  });
}
```

Updated code:
```typescript
// Filter by day - when specific days are selected, only show locations with matching dayId
if (!activeDays.has('all')) {
  filtered = filtered.filter(loc => {
    // Exclude items without a dayId (guide items, lodging) when filtering by specific days
    if (!loc.dayId) return false;
    return activeDays.has(loc.dayId);
  });
}
```

---

## User Experience Impact

- **"All Days" selected**: Map shows everything - itinerary locations, guide beaches, restaurants, and lodging
- **Specific day(s) selected**: Map shows only the itinerary activities for those days - useful for planning a specific day's route
- The location count badge will update dynamically to reflect the filtered count
- The location list below the map will also filter accordingly

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/MapTab.tsx` | Update line 128 from `return true` to `return false` |

This is a one-line change that fixes the filter logic.

