-- ============================================================================
-- UPDATE SANKOFA SCHEDULE IN PLACE
-- Run in Family Core Supabase SQL Editor
-- Adds speaker/track columns, replaces placeholder items with real schedule,
-- adds conference venue + all speakers as contacts.
-- ============================================================================

BEGIN;

-- 1. Add columns if not present
ALTER TABLE itinerary_items
  ADD COLUMN IF NOT EXISTS speaker text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS track text DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_itinerary_items_track
  ON itinerary_items (track) WHERE track IS NOT NULL;

-- 2. Grab the trip ID
DO $$
DECLARE
  v_trip_id uuid;
  v_day_21 uuid;
  v_day_22 uuid;
  v_day_23 uuid;
  v_day_24 uuid;
  v_venue_id uuid;
BEGIN
  SELECT id INTO v_trip_id
    FROM trips
    WHERE title ILIKE '%Sankofa 2026%'
    LIMIT 1;

  IF v_trip_id IS NULL THEN
    RAISE EXCEPTION 'Sankofa 2026 trip not found';
  END IF;

  RAISE NOTICE 'Trip ID: %', v_trip_id;

  -- 3. Get day IDs for conference days
  SELECT id INTO v_day_21 FROM itinerary_days WHERE trip_id = v_trip_id AND date = '2026-04-21';
  SELECT id INTO v_day_22 FROM itinerary_days WHERE trip_id = v_trip_id AND date = '2026-04-22';
  SELECT id INTO v_day_23 FROM itinerary_days WHERE trip_id = v_trip_id AND date = '2026-04-23';
  SELECT id INTO v_day_24 FROM itinerary_days WHERE trip_id = v_trip_id AND date = '2026-04-24';

  -- 4. Update day titles to match real schedule
  UPDATE itinerary_days SET title = 'Sankofa Day 1 — Opening & Registration' WHERE id = v_day_21;
  UPDATE itinerary_days SET title = 'Sankofa Day 2 — Deep Work' WHERE id = v_day_22;
  UPDATE itinerary_days SET title = 'Sankofa Day 3 — Healing & Leadership' WHERE id = v_day_23;
  UPDATE itinerary_days SET title = 'Sankofa Day 4 — Closing' WHERE id = v_day_24;

  -- 5. Add conference venue location
  INSERT INTO locations (trip_id, name, category, address, lat, lng)
    VALUES (v_trip_id, 'Sankofa Conference Venue', 'event', '1333 S. Wabash Ave., Unit #2804, Chicago, IL 60605', 41.8653, -87.6258)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_venue_id;

  -- If it already existed, fetch it
  IF v_venue_id IS NULL THEN
    SELECT id INTO v_venue_id FROM locations WHERE trip_id = v_trip_id AND name = 'Sankofa Conference Venue';
  END IF;

  -- 6. Delete old placeholder items for conference days (Apr 21-24)
  DELETE FROM itinerary_items
    WHERE trip_id = v_trip_id
    AND day_id IN (v_day_21, v_day_22, v_day_23, v_day_24);

  RAISE NOTICE 'Old items deleted. Inserting real schedule...';

  -- ═══════════════════════════════════════════════════════════
  -- APR 21 (TUE) — DAY 1: OPENING & REGISTRATION
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO itinerary_items (trip_id, day_id, title, start_time, category, sort_index, item_type, status, source, speaker, track, tags, notes, location_id) VALUES
    (v_trip_id, v_day_21, 'Conference Registration', '12:00', 'event', 0, 'activity', 'planned', 'import', NULL, NULL, '{registration}', 'Vendors Available', v_venue_id),
    (v_trip_id, v_day_21, 'Hotel Check In', '14:00', 'accommodation', 1, 'activity', 'planned', 'import', NULL, NULL, NULL, NULL, NULL),
    (v_trip_id, v_day_21, 'One-On-One Conversation with Dr. Danie', '18:00', 'event', 2, 'activity', 'planned', 'import', 'Dr. Nicholas Grier & Pastor Stephen J. Thurston, II', NULL, '{conversation}', NULL, v_venue_id),
    (v_trip_id, v_day_21, 'Social Event / House Party', '19:00', 'event', 3, 'activity', 'planned', 'import', NULL, NULL, '{social}', 'Vendors Available', v_venue_id),
    (v_trip_id, v_day_21, 'Dinner at Antico Posto', NULL, 'dining', 99, 'activity', 'planned', 'import', NULL, NULL, '{personal-option}', NULL, NULL);

  -- ═══════════════════════════════════════════════════════════
  -- APR 22 (WED) — DAY 2: DEEP WORK
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO itinerary_items (trip_id, day_id, title, start_time, category, sort_index, item_type, status, source, speaker, track, tags, notes, description, link, link_label, location_id) VALUES
    (v_trip_id, v_day_22, 'Continental Breakfast', '07:00', 'event', 0, 'activity', 'planned', 'import', NULL, NULL, '{meal}', 'Vendors Available', NULL, NULL, NULL, v_venue_id),
    (v_trip_id, v_day_22, 'Plenary: Shifting Toward Consistent Self-Care', '08:00', 'event', 1, 'activity', 'planned', 'import', 'Dr. Nathaniel D. West, LPC', NULL, '{plenary}', NULL, 'Reclaiming Emotional and Spiritual Well-Being for Pastors, Clergy & Chaplains', NULL, NULL, v_venue_id),
    (v_trip_id, v_day_22, 'One-On-One Conversation with Dr. Danie', '09:00', 'event', 2, 'activity', 'planned', 'import', 'Dr. Pamela Ayo Yetunde & Dr. Nisa Muhammad', NULL, '{conversation}', NULL, NULL, NULL, NULL, v_venue_id),
    (v_trip_id, v_day_22, 'Mid-Morning Break', '09:45', 'event', 3, 'activity', 'planned', 'import', NULL, NULL, '{break}', 'Vendors Available', NULL, NULL, NULL, NULL),
    -- 10:00 AM Workshops
    (v_trip_id, v_day_22, 'Joy as Resistance: Sustaining the Soul in the Struggle', '10:00', 'event', 4, 'activity', 'planned', 'import', 'Rev. Vahisha Hasan', 'A', '{workshop,track-a}', NULL, NULL, 'https://www.blackchaplainsrock.com/wednesdaysessions', 'Session details', v_venue_id),
    (v_trip_id, v_day_22, 'Spiritual Practices for Surviving and Thriving', '10:00', 'event', 5, 'activity', 'planned', 'import', 'Rev. Dr. Ebony D. Only', 'B', '{workshop,track-b}', NULL, NULL, 'https://www.blackchaplainsrock.com/wednesdaysessions', 'Session details', v_venue_id),
    (v_trip_id, v_day_22, 'Permission to Pause: Breaking the Cycle of Exhaustion in Ministry Leaders', '10:00', 'event', 6, 'activity', 'planned', 'import', 'Dr. Sherri L. Jackson, BCC', 'C', '{workshop,track-c}', NULL, NULL, 'https://www.blackchaplainsrock.com/wednesdaysessions', 'Session details', v_venue_id),
    -- 11:00 AM Workshops
    (v_trip_id, v_day_22, 'Transcendent Healing: Embodying Freedom in Ministry', '11:00', 'event', 7, 'activity', 'planned', 'import', 'Nala Simone Toussaint', 'A', '{workshop,track-a}', NULL, NULL, 'https://www.blackchaplainsrock.com/wednesdaysessions', 'Session details', v_venue_id),
    (v_trip_id, v_day_22, 'Creating Space for Mental Wellness in Our Sacred Spaces', '11:00', 'event', 8, 'activity', 'planned', 'import', 'Rev. Michael Washington, Ph.D.', 'B', '{workshop,track-b}', NULL, NULL, 'https://www.blackchaplainsrock.com/wednesdaysessions', 'Session details', v_venue_id),
    (v_trip_id, v_day_22, 'Womanist Approaches to Resistance in Healthcare Chaplaincy', '11:00', 'event', 9, 'activity', 'planned', 'import', 'Rev. Lauren Frazier-McGuin, MA, MDiv, BCC', 'C', '{workshop,track-c}', NULL, NULL, 'https://www.blackchaplainsrock.com/wednesdaysessions', 'Session details', v_venue_id),
    -- Lunch + afternoon plenary
    (v_trip_id, v_day_22, 'Lunch', '12:00', 'event', 10, 'activity', 'planned', 'import', NULL, NULL, '{meal}', 'Provided', NULL, NULL, NULL, v_venue_id),
    (v_trip_id, v_day_22, 'Plenary: Wells of Joy', '13:00', 'event', 11, 'activity', 'planned', 'import', 'Jessica Young Brown, Ph.D.', NULL, '{plenary}', NULL, NULL, NULL, NULL, v_venue_id),
    -- 2:00 PM Workshops (repeat of morning)
    (v_trip_id, v_day_22, 'Joy as Resistance: Sustaining the Soul in the Struggle', '14:00', 'event', 12, 'activity', 'planned', 'import', 'Rev. Vahisha Hasan', 'A', '{workshop,track-a}', NULL, NULL, 'https://www.blackchaplainsrock.com/wednesdaysessions', 'Session details', v_venue_id),
    (v_trip_id, v_day_22, 'Spiritual Practices for Surviving and Thriving', '14:00', 'event', 13, 'activity', 'planned', 'import', 'Rev. Dr. Ebony D. Only', 'B', '{workshop,track-b}', NULL, NULL, 'https://www.blackchaplainsrock.com/wednesdaysessions', 'Session details', v_venue_id),
    (v_trip_id, v_day_22, 'Permission to Pause: Breaking the Cycle of Exhaustion in Ministry Leaders', '14:00', 'event', 14, 'activity', 'planned', 'import', 'Dr. Sherri L. Jackson, BCC', 'C', '{workshop,track-c}', NULL, NULL, 'https://www.blackchaplainsrock.com/wednesdaysessions', 'Session details', v_venue_id),
    -- 3:10 PM Workshops (repeat of morning)
    (v_trip_id, v_day_22, 'Transcendent Healing: Embodying Freedom in Ministry', '15:10', 'event', 15, 'activity', 'planned', 'import', 'Nala Simone Toussaint', 'A', '{workshop,track-a}', NULL, NULL, 'https://www.blackchaplainsrock.com/wednesdaysessions', 'Session details', v_venue_id),
    (v_trip_id, v_day_22, 'Creating Space for Mental Wellness in Our Sacred Spaces', '15:10', 'event', 16, 'activity', 'planned', 'import', 'Rev. Dr. Michael Washington', 'B', '{workshop,track-b}', NULL, NULL, 'https://www.blackchaplainsrock.com/wednesdaysessions', 'Session details', v_venue_id),
    (v_trip_id, v_day_22, 'Womanist Approaches to Resistance in Healthcare Chaplaincy', '15:10', 'event', 17, 'activity', 'planned', 'import', 'Rev. Lauren Frazier-McGuin, MA, MDiv, BCC', 'C', '{workshop,track-c}', NULL, NULL, 'https://www.blackchaplainsrock.com/wednesdaysessions', 'Session details', v_venue_id),
    -- Seminar + Worship
    (v_trip_id, v_day_22, 'Free Seminar: Listening to Our Bodies for Real', '16:15', 'event', 18, 'activity', 'planned', 'import', 'Dr. Christophe Ringer & Rev. Jia Johnson', NULL, '{seminar}', NULL, 'Somatic and Spiritual Coaching for Chaplains', NULL, NULL, v_venue_id),
    (v_trip_id, v_day_22, 'Evening Worship', '19:00', 'event', 19, 'activity', 'planned', 'import', 'Rev. Dr. Gail Rice', NULL, '{worship}', 'Associate Pastor of Ministry Development at Freedom Baptist Church', NULL, NULL, NULL, v_venue_id),
    -- Personal options (unscheduled)
    (v_trip_id, v_day_22, 'Graue Mill Visit', NULL, 'activity', 90, 'activity', 'planned', 'import', NULL, NULL, '{personal-option}', NULL, NULL, NULL, NULL, NULL),
    (v_trip_id, v_day_22, 'Portillo''s Dinner', NULL, 'dining', 91, 'activity', 'planned', 'import', NULL, NULL, '{personal-option}', NULL, NULL, NULL, NULL, NULL);

  -- ═══════════════════════════════════════════════════════════
  -- APR 23 (THU) — DAY 3: HEALING & LEADERSHIP
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO itinerary_items (trip_id, day_id, title, start_time, category, sort_index, item_type, status, source, speaker, track, tags, notes, description, link, link_label, location_id) VALUES
    (v_trip_id, v_day_23, 'Continental Breakfast', '07:00', 'event', 0, 'activity', 'planned', 'import', NULL, NULL, '{meal}', 'Vendors Available', NULL, NULL, NULL, v_venue_id),
    (v_trip_id, v_day_23, 'Morning Worship', '08:00', 'event', 1, 'activity', 'planned', 'import', 'Rev. Dr. Ebony D. Only', NULL, '{worship}', 'Executive Pastor, Chaplain, Pastoral Care, Coach & Consultant', NULL, NULL, NULL, v_venue_id),
    (v_trip_id, v_day_23, 'One-On-One Conversation with Dr. Danie', '09:00', 'event', 2, 'activity', 'planned', 'import', 'Dr. Candace M. Lewis & Dr. Lee H. Butler, Jr.', NULL, '{conversation}', NULL, NULL, NULL, NULL, v_venue_id),
    (v_trip_id, v_day_23, 'Mid-Morning Break', '09:45', 'event', 3, 'activity', 'planned', 'import', NULL, NULL, '{break}', NULL, NULL, NULL, NULL, NULL),
    -- 10:00 AM Workshops
    (v_trip_id, v_day_23, 'Legal Issues in Sacred Spaces', '10:00', 'event', 4, 'activity', 'planned', 'import', 'Natasha L. Robinson, JD', 'A', '{workshop,track-a}', NULL, NULL, 'https://www.blackchaplainsrock.com/thursdaysessions', 'Session details', v_venue_id),
    (v_trip_id, v_day_23, 'Ministry in the Mirror: Healing the Hidden Burdens of Shame and Imposter Syndrome', '10:00', 'event', 5, 'activity', 'planned', 'import', 'Rev. Annettra Jones', 'B', '{workshop,track-b}', NULL, NULL, 'https://www.blackchaplainsrock.com/thursdaysessions', 'Session details', v_venue_id),
    (v_trip_id, v_day_23, 'Pediatric Chaplaincy', '10:00', 'event', 6, 'activity', 'planned', 'import', 'Rev. Dr. Christal L. Bell, D.Min', 'C', '{workshop,track-c}', NULL, NULL, 'https://www.blackchaplainsrock.com/thursdaysessions', 'Session details', v_venue_id),
    -- Break + Plenary
    (v_trip_id, v_day_23, 'Mid-Morning Break', '11:00', 'event', 7, 'activity', 'planned', 'import', NULL, NULL, '{break}', 'Vendors Available', NULL, NULL, NULL, NULL),
    (v_trip_id, v_day_23, 'Plenary: The Entanglement', '11:15', 'event', 8, 'activity', 'planned', 'import', 'Rev. Dr. Wm. Marcus Small', NULL, '{plenary}', NULL, 'The Complexities of Self-Care for the Caregiver', NULL, NULL, v_venue_id),
    (v_trip_id, v_day_23, 'Lunch', '12:15', 'event', 9, 'activity', 'planned', 'import', NULL, NULL, '{meal}', 'Provided. Vendors Available.', NULL, NULL, NULL, v_venue_id),
    -- 1:30 PM Workshops
    (v_trip_id, v_day_23, 'Spiritual Entrepreneurship: C.R.E.A.M.', '13:30', 'event', 10, 'activity', 'planned', 'import', 'Dr. Danie J. Buhuro', 'A', '{workshop,track-a}', NULL, 'Cash Rules Everything Around Me', 'https://www.blackchaplainsrock.com/thursdaysessions', 'Session details', v_venue_id),
    (v_trip_id, v_day_23, 'Clergy Boundary Training', '13:30', 'event', 11, 'activity', 'planned', 'import', 'Rev. Dr. Irie Lynne Session', 'B', '{workshop,track-b}', 'Certificate of Completion provided', NULL, 'https://www.blackchaplainsrock.com/thursdaysessions', 'Session details', v_venue_id),
    (v_trip_id, v_day_23, 'Grief and Loss', '13:30', 'event', 12, 'activity', 'planned', 'import', 'Rev. Dr. Jamie Eaddy', 'C', '{workshop,track-c}', NULL, NULL, 'https://www.blackchaplainsrock.com/thursdaysessions', 'Session details', v_venue_id),
    -- 2:45 PM Workshops (repeat)
    (v_trip_id, v_day_23, 'Spiritual Entrepreneurship: C.R.E.A.M.', '14:45', 'event', 13, 'activity', 'planned', 'import', 'Dr. Danie J. Buhuro', 'A', '{workshop,track-a}', NULL, 'Cash Rules Everything Around Me', 'https://www.blackchaplainsrock.com/thursdaysessions', 'Session details', v_venue_id),
    (v_trip_id, v_day_23, 'Clergy Boundary Training', '14:45', 'event', 14, 'activity', 'planned', 'import', 'Rev. Dr. Irie Lynne Session', 'B', '{workshop,track-b}', 'Certificate of Completion provided', NULL, 'https://www.blackchaplainsrock.com/thursdaysessions', 'Session details', v_venue_id),
    (v_trip_id, v_day_23, 'Grief and Loss', '14:45', 'event', 15, 'activity', 'planned', 'import', 'Rev. Dr. Jamie Eaddy', 'C', '{workshop,track-c}', NULL, NULL, 'https://www.blackchaplainsrock.com/thursdaysessions', 'Session details', v_venue_id),
    -- Seminar + Worship
    (v_trip_id, v_day_23, 'Free Seminar: Sacred Ego — Power, Control, and Unchecked Authority', '16:15', 'event', 16, 'activity', 'planned', 'import', 'Pastor Elise Saulsberry', NULL, '{seminar}', NULL, NULL, NULL, NULL, v_venue_id),
    (v_trip_id, v_day_23, 'Evening Worship', '18:30', 'event', 17, 'activity', 'planned', 'import', 'Rev. Dr. Reginald Williams Jr.', NULL, '{worship}', 'Senior Pastor of First Baptist Church of University Park', NULL, NULL, NULL, v_venue_id),
    -- Personal options (unscheduled)
    (v_trip_id, v_day_23, 'Downtown Chicago Afternoon', NULL, 'activity', 90, 'activity', 'planned', 'import', NULL, NULL, '{personal-option}', NULL, NULL, NULL, NULL, NULL),
    (v_trip_id, v_day_23, 'Art Institute of Chicago', NULL, 'activity', 91, 'activity', 'planned', 'import', NULL, NULL, '{personal-option}', NULL, NULL, NULL, NULL, NULL),
    (v_trip_id, v_day_23, 'Art on theMART', NULL, 'activity', 92, 'activity', 'planned', 'import', NULL, NULL, '{personal-option}', NULL, NULL, NULL, NULL, NULL);

  -- ═══════════════════════════════════════════════════════════
  -- APR 24 (FRI) — DAY 4: CLOSING
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO itinerary_items (trip_id, day_id, title, start_time, category, sort_index, item_type, status, source, speaker, track, tags, notes, description, link, link_label, location_id) VALUES
    (v_trip_id, v_day_24, 'Continental Breakfast', '07:30', 'event', 0, 'activity', 'planned', 'import', NULL, NULL, '{meal}', 'Vendors Available', NULL, NULL, NULL, v_venue_id),
    (v_trip_id, v_day_24, 'Plenary: Leading While Bleeding and Healing at the Same Time', '08:30', 'event', 1, 'activity', 'planned', 'import', 'Bishop Dr. Vanessa M. Brown', NULL, '{plenary}', NULL, NULL, 'https://www.blackchaplainsrock.com/fridaysessions', 'Session details', v_venue_id),
    (v_trip_id, v_day_24, 'Sankofa Address', '09:30', 'event', 2, 'activity', 'planned', 'import', 'Dr. Danie J. Buhuro', NULL, '{plenary,keynote}', NULL, NULL, NULL, NULL, v_venue_id),
    (v_trip_id, v_day_24, 'Conclusion / Departure', '10:45', 'event', 3, 'activity', 'planned', 'import', NULL, NULL, '{closing}', NULL, NULL, NULL, NULL, v_venue_id),
    -- Personal options (unscheduled)
    (v_trip_id, v_day_24, 'DuSable Black History Museum', NULL, 'activity', 90, 'activity', 'planned', 'import', NULL, NULL, '{personal-option}', NULL, NULL, NULL, NULL, NULL),
    (v_trip_id, v_day_24, 'Bronzeville Walk', NULL, 'activity', 91, 'activity', 'planned', 'import', NULL, NULL, '{personal-option}', NULL, NULL, NULL, NULL, NULL),
    (v_trip_id, v_day_24, 'Conference Farewell Dinner', NULL, 'dining', 92, 'activity', 'planned', 'import', NULL, NULL, '{personal-option}', NULL, NULL, NULL, NULL, NULL);

  -- ═══════════════════════════════════════════════════════════
  -- ADD SPEAKERS AS CONTACTS (skip duplicates by name)
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO family_contacts (name, organization, met_context, category, trip_id)
  SELECT v.name, v.organization, v.met_context, 'connection', v_trip_id
  FROM (VALUES
    ('Dr. Danie J. Buhuro', 'Sankofa CPE Center', 'Conference organizer & presenter — Spiritual Entrepreneurship, Sankofa Address'),
    ('Dr. Nicholas Grier', NULL, 'One-On-One Conversation with Dr. Danie (Tue)'),
    ('Pastor Stephen J. Thurston, II', NULL, 'One-On-One Conversation with Dr. Danie (Tue)'),
    ('Rev. Vahisha Hasan', NULL, 'Workshop: Joy as Resistance (Wed)'),
    ('Rev. Dr. Ebony D. Only', 'Executive Pastor, Chaplain, Coach & Consultant', 'Workshop: Spiritual Practices + Thursday Worship'),
    ('Dr. Sherri L. Jackson, BCC', NULL, 'Workshop: Permission to Pause (Wed)'),
    ('Nala Simone Toussaint', NULL, 'Workshop: Transcendent Healing (Wed)'),
    ('Rev. Michael Washington, Ph.D.', NULL, 'Workshop: Creating Space for Mental Wellness (Wed)'),
    ('Rev. Lauren Frazier-McGuin, MA, MDiv, BCC', NULL, 'Workshop: Womanist Approaches to Resistance (Wed)'),
    ('Jessica Young Brown, Ph.D.', NULL, 'Plenary: Wells of Joy (Wed)'),
    ('Dr. Christophe Ringer', NULL, 'Seminar: Listening to Our Bodies for Real (Wed)'),
    ('Rev. Jia Johnson', NULL, 'Seminar: Listening to Our Bodies for Real (Wed)'),
    ('Rev. Dr. Gail Rice', 'Associate Pastor, Freedom Baptist Church', 'Evening Worship (Wed)'),
    ('Dr. Candace M. Lewis', NULL, 'One-On-One Conversation with Dr. Danie (Thu)'),
    ('Dr. Lee H. Butler, Jr.', NULL, 'One-On-One Conversation with Dr. Danie (Thu)'),
    ('Natasha L. Robinson, JD', NULL, 'Workshop: Legal Issues in Sacred Spaces (Thu)'),
    ('Rev. Annettra Jones', NULL, 'Workshop: Ministry in the Mirror (Thu)'),
    ('Rev. Dr. Christal L. Bell, D.Min', NULL, 'Workshop: Pediatric Chaplaincy (Thu)'),
    ('Rev. Dr. Wm. Marcus Small', NULL, 'Plenary: The Entanglement (Thu)'),
    ('Rev. Dr. Irie Lynne Session', NULL, 'Workshop: Clergy Boundary Training (Thu)'),
    ('Rev. Dr. Jamie Eaddy', NULL, 'Workshop: Grief and Loss (Thu)'),
    ('Pastor Elise Saulsberry', NULL, 'Seminar: Sacred Ego (Thu)'),
    ('Rev. Dr. Reginald Williams Jr.', 'Senior Pastor, First Baptist Church of University Park', 'Evening Worship (Thu)'),
    ('Bishop Dr. Vanessa M. Brown', NULL, 'Plenary: Leading While Bleeding (Fri)')
  ) AS v(name, organization, met_context)
  WHERE NOT EXISTS (
    SELECT 1 FROM family_contacts fc
    WHERE fc.trip_id = v_trip_id AND fc.name = v.name
  );

  RAISE NOTICE 'Done! Run: SELECT count(*) FROM itinerary_items WHERE trip_id = ''%'' to verify.', v_trip_id;
END $$;

COMMIT;
