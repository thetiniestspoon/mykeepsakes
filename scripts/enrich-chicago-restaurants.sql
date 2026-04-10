-- ============================================================================
-- ENRICH CHICAGO RESTAURANTS — addresses + lat/lng + locations linkage
-- Run in Family Core Supabase SQL Editor (verify project ref first!)
--
-- This script:
--   1. Inserts 8 location rows for the Chicago restaurants added by
--      refine-sankofa-schedule.sql (already attached to Fri Apr 24 as
--      itinerary_items). Addresses gathered by WebFetching each restaurant's
--      website (parsed from schema.org JSON-LD where present, footer grep
--      where not), lat/lng from OpenStreetMap Nominatim geocoder.
--   2. Links each itinerary_item to its new location row via location_id.
--   3. Flags Table, Donkey and Stick with a note — the domain
--      tabledonkeyandstick.com no longer resolves DNS. The address comes
--      from OpenStreetMap's authoritative data (OSM node 6303047086).
--      Restaurant may be closed — verify before visiting.
--
-- Data sources per restaurant:
--   - Chilam Balam:             chilambalamchicago.com (footer grep)
--   - Mi Tocaya Antojería:      mitocaya.com (footer grep)
--   - Frontera Grill:           fronteragrill.com (footer grep)
--   - Taqueria Chingón:         taqueriachingon.com (schema.org JSON-LD)
--   - Gilt Bar:                 giltbarchicago.com (schema.org JSON-LD)
--   - Girl & the Goat:          girlandthegoat.com/chicago (grep)
--   - Longman & Eagle:          longmanandeagle.com (schema.org JSON-LD)
--   - Table, Donkey and Stick:  OpenStreetMap (site dead; Nominatim fallback)
--
-- All 8 coordinates verified to land in Chicago city limits (41.88–41.97 N,
-- -87.63 to -87.71 W).
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_trip_id uuid;
BEGIN
  SELECT id INTO v_trip_id FROM trips WHERE title ILIKE '%Sankofa 2026%' LIMIT 1;
  IF v_trip_id IS NULL THEN
    RAISE EXCEPTION 'Sankofa 2026 trip not found';
  END IF;
  RAISE NOTICE 'Trip: %', v_trip_id;

  -- ═══════════════════════════════════════════════════════════
  -- PART A — INSERT LOCATIONS (idempotent by trip_id + name)
  -- ═══════════════════════════════════════════════════════════

  INSERT INTO locations (trip_id, name, category, address, lat, lng, phone, url, notes)
  SELECT v_trip_id, v.name, 'dining', v.address, v.lat, v.lng, v.phone, v.url, v.notes
  FROM (VALUES
    ('Chilam Balam',
     '3023 N Broadway St, Chicago, IL 60657', 41.971605, -87.659732,
     NULL, 'https://chilambalamchicago.com',
     'BYOB Mexican in Lakeview. Small plates, agave spirits.'),
    ('Mi Tocaya Antojería',
     '2800 W Logan Blvd, Chicago, IL 60647', 41.928930, -87.697710,
     '872-315-3947', 'https://mitocaya.com',
     'Chef Diana Dávila''s regional Mexican in Logan Square. James Beard semifinalist.'),
    ('Frontera Grill',
     '445 N Clark St, Chicago, IL 60654', 41.890537, -87.630921,
     NULL, 'https://fronteragrill.com',
     'Rick Bayless''s flagship in River North. Regional Mexican.'),
    ('Taqueria Chingón',
     '817 W Fulton Market, Chicago, IL 60607', 41.886567, -87.648217,
     NULL, 'https://taqueriachingon.com',
     'Modern taqueria in Fulton Market by Chef Jonathan Zaragoza.'),
    ('Gilt Bar',
     '218 W Kinzie St, Chicago, IL 60654', 41.889285, -87.634892,
     NULL, 'https://giltbarchicago.com',
     'Rowhouse Bar gastropub in River North. Italian-leaning.'),
    ('Girl & the Goat',
     '809 W Randolph St, Chicago, IL 60607', 41.884175, -87.647889,
     NULL, 'https://girlandthegoat.com/chicago',
     'Stephanie Izard''s flagship in the West Loop / Fulton Market. Reservations essential.'),
    ('Longman & Eagle',
     '2657 N Kedzie Ave, Chicago, IL 60647', 41.930084, -87.707127,
     NULL, 'https://longmanandeagle.com',
     'Michelin-starred gastropub in Logan Square with inn rooms upstairs.'),
    ('Table, Donkey and Stick',
     '2728 W Armitage Ave, Chicago, IL 60647', 41.917685, -87.695996,
     NULL, 'https://tabledonkeyandstick.com',
     'Alpine-inspired gastropub in Logan Square. NOTE: domain no longer resolves as of 2026-04-10 — verify status before visiting. Address from OpenStreetMap.')
  ) AS v(name, address, lat, lng, phone, url, notes)
  WHERE NOT EXISTS (
    SELECT 1 FROM locations l
    WHERE l.trip_id = v_trip_id AND l.name = v.name
  );

  RAISE NOTICE 'Part A complete — 8 restaurant locations inserted (if missing).';

  -- ═══════════════════════════════════════════════════════════
  -- PART B — LINK itinerary_items TO their new locations
  -- Match by trip_id + title (restaurant names are unique on this trip)
  -- Only update items that currently have no location_id (idempotent).
  -- ═══════════════════════════════════════════════════════════

  UPDATE itinerary_items ii
  SET location_id = l.id
  FROM locations l
  WHERE ii.trip_id = v_trip_id
    AND l.trip_id = v_trip_id
    AND l.category = 'dining'
    AND ii.title = l.name
    AND ii.location_id IS NULL
    AND 'chicago-eats' = ANY(ii.tags);

  RAISE NOTICE 'Part B complete — itinerary items linked.';

  -- ═══════════════════════════════════════════════════════════
  -- PART C — Append TDS dead-site note to the itinerary item
  -- (notes column on itinerary_items — distinct from locations.notes)
  -- ═══════════════════════════════════════════════════════════

  UPDATE itinerary_items
  SET notes = COALESCE(notes || E'\n\n', '') ||
    'Heads up: the restaurant website (tabledonkeyandstick.com) no longer resolves DNS as of 2026-04-10. Address pulled from OpenStreetMap. Call ahead or check socials before going — may have closed.'
  WHERE trip_id = v_trip_id
    AND title = 'Table, Donkey and Stick'
    AND (notes IS NULL OR notes NOT LIKE '%no longer resolves DNS%');

  RAISE NOTICE 'Part C complete — TDS note appended.';

  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'DONE. Verify with:';
  RAISE NOTICE '  SELECT ii.title, l.name, l.address, l.lat, l.lng';
  RAISE NOTICE '  FROM itinerary_items ii';
  RAISE NOTICE '  LEFT JOIN locations l ON l.id = ii.location_id';
  RAISE NOTICE '  WHERE ii.trip_id = ''%'' AND ''chicago-eats'' = ANY(ii.tags)', v_trip_id;
  RAISE NOTICE '  ORDER BY ii.sort_index;';
END $$;

COMMIT;

-- ============================================================================
-- POST-RUN VERIFICATION QUERIES (run separately after COMMIT)
-- ============================================================================

-- Q1: all 8 Chicago restaurants with joined location data
-- SELECT ii.sort_index, ii.title, l.address, l.lat, l.lng, l.category, ii.tags
-- FROM itinerary_items ii
-- LEFT JOIN locations l ON l.id = ii.location_id
-- WHERE ii.trip_id = (SELECT id FROM trips WHERE title ILIKE '%Sankofa 2026%')
--   AND 'chicago-eats' = ANY(ii.tags)
-- ORDER BY ii.sort_index;

-- Q2: are any restaurants still unlinked? (should be 0 rows)
-- SELECT ii.title
-- FROM itinerary_items ii
-- WHERE ii.trip_id = (SELECT id FROM trips WHERE title ILIKE '%Sankofa 2026%')
--   AND 'chicago-eats' = ANY(ii.tags)
--   AND ii.location_id IS NULL;
