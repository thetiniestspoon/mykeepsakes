import { QuickIconRow } from './QuickIconRow';
import { DashboardItinerary } from './DashboardItinerary';
import '@/preview/collage/collage.css';

interface LeftColumnProps {
  className?: string;
}

/**
 * Left column of the dashboard.
 *
 * Migrated to the Collage direction 2026-04-23 (Phase 4 #1 step 4c).
 * Presentation only: paper surface inherits from DashboardLayout /
 * SwipeableDashboard, internal type/spacing carried by child components
 * (QuickIconRow + DashboardItinerary) which are on a parallel migration
 * branch (W3.1b). This file intentionally stays a thin shell so the
 * child restyling and the column restyling can land independently.
 *
 * Contents:
 * - Quick access icons (Guide, Packing, Stay, Album)
 * - Scrollable itinerary with compact activity cards
 */
export function LeftColumn({ className }: LeftColumnProps) {
  return (
    <div
      className={`flex flex-col h-full ${className || ''}`}
      style={{ color: 'var(--c-ink)' }}
    >
      {/* Quick Access Icons — restyled on W3.1b branch */}
      <QuickIconRow />

      {/* Scrollable Itinerary */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ borderTop: '1px solid var(--c-line)' }}
      >
        <DashboardItinerary />
      </div>
    </div>
  );
}
