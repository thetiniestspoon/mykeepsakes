-- Conference Companion schema extensions

-- 1. Extend memories table
ALTER TABLE memories
  ADD COLUMN IF NOT EXISTS memory_type text NOT NULL DEFAULT 'photo',
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS speaker text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS session_title text DEFAULT NULL;

COMMENT ON COLUMN memories.memory_type IS 'photo | reflection | dispatch';
COMMENT ON COLUMN memories.tags IS 'Array of: insight, quote, training-seed, personal, logistics';

-- 2. Add tags to itinerary_items
ALTER TABLE itinerary_items
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT NULL;

-- 3. Extend family_contacts for trip-scoped connections
ALTER TABLE family_contacts
  ADD COLUMN IF NOT EXISTS trip_id uuid REFERENCES trips(id) ON DELETE CASCADE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS organization text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS met_context text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS day_id uuid REFERENCES itinerary_days(id) ON DELETE SET NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS photo_path text DEFAULT NULL;

-- 4. Create dispatch_items table
CREATE TABLE IF NOT EXISTS dispatch_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id uuid NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_id uuid NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  section text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dispatch_items_item_type_check CHECK (item_type IN ('reflection', 'activity', 'photo')),
  CONSTRAINT dispatch_items_section_check CHECK (section IN ('scene', 'insight', 'closing'))
);

-- 5. Extend trip_share_links for dispatch sharing
ALTER TABLE trip_share_links
  ADD COLUMN IF NOT EXISTS dispatch_id uuid REFERENCES memories(id) ON DELETE CASCADE DEFAULT NULL;

-- 6. RLS for dispatch_items (match existing public pattern)
ALTER TABLE dispatch_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for dispatch_items" ON dispatch_items FOR ALL USING (true) WITH CHECK (true);

-- 7. Performance indexes
CREATE INDEX IF NOT EXISTS idx_memories_tags ON memories USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_memories_memory_type ON memories (memory_type);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_tags ON itinerary_items USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_family_contacts_trip_id ON family_contacts (trip_id);
CREATE INDEX IF NOT EXISTS idx_family_contacts_day_id ON family_contacts (day_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_items_dispatch_id ON dispatch_items (dispatch_id);
CREATE INDEX IF NOT EXISTS idx_trip_share_links_dispatch_id ON trip_share_links (dispatch_id);
