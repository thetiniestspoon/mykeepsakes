-- MyKeepsakes / Sankofa data cleanup — 2026-04-24
-- Companion to AUDIT-2026-04-23.sql
-- Target Supabase project: ckjcieeccopqowlfljja
-- Trip:    Sankofa 2026 — Healing, Justice & Sacred Care
-- trip_id: cb6f65f0-b34b-467a-a206-051cc8914db0
--
-- MUTATION PLAN (summary):
--   §A  Fix Sankofa Conference Venue address (downtown → Oak Brook Marriott)
--   §B  Geocode Chicago Marriott Oak Brook accommodation row
--   §C  Create Frank Lloyd Wright Home & Studio location, attach to Apr 21 item
--   §D  Create Taqueria Invicto location, attach to Apr 22 item
--   §E  Delete 2 orphan locations (Midway Airport, Seasons 52)
--   §F  Add 90-day expiry to 2 share links that currently have none
--   §G  Backfill itinerary_item_id on 7 of 10 unlinked memories (3 Apr 21
--       pre-trip placeholders left unlinked for your review)
--
-- All mutations run inside a single transaction block. If anything fails,
-- everything rolls back. A final SELECT verifies the end state before COMMIT.
-- To apply, execute the BEGIN ... COMMIT block as a single MCP call.

BEGIN;

-- =============================================================================
-- §A. Update Sankofa Conference Venue address → Oak Brook Marriott location
--     (was: 1333 S Wabash Ave, downtown Chicago — confirmed wrong by operator)
--     Keeps the venue as a distinct row from the accommodation row so the
--     "event" category stays semantically right.
-- =============================================================================

UPDATE locations
   SET address = '1401 W 22nd St, Oak Brook, IL 60523',
       lat    = 41.8458619,
       lng    = -87.9527972,
       updated_at = now()
 WHERE id = '40e58f20-437b-41ec-9d7c-59b715e7251e'
   AND trip_id = 'cb6f65f0-b34b-467a-a206-051cc8914db0';

-- =============================================================================
-- §B. Geocode the Chicago Marriott Oak Brook accommodation row
--     (accommodations.location_lat / location_lng were both NULL, which
--     hides the selected-stay pin on the trip map)
-- =============================================================================

UPDATE accommodations
   SET location_lat = 41.8458619,
       location_lng = -87.9527972,
       updated_at   = now()
 WHERE id = 'ac4e7993-2bd8-44ca-9be4-3d63d752a269'
   AND trip_id = 'cb6f65f0-b34b-467a-a206-051cc8914db0';

-- =============================================================================
-- §C. Create Frank Lloyd Wright Home & Studio location + attach to Apr 21 item
-- =============================================================================

WITH new_loc AS (
  INSERT INTO locations (trip_id, name, category, address, lat, lng)
  VALUES (
    'cb6f65f0-b34b-467a-a206-051cc8914db0',
    'Frank Lloyd Wright Home & Studio',
    'activity',
    '951 Chicago Ave, Oak Park, IL 60302',
    41.8940513,
    -87.7996691
  )
  RETURNING id
)
UPDATE itinerary_items
   SET location_id = (SELECT id FROM new_loc),
       updated_at  = now()
 WHERE id = 'd6d0a645-bc2d-4162-94a2-7b80fa744132';

-- =============================================================================
-- §D. Create Taqueria Invicto location + attach to Apr 22 item
--     Coord accuracy: street-segment level (OSM returned the block, not a
--     specific building). Verify the pin in-app after apply.
-- =============================================================================

WITH new_loc AS (
  INSERT INTO locations (trip_id, name, category, address, lat, lng)
  VALUES (
    'cb6f65f0-b34b-467a-a206-051cc8914db0',
    'Taqueria Invicto',
    'dining',
    '1715 W 22nd St, Oak Brook, IL',
    41.8469352,
    -87.9506340
  )
  RETURNING id
)
UPDATE itinerary_items
   SET location_id = (SELECT id FROM new_loc),
       updated_at  = now()
 WHERE id = '3f2d7f8c-2f4a-4f9e-b116-4661cb136c5a';

-- =============================================================================
-- §E. Delete 2 orphan locations (no itinerary_item, memory, or location_days
--     references — verified in AUDIT-2026-04-23.sql §3)
-- =============================================================================

DELETE FROM locations
 WHERE trip_id = 'cb6f65f0-b34b-467a-a206-051cc8914db0'
   AND id IN (
     '94284cec-e20c-4aa0-8634-db1fccf721a1',  -- Midway International Airport
     '132cca85-222d-40b1-bf78-bf2a15c97154'   -- Seasons 52
   );

-- =============================================================================
-- §F. Add 90-day expiry to share links that currently have none
--     (policy default; operator can still regenerate or revoke manually)
-- =============================================================================

UPDATE trip_share_links
   SET expires_at = created_at + interval '90 days'
 WHERE trip_id = 'cb6f65f0-b34b-467a-a206-051cc8914db0'
   AND expires_at IS NULL;

-- =============================================================================
-- §G. Memory → itinerary_item backfill (per-memory review)
--     Default picks below use time-of-creation and location match.
--     Three Apr-21 placeholder memories (created Mar 23, empty) are
--     DELIBERATELY LEFT UNLINKED pending operator decision.
-- =============================================================================

-- Apr 20 evening hotel memories — all 4 created 19:21–19:46 Chicago time
-- (matches the 18:15 "Girl and the Goat" dinner item at the Marriott)
UPDATE memories SET itinerary_item_id = '449f6959-823b-4a68-86c8-d4ebf22ac03a'
 WHERE id IN (
   'ac07758d-280e-43ba-83e0-09b5c5c1e1c0',  -- photo memory, hotel location
   '12bee5d8-13a5-485a-805f-d8afcc5675d1',  -- photo memory, hotel location
   'bde88eb1-c363-49a2-b3c2-bc7e5651b29b',  -- photo memory, hotel location
   'e178c042-75a7-4248-8f95-bf4187646ac6'   -- "A great start to our trip!"
 )
   AND trip_id = 'cb6f65f0-b34b-467a-a206-051cc8914db0';

-- Apr 22 "Breathing" note — created 13:35 (during Plenary: Wells of Joy)
UPDATE memories SET itinerary_item_id = 'd3562164-61ac-45a2-a6e9-a65490e90d05'  -- Plenary: Wells of Joy
 WHERE id = '953aa178-6b82-4084-ad7f-5042ef477e82'
   AND trip_id = 'cb6f65f0-b34b-467a-a206-051cc8914db0';

-- Apr 22 "Breathing / Sacred service with silent strain" — created 14:00
-- (right at the start of "Dear Pastor, Do You Want To Be Made Well?")
UPDATE memories SET itinerary_item_id = '3ddc5313-09d3-497a-850e-357d22d8465a'  -- Dear Pastor
 WHERE id IN (
   '53d8bb02-1e9b-4f2f-a93e-d558621938eb',  -- created 14:00
   '75576b07-49a0-4438-9fb4-c8301c21704f'   -- created 14:12
 )
   AND trip_id = 'cb6f65f0-b34b-467a-a206-051cc8914db0';

-- Left unlinked intentionally (3 pre-trip placeholders created Mar 23):
--   5ff66290-d818-4f85-a0c0-7ac0ab961aa9   (day=Apr 21, empty note, no location)
--   503ddba8-6991-443d-9291-5ec536d322d7   (day=Apr 21, empty note, no location)
--   d2f5512f-4974-4183-b6d8-c0aff4107894   (day=Apr 21, "I am cool", no location)
-- Decision deferred — these look like test data. A separate cleanup can
-- DELETE them or attach them to a real item once you confirm intent.

-- =============================================================================
-- Post-mutation verification — must show 0 rows for every named check.
-- Keep this in a separate SELECT so you can eyeball before COMMIT.
-- =============================================================================

SELECT 'conference_venue_address' AS check,
       jsonb_build_object('address', address, 'lat', lat, 'lng', lng)::text AS actual
FROM locations WHERE id = '40e58f20-437b-41ec-9d7c-59b715e7251e'
UNION ALL
SELECT 'marriott_accommodation_coords',
       jsonb_build_object('lat', location_lat, 'lng', location_lng)::text
FROM accommodations WHERE id = 'ac4e7993-2bd8-44ca-9be4-3d63d752a269'
UNION ALL
SELECT 'flw_item_now_has_location',
       (SELECT name FROM locations WHERE id = i.location_id)
FROM itinerary_items i WHERE i.id = 'd6d0a645-bc2d-4162-94a2-7b80fa744132'
UNION ALL
SELECT 'invicto_item_now_has_location',
       (SELECT name FROM locations WHERE id = i.location_id)
FROM itinerary_items i WHERE i.id = '3f2d7f8c-2f4a-4f9e-b116-4661cb136c5a'
UNION ALL
SELECT 'orphan_locations_remaining',
       count(*)::text
FROM locations WHERE id IN (
  '94284cec-e20c-4aa0-8634-db1fccf721a1',
  '132cca85-222d-40b1-bf78-bf2a15c97154'
)
UNION ALL
SELECT 'share_links_still_no_expiry',
       count(*)::text
FROM trip_share_links
WHERE trip_id = 'cb6f65f0-b34b-467a-a206-051cc8914db0'
  AND expires_at IS NULL
UNION ALL
SELECT 'memories_without_item_after_backfill',
       count(*)::text
FROM memories
WHERE trip_id = 'cb6f65f0-b34b-467a-a206-051cc8914db0'
  AND itinerary_item_id IS NULL;

-- After the SELECT result looks right:
COMMIT;

-- ROLLBACK;  -- uncomment instead of COMMIT if verification shows anything wrong
