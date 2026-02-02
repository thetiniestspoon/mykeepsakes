import { useDashboardSelection } from '@/contexts/DashboardSelectionContext';
import { ActivityDetail } from './DetailPanels/ActivityDetail';
import { LocationDetail } from './DetailPanels/LocationDetail';
import { GuideDetail } from './DetailPanels/GuideDetail';
import { PhotoDetail } from './DetailPanels/PhotoDetail';
import { AlbumExperience } from './DetailPanels/AlbumExperience';
import { StayDetail } from './DetailPanels/StayDetail';
import { PackingDetail } from './DetailPanels/PackingDetail';
import { DefaultCenterContent } from './DetailPanels/DefaultCenterContent';
import type { ItineraryItem, Location, Memory } from '@/types/trip';
import type { MapLocation } from '@/types/map';

interface CenterColumnProps {
  className?: string;
}

/**
 * Center column of the dashboard showing context-aware detail panels
 * 
 * Content determined by:
 * 1. Current selection from left or right columns
 * 2. Trip mode defaults (pre → guide, active → current activity, post → album)
 */
export function CenterColumn({ className }: CenterColumnProps) {
  const { selectedItem, defaultFocus } = useDashboardSelection();

  // Render based on selection or default focus
  const renderContent = () => {
    if (selectedItem) {
      switch (selectedItem.type) {
        case 'activity':
          return <ActivityDetail activity={selectedItem.data as ItineraryItem} />;
        case 'location':
          return <LocationDetail location={selectedItem.data as (Location | MapLocation)} />;
        case 'guide':
          return <GuideDetail section={(selectedItem.data as { section: string })?.section} />;
        case 'photo':
          return <PhotoDetail memory={selectedItem.data as Memory} />;
        case 'album':
          return <AlbumExperience />;
        case 'accommodation':
          return <LocationDetail location={selectedItem.data as Location} isAccommodation />;
        case 'stay':
          return <StayDetail />;
        case 'packing':
          return <PackingDetail />;
        default:
          return <DefaultCenterContent focus={defaultFocus} />;
      }
    }

    // No selection - show default based on trip mode
    return <DefaultCenterContent focus={defaultFocus} />;
  };

  return (
    <div className={className}>
      <div className="p-4 h-full">
        {renderContent()}
      </div>
    </div>
  );
}
