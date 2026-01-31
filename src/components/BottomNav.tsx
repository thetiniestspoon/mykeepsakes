import { Calendar, Map, Book, Phone, Star, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TabId = 'itinerary' | 'lodging' | 'map' | 'guide' | 'favorites' | 'contacts';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'itinerary', label: 'Itinerary', icon: Calendar },
  { id: 'lodging', label: 'Lodging', icon: Home },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'guide', label: 'Guide', icon: Book },
  { id: 'contacts', label: 'Contacts', icon: Phone },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-warm-lg">
      <div className="container flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "scale-110 transition-transform")} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
