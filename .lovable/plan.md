
# Map Marker Click → Activity Details Panel

## Overview

When tapping a map pin, show the same detailed activity information that appears when clicking the corresponding item in the itinerary. Currently, map pins show a simpler "LocationDetail" view instead of the richer "ActivityDetail" panel with action icons, photos, etc.

---

## Current Flow

```text
Map Pin Click
     ↓
selectItem('location', locationId, location)
     ↓
CenterColumn renders → LocationDetail
```

## Proposed Flow

```text
Map Pin Click
     ↓
Find linked itinerary activity (if exists)
     ↓
Build complete activity data
     ↓
selectItem('activity', activityId, activityData)
     ↓
CenterColumn renders → ActivityDetail
```

---

## Implementation Details

### File: `src/components/dashboard/RightColumn.tsx`

**Changes:**

1. **Update handleMarkerClick** to find the linked activity and select it as an 'activity' type instead of 'location'

2. **Build proper ItineraryItem data** from the LegacyActivity found in the days array, matching the same data transformation used in `CompactActivityCard`

**Current Code (lines 142-159):**
```tsx
const handleMarkerClick = (location: MapLocation) => {
  selectItem('location', location.id, location);
  
  for (const day of days) {
    const linkedActivity = day.activities.find(a => 
      a.location?.name === location.name
    );
    if (linkedActivity) {
      scrollToItem(linkedActivity.id);
      break;
    }
  }
  
  navigateToPanel(1);
};
```

**New Logic:**
```tsx
const handleMarkerClick = (location: MapLocation) => {
  // Find activity linked to this location
  let foundActivity: LegacyActivity | null = null;
  let foundDayId: string | null = null;
  
  for (const day of days) {
    const linkedActivity = day.activities.find(a => 
      a.location?.id === location.id
    );
    if (linkedActivity) {
      foundActivity = linkedActivity;
      foundDayId = day.id;
      scrollToItem(linkedActivity.id);
      break;
    }
  }
  
  if (foundActivity && foundDayId) {
    // Build ItineraryItem-shaped data for ActivityDetail
    const activityData = {
      id: foundActivity.id,
      title: foundActivity.title,
      description: foundActivity.description,
      start_time: foundActivity.rawStartTime || null,
      end_time: foundActivity.rawEndTime || null,
      category: foundActivity.category,
      status: foundActivity.status,
      location_id: foundActivity.location?.id || null,
      location: foundActivity.location ? {
        id: foundActivity.location.id,
        name: foundActivity.location.name,
        lat: foundActivity.location.lat,
        lng: foundActivity.location.lng,
        category: foundActivity.location.category || foundActivity.category,
        trip_id: trip?.id || '',
        address: foundActivity.location.address || null,
        phone: null,
        url: null,
        notes: null,
        visited_at: null,
        created_at: '',
        updated_at: '',
      } : null,
      link: foundActivity.link,
      link_label: foundActivity.linkLabel,
      phone: foundActivity.phone,
      notes: foundActivity.notes,
      day_id: foundDayId,
      trip_id: trip?.id || '',
      item_type: foundActivity.itemType,
      source: 'manual' as const,
      external_ref: null,
      sort_index: 0,
      completed_at: foundActivity.completedAt || null,
      created_at: '',
      updated_at: '',
    };
    
    selectItem('activity', foundActivity.id, activityData);
  } else {
    // Fallback for locations without activities (e.g., lodging)
    selectItem('location', location.id, location);
  }
  
  navigateToPanel(1);
};
```

---

## Additional Considerations

- **Location ID matching**: Changed from matching by `location.name` to matching by `location.id` for more reliable linking
- **Fallback behavior**: If no activity is linked (like standalone lodging pins), still show `LocationDetail` 
- **Trip ID access**: Already available via `useActiveTrip` hook in the component

---

## Testing Checklist

- Tap a map pin for an activity → ActivityDetail opens with icon buttons, time, photos
- Tap a map pin for lodging (no activity) → LocationDetail opens as fallback
- Activity status (visited/favorite) is correctly displayed
- "Add Memory" button works from map-opened detail
- Scrolling sync works (itinerary scrolls to the matching activity)
