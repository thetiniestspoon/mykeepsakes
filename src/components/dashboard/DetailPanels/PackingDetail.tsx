import { useMemo } from 'react';
import { Backpack, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { PACKING_LIST, type PackingItem } from '@/lib/itinerary-data';
import { useChecklistItems, useToggleChecklistItem } from '@/hooks/use-trip-data';

/**
 * Full-page packing list view when Packing tab is selected
 */
export function PackingDetail() {
  const { data: checklistItems = {}, isLoading } = useChecklistItems();
  const toggleChecklist = useToggleChecklistItem();

  // Group packing items by category
  const packingByCategory = useMemo(() => {
    return PACKING_LIST.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, PackingItem[]>);
  }, []);

  // Calculate progress
  const packedCount = PACKING_LIST.filter(item => checklistItems[item.id]).length;
  const totalItems = PACKING_LIST.length;
  const progressPercent = totalItems > 0 ? (packedCount / totalItems) * 100 : 0;

  // Calculate per-category progress
  const categoryProgress = useMemo(() => {
    const progress: Record<string, { packed: number; total: number }> = {};
    for (const [category, items] of Object.entries(packingByCategory)) {
      const packed = items.filter(item => checklistItems[item.id]).length;
      progress[category] = { packed, total: items.length };
    }
    return progress;
  }, [packingByCategory, checklistItems]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
            <Backpack className="w-6 h-6 text-secondary-foreground" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-foreground">Packing List</h2>
            <p className="text-sm text-muted-foreground">
              {packedCount} of {totalItems} items packed
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Categories */}
        <div className="space-y-6">
          {Object.entries(packingByCategory).map(([category, items]) => {
            const progress = categoryProgress[category];
            const isComplete = progress.packed === progress.total;
            
            return (
              <div key={category} className="space-y-2">
                {/* Category Header */}
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground">{category}</h3>
                  <Badge 
                    variant={isComplete ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {isComplete ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Complete
                      </>
                    ) : (
                      `${progress.packed}/${progress.total}`
                    )}
                  </Badge>
                </div>
                
                {/* Items */}
                <div className="space-y-1">
                  {items.map((item) => {
                    const isCompleted = checklistItems[item.id] ?? false;
                    
                    return (
                      <label 
                        key={item.id} 
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={(checked) => 
                            toggleChecklist.mutate({ itemId: item.id, isCompleted: !!checked })
                          }
                        />
                        <span className={cn(
                          "text-sm",
                          isCompleted && "line-through text-muted-foreground"
                        )}>
                          {item.item}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
