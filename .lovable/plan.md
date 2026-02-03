
# Fix Pin Drag Persistence - Query Cache Invalidation

## Problem Identified

The database update **IS working** (verified via network logs showing successful PATCH with status 200), but the UI doesn't reflect the change because of a query cache mismatch.

### Root Cause

Two different query keys are used for locations:

| Hook | Query Key | Used By |
|------|-----------|---------|
| `useLocations()` | `['locations', tripId]` | Various detail components |
| `useDatabaseLocations()` | `['trip-locations', tripId]` | Map (RightColumn) |

When `useUpdateLocation` runs, it only invalidates `['locations', tripId]`, not `['trip-locations', tripId]`. The map's data source is never refreshed.

---

## Solution

Update `useUpdateLocation` in `use-locations.ts` to **also invalidate the `trip-locations` query** used by the map.

---

## Changes Required

### File: `src/hooks/use-locations.ts`

In the `useUpdateLocation` hook's `onSuccess` callback, add invalidation for the `trip-locations` query:

```typescript
// Update a location
export function useUpdateLocation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Location> & { id: string }) => {
      const { data, error } = await supabase
        .from('locations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Location;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['locations', data.trip_id] });
      queryClient.invalidateQueries({ queryKey: ['locations-with-days', data.trip_id] });
      // Also invalidate the map's location query
      queryClient.invalidateQueries({ queryKey: ['trip-locations', data.trip_id] });
    },
    onError: (error) => {
      console.error('Failed to update location:', error);
      toast.error('Failed to update location');
    }
  });
}
```

---

## Why This Fixes the Issue

1. User drags pin → `onLocationDrag` called
2. `updateLocation.mutate()` sends PATCH to Supabase (already works)
3. Database updates → mutation succeeds
4. `onSuccess` now invalidates `['trip-locations', trip_id]`
5. `useDatabaseLocations()` refetches fresh data
6. Map re-renders with new coordinates
7. Pin stays in new position

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/use-locations.ts` | Add `queryClient.invalidateQueries({ queryKey: ['trip-locations', data.trip_id] })` to `useUpdateLocation`'s `onSuccess` |

---

## Technical Note

The accommodations update should already work correctly because `useAccommodations` uses query key `['accommodations', trip?.id]` and `useUpdateAccommodation` invalidates `['accommodations']` broadly - the map rebuilds its accommodation pins from that same query.
