# Quick 260424-bik — Deploy Summary

Follow-up to the read-only audit (`260424-bik-SUMMARY.md`). Records which mutations were actually applied and what schema gotchas surfaced during execution.

**Applied:** 2026-04-24
**Trip:** Sankofa 2026 (`cb6f65f0-b34b-467a-a206-051cc8914db0`)
**SQL files:**
- `.planning/CLEANUP-2026-04-24.sql` — audit-driven fixes
- `.planning/INGEST-2026-04-24-chicago-food.sql` — 30-spot Chicago food shortlist

---

## Cleanup batch — 7 sections, all verified

| § | Change | Rows |
|---|--------|------|
| A | Sankofa Conference Venue address → 1401 W 22nd St, Oak Brook + new coords | 1 UPDATE |
| B | Marriott accommodation geocoded to 41.8458619, -87.9527972 | 1 UPDATE |
| C | Created "Frank Lloyd Wright Home & Studio" location, attached to Apr 21 item | 1 INSERT + 1 UPDATE |
| D | Created "Taqueria Invicto" location (1715 W 22nd St), attached to Apr 22 item | 1 INSERT + 1 UPDATE |
| E | Deleted orphan locations (Midway Airport, Seasons 52) | 2 DELETEs |
| F | 90-day expiry added to 2 share links | 2 UPDATEs |
| G | Backfilled `itinerary_item_id` on 7 of 10 unlinked memories | 7 UPDATEs |

**Deliberately skipped:** the 3 pre-trip placeholder memories (`5ff66290`, `503ddba8`, `d2f5512f` — all created 2026-03-23 with empty content on Apr 21). Left for operator to delete or attach via UI.

**Verification** (after apply):
- `orphan_locations_remaining` = 0 ✅
- `share_links_still_no_expiry` = 0 ✅
- `memories_without_item_after_backfill` = 3 ✅ (exactly the 3 placeholders)
- Conference Venue + Marriott coords populated ✅
- FLW + Invicto items now have `location_id` set ✅

---

## Ingest batch — 30 Chicago food spots on Apr 25

Attached to "Free Day — Explore Chicago" (day_id `cd99fce2…`) as un-scheduled `dining` items, matching the Apr 24 shortlist pattern. Apr 25 now has **32 total itinerary_items** (2 pre-existing: Brookfield Zoo, Downtown Chicago; plus 30 new dining entries).

Every row has:
- `locations.category = 'dining'`, `notes` prefixed with food subcategory + neighborhood + 1–2 sentence hook
- `itinerary_items.category = 'dining'`, `item_type = 'activity'`
- `tags = ['dining', <subcategory>, 'shortlist']`
- `source = 'manual'`, `external_ref = 'chicago-food-shortlist-2026-04-24'`

**Subcategory breakdown (5 each):** burgers, italian-beef, pizza, sushi, tacos, steak.

**Multi-location picks** (operator-confirmed during deploy):
- Buona → Streeterville (613 N McClurg Ct)
- Carnitas Uruapan → Pilsen original (1725 W 18th St)
- 3LP Chi → Hyde Park (1321 E 57th St)

All 30 addresses verified via WebSearch; coords from OSM Nominatim (building-level except Taqueria Invicto from cleanup §D which resolved to street-segment).

---

## Schema gotchas discovered during apply

Three check constraints on `itinerary_items` that weren't visible in the earlier audit:

| Column | Check | Allowed values |
|--------|-------|----------------|
| `item_type` | `itinerary_items_item_type_check` | `'activity'`, `'marker'` only |
| `source` | `itinerary_items_source_check` | `'manual'`, `'import'` only |
| `status` | `itinerary_items_status_check` | `'planned'`, `'done'`, `'skipped'` only |

**Implication:** The fine-grained "dining"/"event"/"transport" distinction lives entirely in `itinerary_items.category` (TEXT, no check constraint). `item_type` is a coarser bucket. If app code ever reads `item_type` expecting "dining", it would break — use `category` instead.

**Batch identifier convention:** `source` is constrained so custom batch markers like `'manual:chicago-food-shortlist-2026-04-24'` will fail. Put those in `external_ref` (unconstrained TEXT). That's how the ingest batch is now trackable — `WHERE external_ref = 'chicago-food-shortlist-2026-04-24'` returns exactly 30 rows.

---

## Still outstanding from original audit (not addressed in this deploy)

- **🟠 18 image `memory_media` missing `thumbnail_path`** — requires a worker/Edge Function, not SQL.
- **🟠 35/35 `family_contacts` with empty `relationship`** — UI default issue; bulk SQL update isn't appropriate.
- **🔵 Schema type mismatches** (`photos.item_id` TEXT vs UUID, `notes.item_id` TEXT vs UUID, `favorites.item_id` TEXT vs UUID) — would need versioned migration; tables all empty so no data impact today.
- **3 pre-trip placeholder memories** — operator decision pending.
