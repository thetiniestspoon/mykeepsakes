import { useState, useEffect } from 'react';

interface DashboardModeResult {
  /** Whether to show the dashboard system (always true now) */
  isDashboard: boolean;
  /** Whether to show side-by-side 3-column grid (vs swipeable accordion) */
  isWideLayout: boolean;
  /** Whether the device is in portrait orientation */
  isPortrait: boolean;
  /** Whether this is a mobile device in landscape */
  isMobileLandscape: boolean;
}

/**
 * Hook to detect whether the app should display the 3-column dashboard layout
 * 
 * Dashboard mode triggers when:
 * - Width >= 900px (desktop/large tablet) regardless of orientation
 * - Landscape orientation with width >= 667px (mobile landscape)
 * 
 * Portrait mobile (< 768px width in portrait) falls back to tab-based layout
 */
export function useDashboardMode(): DashboardModeResult {
  const [state, setState] = useState<DashboardModeResult>(() => {
    // SSR-safe initial state
    if (typeof window === 'undefined') {
      return { isDashboard: true, isWideLayout: false, isPortrait: true, isMobileLandscape: false };
    }
    return calculateDashboardMode();
  });

  useEffect(() => {
    // Media query for landscape on mobile
    const landscapeMQ = window.matchMedia('(orientation: landscape) and (min-width: 667px)');
    // Media query for desktop/large screens
    const desktopMQ = window.matchMedia('(min-width: 900px)');
    // Media query for portrait detection
    const portraitMQ = window.matchMedia('(orientation: portrait)');

    const update = () => {
      setState(calculateDashboardMode());
    };

    // Initial calculation
    update();

    // Listen for changes
    landscapeMQ.addEventListener('change', update);
    desktopMQ.addEventListener('change', update);
    portraitMQ.addEventListener('change', update);
    window.addEventListener('resize', update);

    return () => {
      landscapeMQ.removeEventListener('change', update);
      desktopMQ.removeEventListener('change', update);
      portraitMQ.removeEventListener('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return state;
}

function calculateDashboardMode(): DashboardModeResult {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isPortrait = height > width;
  const isLandscape = !isPortrait;
  
  // Desktop/large tablet: show 3-column grid
  const isDesktop = width >= 900;
  
  // Mobile landscape: show 3-column grid if width >= 667px
  const isMobileLandscape = isLandscape && width >= 667 && width < 900;
  
  // Wide layout shows side-by-side columns, otherwise swipeable accordion
  const isWideLayout = isDesktop || isMobileLandscape;

  return {
    isDashboard: true, // Always use dashboard system now
    isWideLayout,
    isPortrait,
    isMobileLandscape,
  };
}
