-- Phase 1: Trip App Architecture - Core Tables
-- Order matters due to foreign key dependencies

-- 1. trips: Central trip container
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

-- Enable RLS
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Public access policies for trips (PIN-protected app)
CREATE POLICY "Allow public read access to trips" ON public.trips FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to trips" ON public.trips FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to trips" ON public.trips FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to trips" ON public.trips FOR DELETE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. locations: Reusable location entities (must be before itinerary_items)
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

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to locations" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to locations" ON public.locations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to locations" ON public.locations FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to locations" ON public.locations FOR DELETE USING (true);

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for trip lookups
CREATE INDEX idx_locations_trip_id ON public.locations(trip_id);

-- 3. itinerary_days: Day containers within a trip
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

ALTER TABLE public.itinerary_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to itinerary_days" ON public.itinerary_days FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to itinerary_days" ON public.itinerary_days FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to itinerary_days" ON public.itinerary_days FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to itinerary_days" ON public.itinerary_days FOR DELETE USING (true);

CREATE TRIGGER update_itinerary_days_updated_at
  BEFORE UPDATE ON public.itinerary_days
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_itinerary_days_trip_id ON public.itinerary_days(trip_id);

-- 4. itinerary_items: Individual activities/events
CREATE TABLE public.itinerary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_id UUID NOT NULL REFERENCES public.itinerary_days(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIME,
  end_time TIME,
  category TEXT NOT NULL DEFAULT 'activity',
  item_type TEXT NOT NULL DEFAULT 'activity' CHECK (item_type IN ('activity', 'marker')),
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'import')),
  external_ref TEXT,
  sort_index INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'done', 'skipped')),
  completed_at TIMESTAMPTZ,
  link TEXT,
  link_label TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to itinerary_items" ON public.itinerary_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to itinerary_items" ON public.itinerary_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to itinerary_items" ON public.itinerary_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to itinerary_items" ON public.itinerary_items FOR DELETE USING (true);

CREATE TRIGGER update_itinerary_items_updated_at
  BEFORE UPDATE ON public.itinerary_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_itinerary_items_trip_id ON public.itinerary_items(trip_id);
CREATE INDEX idx_itinerary_items_day_id ON public.itinerary_items(day_id);
CREATE INDEX idx_itinerary_items_location_id ON public.itinerary_items(location_id);

-- 5. location_days: Many-to-many for location visibility per day
CREATE TABLE public.location_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  day_id UUID NOT NULL REFERENCES public.itinerary_days(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(location_id, day_id)
);

ALTER TABLE public.location_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to location_days" ON public.location_days FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to location_days" ON public.location_days FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to location_days" ON public.location_days FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to location_days" ON public.location_days FOR DELETE USING (true);

CREATE INDEX idx_location_days_location_id ON public.location_days(location_id);
CREATE INDEX idx_location_days_day_id ON public.location_days(day_id);

-- 6. memories: Memory containers (text notes + optional media)
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

ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to memories" ON public.memories FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to memories" ON public.memories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to memories" ON public.memories FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to memories" ON public.memories FOR DELETE USING (true);

CREATE INDEX idx_memories_trip_id ON public.memories(trip_id);
CREATE INDEX idx_memories_day_id ON public.memories(day_id);
CREATE INDEX idx_memories_location_id ON public.memories(location_id);

-- 7. memory_media: Individual media files within a memory
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

ALTER TABLE public.memory_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to memory_media" ON public.memory_media FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to memory_media" ON public.memory_media FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to memory_media" ON public.memory_media FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to memory_media" ON public.memory_media FOR DELETE USING (true);

CREATE INDEX idx_memory_media_memory_id ON public.memory_media(memory_id);

-- 8. trip_share_links: Token-based sharing
CREATE TABLE public.trip_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'base64url'),
  permission TEXT DEFAULT 'read' CHECK (permission IN ('read')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.trip_share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to trip_share_links" ON public.trip_share_links FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to trip_share_links" ON public.trip_share_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to trip_share_links" ON public.trip_share_links FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to trip_share_links" ON public.trip_share_links FOR DELETE USING (true);

CREATE INDEX idx_trip_share_links_trip_id ON public.trip_share_links(trip_id);
CREATE INDEX idx_trip_share_links_token ON public.trip_share_links(token);

-- 9. Update favorites table to support polymorphic references
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE;
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS entity_type TEXT DEFAULT 'itinerary_item';

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.itinerary_days;
ALTER PUBLICATION supabase_realtime ADD TABLE public.itinerary_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.memories;