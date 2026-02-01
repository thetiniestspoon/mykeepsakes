import { Suspense, lazy, useEffect, useRef, useCallback } from 'react';
import { QuickIconRow } from './QuickIconRow';
import { AlbumSummaryCard } from './AlbumSummaryCard';
import { useDashboardSelection } from '@/contexts/DashboardSelectionContext';
import { ItinerarySkeleton } from '@/components/LoadingSkeletons';

// Lazy load the itinerary content
const DatabaseItineraryTab = lazy(() => import('@/components/DatabaseItineraryTab'));

interface LeftColumnProps {
  className?: string;
}

/**
 * Left column of the dashboard containing:
 * - Quick access icons (Guide, Stay, Packing)
 * - Scrollable itinerary
 * - Album summary card at bottom
 */
export function LeftColumn({ className }: LeftColumnProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { registerScrollHandler } = useDashboardSelection();

  // Register scroll-to-item handler for cross-column synchronization
  const handleScrollToItem = useCallback((itemId: string) => {
    const element = document.getElementById(`activity-${itemId}`);
    if (element && scrollContainerRef.current) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, []);

  useEffect(() => {
    const unregister = registerScrollHandler(handleScrollToItem);
    return unregister;
  }, [registerScrollHandler, handleScrollToItem]);

  return (
    <div className={className} ref={scrollContainerRef}>
      {/* Quick Access Icons */}
      <QuickIconRow />
      
      {/* Scrollable Itinerary */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <Suspense fallback={<ItinerarySkeleton />}>
          <DatabaseItineraryTab />
        </Suspense>
      </div>
      
      {/* Album Summary Card */}
      <div className="border-t border-border p-3">
        <AlbumSummaryCard />
      </div>
    </div>
  );
}
