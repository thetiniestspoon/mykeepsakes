-- ============================================================================
-- REFINE SANKOFA SCHEDULE — trip details reconciliation
-- Run in Family Core Supabase SQL Editor (verify project ref first!)
--
-- This script:
--   1. Adds `is_chosen` boolean to itinerary_items
--   2. Reconciles the DB schedule with the CURRENT canonical BCR website
--      (blackchaplainsrock.com/{wednesday,thursday,friday}sessions)
--      — 3 Wed workshop titles replaced, 2 minor fixes
--   3. Marks Shawn's 7 registered workshops (Order #10034) as is_chosen = true
--   4. Preserves original registered title as a note on Wed 11am Track A
--      (BCR renamed "Combating Sexism, Homophobia, and Transphobia in Ministry"
--      → "Transcendent Healing: Embodying Freedom in Ministry" between
--      Jan 16 and Feb 12 2026, per Wayback Machine. Same speaker: Nala
--      Simone Toussaint, whose faith ministry focuses on trans liberation
--      and Black LGBTQ+ communities — see nalatoussaint.com/faith.)
--   5. Adds 8 Chicago restaurants from Dropbox as personal dining options
--      on Friday Apr 24 (departure day, free afternoon)
--
-- Source-of-truth inputs:
--   - C:\Users\shawn\Dropbox\Foundry-Satellite\satellite-Dropbox\MyKeepsakes-Sankofa\
--       Chosen Sessions.pdf  (registration receipt, Jan 16 2026, Order #10034)
--       Chicago restaurants.txt
--   - https://www.blackchaplainsrock.com/{wednesday,thursday,friday}sessions
--     (fetched 2026-04-10)
--   - https://web.archive.org/web/20260212105034/... (Wayback Feb 12 2026)
-- ============================================================================

BEGIN;

-- 1. Add is_chosen column + partial index
ALTER TABLE itinerary_items
  ADD COLUMN IF NOT EXISTS is_chosen boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN itinerary_items.is_chosen IS
  'User registered for / committed to this concurrent-session option. UI shows gold star and can filter sibling options.';

CREATE INDEX IF NOT EXISTS idx_itinerary_items_chosen
  ON itinerary_items (trip_id, is_chosen) WHERE is_chosen = true;

-- 2. Main reconciliation block
DO $$
DECLARE
  v_trip_id uuid;
  v_day_22 uuid;
  v_day_23 uuid;
  v_day_24 uuid;
  v_venue_id uuid;
  v_affected integer;
  v_title text;
BEGIN
  SELECT id INTO v_trip_id FROM trips WHERE title ILIKE '%Sankofa 2026%' LIMIT 1;
  IF v_trip_id IS NULL THEN
    RAISE EXCEPTION 'Sankofa 2026 trip not found';
  END IF;

  SELECT id INTO v_day_22 FROM itinerary_days WHERE trip_id = v_trip_id AND date = '2026-04-22';
  SELECT id INTO v_day_23 FROM itinerary_days WHERE trip_id = v_trip_id AND date = '2026-04-23';
  SELECT id INTO v_day_24 FROM itinerary_days WHERE trip_id = v_trip_id AND date = '2026-04-24';
  SELECT id INTO v_venue_id FROM locations WHERE trip_id = v_trip_id AND name = 'Sankofa Conference Venue' LIMIT 1;

  RAISE NOTICE 'Trip: %  Day 22: %  Day 23: %  Day 24: %', v_trip_id, v_day_22, v_day_23, v_day_24;

  -- ═══════════════════════════════════════════════════════════
  -- PART A — CANONICAL RECONCILIATION (Wednesday drift)
  -- BCR replaced 3 workshops between our original import and 2026-04-10.
  -- Titles change → speaker cleared (BCR page no longer lists them).
  -- ═══════════════════════════════════════════════════════════

  -- Wed 10am + 2pm, Track A: Joy as Resistance (Vahisha Hasan) → Dear Pastor
  UPDATE itinerary_items SET
    title = 'Dear Pastor, Do You Want To Be Made Well?',
    description = 'Explores mental health challenges facing clergy and offers practical tools for healing, restoration, and leadership from a place of wholeness.',
    speaker = NULL
  WHERE trip_id = v_trip_id
    AND day_id = v_day_22
    AND track = 'A'
    AND start_time IN ('10:00'::time, '14:00'::time);

  -- Wed 10am + 2pm, Track B: Spiritual Practices (Ebony Only) → Rest and Joy
  UPDATE itinerary_items SET
    title = 'Rest and Joy as a Resistance',
    description = 'Reclaims joy and rest as spiritual practices of resistance, embracing their critical role in the emotional sustainability of Black clergy.',
    speaker = NULL
  WHERE trip_id = v_trip_id
    AND day_id = v_day_22
    AND track = 'B'
    AND start_time IN ('10:00'::time, '14:00'::time);

  -- Wed 11am + 3:10pm, Track C: Womanist Approaches (Lauren Frazier-McGuin) → Joy as Resistance
  UPDATE itinerary_items SET
    title = 'Joy as Resistance',
    description = 'Explores how joy functions as a radical tool for resistance and healing, especially for those carrying the weight of pastoral care in marginalized communities.',
    speaker = NULL
  WHERE trip_id = v_trip_id
    AND day_id = v_day_22
    AND track = 'C'
    AND start_time IN ('11:00'::time, '15:10'::time);

  -- Thursday 10am Track B: typo fix (Burdens → Burden, matches canonical)
  UPDATE itinerary_items SET
    title = 'Ministry in the Mirror: Healing the Hidden Burden of Shame and Imposter Syndrome',
    description = 'Even clergy wrestle with the persistent whisper: "Am I enough?" A healing-centered, trauma-informed session offering pastors, chaplains, and faith leaders a sacred pause to confront the silent weight of imposter syndrome and shame with honesty and grace.'
  WHERE trip_id = v_trip_id
    AND day_id = v_day_23
    AND track = 'B'
    AND start_time = '10:00'::time
    AND title LIKE 'Ministry in the Mirror%';

  -- Thursday plenary: add LCSW credential to speaker (per canonical)
  UPDATE itinerary_items SET
    speaker = 'Rev. Dr. Wm. Marcus Small, LCSW'
  WHERE trip_id = v_trip_id
    AND day_id = v_day_23
    AND title = 'Plenary: The Entanglement';

  RAISE NOTICE 'Part A complete — canonical reconciliation done.';

  -- ═══════════════════════════════════════════════════════════
  -- BUG-08 PRE-FLIGHT — verify all 7 chosen-slot titles are where
  -- we expect them BEFORE Part B lights is_chosen on those rows.
  -- Guards against BCR drift landing the flag on the wrong workshop.
  -- All 7 are expected in their post-Part-A state.
  -- ═══════════════════════════════════════════════════════════

  -- #1 Wed 10:00 AM Track B — Rest and Joy as a Resistance
  SELECT title INTO v_title FROM itinerary_items
    WHERE trip_id = v_trip_id AND day_id = v_day_22 AND track = 'B' AND start_time = '10:00'::time;
  IF v_title IS DISTINCT FROM 'Rest and Joy as a Resistance' THEN
    RAISE EXCEPTION 'Pre-flight: Wed 10 AM Track B expected "Rest and Joy as a Resistance", got "%"', v_title;
  END IF;

  -- #2 Wed 2:00 PM Track A — Dear Pastor, Do You Want To Be Made Well?
  SELECT title INTO v_title FROM itinerary_items
    WHERE trip_id = v_trip_id AND day_id = v_day_22 AND track = 'A' AND start_time = '14:00'::time;
  IF v_title IS DISTINCT FROM 'Dear Pastor, Do You Want To Be Made Well?' THEN
    RAISE EXCEPTION 'Pre-flight: Wed 2 PM Track A expected "Dear Pastor, Do You Want To Be Made Well?", got "%"', v_title;
  END IF;

  -- #3 Wed 3:10 PM Track B — Creating Space for Mental Wellness in Our Sacred Spaces
  SELECT title INTO v_title FROM itinerary_items
    WHERE trip_id = v_trip_id AND day_id = v_day_22 AND track = 'B' AND start_time = '15:10'::time;
  IF v_title IS NULL OR v_title NOT ILIKE '%Mental Wellness%' THEN
    RAISE EXCEPTION 'Pre-flight: Wed 3:10 PM Track B expected "Creating Space for Mental Wellness...", got "%"', v_title;
  END IF;

  -- #4 Thu 10:00 AM Track B — Ministry in the Mirror
  SELECT title INTO v_title FROM itinerary_items
    WHERE trip_id = v_trip_id AND day_id = v_day_23 AND track = 'B' AND start_time = '10:00'::time;
  IF v_title IS NULL OR v_title NOT LIKE 'Ministry in the Mirror%' THEN
    RAISE EXCEPTION 'Pre-flight: Thu 10 AM Track B expected "Ministry in the Mirror...", got "%"', v_title;
  END IF;

  -- #5 Thu 1:30 PM Track B — Clergy Boundary Training
  SELECT title INTO v_title FROM itinerary_items
    WHERE trip_id = v_trip_id AND day_id = v_day_23 AND track = 'B' AND start_time = '13:30'::time;
  IF v_title IS NULL OR v_title NOT ILIKE '%Boundary%' THEN
    RAISE EXCEPTION 'Pre-flight: Thu 1:30 PM Track B expected "Clergy Boundary Training", got "%"', v_title;
  END IF;

  -- #6 Thu 2:45 PM Track A — Spiritual Entrepreneurship: C.R.E.A.M.
  SELECT title INTO v_title FROM itinerary_items
    WHERE trip_id = v_trip_id AND day_id = v_day_23 AND track = 'A' AND start_time = '14:45'::time;
  IF v_title IS NULL OR v_title NOT ILIKE '%Entrepreneurship%' THEN
    RAISE EXCEPTION 'Pre-flight: Thu 2:45 PM Track A expected "Spiritual Entrepreneurship: C.R.E.A.M.", got "%"', v_title;
  END IF;

  -- #7 Wed 11:00 AM Track A — Transcendent Healing (renamed from "Combating Sexism...")
  -- Accept either the original or the post-rename title.
  SELECT title INTO v_title FROM itinerary_items
    WHERE trip_id = v_trip_id AND day_id = v_day_22 AND track = 'A' AND start_time = '11:00'::time;
  IF v_title IS NULL OR (v_title NOT ILIKE '%Transcendent Healing%' AND v_title NOT ILIKE '%Combating%') THEN
    RAISE EXCEPTION 'Pre-flight: Wed 11 AM Track A expected "Transcendent Healing..." or "Combating Sexism...", got "%"', v_title;
  END IF;

  RAISE NOTICE 'Pre-flight: all 7 chosen-slot titles verified.';

  -- ═══════════════════════════════════════════════════════════
  -- PART B — MARK SHAWN'S CHOSEN WORKSHOPS (is_chosen = true)
  -- Source: Chosen Sessions.pdf (Order #10034, Jan 16 2026)
  -- Each UPDATE reports row count; 0 rows = RAISE WARNING (BUG-07).
  -- ═══════════════════════════════════════════════════════════

  -- Wed 10:00 AM — Workshop B: Rest and Joy as a Resistance
  UPDATE itinerary_items SET is_chosen = true
    WHERE trip_id = v_trip_id AND day_id = v_day_22 AND track = 'B' AND start_time = '10:00'::time;
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  IF v_affected = 0 THEN RAISE WARNING 'Part B: no row matched Wed 10 AM Track B'; END IF;

  -- Wed 2:00 PM — Workshop A: Dear Pastor, Do You Want To Be Made Well?
  UPDATE itinerary_items SET is_chosen = true
    WHERE trip_id = v_trip_id AND day_id = v_day_22 AND track = 'A' AND start_time = '14:00'::time;
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  IF v_affected = 0 THEN RAISE WARNING 'Part B: no row matched Wed 2 PM Track A'; END IF;

  -- Wed 3:10 PM — Workshop B: Creating Space for Mental Wellness in Our Sacred Spaces
  UPDATE itinerary_items SET is_chosen = true
    WHERE trip_id = v_trip_id AND day_id = v_day_22 AND track = 'B' AND start_time = '15:10'::time;
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  IF v_affected = 0 THEN RAISE WARNING 'Part B: no row matched Wed 3:10 PM Track B'; END IF;

  -- Thu 10:00 AM — Workshop B: Ministry in the Mirror
  UPDATE itinerary_items SET is_chosen = true
    WHERE trip_id = v_trip_id AND day_id = v_day_23 AND track = 'B' AND start_time = '10:00'::time;
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  IF v_affected = 0 THEN RAISE WARNING 'Part B: no row matched Thu 10 AM Track B'; END IF;

  -- Thu 1:30 PM — Workshop B: Clergy Boundary Training
  UPDATE itinerary_items SET is_chosen = true
    WHERE trip_id = v_trip_id AND day_id = v_day_23 AND track = 'B' AND start_time = '13:30'::time;
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  IF v_affected = 0 THEN RAISE WARNING 'Part B: no row matched Thu 1:30 PM Track B'; END IF;

  -- Thu 2:45 PM — Workshop A: Spiritual Entrepreneurship: C.R.E.A.M.
  UPDATE itinerary_items SET is_chosen = true
    WHERE trip_id = v_trip_id AND day_id = v_day_23 AND track = 'A' AND start_time = '14:45'::time;
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  IF v_affected = 0 THEN RAISE WARNING 'Part B: no row matched Thu 2:45 PM Track A'; END IF;

  -- Wed 11:00 AM — Workshop A: Transcendent Healing (Nala Simone Toussaint)
  -- Registered as "Combating Sexism, Homophobia, and Transphobia in Ministry"
  -- on Jan 16. BCR renamed the workshop (same slot, same speaker, softer
  -- brochure title) between Jan 16 and Feb 12 2026 per Wayback Machine.
  -- Nala Toussaint's ministry focuses on trans liberation and Black
  -- LGBTQ+ communities — the original title matches her subject area.
  UPDATE itinerary_items SET
    is_chosen = true,
    notes = COALESCE(notes || E'\n\n', '') ||
      'Originally registered as "Combating Sexism, Homophobia, and Transphobia in Ministry" per Order #10034 (Jan 16 2026). BCR renamed the session to "Transcendent Healing: Embodying Freedom in Ministry" — same speaker (Nala Simone Toussaint), same slot, same subject area.'
  WHERE trip_id = v_trip_id
    AND day_id = v_day_22
    AND track = 'A'
    AND start_time = '11:00'::time
    AND (notes IS NULL OR notes NOT LIKE '%Originally registered%');
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  -- 0 here is fine on re-runs (idempotency guard already stamped the note);
  -- warn only if the row itself is missing (would fail pre-flight anyway).

  RAISE NOTICE 'Part B complete — 7 chosen workshops marked.';

  -- ═══════════════════════════════════════════════════════════
  -- PART D — CHICAGO RESTAURANTS
  -- 4 Mexican + 4 gastropubs from Dropbox txt file.
  -- Attached to Friday Apr 24 (departure day, conference ends 10:45am).
  -- sort_index 100+ keeps them below the scheduled events.
  -- ═══════════════════════════════════════════════════════════

  INSERT INTO itinerary_items (
    trip_id, day_id, title, start_time, category, sort_index,
    item_type, status, source, tags, link, link_label, is_chosen
  )
  SELECT
    v_trip_id, v_day_24, v.title, NULL, 'dining', v.sort_index,
    'activity', 'planned', 'import',
    ARRAY['personal-option','chicago-eats', v.cuisine],
    v.url, 'Website', false
  FROM (VALUES
    ('Chilam Balam',               100, 'mexican',   'https://chilambalamchicago.com'),
    ('Mi Tocaya Antojería',        101, 'mexican',   'https://mitocaya.com'),
    ('Frontera Grill',             102, 'mexican',   'https://fronteragrill.com'),
    ('Taqueria Chingón',           103, 'mexican',   'https://taqueriachingon.com'),
    ('Gilt Bar',                   104, 'gastropub', 'https://giltbarchicago.com'),
    ('Girl & the Goat',            105, 'gastropub', 'https://girlandthegoat.com'),
    ('Longman & Eagle',            106, 'gastropub', 'https://longmanandeagle.com'),
    ('Table, Donkey and Stick',    107, 'gastropub', 'https://tabledonkeyandstick.com')
  ) AS v(title, sort_index, cuisine, url)
  WHERE NOT EXISTS (
    SELECT 1 FROM itinerary_items
    WHERE trip_id = v_trip_id AND title = v.title
  );

  RAISE NOTICE 'Part D complete — restaurants inserted.';

  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'DONE. Verify with:';
  RAISE NOTICE '  SELECT title, start_time, track, is_chosen FROM itinerary_items';
  RAISE NOTICE '  WHERE trip_id = ''%'' AND is_chosen = true ORDER BY day_id, start_time;', v_trip_id;
  RAISE NOTICE '  (should return 7 rows, all canonical)';
END $$;

COMMIT;

-- ============================================================================
-- POST-RUN VERIFICATION QUERIES (run separately after COMMIT)
-- ============================================================================

-- Q1: all 7 chosen workshops
-- SELECT d.date, ii.start_time, ii.track, ii.title, ii.speaker, ii.notes
-- FROM itinerary_items ii
-- JOIN itinerary_days d ON d.id = ii.day_id
-- WHERE ii.trip_id = (SELECT id FROM trips WHERE title ILIKE '%Sankofa 2026%')
--   AND ii.is_chosen = true
-- ORDER BY d.date, ii.start_time;

-- Q2: all Wed workshops side by side
-- SELECT start_time, track, title, is_chosen
-- FROM itinerary_items
-- WHERE trip_id = (SELECT id FROM trips WHERE title ILIKE '%Sankofa 2026%')
--   AND day_id = (SELECT id FROM itinerary_days WHERE date = '2026-04-22'
--                 AND trip_id = (SELECT id FROM trips WHERE title ILIKE '%Sankofa 2026%'))
--   AND track IS NOT NULL
-- ORDER BY start_time, track;

-- Q3: Chicago restaurants on Friday
-- SELECT title, category, tags, link
-- FROM itinerary_items
-- WHERE trip_id = (SELECT id FROM trips WHERE title ILIKE '%Sankofa 2026%')
--   AND 'chicago-eats' = ANY(tags)
-- ORDER BY sort_index;
