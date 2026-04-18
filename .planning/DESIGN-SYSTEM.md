# DESIGN-SYSTEM — MyKeepsakes

Locked: 2026-04-17
Source: /p:consider (Variation 1 — Collage)
Archetype: **Collage**
Reference mockup: `.planning/variations/v1-collage.html`

The tokens below reflect what the approved mockup actually renders (Google-Fonts sourceable), not an aspirational Authentic Sans spec we can't ship. Where the archetype book calls for a commercial face, the locked choice is an honest proxy with the same aesthetic function.

---

## Typography

Three roles. Never introduce a fourth face without updating this file.

- **Display (stamped headlines, hero marks)**
  - Font: **Rubik Mono One** (Google Fonts)
  - Weights: 400 only (monospaced, single weight)
  - Fallbacks: `"Rubik Mono One", "Courier New", monospace`
  - Role: marketing headlines, section stamps, eyebrow labels — treat it like a rubber stamp. Uppercase and wide letter-spacing (0.22–0.28em) amplify the stamp feel.
  - Rule: **not for body copy ever**. Max ~14ch per line.

- **Body (reading text, UI copy)**
  - Font: **IBM Plex Serif** (Google Fonts)
  - Weights: 400 (regular), 500 (medium), 400 italic
  - Fallbacks: `"IBM Plex Serif", Georgia, "Iowan Old Style", serif`
  - Role: all paragraphs, list items, button labels that aren't stamp-shaped, form inputs, table text.
  - Base size: 16px. Reading measure: 44–60ch.

- **Script accent (handwritten captions, margin notes)**
  - Font: **Caveat** (Google Fonts), weight 600
  - Fallbacks: `Caveat, "Segoe Script", cursive`
  - Role: photo captions, margin notes, dateline-style asides. Use sparingly — 1–2 per viewport max. Never for controls, never for required-to-read copy.

## Color

Four-role palette. Semantic colors layer on top.

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#1D1D1B` | Primary text, primary button surface, stamp frames |
| `--creme` | `#F7F3E9` | Default page background, button text-on-ink |
| `--pen` | `#1F3CC6` | Accent — pens, annotations, secondary CTAs, active nav |
| `--tape` | `#F6D55C` | Highlight — tape strips, marker fills, emphasis underlays |

Derived surfaces:

| Token | Hex | Role |
|---|---|---|
| `--ink-muted` | `#4A4843` | Secondary text, captions |
| `--line` | `#1D1D1B1F` | Hairlines, dividers (12% ink) |
| `--paper` | `#FFFFFF` | Photo-card surface, inner elevation |
| `--shadow` | `rgba(29,29,27,.22)` | `0 8px 24px -6px var(--shadow)` for all card elevation |

Semantic:

| Token | Hex | Role |
|---|---|---|
| `--success` | `#3C7A4E` | Save confirmations |
| `--warn` | `#C27814` | Unsaved state, draft warnings |
| `--danger` | `#A83232` | Delete, destructive |
| `--info` | `#1F3CC6` (same as pen) | System notices |

**Contrast verified (WCAG):**
- Ink on crème: ~16:1 ✅
- Pen on crème: ~7.2:1 ✅
- Crème on ink: ~16:1 ✅
- Ink-muted on crème: ~8.1:1 ✅
- Pen on tape: **FAILS** (~3.1:1) — do not use pen text on tape fill; use ink on tape instead.

## Radii, spacing, motion

**Radii** — low, rectilinear; this aesthetic reads wrong with heavy rounding.
- `--r-sm: 2px` · `--r-md: 4px` · `--r-lg: 6px`
- Photo cards: `0` (sharp corners — they're polaroids)
- Buttons / inputs: `--r-sm`
- Sticker pills: `2px` (not full-round)

**Spacing scale** (4-base):
`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`
No arbitrary values in Tailwind; extend the theme to these steps only.

**Motion signature** — *shuffle, stacked entrance, nothing bouncy*.
- Easing: `--ease-out: cubic-bezier(.22,.61,.36,1)` for entry; `--ease-in: cubic-bezier(.55,.06,.68,.19)` for exit.
- Durations: `--t-fast: 140ms` (hover, button) · `--t-med: 240ms` (card reveal) · `--t-slow: 420ms` (stagger ceiling).
- Page load: photos reveal with staggered 60ms delay, slight rotation settling (-4° → 0° → overshoot disabled). Max total reveal < 700ms.
- Hover on cards: `translate(-2px,-2px)` shadow expansion. No scale, no rotate.
- **`prefers-reduced-motion: reduce`** — collapse all to instant fades, no rotation, no translate.

## Do / Don't (rules specific to Collage)

### DO
- **Rotate photo elements intentionally** — ±3–6°. Predictable angles read as designed; random angles read as broken.
- **Use tape / stamp overlays** — the archetype's signature. Every hero, trip-card, and empty-state benefits from one.
- **Let the script accent (Caveat) do the warmth** — the two primary faces are intentionally stiff so the handwritten notes carry the intimacy.
- **Keep the palette taut** — ink, crème, pen, tape. Adding a fifth color dilutes the stamp-book logic.
- **Build cards as physical objects** — padding around photos reads as polaroid borders. Don't let images bleed to card edges.

### DON'T
- **Don't use purple gradients anywhere** — Collage failure mode is drifting into "playful startup landing." Purple = AI slop.
- **Don't add rounded-xl buttons** — the aesthetic is paper-flat. Large radii kill the metaphor.
- **Don't over-stagger animations** — more than 3 elements staggering at once feels like a slot machine.
- **Don't mix the handwriting script into forms, required copy, or anything AT-readable** — it's decorative-only for a11y.
- **Don't let Rubik Mono One go below 14px** — it stops being a stamp and becomes noise. If it's small, use IBM Plex Serif.

## Mobile / PWA notes

- Primary breakpoint: **390×844** (iPhone 13 baseline).
- Photo stack collapses to a single hero photo + horizontal swipe carousel — rotations reduce to ±2°.
- Stamp / tape decorations shrink but never disappear — they are the brand.
- Offline shell: preserve the creme + ink palette; swap photo fills with skeleton gradients in the same warm range.
- Tape-yellow must not be a PWA theme color; use crème (`#F7F3E9`) in the manifest so the system chrome matches paper.

## Family-secondary readability

- Minimum body size on family-visible screens: **17px**, not 16.
- Buttons on trip-view (family-facing) adopt `--ink` fill always; never ghost buttons as primary actions there.
- Caveat captions appear once per view max when family access is the likely reader.

## Integration with existing emoji-PIN

- PIN screen inherits creme background + ink ring around selected emoji.
- Tape-yellow fills the "selected" underlay behind the chosen emoji — reinforces the aesthetic without overriding the emoji glyph contrast.
- Pen-blue animates only the "complete" state (4/4 emojis entered), as a margin tick mark in Caveat script. Under reduced motion: ink tick, no script.

---

## Locked layouts (per surface)

Chosen 2026-04-17 after iterating 3 variants per page against real Sankofa data at `/preview/collage/*`.

| Surface | Chosen | Why it won |
|---|---|---|
| **Dashboard** | **V2 — Center Altar** | Symmetrical, ceremonial reads better for CPE weight than the L-shape scrapbook (V1). The ticket-stub stats strip lands the "this matters" tone without needing margin notes to carry it. |
| **Day** | **V2 — Session Blocks** | Grouping by Morning / Midday / Afternoon / Evening beats a strict timeline for a conference where what matters is the *rhythm* of the day, not precise clock-ordering. Scales past 10+ items without becoming a wall. |
| **Memory** | **V3 — Scrapbook Spread** | Two-page book layout with ruled meta on the left and reflection + marginalia on the right earns the "field notebook" metaphor most honestly. The marginalia callout block (pen-blue left border, handwritten "question I want to sit with") is the emotional hook. |
| **PIN** | **V1 — Centered Card** | Rejected the credential (V2) as overcostumed and the passport/receipt (V3) as gimmicky for a tool entered under stress. The quiet centered card keeps the ritual small. |
| **Guide** | **V2 — Curator's Folio** | Single-page magazine-style feels more authoritative than the trifold brochure (V1). Big hero polaroid + two-column body + people footer reads like a program book you'd save. |
| **Map** | **V1 — Annotated Pinboard** *(with real tiles)* | Pinboard metaphor wins over route-card-stack (V2) for spatial understanding. Rewritten 2026-04-17 to use real Leaflet tiles beneath the Collage chrome — schematic CSS wasn't map-enough. |
| **People** | **V2 — Who's Who Index** | Two-column index + detail panel beats the rolodex (V1) for a conference with 30+ speakers. Scannable alphabetical index + on-hover detail respects the density of CPE relationships. |
| **Album** | **V1 — Scrapbook Pages by Day** | Organizing photos by day beats organizing by place (V2) for a week-long conference where each day has a distinct arc. Empty-state ghost polaroids with the day-mood pretint keep the pre-conference view expectant, not empty. |
| **Dispatch** | **V2 — Split Workspace** | Source column + Draft column beats the three-drawer letter sheet (V1). The visible link between what you're reflecting ON and what you're writing keeps the composition grounded. Live paragraph count + Caveat subject line land the tone. |
| **Shared-Trip** | **V1 — Single Long Letter** | Vertical reading flow beats the zine booklet (V2). One continuous letter is how you send a trip to a friend; stacked zine pages start to feel app-like, which violates the "no chrome, feels like a dispatch" brief. |
| **Lodging** | **V1 — Concierge Card** | Picked 2026-04-18. Concierge card format gives the room info + hotel context the authoritative, saveable feel of a front-desk handout; the ticket-stubs variant (V2) would duplicate the Dispatch split-workspace rhythm. |
| **Reflection** | **V2 — Index Card** | Picked 2026-04-18. Index card beats the notebook page (V1) for post-conference reflection — bounded surface area invites a single honest thought instead of performative long-form journaling under stress. |
| **Connection** | **V2 — Index Card + Live Preview** | Picked 2026-04-18. Live preview of the forming contact card beats the business-card-filling-out metaphor (V1). Seeing the Who's Who entry compose in real time makes the capture feel generative rather than clerical. |
| **Favorites** | **V2 — Shortlist** | Picked 2026-04-18. Numbered curator's-picks column beats the Pin Wall (V1). Ranked shortlist tells the story of what mattered in order; pin wall competed visually with the Album surface. |
| **Export** | **V2 — Address Label** | Picked 2026-04-18. Recipient-forward address-label framing beats the sealed-envelope metaphor (V1). "Here is who I am sending this to" is the operative moment in sharing; the seal is decoration. |
| **Settings** | **V1 — Inside Cover** | Picked 2026-04-18. Book-inside-cover framing beats the receipt-pad ledger (V2). Settings are identity + posture, not an audit log; authoritative + saveable reads truer than transactional. |
| **Trips** | **V2 — Ticket Counter** | Picked 2026-04-18. Tear-off ticket stubs beat the bookshelf (V1). Trips are departures you're about to take, not a library you've built; the departure-board masthead lands the forward motion. |

### URL convention

- Bare route → chosen variant (e.g. `/preview/collage/dashboard` serves V2)
- `?v=1|2|3` forces a specific variant for comparison
- Keyboard: `Q`/`W`/`E` to switch layouts; `1`/`2`/`3`/`4` to switch pages

### Retained for comparison

All 12 variant files remain under `src/preview/collage/pages/variants/`. Do not prune until the Collage direction is fully migrated into the live app — the losers are useful reference material (especially V3 Zine for any future editorial surface, and V2 Credential if a kiosk/check-in surface is ever needed).

---

## Next

Per-surface production migration: adopt these four layouts into the real Beach-themed components.
- **Priority 1:** DashboardLayout → Center Altar composition (affects the LeftColumn/CenterColumn/RightColumn trio — this is the biggest surface area)
- **Priority 2:** ItineraryTab / DatabaseItineraryTab → Session Blocks grouping
- **Priority 3:** Dispatch editor + shared dispatch page → Scrapbook Spread
- **Priority 4:** PIN entry → Centered Card (smallest delta from current)

Each migration is its own `/p:deploy` pass. Do not batch — each one has a narrow blast radius and is individually testable.
