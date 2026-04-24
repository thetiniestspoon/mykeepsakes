-- MyKeepsakes / Sankofa — Chicago food shortlist ingest (2026-04-24)
-- Target Supabase project: ckjcieeccopqowlfljja
-- Trip:    Sankofa 2026 — Healing, Justice & Sacred Care
-- trip_id: cb6f65f0-b34b-467a-a206-051cc8914db0
--
-- Source:  operator-supplied "THE BEST CHICAGO SPOTS FOR" reference image
--          (6 categories × 5 spots = 30 total)
-- Attach:  Apr 25 itinerary_day (cd99fce2…) "Free Day — Explore Chicago" as
--          un-scheduled shortlist items, mirroring the existing Apr 24 pattern.
--
-- Addresses hand-verified via WebSearch. Coords via OpenStreetMap Nominatim
-- (geocoded from the verified address, not name-fuzzy). All coords resolved
-- to a specific building except Taqueria Invicto (street-segment, earlier
-- CLEANUP batch).
--
-- Multi-location picks (confirmed by operator on 2026-04-24):
--   • Buona              → Streeterville (613 N McClurg Ct) — central Chicago
--                           branch, visitor-friendly. Not the 1981 Berwyn flagship.
--   • Carnitas Uruapan   → Pilsen original (1725 W 18th St) — the iconic one.
--   • 3LP Chi            → Hyde Park (1321 E 57th St) — clusters with 5 Rabanitos
--                           for a Hyde Park food crawl.
--
-- Category preservation: locations.category = 'dining' (keeps app filters
-- working); food subcategory is the FIRST LINE of notes (BURGERS / PIZZA
-- / etc.). Also stored on itinerary_items.tags for future filter UIs.

BEGIN;

-- =============================================================================
-- Insert 30 locations + attach 30 itinerary_items to Apr 25 in one atomic step
-- =============================================================================

WITH new_locs AS (
  INSERT INTO locations (trip_id, name, category, address, lat, lng, notes) VALUES

  -- ─── BURGERS ───
  ('cb6f65f0-b34b-467a-a206-051cc8914db0', 'Gretel', 'dining',
   '2833 W Armitage Ave, Chicago, IL 60647', 41.9172689, -87.6985729,
   E'BURGERS · Logan Square. Cocktail bar doubling as a griddle-burger destination — the two-patty Griddle Burger ($19, fries included) is the signature. Oysters and a strong beer list round it out. Walk-in, no reservations.'),

  ('cb6f65f0-b34b-467a-a206-051cc8914db0', 'Best Intentions', 'dining',
   '3281 W Armitage Ave, Chicago, IL 60647', 41.9172470, -87.7101436,
   E'BURGERS · Logan Square. Neighborhood cocktail bar with a cult smashburger program. Unpretentious, late-night-friendly. Walk-in.'),

  ('cb6f65f0-b34b-467a-a206-051cc8914db0', 'Diego', 'dining',
   '459 N Ogden Ave, Chicago, IL 60642', 41.8908482, -87.6594489,
   E'BURGERS · West Loop. Chef-driven Baja-Mediterranean spot from Stephen Sandoval + Oscar Sotelo (opened 2023). Burgers sit alongside tacos, mezcal, and a strong cocktail list. Reservations recommended.'),

  ('cb6f65f0-b34b-467a-a206-051cc8914db0', 'Patty Please', 'dining',
   '2956 N Albany Ave, Chicago, IL 60618', 41.9355689, -87.7053387,
   E'BURGERS · Avondale. Smashburger pop-up inside Small Bar. "The Pleaser" ($12, no fries) is the signature — two smash patties, American, onion, pleaser sauce, pickles. Cash-easy, low-frills, excellent.'),

  ('cb6f65f0-b34b-467a-a206-051cc8914db0', 'Taco Sublime', 'dining',
   '3630 S Iron St, Chicago, IL 60609', 41.8277727, -87.6595159,
   E'BURGERS · McKinley Park (inside Marz Brewing). Dual-threat pop-up famous for fried-cheese tacos AND a smashburger that South-Side bloggers rave about. Brewery seating; order at the counter.'),

  -- ─── ITALIAN BEEF ───
  ('cb6f65f0-b34b-467a-a206-051cc8914db0', '3LP Chi', 'dining',
   '1321 E 57th St, Chicago, IL 60637', 41.7912792, -87.5939365,
   E'ITALIAN BEEF · Hyde Park. "3 Little Pigs" — hybrid Italian-beef / fried-chicken-sandwich shop near U of Chicago. Counter service. Pairs well with 5 Rabanitos for a Hyde Park food crawl (both on this list).'),

  ('cb6f65f0-b34b-467a-a206-051cc8914db0', E'Al\'s #1 Italian Beef', 'dining',
   '1079 W Taylor St, Chicago, IL 60607', 41.8693169, -87.6540015,
   E'ITALIAN BEEF · Little Italy / Taylor Street. The original Al''s — operating since 1938 and the benchmark for dipped Chicago-style Italian beef. Order it dipped with hot giardiniera. Stand-up counter, no seats.'),

  ('cb6f65f0-b34b-467a-a206-051cc8914db0', 'Buona', 'dining',
   '613 N McClurg Ct, Chicago, IL 60611', 41.8929717, -87.6175483,
   E'ITALIAN BEEF · Streeterville. Central-Chicago branch of the 25+ location Buona Beef chain — the Buonavolanto family''s Italian-beef institution since 1981 (original in Berwyn). Counter service, Mag Mile-adjacent.'),

  ('cb6f65f0-b34b-467a-a206-051cc8914db0', E'Carm\'s', 'dining',
   '1057 W Polk St, Chicago, IL 60607', 41.8716482, -87.6534228,
   E'ITALIAN BEEF · Little Italy. Old-school Italian beef + Italian ice stand at Polk & Carpenter. A UIC neighborhood institution; cash-friendly, seasonal ice window in summer.'),

  ('cb6f65f0-b34b-467a-a206-051cc8914db0', E'Tony\'s Italian Beef', 'dining',
   '7007 S Pulaski Rd, Chicago, IL 60629', 41.7656251, -87.7221580,
   E'ITALIAN BEEF · West Lawn (Southwest Side). Cult-favorite Southwest-Side beef stand. Often mentioned in the same breath as Johnnie''s and Al''s by beef-hunters. Weekday lunch rush is serious.'),

  -- ─── PIZZA ───
  ('cb6f65f0-b34b-467a-a206-051cc8914db0', E'Pequod\'s Pizza', 'dining',
   '2207 N Clybourn Ave, Chicago, IL 60614', 41.9219163, -87.6643863,
   E'PIZZA · Lincoln Park. Famous for the caramelized-cheese crust — a pan-pizza variant unique to Pequod''s. In the Lincoln Park location since 1992 (original in Morton Grove, 1970). Expect a wait at peak hours.'),

  ('cb6f65f0-b34b-467a-a206-051cc8914db0', E'Pizz\'amici', 'dining',
   '1215 W Grand Ave, Chicago, IL 60642', 41.8908383, -87.6580640,
   E'PIZZA · West Town. BYOB Italian-style pies — thinner, blistered crust, small menu, neighborhood feel. Wed–Sun dinners only. Reservations worthwhile on weekends.'),

  ('cb6f65f0-b34b-467a-a206-051cc8914db0', 'Spacca Napoli', 'dining',
   '1769 W Sunnyside Ave, Chicago, IL 60640', 41.9632016, -87.6737278,
   E'PIZZA · Ravenswood. VPN-certified Neapolitan — wood-fired 900°F oven, 60-second bake, imported 00 flour, San Marzano tomatoes. Chicago''s reference for traditional Naples pizza. Reservations recommended.'),

  ('cb6f65f0-b34b-467a-a206-051cc8914db0', E'Vito & Nick\'s Pizzeria', 'dining',
   '8433 S Pulaski Rd, Chicago, IL 60652', 41.7392952, -87.7212480,
   E'PIZZA · Ashburn (Southwest Side). Tavern-style thin crust, cut into squares — the Chicago "party cut" done right. Family-run since 1965, wood-paneled dining room, no reservations. Bring cash.'),

  ('cb6f65f0-b34b-467a-a206-051cc8914db0', 'Zarella Pizzeria & Taverna', 'dining',
   '531 N Wells St, Chicago, IL 60654', 41.8917574, -87.6337956,
   E'PIZZA · River North. Boka Restaurant Group''s 2025 pizzeria — artisan and tavern-style pies in a polished tavern setting. Newer and reservation-friendly, walk-in possible at the bar.'),

  -- ─── SUSHI ───
  ('cb6f65f0-b34b-467a-a206-051cc8914db0', 'Casa Madai', 'dining',
   '2023 S Racine Ave, Chicago, IL 60608', 41.8544443, -87.6560708,
   E'SUSHI · Pilsen. Intimate omakase counter — 13- and 15-course tastings only, reserved via Tock. Tue–Sat evenings, closed Sun–Mon. Special-occasion price tier.'),

  ('cb6f65f0-b34b-467a-a206-051cc8914db0', 'Kai Zan', 'dining',
   '2557 W Chicago Ave, Chicago, IL 60622', 41.8955355, -87.6915560,
   E'SUSHI · West Town. Twin-chef (Carlo + Melvin Imamura) sushi-ya, warm and personal, extensive omakase and à la carte. Reservations essential.'),

  ('cb6f65f0-b34b-467a-a206-051cc8914db0', 'Momotaro', 'dining',
   '820 W Lake St, Chicago, IL 60607', 41.8859058, -87.6484698,
   E'SUSHI · Fulton Market. Boka Group''s upscale Japanese — three floors, robata grill, sushi counter, hidden basement izakaya (Izakaya Momotaro). Dressy, date-night tier.'),

  ('cb6f65f0-b34b-467a-a206-051cc8914db0', 'Noriko Handroll Bar', 'dining',
   '401 N Milwaukee Ave, Chicago, IL 60654', 41.8893525, -87.6445067,
   E'SUSHI · West Town. Hidden handroll bar beneath Michelin-recognized Perilla Fare — enter via Perilla and check in with the host. Nori-forward, rapid-fire counter-service omakase. Book ahead.'),

  ('cb6f65f0-b34b-467a-a206-051cc8914db0', 'Sushi-san', 'dining',
   '63 W Grand Ave, Chicago, IL 60654', 41.8914679, -87.6304875,
   E'SUSHI · River North. Lettuce Entertain You''s hip-hop-soundtracked sushi room — loud, fun, reasonably priced, solid fish. Reservations recommended but the bar takes walk-ins.'),

  -- ─── TACOS ───
  ('cb6f65f0-b34b-467a-a206-051cc8914db0', '5 Rabanitos', 'dining',
   '1301 E 53rd St, Chicago, IL 60615', 41.7993384, -87.5948433,
   E'TACOS · Hyde Park. Chef Alfonso Sotelo (Topolobampo alum) making traditional moles, handmade tortillas, deeply flavored tacos. BYOB, neighborhood-friendly, reservations accepted.'),

  ('cb6f65f0-b34b-467a-a206-051cc8914db0', 'Asian Cuisine Express', 'dining',
   '3823 W 31st St, Chicago, IL 60623', 41.8367981, -87.7204303,
   E'TACOS · Little Village. Chinese-owned taqueria famous for Thai-Mexican fusion al pastor tacos — crowned by multiple local critics as among the city''s best. Counter service, cash-easy.'),

  ('cb6f65f0-b34b-467a-a206-051cc8914db0', 'Carnitas Uruapan', 'dining',
   '1725 W 18th St, Chicago, IL 60608', 41.8575313, -87.6696912,
   E'TACOS · Pilsen. The Lopez family''s 1975 original — Michoacán-style carnitas by the pound with handmade tortillas. Cash-friendly, weekend brunch lines. The iconic Pilsen institution.'),

  ('cb6f65f0-b34b-467a-a206-051cc8914db0', 'La Internacional', 'dining',
   '4556 S Ashland Ave, Chicago, IL 60609', 41.8112096, -87.6651493,
   E'TACOS · Back of the Yards. Supermercado with an adjoining taqueria counter — al pastor, asada, carnitas, all under $3. A cult favorite that travels in the same shortlists as Pacos Tacos.'),

  ('cb6f65f0-b34b-467a-a206-051cc8914db0', 'Xocome Antojeria', 'dining',
   '5200 S Archer Ave, Chicago, IL 60632', 41.8001271, -87.7348724,
   E'TACOS · Archer Heights. Blue-corn handmade tortillas and regional Mexican cooking; named Chicago Magazine Restaurant of the Year. Counter-service, 10a–7:30p daily. Worth the trek.'),

  -- ─── STEAK ───
  ('cb6f65f0-b34b-467a-a206-051cc8914db0', 'Asador Bastian', 'dining',
   '214 W Erie St, Chicago, IL 60654', 41.8942259, -87.6347899,
   E'STEAK · River North. Basque-inspired asador in an 1883 brownstone — named #1 steak restaurant in North America (World''s Best Steaks 2025). Fire-driven, primal cuts, reservation-essential splurge.'),

  ('cb6f65f0-b34b-467a-a206-051cc8914db0', E'Bavette\'s Bar & Boeuf', 'dining',
   '218 W Kinzie St, Chicago, IL 60654', 41.8892850, -87.6348919,
   E'STEAK · River North. Boka Group''s velvet-drapes, speakeasy-era French steakhouse — the most glamorous room on this list. Dry-aged ribeye, classic tableside pomp. Reservations lock up 30 days ahead.'),

  ('cb6f65f0-b34b-467a-a206-051cc8914db0', 'Boeufhaus', 'dining',
   '1012 N Western Ave, Chicago, IL 60622', 41.8998468, -87.6871843,
   E'STEAK · Smith Park / West Town. Neighborhood dry-aged steakhouse — smaller, earnest, in-house butchery, strong natural-wine list. Reservations on weekends.'),

  ('cb6f65f0-b34b-467a-a206-051cc8914db0', 'Gibsons Bar & Steakhouse', 'dining',
   '1028 N Rush St, Chicago, IL 60611', 41.9013564, -87.6280782,
   E'STEAK · Gold Coast / Rush Street. Chicago institution since 1989 — massive steaks, old-school showmanship, politicians and tourists in roughly equal parts. Reservations a must.'),

  ('cb6f65f0-b34b-467a-a206-051cc8914db0', 'Maple & Ash', 'dining',
   '8 W Maple St, Chicago, IL 60610', 41.9019662, -87.6287408,
   E'STEAK · Gold Coast. Wood-fire-driven, second-floor steakhouse with an over-the-top vibe — sommelier-forward wine list, signature tomahawk, party-energy weekends. Reservations essential.')

  RETURNING id, name
)
INSERT INTO itinerary_items (trip_id, day_id, title, category, item_type, location_id, sort_index, tags, source, external_ref, notes)
SELECT
  'cb6f65f0-b34b-467a-a206-051cc8914db0'::uuid,
  'cd99fce2-f7f5-4f38-86e7-6536686315e3'::uuid,  -- Apr 25 "Free Day — Explore Chicago"
  nl.name,
  'dining',
  'activity',  -- item_type CHECK only allows 'activity' | 'marker'; category carries the finer distinction
  nl.id,
  -- sort_index starts at 10 so they land after the existing 2 scheduled items;
  -- ordering within the shortlist: BURGERS, BEEF, PIZZA, SUSHI, TACOS, STEAK
  10 + row_number() OVER (ORDER BY
    CASE
      WHEN nl.name IN ('Gretel','Best Intentions','Diego','Patty Please','Taco Sublime') THEN 1
      WHEN nl.name IN ('3LP Chi','Al''s #1 Italian Beef','Buona','Carm''s','Tony''s Italian Beef') THEN 2
      WHEN nl.name IN ('Pequod''s Pizza','Pizz''amici','Spacca Napoli','Vito & Nick''s Pizzeria','Zarella Pizzeria & Taverna') THEN 3
      WHEN nl.name IN ('Casa Madai','Kai Zan','Momotaro','Noriko Handroll Bar','Sushi-san') THEN 4
      WHEN nl.name IN ('5 Rabanitos','Asian Cuisine Express','Carnitas Uruapan','La Internacional','Xocome Antojeria') THEN 5
      ELSE 6
    END,
    nl.name
  ),
  -- tags array carries the food subcategory for future filter UIs
  ARRAY['dining',
    CASE
      WHEN nl.name IN ('Gretel','Best Intentions','Diego','Patty Please','Taco Sublime') THEN 'burgers'
      WHEN nl.name IN ('3LP Chi','Al''s #1 Italian Beef','Buona','Carm''s','Tony''s Italian Beef') THEN 'italian-beef'
      WHEN nl.name IN ('Pequod''s Pizza','Pizz''amici','Spacca Napoli','Vito & Nick''s Pizzeria','Zarella Pizzeria & Taverna') THEN 'pizza'
      WHEN nl.name IN ('Casa Madai','Kai Zan','Momotaro','Noriko Handroll Bar','Sushi-san') THEN 'sushi'
      WHEN nl.name IN ('5 Rabanitos','Asian Cuisine Express','Carnitas Uruapan','La Internacional','Xocome Antojeria') THEN 'tacos'
      ELSE 'steak'
    END,
    'shortlist'
  ],
  'manual',
  'chicago-food-shortlist-2026-04-24',  -- source CHECK only allows 'manual'|'import'; batch marker goes in external_ref
  NULL
FROM new_locs nl;

-- =============================================================================
-- Post-ingest verification (run before COMMIT)
-- =============================================================================

SELECT 'new_locations_count' AS check, count(*)::text AS value
FROM locations
WHERE trip_id = 'cb6f65f0-b34b-467a-a206-051cc8914db0'
  AND category = 'dining'
  AND created_at >= now() - interval '1 minute'
UNION ALL
SELECT 'new_items_on_apr25',
       count(*)::text
FROM itinerary_items
WHERE day_id = 'cd99fce2-f7f5-4f38-86e7-6536686315e3'
  AND source = 'manual:chicago-food-shortlist-2026-04-24'
UNION ALL
SELECT 'any_items_missing_location',
       count(*)::text
FROM itinerary_items
WHERE day_id = 'cd99fce2-f7f5-4f38-86e7-6536686315e3'
  AND source = 'manual:chicago-food-shortlist-2026-04-24'
  AND location_id IS NULL
UNION ALL
SELECT 'any_locations_missing_coords',
       count(*)::text
FROM locations
WHERE trip_id = 'cb6f65f0-b34b-467a-a206-051cc8914db0'
  AND created_at >= now() - interval '1 minute'
  AND (lat IS NULL OR lng IS NULL);

-- Expect: new_locations_count=30, new_items_on_apr25=30, both zero rows.
-- After verifying:

COMMIT;

-- ROLLBACK;  -- uncomment instead of COMMIT if verification shows anything off
