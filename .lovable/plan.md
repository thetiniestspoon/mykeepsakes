
# 3-Column Synchronized Dashboard Revamp

This plan transforms the app from a tab-based mobile-portrait design into a unified 3-column synchronized dashboard optimized for mobile landscape first, with responsive support for desktop and portrait fallback.

---

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Compact Header (Trip name, settings, share, contacts FOB)                  │
├──────────────────┬─────────────────────────┬────────────────────────────────┤
│                  │                         │                                │
│   LEFT COLUMN    │     CENTER COLUMN       │      RIGHT COLUMN              │
│                  │                         │                                │
│ ┌──────────────┐ │  Context-driven panel   │  Persistent Overview Map       │
│ │ Quick Icons  │ │                         │  (Leaflet)                     │
│ │ Guide|Stay   │ │  - Selected item details│                                │
│ └──────────────┘ │  - Activity context     │  - All pins visible            │
│                  │  - Photo viewer         │  - Selected pin highlighted    │
│ ┌──────────────┐ │  - Guide section expand │  - Day/category filters        │
│ │   Itinerary  │ │  - Album experience     │                                │
│ │   Day cards  │ │                         │  Syncs with left/center:       │
│ │   Timeline   │ │  Modes by trip state:   │  - Pan to location on select   │
│ │              │ │  - Pre: Guide details   │  - Highlight active pin        │
│ │              │ │  - Active: Current item │  - Click pin → show in center  │
│ │              │ │  - Post: Album viewer   │                                │
│ └──────────────┘ │                         │                                │
│                  │                         │                                │
│ ┌──────────────┐ │                         │                                │
│ │  Album Card  │ │                         │                                │
│ │  (collapsed) │ │                         │                                │
│ └──────────────┘ │                         │                                │
│                  │                         │                                │
├──────────────────┴─────────────────────────┴────────────────────────────────┤
│ (No bottom nav in dashboard view - integrated into columns)                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Mode Detection Strategy

### Viewport Breakpoints

| Condition | View Mode |
|-----------|-----------|
| Width >= 900px OR (Landscape + Width >= 667px) | 3-Column Dashboard |
| Portrait mobile (< 768px) | Tab-based (current design) |

A new `useDashboardMode()` hook will handle this detection:
- Uses `matchMedia` for `(orientation: landscape) and (min-width: 667px)`
- Also triggers on `min-width: 900px` regardless of orientation (desktop/tablet)
- Returns `{ isDashboard: boolean, isPortrait: boolean }`

---

## State Synchronization System

### Central Selection Context

A new React Context will manage synchronized selection across all three columns:

```text
DashboardSelectionContext
├── selectedItem: { type, id, data } | null
│   - type: 'activity' | 'location' | 'guide' | 'photo' | 'accommodation'
│   - id: string
│   - data: activity/location/photo object
│
├── highlightedMapPin: string | null (location ID)
├── panToLocation: { lat, lng } | null
│
├── tripMode: 'pre' | 'active' | 'post'
├── defaultFocus: computed from tripMode
│   - pre → guide details
│   - active → current/next activity
│   - post → album experience
│
└── Actions:
    - selectItem(type, id, data)
    - clearSelection()
    - highlightPin(locationId)
    - panMap(lat, lng)
```

### Sync Flow Examples

**User taps itinerary activity:**
1. Left column: Activity gets visual selection state
2. Center column: Shows activity detail panel (time, description, links, notes, photos)
3. Right column: Map pans to location, pin pulses/highlights

**User taps map pin:**
1. Right column: Pin highlights with pulse animation
2. Center column: Shows location details (bottom sheet content in panel form)
3. Left column: Scrolls to and highlights matching itinerary item(s)

---

## Component Architecture

### New Files to Create

| File | Purpose |
|------|---------|
| `src/contexts/DashboardSelectionContext.tsx` | Central sync state management |
| `src/hooks/use-dashboard-mode.ts` | Viewport/orientation detection |
| `src/components/dashboard/DashboardLayout.tsx` | 3-column container layout |
| `src/components/dashboard/LeftColumn.tsx` | Itinerary column with quick icons |
| `src/components/dashboard/CenterColumn.tsx` | Detail panel with mode-aware content |
| `src/components/dashboard/RightColumn.tsx` | Persistent map column |
| `src/components/dashboard/QuickIconRow.tsx` | Guide/Stay/Packing quick access icons |
| `src/components/dashboard/ContactsFAB.tsx` | Floating contacts button with drawer |
| `src/components/dashboard/CompactHeader.tsx` | Slimmed header for dashboard view |
| `src/components/dashboard/DetailPanels/ActivityDetail.tsx` | Activity detail view |
| `src/components/dashboard/DetailPanels/LocationDetail.tsx` | Location detail view |
| `src/components/dashboard/DetailPanels/GuideDetail.tsx` | Guide section viewer |
| `src/components/dashboard/DetailPanels/PhotoDetail.tsx` | Photo/album viewer |
| `src/components/dashboard/DetailPanels/AlbumSummary.tsx` | Collapsed album card |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Conditional render: Dashboard vs Tab layout based on `useDashboardMode()` |
| `src/components/BottomNav.tsx` | Hide in dashboard mode |
| `src/components/TripHeader.tsx` | Create compact variant for dashboard |
| `src/hooks/use-leaflet-map.ts` | Ensure persistent map mode (no unmount on selection change) |
| `src/components/map/OverviewMap.tsx` | Add highlight pin capability, sync with context |
| `tailwind.config.ts` | Add landscape breakpoint utilities if needed |

---

## Left Column Design

```text
┌────────────────────────────┐
│ Quick Access Row           │
│ [Guide] [Stay] [Packing]   │  ← Icon buttons, tap → details in center
├────────────────────────────┤
│                            │
│ Scrollable Itinerary       │
│ ┌────────────────────────┐ │
│ │ Day 1 Header + Weather │ │
│ │ ┌────────────────────┐ │ │
│ │ │ Activity Card      │ │ │  ← Tap → syncs center + map
│ │ └────────────────────┘ │ │
│ │ ┌────────────────────┐ │ │
│ │ │ Activity Card      │ │ │
│ │ └────────────────────┘ │ │
│ └────────────────────────┘ │
│ ┌────────────────────────┐ │
│ │ Day 2...               │ │
│ └────────────────────────┘ │
│                            │
│ ... more days ...          │
│                            │
├────────────────────────────┤
│ ┌────────────────────────┐ │
│ │ 📷 Photo Album         │ │  ← Collapsed card, shows count
│ │ 24 memories captured   │ │    Tap → album in center
│ └────────────────────────┘ │
└────────────────────────────┘
```

### Compact Activity Cards

For the left column, activity cards need to be more compact:
- Single line: time + title
- Small category/status indicator
- Selected state: highlighted border
- Tap to expand details in center

---

## Center Column Design

The center column is context-aware and displays different content based on:

1. **Selection from left/right columns**
2. **Trip mode defaults** (pre/active/post)

### Content Types

**Activity Detail Panel:**
- Full activity info (title, time, description)
- Location with mini-map preview
- Links, phone, external actions
- Photo gallery for this activity
- Notes section
- Mark complete / add memory buttons

**Location Detail Panel:**
- Location name, category, address
- Visit status toggle
- Favorite toggle
- Memory upload
- Related itinerary items list
- Get directions dropdown

**Guide Detail Panel:**
- Full guide section content (Beaches, Restaurants, etc.)
- Same accordion-style as current GuideTab
- Favorites, notes, photos per item

**Photo/Album Experience:**
- Photo grid view
- Tap photo → full-screen with Ken Burns
- Caption, day, location metadata
- Previous/next navigation

---

## Right Column Design

```text
┌────────────────────────────┐
│                            │
│     Persistent Map         │
│     (Leaflet OverviewMap)  │
│                            │
│     - All trip pins        │
│     - Selected = pulsing   │
│     - Category colors      │
│     - Day filter chips     │
│                            │
│                            │
│                            │
│                            │
├────────────────────────────┤
│ [Filter: All] [Day 1]...   │  ← Horizontal scroll filter chips
└────────────────────────────┘
```

### Map Sync Behaviors

- **On activity select**: Pan to location, highlight pin
- **On pin click**: Show details in center, scroll to activity in left
- **On guide item select**: Pan to location if available
- **Highlight animation**: CSS pulse ring around selected pin

---

## Contacts Floating Action Button

```text
┌─────┐
│ 📞  │  ← Fixed position, bottom-right of header area
└─────┘
   │
   ▼ (on tap, slide-out drawer from right)
┌─────────────────────────────┐
│ Quick Contacts              │
├─────────────────────────────┤
│ 🚨 Emergency                │
│    911                      │
│    Local Police             │
├─────────────────────────────┤
│ 👨‍👩‍👧 Family                    │
│    Mom - (555) 123-4567     │
│    Dad - (555) 234-5678     │
├─────────────────────────────┤
│ ⛴️ Ferry Info               │
│    Boston Harbor - Book →   │
└─────────────────────────────┘
```

Uses Vaul drawer (already installed) sliding from right edge.

---

## Portrait Fallback

When viewport is portrait mobile:
- Render current tab-based layout (no changes to existing components)
- `useDashboardMode()` returns `{ isDashboard: false }`
- Index.tsx conditionally renders TabLayout vs DashboardLayout

---

## Technical Considerations

### Map Persistence

The OverviewMap in the right column must:
1. Never unmount when selection changes (unlike current modal approach)
2. Accept `highlightedPinId` prop to animate selected pin
3. Expose `panTo(lat, lng)` method via ref or context

Approach: Lift map state into RightColumn component, keep Leaflet instance alive for dashboard lifetime.

### Scroll Synchronization

When a pin is clicked:
1. Find matching itinerary item(s) by location_id
2. Scroll left column to that item using `scrollIntoView({ behavior: 'smooth', block: 'center' })`

### Performance

- Left column: Virtualize long itinerary lists using `react-window` or similar if > 50 items
- Center column: Lazy load heavy content (photo galleries)
- Map: Keep persistent, only update markers/highlights

---

## Implementation Phases

### Phase 1: Foundation (Core infrastructure)
1. Create `useDashboardMode()` hook
2. Create `DashboardSelectionContext`
3. Create `DashboardLayout.tsx` with 3-column CSS Grid
4. Update `Index.tsx` to conditionally render layouts

### Phase 2: Left Column
1. Create `LeftColumn.tsx` wrapper
2. Create `QuickIconRow.tsx` (Guide, Stay, Packing icons)
3. Adapt itinerary cards for compact display
4. Add `AlbumSummaryCard.tsx` at bottom
5. Wire up selection actions to context

### Phase 3: Right Column
1. Create `RightColumn.tsx` with persistent OverviewMap
2. Add pin highlight animation support
3. Add filter chips below map
4. Wire pin clicks to selection context

### Phase 4: Center Column
1. Create `CenterColumn.tsx` container
2. Create detail panel components (Activity, Location, Guide, Photo)
3. Implement mode-aware default content
4. Wire to selection context

### Phase 5: Polish
1. Create `CompactHeader.tsx`
2. Create `ContactsFAB.tsx` with drawer
3. Add scroll sync for left column
4. Transition animations between detail panels
5. Test landscape on various devices

---

## CSS Layout

```css
/* DashboardLayout grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(320px, 1.5fr) minmax(300px, 1fr);
  grid-template-rows: auto 1fr;
  height: 100vh;
  height: 100dvh; /* Dynamic viewport height for mobile */
  gap: 0;
}

.dashboard-header {
  grid-column: 1 / -1;
}

.left-column {
  overflow-y: auto;
  border-right: 1px solid var(--border);
}

.center-column {
  overflow-y: auto;
}

.right-column {
  display: flex;
  flex-direction: column;
}

/* Responsive adjustments */
@media (max-width: 1100px) {
  .dashboard-grid {
    grid-template-columns: 260px 1fr 280px;
  }
}

@media (max-width: 900px) and (orientation: portrait) {
  /* Falls back to tab layout - not using dashboard grid */
}
```

---

## Files Summary

### New Files (15)

| File | Purpose |
|------|---------|
| `src/contexts/DashboardSelectionContext.tsx` | Central selection state |
| `src/hooks/use-dashboard-mode.ts` | Viewport detection |
| `src/components/dashboard/DashboardLayout.tsx` | Grid container |
| `src/components/dashboard/LeftColumn.tsx` | Itinerary column |
| `src/components/dashboard/CenterColumn.tsx` | Detail panel |
| `src/components/dashboard/RightColumn.tsx` | Map column |
| `src/components/dashboard/QuickIconRow.tsx` | Guide/Stay shortcuts |
| `src/components/dashboard/ContactsFAB.tsx` | Floating contacts |
| `src/components/dashboard/CompactHeader.tsx` | Slim header |
| `src/components/dashboard/DetailPanels/ActivityDetail.tsx` | Activity view |
| `src/components/dashboard/DetailPanels/LocationDetail.tsx` | Location view |
| `src/components/dashboard/DetailPanels/GuideDetail.tsx` | Guide view |
| `src/components/dashboard/DetailPanels/PhotoDetail.tsx` | Photo viewer |
| `src/components/dashboard/AlbumSummaryCard.tsx` | Collapsed album |
| `src/components/dashboard/CompactActivityCard.tsx` | Slim activity card |

### Modified Files (6)

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Conditional dashboard vs tabs |
| `src/components/BottomNav.tsx` | Hide in dashboard mode |
| `src/components/map/OverviewMap.tsx` | Add highlight support |
| `src/hooks/use-leaflet-map.ts` | Support persistent mode |
| `tailwind.config.ts` | Add landscape utilities |
| `src/index.css` | Dashboard-specific styles |

---

## Estimated Scope

This is a **major architectural change** involving:
- ~15 new component files
- ~6 modified files  
- New context provider
- New viewport detection hook
- Significant layout restructuring

Recommend implementing in phases over multiple sessions to ensure each piece works correctly before moving to the next.
