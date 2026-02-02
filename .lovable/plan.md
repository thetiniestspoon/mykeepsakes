
# Stay Detail Page: Accommodation Management with Drag-and-Drop

## Summary

This plan redesigns the Stay detail panel to manage accommodation candidates and selected accommodations with:
- A new `accommodations` table replacing `lodging_options`
- Drag-and-drop reordering of candidates
- A drop zone to select accommodations (triggering a details dialog)
- A collapsible "deprioritized" section at the bottom

---

## Database Schema

### New Table: `accommodations`

The new table is scoped to trips and includes fields for both candidates and selected stays:

```sql
-- Create the accommodations table
CREATE TABLE accommodations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  
  -- Basic info (entered when adding a candidate)
  title TEXT NOT NULL,
  url TEXT,
  
  -- Selection status
  is_selected BOOLEAN DEFAULT FALSE,
  
  -- Details (entered when selecting via dialog)
  address TEXT,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  notes TEXT,
  
  -- Location for map integration
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  
  -- Ordering & visibility
  sort_order INTEGER DEFAULT 0,
  is_deprioritized BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient trip queries
CREATE INDEX idx_accommodations_trip_id ON accommodations(trip_id);

-- Enable RLS
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;

-- RLS policies (matching existing pattern of public access)
CREATE POLICY "Allow public read access to accommodations"
  ON accommodations FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to accommodations"
  ON accommodations FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to accommodations"
  ON accommodations FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to accommodations"
  ON accommodations FOR DELETE USING (true);
```

### Migration: Data from `lodging_options`

After creating the new table, migrate existing data from `lodging_options`:

```sql
-- Migrate existing lodging_options data
-- Note: lodging_options doesn't have trip_id, so we'll need to
-- associate with the active trip. This is a one-time migration.
INSERT INTO accommodations (
  title, url, is_selected, address, notes,
  location_lat, location_lng, sort_order, is_deprioritized,
  trip_id
)
SELECT
  name, url, is_selected, address, notes,
  location_lat, location_lng, 0, is_archived,
  (SELECT id FROM trips ORDER BY start_date DESC LIMIT 1)
FROM lodging_options;
```

---

## TypeScript Types

### File: `src/types/accommodation.ts` (NEW)

```typescript
export interface Accommodation {
  id: string;
  trip_id: string;
  title: string;
  url: string | null;
  is_selected: boolean;
  address: string | null;
  check_in: string | null;
  check_out: string | null;
  notes: string | null;
  location_lat: number | null;
  location_lng: number | null;
  sort_order: number;
  is_deprioritized: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccommodationInsert {
  title: string;
  url?: string;
}

export interface AccommodationSelectDetails {
  address: string;
  check_in?: string;
  check_out?: string;
  notes?: string;
  location_lat?: number;
  location_lng?: number;
}
```

---

## React Hooks

### File: `src/hooks/use-accommodations.ts` (NEW)

Provides all CRUD operations following existing patterns from `use-lodging.ts` and `use-reorder-items.ts`:

**Hooks to implement:**

| Hook | Purpose |
|------|---------|
| `useAccommodations()` | Fetch all accommodations for active trip, ordered by deprioritized then sort_order |
| `useSelectedAccommodation()` | Get the selected accommodation (single) |
| `useAddAccommodation()` | Add new candidate with title + optional URL |
| `useSelectAccommodation()` | Mark as selected + add details (address, dates, notes) |
| `useUnselectAccommodation()` | Move back to candidates |
| `useUpdateAccommodation()` | Edit any accommodation field |
| `useReorderAccommodations()` | Batch update sort_order after drag |
| `useDeprioritizeAccommodation()` | Set is_deprioritized=true, sort_order=99999 |
| `useUnhideAccommodation()` | Restore from deprioritized |
| `useDeleteAccommodation()` | Delete an accommodation |

Query key pattern: `['accommodations', tripId]`

---

## Component Structure

### File Structure

```text
src/components/dashboard/DetailPanels/
├── StayDetail.tsx                    # Main component (rewritten)
└── stay/
    ├── AccommodationAddForm.tsx      # Title + URL input at top
    ├── AccommodationCard.tsx         # Single draggable item
    ├── SelectedDropZone.tsx          # Drop target area + selected items
    ├── CandidateList.tsx             # Sortable list of candidates
    ├── DeprioritizedSection.tsx      # Collapsible bottom section
    └── SelectionDetailsDialog.tsx    # Modal for address/dates/notes
```

---

### StayDetail.tsx (Main Component)

**Purpose:** Orchestrates the Stay page with DndContext for drag-and-drop

**Structure:**
```text
┌─────────────────────────────────────┐
│  Header (Home icon + "Stay")        │
├─────────────────────────────────────┤
│  AccommodationAddForm               │
│  [Title input] [URL input] [+ Add]  │
├─────────────────────────────────────┤
│  SelectedDropZone                   │
│  ┌───────────────────────────────┐  │
│  │ Drop here to select           │  │
│  │ (or shows selected item)      │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  CandidateList                      │
│  ┌───────────────────────────────┐  │
│  │ ≡ Beach House Option    [⋮]   │  │
│  │ ≡ Villa by the Sea     [⋮]   │  │
│  │ ≡ Downtown Apartment   [⋮]   │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  ▼ Hidden (2)                       │
│  ┌───────────────────────────────┐  │
│  │ (grayed out deprioritized)    │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Key state:**
- `activeId: string | null` - Currently dragged item ID
- `pendingSelection: Accommodation | null` - Item dropped into selection zone (opens dialog)
- `editingAccommodation: Accommodation | null` - Item being edited

**Drag handling:**
- On drag end over "selected" zone → open SelectionDetailsDialog
- On drag end within candidates → reorder candidates
- Uses `DndContext` with `closestCenter` collision detection

---

### AccommodationAddForm.tsx

**Purpose:** Inline form to add new candidates

**UI:**
- Single row with title input, optional URL input, and Add button
- Validates that title is non-empty
- On submit: calls `useAddAccommodation().mutate()`

---

### AccommodationCard.tsx

**Purpose:** Single draggable card for an accommodation

**Props:**
- `accommodation: Accommodation`
- `onEdit: () => void`
- `onDeprioritize: () => void`
- `onDelete: () => void`
- `isDeprioritized?: boolean` - Applies gray styling

**UI:**
- Drag handle (GripVertical) on the left (using `useSortable` from dnd-kit)
- Title + domain extracted from URL
- Dropdown menu (⋮) with: Open Link, Edit, Deprioritize/Unhide, Delete
- Gray/muted styling when deprioritized

---

### SelectedDropZone.tsx

**Purpose:** Drop target and display for selected accommodation

**Props:**
- `selected: Accommodation | null`
- `onShowOnMap: () => void`
- `onGetDirections: () => void`
- `onUnselect: () => void`
- `onEdit: () => void`

**UI when empty:**
- Dashed border drop zone with "Drag here to select your stay"
- Uses `useDroppable` from dnd-kit with id "selected-zone"

**UI when filled:**
- Card showing selected accommodation with:
  - Title + address
  - Check-in/Check-out dates (if set)
  - Notes preview
  - Action buttons: Show on Map, Get Directions, Edit, Unselect

---

### CandidateList.tsx

**Purpose:** Sortable list of candidate accommodations

**Props:**
- `candidates: Accommodation[]`
- `onEdit: (id: string) => void`
- `onDeprioritize: (id: string) => void`
- `onDelete: (id: string) => void`

**Implementation:**
- Wraps items in `SortableContext` with `verticalListSortingStrategy`
- Each item wrapped in `DraggableAccommodation` (similar to existing `DraggableActivity`)

---

### DeprioritizedSection.tsx

**Purpose:** Collapsible section showing hidden/deprioritized items

**Props:**
- `items: Accommodation[]`
- `onUnhide: (id: string) => void`
- `onDelete: (id: string) => void`

**UI:**
- Uses `Collapsible` component from Radix
- Header shows count: "Hidden (3)"
- Collapsed by default
- Items shown with muted/gray styling
- Each item has Unhide and Delete actions

---

### SelectionDetailsDialog.tsx

**Purpose:** Modal for entering details when selecting an accommodation

**Props:**
- `accommodation: Accommodation | null`
- `open: boolean`
- `onOpenChange: (open: boolean) => void`
- `onConfirm: (details: AccommodationSelectDetails) => void`

**UI:**
- Dialog showing the accommodation title
- Form fields:
  - Address (required) - text input
  - Check-in date - date picker
  - Check-out date - date picker
  - Notes - textarea
- Cancel and Confirm buttons
- On confirm: calls `useSelectAccommodation().mutate()`

---

## Updates to Existing Files

### File: `src/hooks/use-lodging.ts`

**Action:** Update to use new `accommodations` table or deprecate

Option A: Redirect hooks to `accommodations`:
- `useSelectedLodging()` → query `accommodations` where `is_selected=true`
- Other hooks deprecated in favor of `use-accommodations.ts`

Option B: Delete file after migration complete

**Recommended:** Keep both temporarily during migration, then remove.

---

### File: `src/components/LodgingTab.tsx`

**Action:** Update to use `useAccommodations()` instead of `useLodgingOptions()`

Changes:
- Import from `use-accommodations` instead of `use-lodging`
- Update type references from `LodgingOption` to `Accommodation`
- Update field references (e.g., `name` → `title`)

---

### File: `src/components/lodging/LodgingLinkTile.tsx`

**Action:** Update type and field references

Changes:
- Props type: `LodgingOption` → `Accommodation`
- Field: `lodging.name` → `accommodation.title`
- Remove voting logic (not in new schema)
- Add/update deprioritize action

---

### File: `src/components/lodging/AddLodgingLinkDialog.tsx`

**Action:** Update to use new hook and simplified fields

Changes:
- Use `useAddAccommodation()` instead of `useAddLodging()`
- Only two fields: Title (required) and URL (optional)
- Remove notes field from initial add (added when selecting)

---

## Files Summary

| File | Action |
|------|--------|
| `src/types/accommodation.ts` | NEW - TypeScript types |
| `src/hooks/use-accommodations.ts` | NEW - CRUD hooks |
| `src/components/dashboard/DetailPanels/StayDetail.tsx` | REWRITE - Main component |
| `src/components/dashboard/DetailPanels/stay/AccommodationAddForm.tsx` | NEW |
| `src/components/dashboard/DetailPanels/stay/AccommodationCard.tsx` | NEW |
| `src/components/dashboard/DetailPanels/stay/SelectedDropZone.tsx` | NEW |
| `src/components/dashboard/DetailPanels/stay/CandidateList.tsx` | NEW |
| `src/components/dashboard/DetailPanels/stay/DeprioritizedSection.tsx` | NEW |
| `src/components/dashboard/DetailPanels/stay/SelectionDetailsDialog.tsx` | NEW |
| `src/components/LodgingTab.tsx` | UPDATE - Use new hooks |
| `src/components/lodging/LodgingLinkTile.tsx` | UPDATE - New types |
| `src/components/lodging/AddLodgingLinkDialog.tsx` | UPDATE - Simplified |
| `src/hooks/use-lodging.ts` | DEPRECATE/REMOVE after migration |

---

## Implementation Order

1. **Database Migration** - Create `accommodations` table with migration tool
2. **Types** - Create `src/types/accommodation.ts`
3. **Hooks** - Create `src/hooks/use-accommodations.ts`
4. **Subcomponents** - Build the new `stay/` components
5. **Main Component** - Rewrite `StayDetail.tsx`
6. **Update LodgingTab** - Connect to new hooks
7. **Cleanup** - Remove/deprecate old lodging code
8. **Data Migration** - One-time script to move existing data

---

## Testing Checklist

- [ ] Add new accommodation candidate with title + URL
- [ ] Drag candidate to reorder within list
- [ ] Drag candidate to selected zone → dialog opens
- [ ] Fill out selection details → item moves to selected area
- [ ] Unselect accommodation → returns to candidates
- [ ] Deprioritize candidate → moves to collapsible Hidden section
- [ ] Unhide from Hidden section → returns to candidates
- [ ] Delete accommodation from any state
- [ ] Show on Map works for selected accommodation
- [ ] Get Directions opens MapModal
- [ ] Edit accommodation details via dialog
