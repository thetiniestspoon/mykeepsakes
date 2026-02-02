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

-- Migrate existing lodging_options data to the new table
-- Associate with the most recent trip
INSERT INTO accommodations (
  title, url, is_selected, address, notes,
  location_lat, location_lng, sort_order, is_deprioritized,
  trip_id
)
SELECT
  name, url, is_selected, address, notes,
  location_lat, location_lng, 0, is_archived,
  (SELECT id FROM trips ORDER BY start_date DESC LIMIT 1)
FROM lodging_options
WHERE EXISTS (SELECT 1 FROM trips LIMIT 1);