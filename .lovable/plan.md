
# Fix: "Show on Map" Single Item Filtering Not Working

## Problem Summary

When clicking "Show on Map" for a single item in the itinerary's Details panel, the user navigates to the map, but **no filtering is applied**. The map shows all locations instead of filtering to the selected item's category and day.

---

## Root Cause

In `CompactActivityCard.tsx` (lines 53-90), when an activity is selected, it builds an `activityData` object that gets passed to `ActivityDetail`. **Critical fields are not properly populated:**

```tsx
const activityData = useMemo(() => ({
  // ...
  location_id: null,  // BUG: Always null - should be activity.location?.id
  location: activity.location ? {
    id: '',           // BUG: Empty string - should be activity.location.id
    // ...
  } : null,
}), [activity, dayId]);
```

In `ActivityDetail.handleShowOnMap()` (lines 47-62), the filtering logic depends on these fields:

```tsx
const handleShowOnMap = () => {
  if (activity.location?.lat && activity.location?.lng) {
    if (activity.location_id) {        // <-- This is null!
      focusLocation({...});             // <-- Never called!
      highlightPin(activity.location_id); // <-- Never called!
    }
    panMap(activity.location.lat, activity.location.lng);  // This still works
    navigateToPanel(2);  // This still works
  }
};
```

Since `location_id` is always `null`, the `focusLocation()` and `highlightPin()` calls **never execute**. The map pans to the correct location, but no filters are applied.

---

## Solution

### Fix 1: Update `CompactActivityCard.tsx` to pass correct location data

The `LegacyActivity` interface already includes `location.id`, so we just need to use it:

```tsx
const activityData = useMemo(() => ({
  // ...
  location_id: activity.location?.id || null,  // Use the actual location ID
  location: activity.location ? {
    id: activity.location.id,  // Use the actual location ID
    name: activity.location.name,
    lat: activity.location.lat,
    lng: activity.location.lng,
    category: activity.category, // Note: LegacyActivity doesn't have location.category
    // ... rest unchanged
  } : null,
}), [activity, dayId]);
```

### Fix 2: Update `LegacyActivity` interface to include location category

To fully fix the category mismatch issue, we need to preserve the location's category when converting from database items.

**In `use-database-itinerary.ts`, update the interface:**
```tsx
export interface LegacyActivity {
  // ...
  location?: {
    id: string;
    lat: number;
    lng: number;
    name: string;
    address?: string;
    category?: string;  // ADD: Location's category from database
  };
}
```

**And update `toActivities()`:**
```tsx
location: item.location ? {
  id: item.location.id,
  lat: item.location.lat!,
  lng: item.location.lng!,
  name: item.location.name,
  address: item.location.address || undefined,
  category: item.location.category || undefined,  // ADD: Preserve location category
} : undefined,
```

### Fix 3: Update `CompactActivityCard.tsx` to use location's category

```tsx
location: activity.location ? {
  id: activity.location.id,
  name: activity.location.name,
  lat: activity.location.lat,
  lng: activity.location.lng,
  category: activity.location.category || activity.category, // Use location's category first
  // ...
} : null,
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/use-database-itinerary.ts` | Add `category` to `LegacyActivity.location` interface and preserve it in `toActivities()` |
| `src/components/dashboard/CompactActivityCard.tsx` | Fix `location_id` and `location.id` to use actual values; use location's category |

---

## Technical Details

### Data Flow After Fix

1. **Database** → `itinerary_items.location_id` links to `locations.id`, which has `category: 'restaurant'`
2. **useDatabaseItinerary** → Converts to `LegacyActivity` with `location: { id: 'uuid', category: 'restaurant' }`
3. **CompactActivityCard** → Builds `activityData` with `location_id: 'uuid'` and `location.category: 'restaurant'`
4. **ActivityDetail** → `handleShowOnMap()` calls `focusLocation({ id: 'uuid', category: 'restaurant', dayId: '...' })`
5. **MapFilterHeader** → Receives focus, maps `restaurant` → `dining`, sets filters
6. **Map** → Shows only locations matching `dining` category and the specified day

### Why Both `location_id` AND `location.id` Need Fixing

- `location_id` is the "flat" foreign key reference used by the context (`highlightPin(activity.location_id)`)
- `location.id` is the nested object ID that other components might use
- Both should match the actual database ID for consistency

---

## Testing Checklist

- [ ] Click on an activity in the left column itinerary
- [ ] Click "Show on Map" in the Details panel
- [ ] Verify the map filters to show only that category and day
- [ ] Verify the pin is highlighted (pulsing animation)
- [ ] Verify the map pans to the correct location
- [ ] Test with different categories (dining, beach, activity)
- [ ] Verify category filter buttons show correct selection state
