
# Convert Map Icon to Interactive Button

## Overview

Transform the static map pin icon in itinerary activity cards into a circular button that, when pressed, opens and focuses on that item in the map section.

---

## Current Behavior

- The `MapPin` icon is purely decorative - it just indicates an activity has a location
- Located at the right end of each `CompactActivityCard`
- Currently inside the main clickable button (clicking it selects the activity in the center panel)

---

## New Behavior

1. User taps the circular map button
2. Map panel opens (on mobile, swipes to panel 2)
3. Map pans to the activity's location
4. Pin is highlighted with the activity's category filter applied

---

## Technical Changes

### File: `src/components/dashboard/CompactActivityCard.tsx`

**1. Separate the map button from the main clickable area**

Move the map button outside the main `<button>` so it has its own click handler that doesn't trigger activity selection.

**2. Create a styled circular button**

```tsx
{/* Show on Map button */}
{activity.location && (
  <button
    onClick={handleShowOnMap}
    className={cn(
      "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
      "bg-primary/10 hover:bg-primary/20 active:bg-primary/30",
      "text-primary transition-colors mr-1.5"
    )}
    aria-label="Show on map"
  >
    <MapPin className="w-3.5 h-3.5" />
  </button>
)}
```

**3. Add the map navigation handler**

```tsx
const handleShowOnMap = (e: React.MouseEvent) => {
  e.stopPropagation(); // Don't trigger card selection
  if (!dashboard || !activity.location) return;
  
  // Navigate to map panel (index 2)
  dashboard.navigateToPanel(2);
  
  // Focus the location (sets filters to match this item)
  dashboard.focusLocation({
    id: activity.location.id,
    category: activity.category,
    dayId: dayId,
  });
  
  // Pan to the location
  dashboard.panMap(activity.location.lat, activity.location.lng);
  
  // Highlight the pin
  dashboard.highlightPin(activity.location.id);
};
```

---

## Updated Component Structure

```text
┌─────────────────────────────────────────────────────────┐
│ [⋮] │ [🍽] │ 9:00a  Breakfast at Café    │ [🗺️] │
│grip │icon │ title + time               │ map  │
│     │     │ (clickable - selects item) │ btn  │
└─────────────────────────────────────────────────────────┘
         ↑                                    ↑
    Main button area                    Separate map
    (selects activity)                  button (opens
                                        map panel)
```

---

## Visual Design

The circular map button will have:
- **Size**: 28px (w-7 h-7)
- **Shape**: Fully rounded (rounded-full)
- **Color**: Primary color with 10% opacity background
- **Hover**: 20% opacity
- **Active/pressed**: 30% opacity
- **Icon**: MapPin in primary color, 14px

---

## Edge Cases

1. **Activities without location**: Button doesn't appear (same as current behavior)
2. **Wide layout (desktop)**: `navigateToPanel()` is a no-op, but map still pans and highlights
3. **Completed activities**: Button still works (users may want to see where they went)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/CompactActivityCard.tsx` | Add `handleShowOnMap` handler, convert MapPin to circular button, restructure layout to separate map button from main click area |
