import { useMemo } from 'react';
import { Backpack, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { PACKING_LIST } from '@/lib/itinerary-data';
import type { PackingItem } from '@/lib/itinerary-data';
import { useChecklistItems, useToggleChecklistItem } from '@/hooks/use-trip-data';

interface PackingItemRowProps {
  item: PackingItem;
}

function PackingItemRow({ item }: PackingItemRowProps) {
  const { data: checklistItems } = useChecklistItems();
  const toggleChecklist = useToggleChecklistItem();

  const isCompleted = checklistItems?.[item.id] ?? false;

  return (
    <label className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/30 cursor-pointer transition-colors">
      <Checkbox
        checked={isCompleted}
        onCheckedChange={(checked) =>
          toggleChecklist.mutate({ itemId: item.id, isCompleted: !!checked })
        }
      />
      <span className={cn(
        "text-sm flex-1",
        isCompleted && "line-through text-muted-foreground"
      )}>
        {item.item}
      </span>
      {isCompleted && (
        <Check className="w-4 h-4 text-green-500" />
      )}
    </label>
  );
}

/**
 * Packing list detail view for the center column
 * Shows packing checklist with category grouping
 */
export function PackingDetail() {
  const { data: checklistItems } = useChecklistItems();

  // Group packing items by category
  const packingByCategory = useMemo(() => {
    return PACKING_LIST.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, PackingItem[]>);
  }, []);

  // Calculate packing progress
  const packedCount = PACKING_LIST.filter(item => checklistItems?.[item.id]).length;
  const totalItems = PACKING_LIST.length;
  const progressPercent = totalItems > 0 ? (packedCount / totalItems) * 100 : 0;

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6 pb-20">
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
            <Backpack className="w-8 h-8 text-secondary-foreground" />
          </div>
          <h2 className="font-display text-2xl text-foreground">Packing List</h2>
          <p className="text-muted-foreground">Don't forget anything important</p>
        </div>

        {/* Progress Section */}
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Packing Progress</span>
            <span className="text-sm text-muted-foreground">
              {packedCount} / {totalItems} items
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          {packedCount === totalItems && totalItems > 0 && (
            <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
              <Check className="w-4 h-4" />
              All packed and ready to go!
            </p>
          )}
        </div>

        {/* Categories */}
        <div className="space-y-4">
          {Object.entries(packingByCategory).map(([category, items]) => {
            const categoryPacked = items.filter(item => checklistItems?.[item.id]).length;
            const categoryTotal = items.length;

            return (
              <div key={category} className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">{category}</h3>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    categoryPacked === categoryTotal
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "bg-secondary text-muted-foreground"
                  )}>
                    {categoryPacked}/{categoryTotal}
                  </span>
                </div>
                <div className="space-y-1">
                  {items.map((item) => (
                    <PackingItemRow key={item.id} item={item} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
