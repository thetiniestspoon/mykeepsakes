
# Portrait Dashboard: Swipeable 3-Panel Accordion

This plan converts the portrait view from the current tab-based layout to a swipeable accordion that mirrors the 3-column dashboard. Users swipe between Itinerary, Details, and Map panels, with a dots indicator at the bottom. All cross-column synchronization remains identical to landscape mode.

---

## Architecture Overview

```text
┌─────────────────────────────────────────┐
│ Compact Header                          │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │   SWIPEABLE PANEL CONTAINER     │    │
│  │                                 │    │
│  │   ◀ LeftColumn │ CenterColumn │ RightColumn ▶
│  │     (Itinerary)│   (Details)  │   (Map)      │
│  │                                 │    │
│  │   Subtle edge shadows hint      │    │
│  │   at adjacent content           │    │
│  └─────────────────────────────────┘    │
│                                         │
├─────────────────────────────────────────┤
│         ○    ●    ○                     │  ← Dots indicator
│     Itinerary  Details  Map             │
└─────────────────────────────────────────┘
```

---

## Key Changes

### 1. Always Use Dashboard Mode

Instead of switching between `DashboardLayout` (landscape) and `TabLayout` (portrait), the app will always use the synchronized dashboard system. The difference is how the 3 columns are displayed:

| Viewport | Display Mode |
|----------|--------------|
| Width >= 900px OR Landscape >= 667px | Side-by-side 3-column grid |
| Portrait / Narrow screens | Swipeable 3-panel accordion |

This ensures identical interactivity across all screen sizes.

### 2. New Swipeable Container Component

A new `SwipeableDashboard` component will:
- Render all 3 columns in a horizontal scroll-snap container
- Track active panel index (0, 1, 2)
- Show dots indicator at bottom
- Add subtle edge shadows on active panel
- Support touch swipe and programmatic navigation

---

## Component Architecture

### New Files

| File | Purpose |
|------|---------|
| `src/components/dashboard/SwipeableDashboard.tsx` | Main swipeable container with scroll-snap |
| `src/components/dashboard/PanelDotsIndicator.tsx` | Bottom dots navigation |

### Modified Files

| File | Changes |
|------|---------|
| `src/hooks/use-dashboard-mode.ts` | Add `isWideEnough` flag to distinguish display mode |
| `src/pages/Index.tsx` | Always use dashboard context, choose grid vs swipe layout |
| `src/index.css` | Add swipe container styles and edge shadows |

---

## Swipeable Container Design

### CSS Scroll-Snap Approach

Using native CSS scroll-snap for smooth, performant swiping:

```css
.swipe-container {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Hide scrollbar */
}

.swipe-container::-webkit-scrollbar {
  display: none;
}

.swipe-panel {
  flex: 0 0 100%;
  width: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  height: 100%;
  overflow-y: auto;
}
```

### Edge Shadow Hints

Subtle gradient shadows on panel edges to hint at more content:

```css
.swipe-panel::before,
.swipe-panel::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 20px;
  pointer-events: none;
  z-index: 10;
}

.swipe-panel::before {
  left: 0;
  background: linear-gradient(to right, hsl(var(--background) / 0.8), transparent);
}

.swipe-panel::after {
  right: 0;
  background: linear-gradient(to left, hsl(var(--background) / 0.8), transparent);
}

/* Hide left shadow on first panel, right shadow on last */
.swipe-panel:first-child::before { display: none; }
.swipe-panel:last-child::after { display: none; }
```

---

## Dots Indicator Component

```text
┌────────────────────────────────────────┐
│         ○    ●    ○                    │
│     Itinerary  Details  Map            │
└────────────────────────────────────────┘
```

### Behavior

- Shows 3 dots with subtle labels below
- Active dot is filled (primary color)
- Inactive dots are outlined
- Tapping a dot navigates to that panel
- Updates on scroll via intersection observer

### Implementation

```tsx
interface PanelDotsIndicatorProps {
  activeIndex: number;
  onDotClick: (index: number) => void;
}

const panels = [
  { label: 'Itinerary' },
  { label: 'Details' },
  { label: 'Map' },
];

function PanelDotsIndicator({ activeIndex, onDotClick }) {
  return (
    <nav className="flex items-center justify-center gap-6 py-3 border-t">
      {panels.map((panel, i) => (
        <button
          key={i}
          onClick={() => onDotClick(i)}
          className="flex flex-col items-center gap-1"
        >
          <span className={cn(
            "w-2.5 h-2.5 rounded-full transition-colors",
            i === activeIndex
              ? "bg-primary"
              : "border-2 border-muted-foreground"
          )} />
          <span className="text-xs text-muted-foreground">
            {panel.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
```

---

## SwipeableDashboard Component

### Structure

```tsx
function SwipeableDashboard({ header, leftColumn, centerColumn, rightColumn }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(1); // Start on Details

  // Track scroll position to update active index
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const panelWidth = container.offsetWidth;
      const index = Math.round(scrollLeft / panelWidth);
      setActiveIndex(index);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Programmatic navigation
  const scrollToPanel = (index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const panelWidth = container.offsetWidth;
    container.scrollTo({ left: index * panelWidth, behavior: 'smooth' });
  };

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <header>{header}</header>
      
      <div
        ref={containerRef}
        className="flex-1 swipe-container"
      >
        <div className="swipe-panel">{leftColumn}</div>
        <div className="swipe-panel">{centerColumn}</div>
        <div className="swipe-panel">{rightColumn}</div>
      </div>
      
      <PanelDotsIndicator
        activeIndex={activeIndex}
        onDotClick={scrollToPanel}
      />
    </div>
  );
}
```

---

## Updated Mode Detection

### Hook Changes

```typescript
interface DashboardModeResult {
  isDashboard: boolean;     // Always true now (we always use dashboard)
  isWideLayout: boolean;    // True = side-by-side grid, False = swipeable
  isPortrait: boolean;
  isMobileLandscape: boolean;
}

function calculateDashboardMode(): DashboardModeResult {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isPortrait = height > width;
  const isLandscape = !isPortrait;
  
  // Wide layout: show 3-column grid
  const isDesktop = width >= 900;
  const isMobileLandscape = isLandscape && width >= 667 && width < 900;
  const isWideLayout = isDesktop || isMobileLandscape;

  return {
    isDashboard: true, // Always dashboard mode now
    isWideLayout,
    isPortrait,
    isMobileLandscape,
  };
}
```

---

## Index.tsx Changes

```tsx
const Index = () => {
  const { isWideLayout } = useDashboardMode();
  
  // Always wrap in DashboardSelectionProvider
  // Choose layout based on screen width
  
  if (isWideLayout) {
    return (
      <DashboardSelectionProvider>
        <DashboardLayout ... />
      </DashboardSelectionProvider>
    );
  }
  
  return (
    <DashboardSelectionProvider>
      <SwipeableDashboard
        header={<CompactHeader />}
        leftColumn={<LeftColumn />}
        centerColumn={<CenterColumn />}
        rightColumn={<RightColumn />}
      />
    </DashboardSelectionProvider>
  );
};
```

---

## Synchronization Behavior

Since both layouts use the same `DashboardSelectionContext` and the same column components, all synchronization works identically:

### Activity Selection (Left Panel)
1. User taps activity in LeftColumn
2. `selectItem('activity', ...)` called
3. CenterColumn shows ActivityDetail
4. RightColumn highlights map pin
5. **In swipe mode**: User can swipe to Details or Map to see the result

### Map Pin Click (Right Panel)
1. User taps pin in RightColumn
2. `selectItem('location', ...)` called
3. CenterColumn shows LocationDetail
4. LeftColumn scrolls to matching activity
5. **In swipe mode**: User can swipe left to see details

### Auto-Navigate Option (Enhancement)

Optionally, we can auto-swipe to the Details panel when an item is selected:

```tsx
// In SwipeableDashboard
useEffect(() => {
  // When something is selected, auto-swipe to center panel
  if (selectedItem && activeIndex !== 1) {
    scrollToPanel(1);
  }
}, [selectedItem]);
```

---

## CSS Additions to index.css

```css
/* Swipeable Dashboard Container */
.swipe-container {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.swipe-container::-webkit-scrollbar {
  display: none;
}

.swipe-panel {
  flex: 0 0 100%;
  width: 100%;
  min-width: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  height: 100%;
  overflow-y: auto;
  position: relative;
}

/* Edge shadow hints */
.swipe-panel-wrapper {
  position: relative;
}

.swipe-edge-shadow-left,
.swipe-edge-shadow-right {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 24px;
  pointer-events: none;
  z-index: 10;
  opacity: 0.6;
}

.swipe-edge-shadow-left {
  left: 0;
  background: linear-gradient(to right, hsl(var(--muted) / 0.5), transparent);
}

.swipe-edge-shadow-right {
  right: 0;
  background: linear-gradient(to left, hsl(var(--muted) / 0.5), transparent);
}
```

---

## Implementation Steps

### Step 1: Update Hook
- Modify `use-dashboard-mode.ts` to add `isWideLayout` flag
- Keep `isDashboard: true` always

### Step 2: Create Swipe Components
- Create `SwipeableDashboard.tsx` with scroll-snap container
- Create `PanelDotsIndicator.tsx` with tappable dots

### Step 3: Add CSS
- Add swipe container styles to `index.css`
- Add edge shadow styles

### Step 4: Update Index.tsx
- Always wrap in `DashboardSelectionProvider`
- Conditionally render `DashboardLayout` or `SwipeableDashboard`
- Remove old tab-based layout code

### Step 5: Test Synchronization
- Verify activity selection syncs across all panels
- Verify map pin clicks update other panels
- Test swipe gesture smoothness
- Verify dots indicator tracks correctly

---

## Files Summary

### New Files (2)

| File | Purpose |
|------|---------|
| `src/components/dashboard/SwipeableDashboard.tsx` | Swipeable 3-panel container |
| `src/components/dashboard/PanelDotsIndicator.tsx` | Bottom dots navigation |

### Modified Files (3)

| File | Changes |
|------|---------|
| `src/hooks/use-dashboard-mode.ts` | Add `isWideLayout` flag |
| `src/pages/Index.tsx` | Always use dashboard, choose layout mode |
| `src/index.css` | Add swipe container and edge shadow styles |

---

## Removed Code

The old tab-based layout can be removed since we're unifying on the dashboard system:
- `BottomNav` component no longer needed for main navigation
- `TabId` type simplified or removed
- Old tab switching logic in Index.tsx replaced
