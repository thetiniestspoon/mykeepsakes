import { Camera, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useDashboardSelection } from '@/contexts/DashboardSelectionContext';
import { useMemories } from '@/hooks/use-memories';
import { useActiveTrip } from '@/hooks/use-trip';
import { cn } from '@/lib/utils';

/**
 * Collapsed album summary card at the bottom of the left column
 * Shows memory count and expands to album experience when clicked
 */
export function AlbumSummaryCard() {
  const { data: trip } = useActiveTrip();
  const { data: memories = [] } = useMemories(trip?.id);
  const { selectItem, selectedItem } = useDashboardSelection();

  const isActive = selectedItem?.type === 'album';
  const memoryCount = memories.length;
  const photoCount = memories.reduce((acc, m) => acc + (m.media?.length || 0), 0);

  const handleClick = () => {
    selectItem('album', 'main', null);
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isActive && "ring-2 ring-primary shadow-md"
      )}
      onClick={handleClick}
    >
      <CardContent className="p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
          <Camera className="w-5 h-5 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-foreground">Photo Album</h3>
          <p className="text-xs text-muted-foreground">
            {memoryCount === 0 
              ? 'No memories yet' 
              : `${memoryCount} ${memoryCount === 1 ? 'memory' : 'memories'} · ${photoCount} ${photoCount === 1 ? 'photo' : 'photos'}`
            }
          </p>
        </div>
        
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}
