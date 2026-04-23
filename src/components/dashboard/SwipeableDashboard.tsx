import { ReactNode, useRef, useState, useEffect, useCallback } from 'react';
import { PanelDotsIndicator } from './PanelDotsIndicator';
import { useDashboardSelection } from '@/contexts/DashboardSelectionContext';
import '@/preview/collage/collage.css';

interface SwipeableDashboardProps {
  header: ReactNode;
  leftColumn: ReactNode;
  centerColumn: ReactNode;
  rightColumn: ReactNode;
}

/**
 * Swipeable 3-panel dashboard for portrait/narrow viewports.
 *
 * Migrated to the Collage direction 2026-04-23 (Phase 4 #1 step 4b).
 * Swipe mechanics (CSS scroll-snap, selection-aware auto-nav, panel
 * navigator registration) are UNCHANGED. Presentation swapped to
 * Collage tokens — crème shell, paper panel surfaces, ink hairline
 * dividers. PanelDotsIndicator remains untouched; it lives on a
 * parallel migration branch.
 */
export function SwipeableDashboard({
  header,
  leftColumn,
  centerColumn,
  rightColumn,
}: SwipeableDashboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0); // Start on Itinerary
  const { selectedItem } = useDashboardSelection();

  // Track scroll position to update active index
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const panelWidth = container.offsetWidth;
      const index = Math.round(scrollLeft / panelWidth);
      setActiveIndex(Math.max(0, Math.min(2, index)));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Programmatic navigation
  const scrollToPanel = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const panelWidth = container.offsetWidth;
    container.scrollTo({ left: index * panelWidth, behavior: 'smooth' });
  }, []);

  // Auto-navigate to Details panel when an item is selected
  useEffect(() => {
    if (selectedItem && activeIndex !== 1) {
      scrollToPanel(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem?.id, selectedItem?.type]);

  // Register panel navigator with context for bidirectional navigation
  const { registerPanelNavigator } = useDashboardSelection();

  useEffect(() => {
    return registerPanelNavigator(scrollToPanel);
  }, [registerPanelNavigator, scrollToPanel]);

  return (
    <div
      className="h-dvh flex flex-col overflow-hidden"
      style={{ background: 'var(--c-creme)' }}
    >
      {/* Header band — crème surface + hairline ink bottom, matches CompactHeader */}
      <header
        className="z-40 relative"
        style={{
          borderBottom: '1px solid var(--c-line)',
          background: 'color-mix(in srgb, var(--c-creme) 95%, transparent)',
          backdropFilter: 'saturate(1.05) blur(4px)',
          WebkitBackdropFilter: 'saturate(1.05) blur(4px)',
        }}
      >
        {header}
      </header>

      {/* Swipeable Panel Container — scroll-snap mechanics preserved via .swipe-* CSS classes */}
      <div
        ref={containerRef}
        className="swipe-container flex-1"
        style={{ background: 'var(--c-creme)' }}
      >
        {/* Panel 0: Itinerary — paper surface */}
        <div
          className="swipe-panel"
          style={{ background: 'var(--c-paper)' }}
        >
          <div className="swipe-panel-content">{leftColumn}</div>
          {activeIndex === 0 && (
            <div className="swipe-edge-shadow-right" aria-hidden="true" />
          )}
        </div>

        {/* Panel 1: Details — crème workbench surface */}
        <div
          className="swipe-panel"
          style={{ background: 'var(--c-creme)' }}
        >
          {activeIndex === 1 && (
            <div className="swipe-edge-shadow-left" aria-hidden="true" />
          )}
          <div className="swipe-panel-content">{centerColumn}</div>
          {activeIndex === 1 && (
            <div className="swipe-edge-shadow-right" aria-hidden="true" />
          )}
        </div>

        {/* Panel 2: Map — paper surface */}
        <div
          className="swipe-panel"
          style={{ background: 'var(--c-paper)' }}
        >
          {activeIndex === 2 && (
            <div className="swipe-edge-shadow-left" aria-hidden="true" />
          )}
          <div className="swipe-panel-content">{rightColumn}</div>
        </div>
      </div>

      {/* Bottom Dots Indicator — untouched on this branch (W3.1b scope) */}
      <PanelDotsIndicator activeIndex={activeIndex} onDotClick={scrollToPanel} />
    </div>
  );
}
