# BRIEF — MyKeepsakes

Generated: 2026-04-17
Source: /p:consult
Revised: 2026-04-17 (corrected: Sankofa is a Chicago CPE conference, not a Ghana trip)

## What we're making

Whole-platform front-end refresh for MyKeepsakes — a multi-trip memory platform where Shawn and Dan capture and revisit trips they make together. **First real trip: Sankofa CPE 2026** — a chaplains' Clinical Pastoral Education conference in Chicago (April 20–26, 2026; "Healing, Justice & Sacred Care"), where they're attending as Beacon UU chaplains. Every surface inherits the chosen direction: landing, emoji-PIN login, trip list, trip recap / memory view, and eventual PWA offline shell.

*Sankofa* is the Ghanaian Akan word — a bird looking backwards to retrieve what was forgotten. The trip name names the aesthetic intent of the platform itself: **go back, fetch what matters, carry it forward.**

## Audience

Shawn + Dan as primary curators — two chaplains using this tool to carry conference learning, worship moments, and the quiet hours in between back into their ministry work. Family members as secondary browsers (future trips will be non-professional). Not kid-first (Picopets is that) and not outside-audience-first (sharing is a read-mode, not the core). The emotional center is a chaplain sitting with what they heard and who they met — professional reflection, not vacation nostalgia.

## Tone

Considered, intimate, present, with room for the reverence the work demands. Must read as "custom-crafted by these two for this body of work" — not generic conference-app, not trip-tracker, not gallery. A tool that makes revisiting a CPE session or a worship moment feel like opening a notebook you took care with.

## Aesthetic candidates

User asked for 3 distinct directions; intentionally excluding the portfolio-adjacent Tender exemplar so the comparison is genuine.

1. **Collage** — *found, personal, layered*
   - Typography: Rubik Mono One (display stamps) + IBM Plex Serif (body) + Caveat (script accents)
   - Palette: crème `#F7F3E9` · tape-yellow accent `#F6D55C` · pen-blue secondary `#1F3CC6` · ink `#1D1D1B`
   - Layout metaphor: field notebook — polaroids of session moments, tape-marked handouts, pen-blue margin ticks, Caveat captions beside each photograph
   - Motion: shuffle, stacked entrance
   - Why it fits: CPE reflection *is* field-notebook work — you collect speakers, quotes, rooms, small encounters; a scrapbook metaphor carries this without being cute
   - Risk: can drift toward "conference swag" if the tape/stamp logic isn't restrained; the chaplaincy context demands less visual chatter than a vacation scrapbook

2. **Warm-Minimal** — *spacious, patient, modern*
   - Typography: Archivo (display) + Source Sans 3 (body)
   - Palette: sand `#E8E1D4` · terracotta accent `#D97757` · off-white `#FAF8F3` · deep-brown ink `#2A1F1A`
   - Layout metaphor: monograph — one session at a time, generous margins, single-column reading of the day's reflection
   - Motion: cursor-follow on hero; rest is still
   - Why it fits: treats each session as worthy of room to breathe; reads as contemplative; ages well for years of re-reading
   - Risk: risks feeling distant from the embodied, communal quality of worship sessions and workshops

3. **Garden** — *cared-for, alive, soft*
   - Typography: Playfair Display (display) + Outfit (body)
   - Palette: leaf `#8BB174` · petal accent `#E99BA3` · misty surface `#F5F6F0` · mossy ink `#374738`
   - Layout metaphor: seed catalog — trips as plots that grow over time; sessions as entries in a tended book
   - Motion: wind-sway, gentle
   - Why it fits: multi-trip platform *is* a living collection that grows; illustrated warmth honors the spiritual-care frame
   - Risk: illustration investment is real; garden metaphor may read too casual for the institutional weight of CPE credentialing

## Constraints

- **Must-have:** emoji-PIN login already wired (EMOJI_PIN_SETUP.md, 25-emoji palette shared with Foundry family sites, two seeded users: Shawn 🦅 / Dan 🐘); new direction keeps the emoji palette readable and large-touch
- **Must-have:** offline/PWA shell still on the roadmap; design must degrade gracefully offline (sessions happen where wifi may not)
- **Must-have:** speaker/contact surfacing — the Sankofa seed includes 30+ speakers and organizers with session assignments; design must treat those as honored, not "tags"
- **Must-have:** track system readable at a glance (A/B/C concurrent workshop tracks per day) — a chaplain glancing at tomorrow needs to know which track they're on
- **Must-have:** dispatch composition surface (memory → shareable dispatch) must feel appropriate for sending to a colleague or spouse, not a social-media post
- **Must-avoid:** anything kid-first (Picopets owns that register)
- **Must-avoid:** feed/scroll-app tropes; MyKeepsakes is not Instagram
- **Must-avoid:** conference-app genericness (blue nav bar, rounded cards, sessionize aesthetic)
- **Must-avoid:** AI-slop signals — no Inter/Roboto as display, no default-purple-gradient-on-white
- **Stack:** React + Vite + TypeScript + Tailwind + shadcn/ui + Supabase (ADL default; no deviation)
- **Mobile wrap:** intent = yes (PWA-first now; Capacitor wrap via `foundry:cap` plausible later); design must be thumb-reachable on 390×844 first — Shawn and Dan will be on phones during sessions

## Next

Run `/p:consider` to mock hero variations for each of the three candidates and lock one direction into `.planning/DESIGN-SYSTEM.md`.
