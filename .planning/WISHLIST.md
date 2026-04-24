# MyKeepsakes — Wishlist

Living list of post-trip improvements, perf wins, and schema/data cleanups. Add items as they're surfaced; close them out as they ship. No estimates — just sized and scoped.

**Convention:**
- 🚀 Perf / runtime speed
- 🧹 Data / schema hygiene
- 🎨 UX polish
- 🧰 Tooling / dev experience

---

## 🚀 Perf — site pace

### Image thumbnails for `memory_media` (high impact)
- **Problem**: Gallery views currently load original-resolution images (some 8.4 MB JPEGs). All 18 Sankofa images currently have `thumbnail_path = NULL`.
- **Plan**: Supabase Edge Function or worker that runs on `memory_media` insert, generates a low-res WebP/AVIF thumb (~50 KB target), writes the path back to `thumbnail_path`. One-off backfill for the existing 18.
- **Where to start**: Look at how the Gallery component selects `storage_path` vs `thumbnail_path`; ensure it falls back gracefully while thumbs are being generated.
- **Wins**: 5-50× page-weight reduction on gallery views.

### Image format upgrade for `memories` originals
- **Problem**: Most existing originals are `.jpg` / `.jpeg` (some 8 MB+). Modern AVIF can be 5-10× smaller at the same perceived quality.
- **Plan**: When the thumbnail pipeline above is built, also produce a hi-quality AVIF copy of each upload. Serve that as the "open full-size" variant; keep the original JPEG for download.
- **Win**: Smaller bandwidth on full-size opens, faster perceived loads.

### Bundle audit + code-splitting
- **Problem**: Not yet measured — likely culprits: full Leaflet bundle on initial paint, large lookup tables in `itinerary-data.ts` (RESTAURANTS, ACTIVITIES, etc) imported eagerly.
- **Plan**: Run `vite build --analyze` (or rollup-plugin-visualizer), find the top 3 contributors, split off the routes/components they're tied to with React.lazy.
- **Win**: Faster Time-to-Interactive, especially on mobile.

### Render audit (memoization)
- **Problem**: Not yet measured — but big lists like Trip Guide and Itinerary likely have re-render patterns worth fixing.
- **Plan**: Profile with React DevTools, find components re-rendering without prop changes, add `React.memo` / `useMemo` where it matters.
- **Note**: Don't over-memoize. Only where measurable.

### Map z-index / layer cost
- **Note**: Recent commits (`0620c91`, `3750330`) addressed Leaflet z-index pane confinement and collage min-height. Watch for related issues if pages with maps feel sluggish — Leaflet pane handling is a common offender.

---

## 🧹 Data / schema hygiene

### Schema type mismatches (post-trip)
- `photos.item_id` is TEXT but should reference `itinerary_items.id` (UUID). Table is empty today.
- `notes.item_id` — same shape, also empty.
- `favorites.item_id` is TEXT for polymorphic targets (item / location / memory) — currently empty for Sankofa.
- **Decision required**: cast to UUID + add FKs (and document the polymorphic case for `favorites`), OR drop the tables entirely if confirmed dead.
- **Why now-ish**: All three are empty. Low-risk window. Once data accumulates, the migration gets harder.

### `dispatches` parent table or column rename
- **Problem**: `trip_share_links.dispatch_id` reuses memory UUIDs; there is no `dispatches` table. The column name is misleading — a reader can't tell what it FKs to.
- **Plan A (light)**: Rename to `target_id` + add `target_type` text column, or document the convention in the schema.
- **Plan B (heavier)**: Create a real `dispatches` table with first-class metadata (title, status, published_at) and proper FKs.
- **Companion**: Update `.planning/AUDIT-2026-04-23.sql` §10 to query `dispatch_items` directly (the original §10 assumed a `dispatches` table that doesn't exist).

### `itinerary_items` CHECK constraint visibility
- **Note**: `item_type ∈ {activity, marker}`, `source ∈ {manual, import}`, `status ∈ {planned, done, skipped}` are all enforced by CHECK constraints, not columns or migrations easily found in code.
- **Plan**: Either move to enum types (so they show in `\d+`-style outputs) or document them in `supabase/schema.md` so future operators don't trip over them.

### Apr 21 placeholder memories
- 3 memories created 2026-03-23 with empty content (`5ff66290`, `503ddba8`, `d2f5512f`). Operator decision pending — delete via UI or attach to a real Apr 21 item.

---

## 🎨 UX polish

### `family_contacts.relationship` blanket gap
- 35 of 35 contacts have empty `relationship`. Likely a UI default that wasn't enforced.
- **Plan**: Surface in the contact form as required (or strongly nudged), then prompt the operator to fill in as a one-time UI flow.
- **Not SQL-able** — needs UI work, not a migration.

### Trip Guide → DB-driven (longer-term)
- **Problem**: `RESTAURANTS`, `ACTIVITIES`, `CHICAGO_HIGHLIGHTS`, `EVENTS` in `src/lib/itinerary-data.ts` are hardcoded TS arrays. Fine for one trip; doesn't generalize.
- **Plan**: Move guide content to a `trip_guide_items` table or extend `locations` with an `is_guide_pick` flag + per-trip filter. UI reads from DB, "Add to Day" still works.
- **Win**: Operator can curate per-trip without redeploying.

### Share link expiry policy
- 90-day default applied to existing links 2026-04-24. Future share links should also default to 90 days unless operator overrides — confirm UI default matches.

---

## 🧰 Tooling / dev experience

### Audit script v2
- Address the schema drift uncovered while running `AUDIT-2026-04-23.sql`:
  - §10 needs to query `dispatch_items` directly (no `dispatches` table)
  - `photos`/`notes` orphan checks need `::text` casts on the join (FK type mismatch)
  - Add a §14 covering `family_contacts.relationship` gap (which the v1 audit found but didn't include in the queries themselves)
- Bundle as `.planning/audits/AUDIT-vNEXT.sql` so old audits stay archival.

### Migration verification harness
- After each deploy in `.planning/CLEANUP-*.sql` / `INGEST-*.sql`, the inline `SELECT` verification block has been valuable. Formalize into a small helper that runs the verification SELECTs, asserts counts, and exits non-zero on mismatch — usable from CI or pre-merge.

---

## Done log

Move items here as they ship. (Reverse-chronological.)

- **2026-04-24** Sankofa cleanup batch (CLEANUP-2026-04-24.sql) — 7 sections applied: venue address fix, Marriott geocode, FLW + Invicto location creation, orphan deletes, share-link expiry, memory backfill.
- **2026-04-24** Chicago food shortlist seeded (INGEST-2026-04-24-chicago-food.sql) — 30 locations + 30 itinerary_items. Items later removed from itinerary; locations retained as map pins. Picks now live in the Trip Guide "Where to Eat" section (hardcoded TS).
