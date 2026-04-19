# MyKeepsakes — Collage Migration Completion Plan

**Intended reader:** a fresh Claude Code session with no prior context. Everything you need to continue this migration is in this file or linked from it. Read it top-to-bottom before touching anything.

**Working directory for all work:** `C:/Users/shawn/OneDrive/Documents/ADL-Foundry/GitRepositories/mykeepsakes` (use this as the repo root. All paths below are relative to it unless prefixed with `~` for the user's home.)

---

## Context

MyKeepsakes is a multi-trip memory platform (React + Vite + TypeScript + Tailwind + shadcn/ui + Supabase). The first trip it serves is **Sankofa CPE 2026** — a chaplains' Clinical Pastoral Education conference in Chicago (April 20–26, 2026). Primary users: Shawn (🦅) + Dan (🐘), both Beacon UU chaplains. The app is PIN-gated with emoji authentication.

Across the prior working sessions we:
1. Decided to reskin the app from its "Beach theme" (warm cream + ocean + sunset, Playfair + Inter) to a **Collage direction** (scrapbook/field-notebook; Rubik Mono One + IBM Plex Serif + Caveat; ink / crème / pen-blue / tape-yellow).
2. Iterated 2–3 layout variants per surface against real seeded Sankofa data.
3. Locked a winning variant per surface.
4. Started migrating production code from Beach → Collage, starting with the smallest-blast-radius components (PIN entry, CompactHeader).

**Your job:** finish the migration. Every production surface of the authenticated app should be on the Collage direction by the time you're done. The user wants this ready to demo to Dan (his co-user) and then live-use during the conference April 20–26, 2026.

---

## Ground rules (important — read carefully)

1. **Do not touch Supabase schema, seed scripts, or the edge function `verify-user-pin`.** Those are load-bearing data surfaces. If a field appears missing, adapt the UI, don't reshape the data.
2. **Non-destructive preview stays untouched.** Everything under `src/preview/collage/` is the demo surface. Migrations read FROM there but do not rewrite those files. Picks have been locked via default-variant selection in each dispatcher — respect them.
3. **Migration pattern is: swap presentation, preserve logic.** Every production component has working state/hooks/API calls. Your job is presentation only. If you find yourself rewriting a hook or a fetch, stop and reconsider.
4. **Scope CSS via `className="collage-root"` on the component's outer wrapper** when migrating. That loads the Collage tokens without leaking into siblings. See `src/components/MultiUserPinEntry.tsx` and `src/components/dashboard/CompactHeader.tsx` as worked examples.
5. **Type-check after every production-code change:** `./node_modules/.bin/tsc --noEmit` must exit 0 before moving on.
6. **The user values cadence over perfection.** Ship a migration, then iterate. Don't gold-plate.
7. **Ask the user when a genuine fork exists** (two valid interpretations of "migrate the Dashboard"). Do NOT ask about routine progress, wiring, or type-check-time decisions. The user has given blanket approval for the migration pattern.

---

## What's already done

### Locks (per-surface variant decisions)

All locks live at `.planning/DESIGN-SYSTEM.md` under "Locked layouts (per surface)". Each dispatcher at `src/preview/collage/pages/Collage<Name>.tsx` has been updated to default to the chosen variant; `?v=N` still routes to a specific variant for comparison.

| Surface | Chosen | Dispatcher default |
|---|---|---|
| Dashboard | **V2 — Center Altar** | `CollageDashboard.tsx` → V2 |
| Day | **V2 — Session Blocks** | `CollageDay.tsx` → V2 |
| Memory | **V3 — Scrapbook Spread** | `CollageMemory.tsx` → V3 |
| PIN | **V1 — Centered Card** | `CollagePin.tsx` → V1 |
| Guide | **V2 — Curator's Folio** | `CollageGuide.tsx` → V2 |
| Map | **V1 — Annotated Pinboard (real Leaflet tiles)** | `CollageMap.tsx` → V1 |
| People | **V2 — Who's Who Index** | `CollagePeople.tsx` → V2 |
| Album | **V1 — Scrapbook Pages by Day** | `CollageAlbum.tsx` → V1 |
| Dispatch | **V2 — Split Workspace** | `CollageDispatch.tsx` → V2 |
| Shared-Trip | **V1 — Single Long Letter** | `CollageSharedTrip.tsx` → V1 |
| Lodging | **V1 — Concierge Card** | `CollageLodging.tsx` → V1 |
| Reflection | **V2 — Index Card** | `CollageReflection.tsx` → V2 |
| Connection | **V2 — Index Card + Live Preview** | `CollageConnection.tsx` → V2 |

### Production migrations completed

| Component | Path | Notes |
|---|---|---|
| PIN entry | `src/components/MultiUserPinEntry.tsx` | Wrapped in `<CollageRoot>`. Auth logic (edge function, rate-limit lockout, sessionStorage) unchanged. Also created `src/components/auth/CollageEmojiPad.tsx` (sibling of the Beach EmojiPinPad — PinSetup + SettingsDialog still use the original). |
| CompactHeader | `src/components/dashboard/CompactHeader.tsx` | Scoped via `className="collage-root"` on outer div. Includes mode badge (pen-blue / success / muted), ink MK logo, tape accent. |

### Preview surfaces built (non-production — reference only)

10 Collage preview surfaces under `src/preview/collage/pages/` with 2–3 variants each (30 variant files total). Each accessible at `/preview/collage/<name>[?v=N]`. Plus one sibling surface `/preview/collage-shared` (no shell chrome — feels like opening a letter).

**Preview shell:** `src/preview/collage/CollageShell.tsx` — tab bar, variant chip switcher (Q/W/E keyboard), page shortcuts (1–9), "Preview as visitor →" link to shared-trip, "Back to Beach theme" link.

### Reference artifacts (the truth)

- `.planning/BRIEF.md` — the engagement brief. Sankofa framing, audience, tone, constraints.
- `.planning/DESIGN-SYSTEM.md` — **the tokens truth**. Colors, type, spacing, motion, Do/Don't, locked layouts table.
- `.planning/variations/v1-collage.html` — the original standalone mockup (corrected Apr 17 to Chicago CPE framing).
- `~/.claude/skills/p/` — the `/p` (pretty) skill that was used to run the consult→consider→deploy→refine workflow. Not load-bearing for this plan, but context.
- `~/.claude/projects/C--Users-shawn/memory/` — user-level memory (auto-loaded). Key pointers: `project_pretty_skill.md`, `project_mykeepsakes_multitrip.md`, `user_shawn_profile.md`.

---

## Design tokens (condensed from DESIGN-SYSTEM.md)

Load via `import '@/preview/collage/collage.css';` and wrap the target content with `className="collage-root"` or `<CollageRoot>`.

```
--c-ink:        #1D1D1B   (body text, primary button, stamps)
--c-ink-muted:  #4A4843   (secondary text, captions)
--c-creme:      #F7F3E9   (page background, button-text-on-ink)
--c-pen:        #1F3CC6   (accent, links, secondary CTAs, active nav)
--c-tape:       #F6D55C   (tape strips, marker fills, highlights)
--c-paper:      #FFFFFF   (card surface, elevated content)
--c-line:       rgba(29,29,27,.12)  (hairlines, dividers)
--c-shadow:     0 8px 24px -6px rgba(29,29,27,.22)
--c-r-sm/md/lg: 2 / 4 / 6 px   (radii — sharp, not rounded)
--c-t-fast/med/slow: 140 / 240 / 420 ms   (motion)
--c-font-display: 'Rubik Mono One' (stamps, uppercase, ≥14px)
--c-font-body:    'IBM Plex Serif' (all reading, forms, UI)
--c-font-script:  'Caveat' (handwritten accents — decorative only, never required-to-read)
```

**Semantic colors:**
- success: `#3C7A4E`, warn: `#C27814`, danger: `#A83232`, info: `var(--c-pen)`

**Hard rules:**
- No Inter, Roboto, Arial, Space Grotesk as display fonts.
- No rounded-xl buttons (paper-flat aesthetic).
- No purple-on-white gradients.
- Caveat script never for AT-readable copy.
- `prefers-reduced-motion` must kill rotation, translate, entrance stagger — fall back to instant fades.

---

## What's left to ship (execution order)

### Phase 1 — Resolve pending picks ✅ Complete (2026-04-18)

All three pending picks locked. See `.planning/DESIGN-SYSTEM.md` "Locked
layouts (per surface)" for rationale on each:

- **Lodging → V1 Concierge Card** — one honored paper card for the chosen stay
- **Reflection → V2 Index Card** — bounded surface invites honesty over performance
- **Connection → V2 Index Card + Live Preview** — consistent with Dispatch split-workspace pattern

Dispatchers at `src/preview/collage/pages/Collage{Lodging,Reflection,Connection}.tsx`
already default to the chosen variants.

### Phase 2 — Finish the demo sweep (4 surfaces, ~1 turn with parallel agents)

The following production surfaces have not been demoed in Collage yet. Build 2 variants per surface using the agent-delegation template (see "Execution playbook" below).

| Surface | Production component | Data hooks | Rough V1/V2 ideas |
|---|---|---|---|
| **Favorites** | uses `favorites` table + `src/hooks/` favorites hook (check for `use-favorites.ts`) | polymorphic (items/locations/memories) | V1 "Pin Wall" (taped starred items with context), V2 "Shortlist" (ordered reading list) |
| **Export dialog** | `src/components/export/ExportDialog.tsx` | `src/hooks/use-export.ts`, `use-sharing.ts` | V1 "Sealed Envelope" (decorative wrap + URL reveal), V2 "Address Label" (recipient-forward, email-style) |
| **Settings dialog** | `src/components/SettingsDialog.tsx` | `usePin` from `use-trip-data.ts` | V1 "Inside Cover" (book metadata), V2 "Receipt Pad" (audit/log aesthetic) |
| **Trip selector** | part of CompactHeader / dashboard | `useTrips()` from `use-trip.ts` | V1 "Bookshelf" (spine row of trip cards), V2 "Ticket Counter" (stub-style list). Currently only 1 trip exists — design for thin-data gracefully. |

Route these under `/preview/collage/{favorites,export,settings,trips}` in `src/App.tsx` inside the CollageShell parent route. Add tabs to `src/preview/collage/CollageShell.tsx` under the `system` group. Extend `VARIANT_COUNT` too.

### Phase 3 — Pick approvals for Phase 2 surfaces

Show the user the 4 new preview URLs; lock picks per the same protocol (Phase 1 step 2–3).

### Phase 4 — The big migrations (production code)

Priority order (from `.planning/DESIGN-SYSTEM.md`):

1. **Dashboard — Center Altar.** The deepest migration. Touches `src/pages/Index.tsx` + `src/components/dashboard/DashboardLayout.tsx` + `SwipeableDashboard.tsx` + the three columns (`LeftColumn`, `CenterColumn`, `RightColumn`) + the many `DetailPanels/*`. Recommended approach:
   - Step 4a. Wrap the authenticated shell with `<CollageRoot>` in `Index.tsx` (1-line change, tokens now load everywhere inside).
   - Step 4b. Restyle `DashboardLayout.tsx` + `SwipeableDashboard.tsx` outer chrome (background, column dividers, header band) using Collage tokens. No structural changes yet.
   - Step 4c. Migrate one column at a time: CenterColumn first (it's the main surface and renders DetailPanels). LeftColumn second (navigation). RightColumn third (context panel).
   - Step 4d. For each DetailPanel (`PhotoDetail`, `ActivityDetail`, `LocationDetail`, `StayDetail`, `GuideDetail`, `PackingDetail`, `AlbumExperience`, `DefaultCenterContent`): restyle to Collage tokens. These are ~40–80 LOC each; each one can be a single agent task.
   - Step 4e. The Center Altar composition lives in `src/preview/collage/pages/variants/DashboardV2.tsx` — use it as a REFERENCE for the aesthetic, not a drop-in replacement. The real Dashboard is an operating console; the Altar is a landing. You may need to adapt.

2. **Itinerary — Session Blocks.** `src/components/itinerary/ItineraryTab.tsx` + its child components (`TimelineView`, `TimelineItem`, `DraggableActivity`, etc.) + the database variants (`DatabaseItineraryTab`, `DatabaseDayCard`). The chosen layout is `DayV2.tsx` — Morning/Midday/Afternoon/Evening blocks. Port that grouping logic to `ItineraryTab`. Preserve all the interactivity (drag-reorder, edit dialogs, time-based filters).

3. **Dispatch composition — Split Workspace.** `src/components/dispatch/DispatchEditor.tsx` + `DispatchPreview.tsx`. Chosen layout is `DispatchV2.tsx`. Form-heavy — preserve all field handlers.

4. **Memory views — Scrapbook Spread.** The memory detail view (wherever it lives — likely as a `MemoryCaptureDialog` / `MemoryEditDialog` or a DetailPanel). Chosen layout is `MemoryV3.tsx`.

5. **Album / Photos.** `src/components/album/AlbumTab.tsx` + `DayPhotoGrid`, `PlacePhotoGrid`, `RecentPhotoGrid`. Chosen: `AlbumV1.tsx` (by-day scrapbook pages). Preserve the `KenBurnsImage` animation but restyle the card wrap.

6. **Map.** `src/components/map/MapTab.tsx` + `OverviewMap.tsx`. Chosen: `MapV1.tsx` (real Leaflet tiles + Collage overlay chrome). The existing production MapTab already uses Leaflet — you're adding Collage decoration on top. Reuse the CartoDB Voyager tile URL + sepia-wash filter from `MapV1.tsx`.

7. **People / Contacts / Family.** `src/components/contacts/*`, `src/components/connections/*`. Chosen: `PeopleV2.tsx` (Who's Who Index).

8. **Guide tab.** `src/components/guide/GuideTab.tsx` + `PhotoAlbumSection`, `StayCard`. Chosen: `GuideV2.tsx` (Curator's Folio).

9. **Lodging tab.** `src/components/lodging/LodgingTab.tsx` + `LodgingLinkTile`, etc. Chosen: once Phase 1 resolves.

10. **Reflection & Connection sheets.** `src/components/reflection/ReflectionCaptureSheet.tsx`, `src/components/connections/ConnectionCaptureSheet.tsx`. Production components are `Sheet` (shadcn) drawers. Keep the `Sheet` primitive for the slide-up animation but restyle the internal content with Collage tokens + layouts from `ReflectionV*.tsx` / `ConnectionV*.tsx`.

11. **Shared-Trip production page.** `src/pages/SharedTrip.tsx` + `src/pages/SharedDispatch.tsx`. Replace presentation with the chosen `SharedTripV1` layout. **Note:** the preview variants use `useActiveTrip()` which reads the authenticated user's current trip. The production route is `/shared/:token` — the component reads the trip via the token. Adapt the data-fetching but preserve the presentation structure.

12. **Remaining PIN surfaces.** `src/components/PinSetup.tsx` + `src/components/SettingsDialog.tsx` still use the Beach-themed `EmojiPinPad`. Swap in `CollageEmojiPad` (already exists at `src/components/auth/CollageEmojiPad.tsx`) and restyle the surrounding chrome to Collage.

### Phase 5 — Retire the Beach theme

When Phase 4 is complete and all production surfaces render Collage:

1. Move `src/preview/collage/` out of `/preview/` to `src/collage/` or `src/theme/collage/`. The preview framing is no longer accurate — this IS the app now.
2. Delete the `/preview/collage/*` and `/preview/collage-shared` routes from `App.tsx`. Delete `CollageShell.tsx`. Delete variant comparison files. Keep the winning variant for each surface ONLY.
3. Remove Beach theme tokens from `tailwind.config.ts` (the `beach-*` extensions). Update `src/index.css` to drop beach-gradient/sunset-gradient utilities.
4. Update `package.json` name/version as appropriate.
5. Update `.planning/BRIEF.md` to reflect "shipped" status.
6. User-memory update: append to `project_mykeepsakes_multitrip.md` that the Collage direction shipped on `<date>`.

### Phase 6 — Pre-conference verification

Sankofa starts April 20, 2026. Before then:

1. Run `npm run build` — production bundle must succeed.
2. Deploy to the staging/production host (check `.planning/` or git history for the deploy target; otherwise ask the user).
3. Load on desktop + mobile (390×844). Walk every authenticated page with a real Sankofa trip selected.
4. Verify offline behavior if any PWA shell is present.
5. Hand off to user for a co-review with Dan.

---

## Execution playbook

### Migrating a Beach component to Collage

Pattern (follow this for every migration in Phase 4):

```tsx
// src/components/<path>/<Component>.tsx — migrated
import { ... existing imports ... } from '...';
import '@/preview/collage/collage.css';  // loads tokens under .collage-root
// import these if you'll use them; each is <80 LOC, tree-shakes fine:
import { Stamp } from '@/preview/collage/ui/Stamp';
import { StickerPill } from '@/preview/collage/ui/StickerPill';
import { PolaroidCard, resolveMood } from '@/preview/collage/ui/PolaroidCard';
import { MarginNote } from '@/preview/collage/ui/MarginNote';
import { Tape } from '@/preview/collage/ui/Tape';

export function Component(props) {
  // === existing hooks, state, handlers — UNCHANGED ===
  // ... all of it ...

  return (
    <div className="collage-root" style={{ /* your outer layout */ }}>
      {/* Your Collage JSX here — refer to the corresponding
          src/preview/collage/pages/variants/<Chosen>V<N>.tsx for the design */}
    </div>
  );
}
```

**When the component is a dialog / sheet / popover:** don't wrap with `collage-root` — wrap the CONTENT slot instead. The shadcn primitives handle their own overlay/positioning. Example: `<DialogContent><div className="collage-root">...</div></DialogContent>`.

**When the component is nested inside another already-Collage-wrapped parent:** you can rely on the outer `.collage-root` and skip the wrapper. Tokens cascade via CSS variables.

### Delegating a demo surface build to an agent

Use this prompt template (trim/expand as needed):

```
Build a new Collage-styled <SURFACE> preview for MyKeepsakes.
Parallel preview — do NOT touch production Beach-themed code.

Repo: C:/Users/shawn/OneDrive/Documents/ADL-Foundry/GitRepositories/mykeepsakes

Read first (do not edit):
- .planning/DESIGN-SYSTEM.md — Collage tokens
- src/preview/collage/ui/* — Stamp, Tape, PolaroidCard, MarginNote, StickerPill
- src/preview/collage/pages/variants/<REFERENCE_VARIANT>.tsx — pattern
- src/preview/collage/pages/CollageDay.tsx — dispatcher pattern
- src/hooks/<RELEVANT_HOOKS>.ts
- src/types/trip.ts (and conference.ts) — types

Files to create:
1. src/preview/collage/pages/variants/<Name>V1.tsx
2. src/preview/collage/pages/variants/<Name>V2.tsx
3. src/preview/collage/pages/Collage<Name>.tsx — dispatcher, defaults to V1

V1 proposal — <NAME>: <DESCRIPTION>
V2 proposal — <NAME>: <DESCRIPTION>

Must-haves:
- Real data from <HOOKS>
- Handle empty state gracefully
- Pass `./node_modules/.bin/tsc --noEmit` zero errors
- Primitives from '../../ui/'
- Docblock at top of each variant
- prefers-reduced-motion respected

Do NOT: edit App.tsx/CollageShell.tsx, install packages.

When done: short summary (<120 words) — files, one-line per variant, dispatcher path, tsc confirmation.
```

Run 3 agents in parallel per turn; each writes to its own non-overlapping set of files.

### Wiring a new preview surface after agents return

After a batch of demo-builder agents completes, wire routes + tabs:

1. **`src/App.tsx`:** add a `lazy()` import for each new `Collage<Name>` dispatcher. Add a `<Route path="<name>" element={...}>` inside the CollageShell parent route (around line 62–83 in the current file).
2. **`src/preview/collage/CollageShell.tsx`:** add each tab to the `TABS` array with appropriate `group` (`'primary'` | `'capture'` | `'system'`). Extend `VARIANT_COUNT` with the page's variant count (2 for most, 3 for a few).
3. **Smoke-test:** `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/mykeepsakes/preview/collage/<name>` for each route + variant. All should return 200.
4. **Type-check:** `./node_modules/.bin/tsc --noEmit`. Must exit 0.

### Locking a user pick

When the user picks a variant for a surface:

1. Open `src/preview/collage/pages/Collage<Name>.tsx`. Change the dispatcher default to the picked variant. Example, if user picks V2:
   ```tsx
   if (v === '1') return <NameV1 />;
   if (v === '3') return <NameV3 />;
   return <NameV2 />;  // default
   ```
2. Append to the "Locked layouts" table in `.planning/DESIGN-SYSTEM.md` with the rationale the user gave (or inferred — keep it one line).
3. Do NOT delete the losing variants yet — they live until Phase 5.

### Dev server

Already running in a background task (Vite dev server, port 8080). If you start a new session and it's not running:

```bash
cd "C:/Users/shawn/OneDrive/Documents/ADL-Foundry/GitRepositories/mykeepsakes"
npm install   # if node_modules missing
npm run dev   # starts on http://localhost:8080/mykeepsakes/
```

Run in background via Bash `run_in_background: true`.

Smoke-test URL: http://localhost:8080/mykeepsakes/

### Supabase state

Already seeded with Sankofa trip data per the user's confirmation. `.env.local` at the repo root points at the live Supabase project. Do NOT run `npx tsx scripts/seed-sankofa.ts` without confirming with the user first (it's idempotent but would double-insert if not designed to upsert).

---

## File map

```
C:/Users/shawn/OneDrive/Documents/ADL-Foundry/GitRepositories/mykeepsakes/
├── .planning/
│   ├── BRIEF.md                 # engagement brief (Sankofa CPE, audience, constraints)
│   ├── DESIGN-SYSTEM.md         # TOKENS TRUTH — colors, type, radii, motion, locks table
│   ├── COMPLETION-PLAN.md       # THIS FILE
│   ├── variations/
│   │   ├── index.html           # old standalone 3-mockup switcher (archive)
│   │   ├── v1-collage.html      # canonical Collage reference mockup (corrected Apr 17)
│   │   ├── v2-warm-minimal.html # rejected
│   │   └── v3-garden.html       # rejected
│   └── (future phase outputs land here too)
├── src/
│   ├── App.tsx                  # routes — add new preview routes here
│   ├── pages/
│   │   ├── Index.tsx            # authenticated dashboard entry (PIN-gated)
│   │   ├── SharedTrip.tsx       # public shared-trip production (Phase 4 #11)
│   │   ├── SharedDispatch.tsx   # (Phase 4 #11)
│   │   └── NotFound.tsx
│   ├── components/
│   │   ├── MultiUserPinEntry.tsx       # ✅ MIGRATED
│   │   ├── PinSetup.tsx                # ⏳ Phase 4 #12
│   │   ├── SettingsDialog.tsx          # ⏳ Phase 4 #12 + Phase 2 demo
│   │   ├── auth/
│   │   │   ├── emoji-pin-pad.tsx       # legacy Beach pad (used by PinSetup, SettingsDialog)
│   │   │   └── CollageEmojiPad.tsx     # ✅ created, used by MultiUserPinEntry
│   │   ├── dashboard/
│   │   │   ├── CompactHeader.tsx       # ✅ MIGRATED
│   │   │   ├── DashboardLayout.tsx     # ⏳ Phase 4 #1
│   │   │   ├── SwipeableDashboard.tsx  # ⏳ Phase 4 #1
│   │   │   ├── LeftColumn.tsx          # ⏳ Phase 4 #1
│   │   │   ├── CenterColumn.tsx        # ⏳ Phase 4 #1
│   │   │   ├── RightColumn.tsx         # ⏳ Phase 4 #1
│   │   │   ├── DetailPanels/*.tsx      # ⏳ Phase 4 #1 (one agent task per panel)
│   │   │   └── ContactsFAB.tsx         # touched in CompactHeader; restyle in Phase 4 #1
│   │   ├── itinerary/*                 # ⏳ Phase 4 #2
│   │   ├── dispatch/*                  # ⏳ Phase 4 #3
│   │   ├── album/*                     # ⏳ Phase 4 #5
│   │   ├── map/*                       # ⏳ Phase 4 #6
│   │   ├── connections/*               # ⏳ Phase 4 #10
│   │   ├── contacts/*                  # ⏳ Phase 4 #7
│   │   ├── guide/*                     # ⏳ Phase 4 #8
│   │   ├── lodging/*                   # ⏳ Phase 4 #9
│   │   ├── reflection/*                # ⏳ Phase 4 #10
│   │   ├── sharing/*                   # ⏳ Phase 4 #11
│   │   └── export/*                    # ⏳ Phase 2 demo + Phase 4
│   ├── preview/
│   │   └── collage/
│   │       ├── collage.css             # TOKENS — do not edit casually
│   │       ├── CollageRoot.tsx         # wrapper, loads collage.css
│   │       ├── CollageShell.tsx        # preview tab shell
│   │       ├── ui/                     # primitives (Stamp, Tape, PolaroidCard, MarginNote, StickerPill)
│   │       └── pages/                  # 11 dispatchers + variants/
│   ├── hooks/                          # data hooks — reuse, do not rewrite
│   ├── types/                          # type contracts — trip.ts, conference.ts
│   └── integrations/supabase/          # client + generated types
├── tailwind.config.ts                  # Beach tokens — untouched until Phase 5
├── src/index.css                       # Beach base styles — untouched until Phase 5
└── package.json                        # leaflet, react-leaflet, @tanstack/react-query, shadcn, Supabase
```

**Primitive quick-reference (under `src/preview/collage/ui/`):**
- `<Stamp variant="ink|pen|outline|plain" size="sm|md|lg" rotate={n}>` — rubber-stamp label
- `<Tape position="top|top-left|top-right|left|right" rotate={n}>` — decorative yellow strip
- `<PolaroidCard mood="sage|gold|sky|dawn|clay|ink" rotate={n} tape caption={} overline={}>` — photo card with CSS gradient
- `<MarginNote rotate={n} color="pen|ink" size={n}>` — handwritten Caveat aside (aria-hidden by default)
- `<StickerPill variant="pen|ink|tape" rotate={n}>` — short label pill
- `resolveMood(category, startTime)` helper in `PolaroidCard.tsx` — maps itinerary-item → polaroid mood

---

## Done criteria

You're done when all of the following are true:

- [ ] Phase 1: Lodging, Reflection, Connection picks locked (dispatchers + DESIGN-SYSTEM.md).
- [ ] Phase 2: Favorites, Export, Settings, Trip-selector surfaces demoed (2 variants each).
- [ ] Phase 3: Picks locked for those 4 surfaces.
- [ ] Phase 4.1: Dashboard's outer shell + all 3 columns + all DetailPanels render Collage.
- [ ] Phase 4.2–4.12: Every other listed surface renders Collage.
- [ ] Phase 5: `/preview/collage/*` routes retired (or kept as a deliberate archive, user's call); Beach tokens pruned from `tailwind.config.ts`.
- [ ] Phase 6: `npm run build` succeeds; every authenticated page walked; deployed to the host; user confirms ready-for-conference.
- [ ] `./node_modules/.bin/tsc --noEmit` exits 0 at every Phase boundary.
- [ ] `.planning/DESIGN-SYSTEM.md` reflects the final state.
- [ ] The user can log in with their emoji PIN and every surface they touch between April 20 and April 26, 2026 looks like a considered field notebook — not like an app they're operating.

---

## Known hazards & how to handle them

| Hazard | What to do |
|---|---|
| **Dashboard migration scope creep.** The 3 columns + detail panels + FAB + capture sheets is a lot. | Ship Phase 4 step 4a-4b (outer chrome + layout shell) as ONE deliverable. Then migrate CenterColumn's first DetailPanel alone. Then the next. Don't try to do the whole Dashboard in one turn. |
| **Data contract drift.** An agent earlier hit a bug where prompt referenced `speaker_session` field that doesn't exist. | Always check `src/types/trip.ts` and `src/types/conference.ts` before trusting field names. The `Connection` type (from `use-connections.ts`) is the truth for family_contacts records. |
| **Leaflet inside Collage.** Map views need `import 'leaflet/dist/leaflet.css'` and a wrapped MapContainer. See `src/preview/collage/pages/variants/MapV1.tsx` for the working pattern: CartoDB Voyager tiles + `filter: sepia(.18) saturate(.88) contrast(1.02)` + DivIcon-based Collage pins. | Copy from MapV1 rather than re-deriving. |
| **Pre-conference date (April 20)**. If you're working past April 20, 2026, Shawn + Dan are AT the conference actively using the app. | Freeze new migrations. Only critical bug fixes. Coordinate with the user explicitly about deploys. |
| **`@/preview/collage/*` imports in production code.** Once Phase 5 moves these out of `/preview/`, every import needs updating. | Use a find-and-replace: `@/preview/collage/` → `@/collage/` (or whatever the new path is). TypeScript compiler catches missed ones. |
| **Capacitor wrap.** User's memory mentions `foundry:cap` for iOS/Android wrap. Not in scope for this plan, but design choices should respect mobile-first (390×844) so a future wrap doesn't require redesign. | Every new surface should already be working at 390px width. The preview shell does this; carry it forward. |
| **Empty states.** Sankofa is pre-conference so photos/memories/dispatches are empty. The preview handled this via synthesis banners and ghost-polaroid placeholders. | Keep the synthesis banner pattern in production: if data is empty, show a pleasant expectant state, not an error or blank. |

---

## Ping the user when

You reach these points — stop and check in before proceeding:

1. **Phase 4.1 complete.** Dashboard is the tallest wall to climb. User will want to see it before the other migrations continue.
2. **Before Phase 5.** Retiring the Beach theme is permanent. Confirm with the user.
3. **Before deploying** (Phase 6.2). The user handles deploy targets.
4. **If a migration touches auth / sessionStorage / the edge function.** Get explicit OK — these are load-bearing.
5. **If you're unsure which DetailPanel the data flow goes through.** Ask; don't guess.

Otherwise: keep moving. The user has approved the migration pattern and prefers cadence over check-ins for routine work.

---

## First-session boot sequence

When a fresh Claude Code session opens with this plan:

1. Read this entire file.
2. Read `.planning/BRIEF.md` and `.planning/DESIGN-SYSTEM.md`.
3. Check dev server status: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/mykeepsakes/`. If not 200, start it per the "Dev server" section above.
4. Type-check current state: `./node_modules/.bin/tsc --noEmit`. Should exit 0. If not, read the errors — previous session may have left a cliff-hanger.
5. Greet the user with a two-line status: "Picking up Collage migration. Phase 1 is to resolve 3 pending picks (Lodging / Reflection / Connection). Want to review the mockups, or should I lock recommended defaults and move to Phase 2?"
6. Wait for direction. Then work the phases.

Good luck.
