-- ============================================================================
-- POPULATE SANKOFA REGISTRATION METADATA
-- Run in Family Core Supabase SQL Editor (verify project ref first!)
--
-- This script:
--   1. Ensures the `metadata jsonb` column exists on trips
--      (ADD COLUMN IF NOT EXISTS — matches migration 20260410200000)
--   2. Sets trips.metadata.registration for Sankofa 2026 from the
--      Jan 16 receipt (Order #10034)
--
-- Source: Dropbox/Foundry-Satellite/satellite-Dropbox/MyKeepsakes-Sankofa/
--         Chosen Sessions.pdf
--
-- Optional demographic fields from the receipt (race/ethnicity, gender
-- identity, sexual orientation) are intentionally NOT included — the
-- form marked them confidential for internal BCR statistical use only.
-- If you want them in the trip record for any reason, add them manually.
-- ============================================================================

BEGIN;

-- 1. Schema (idempotent)
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_trips_metadata_gin
  ON trips USING GIN (metadata);

-- 2. Data
DO $$
DECLARE
  v_trip_id uuid;
BEGIN
  SELECT id INTO v_trip_id FROM trips WHERE title ILIKE '%Sankofa 2026%' LIMIT 1;
  IF v_trip_id IS NULL THEN
    RAISE EXCEPTION 'Sankofa 2026 trip not found';
  END IF;

  -- Merge registration key into existing metadata (preserves any other keys)
  UPDATE trips
  SET metadata = metadata || jsonb_build_object(
    'registration', jsonb_build_object(
      'order_id', '10034',
      'registration_type', 'General Registration',
      'price_usd', 475,
      'payment_status', 'paid',
      'submitted_at', '2026-01-16T12:26:00-05:00',
      'attendee', jsonb_build_object(
        'first_name', 'Shawn',
        'last_name', 'Jordan',
        'preferred_name', 'Shawn',
        'pronouns', 'He/Him',
        'title', 'Chaplain Lead',
        'denominational_affiliation', 'Other'
      ),
      'contact', jsonb_build_object(
        'email', 'shawnjordanetal@gmail.com',
        'phone', '+1 347 603 2356',
        'address', jsonb_build_object(
          'street', '624 Ridgewood Rd',
          'city', 'Maplewood',
          'region', 'NJ',
          'postal_code', '07040',
          'country', 'United States'
        )
      ),
      'credentials', jsonb_build_object(
        'highest_degree', 'Ph.D.',
        'cpe_units_completed', 0,
        'prior_sankofa_cpe_units', 0,
        'interested_in_future_sankofa_cpe', true,
        'is_ordained', false,
        'is_board_certified_chaplain', false
      )
    )
  )
  WHERE id = v_trip_id;

  RAISE NOTICE 'Registration metadata set on trip %', v_trip_id;
END $$;

COMMIT;

-- ============================================================================
-- POST-RUN VERIFICATION
-- ============================================================================

-- Q1: see the full registration block
-- SELECT jsonb_pretty(metadata -> 'registration') AS registration
-- FROM trips
-- WHERE title ILIKE '%Sankofa 2026%';

-- Q2: just the key fields
-- SELECT
--   metadata -> 'registration' ->> 'order_id' AS order_id,
--   metadata -> 'registration' ->> 'price_usd' AS price,
--   metadata -> 'registration' -> 'attendee' ->> 'title' AS attendee_title,
--   metadata -> 'registration' -> 'contact' ->> 'phone' AS phone
-- FROM trips
-- WHERE title ILIKE '%Sankofa 2026%';
