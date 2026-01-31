
## Add Tap-to-Edit for All Itinerary Activities

Enable users to tap on any activity in the itinerary to edit its details (time, title, description, link, phone, map location).

---

## Current Situation

| Activity Type | Source | Editable? |
|--------------|--------|-----------|
| Base activities | `itinerary-data.ts` (static) | No - read only |
| Custom activities | `custom_activities` table | Yes - full CRUD |

Currently, only custom activities show an edit button. Base activities from the static itinerary data cannot be modified.

---

## Solution: Activity Overrides Table

Create a new database table to store user edits to base activities. When displaying an activity, merge any overrides on top of the base data.

### New Database Table: `activity_overrides`

```sql
CREATE TABLE activity_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id TEXT UNIQUE NOT NULL,  -- matches the base activity ID
  title TEXT,                         -- NULL means use base value
  description TEXT,
  time TEXT,
  category TEXT,
  location_name TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  link TEXT,
  link_label TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

When a field is NULL, the base value is used. When a field has a value, it overrides the base.

---

## Implementation Changes

### 1. Database Migration
Create the `activity_overrides` table with appropriate RLS policies (public access to match existing patterns).

### 2. New Hook: `useActivityOverrides`
**File:** `src/hooks/use-activity-order.ts`

Add functions for:
- `useActivityOverrides()` - fetch all overrides
- `useUpsertActivityOverride()` - create or update an override
- `useDeleteActivityOverride()` - reset to base values

### 3. Update ActivityEditor Component
**File:** `src/components/itinerary/ActivityEditor.tsx`

Extend the editor to handle three cases:
- **Adding new custom activity** (current behavior)
- **Editing custom activity** (current behavior)
- **Editing base activity** (NEW - saves to overrides table)

Add new props:
```typescript
interface ActivityEditorProps {
  // ... existing props
  isBaseActivity?: boolean;  // true if editing a base activity
  baseActivityId?: string;   // the ID of the base activity being edited
}
```

### 4. Update ItineraryTab
**File:** `src/components/ItineraryTab.tsx`

Changes to `DayCard` component:
- Remove the `isCustom` condition for showing the edit button - all activities get an edit button
- Update `handleEditActivity` to work with both base and custom activities
- Merge override data with base activities when displaying

Changes to `ActivityCard` component:
- Make the entire card tappable (or add a more prominent edit affordance)
- Always show the edit button, not just for custom activities

### 5. Merge Logic
When displaying activities, apply overrides:

```typescript
function applyOverride(baseActivity: Activity, override?: ActivityOverride): Activity {
  if (!override) return baseActivity;
  
  return {
    ...baseActivity,
    title: override.title ?? baseActivity.title,
    description: override.description ?? baseActivity.description,
    time: override.time ?? baseActivity.time,
    category: override.category ?? baseActivity.category,
    location: override.location_name ? {
      lat: override.location_lat ?? 0,
      lng: override.location_lng ?? 0,
      name: override.location_name
    } : baseActivity.location,
    link: override.link ?? baseActivity.link,
    linkLabel: override.link_label ?? baseActivity.linkLabel,
    phone: override.phone ?? baseActivity.phone,
    notes: override.notes ?? baseActivity.notes,
  };
}
```

---

## UI/UX Changes

### Making Activities Tappable

Option A: **Tap entire card to edit** (simpler)
- Tap anywhere on the activity card opens the editor
- Move checkbox, star, note, and photo buttons to prevent accidental edits

Option B: **Keep edit button but show for all** (recommended)
- Show the edit (pencil) icon for ALL activities, not just custom ones
- Keeps the current interaction model consistent

I recommend Option B as it's less disruptive and clearer in intent.

### Editor Improvements

Add a "Reset to Default" button when editing base activities:
- Deletes the override record
- Returns the activity to its original values from `itinerary-data.ts`

---

## Files to Modify

| File | Changes |
|------|---------|
| (new migration) | Create `activity_overrides` table with RLS |
| `src/hooks/use-activity-order.ts` | Add override hooks and merge function |
| `src/components/itinerary/ActivityEditor.tsx` | Support editing base activities, add "Reset" option |
| `src/components/ItineraryTab.tsx` | Show edit button for all activities, apply overrides |

---

## Technical Details

### Why an Overrides Table?

1. **Preserves original data** - Base itinerary remains intact
2. **Easy reset** - Delete the override to restore defaults
3. **Selective updates** - Only store what changed (NULL = use base)
4. **Syncs across devices** - Stored in database like other trip data

### Edge Cases

- **Location editing**: Allow manual lat/lng entry or location search (future enhancement)
- **Category changes**: User can recategorize activities
- **Conflicting edits**: Last write wins (acceptable for family trip app)

---

## Expected User Experience

1. User taps pencil icon on any activity (or the activity itself)
2. Editor sheet slides up with current values pre-filled
3. User modifies any fields (time, title, description, link, phone, location)
4. Tap "Update" to save changes
5. Activity immediately reflects edits
6. For base activities, a "Reset to Default" button appears to undo all changes
