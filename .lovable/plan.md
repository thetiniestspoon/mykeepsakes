
# Fix: Trip Selection Not Persisting

## Problem

When changing the current trip in Settings, the selection reverts back to the original trip. This happens because:

1. `TripSelector` uses `queryClient.setQueryData(['active-trip'], trip)` to set the selected trip
2. This only updates the React Query cache temporarily
3. When the `['active-trip']` query refetches (on window focus, component mount, or background refresh), the `queryFn` runs again
4. The `queryFn` calculates the "active" trip based on date logic (active → upcoming → past), completely ignoring the user's selection

## Solution

Persist the selected trip ID in `localStorage` and modify `useActiveTrip()` to respect user selection over date-based auto-selection.

---

## Implementation

### File: `src/hooks/use-trip.ts`

**Changes to `useActiveTrip()`:**

1. Check `localStorage` for a manually selected trip ID first
2. If found and valid, return that trip
3. Otherwise, fall back to the existing date-based logic

```typescript
const SELECTED_TRIP_KEY = 'selected-trip-id';

export function useActiveTrip() {
  return useQuery({
    queryKey: ['active-trip'],
    queryFn: async () => {
      // First check for manually selected trip
      const selectedId = localStorage.getItem(SELECTED_TRIP_KEY);
      if (selectedId) {
        const { data: selected, error } = await supabase
          .from('trips')
          .select('*')
          .eq('id', selectedId)
          .maybeSingle();
        
        // If the selected trip exists, return it
        if (!error && selected) return selected as Trip;
        
        // If trip was deleted, clear the selection
        localStorage.removeItem(SELECTED_TRIP_KEY);
      }
      
      // Fall back to date-based auto-selection
      const today = new Date().toISOString().split('T')[0];
      
      // ... existing logic for active → upcoming → past ...
    }
  });
}
```

**New hook: `useSelectTrip()`:**

Create a mutation to set the selected trip and persist it:

```typescript
export function useSelectTrip() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tripId: string) => {
      localStorage.setItem(SELECTED_TRIP_KEY, tripId);
      
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();
      
      if (error) throw error;
      return data as Trip;
    },
    onSuccess: (trip) => {
      queryClient.setQueryData(['active-trip'], trip);
      queryClient.invalidateQueries({ queryKey: ['active-trip'] });
      toast.success(`Switched to ${trip.title}`);
    },
    onError: () => {
      toast.error('Failed to switch trip');
    }
  });
}
```

---

### File: `src/components/trips/TripSelector.tsx`

**Changes:**

Replace the direct cache manipulation with the new mutation hook:

```typescript
// Before
const handleSelectTrip = (trip: Trip) => {
  queryClient.setQueryData(['active-trip'], trip);
};

// After
import { useSelectTrip } from '@/hooks/use-trip';

const selectTrip = useSelectTrip();

const handleSelectTrip = (trip: Trip) => {
  selectTrip.mutate(trip.id);
};
```

---

### File: `src/hooks/use-trip.ts` - Update `useDeleteTrip()`

**Changes:**

When deleting a trip, clear the localStorage selection if it matches the deleted trip:

```typescript
export function useDeleteTrip() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tripId: string) => {
      // Clear selection if deleting the selected trip
      const selectedId = localStorage.getItem(SELECTED_TRIP_KEY);
      if (selectedId === tripId) {
        localStorage.removeItem(SELECTED_TRIP_KEY);
      }
      
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['active-trip'] });
      toast.success('Trip deleted');
    },
    // ... existing error handling
  });
}
```

---

## Files Summary

| File | Action |
|------|--------|
| `src/hooks/use-trip.ts` | Update `useActiveTrip()` to check localStorage first; add `useSelectTrip()` hook; update `useDeleteTrip()` to clear selection |
| `src/components/trips/TripSelector.tsx` | Use new `useSelectTrip()` instead of direct cache manipulation |

---

## Testing Checklist

- [ ] Select a different trip in Settings → verify it persists after closing the dialog
- [ ] Refresh the page → verify the selected trip is still active
- [ ] Switch browser tabs and return → verify selection persists
- [ ] Delete the currently selected trip → verify it falls back to date-based selection
- [ ] Create a new trip and select it → verify it becomes active
