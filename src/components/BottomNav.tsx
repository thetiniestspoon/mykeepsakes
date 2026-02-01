import { Calendar, Map, Book, Phone, Star, Images } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BottomNavIndicator } from '@/components/BottomNavIndicator';
import type { TabId } from '@/types/navigation';

export type { TabId };

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'itinerary', label: 'Itinerary', icon: Calendar },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'album', label: 'Album', icon: Images },
  { id: 'guide', label: 'Guide', icon: Book },
  { id: 'contacts', label: 'Contacts', icon: Phone },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-warm-lg">
      {/* Sliding indicator */}
      <BottomNavIndicator activeTab={activeTab} tabCount={tabs.length} />
      
      <div className="container flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 transition-transform duration-200",
                isActive && "scale-110"
              )} />
              <span className={cn(
                "text-xs font-medium transition-all duration-200",
                isActive && "font-semibold"
              )}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
