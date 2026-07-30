-- ============================================================================
-- Charleston 2026 — "Charleston, all of us"
-- New trip, parallel to Sankofa 2026. ADDITIVE ONLY.
--
-- Project ref : ckjcieeccopqowlfljja   (resolved from .mcp.json)
-- Source      : .planning/charleston-2026-itinerary.html
-- Audit        : .planning/CHARLESTON-2026-AUDIT.md  (read this first)
-- Batch slug  : charleston-2026-itinerary   (in external_ref, NOT source —
--               source has a CHECK constraint; see audit §2)
--
-- SAFETY CONTRACT
--   * No UPDATE. No DELETE. No TRUNCATE. No ALTER. Zero exceptions.
--   * Every INSERT names its own fixed UUID + ON CONFLICT (id) DO NOTHING,
--     so this file is re-runnable and can never modify a row it didn't create.
--   * The Sankofa trip id appears exactly twice below, both inside a read-only
--     COUNT(*) proof. It is never in the predicate of a write.
--   * Runs in one transaction. The final SELECT prints Sankofa's row counts
--     before vs after; every delta must read 0. If any delta is non-zero,
--     ROLLBACK instead of COMMIT.
--
-- CHECK-CONSTRAINT COMPLIANCE (the 2026-04-24 landmine)
--   item_type ∈ ('activity','marker')          — nothing else
--   source    ∈ ('manual','import')            — nothing else
--   status    ∈ ('planned','done','skipped')   — nothing else
--   category  = free TEXT (no constraint) — carries all the real meaning
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. PROOF, part 1 — snapshot Sankofa before touching anything (read-only)
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS sankofa_before;
CREATE TEMP TABLE sankofa_before AS
SELECT 'trips'            AS tbl, count(*) AS n FROM trips           WHERE id      = 'cb6f65f0-b34b-467a-a206-051cc8914db0'
UNION ALL SELECT 'itinerary_days',  count(*) FROM itinerary_days     WHERE trip_id = 'cb6f65f0-b34b-467a-a206-051cc8914db0'
UNION ALL SELECT 'itinerary_items', count(*) FROM itinerary_items    WHERE trip_id = 'cb6f65f0-b34b-467a-a206-051cc8914db0'
UNION ALL SELECT 'locations',       count(*) FROM locations          WHERE trip_id = 'cb6f65f0-b34b-467a-a206-051cc8914db0'
UNION ALL SELECT 'memories',        count(*) FROM memories           WHERE trip_id = 'cb6f65f0-b34b-467a-a206-051cc8914db0'
UNION ALL SELECT 'family_contacts', count(*) FROM family_contacts    WHERE trip_id = 'cb6f65f0-b34b-467a-a206-051cc8914db0'
UNION ALL SELECT 'share_links',     count(*) FROM trip_share_links   WHERE trip_id = 'cb6f65f0-b34b-467a-a206-051cc8914db0'
UNION ALL SELECT 'location_days',   count(*) FROM location_days ld
                                    JOIN itinerary_days d ON d.id = ld.day_id
                                    WHERE d.trip_id = 'cb6f65f0-b34b-467a-a206-051cc8914db0';

-- ---------------------------------------------------------------------------
-- 1. THE TRIP
--    metadata uses the namespaced pattern the column comment invites:
--    travel / lodging / party / anchors / constraints.
-- ---------------------------------------------------------------------------
INSERT INTO trips (id, title, location_name, start_date, end_date, timezone, metadata) VALUES (
  'c4a71e00-8a3f-4b21-9d55-3c17e0aa2026',
  'Charleston, all of us',
  'Charleston, SC — West Ashley',
  '2026-08-14',
  '2026-08-21',
  'America/New_York',
  jsonb_build_object(
    'travel', jsonb_build_object(
      'outbound', jsonb_build_object(
        'flight','UA 2355','route','EWR → CHS','date','2026-08-14',
        'depart','07:00','arrive','09:13'),
      'return', jsonb_build_object(
        'flight','UA 674','route','CHS → EWR','date','2026-08-21',
        'depart','11:10','arrive','13:06',
        'note','Leave Pinebark Lane by 9:00a — 17 people through a stroller-and-carseat TSA line.')
    ),
    'lodging', jsonb_build_object(
      'base','1558 S Pinebark Ln, West Ashley, Charleston, SC',
      'nights',7,
      'amenities', jsonb_build_array('pool','kitchen','yard'),
      'note','Pool time is built into the afternoon after every busy morning — Days 3, 4, 6, 7.'
    ),
    'party', jsonb_build_object(
      'adults',12,'kids',5,'kid_ages','4–7','total',17,
      'households', jsonb_build_array(
        jsonb_build_object('label','Household 1','who','Your family','count','4 adults · kids 7 & 4'),
        jsonb_build_object('label','Household 2','who','Brother & wife','count','2 adults · 2 kids, similar ages'),
        jsonb_build_object('label','Household 3','who','Brother & fiancée','count','2 adults · her son, similar age'),
        jsonb_build_object('label','The elders','who','Mom, stepdad, aunt & uncle','count','4 adults, comfortably mobile')
      )
    ),
    'anchors', jsonb_build_array(
      jsonb_build_object('day','2026-08-15','what','Pirates of Charleston',
        'why','Already booked by Mom. Nothing to plan, nothing to move.'),
      jsonb_build_object('day','2026-08-20','what','The send-off dinner',
        'why','Shawn & Dan cooking for all 17. Afternoon stays clear so the kitchen isn''t racing the clock.')
    ),
    'constraints', jsonb_build_array(
      'Radius ≤40 min from base — Awendaw (the aviary) is the one deliberate exception.',
      'Center for Birds of Prey opens Thu–Sat 10–4 only; tour + flight demo at 10:30. That is why it lands Day 7.',
      'Splash Zone at James Island County Park closes for the season Aug 9 — before arrival. Do not chase it.',
      'Magnolia''s wildlife boat tour was listed closed for the season; gardens, petting zoo and tram are the reliable plan.',
      'Middleton''s trail ride requires riders 8+ on their own horse — Day 6 splits by age, not by household.',
      'Most Charleston restaurants cap online booking at 8–10. Call ahead for a table of 17.'
    ),
    'source', jsonb_build_object(
      'document','.planning/charleston-2026-itinerary.html',
      'ingested','2026-07-29',
      'batch','charleston-2026-itinerary')
  )
) ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. THE EIGHT DAYS  (titles are the source's own day names)
-- ---------------------------------------------------------------------------
INSERT INTO itinerary_days (id, trip_id, date, title, sort_index) VALUES
  ('c4a71e00-d001-4a00-8000-000000000001','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','2026-08-14','Landing',1),
  ('c4a71e00-d001-4a00-8000-000000000002','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','2026-08-15','Pirates of Charleston',2),
  ('c4a71e00-d001-4a00-8000-000000000003','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','2026-08-16','Downtown & the Fountain',3),
  ('c4a71e00-d001-4a00-8000-000000000004','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','2026-08-17','Folly Beach',4),
  ('c4a71e00-d001-4a00-8000-000000000005','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','2026-08-18','The Easy Day',5),
  ('c4a71e00-d001-4a00-8000-000000000006','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','2026-08-19','Horses & the Angel Oak',6),
  ('c4a71e00-d001-4a00-8000-000000000007','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','2026-08-20','The Aviary, then the Send-Off',7),
  ('c4a71e00-d001-4a00-8000-000000000008','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','2026-08-21','Departure',8)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. LOCATIONS — 37 venues. Coordinates are Nominatim hits that survived a
--    reverse-geocode check. Five rows carry an address with lat/lng NULL
--    because the lookup could not be trusted (audit §6/§7) — they render in
--    lists and open in Maps by name, they just don't draw a pin.
--    `notes` follows the April convention: subcategory · neighbourhood · hook.
-- ---------------------------------------------------------------------------
INSERT INTO locations (id, trip_id, name, category, address, lat, lng, phone, url, notes) VALUES
-- base & logistics
('c4a71e00-1000-4a00-8000-000000000001','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Pinebark Lane — the house','accommodation','1558 S Pinebark Ln, West Ashley, Charleston, SC',32.8145381,-80.0134206,NULL,NULL,'Base · West Ashley · Home for seven nights. Pool, kitchen, yard — the afternoon retreat after every busy morning.'),
('c4a71e00-1000-4a00-8000-000000000002','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Charleston International Airport (CHS)','transport','5500 International Blvd, North Charleston, SC',32.8992985,-80.0394650,NULL,NULL,'Transport · North Charleston · In on UA 2355, out on UA 674.'),
('c4a71e00-1000-4a00-8000-000000000003','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Publix — Sam Rittenberg','activity','Sam Rittenberg Blvd, Charleston, SC',32.8146548,-79.9952910,NULL,NULL,'Groceries · West Ashley · Closest big provisioning run to Pinebark Lane. Seventeen people eat a lot.'),
('c4a71e00-1000-4a00-8000-000000000004','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','West Ashley Bikeway','activity','West Ashley Bikeway, Charleston, SC',32.7902360,-80.0100880,NULL,NULL,'Walk · West Ashley · Two minutes from the house — the unstructured-morning option.'),
-- anchors & attractions
('c4a71e00-1000-4a00-8000-000000000005','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Pirates of Charleston — the Black Ghost','event',NULL,NULL,NULL,NULL,'https://www.piratesofcharleston.com/','ANCHOR · downtown marina · Mom already booked it. Every kid sworn in as crew: water cannons, treasure hunt, sword battle with Sneaky Pete. NO ADDRESS IN SOURCE — confirm the departure dock with Mom.'),
('c4a71e00-1000-4a00-8000-000000000006','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','South Carolina Aquarium','activity','100 Aquarium Wharf, Charleston, SC',32.7910697,-79.9254807,NULL,'https://scaquarium.org/','Attraction · downtown waterfront · Open 9–5, last entry 3:30. Zucker Family Sea Turtle Recovery is the thing the kids will still be talking about at the send-off. Book timed entry for all 17 in advance — weekends sell out.'),
('c4a71e00-1000-4a00-8000-000000000007','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Waterfront Park & the Pineapple Fountain','activity','Vendue Range, Charleston, SC',32.7788542,-79.9256069,NULL,NULL,'Park · downtown · Five-minute walk from the aquarium. Wading in the fountain is allowed and expected; second splash fountain too. Bring towels and a change of clothes.'),
('c4a71e00-1000-4a00-8000-000000000008','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','The Battery / White Point Garden','activity','White Point Garden, Charleston, SC',32.7698140,-79.9303481,NULL,NULL,'Walk · downtown south end · For whoever still has legs after the fountain.'),
('c4a71e00-1000-4a00-8000-000000000009','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Folly Beach','beach','Folly Beach, SC',32.6549715,-79.9396423,NULL,NULL,'Beach · Folly · The closest real beach to Pinebark Lane, ~20–25 min via Folly Rd. Wide sand, gentle surf, easy for a group this size. Bring shade for the littlest kids and the grandparents both.'),
('c4a71e00-1000-4a00-8000-000000000010','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Children''s Museum of the Lowcountry','activity','25 Ann St, Charleston, SC',32.7891769,-79.9375054,NULL,'https://explorecml.org/','Attraction · downtown · ~20 min from base. Pirate ship, working splash pad, art studio, STEM lab — built for exactly the 4-to-7 range. This is also the rain plan.'),
('c4a71e00-1000-4a00-8000-000000000011','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Middleton Place','activity','4300 Ashley River Rd, Charleston, SC',NULL,NULL,NULL,'https://www.middletonplace.org/','Attraction · Ashley River Road · ~20–25 min from base. COORDS UNVERIFIED — Nominatim resolved to a downtown street of the same name; pin deliberately omitted.'),
('c4a71e00-1000-4a00-8000-000000000012','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Middleton Place Equestrian Center','activity','4300 Ashley River Rd, Charleston, SC',NULL,NULL,NULL,'https://www.middletonplace.org/','Activity · Ashley River Road · Guided trail ride along the Ashley River, about an hour, one rider to one horse. RIDERS 8+ ONLY. COORDS UNVERIFIED — no Nominatim record; sits inside Middleton Place.'),
('c4a71e00-1000-4a00-8000-000000000013','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Magnolia Plantation & Gardens','activity','3550 Ashley River Rd, Charleston, SC',32.8746113,-80.0832425,NULL,'https://www.magnoliaplantation.com/','Attraction · Ashley River Road · Petting zoo (goats, whitetail deer), gardens and the nature tram, all on general admission. Peacock Cafe on the grounds is where the age-split reunites for lunch. The wildlife boat tour was listed closed for the season — treat it as a bonus.'),
('c4a71e00-1000-4a00-8000-000000000014','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','The Angel Oak','activity','3688 Angel Oak Rd, Johns Island, SC',32.7170450,-80.0804039,NULL,NULL,'Attraction · Johns Island · Free, and a genuinely easy ten-minute stop. A 400-year-old live oak with limbs that touch the ground. Good for restless legs after a morning of standing around gardens.'),
('c4a71e00-1000-4a00-8000-000000000015','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Center for Birds of Prey','activity','4719 Hwy 17 N, Awendaw, SC',NULL,NULL,NULL,'https://thecenterforbirdsofprey.org/','Attraction · Awendaw · THU–SAT ONLY, 10–4; guided tour + flight demonstration at 10:30. The one exception to the 40-minute rule (~40–45 min). COORDS UNVERIFIED — best hit was a Hwy 17 street segment several km off; pin deliberately omitted.'),
-- seafood for the send-off
('c4a71e00-1000-4a00-8000-000000000016','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','CudaCo Seafood House','dining','765 Folly Rd, Charleston, SC',32.7419381,-79.9679513,NULL,NULL,'Seafood market · James Island · Pin 17. Close to base, known for what''s actually fresh that day. Send-off dinner supply run.'),
('c4a71e00-1000-4a00-8000-000000000017','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Crosby''s Fish & Shrimp Co.','dining','2223 Folly Rd, Charleston, SC',32.6733794,-79.9489372,NULL,NULL,'Seafood market · Folly Rd · Pin 18. Open daily 6–6. The other send-off supply option.'),
-- the eating list — kid-friendly / full group
('c4a71e00-1000-4a00-8000-000000000018','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Fleet Landing Restaurant & Raw Bar','dining','186 Concord St, Charleston, SC',32.7803578,-79.9249765,NULL,NULL,'Dining · downtown waterfront · Pin 4. Dockside seafood with a real kids'' menu — and you''re already near the marina after the pirate cruise, so nobody drives far with overtired kids.'),
('c4a71e00-1000-4a00-8000-000000000019','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Taco Boy','dining','217 Huger St, Charleston, SC',32.8032038,-79.9413841,NULL,NULL,'Dining · Huger St, downtown · Pin 5. A real kids'' menu — tacos, burritos, quesadillas.'),
('c4a71e00-1000-4a00-8000-000000000020','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Garage 75','dining','75 Folly Rd, Charleston, SC',32.7772250,-79.9733500,NULL,NULL,'Dining · James Island · Pin 16. Arcade games and big screens buy you an extra twenty minutes of adult conversation. Steaks and burgers, not just kid food.'),
('c4a71e00-1000-4a00-8000-000000000021','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Holy City Brewing','dining','4155 Dorchester Rd, North Charleston, SC',32.8718762,-79.9785144,NULL,NULL,'Dining · North Charleston · Pin 21. A genuine play area — basketball net, full-size Jenga — alongside a real beer list for the adults.'),
('c4a71e00-1000-4a00-8000-000000000022','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','EVO Pizzeria','dining','1075 E Montague Ave, North Charleston, SC',32.8813957,-79.9769401,NULL,NULL,'Dining · Park Circle, North Charleston · Pin 20. Voted #1 pizza in South Carolina. A little further out — worth a dedicated pizza night rather than a drive-by.'),
-- close to base
('c4a71e00-1000-4a00-8000-000000000023','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Mellow Mushroom','dining','19 Magnolia Rd, Charleston, SC',32.7825454,-79.9863552,NULL,NULL,'Dining · West Ashley · Pin 1. The no-debate option when everyone''s tired and nobody wants to drive.'),
('c4a71e00-1000-4a00-8000-000000000024','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Famulari''s Pizzeria','dining','1704 Ashley River Rd, Charleston, SC',32.8269348,-80.0392770,NULL,NULL,'Dining / delivery · West Ashley · Pin 2. Old-school, family-run, minutes from base — and it delivers, which makes it the easiest call for a night nobody wants to leave the house.'),
('c4a71e00-1000-4a00-8000-000000000025','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Paisano''s Pizza Grill','dining','West Ashley, Charleston, SC',NULL,NULL,NULL,NULL,'Delivery · West Ashley · Pin 3. Pizza, wings and salads via Uber Eats, ordered from the couch. Good for a Tuesday-easy-day dinner. COORDS UNVERIFIED — only the Mount Pleasant branch is indexed; pin deliberately omitted.'),
-- date night
('c4a71e00-1000-4a00-8000-000000000026','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Chez Nous','dining','6 Payne Ct, Charleston, SC',32.7917393,-79.9432121,NULL,NULL,'Date night · downtown · Pin 6. Tiny, candlelit, set in an antebellum house — the most intimate option on the list. Reserve early.'),
('c4a71e00-1000-4a00-8000-000000000027','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Sorelle','dining','88 Broad St, Charleston, SC',32.7765281,-79.9317118,NULL,NULL,'Date night · Broad St, downtown · Pin 7. Wood-fired Italian; ask for the Romeo & Juliet balcony over Broad Street.'),
('c4a71e00-1000-4a00-8000-000000000028','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','FIG','dining','232 Meeting St, Charleston, SC',32.7824112,-79.9316170,NULL,NULL,'Date night · Meeting St, downtown · Pin 8. A neighbourhood restaurant in the best sense — quietly excellent, not trying to be an event.'),
('c4a71e00-1000-4a00-8000-000000000029','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Charleston Grill','dining','205 Meeting St, Charleston, SC',32.7812597,-79.9329796,NULL,NULL,'Date night · French Quarter · Pin 9. Live jazz, candlelight, a seafood-forward menu built for a slow night.'),
('c4a71e00-1000-4a00-8000-000000000030','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Husk','dining','76 Queen St, Charleston, SC',32.7780172,-79.9321415,NULL,NULL,'Date night · Queen St, downtown · Pin 10. Heirloom Southern ingredients, and a menu that changes with what''s actually in season.'),
-- sweets
('c4a71e00-1000-4a00-8000-000000000031','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Jeni''s Splendid Ice Creams','dining','King St, Charleston, SC',32.7900770,-79.9393301,NULL,NULL,'Sweets · King St · Pin 11. A kid-size vanilla honey is the move — not too sweet, genuinely good.'),
('c4a71e00-1000-4a00-8000-000000000032','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Kaminsky''s Dessert Café','dining','78 N Market St, Charleston, SC',32.7810641,-79.9299856,NULL,NULL,'Sweets · Market St · Pin 12. Sundaes and milkshakes for the kids, cocktails and cake for everyone else at the same table.'),
('c4a71e00-1000-4a00-8000-000000000033','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Christophe Artisan Chocolatier','dining','90 Society St, Charleston, SC',32.7833541,-79.9339504,NULL,NULL,'Sweets · downtown · Pin 13. Hand-painted chocolates and an almond croissant worth the detour — a grown-up sweet stop while the kids get their pops.'),
('c4a71e00-1000-4a00-8000-000000000034','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Sugar Bakeshop','dining','59 1/2 Cannon St, Charleston, SC',32.7902467,-79.9443364,NULL,NULL,'Sweets · downtown · Pin 14. Small-batch cupcakes since 2007 — vanilla blueberry, lime curd coconut. A short stop, not a whole outing.'),
('c4a71e00-1000-4a00-8000-000000000035','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Carmella''s Cafe & Dessert Bar','dining','198 East Bay St, Charleston, SC',32.7801964,-79.9270135,NULL,NULL,'Sweets · East Bay St · Pin 15. Miniature cakes in a pale-pink building — the key lime tart is the one to order.'),
-- Folly Beach lunch
('c4a71e00-1000-4a00-8000-000000000036','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Chico Feo','dining','122 E Ashley Ave, Folly Beach, SC',32.6557789,-79.9402464,NULL,NULL,'Dining · Folly Beach · Pin 19. Steps from the sand, casual enough for sandy feet and cranky four-year-olds.'),
('c4a71e00-1000-4a00-8000-000000000037','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','Loggerhead''s Beach Grill','dining','Center St, Folly Beach, SC',32.6551995,-79.9406733,NULL,NULL,'Dining · Folly Beach · The other beach-lunch option, steps from the sand.')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. ITINERARY ITEMS — 31 day blocks.
--    The 21-pin eating list is NOT here: it lives in `locations` (map pins)
--    and in the Trip Guide "Where to Eat" arrays. Only the meals the source
--    actually slots into a day get an item.
--
--    item_type: 'activity' for everything the group does; 'marker' for the
--    three non-doing notes (the age-split header, the Splash Zone warning,
--    the departure flight callout) — the only other value the CHECK allows.
-- ---------------------------------------------------------------------------
INSERT INTO itinerary_items
  (id, trip_id, day_id, title, description, start_time, end_time, category,
   item_type, location_id, source, external_ref, sort_index, status, notes, tags) VALUES

-- ─── DAY 1 · Fri Aug 14 — Landing ─────────────────────────────────────────
('c4a71e00-2000-4a00-8000-000000000001','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000001',
 'Flight in — UA 2355','Lands CHS 9:13a. By the time bags are collected and everyone''s back to Pinebark Lane it''s already midday — no rush, nothing else on the books this morning.',
 '07:00','09:13','transport','activity','c4a71e00-1000-4a00-8000-000000000002','manual','charleston-2026-itinerary',1,'planned',
 'EWR → CHS.',ARRAY['flight','travel','morning']),

('c4a71e00-2000-4a00-8000-000000000002','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000001',
 'Unpack, provision the kitchen','Seventeen people eat a lot — do the big grocery run today so the house is stocked before the week''s momentum starts. A Publix or Harris Teeter off Sam Rittenberg is closest to Pinebark Lane.',
 NULL,NULL,'activity','activity','c4a71e00-1000-4a00-8000-000000000003','manual','charleston-2026-itinerary',2,'planned',
 NULL,ARRAY['afternoon','logistics']),

('c4a71e00-2000-4a00-8000-000000000003','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000001',
 'Low-key dinner, no reservation required','Keep night one simple — order in, or grill at the house. Save the first real outing for tomorrow, once the littlest travelers have slept.',
 NULL,NULL,'dining','activity','c4a71e00-1000-4a00-8000-000000000001','manual','charleston-2026-itinerary',3,'planned',
 NULL,ARRAY['evening','at-the-house']),

('c4a71e00-2000-4a00-8000-000000000004','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000001',
 'Optional — stroll at Waterfront Park','If anyone''s still got legs after bedtime routines.',
 NULL,NULL,'activity','activity','c4a71e00-1000-4a00-8000-000000000007','manual','charleston-2026-itinerary',4,'planned',
 'Optional.',ARRAY['evening','optional']),

-- ─── DAY 2 · Sat Aug 15 — Pirates of Charleston (ANCHOR) ──────────────────
('c4a71e00-2000-4a00-8000-000000000005','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000002',
 'Slow start on purpose','Keep the morning unstructured — a backyard hour, a walk on the West Ashley Bikeway two minutes from the house. Everybody''s saving energy for the boat.',
 NULL,NULL,'activity','activity','c4a71e00-1000-4a00-8000-000000000004','manual','charleston-2026-itinerary',1,'planned',
 NULL,ARRAY['morning','unstructured']),

('c4a71e00-2000-4a00-8000-000000000006','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000002',
 '⚓ Pirates of Charleston — the Black Ghost','Already arranged — nothing to plan. Every kid is sworn in as crew: water cannons, a treasure hunt, maps to read, and a sword battle with Sneaky Pete. This afternoon is covered.',
 NULL,NULL,'event','activity','c4a71e00-1000-4a00-8000-000000000005','manual','charleston-2026-itinerary',2,'planned',
 'PROTECTED ANCHOR — Mom already booked this. Do not move it, do not schedule against it. The whole week is built around this and the Thursday send-off dinner.',
 ARRAY['anchor','protected','booked','midday','kids']),

('c4a71e00-2000-4a00-8000-000000000007','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000002',
 'Fleet Landing Restaurant & Raw Bar','Dockside, kid menu, and you''re already near the marina after the cruise — nobody has to drive far with overtired kids.',
 NULL,NULL,'dining','activity','c4a71e00-1000-4a00-8000-000000000018','manual','charleston-2026-itinerary',3,'planned',
 'Table of 17 — call ahead.',ARRAY['evening','kid-friendly']),

-- ─── DAY 3 · Sun Aug 16 — Downtown & the Fountain ─────────────────────────
('c4a71e00-2000-4a00-8000-000000000008','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000003',
 'South Carolina Aquarium','Book timed entry online for the full group in advance — weekends sell out. The Zucker Family Sea Turtle Recovery is the thing the kids will talk about at the finale dinner.',
 '09:00',NULL,'activity','activity','c4a71e00-1000-4a00-8000-000000000006','manual','charleston-2026-itinerary',1,'planned',
 'Open 9–5, last entry 3:30. TIMED ENTRY FOR 17 — book before you go.',ARRAY['morning','kids','booking-required']),

('c4a71e00-2000-4a00-8000-000000000009','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000003',
 'Waterfront Park & the Pineapple Fountain','A five-minute walk from the aquarium. Wading in the fountain is allowed and expected; there''s a second splash fountain too. Bring a towel and a change of clothes for the little ones.',
 NULL,NULL,'activity','activity','c4a71e00-1000-4a00-8000-000000000007','manual','charleston-2026-itinerary',2,'planned',
 NULL,ARRAY['midday','kids','water']),

('c4a71e00-2000-4a00-8000-000000000010','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000003',
 'Jeni''s or King of Pops, then the Battery for whoever has legs left','Everyone else heads back to Pinebark Lane for pool time and naps — a downtown morning is plenty for one day.',
 NULL,NULL,'dining','activity','c4a71e00-1000-4a00-8000-000000000031','manual','charleston-2026-itinerary',3,'planned',
 'King of Pops is a roaming cart — catch it wherever the day already has you.',ARRAY['afternoon','sweets','optional']),

('c4a71e00-2000-4a00-8000-000000000011','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000003',
 'Pool time & naps back at the house','The built-in afternoon retreat rather than a second downtown outing.',
 NULL,NULL,'activity','activity','c4a71e00-1000-4a00-8000-000000000001','manual','charleston-2026-itinerary',4,'planned',
 NULL,ARRAY['afternoon','pool-time','at-the-house']),

('c4a71e00-2000-4a00-8000-000000000012','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000003',
 'First parents'' night out — Chez Nous or FIG','With the grandparent generation on kid duty, this is a natural night for a couple or two to slip off. Chez Nous (tiny, candlelit, antebellum house) or FIG both reward an early reservation.',
 NULL,NULL,'dining','activity','c4a71e00-1000-4a00-8000-000000000026','manual','charleston-2026-itinerary',5,'planned',
 'Adults only. Reserve early. Alternate: FIG, 232 Meeting St.',ARRAY['evening','adults-only','date-night','optional']),

-- ─── DAY 4 · Mon Aug 17 — Folly Beach ─────────────────────────────────────
('c4a71e00-2000-4a00-8000-000000000013','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000004',
 'Folly Beach','The closest real beach to Pinebark Lane, and easy for a group this size — wide sand, gentle surf. Claim a stretch early, bring shade for the littlest kids and the grandparents both.',
 NULL,NULL,'beach','activity','c4a71e00-1000-4a00-8000-000000000009','manual','charleston-2026-itinerary',1,'planned',
 '~20–25 min via Folly Rd.',ARRAY['morning','midday','beach','everyone']),

('c4a71e00-2000-4a00-8000-000000000014','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000004',
 'Lunch — Chico Feo or Loggerhead''s','Both are steps from the sand, casual enough for sandy feet and cranky four-year-olds.',
 NULL,NULL,'dining','activity','c4a71e00-1000-4a00-8000-000000000036','manual','charleston-2026-itinerary',2,'planned',
 'Alternate: Loggerhead''s Beach Grill, Center St.',ARRAY['lunch','kid-friendly']),

('c4a71e00-2000-4a00-8000-000000000015','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000004',
 'Retreat and rest — naps and pool time','A beach morning is a full day for small kids. Head back to the house for naps and pool time rather than stacking on a second outing.',
 NULL,NULL,'activity','activity','c4a71e00-1000-4a00-8000-000000000001','manual','charleston-2026-itinerary',3,'planned',
 NULL,ARRAY['afternoon','pool-time','at-the-house']),

-- ─── DAY 5 · Tue Aug 18 — The Easy Day ────────────────────────────────────
('c4a71e00-2000-4a00-8000-000000000016','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000005',
 'Children''s Museum of the Lowcountry','A pirate ship to captain, a working splash pad, an art studio and STEM lab — built for exactly the 4-to-7 range, and it''s the rain plan if weather turns. Close enough that a rotating pair of adults can run it while everyone else actually rests.',
 NULL,NULL,'activity','activity','c4a71e00-1000-4a00-8000-000000000010','manual','charleston-2026-itinerary',1,'planned',
 '~20 min from base. Rotating pair of adults — this is deliberately NOT a whole-group outing.',
 ARRAY['morning','midday','kids','easy-day','rain-plan']),

('c4a71e00-2000-4a00-8000-000000000017','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000005',
 '⚠ Skip Splash Zone at James Island County Park','It closes for the season Aug 9, before you arrive. The museum''s splash pad is the free-play water fix instead.',
 NULL,NULL,'activity','marker',NULL,'manual','charleston-2026-itinerary',2,'planned',
 'Do not chase this. Closed for the season before arrival.',ARRAY['warning','closed','easy-day']),

('c4a71e00-2000-4a00-8000-000000000018','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000005',
 'The built-in breather — and pool time at the house','With the kids covered nearby, this is the day for whoever needs it — a King Street wander, a quiet porch afternoon at Pinebark Lane, a spa hour. No one has to opt in to the group plan today.',
 NULL,NULL,'activity','activity','c4a71e00-1000-4a00-8000-000000000001','manual','charleston-2026-itinerary',3,'planned',
 'THE EASY DAY. This block is the point of the day — nobody is obliged to be anywhere. Do not fill it.',
 ARRAY['afternoon','easy-day','breather','pool-time','optional']),

('c4a71e00-2000-4a00-8000-000000000019','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000005',
 'Second parents'' night out, if anyone''s up for it','Sorelle for wood-fired Italian and a balcony over Broad Street, or Husk for heirloom Southern cooking. Everyone else eats easy at the house — see the delivery list in the guide.',
 NULL,NULL,'dining','activity','c4a71e00-1000-4a00-8000-000000000027','manual','charleston-2026-itinerary',4,'planned',
 'Adults only, entirely optional. Alternate: Husk, 76 Queen St. House option: Paisano''s delivers.',
 ARRAY['evening','adults-only','date-night','optional','easy-day']),

-- ─── DAY 6 · Wed Aug 19 — Horses & the Angel Oak (AGE SPLIT) ──────────────
('c4a71e00-2000-4a00-8000-000000000020','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000006',
 '⑂ Ashley River Road — the morning splits by AGE, not by household','Middleton Place and Magnolia Plantation sit within a few minutes of each other, so the group splits without splitting the day. Middleton''s trail ride requires riders 8+ on their own horse — with kids at 7 and 4, that line falls across households. Reunite at Magnolia''s Peacock Cafe for lunch on the grounds.',
 NULL,NULL,'activity','marker','c4a71e00-1000-4a00-8000-000000000011','manual','charleston-2026-itinerary',1,'planned',
 'AGE SPLIT — read this before the two lanes below. ~20–25 min from base.',
 ARRAY['morning','age-split','split-header']),

('c4a71e00-2000-4a00-8000-000000000021','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000006',
 'Lane A · Riders 8 and up — Middleton Place Equestrian Center','Guided trail ride along the Ashley River, about an hour, one rider to one horse.',
 NULL,NULL,'activity','activity','c4a71e00-1000-4a00-8000-000000000012','manual','charleston-2026-itinerary',2,'planned',
 'RIDERS 8+ ONLY — a hard age floor, not a preference.',ARRAY['morning','age-split','riders-8-plus']),

('c4a71e00-2000-4a00-8000-000000000022','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000006',
 'Lane B · Everyone else — Magnolia Plantation & Gardens','Petting zoo (goats, whitetail deer), gardens, and the nature tram, all on general admission.',
 NULL,NULL,'activity','activity','c4a71e00-1000-4a00-8000-000000000013','manual','charleston-2026-itinerary',3,'planned',
 'Where the under-8s and whoever isn''t riding spend the morning. The wildlife boat tour was listed closed for the season — bonus if it''s back.',
 ARRAY['morning','age-split','all-ages','kids']),

('c4a71e00-2000-4a00-8000-000000000023','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000006',
 'Reunite — lunch at Magnolia''s Peacock Cafe','Both lanes come back together on the grounds.',
 NULL,NULL,'dining','activity','c4a71e00-1000-4a00-8000-000000000013','manual','charleston-2026-itinerary',4,'planned',
 'The rejoin point for the age split.',ARRAY['lunch','age-split','reunite']),

('c4a71e00-2000-4a00-8000-000000000024','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000006',
 'The Angel Oak, on the way back — then pool time','Free, and a genuinely easy ten-minute stop — a 400-year-old live oak with limbs that touch the ground. Good for restless legs after a morning of standing around gardens. Straight back to Pinebark Lane after for the pool before dinner.',
 NULL,NULL,'activity','activity','c4a71e00-1000-4a00-8000-000000000014','manual','charleston-2026-itinerary',5,'planned',
 'Free.',ARRAY['afternoon','pool-time','free']),

('c4a71e00-2000-4a00-8000-000000000025','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000006',
 'Low-key at the house','Order in or grill. Save the energy — tomorrow''s the big one.',
 NULL,NULL,'dining','activity','c4a71e00-1000-4a00-8000-000000000001','manual','charleston-2026-itinerary',6,'planned',
 NULL,ARRAY['evening','at-the-house']),

-- ─── DAY 7 · Thu Aug 20 — The Aviary, then the Send-Off (ANCHOR) ──────────
('c4a71e00-2000-4a00-8000-000000000026','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000007',
 'Center for Birds of Prey, Awendaw','The one exception to the 40-minute rule, and the only day it works: the Center is open Thursday through Saturday only, 10–4, with the guided tour and flight demonstration starting at 10:30. That puts it here, or nowhere — Saturday''s already the pirate cruise. Worth the drive: a professional tour through the resident aviaries plus a live raptor flight.',
 '10:30',NULL,'activity','activity','c4a71e00-1000-4a00-8000-000000000015','manual','charleston-2026-itinerary',1,'planned',
 'HOURS-LOCKED: Thu–Sat only, 10–4; tour + flight demo 10:30. ~40–45 min — the deliberate exception to the radius rule.',
 ARRAY['morning','hours-locked','drive','everyone']),

('c4a71e00-2000-4a00-8000-000000000027','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000007',
 'Seafood pickup on the way back — CudaCo or Crosby''s','Pick up the seafood on the way back through town. CudaCo Seafood House on Folly Rd or Crosby''s Fish & Shrimp Co. are both close to base and known for what''s actually fresh that day. A low-country boil scales cleanly for seventeen and can be mostly prepped ahead.',
 NULL,NULL,'dining','activity','c4a71e00-1000-4a00-8000-000000000016','manual','charleston-2026-itinerary',2,'planned',
 'Send-off supply run. Alternate: Crosby''s, 2223 Folly Rd, daily 6–6.',ARRAY['midday','prep','send-off']),

('c4a71e00-2000-4a00-8000-000000000028','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000007',
 'Kitchen prep begins — kids hit the pool','A low-country boil can be mostly prepped ahead, so the two of you aren''t stuck at the stove all night — and the kids have somewhere to burn off the drive while you cook.',
 NULL,NULL,'activity','activity','c4a71e00-1000-4a00-8000-000000000001','manual','charleston-2026-itinerary',3,'planned',
 'NOTHING ELSE GOES IN THIS AFTERNOON. Deliberately empty so the kitchen isn''t racing the clock.',
 ARRAY['afternoon','pool-time','prep','protected']),

('c4a71e00-2000-4a00-8000-000000000029','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000007',
 '⚓ The send-off dinner','Everyone at one table on Pinebark Lane — the thank-you for the week, cooked by the two of you.',
 NULL,NULL,'meal','activity','c4a71e00-1000-4a00-8000-000000000001','manual','charleston-2026-itinerary',4,'planned',
 'PROTECTED ANCHOR — Shawn & Dan cooking for all 17. This is the one to protect. Nothing else scheduled today past the aviary; leave the whole afternoon open.',
 ARRAY['anchor','protected','evening','everyone','send-off']),

-- ─── DAY 8 · Fri Aug 21 — Departure ───────────────────────────────────────
('c4a71e00-2000-4a00-8000-000000000030','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000008',
 'Pack, quick breakfast, out the door','Flight''s at 11:10a — for a group this size, plan to leave Pinebark Lane by 9:00a to clear check-in, security, and a stroller-and-carseat-heavy TSA line comfortably. Pack the night before so the morning is just breakfast and the door, not a scramble.',
 NULL,'09:00','activity','activity','c4a71e00-1000-4a00-8000-000000000001','manual','charleston-2026-itinerary',1,'planned',
 'WHEELS-UP BUFFER: leave the house by 9:00a.',ARRAY['morning','departure','logistics']),

('c4a71e00-2000-4a00-8000-000000000031','c4a71e00-8a3f-4b21-9d55-3c17e0aa2026','c4a71e00-d001-4a00-8000-000000000008',
 'Flight home — UA 674','CHS → EWR, departs 11:10a, lands 1:06p.',
 '11:10','13:06','transport','activity','c4a71e00-1000-4a00-8000-000000000002','manual','charleston-2026-itinerary',2,'planned',
 NULL,ARRAY['flight','travel','departure'])
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. LOCATION_DAYS — per-day map filtering for the venues each day visits.
--    Eating-list venues with no scheduled day stay unlinked: they remain
--    trip-wide pins without cluttering a specific day's map.
-- ---------------------------------------------------------------------------
INSERT INTO location_days (id, location_id, day_id) VALUES
-- Day 1
('c4a71e00-3000-4a00-8000-000000000001','c4a71e00-1000-4a00-8000-000000000002','c4a71e00-d001-4a00-8000-000000000001'),
('c4a71e00-3000-4a00-8000-000000000002','c4a71e00-1000-4a00-8000-000000000003','c4a71e00-d001-4a00-8000-000000000001'),
('c4a71e00-3000-4a00-8000-000000000003','c4a71e00-1000-4a00-8000-000000000001','c4a71e00-d001-4a00-8000-000000000001'),
('c4a71e00-3000-4a00-8000-000000000004','c4a71e00-1000-4a00-8000-000000000007','c4a71e00-d001-4a00-8000-000000000001'),
-- Day 2
('c4a71e00-3000-4a00-8000-000000000005','c4a71e00-1000-4a00-8000-000000000004','c4a71e00-d001-4a00-8000-000000000002'),
('c4a71e00-3000-4a00-8000-000000000006','c4a71e00-1000-4a00-8000-000000000005','c4a71e00-d001-4a00-8000-000000000002'),
('c4a71e00-3000-4a00-8000-000000000007','c4a71e00-1000-4a00-8000-000000000018','c4a71e00-d001-4a00-8000-000000000002'),
-- Day 3
('c4a71e00-3000-4a00-8000-000000000008','c4a71e00-1000-4a00-8000-000000000006','c4a71e00-d001-4a00-8000-000000000003'),
('c4a71e00-3000-4a00-8000-000000000009','c4a71e00-1000-4a00-8000-000000000007','c4a71e00-d001-4a00-8000-000000000003'),
('c4a71e00-3000-4a00-8000-000000000010','c4a71e00-1000-4a00-8000-000000000008','c4a71e00-d001-4a00-8000-000000000003'),
('c4a71e00-3000-4a00-8000-000000000011','c4a71e00-1000-4a00-8000-000000000031','c4a71e00-d001-4a00-8000-000000000003'),
('c4a71e00-3000-4a00-8000-000000000012','c4a71e00-1000-4a00-8000-000000000026','c4a71e00-d001-4a00-8000-000000000003'),
('c4a71e00-3000-4a00-8000-000000000013','c4a71e00-1000-4a00-8000-000000000001','c4a71e00-d001-4a00-8000-000000000003'),
-- Day 4
('c4a71e00-3000-4a00-8000-000000000014','c4a71e00-1000-4a00-8000-000000000009','c4a71e00-d001-4a00-8000-000000000004'),
('c4a71e00-3000-4a00-8000-000000000015','c4a71e00-1000-4a00-8000-000000000036','c4a71e00-d001-4a00-8000-000000000004'),
('c4a71e00-3000-4a00-8000-000000000016','c4a71e00-1000-4a00-8000-000000000037','c4a71e00-d001-4a00-8000-000000000004'),
('c4a71e00-3000-4a00-8000-000000000017','c4a71e00-1000-4a00-8000-000000000001','c4a71e00-d001-4a00-8000-000000000004'),
-- Day 5
('c4a71e00-3000-4a00-8000-000000000018','c4a71e00-1000-4a00-8000-000000000010','c4a71e00-d001-4a00-8000-000000000005'),
('c4a71e00-3000-4a00-8000-000000000019','c4a71e00-1000-4a00-8000-000000000027','c4a71e00-d001-4a00-8000-000000000005'),
('c4a71e00-3000-4a00-8000-000000000020','c4a71e00-1000-4a00-8000-000000000001','c4a71e00-d001-4a00-8000-000000000005'),
-- Day 6
('c4a71e00-3000-4a00-8000-000000000021','c4a71e00-1000-4a00-8000-000000000011','c4a71e00-d001-4a00-8000-000000000006'),
('c4a71e00-3000-4a00-8000-000000000022','c4a71e00-1000-4a00-8000-000000000012','c4a71e00-d001-4a00-8000-000000000006'),
('c4a71e00-3000-4a00-8000-000000000023','c4a71e00-1000-4a00-8000-000000000013','c4a71e00-d001-4a00-8000-000000000006'),
('c4a71e00-3000-4a00-8000-000000000024','c4a71e00-1000-4a00-8000-000000000014','c4a71e00-d001-4a00-8000-000000000006'),
('c4a71e00-3000-4a00-8000-000000000025','c4a71e00-1000-4a00-8000-000000000001','c4a71e00-d001-4a00-8000-000000000006'),
-- Day 7
('c4a71e00-3000-4a00-8000-000000000026','c4a71e00-1000-4a00-8000-000000000015','c4a71e00-d001-4a00-8000-000000000007'),
('c4a71e00-3000-4a00-8000-000000000027','c4a71e00-1000-4a00-8000-000000000016','c4a71e00-d001-4a00-8000-000000000007'),
('c4a71e00-3000-4a00-8000-000000000028','c4a71e00-1000-4a00-8000-000000000017','c4a71e00-d001-4a00-8000-000000000007'),
('c4a71e00-3000-4a00-8000-000000000029','c4a71e00-1000-4a00-8000-000000000001','c4a71e00-d001-4a00-8000-000000000007'),
-- Day 8
('c4a71e00-3000-4a00-8000-000000000030','c4a71e00-1000-4a00-8000-000000000001','c4a71e00-d001-4a00-8000-000000000008'),
('c4a71e00-3000-4a00-8000-000000000031','c4a71e00-1000-4a00-8000-000000000002','c4a71e00-d001-4a00-8000-000000000008')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. PROOF — Sankofa before vs after, plus what Charleston actually got.
--    EVERY row of `sankofa_delta` must read 0. If not: ROLLBACK.
-- ---------------------------------------------------------------------------
WITH sankofa_after AS (
  SELECT 'trips'            AS tbl, count(*) AS n FROM trips           WHERE id      = 'cb6f65f0-b34b-467a-a206-051cc8914db0'
  UNION ALL SELECT 'itinerary_days',  count(*) FROM itinerary_days     WHERE trip_id = 'cb6f65f0-b34b-467a-a206-051cc8914db0'
  UNION ALL SELECT 'itinerary_items', count(*) FROM itinerary_items    WHERE trip_id = 'cb6f65f0-b34b-467a-a206-051cc8914db0'
  UNION ALL SELECT 'locations',       count(*) FROM locations          WHERE trip_id = 'cb6f65f0-b34b-467a-a206-051cc8914db0'
  UNION ALL SELECT 'memories',        count(*) FROM memories           WHERE trip_id = 'cb6f65f0-b34b-467a-a206-051cc8914db0'
  UNION ALL SELECT 'family_contacts', count(*) FROM family_contacts    WHERE trip_id = 'cb6f65f0-b34b-467a-a206-051cc8914db0'
  UNION ALL SELECT 'share_links',     count(*) FROM trip_share_links   WHERE trip_id = 'cb6f65f0-b34b-467a-a206-051cc8914db0'
  UNION ALL SELECT 'location_days',   count(*) FROM location_days ld
                                      JOIN itinerary_days d ON d.id = ld.day_id
                                      WHERE d.trip_id = 'cb6f65f0-b34b-467a-a206-051cc8914db0'
),
charleston AS (
  SELECT 'trips'            AS tbl, count(*) AS n FROM trips           WHERE id      = 'c4a71e00-8a3f-4b21-9d55-3c17e0aa2026'
  UNION ALL SELECT 'itinerary_days',  count(*) FROM itinerary_days     WHERE trip_id = 'c4a71e00-8a3f-4b21-9d55-3c17e0aa2026'
  UNION ALL SELECT 'itinerary_items', count(*) FROM itinerary_items    WHERE trip_id = 'c4a71e00-8a3f-4b21-9d55-3c17e0aa2026'
  UNION ALL SELECT 'locations',       count(*) FROM locations          WHERE trip_id = 'c4a71e00-8a3f-4b21-9d55-3c17e0aa2026'
  UNION ALL SELECT 'memories',        count(*) FROM memories           WHERE trip_id = 'c4a71e00-8a3f-4b21-9d55-3c17e0aa2026'
  UNION ALL SELECT 'family_contacts', count(*) FROM family_contacts    WHERE trip_id = 'c4a71e00-8a3f-4b21-9d55-3c17e0aa2026'
  UNION ALL SELECT 'share_links',     count(*) FROM trip_share_links   WHERE trip_id = 'c4a71e00-8a3f-4b21-9d55-3c17e0aa2026'
  UNION ALL SELECT 'location_days',   count(*) FROM location_days ld
                                      JOIN itinerary_days d ON d.id = ld.day_id
                                      WHERE d.trip_id = 'c4a71e00-8a3f-4b21-9d55-3c17e0aa2026'
)
SELECT
  b.tbl                              AS "table",
  b.n                                AS sankofa_before,
  a.n                                AS sankofa_after,
  a.n - b.n                          AS sankofa_delta,
  CASE WHEN a.n = b.n THEN 'OK' ELSE '*** SANKOFA CHANGED — ROLLBACK ***' END AS verdict,
  c.n                                AS charleston_rows
FROM sankofa_before b
JOIN sankofa_after  a USING (tbl)
JOIN charleston     c USING (tbl)
ORDER BY b.tbl;

-- Expected charleston_rows: trips 1 · itinerary_days 8 · itinerary_items 31
--                           locations 37 · location_days 31
--                           memories 0 · family_contacts 0 · share_links 0
-- Expected sankofa_delta:   0 on every row.
--
-- If all deltas are 0:
COMMIT;
-- otherwise: ROLLBACK;
