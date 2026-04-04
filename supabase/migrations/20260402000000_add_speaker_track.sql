-- Add speaker and track columns to itinerary_items for conference schedule support
ALTER TABLE itinerary_items
  ADD COLUMN IF NOT EXISTS speaker text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS track text DEFAULT NULL;

COMMENT ON COLUMN itinerary_items.speaker IS 'Presenter name and credentials';
COMMENT ON COLUMN itinerary_items.track IS 'Workshop track letter (A, B, C) for concurrent sessions';

-- Index for track-based filtering
CREATE INDEX IF NOT EXISTS idx_itinerary_items_track ON itinerary_items (track) WHERE track IS NOT NULL;
