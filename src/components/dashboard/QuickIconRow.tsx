import { Book, Home, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardSelection } from '@/contexts/DashboardSelectionContext';
import { cn } from '@/lib/utils';

/**
 * Quick access icon row at the top of the left column
 * Provides shortcuts to Guide, Stay (accommodation), and Packing list
 */
export function QuickIconRow() {
  const { selectItem, selectedItem } = useDashboardSelection();

  const buttons = [
    { 
      id: 'guide',
      icon: Book, 
      label: 'Guide',
      section: 'overview'
    },
    { 
      id: 'accommodation',
      icon: Home, 
      label: 'Stay',
      section: 'lodging'
    },
    { 
      id: 'packing',
      icon: ListChecks, 
      label: 'Packing',
      section: 'packing'
    },
  ];

  return (
    <div className="flex items-center justify-around gap-1 p-2 border-b border-border bg-card">
      {buttons.map(({ id, icon: Icon, label, section }) => {
        const isActive = selectedItem?.type === 'guide' && 
          (selectedItem.data as { section?: string })?.section === section;
        
        return (
          <Button
            key={id}
            variant="ghost"
            size="sm"
            className={cn(
              "flex-1 flex-col gap-0.5 h-auto py-2",
              isActive && "bg-accent text-accent-foreground"
            )}
            onClick={() => selectItem('guide', section, { section })}
          >
            <Icon className="w-4 h-4" />
            <span className="text-xs font-medium">{label}</span>
          </Button>
        );
      })}
    </div>
  );
}
