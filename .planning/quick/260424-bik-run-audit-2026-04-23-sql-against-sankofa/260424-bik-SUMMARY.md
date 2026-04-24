# Quick 260424-bik — Sankofa Data Audit (read-only)

**Date:** 2026-04-24
**Trip:** Sankofa 2026 — Healing, Justice & Sacred Care
**trip_id:** `cb6f65f0-b34b-467a-a206-051cc8914db0`
**Window:** 2026-04-20 → 2026-04-26
**Source:** `.planning/AUDIT-2026-04-23.sql` (sections 0–13, plus follow-up checks for schema oddities the script's queries surfaced)
**Mutations applied:** none. This is read-only.

---

## TL;DR — what's worth fixing

| Sev | Finding | Where |
|-----|---------|-------|
| 🔴 | Selected stay (Marriott Oak Brook) has **null lat/lng** — map pin won't render | `accommodations` |
| 🟠 | **18 image media missing `thumbnail_path`** — gallery loads full-res (some 8MB+) | `memory_media` |
| 🟠 | **35 family_contacts, all 35 missing `relationship`**; only 3 have phone | `family_contacts` |
| 🟡 | **2 itinerary_items without location** (FLW House Apr 21, Taqueria Invicto Apr 22) | `itinerary_items` |
| 🟡 | **2 orphan locations** (Midway Airport, Seasons 52) not referenced by any item/memory/location_day | `locations` |
| 🟡 | **10 of 20 memories missing `itinerary_item_id`** (snapshot's known backfill list) | `memories` |
| 🔵 | `trip_share_links.dispatch_id` reuses memory UUIDs (works, but column name is misleading) | schema oddity |
| 🔵 | `photos.item_id` / `notes.item_id` are **TEXT** vs `itinerary_items.id` UUID → no FK possible | schema oddity |
| ✅ | No cross-trip leakage anywhere; no missing days; no duplicate days; all storage paths well-formed | — |

Full per-section results below.

---

## §0 Trip discovery

```
id:         cb6f65f0-b34b-467a-a206-051cc8914db0
title:      Sankofa 2026 — Healing, Justice & Sacred Care
created:    2026-03-23
start/end:  2026-04-20 → 2026-04-26
metadata:   present
```

(Only one trip exists in the database — no risk of grabbing the wrong one.)

---

## §1 Day coverage — ✅ clean

All 7 expected days present, in order, no duplicates.

| date | day_id | title |
|------|--------|-------|
| 2026-04-20 | fe73122f… | Travel Day — EWR → ORD |
| 2026-04-21 | bab220ee… | Sankofa Day 1 — Opening & Registration |
| 2026-04-22 | 7c2b92ed… | Sankofa Day 2 — Deep Work |
| 2026-04-23 | 5a7e1944… | Sankofa Day 3 — Healing & Leadership |
| 2026-04-24 | fbf9b135… | Sankofa Day 4 — Closing |
| 2026-04-25 | cd99fce2… | Free Day — Explore Chicago |
| 2026-04-26 | 5d0c4e40… | Departure Day — ORD → EWR |

---

## §2 Itinerary items

Counts per day: **36 items total** (3 / 4 / 8 / 6 / 12 / 2 / 1 across the 7 days). Day 4 (closing) is the heaviest.

- **Cross-trip leak:** none. Every item.day_id resolves to a Sankofa day.
- **Items missing `location_id`:** 2 — likely intentional but worth eyeballing:

| id | title | category | start_time | day |
|----|-------|----------|------------|-----|
| `d6d0a645…` | Frank Lloyd Wright House | activity | 10:00 | 2026-04-21 |
| `3f2d7f8c…` | Taqueria Invicto | dining | 18:15 | 2026-04-22 |

Both are real places — they should be linkable to a `locations` row via Place ID lookup if you want them on the map.

---

## §3 Locations

- **No-coords / no-address / duplicate name:** none. Every Sankofa location has lat+lng and an address.
- **Orphan locations** (no item, no memory, no `location_days` link):

| id | name | category |
|----|------|----------|
| `94284cec…` | Midway International Airport | transport |
| `132cca85…` | Seasons 52 | dining |

These show on the map but nothing references them. Either link them to an itinerary item or delete.

---

## §4 Memories — 20 total

| total | with_item | without_item | with_day | with_location | fully_unlinked |
|-------|-----------|--------------|----------|---------------|----------------|
| 20 | 10 | **10** | 20 | 13 | 0 |

- **Cross-trip leakage:** none.
- **The 10 backfill candidates** (no `itinerary_item_id`):

| id | day | location | preview |
|----|-----|----------|---------|
| `75576b07…` | 2026-04-22 | Sankofa Conference Venue | "Breathing / Sacred service with silent strain…" |
| `53d8bb02…` | 2026-04-22 | Sankofa Conference Venue | "Breathing / Sacred service with silent strain" |
| `953aa178…` | 2026-04-22 | Sankofa Conference Venue | "Breathing" |
| `e178c042…` | 2026-04-20 | (none) | "A great start to our trip!" — *also referenced by a share link* |
| `ac07758d…` | 2026-04-20 | Chicago Marriott Oak Brook | (no note, photo only) |
| `12bee5d8…` | 2026-04-20 | Chicago Marriott Oak Brook | (no note, photo only) |
| `bde88eb1…` | 2026-04-20 | Chicago Marriott Oak Brook | (no note, photo only) |
| `5ff66290…` | 2026-04-21 | (none) | (empty) — *also referenced by a share link* |
| `503ddba8…` | 2026-04-21 | (none) | (empty) |
| `d2f5512f…` | 2026-04-21 | (none) | "I am cool" |

The 7 hotel/Apr-20 ones could plausibly be auto-linked to whichever Apr-20 itinerary_item shares the location. The 3 "Breathing" notes from Apr 22 14:00–14:13 likely belong to one Day-2 morning session item.

---

## §5 memory_media

- **Orphans:** 0.
- **Coverage:** 14 memories carry 18 media items totaling ~36 MB.
- **🟠 Images missing `thumbnail_path`:** **18** (i.e. every image — no thumbs have been generated for Sankofa). Worst offenders:

| memory | bytes | path |
|--------|-------|------|
| `a70fd864…` | 8.47 MB | …/948c6732…/original.jpeg |
| `01831862…` (×3) | 6.83 MB total | …/85ec17f2, 88e59f23, be6af7cd / original.jpeg |
| `ac07758d…` | 3.11 MB | …/d72b0012…/original.jpg |
| `7a801255…` | 2.96 MB | …/bd5c2c72…/original.jpeg |
| `d2f5512f…` | 2.97 MB | …/91f79121…/original.jpg |
| `75576b07…` | 2.48 MB | …/4b2c6987…/original.jpg |
| `12bee5d8…` (×2) | 4.69 MB total | …/4a478bff, b905095e / original.jpg |

Gallery views currently fetch the originals. Smaller `.avif` files (40-50 KB) also lack thumbs but the size cost is negligible there.

---

## §6 Photos (legacy table) — ✅ empty / clean

- `photos` table contains **0 rows**.
- No orphans, no Sankofa photos, no non-Sankofa photos. The legacy per-itinerary-item photo path is fully unused.
- The snapshot's "no `trip_id` scoping, no FK on `item_id`" warning is moot in practice because the table is empty.

---

## §7 Notes (legacy) — ✅ empty / clean

- `notes` table contains **0 rows**.
- Same caveat as §6: schema is loose (TEXT `item_id`, no FK) but unused, so nothing to repair.

---

## §8 Accommodations

- 1 row, 1 selected: **Chicago Marriott Oak Brook**, 2026-04-21 21:00 → 2026-04-24 17:00, address present, notes present, URL absent.
- **🔴 `location_lat` and `location_lng` are NULL** — map pin for the selected stay won't render. (`location_place_id` column does not exist on `accommodations`; coords are stored directly.)
- Selected count: 1 ✅ (no multi-select bug).

---

## §9 Favorites — n/a

- 0 favorites for Sankofa. No orphans across the table either.
- Feature is unused; nothing to clean.

---

## §10 Dispatches — schema differs from audit assumption

- The audit script's `FROM dispatches` query failed: **the `dispatches` table does not exist**. Only `dispatch_items` and `trip_share_links` are present in `public`.
- `dispatch_items` columns: `id, dispatch_id, item_type, item_id, sort_order, section, created_at` — i.e. dispatches are virtual; rows are grouped by a shared `dispatch_id` UUID with no parent table.
- Across the whole DB: **6 `dispatch_items` rows under 3 distinct `dispatch_id`s.** A Sankofa-scoped breakdown would require joining `item_id` back to `itinerary_items` / `memories` per `item_type`.

Action item for the script: update `AUDIT` §10 to query `dispatch_items` directly (group by `dispatch_id`, count items, check `item_type` distribution). Or add a `dispatches` table if the product needs first-class dispatch metadata.

---

## §11 Share links

2 share links for Sankofa, both `permission = read`, **both with no expiry** (intentional, but flagging since "no expiry" is the kind of thing operators forget about):

| share_id | dispatch_id | created |
|----------|-------------|---------|
| `1d487789…` | `e178c042…` | 2026-04-21 |
| `8d1a1d34…` | `5ff66290…` | 2026-03-23 |

**Schema oddity:** both `dispatch_id` values resolve to **two different things at once**:
- They exist as `memories.id` (one is the "A great start to our trip!" memory)
- They also exist as `dispatch_items.dispatch_id` (so they group dispatch_items rows)

So the convention here is "a dispatch's UUID *is* its anchor memory's UUID." That's workable but the column name `dispatch_id` is misleading — a reader can't tell what the FK target is. Worth renaming or documenting in the schema.

---

## §12 Family contacts

| total | with_phone | missing_relationship |
|-------|------------|----------------------|
| 35 | 3 | **35** |

Two distinct gaps:
- **Every single contact has an empty `relationship`** — likely a UI default that was never enforced. If the share/dispatch UI surfaces contacts with their relationship label, all 35 will render blank.
- Only 3 of 35 have a phone number. This is probably fine for an email-first contact list, but worth confirming.

---

## §13 Storage path sanity — ✅ clean

- `memory_media` bad paths (NULL/empty/no `/`): 0
- `photos` bad paths: 0

---

## Out-of-script schema findings (surfaced while running the audit)

Two type mismatches that prevent FK enforcement:

| table | column | type | should reference | actual type |
|-------|--------|------|------------------|-------------|
| `photos` | `item_id` | text | `itinerary_items.id` | uuid |
| `notes` | `item_id` | text | `itinerary_items.id` | uuid |
| `favorites` | `item_id` | text | polymorphic (item/location/memory) | all uuid |

`photos` and `notes` are empty so no orphans today. `favorites` is also empty for Sankofa. But if any of these tables are revived, orphans will accumulate silently — no FK can be added without a type cast migration first.

The audit script's queries on these joined `ii.id = p.item_id` (uuid = text) which Postgres rejects with `42883`. The recast versions used `ii.id::text = p.item_id` and confirmed both tables are empty.

---

## Recommended cleanup batches (for a follow-up file — NOT applied here)

Grouped by safety class so each can be reviewed and run independently.

1. **Backfill / safe enrichment** (no destructive changes):
   - Fill `accommodations.location_lat`/`location_lng` for the Marriott (geocode the address).
   - Generate thumbnails for the 18 untanned `memory_media` images (background job, not SQL).
   - Backfill `memories.itinerary_item_id` for the 10 candidates by joining `m.day_id + m.location_id` to `itinerary_items` and picking the closest by time, with manual review for ambiguous cases.

2. **User-decision required**:
   - 2 orphan locations (Midway, Seasons 52): link to an itinerary item, or delete.
   - 2 itinerary items with no location: attach a `locations` row, or leave intentionally pin-less.
   - `family_contacts.relationship` blanket gap: surface via the UI for the user to fill in (35 records — bulk SQL update isn't appropriate).
   - Share-link expiry policy: do nothing, or set a default `expires_at` going forward.

3. **Schema migrations** (separate review, requires a versioned migration):
   - Cast `photos.item_id`, `notes.item_id`, `favorites.item_id` to `uuid`; add FKs (or drop the tables if confirmed dead).
   - Either create a `dispatches` parent table or rename `trip_share_links.dispatch_id` to something accurate (e.g. `target_id` + `target_type`).
   - Update `AUDIT-2026-04-23.sql` §10 to match actual schema.

No SQL is being run for any of the above without explicit go-ahead.
