-- MyKeepsakes / Sankofa data audit — 2026-04-23
-- Target Supabase project: ckjcieeccopqowlfljja
-- All queries are READ-ONLY. Cleanup SQL lives in a separate file after we review results.
--
-- Intent: surface every "something might be off" data shape in the Sankofa trip
-- so the operator can decide what's intentional vs what's drift.

-- =============================================================================
-- 0. Trip discovery — find the Sankofa trip_id. Run this FIRST and swap the UUID
--    into the :sankofa variable (or paste it into each query) below.
-- =============================================================================

SELECT id, title, created_at, start_date, end_date,
       (metadata IS NOT NULL) AS has_metadata,
       jsonb_pretty(metadata) AS metadata
FROM trips
ORDER BY created_at DESC;

-- =============================================================================
-- After running #0, set this:
--   \set sankofa  '<PASTE-UUID-HERE>'
-- OR replace every :'sankofa' below with the literal UUID in quotes.
-- (Supabase Studio SQL editor doesn't support \set — use find-and-replace.)
-- =============================================================================

-- =============================================================================
-- 1. Day coverage — are all conference dates present, in order, no dupes?
--    Sankofa runs 2026-04-20 through 2026-04-26.
-- =============================================================================

SELECT id, date, title, created_at
FROM itinerary_days
WHERE trip_id = :'sankofa'
ORDER BY date;

-- Days that *should* exist but don't:
WITH expected AS (
  SELECT generate_series('2026-04-20'::date, '2026-04-26'::date, '1 day')::date AS date
)
SELECT e.date AS missing_date
FROM expected e
LEFT JOIN itinerary_days d ON d.date = e.date AND d.trip_id = :'sankofa'
WHERE d.id IS NULL
ORDER BY e.date;

-- Duplicate days (same trip, same date):
SELECT date, count(*) AS n, array_agg(id ORDER BY created_at) AS day_ids
FROM itinerary_days
WHERE trip_id = :'sankofa'
GROUP BY date
HAVING count(*) > 1;

-- =============================================================================
-- 2. Itinerary items — counts per day + items w/ null day_id or trip_id
-- =============================================================================

SELECT d.date, d.title, count(i.id) AS items
FROM itinerary_days d
LEFT JOIN itinerary_items i ON i.day_id = d.id
WHERE d.trip_id = :'sankofa'
GROUP BY d.date, d.title
ORDER BY d.date;

-- Items whose day_id points at a day in a DIFFERENT trip (data leak):
SELECT i.id, i.title, i.day_id, d.trip_id AS day_trip_id, i.trip_id
FROM itinerary_items i
LEFT JOIN itinerary_days d ON d.id = i.day_id
WHERE i.trip_id = :'sankofa'
  AND (d.trip_id IS NULL OR d.trip_id <> i.trip_id);

-- Items with no location (often intentional — opening session, meals etc. —
-- but handy to eyeball):
SELECT i.id, i.title, i.category, i.start_time, d.date
FROM itinerary_items i
JOIN itinerary_days d ON d.id = i.day_id
WHERE i.trip_id = :'sankofa' AND i.location_id IS NULL
ORDER BY d.date, i.start_time NULLS LAST, i.sort_index;

-- =============================================================================
-- 3. Locations — missing coords, duplicates, unlinked to any item/day/memory
-- =============================================================================

-- Locations without lat/lng (map pins will fail):
SELECT id, name, address, category, created_at
FROM locations
WHERE trip_id = :'sankofa' AND (lat IS NULL OR lng IS NULL);

-- Duplicate locations (same trip, same name — may be legitimate repeats across
-- days, or may be accidental):
SELECT name, count(*) AS n, array_agg(id ORDER BY created_at) AS location_ids
FROM locations
WHERE trip_id = :'sankofa'
GROUP BY name
HAVING count(*) > 1;

-- Locations that no itinerary_item, memory, or location_days row references
-- (orphans that show on the map but have no content):
SELECT l.id, l.name, l.category, l.address
FROM locations l
WHERE l.trip_id = :'sankofa'
  AND NOT EXISTS (SELECT 1 FROM itinerary_items i WHERE i.location_id = l.id)
  AND NOT EXISTS (SELECT 1 FROM memories m WHERE m.location_id = l.id)
  AND NOT EXISTS (SELECT 1 FROM location_days ld WHERE ld.location_id = l.id);

-- Locations without an address (harder to share, no Google Maps link):
SELECT id, name, category, lat, lng
FROM locations
WHERE trip_id = :'sankofa' AND (address IS NULL OR address = '');

-- =============================================================================
-- 4. Memories — the one the snapshot's nextSteps flagged: "legacy memories
--    missing itinerary_item_id". Also orphan checks + recent activity.
-- =============================================================================

-- Memory count by link-state:
SELECT
  count(*) AS total,
  count(*) FILTER (WHERE itinerary_item_id IS NOT NULL) AS with_item,
  count(*) FILTER (WHERE itinerary_item_id IS NULL)     AS without_item,
  count(*) FILTER (WHERE day_id IS NOT NULL)            AS with_day,
  count(*) FILTER (WHERE location_id IS NOT NULL)       AS with_location,
  count(*) FILTER (WHERE day_id IS NULL
                   AND itinerary_item_id IS NULL
                   AND location_id IS NULL)             AS fully_unlinked
FROM memories
WHERE trip_id = :'sankofa';

-- Memories without an itinerary_item_id (the backfill candidates):
SELECT m.id, m.title, m.note, m.created_at, m.day_id, d.date, m.location_id, l.name AS location_name
FROM memories m
LEFT JOIN itinerary_days d ON d.id = m.day_id
LEFT JOIN locations l ON l.id = m.location_id
WHERE m.trip_id = :'sankofa' AND m.itinerary_item_id IS NULL
ORDER BY m.created_at DESC;

-- Memories created during the conference window (Apr 20 onwards) —
-- the ones that need hygiene most:
SELECT m.id, m.title, m.note, m.created_at, d.date AS day,
       (m.itinerary_item_id IS NOT NULL) AS linked_to_item,
       (m.location_id IS NOT NULL)       AS linked_to_location,
       count(mm.id)                      AS media_count
FROM memories m
LEFT JOIN itinerary_days d ON d.id = m.day_id
LEFT JOIN memory_media mm ON mm.memory_id = m.id
WHERE m.trip_id = :'sankofa' AND m.created_at >= '2026-04-20'
GROUP BY m.id, d.date
ORDER BY m.created_at DESC;

-- Memories that POINT AT rows in other trips (cross-trip leakage):
SELECT m.id, m.title, m.trip_id,
       i.trip_id AS item_trip, i.title AS item_title,
       d.trip_id AS day_trip,
       l.trip_id AS loc_trip
FROM memories m
LEFT JOIN itinerary_items i ON i.id = m.itinerary_item_id
LEFT JOIN itinerary_days d ON d.id = m.day_id
LEFT JOIN locations l ON l.id = m.location_id
WHERE m.trip_id = :'sankofa'
  AND (
       (i.trip_id IS NOT NULL AND i.trip_id <> m.trip_id)
    OR (d.trip_id IS NOT NULL AND d.trip_id <> m.trip_id)
    OR (l.trip_id IS NOT NULL AND l.trip_id <> m.trip_id)
  );

-- =============================================================================
-- 5. Memory media — orphans, missing thumbs, any weird size/mime
-- =============================================================================

-- Orphan memory_media rows (shouldn't exist given FK, but paranoia):
SELECT mm.id, mm.memory_id, mm.storage_path, mm.created_at
FROM memory_media mm
LEFT JOIN memories m ON m.id = mm.memory_id
WHERE m.id IS NULL;

-- memory_media by memory for the Sankofa trip — counts + types:
SELECT mm.memory_id, count(*) AS media_count,
       array_agg(DISTINCT mm.media_type) AS media_types,
       sum(mm.byte_size) AS total_bytes
FROM memory_media mm
JOIN memories m ON m.id = mm.memory_id
WHERE m.trip_id = :'sankofa'
GROUP BY mm.memory_id;

-- memory_media missing thumbnail_path (gallery will show slow full-res):
SELECT mm.id, mm.memory_id, mm.storage_path, mm.media_type, mm.byte_size
FROM memory_media mm
JOIN memories m ON m.id = mm.memory_id
WHERE m.trip_id = :'sankofa'
  AND mm.thumbnail_path IS NULL
  AND mm.media_type = 'image';

-- =============================================================================
-- 6. Photos table — this is the LEGACY photos table (per-itinerary-item).
--    KNOWN ISSUE from snapshot next-steps: no trip_id scoping, no FK on item_id.
--    Here we check for orphans.
-- =============================================================================

-- Photos whose item_id doesn't match any itinerary_item (likely lost):
SELECT p.id, p.item_id, p.storage_path, p.caption, p.created_at
FROM photos p
LEFT JOIN itinerary_items ii ON ii.id = p.item_id
WHERE ii.id IS NULL
ORDER BY p.created_at DESC;

-- Photos for Sankofa items (by joining):
SELECT p.id, p.item_id, ii.title AS item_title, p.storage_path, p.caption, p.created_at
FROM photos p
JOIN itinerary_items ii ON ii.id = p.item_id
WHERE ii.trip_id = :'sankofa'
ORDER BY p.created_at DESC;

-- Photos for NON-Sankofa items (shouldn't show in Sankofa UI — if any show up
-- anyway, that's the cache-key bug the snapshot flagged):
SELECT p.id, p.item_id, ii.title AS item_title, ii.trip_id
FROM photos p
JOIN itinerary_items ii ON ii.id = p.item_id
WHERE ii.trip_id <> :'sankofa'
ORDER BY p.created_at DESC
LIMIT 50;

-- =============================================================================
-- 7. Notes — super-minimal table, item_id is a string with no FK
-- =============================================================================

-- Notes whose item_id points at a non-existent itinerary_item:
SELECT n.id, n.item_id, substring(n.content, 1, 100) AS content_preview, n.created_at
FROM notes n
LEFT JOIN itinerary_items ii ON ii.id = n.item_id
WHERE ii.id IS NULL;

-- Notes per Sankofa item:
SELECT n.id, ii.title, substring(n.content, 1, 80) AS content_preview, n.updated_at
FROM notes n
JOIN itinerary_items ii ON ii.id = n.item_id
WHERE ii.trip_id = :'sankofa'
ORDER BY n.updated_at DESC;

-- =============================================================================
-- 8. Accommodations (lodging) — is a stay selected? Missing coords? Dupes?
-- =============================================================================

SELECT id, title, address, check_in, check_out,
       is_selected, is_deprioritized,
       (location_lat IS NOT NULL AND location_lng IS NOT NULL) AS has_coords,
       url, notes, created_at
FROM accommodations
WHERE trip_id = :'sankofa'
ORDER BY is_selected DESC, sort_order, created_at;

-- Multiple selected stays (there should be at most one):
SELECT count(*) AS selected_count
FROM accommodations
WHERE trip_id = :'sankofa' AND is_selected = TRUE;

-- =============================================================================
-- 9. Favorites — duplicates, orphans
-- =============================================================================

-- Orphan favorites (item_id points nowhere):
SELECT f.id, f.item_id, f.created_at
FROM favorites f
LEFT JOIN itinerary_items ii ON ii.id = f.item_id
LEFT JOIN locations l ON l.id = f.item_id
LEFT JOIN memories m ON m.id = f.item_id
WHERE ii.id IS NULL AND l.id IS NULL AND m.id IS NULL;

-- =============================================================================
-- 10. Dispatches — are any dispatches drafted/published?
-- =============================================================================

SELECT id, title, published_at, created_at,
       (SELECT count(*) FROM dispatch_items di WHERE di.dispatch_id = d.id) AS item_count
FROM dispatches d
WHERE trip_id = :'sankofa'
ORDER BY created_at DESC;

-- =============================================================================
-- 11. Share links — any expired, any public?
-- =============================================================================

SELECT id, token, permission, expires_at, dispatch_id, created_at,
       CASE WHEN expires_at < now() THEN 'expired'
            WHEN expires_at IS NULL  THEN 'no expiry'
            ELSE 'valid' END AS status
FROM trip_share_links
WHERE trip_id = :'sankofa'
ORDER BY created_at DESC;

-- =============================================================================
-- 12. Family contacts — quick roll-up
-- =============================================================================

SELECT count(*) AS total,
       count(*) FILTER (WHERE phone IS NOT NULL) AS with_phone,
       count(*) FILTER (WHERE (relationship IS NULL OR relationship = '')) AS missing_relationship
FROM family_contacts
WHERE trip_id = :'sankofa';

-- =============================================================================
-- 13. Storage-path sanity — memory_media + photos point at strings; any null,
--     empty, or obviously malformed?
-- =============================================================================

SELECT 'memory_media' AS src, count(*) AS bad_paths
FROM memory_media
WHERE storage_path IS NULL OR storage_path = '' OR storage_path NOT LIKE '%/%'
UNION ALL
SELECT 'photos', count(*)
FROM photos
WHERE storage_path IS NULL OR storage_path = '' OR storage_path NOT LIKE '%/%';

-- =============================================================================
-- END OF AUDIT
-- After running, capture results and return them — we'll draft cleanup SQL
-- (ALTER / UPDATE / DELETE) based on what's actually off, WITH USER APPROVAL
-- before any mutation runs.
-- =============================================================================
