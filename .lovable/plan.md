# Trip App Implementation Plan

## Status: Phase 1-8 Complete ✅

Last Updated: January 31, 2026

---

## Completed Work

### ✅ Phase 1: Database Schema Migration
- Created all new tables: `trips`, `itinerary_days`, `itinerary_items`, `locations`, `location_days`, `memories`, `memory_media`, `trip_share_links`
- Updated `favorites` table with polymorphic entity support
- All tables have RLS policies and realtime enabled
- Indexes created for common query patterns

### ✅ Phase 2: Core Types & Hooks  
- `src/types/trip.ts` - All TypeScript interfaces
- `src/hooks/use-trip.ts` - Trip CRUD, mode calculation, active trip
- `src/hooks/use-itinerary.ts` - Day/item management, status updates
- `src/hooks/use-locations.ts` - Location operations, visited tracking
- `src/hooks/use-memories.ts` - Memory/media management
- `src/hooks/use-sharing.ts` - Share link generation

### ✅ Phase 3: Data Migration
- Created `migrate-static-data` edge function
- Successfully migrated static itinerary data:
  - 1 trip (Family Week 2026)
  - 8 itinerary days  
  - 32 itinerary items
  - 26 locations

### ✅ Phase 4: Frontend Integration
- Created `src/hooks/use-database-itinerary.ts` - Bridge hook converting database data to legacy format
- Created `src/components/DatabaseItineraryTab.tsx` - Database-driven itinerary view with progress tracking
- Created `src/components/itinerary/DatabaseActivityCard.tsx` - Activity card with status toggle
- Created `src/components/itinerary/DatabaseDayCard.tsx` - Day card with completion progress
- Created `src/components/DatabaseMapTab.tsx` - Map using database locations
- Updated `src/pages/Index.tsx` to use new database-driven components
- Features implemented:
  - Activity completion tracking (checkbox toggles status in database)
  - Per-day progress bars with completion counts
  - Overall trip progress display
  - Trip mode indicator (pre/active/post)
  - Map filtering by category and day from database

### ✅ Phase 5: Memory & Media System
- Created `trip-photos` storage bucket with public read access
- Created album components:
  - `src/components/album/AlbumTab.tsx` - Main album view with tabs
  - `src/components/album/DayPhotoGrid.tsx` - Photos organized by day
  - `src/components/album/PlacePhotoGrid.tsx` - Photos organized by location
  - `src/components/album/RecentPhotoGrid.tsx` - Chronological photo view
  - `src/components/album/MemoryCaptureDialog.tsx` - Multi-photo upload dialog
- Added "Album" tab to bottom navigation
- Memory system supports:
  - Multi-photo/video uploads per memory
  - Association with days, locations, or both
  - Note-only memories (no photos required)
  - Three view modes: By Day, By Place, Recent

### ✅ Phase 6: Map Enhancements
- Created `src/components/map/LocationBottomSheet.tsx` - Quick action sheet for locations
- Enhanced `src/types/map.ts` with PinState type and extended MapLocation interface
- Updated `src/components/map/OverviewMap.tsx` with visual pin states:
  - Green ring + checkmark for visited locations
  - Gold ring + badge for favorited locations
  - Pink ring + badge for locations with memories
- Updated `src/components/DatabaseMapTab.tsx`:
  - Location list shows state indicators (visited/favorited/memories)
  - Clicking locations opens bottom sheet with quick actions
  - Bottom sheet actions: toggle visited, favorite, add memory, navigate, call, website
  - Pin state calculation based on memories, favorites, and visited_at

### ✅ Phase 8: Sharing System
- Created `src/components/sharing/ShareDialog.tsx` for share link management
- Created `src/pages/SharedTrip.tsx` for read-only shared trip viewing
- Updated `src/components/TripHeader.tsx` with share button
- Updated `src/App.tsx` with `/shared/:token` route
- Features implemented:
  - Create share links with optional expiration
  - Copy share URL to clipboard
  - View and delete existing share links
  - Read-only shared trip page shows full itinerary
  - Expired link handling with user-friendly error messages

---

## Current vs. Proposed Architecture

| Aspect | Current State | Proposed State |
|--------|--------------|----------------|
| Trip Data | Static TypeScript (`itinerary-data.ts`) | Database tables (`trips`, `itinerary_days`, `itinerary_items`) |
| Locations | Embedded in activities | Dedicated `locations` table with day relationships |
| Photos | Attached to activities via `item_id` | Standalone `memories` with `memory_media` for multi-file support |
| Favorites | Simple `item_id` reference | Polymorphic entity references with `entity_type` |
| Offline | None | Cache-first with queued mutations |
| Sharing | None | Token-based read-only links |
| Export | None | Server-side ZIP generation |

---

## Phase 1: Database Schema Migration

### 1.1 Create Core Trip Tables

```sql
-- trips: Central trip container
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  location_name TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- itinerary_days: Day containers within a trip
CREATE TABLE public.itinerary_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT,
  sort_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(trip_id, date)
);

-- itinerary_items: Individual activities/events
CREATE TABLE public.itinerary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_id UUID NOT NULL REFERENCES public.itinerary_days(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIME,
  end_time TIME,
  category TEXT NOT NULL DEFAULT 'activity',
  type TEXT NOT NULL DEFAULT 'activity' CHECK (type IN ('activity', 'marker')),
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'import')),
  external_ref TEXT,
  sort_index INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'done', 'skipped')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.2 Create Locations Table

```sql
-- locations: Reusable location entities
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  phone TEXT,
  url TEXT,
  notes TEXT,
  visited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- location_days: Many-to-many for location visibility per day
CREATE TABLE public.location_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  day_id UUID NOT NULL REFERENCES public.itinerary_days(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(location_id, day_id)
);
```

### 1.3 Create Memory & Media Tables

```sql
-- memories: Memory containers (text notes + optional media)
CREATE TABLE public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  title TEXT,
  note TEXT,
  day_id UUID REFERENCES public.itinerary_days(id) ON DELETE SET NULL,
  itinerary_item_id UUID REFERENCES public.itinerary_items(id) ON DELETE SET NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- memory_media: Individual media files within a memory
CREATE TABLE public.memory_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  mime_type TEXT,
  byte_size BIGINT,
  width INTEGER,
  height INTEGER,
  duration_seconds INTEGER,
  thumbnail_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.4 Update Favorites Table

```sql
-- Migrate existing favorites to new polymorphic structure
ALTER TABLE public.favorites ADD COLUMN trip_id UUID REFERENCES public.trips(id);
ALTER TABLE public.favorites ADD COLUMN entity_type TEXT DEFAULT 'itinerary_item';
ALTER TABLE public.favorites RENAME COLUMN item_id TO entity_id;
ALTER TABLE public.favorites DROP COLUMN item_type;
```

### 1.5 Create Sharing Table

```sql
-- trip_share_links: Token-based sharing
CREATE TABLE public.trip_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'base64url'),
  permission TEXT DEFAULT 'read' CHECK (permission IN ('read')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Phase 2: Data Migration Strategy

### 2.1 Initial Trip Creation

Create a default trip from existing static data:

| Source | Target |
|--------|--------|
| `ITINERARY` days | `trips` + `itinerary_days` |
| `ITINERARY` activities | `itinerary_items` + `locations` |
| `BEACHES`, `RESTAURANTS`, `ACTIVITIES`, `EVENTS` | `locations` |
| Existing `photos` | `memories` + `memory_media` |
| Existing `favorites` | Updated `favorites` with `trip_id` |

### 2.2 Migration Edge Function

```typescript
// supabase/functions/migrate-static-data/index.ts
// Converts static itinerary-data.ts into database records
// Run once per existing installation
```

---

## Phase 3: Frontend Architecture

### 3.1 New Hooks Structure

```text
src/hooks/
├── use-trip.ts              # Trip CRUD, mode calculation
├── use-itinerary.ts         # Days, items, status management
├── use-locations.ts         # Location CRUD, visited tracking
├── use-memories.ts          # Memory + media management
├── use-offline.ts           # Cache + action queue
├── use-sharing.ts           # Share link generation
└── use-export.ts            # Export job management
```

### 3.2 Trip Mode Logic

```typescript
// use-trip.ts
export function useTripMode(trip: Trip) {
  const today = new Date();
  const start = new Date(trip.start_date);
  const end = new Date(trip.end_date);
  
  if (today < start) return 'pre';
  if (today > end) return 'post';
  return 'active';
}

export function useCurrentDay(trip: Trip, mode: TripMode) {
  const days = useTripDays(trip.id);
  if (mode === 'pre') return days[0];
  if (mode === 'post') return days[days.length - 1];
  // Find today's day in trip timezone
  return days.find(d => isSameDay(d.date, now, trip.timezone)) || days[0];
}
```

### 3.3 Component Updates

| Component | Changes |
|-----------|---------|
| `ItineraryTab.tsx` | Add Today toggle, swipe gestures, status indicators |
| `MapTab.tsx` | Add pin states (visited/favorited/has-memories), bottom sheet |
| `GuideTab.tsx` → `AlbumTab.tsx` | Transform to album views (By Day, By Place, Recent) |
| New `ShareDialog.tsx` | Generate and manage share links |
| New `ExportDialog.tsx` | Trigger and download exports |

---

## Phase 4: Itinerary Interactions

### 4.1 Status Management

```typescript
// Swipe right to toggle done/undo
async function toggleItemStatus(itemId: string, currentStatus: ItemStatus) {
  const newStatus = currentStatus === 'done' ? 'planned' : 'done';
  await supabase
    .from('itinerary_items')
    .update({ 
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null
    })
    .eq('id', itemId);
  
  // Optionally prompt for memory creation
  if (newStatus === 'done') {
    promptMemoryCapture(itemId);
  }
}
```

### 4.2 Marker Items

```typescript
// Markers are visual dividers that don't count toward progress
interface ItineraryItem {
  type: 'activity' | 'marker';
}

// Progress calculation excludes markers
const progress = items.filter(i => i.type === 'activity' && i.status === 'done').length 
               / items.filter(i => i.type === 'activity').length;
```

### 4.3 Today Mode

```tsx
// ItineraryTab.tsx
const [viewMode, setViewMode] = useState<'timeline' | 'today'>('timeline');

{viewMode === 'today' ? (
  <DayCard day={currentDay} autoScrollToNext />
) : (
  days.map(day => <DayCard key={day.id} day={day} />)
)}
```

---

## Phase 5: Memory & Media System

### 5.1 Memory Creation Flow

```text
Entry Points:
1. Complete itinerary item → "Add memory?" prompt
2. Map location → Bottom sheet "Add memory" button  
3. Album screen → "+" button

Flow:
1. Create memory record (note-only allowed offline)
2. Select photos/videos (multi-select)
3. Upload media files (online required)
4. Generate thumbnails (server-side)
5. Link memory to day/item/location as appropriate
```

### 5.2 Storage Structure

```text
/trips/{trip_id}/memories/{memory_id}/{media_id}/original
/trips/{trip_id}/memories/{memory_id}/{media_id}/thumb
```

### 5.3 Thumbnail Generation Edge Function

```typescript
// supabase/functions/process-media/index.ts
// - Generates image thumbnails (300px max dimension)
// - Extracts video poster frames
// - Updates memory_media.thumbnail_path
```

---

## Phase 6: Album Views

### 6.1 Tab Structure

```tsx
// AlbumTab.tsx
<Tabs defaultValue="day">
  <TabsList>
    <TabsTrigger value="day">By Day</TabsTrigger>
    <TabsTrigger value="place">By Place</TabsTrigger>
    <TabsTrigger value="recent">Recent</TabsTrigger>
  </TabsList>
  
  <TabsContent value="day">
    {days.map(day => <DayPhotoGrid day={day} />)}
  </TabsContent>
  
  <TabsContent value="place">
    {locations.map(loc => <LocationPhotoRow location={loc} />)}
  </TabsContent>
  
  <TabsContent value="recent">
    <InfinitePhotoGrid memories={recentMemories} />
  </TabsContent>
</Tabs>
```

### 6.2 Media Detail View

- Full-screen carousel with swipe navigation
- Video playback with controls
- Memory note display
- Linked itinerary item / location reference
- Favorite toggle
- Download button

---

## Phase 7: Map Enhancements

### 7.1 Pin States

```typescript
type PinState = 'planned' | 'visited' | 'favorited' | 'has-memories';

function getPinState(location: Location, favorites: Set<string>, memories: Memory[]) {
  if (memories.some(m => m.location_id === location.id)) return 'has-memories';
  if (favorites.has(location.id)) return 'favorited';
  if (location.visited_at) return 'visited';
  return 'planned';
}
```

### 7.2 Bottom Sheet Actions

```tsx
// LocationBottomSheet.tsx
<Sheet>
  <SheetContent side="bottom">
    <h3>{location.name}</h3>
    <div className="actions">
      <Button onClick={toggleVisited}>
        {location.visited_at ? 'Unvisit' : 'Mark Visited'}
      </Button>
      <Button onClick={toggleFavorite}>
        <Star filled={isFavorite} />
      </Button>
      <Button onClick={() => openMemoryCapture(location)}>
        Add Memory
      </Button>
      <Button onClick={() => openExternalNav(location)}>
        Navigate
      </Button>
      {location.phone && (
        <Button onClick={() => window.open(`tel:${location.phone}`)}>
          Call
        </Button>
      )}
    </div>
  </SheetContent>
</Sheet>
```

---

## Phase 8: Offline Support

### 8.1 Cache Layer

```typescript
// use-offline.ts
const CACHED_QUERIES = [
  'trip',
  'itinerary-days',
  'itinerary-items', 
  'locations',
  'favorites',
  'family-contacts',
  'memories' // metadata only, not media files
];

export function useOfflineCache() {
  // Persist query cache to IndexedDB
  // Load from cache on app start
  // Sync with server when online
}
```

### 8.2 Action Queue

```typescript
// Queued mutations stored in IndexedDB
interface QueuedAction {
  id: string;
  type: 'update_item_status' | 'toggle_visited' | 'toggle_favorite' | 'create_memory';
  payload: Record<string, unknown>;
  createdAt: string;
}

// Process queue when online
async function processOfflineQueue() {
  const queue = await getQueuedActions();
  for (const action of queue) {
    await executeAction(action);
    await removeFromQueue(action.id);
  }
}
```

### 8.3 Offline Behavior

| Action | Offline Behavior |
|--------|------------------|
| View itinerary | Read from cache |
| Mark done/skipped | Queue action |
| Toggle visited | Queue action |
| Toggle favorite | Queue action |
| Create memory (note only) | Queue action |
| Upload photo/video | Disabled with message |

---

## Phase 9: Sharing System

### 9.1 Share Link Generation

```typescript
// use-sharing.ts
export function useCreateShareLink() {
  return useMutation({
    mutationFn: async (tripId: string) => {
      const { data } = await supabase
        .from('trip_share_links')
        .insert({ trip_id: tripId })
        .select()
        .single();
      
      return `${window.location.origin}/shared/${data.token}`;
    }
  });
}
```

### 9.2 Shared View Route

```tsx
// pages/SharedTrip.tsx
// Read-only view with all editing controls hidden
// Validates token server-side
// Optional: Download button for media export
```

### 9.3 Backend Validation

```sql
-- RLS policy for shared access
CREATE POLICY "Allow read via share token"
ON public.trips FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM trip_share_links 
    WHERE trip_id = trips.id 
    AND token = current_setting('request.headers')::json->>'x-share-token'
    AND (expires_at IS NULL OR expires_at > now())
  )
);
```

---

## Phase 10: Export System

### 10.1 Export Edge Function

```typescript
// supabase/functions/export-trip/index.ts
// 1. Validate request
// 2. Create export job record
// 3. Spawn background task:
//    - Collect all memory media
//    - Generate manifest.json with metadata
//    - Create ZIP archive
//    - Upload to storage
//    - Update job status to 'complete'
// 4. Return job ID
```

### 10.2 Export Job Polling

```typescript
// ExportDialog.tsx
const { data: job } = useQuery({
  queryKey: ['export-job', jobId],
  refetchInterval: job?.status === 'processing' ? 2000 : false
});

{job?.status === 'complete' && (
  <Button onClick={() => downloadExport(job.download_url)}>
    Download ZIP
  </Button>
)}
```

---

## Phase 11: Performance Optimizations

| Area | Strategy |
|------|----------|
| Media queries | Paginate with cursor-based pagination (20 items/page) |
| Photo grids | Use thumbnails, lazy-load full resolution |
| Long lists | Virtualize with `@tanstack/react-virtual` |
| Map markers | Cluster when > 50 pins visible |
| Network | Cache-first with background revalidation |

---

## Implementation Order (Build Phases)

| Phase | Description | Est. Effort |
|-------|-------------|-------------|
| 1 | Database migrations | 1 day |
| 2 | Trip mode + day logic hooks | 0.5 day |
| 3 | Itinerary UI + status interactions | 2 days |
| 4 | Memory creation + uploads | 2 days |
| 5 | Album views + detail modal | 1.5 days |
| 6 | Map pin states + bottom sheet | 1 day |
| 7 | Offline cache + action queue | 2 days |
| 8 | Share links | 0.5 day |
| 9 | Export system (edge function + UI) | 1.5 days |

**Total estimated effort: ~12 days**

---

## Migration Path for Existing Data

1. Run migration to create new tables
2. Execute `migrate-static-data` function to convert existing data
3. Update `app_settings` to track migration version
4. Remove dependencies on `itinerary-data.ts` static exports
5. Delete deprecated tables after validation

---

## Files to Create/Modify

### New Files
```text
src/hooks/use-trip.ts
src/hooks/use-itinerary.ts
src/hooks/use-locations.ts
src/hooks/use-memories.ts
src/hooks/use-offline.ts
src/hooks/use-sharing.ts
src/hooks/use-export.ts
src/components/ShareDialog.tsx
src/components/ExportDialog.tsx
src/components/AlbumTab.tsx
src/components/album/DayPhotoGrid.tsx
src/components/album/LocationPhotoRow.tsx
src/components/album/MediaDetailModal.tsx
src/components/map/LocationBottomSheet.tsx
src/pages/SharedTrip.tsx
supabase/functions/migrate-static-data/index.ts
supabase/functions/process-media/index.ts
supabase/functions/export-trip/index.ts
```

### Modified Files
```text
src/components/ItineraryTab.tsx - Add status interactions, today mode
src/components/MapTab.tsx - Add pin states, bottom sheet
src/components/BottomNav.tsx - Update tab icons/labels
src/pages/Index.tsx - Add routing for shared view
src/lib/itinerary-data.ts - Keep as fallback/seed data only
```

---

## Open Questions for User Decision

1. **Video Support**: Should video uploads be supported immediately or deferred?
2. **Offline Scope**: How much offline capability is needed for initial launch?
3. **Multiple Trips**: Should multi-trip support be included in initial build?
4. **Import Sources**: What external calendar/itinerary formats should be supported?
