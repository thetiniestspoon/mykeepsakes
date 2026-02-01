import { QuickIconRow } from './QuickIconRow';
import { AlbumSummaryCard } from './AlbumSummaryCard';
import { DashboardItinerary } from './DashboardItinerary';

interface LeftColumnProps {
  className?: string;
}

/**
 * Left column of the dashboard containing:
 * - Quick access icons (Guide, Stay, Packing)
 * - Scrollable itinerary with compact activity cards
 * - Album summary card at bottom
 */
export function LeftColumn({ className }: LeftColumnProps) {
  return (
    <div className={`flex flex-col h-full ${className || ''}`}>
      {/* Quick Access Icons */}
      <QuickIconRow />
      
      {/* Scrollable Itinerary */}
      <div className="flex-1 overflow-y-auto">
        <DashboardItinerary />
      </div>
      
      {/* Album Summary Card */}
      <div className="border-t border-border">
        <AlbumSummaryCard />
      </div>
    </div>
  );
}
