# Charleston 2026 — pre-ingest shape audit

**Date:** 2026-07-29
**Purpose:** Write down how the Sankofa trip is *actually* shaped before generating any Charleston
SQL. The 2026-04-24 deploy hit three invisible CHECK constraints mid-apply
(`260424-bik-DEPLOY-SUMMARY.md` §"Schema gotchas"); this pass front-loads that discovery.

**Method:** read-only. Repo migrations + generated types + the April audit/deploy records.
No live DB query was made from this session — the Supabase MCP server is configured in
`.mcp.json` but not connected here, and `.env` (which holds the keys) was deliberately not read.
Everything below is sourced from committed files, and the migration ships with its own
before/after proof so nothing is taken on faith at apply time.

---

## 1. Target project

| | |
|---|---|
| Ref | `ckjcieeccopqowlfljja` |
| Source | `.mcp.json` → `mcpServers.supabase.url?project_ref=` (authoritative) |
| `supabase/.temp/linked-project.json` | absent — `.mcp.json` is the only ref source |

Sankofa trip id (from the April deploy record): `cb6f65f0-b34b-467a-a206-051cc8914db0`.

---

## 2. Table shapes that matter

Defined in `supabase/migrations/20260131215810_*.sql`, extended by `20260323000000_conference_companion.sql`,
`20260402000000_add_speaker_track.sql`, `20260410200000_add_trip_metadata.sql`.

### `trips`
`id, title, location_name, start_date DATE, end_date DATE, timezone, metadata jsonb NOT NULL DEFAULT '{}', created_at, updated_at`

`metadata` is namespaced free-form JSON (`registration` is the only namespace in use; the column
comment explicitly invites `travel`, `lodging`, `contacts`). Not schema-enforced — safe place for
the flights, the base address, the party count, and the radius rule.

### `itinerary_days`
`id, trip_id, date DATE, title, sort_index INT NOT NULL DEFAULT 0, …` — **`UNIQUE(trip_id, date)`**.

### `itinerary_items` — the constrained one
`id, trip_id, day_id, title, description, start_time TIME, end_time TIME, category TEXT NOT NULL DEFAULT 'activity',
item_type, location_id, source, external_ref, sort_index, status, completed_at, link, link_label, phone, notes, tags text[], speaker, track`

### ⚠ The three CHECK constraints (the April landmine)

| Column | Constraint | Allowed values — **nothing else** |
|--------|-----------|------------------------------------|
| `item_type` | `itinerary_items_item_type_check` | `'activity'`, `'marker'` |
| `source` | `itinerary_items_source_check` | `'manual'`, `'import'` |
| `status` | `itinerary_items_status_check` | `'planned'`, `'done'`, `'skipped'` |

**`category` has NO check constraint** — it is plain TEXT. All fine-grained meaning
(`dining`, `beach`, `transport`, `meal`, `event`, …) lives there. The TS union
`ItemCategory` (`src/types/trip.ts:79`) is the de-facto vocabulary:
`activity | dining | beach | accommodation | transport | event | workshop | meal | social | worship | seminar`.
Charleston uses only values already in that union — no TS change needed for categories.

**Batch tracking goes in `external_ref`, never `source`.** `source='manual:charleston-…'` would fail
the check. April established the convention: `external_ref = '<batch-slug>'`, making the whole batch
selectable and reversible with one predicate. Charleston uses
`external_ref = 'charleston-2026-itinerary'`.

### `locations`
`id, trip_id, name, category, address, lat DOUBLE PRECISION, lng DOUBLE PRECISION, phone, url, notes, visited_at, …`
`lat`/`lng` are **nullable** — a location with an address but no coordinates is legal; it simply
doesn't draw a pin. This is the honest home for venues I could not geocode with confidence.

### `location_days`
`id, location_id, day_id` — **`UNIQUE(location_id, day_id)`**. Many-to-many; drives per-day map
filtering (`useDayLocations`, `useLocationsWithDays` in `src/hooks/use-locations.ts`).

### Drift noticed (not acted on)
- `src/integrations/supabase/types.ts` is **stale**: its `itinerary_items` Row omits `speaker`,
  `track`, and `is_chosen`. `is_chosen` appears in `src/types/trip.ts:104` but no migration adds it.
  The migration therefore writes **only** columns proven present by a migration file.

---

## 3. How the app selects a trip — the real multi-trip risk

`useActiveTrip()` (`src/hooks/use-trip.ts:70`):

1. `localStorage['selected-trip-id']` if that trip still exists → wins.
2. else the trip where `start_date <= today <= end_date`.
3. else **the next upcoming trip by `start_date`**.
4. else the most recent past trip.

Today is 2026-07-29. Sankofa (Apr 2026) is past; Charleston (Aug 14) is upcoming. So on any
device with **no** saved selection, rung 3 fires and the app will open on **Charleston** the moment
these rows land. Sankofa's rows are untouched — but the default view changes. There is a trip
switcher at `/mykeepsakes/preview/collage/trips`, and picking a trip writes `localStorage`, which
then pins it. **This is a behavioural change, not a data change, and it is the one thing to expect.**

---

## 4. The Trip Guide is NOT trip-scoped — the real blocker

The ask was to put the eating list into the Trip Guide "Where to Eat" pattern rather than stuffing
20 restaurants into the itinerary. That pattern exists, but not the way the DB does:

- `GuideTab.tsx:32` imports `CHICAGO_HIGHLIGHTS, RESTAURANTS, ACTIVITIES, EVENTS` from
  `src/lib/itinerary-data.ts` — **hardcoded TS module constants**, ~1112 lines, headed
  `SANKOFA 2026`. There is no `trip_id` anywhere in that file.
- The live app renders it unconditionally: `Index.tsx` → `CenterColumn` → `GuideDetail.tsx:6`
  lazy-loads `GuideTab`, which reads those constants **regardless of the active trip**.
- Other consumers of the same arrays: `FavoritesTab.tsx:5`, `MapTab.tsx:10`,
  `preview/collage/pages/variants/FavoritesV1.tsx`, `FavoritesV2.tsx`, and
  `getAllLocations()` at `itinerary-data.ts:1073`.

So appending Charleston restaurants to `RESTAURANTS` would make them appear inside the **Sankofa**
trip's guide, favorites, and static map. That violates "don't disturb Sankofa."

**Chosen resolution — trip-scoped guide registry, purely additive:**
keep `CHICAGO_HIGHLIGHTS` / `RESTAURANTS` / `ACTIVITIES` / `EVENTS` exported **byte-identical** so
every existing consumer keeps compiling and Sankofa's behaviour is unchanged; add parallel
`CHARLESTON_*` arrays plus a `getGuideSets(trip)` resolver; `GuideTab` calls the resolver with the
active trip and falls back to the Chicago set. Sankofa's code path is the same objects it renders today.

`GuideItem` shape to match (`itinerary-data.ts:55`):
`{ id, name, category: 'beach'|'restaurant'|'activity'|'shop'|'attraction'|'essential'|'transport'|'cultural', description, location?: {lat,lng,name,address?}, link?, linkLabel?, phone?, mapLink? }`

---

## 5. Conventions inherited from the April ingest

- `locations.category` mirrors the item category (`'dining'` for restaurants).
- `locations.notes` carries subcategory + neighbourhood + a one-or-two sentence hook.
- `itinerary_items.tags` is a `text[]` used freely; April used `['dining', <sub>, 'shortlist']`.
- `source='manual'`, `external_ref='<batch-slug>'`.
- Coordinates from OSM Nominatim; addresses verified before geocoding.

---

## 6. Geocoding outcome (this session)

35 venues queried against Nominatim, then **reverse-geocoded to verify** rather than trusted.
Verification mattered — four free-text hits were confidently wrong:

| Venue | Bad hit | Why rejected |
|---|---|---|
| Middleton Place | `32.8053,-79.9556` | resolved to a *street named "Middleton Place"* in Wagener Terrace, downtown |
| Mellow Mushroom | `32.8722,-80.0157` | the North Charleston branch, not West Ashley |
| Paisano's | `32.8142,-79.8671` | the Mount Pleasant branch, not West Ashley |
| Famulari's | `32.8269,-80.0393` | *accepted* — reverse-geocode confirmed "Famulari's Pizzeria West Ashley, 1704 F Ashley River Road" |

**31 venues carry verified coordinates. 5 ship with address only and `lat/lng NULL`** — listed in
§7. A missing pin is recoverable; a pin 5 km into the wrong neighbourhood is a wrong answer that
looks like a right one.

---

## 7. Known unmappable (address preserved, no pin)

| Venue | Reason |
|---|---|
| Center for Birds of Prey | best hit was a Hwy 17 street segment ~5 km NE of the site; address `4719 Hwy 17 N, Awendaw` kept |
| Middleton Place | both attempts wrong (see §6); address `4300 Ashley River Rd` kept |
| Middleton Place Equestrian Center | no Nominatim record; nested inside Middleton Place |
| Paisano's Pizza Grill | only the Mount Pleasant branch is indexed; West Ashley address unconfirmed |
| Pirates of Charleston | the source names no address or departure dock |

---

## 8. Write plan (all additive, Sankofa never in a predicate)

| Table | Rows | Notes |
|---|---|---|
| `trips` | 1 | fixed id `c4a71e00-8a3f-4b21-9d55-3c17e0aa2026`; `metadata` carries flights, base, party, anchors, radius |
| `itinerary_days` | 8 | Aug 14–21, `sort_index` 1–8, titles from the source's own day names |
| `locations` | 37 | every addressed venue + all 21 numbered eating-list pins |
| `itinerary_items` | 31 | day blocks only — the eating list stays out of the itinerary |
| `location_days` | 31 | per-day map filtering for the venues a day actually visits |

No `UPDATE`. No `DELETE`. Every `INSERT` names its own fixed UUID with `ON CONFLICT (id) DO NOTHING`,
so the script is re-runnable and cannot touch a row it did not create. Sankofa's id appears in the
script exactly twice — both times inside a read-only `COUNT(*)` proof.
