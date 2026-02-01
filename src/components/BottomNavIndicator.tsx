import { cn } from '@/lib/utils';
import type { TabId } from '@/types/navigation';

interface BottomNavIndicatorProps {
  activeTab: TabId;
  tabCount: number;
}

// Map tab IDs to their index position
const tabIndexMap: Record<TabId, number> = {
  itinerary: 0,
  map: 1,
  album: 2,
  guide: 3,
  contacts: 4,
  lodging: 5,
  favorites: 6,
};

export function BottomNavIndicator({ activeTab, tabCount }: BottomNavIndicatorProps) {
  const activeIndex = tabIndexMap[activeTab] ?? 0;
  const position = (activeIndex / tabCount) * 100;
  const width = 100 / tabCount;

  return (
    <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden">
      <div 
        className="h-full bg-primary transition-transform duration-200 ease-out"
        style={{ 
          width: `${width}%`,
          transform: `translateX(${position}%)`,
        }}
      />
    </div>
  );
}
