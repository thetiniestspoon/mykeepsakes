-- ============================================================================
-- AUDIT FIXES: P0 (remove personal-options) + P1 (wire location_id)
-- Run in Family Core Supabase SQL Editor after update-sankofa-schedule.sql
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_trip_id uuid;
  v_marriott_id uuid;
  v_ohare_id uuid;
  v_venue_id uuid;
  v_zoo_id uuid;
  v_downtown_id uuid;
  v_seasons52_id uuid;
BEGIN
  SELECT id INTO v_trip_id
    FROM trips WHERE title ILIKE '%Sankofa 2026%' LIMIT 1;

  IF v_trip_id IS NULL THEN
    RAISE EXCEPTION 'Sankofa 2026 trip not found';
  END IF;

  -- ═══════════════════════════════════════════════════════════
  -- P0: Delete personal-option items (they live in the Guide tab)
  -- ═══════════════════════════════════════════════════════════
  DELETE FROM itinerary_items
    WHERE trip_id = v_trip_id
    AND tags @> '{personal-option}';

  RAISE NOTICE 'P0: Deleted personal-option items from itinerary';

  -- ═══════════════════════════════════════════════════════════
  -- P1: Get existing location IDs
  -- ═══════════════════════════════════════════════════════════
  SELECT id INTO v_marriott_id FROM locations WHERE trip_id = v_trip_id AND name ILIKE '%Marriott%' LIMIT 1;
  SELECT id INTO v_ohare_id FROM locations WHERE trip_id = v_trip_id AND name ILIKE '%Hare%' LIMIT 1;
  SELECT id INTO v_venue_id FROM locations WHERE trip_id = v_trip_id AND name ILIKE '%Sankofa Conference%' LIMIT 1;

  -- Add missing locations for Free Day
  INSERT INTO locations (trip_id, name, category, address, lat, lng)
    VALUES (v_trip_id, 'Brookfield Zoo', 'activity', '8400 31st St, Brookfield, IL 60513', 41.8316, -87.8360)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_zoo_id;
  IF v_zoo_id IS NULL THEN
    SELECT id INTO v_zoo_id FROM locations WHERE trip_id = v_trip_id AND name = 'Brookfield Zoo';
  END IF;

  INSERT INTO locations (trip_id, name, category, address, lat, lng)
    VALUES (v_trip_id, 'Downtown Chicago', 'activity', 'Michigan Ave & Millennium Park area', 41.8826, -87.6226)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_downtown_id;
  IF v_downtown_id IS NULL THEN
    SELECT id INTO v_downtown_id FROM locations WHERE trip_id = v_trip_id AND name = 'Downtown Chicago';
  END IF;

  INSERT INTO locations (trip_id, name, category, address, lat, lng)
    VALUES (v_trip_id, 'Seasons 52', 'dining', 'Oakbrook Center, Oak Brook, IL 60523', 41.8498, -87.9515)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_seasons52_id;
  IF v_seasons52_id IS NULL THEN
    SELECT id INTO v_seasons52_id FROM locations WHERE trip_id = v_trip_id AND name = 'Seasons 52';
  END IF;

  RAISE NOTICE 'P1: Locations ready — Marriott=%, OHare=%, Venue=%, Zoo=%, Downtown=%, Seasons52=%',
    v_marriott_id, v_ohare_id, v_venue_id, v_zoo_id, v_downtown_id, v_seasons52_id;

  -- ═══════════════════════════════════════════════════════════
  -- P1: Wire location_id to all confirmed items
  -- ═══════════════════════════════════════════════════════════

  -- Flights → O'Hare
  UPDATE itinerary_items SET location_id = v_ohare_id
    WHERE trip_id = v_trip_id
    AND title ILIKE '%Flight%'
    AND location_id IS NULL;

  -- Hotel check-ins → Marriott
  UPDATE itinerary_items SET location_id = v_marriott_id
    WHERE trip_id = v_trip_id
    AND title ILIKE '%Hotel Check%'
    AND location_id IS NULL;

  -- Breaks → Venue (they happen at the conference)
  UPDATE itinerary_items SET location_id = v_venue_id
    WHERE trip_id = v_trip_id
    AND tags @> '{break}'
    AND location_id IS NULL;

  -- Free Day items
  UPDATE itinerary_items SET location_id = v_zoo_id
    WHERE trip_id = v_trip_id
    AND title ILIKE '%Brookfield Zoo%'
    AND location_id IS NULL;

  UPDATE itinerary_items SET location_id = v_downtown_id
    WHERE trip_id = v_trip_id
    AND title ILIKE '%Explore Downtown%'
    AND location_id IS NULL;

  UPDATE itinerary_items SET location_id = v_seasons52_id
    WHERE trip_id = v_trip_id
    AND title ILIKE '%Seasons 52%'
    AND location_id IS NULL;

  -- Dinner at Wildfire (Apr 20) → Marriott area
  UPDATE itinerary_items SET location_id = v_marriott_id
    WHERE trip_id = v_trip_id
    AND title ILIKE '%Wildfire%'
    AND location_id IS NULL;

  RAISE NOTICE 'P1: All confirmed items wired to locations';

  -- Summary
  RAISE NOTICE 'Done! Remaining items without location: %',
    (SELECT count(*) FROM itinerary_items WHERE trip_id = v_trip_id AND location_id IS NULL);
END $$;

COMMIT;
