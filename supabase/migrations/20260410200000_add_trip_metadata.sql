-- Add structured metadata column to trips
-- Holds trip-scoped facts that don't warrant their own column:
-- registration details, travel info, lodging, emergency contacts, etc.
-- Keyed by namespace (e.g. "registration", "travel", "lodging") so
-- different trip types can store different shapes without schema churn.

ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN trips.metadata IS
  'Namespaced JSON metadata: registration (receipt + attendee info), travel (flights/transit), lodging (hotels), contacts (emergency/venue), etc. Shape is trip-type dependent and not enforced at the DB level.';

-- GIN index for JSON containment + key queries
CREATE INDEX IF NOT EXISTS idx_trips_metadata_gin
  ON trips USING GIN (metadata);
