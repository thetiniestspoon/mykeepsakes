
# Itinerary Enhancement Plan

This plan covers implementing 7 major improvements to the Itinerary page: Today Mode with auto-scroll, swipe gestures, functional drag-and-drop reordering, quick-add button, visual timeline view, weather integration, and memory quick-capture prompts.

---

## Overview of Changes

### Features Being Implemented
1. **Today Mode with Auto-Scroll** - Filter to today's activities with automatic scroll to next planned item
2. **Swipe Gestures** - Mobile swipe right to complete, swipe left for action menu
3. **Functional Drag-and-Drop** - Wire up existing reorder handles to actually persist changes
4. **Quick-Add Activity Button** - Floating action button and inline quick-add row
5. **Visual Timeline View** - Time-blocked layout with "Now" indicator during active trips
6. **Weather Integration** - Show forecasts in day headers using OpenWeatherMap API
8. **Memory Quick-Capture** - Prompt for photo/rating after marking activity "done"

---

## Phase 1: Foundation - Today Mode Toggle

### New Files
- `src/components/itinerary/TodayModeToggle.tsx` - Toggle switch component for "Timeline vs Today" view
- `src/hooks/use-today-mode.ts` - Hook to manage today mode state and auto-scroll logic

### Changes to Existing Files

**`src/components/DatabaseItineraryTab.tsx`**
- Add `TodayModeToggle` component below the progress bar
- When Today Mode is active:
  - Filter days array to only show today's date (or nothing if trip is pre/post)
  - Auto-scroll to the next planned (non-completed) activity using `scrollIntoView`
- Store today mode preference in localStorage for persistence

**`src/components/itinerary/DatabaseActivityCard.tsx`**
- Add a `data-activity-id` attribute for scroll targeting
- Add a "current" visual indicator (pulsing border/glow) for the next planned activity

### Technical Details
```text
+------------------------------------------+
| Overall Progress: 5/12 (42%)             |
| ========================================  |
|                                          |
|   [ Timeline ]  [ Today ]  ← Toggle      |
|                                          |
+------------------------------------------+
```

---

## Phase 2: Swipe Gestures for Mobile

### New Files
- `src/components/itinerary/SwipeableActivityCard.tsx` - Wrapper component with touch gesture handling

### Implementation Approach
- Use native touch events (`touchstart`, `touchmove`, `touchend`) rather than a library for lightweight implementation
- Track horizontal swipe distance with a threshold (50px minimum)
- **Swipe Right**: Complete/uncomplete the activity with green background reveal animation
- **Swipe Left**: Reveal action menu (Edit, Skip, Delete, Add Memory buttons)
- Include visual feedback during swipe (background color transitions)

### Changes to Existing Files

**`src/components/itinerary/DatabaseDayCard.tsx`**
- Wrap `DatabaseActivityCard` in `SwipeableActivityCard`
- Pass action handlers for edit, skip, delete, and add memory

**`src/components/itinerary/DatabaseActivityCard.tsx`**
- Accept new props: `onEdit`, `onSkip`, `onDelete`, `onAddMemory`
- Export action menu component separately for reuse

### Visual Design
```text
Swipe Right →
+----------------------------------------+
|  ✓  |  [Activity Card Content...]      |
| GREEN                                   |
+----------------------------------------+

← Swipe Left
+----------------------------------------+
|   [Activity Card...]  | Edit Skip Del  |
|                       |  Action Menu   |
+----------------------------------------+
```

---

## Phase 3: Functional Drag-and-Drop Reordering

### New Hook
- `src/hooks/use-reorder-items.ts` - Mutation hook to persist sort_index changes

### Changes to Existing Files

**`src/hooks/use-database-itinerary.ts`**
- Add `useReorderDayItems` mutation that updates `sort_index` for all items in a day

**`src/components/itinerary/DatabaseDayCard.tsx`**
- Update `handleDragEnd` to call the reorder mutation
- Optimistically update the local state before the database confirms
- Add a subtle animation when items settle into new positions

### Reorder Logic
```text
1. User drags item B above item A
2. Calculate new sort indices: A=1, B=0, C=2
3. Optimistically update UI
4. Batch update all changed sort_index values in DB
5. On error, revert to previous order and show toast
```

---

## Phase 4: Quick-Add Activity Button

### New Files
- `src/components/itinerary/QuickAddButton.tsx` - Floating action button (FAB) component
- `src/components/itinerary/QuickAddRow.tsx` - Inline quick-add row at end of each day

### Implementation

**Floating Action Button (FAB)**
- Fixed position at bottom-right, above the bottom navigation
- Opens a sheet/dialog for adding an activity to "today" or selected day
- Uses existing `ActivityEditor` component in "create" mode

**Inline Quick-Add Row**
- Appears at the bottom of each day's activity list
- Minimal UI: "+" icon with "Add activity..." placeholder text
- Click expands to quick entry form or opens ActivityEditor

### Changes to Existing Files

**`src/components/itinerary/DatabaseDayCard.tsx`**
- Add `QuickAddRow` after the activities list inside `CardContent`

**`src/components/DatabaseItineraryTab.tsx`**
- Add `QuickAddButton` FAB at the end of the component (outside the days loop)

---

## Phase 5: Visual Timeline View

### New Files
- `src/components/itinerary/TimelineView.tsx` - Alternative timeline rendering component
- `src/components/itinerary/TimelineItem.tsx` - Individual timeline activity
- `src/components/itinerary/NowIndicator.tsx` - "Now" line that shows current time position

### Implementation

**Timeline Layout**
- Vertical line on the left with time markers (hourly)
- Activities positioned based on their `start_time`
- Activities without times grouped at the top in an "Anytime" section
- "Now" indicator line shows current time during active trip mode

**Integration**
- Add a view toggle: "Cards" vs "Timeline" (persisted preference)
- Timeline view replaces the card layout when selected
- Falls back to cards on very narrow screens

### Visual Design
```text
      ANYTIME
      ├─ Beach packing
      ├─ Check weather
      
      8:00 AM ──────────
      ├─ Breakfast at Cafe
      
      9:30 AM ──────────
      ├─ Head to beach
      
     ═══ NOW ═══════════ (red line)
      
      11:00 AM ─────────
      ├─ Beach activities
```

---

## Phase 6: Weather Integration

### New Files
- `src/hooks/use-weather.ts` - Hook to fetch weather from OpenWeatherMap
- `src/components/itinerary/WeatherBadge.tsx` - Compact weather display component

### API Integration
- Use OpenWeatherMap 5-day forecast API (free tier)
- Fetch forecast for trip location coordinates
- Cache responses for 1 hour using React Query's `staleTime`

### Secret Required
- `OPENWEATHERMAP_API_KEY` - Will need to be added via the secrets manager

### Changes to Existing Files

**`src/components/itinerary/DatabaseDayCard.tsx`**
- Add `WeatherBadge` in the card header next to the date
- Show high/low temperature and weather icon
- Only display for days within the 5-day forecast window

### Weather Badge Design
```text
+----------------------------------+
| Day 3: Beach Day                 |
| Saturday, July 26    ☀️ 78°/65°  |
+----------------------------------+
```

---

## Phase 7: Memory Quick-Capture Prompt

### New Files
- `src/components/itinerary/MemoryPromptDialog.tsx` - Lightweight post-completion dialog

### Implementation
- After marking an activity as "done", show a brief prompt dialog
- Options: "Add a photo" (opens camera/file picker), "Skip for now", or "Rate it" (optional star rating)
- If photo is selected, opens the existing `MemoryCaptureDialog` pre-filled with:
  - Current day
  - The completed activity as the linked item

### Changes to Existing Files

**`src/components/itinerary/DatabaseActivityCard.tsx`**
- After `updateStatus.mutate({ itemId, status: 'done' })` succeeds
- Show the `MemoryPromptDialog` when marking as done
- Track "don't ask again for this session" preference

**`src/hooks/use-database-itinerary.ts`**
- Update `useUpdateItemStatus` to return promise/callback for post-completion actions

### Prompt Dialog Design
```text
+----------------------------------+
|   ✓ Completed: Beach Day!        |
|                                  |
|   Capture this memory?           |
|                                  |
|   [📷 Add Photo]  [Skip]         |
|                                  |
|   □ Don't ask again today        |
+----------------------------------+
```

---

## File Summary

### New Files (11 total)
| File | Purpose |
|------|---------|
| `src/hooks/use-today-mode.ts` | Today mode state and auto-scroll |
| `src/hooks/use-reorder-items.ts` | Drag-drop persistence mutation |
| `src/hooks/use-weather.ts` | OpenWeatherMap API integration |
| `src/components/itinerary/TodayModeToggle.tsx` | Timeline vs Today toggle |
| `src/components/itinerary/SwipeableActivityCard.tsx` | Touch gesture wrapper |
| `src/components/itinerary/QuickAddButton.tsx` | Floating action button |
| `src/components/itinerary/QuickAddRow.tsx` | Inline add row |
| `src/components/itinerary/TimelineView.tsx` | Timeline layout container |
| `src/components/itinerary/TimelineItem.tsx` | Timeline activity item |
| `src/components/itinerary/NowIndicator.tsx` | Current time indicator |
| `src/components/itinerary/WeatherBadge.tsx` | Weather display component |
| `src/components/itinerary/MemoryPromptDialog.tsx` | Post-completion prompt |

### Modified Files (5 total)
| File | Changes |
|------|---------|
| `src/components/DatabaseItineraryTab.tsx` | Add Today toggle, FAB, view mode |
| `src/components/itinerary/DatabaseDayCard.tsx` | Swipe wrapper, reorder logic, quick-add, weather |
| `src/components/itinerary/DatabaseActivityCard.tsx` | Memory prompt, action handlers |
| `src/hooks/use-database-itinerary.ts` | Reorder mutation, status update improvements |
| `src/components/itinerary/DraggableActivity.tsx` | Enable/improve drag interactions |

---

## Technical Considerations

### Dependencies
- No new npm packages required (touch events are native, @dnd-kit already installed)
- Weather API will use fetch via React Query

### Performance
- Swipe gestures use `transform` for GPU-accelerated animations
- Timeline view uses virtual positioning, not DOM manipulation
- Weather data cached for 1 hour per location

### Mobile-First
- Swipe gestures only enabled on touch devices (via `useIsMobile` hook)
- FAB positioned to avoid thumb zones
- Timeline view adapts to narrow screens

### Accessibility
- Drag handles have proper ARIA labels
- Swipe actions also available via tap menu
- Timeline view maintains keyboard navigation

---

## Implementation Order

1. **Phase 3: Drag-and-Drop** - Quick win, existing UI just needs wiring
2. **Phase 4: Quick-Add** - High user value, straightforward
3. **Phase 1: Today Mode** - Core UX improvement
4. **Phase 2: Swipe Gestures** - Mobile polish
5. **Phase 7: Memory Prompt** - Engagement feature
6. **Phase 5: Timeline View** - Visual upgrade
7. **Phase 6: Weather** - Nice-to-have, requires API key setup
