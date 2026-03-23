# MyKeepsakes: Sankofa Conference Companion — Design Spec

**Date:** 2026-03-23
**Author:** Shawn Jordan + Claude
**Status:** Draft
**Deadline:** April 14 (deploy + scaffold), April 21 (conference Day 1)

---

## 1. Overview

Migrate MyKeepsakes from Lovable to Vercel and build four conference companion features, validated by a real 4-day conference experience: the 2026 Sankofa CPE Inaugural Clergy & Chaplains' Mental Wellness Conference (April 21-24, Chicago).

### Why

MyKeepsakes is a memory preservation and trip planning app currently live on Lovable. Migration to Vercel has been planned. The Sankofa Conference provides a concrete deadline and real-world use case to drive the migration and extend the app's capabilities from vacation planning into immersive experience capture.

The conference features serve three purposes:
1. **Live companion** — Shawn uses the app to plan, capture, and reflect during the conference
2. **Team sharing** — Curated daily dispatches keep the chaplain team back home connected
3. **Training pipeline** — Tagged insights export into vault training materials for fall workshops

### Success Criteria

- By **April 14**: App deployed on Vercel, Sankofa trip scaffold populated with all known logistics
- By **April 21 (Day 1)**: Reflection capture works on mobile in under 60 seconds, dispatch generator produces a shareable link
- By **April 24 (Day 4)**: Full conference documented with daily dispatches sent, insights tagged, connections captured
- **Post-conference**: Training-seed tagged content exportable for vault integration

---

## 2. Migration Architecture

### Current State

- React 18 + TypeScript + Vite
- Supabase backend (PostgreSQL, Auth, Storage, Edge Functions)
- PIN-protected access (no user auth)
- PWA with offline support (vite-plugin-pwa)
- Hosted on Lovable

### Target State

- Same frontend stack, deployed on Vercel
- New Supabase project (free tier, self-managed)
- Existing data migrated
- Updated PWA manifest URLs

### Migration Steps

1. **Frontend**: Pull repo as-is. No Lovable-proprietary runtime to remove. Standard Vite/React.
2. **Vercel**: Add `vercel.json` config. Set environment variables (Supabase URL, anon key, project ID).
3. **Database**: Create new Supabase project. Run existing migrations from `supabase/migrations/` to recreate schema. Export/import existing trip data.
4. **Storage**: New Supabase storage bucket (`trip-photos`). Start fresh or manually migrate existing photos.
5. **PWA**: Update service worker config and manifest URLs for new domain.
6. **Domain**: Deploy to `.vercel.app` initially. Custom domain optional.

### What Changes

- Environment variables (Supabase URL, anon key, project ID)
- Deployment config (Lovable → `vercel.json`)
- PWA manifest URLs

### What Stays the Same

- All React components, hooks, pages
- All Supabase client code (same SDK, same queries)
- Database schema (same migrations)
- PIN-based access model

---

## 3. Feature: Quick Reflection Capture

### Problem

The existing memory capture dialog is photo-oriented. Conference capture needs to be text-first — a thought, a quote, a feeling captured in under 60 seconds between sessions.

### UX Flow

1. Floating action button (FAB) on trip view, always visible, bottom-right, thumb-reachable
2. Tap FAB → bottom sheet slides up with text field auto-focused, keyboard open
3. Type the thought
4. Optionally: snap a photo, tap quick-tag chips
5. Tap save

Zero taps to start typing. Whole interaction under 60 seconds.

### Data Model Changes

**Extend `memories` table:**

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `memory_type` | text | `'photo'` | `photo` \| `reflection` \| `dispatch` |
| `tags` | text[] | null | `['insight', 'quote', 'training-seed', 'personal', 'logistics']` |
| `speaker` | text | null | Who said it / session context |
| `session_title` | text | null | Which session this came from |

**Why extend `memories` rather than a new table:**
- Reflections ARE memories — they appear in timelines, tie to days and locations
- Export system already handles memories
- Album view already renders them
- Fewer migrations, fewer joins

### UI Components

- `ReflectionFAB` — Floating action button with expandable menu (Reflection, Connection)
- `ReflectionCaptureSheet` — Bottom sheet with:
  - Auto-focused text field
  - Optional photo capture button
  - Speaker / session title fields (collapsed by default, tap to expand)
  - Tag chip row: horizontally scrollable, large touch targets, multi-select
  - Save button positioned above keyboard

### Phone-First Design

- FAB: bottom-right, 56px, thumb-reachable
- Tag chips: 40px height minimum, 8px gaps
- Save button: always visible above keyboard
- Text field: full-width, auto-grow, 3-line minimum

---

## 4. Feature: Daily Dispatch Generator

### Problem

The existing trip share shows everything — raw notes, logistics, half-formed thoughts. The chaplain team back home needs curated, intentional dispatches: the difference between handing someone your notebook and writing them a letter.

### UX Flow

1. From day view, tap "Create Dispatch"
2. Dispatch editor shows all of today's reflections, photos, and completed activities
3. Each item has a checkbox to select/deselect
4. Three sections to compose:
   - **Scene setter**: Pick 1-3 photos that capture the day's feel
   - **Insights**: Auto-populated from selected reflections tagged `insight` or `training-seed`. Edit, reorder, add bullets.
   - **Closing**: Free text field — a quote, a feeling, a one-liner
5. Tap "Preview" to see the dispatch as the team will see it
6. Tap "Share" to generate a token link

### Data Model Changes

**New table: `dispatch_items`**

| Field | Type | Purpose |
|-------|------|---------|
| `id` | uuid (PK) | |
| `dispatch_id` | uuid (FK → memories) | The dispatch memory record |
| `item_type` | text | `reflection` \| `activity` \| `photo` |
| `item_id` | uuid | FK to source record |
| `sort_order` | integer | Display order |
| `section` | text | `scene` \| `insight` \| `closing` |
| `created_at` | timestamptz | |

A dispatch is a `memory` with `memory_type: 'dispatch'`. The `dispatch_items` table references existing content without duplicating it.

### Shared View

New route: `/shared/:token/dispatch/:id`

Renders a clean, mobile-friendly page:
- Date and day title ("Day 2 — Wednesday, April 22")
- Scene photos in a small gallery
- Bulleted insights
- Closing quote/reflection
- "View full trip" link (if trip-level token provided)

### Sharing Mechanics

- Each dispatch gets its own share token (via existing `trip_share_links` mechanism, extended with `dispatch_id`)
- Link is copy-to-clipboard for pasting into text, Slack, or email
- No authentication required to view

---

## 5. Feature: People/Connections

### Problem

Conference networking is valuable but ephemeral. No existing feature captures "I met this person, here's what we talked about" in a trip context.

### UX Flow

1. From FAB menu, second option: "Add Connection"
2. Quick-entry card: Name, role/org, how you met / what you discussed, optional photo
3. Auto-tagged with current day
4. Connections appear in a "People" tab on trip view

### Data Model Changes

**Extend `family_contacts` table:**

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `trip_id` | uuid (FK) | null | Scopes contact to a trip |
| `organization` | text | null | Role/org line |
| `met_context` | text | null | How/where you met, what you discussed |
| `day_id` | uuid (FK) | null | Which day |
| `photo_path` | text | null | Selfie or business card photo |

**Scoping:** Existing family contacts have `trip_id: null`. Trip contacts are filtered by trip context and don't appear in the family contacts view.

### Design Principle

This is not a CRM. It's "I met someone meaningful, I don't want to forget them." Name + context + optional photo. Thirty seconds max.

---

## 6. Feature: Insight Tagging

### Problem

Post-conference, Shawn needs to find training-worthy content without re-reading everything. Tags enable filtering for dispatch curation and training material export.

### Tag Taxonomy

| Tag | Color | Meaning | Example |
|-----|-------|---------|---------|
| `insight` | blue | A takeaway or learning | "Clergy burnout is about moral injury, not workload" |
| `quote` | amber | Someone else's words worth preserving | "You cannot companion someone to a place you haven't been" |
| `training-seed` | green | Should become chaplain training material | A framework, exercise, or practice to bring back |
| `personal` | purple | Private reflection, not for sharing | Processing something that surfaced |
| `logistics` | gray | Practical info | Room change, dinner spot, flight update |

### Where Tags Appear

- **Reflection capture**: Chip row below text field (tap to toggle, multi-select)
- **Activity notes**: Same chip row when adding notes to itinerary items
- **Memory/photo captions**: Tag chips available

### Tag-Powered Behaviors

- **Trip view filter bar**: Show all, or filter by tag
- **Dispatch editor**: Auto-selects items tagged `insight`, `quote`, `training-seed`
- **Export**: Filter by tag before exporting — "Export all training-seeds" produces raw material for fall workshop
- **Dispatch shared view**: Items tagged `personal` are NEVER included, even if accidentally selected

### Why Fixed Taxonomy

- **Speed**: Tap a chip, don't type a hashtag
- **Consistency**: 30+ items over 4 days — freeform drifts ("training", "Training", "for-training")
- **Machine-readable**: Dispatch editor auto-selects by tag. Can't with freeform.

### Data Model

Tags use the `tags` text array field on `memories` (added in Section 3). Activities get a matching `tags` field on `itinerary_items`.

No new table needed.

---

## 7. Sankofa Trip Scaffold

The acceptance test. If this trip can be created, populated, and shared, the migration and features work.

### Trip Record

| Field | Value |
|-------|-------|
| Title | Sankofa 2026 — Healing, Justice & Sacred Care |
| Location | Chicago / Oak Brook, IL |
| Start | April 21, 2026 |
| End | April 24, 2026 |
| Timezone | America/Chicago |

### Days

| Day | Date | Title |
|-----|------|-------|
| 1 | Apr 21 (Tue) | Arrival & Opening |
| 2 | Apr 22 (Wed) | Conference Day 1 |
| 3 | Apr 23 (Thu) | Conference Day 2 |
| 4 | Apr 24 (Fri) | Closing & Departure |

### Accommodation

- **Hotel**: Chicago Marriott Oak Brook
- **Address**: 1401 W 22nd St, Oak Brook, IL 60523
- **Phone**: +1-630-573-8555
- **Check-in**: Apr 21, 4:00 PM
- **Check-out**: Apr 24, 12:00 PM
- **Confirmation**: #84897700
- **Rate**: $154/night ($503.58 total)
- **Notes**: Sharing with Dan Llanes. Complimentary parking.

### Pre-Populated Locations

- Chicago Marriott Oak Brook (hotel + venue)
- O'Hare International Airport (TBD)
- Midway Airport (alternative, TBD)

### Contacts

| Name | Role | Email | Phone |
|------|------|-------|-------|
| Dr. Danielle Buhuro | Organizer | sankofacpeconference@gmail.com | 773-953-9398 |
| Rev. Dr. Jé Exodus Hooper | Beacon minister, presenter | je@summitbeacon.org | 804-837-2404 |
| Rev. Dr. Robin Tanner | Beacon senior minister | robin@summitbeacon.org | 908-219-9959 |
| Dan Llanes | Roommate, chaplain | — | — |
| Heather Stober | Beacon chaplain | — | — |
| Catherine Menendez | Beacon chaplain | — | — |
| Dana N. Moore | Congregational coordinator | — | — |

### Known Speakers (pre-load as connections)

| Name | Context |
|------|---------|
| Dr. Nathaniel D. West, LPC | Plenary: "Shifting Toward Consistent Self-Care" |
| Dr. Pamela Ayo Yetunde | Pastoral Counselor & Author |
| Dr. Nisa Muhammad | Assistant Dean, Howard University |
| Rev. Dr. Jé Exodus Hooper | Curatorial team |

### Known Itinerary Items

- **Day 1**: Check-in at hotel (4:00 PM), Opening session (TBD)
- **Days 2-3**: Placeholder blocks: Morning plenary, Workshop block 1, Lunch, Workshop block 2, Dinner, Evening programming
- **Day 4**: Closing session, Checkout (12:00 PM), Departure

### Open Items (fill as details arrive)

- Full session schedule from blackchaplainsrock.com/about-7
- Flight bookings
- Restaurant picks near Oak Brook
- CEU tracking

---

## 8. Post-Conference Flow

1. **Archive**: The Sankofa trip lives in MyKeepsakes as a searchable, browsable archive
2. **Export**: Filter by `training-seed` tag → export markdown + photos → vault integration
3. **Training materials**: Exported content goes into `PersonalOS-Vault/Spirit/Chaplaincy/` as the basis for fall workshop development — same pattern as BST725 → grief companioning training
4. **Dispatches**: Remain shareable via their token links as a permanent record the team can revisit

---

## 9. Out of Scope

- Real-time collaborative editing (sharing stays read-only)
- Calendar/ICS export
- Indoor venue floor plans
- Agenda sync from external platforms (Eventbrite, etc.)
- Session/track management (use activity categories and descriptions)
- Schedule conflict warnings
- Any features not needed for the Sankofa use case

---

## 10. Technical Notes

### Database Migration Strategy

All schema changes are additive (new columns, one new table). No existing data is affected:

1. Add `memory_type`, `tags`, `speaker`, `session_title` to `memories`
2. Add `tags` to `itinerary_items`
3. Add `trip_id`, `organization`, `met_context`, `day_id`, `photo_path` to `family_contacts`
4. Create `dispatch_items` table
5. Extend `trip_share_links` with optional `dispatch_id`

### Privacy

- Items tagged `personal` are excluded from dispatches and shared views
- Dispatch sharing uses per-dispatch tokens (not trip-level access)
- PIN protection remains the access model
- No user authentication added

### Offline

- Reflection capture must work offline (queue and sync when connected)
- Dispatch creation requires connectivity (generates share token server-side)
- PWA service worker caches the app shell and recent data
