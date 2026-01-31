

## Extend Trip Dates - Implementation Plan

This plan modifies the trip from 7 days to 8 days by converting the current departure day into a full day of activities and adding a new departure day.

---

## Summary of Changes

| Before | After |
|--------|-------|
| Day 7 (July 31) = "Departure Day" | Day 7 (July 31) = "Last Full Day" |
| Trip ends July 31 | Day 8 (August 1) = "Departure Day" |
| 7 days total | 8 days total |
| 3 activities on Day 7 | 6 activities on Day 7 |

---

## Implementation Details

### File: `src/lib/itinerary-data.ts`

#### 1. Modify Day 7 (lines 353-382)

**Current Day 7:**
- id: 'day-7'
- date: 'Friday, July 31, 2026'
- title: 'Departure Day'
- 3 basic activities (breakfast, checkout, depart)

**New Day 7:**
- id: 'day-7'
- date: 'Friday, July 31, 2026'
- title: 'Last Full Day'
- 6 new activities:

| ID | Time | Activity | Category | Location |
|----|------|----------|----------|----------|
| day7-breakfast | 9:00 AM | Leisurely Breakfast at Cafe Heaven | dining | Cafe Heaven |
| day7-kayak | 10:30 AM | Kayaking or Paddleboarding | activity | Provincetown Harbor |
| day7-lunch | 1:00 PM | Lunch at Fanizzi's by the Sea | dining | Fanizzi's Restaurant |
| day7-shopping | 3:00 PM | Last-Minute Shopping | activity | Commercial Street |
| day7-beach | 5:00 PM | Final Beach Sunset at Herring Cove | beach | Herring Cove Beach |
| day7-dinner | 7:30 PM | Farewell Dinner at The Red Inn | dining | The Red Inn |

#### 2. Add New Day 8 (insert after Day 7)

**New Day 8:**
- id: 'day-8'
- date: 'Saturday, August 1, 2026'
- dayOfWeek: 'Saturday'
- title: 'Departure Day'
- 3 activities (moved from old Day 7):

| ID | Time | Activity | Category |
|----|------|----------|----------|
| day8-breakfast | 8:00 AM | Quick Breakfast | dining |
| day8-checkout | 10:00 AM | Check Out | accommodation |
| day8-depart | 11:00 AM | Head Home | transport |

---

## New Locations for Map

The new activities add these map markers:

| Activity | Lat | Lng | Name |
|----------|-----|-----|------|
| Kayaking | 42.0540 | -70.1835 | Provincetown Harbor |
| Fanizzi's | 42.0495 | -70.1900 | Fanizzi's Restaurant |
| Shopping | 42.0525 | -70.1855 | Commercial Street |
| Red Inn | 42.0565 | -70.1902 | The Red Inn |

Herring Cove already exists in the BEACHES data.

---

## Database Considerations

Existing user data in Supabase should remain compatible:

- **custom_activities**: Keyed by `day_id` (e.g., 'day-7'). Custom activities added to Day 7 will stay on Day 7 (now "Last Full Day")
- **activity_overrides**: The old activity IDs (`day7-breakfast`, `day7-checkout`, `day7-depart`) are being repurposed or renamed:
  - `day7-breakfast` - Repurposed (now 9:00 AM at Cafe Heaven instead of generic farewell)
  - `day7-checkout` - Moved to `day8-checkout`
  - `day7-depart` - Moved to `day8-depart`
- **activity_order**: Entries for the old Day 7 IDs will still work for `day7-breakfast` but `day7-checkout` and `day7-depart` no longer exist

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/itinerary-data.ts` | Replace Day 7 activities, add Day 8 |

---

## Expected Outcome

The trip now spans 8 days with a relaxed final full day featuring:
- Leisurely morning activities (breakfast, water sports)
- Afternoon leisure (lunch, shopping)
- Memorable farewell (sunset beach, nice dinner)
- Clean departure on Day 8

