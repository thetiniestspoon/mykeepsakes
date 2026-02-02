import { QuickIconRow } from './QuickIconRow';
import { DashboardItinerary } from './DashboardItinerary';

interface LeftColumnProps {
  className?: string;
}

/**
 * Left column of the dashboard containing:
 * - Quick access icons (Guide, Packing, Stay, Album)
 * - Scrollable itinerary with compact activity cards
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
    </div>
  );
}
