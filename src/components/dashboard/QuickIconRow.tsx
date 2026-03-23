import { Book, Home, ListChecks, Images, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardSelection, type SelectionType } from '@/contexts/DashboardSelectionContext';
import { cn } from '@/lib/utils';

/**
 * Quick access icon row at the top of the left column
 * Provides shortcuts to Guide, Packing, Stay, and Album
 */
export function QuickIconRow() {
  const { selectItem, selectedItem } = useDashboardSelection();

  const buttons = [
    { 
      id: 'guide',
      icon: Book, 
      label: 'Guide',
      type: 'guide' as SelectionType,
      section: 'overview'
    },
    { 
      id: 'packing',
      icon: ListChecks, 
      label: 'Packing',
      type: 'packing' as SelectionType,
      section: 'packing'
    },
    { 
      id: 'stay',
      icon: Home, 
      label: 'Stay',
      type: 'stay' as SelectionType,
      section: 'lodging'
    },
    {
      id: 'album',
      icon: Images,
      label: 'Album',
      type: 'album' as SelectionType,
      section: 'album'
    },
    {
      id: 'people',
      icon: Users,
      label: 'People',
      type: 'people' as SelectionType,
      section: 'people'
    },
  ];

  return (
    <div className="flex items-center justify-around gap-1 p-2 border-b border-border bg-card">
      {buttons.map(({ id, icon: Icon, label, type, section }) => {
        const isActive = selectedItem?.type === type;
        
        return (
          <Button
            key={id}
            variant="ghost"
            size="sm"
            className={cn(
              "flex-1 flex-col gap-0.5 h-auto py-2",
              isActive && "bg-accent text-accent-foreground"
            )}
            onClick={() => selectItem(type, section, { section })}
          >
            <Icon className="w-4 h-4" />
            <span className="text-xs font-medium">{label}</span>
          </Button>
        );
      })}
    </div>
  );
}
