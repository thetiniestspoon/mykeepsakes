import { ReactNode, useRef, useState, useEffect, useCallback } from 'react';
import { PanelDotsIndicator } from './PanelDotsIndicator';
import { useDashboardSelection } from '@/contexts/DashboardSelectionContext';

interface SwipeableDashboardProps {
  header: ReactNode;
  leftColumn: ReactNode;
  centerColumn: ReactNode;
  rightColumn: ReactNode;
}

/**
 * Swipeable 3-panel dashboard for portrait/narrow viewports.
 * Uses CSS scroll-snap for smooth, native-feeling swipe gestures.
 * Syncs with DashboardSelectionContext for cross-panel coordination.
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
  }, [selectedItem?.id, selectedItem?.type]);

  // Register panel navigator with context for bidirectional navigation
  const { registerPanelNavigator } = useDashboardSelection();
  
  useEffect(() => {
    return registerPanelNavigator(scrollToPanel);
  }, [registerPanelNavigator, scrollToPanel]);

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-40">
        {header}
      </header>
      
      {/* Swipeable Panel Container */}
      <div
        ref={containerRef}
        className="swipe-container flex-1"
      >
        {/* Panel 0: Itinerary */}
        <div className="swipe-panel">
          <div className="swipe-panel-content">
            {leftColumn}
          </div>
          {/* Right edge shadow (hints at Details panel) */}
          {activeIndex === 0 && (
            <div className="swipe-edge-shadow-right" aria-hidden="true" />
          )}
        </div>
        
        {/* Panel 1: Details */}
        <div className="swipe-panel">
          {/* Left edge shadow (hints at Itinerary panel) */}
          {activeIndex === 1 && (
            <div className="swipe-edge-shadow-left" aria-hidden="true" />
          )}
          <div className="swipe-panel-content">
            {centerColumn}
          </div>
          {/* Right edge shadow (hints at Map panel) */}
          {activeIndex === 1 && (
            <div className="swipe-edge-shadow-right" aria-hidden="true" />
          )}
        </div>
        
        {/* Panel 2: Map */}
        <div className="swipe-panel">
          {/* Left edge shadow (hints at Details panel) */}
          {activeIndex === 2 && (
            <div className="swipe-edge-shadow-left" aria-hidden="true" />
          )}
          <div className="swipe-panel-content">
            {rightColumn}
          </div>
        </div>
      </div>
      
      {/* Bottom Dots Indicator */}
      <PanelDotsIndicator
        activeIndex={activeIndex}
        onDotClick={scrollToPanel}
      />
    </div>
  );
}
