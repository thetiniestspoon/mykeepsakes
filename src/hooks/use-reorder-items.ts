import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useActiveTrip } from '@/hooks/use-trip';

interface ReorderItem {
  id: string;
  sort_index: number;
}

// Hook to reorder itinerary items within a day
export function useReorderDayItems() {
  const queryClient = useQueryClient();
  const { data: trip } = useActiveTrip();
  
  return useMutation({
    mutationFn: async (items: ReorderItem[]) => {
      // Batch update all sort_index values
      const updates = items.map(item => 
        supabase
          .from('itinerary_items')
          .update({ sort_index: item.sort_index })
          .eq('id', item.id)
      );
      
      const results = await Promise.all(updates);
      
      // Check for any errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error('Failed to reorder some items');
      }
      
      return items;
    },
    onSuccess: () => {
      // Invalidate the itinerary items query to refetch
      queryClient.invalidateQueries({ queryKey: ['all-itinerary-items', trip?.id] });
    },
    onError: (error) => {
      console.error('Failed to reorder items:', error);
      toast.error('Failed to reorder activities');
    }
  });
}

// Utility function to calculate new sort indices after a drag operation
export function calculateNewSortIndices(
  items: Array<{ id: string; sort_index?: number }>,
  activeId: string,
  overId: string
): ReorderItem[] {
  const oldIndex = items.findIndex(item => item.id === activeId);
  const newIndex = items.findIndex(item => item.id === overId);
  
  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
    return [];
  }
  
  // Create a copy and move the item
  const reordered = [...items];
  const [movedItem] = reordered.splice(oldIndex, 1);
  reordered.splice(newIndex, 0, movedItem);
  
  // Assign new sort indices
  return reordered.map((item, index) => ({
    id: item.id,
    sort_index: index
  }));
}
