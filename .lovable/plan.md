

## Simplify Lodging to Link-Based System

Replace the current data-entry lodging system with a simpler link-based approach where users save URLs to rental listings and view them in an embedded modal.

---

## Current vs New Approach

| Current | New |
|---------|-----|
| Complex form with 15+ fields | Simple: just URL and optional label |
| Extract/enter property details | Store only the link |
| Card shows specs, amenities, pros/cons | Tile shows label, domain, voting |
| External link opens in new tab | Tap opens embedded site in modal |

---

## How It Works

1. User taps "Add Listing Link"
2. Pastes a URL (Airbnb, VRBO, etc.) and optionally adds a label
3. Link is saved and displayed as a compact tile
4. Tapping the tile opens a full-screen modal with the site embedded in an iframe
5. Voting and archive/delete actions remain available on the tile

---

## Implementation

### 1. Simplify Database Usage
Keep using the existing `lodging_options` table but only use a subset of columns:
- `id`, `name` (used as label), `url` (required now), `is_selected`, `is_archived`, `votes_up`, `votes_down`, `notes`, `created_at`, `updated_at`

No schema changes needed - we just use fewer fields.

### 2. Create New Components

**New File: `src/components/lodging/LodgingLinkTile.tsx`**
A compact tile showing:
- Site favicon or domain icon
- Label (or extracted domain name if no label)
- Vote buttons (thumbs up/down with score)
- Archive/Delete actions
- Tap area to open modal

**New File: `src/components/lodging/LodgingIframeModal.tsx`**
A full-screen dialog containing:
- Header with site label and close button
- Full-height iframe loading the URL
- Optional toolbar: open in new tab, refresh, share

### 3. Simplify Add Dialog

**Replace: `src/components/lodging/LodgingEditor.tsx`**
→ **New: `src/components/lodging/AddLodgingLinkDialog.tsx`**

Simple dialog with just:
- URL input (required, with validation)
- Label input (optional - defaults to domain)
- Notes textarea (optional)
- Add button

### 4. Update Main Tab

**Modify: `src/components/LodgingTab.tsx`**
- Remove complex editor and URL importer
- Replace LodgingCard with LodgingLinkTile
- Single "Add Listing Link" button
- Keep tabs for Active/Archived
- Keep voting functionality

### 5. Clean Up Unused Code
- Remove `LodgingEditor.tsx` (replaced)
- Remove `LodgingUrlImporter.tsx` (no longer needed)
- Remove `LodgingCard.tsx` (replaced by tile)
- Remove/disable the scrape-lodging edge function

---

## UI Design

### Link Tile Layout
```
+------------------------------------------+
| [🏠]  Beach House on Cape       [▲] +2  |
|       airbnb.com                 [▼]     |
|       📝 Great reviews          [···]    |
+------------------------------------------+
```

### Iframe Modal
```
+------------------------------------------+
| [←]  Beach House on Cape       [⤢] [✕]  |
+------------------------------------------+
|                                          |
|     [ Full-screen iframe of URL ]        |
|                                          |
+------------------------------------------+
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/lodging/LodgingLinkTile.tsx` | Create | Compact tile for each link |
| `src/components/lodging/LodgingIframeModal.tsx` | Create | Modal with embedded site |
| `src/components/lodging/AddLodgingLinkDialog.tsx` | Create | Simple add dialog |
| `src/components/LodgingTab.tsx` | Rewrite | Use new components |
| `src/hooks/use-lodging.ts` | Simplify | Only use needed fields |
| `src/components/lodging/LodgingCard.tsx` | Delete | Replaced by tile |
| `src/components/lodging/LodgingEditor.tsx` | Delete | Replaced by simple dialog |
| `src/components/lodging/LodgingUrlImporter.tsx` | Delete | No longer needed |

---

## Technical Considerations

### Iframe Limitations
Some sites (Airbnb, VRBO) block iframe embedding via `X-Frame-Options` headers. When this happens:
- Show a friendly message explaining the site blocks embedding
- Provide a prominent "Open in New Tab" button as fallback
- The tile still works for organizing and voting on links

### URL Handling
- Auto-detect domain for display (e.g., "airbnb.com")
- Validate URL format on input
- Store full URL for linking

---

## User Flow

```
[+ Add Listing Link]
       |
       v
+------------------+
| Paste URL here   |
| Add a label      |
| Any notes?       |
|      [Add Link]  |
+------------------+
       |
       v
+------------------------------------------+
| [🏠]  My Airbnb Pick         [▲] 0 [▼]  |
|       airbnb.com              [···]      |
+------------------------------------------+
       |
       v (tap)
+------------------------------------------+
| Beach House           [New Tab] [Close]  |
+------------------------------------------+
|                                          |
|   +---------------------------------+    |
|   | This site can't be embedded    |    |
|   | [Open in New Tab]              |    |
|   +---------------------------------+    |
|                                          |
+------------------------------------------+
```

