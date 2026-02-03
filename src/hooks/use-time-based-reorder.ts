import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useActiveTrip } from '@/hooks/use-trip';
import { addMinutesToTime, timeDifferenceInMinutes } from '@/lib/time-drag-modifier';
import type { ItineraryItem } from '@/types/trip';

export interface TimeReorderPayload {
  itemId: string;
  newDayId: string;
  newStartTime: string;  // "HH:mm:ss"
  newSortIndex: number;
  originalDayId?: string;
  originalStartTime?: string;
}

interface UndoData {
  itemId: string;
  originalDayId: string;
  originalStartTime: string;
  originalSortIndex: number;
}

/**
 * Hook for time-based reordering of itinerary items
 * Updates day_id, start_time, end_time (preserving duration), and sort_index
 */
export function useTimeBasedReorder() {
  const queryClient = useQueryClient();
  const { data: trip } = useActiveTrip();
  
  return useMutation({
    mutationFn: async (payload: TimeReorderPayload) => {
      // First, get the current item to calculate end_time based on duration
      const { data: item, error: fetchError } = await supabase
        .from('itinerary_items')
        .select('start_time, end_time, sort_index')
        .eq('id', payload.itemId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Calculate new end_time preserving duration if both start and end exist
      let newEndTime: string | null = null;
      if (item?.start_time && item?.end_time) {
        const duration = timeDifferenceInMinutes(item.start_time, item.end_time);
        if (duration > 0) {
          newEndTime = addMinutesToTime(payload.newStartTime, duration);
        }
      }
      
      // Update the item
      const { error } = await supabase
        .from('itinerary_items')
        .update({
          day_id: payload.newDayId,
          start_time: payload.newStartTime,
          end_time: newEndTime,
          sort_index: payload.newSortIndex,
        })
        .eq('id', payload.itemId);
      
      if (error) throw error;
      
      return {
        itemId: payload.itemId,
        originalDayId: payload.originalDayId,
        originalStartTime: payload.originalStartTime || item?.start_time,
        originalSortIndex: item?.sort_index,
      } as UndoData;
    },
    
    onMutate: async (payload) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['all-itinerary-items', trip?.id] });
      
      // Snapshot the previous value
      const previous = queryClient.getQueryData<ItineraryItem[]>(['all-itinerary-items', trip?.id]);
      
      // Optimistically update the cache
      if (previous) {
        queryClient.setQueryData<ItineraryItem[]>(
          ['all-itinerary-items', trip?.id],
          old => old?.map(item => 
            item.id === payload.itemId 
              ? {
                  ...item,
                  day_id: payload.newDayId,
                  start_time: payload.newStartTime,
                  sort_index: payload.newSortIndex,
                }
              : item
          ) || []
        );
      }
      
      return { previous };
    },
    
    onError: (err, payload, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(['all-itinerary-items', trip?.id], context.previous);
      }
      console.error('Failed to move activity:', err);
      toast.error('Failed to move activity');
    },
    
    onSuccess: (undoData) => {
      // Show success toast with undo action
      if (undoData.originalDayId && undoData.originalStartTime) {
        toast.success('Activity moved', {
          action: {
            label: 'Undo',
            onClick: () => {
              // Revert the mutation
              revertMove(undoData);
            },
          },
          duration: 5000,
        });
      } else {
        toast.success('Activity moved');
      }
    },
    
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['all-itinerary-items', trip?.id] });
    },
  });
  
  // Helper function to revert a move
  async function revertMove(undoData: UndoData) {
    try {
      const { error } = await supabase
        .from('itinerary_items')
        .update({
          day_id: undoData.originalDayId,
          start_time: undoData.originalStartTime,
          sort_index: undoData.originalSortIndex,
        })
        .eq('id', undoData.itemId);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['all-itinerary-items', trip?.id] });
      toast.success('Move undone');
    } catch {
      toast.error('Failed to undo');
    }
  }
}

/**
 * Calculate the best sort_index for an item being moved to a new position
 */
export function calculateSortIndexForPosition(
  items: Array<{ id: string; sortIndex: number }>,
  targetIndex: number
): number {
  if (items.length === 0) return 0;
  
  if (targetIndex <= 0) {
    // Insert at beginning
    return items[0].sortIndex - 1;
  }
  
  if (targetIndex >= items.length) {
    // Insert at end
    return items[items.length - 1].sortIndex + 1;
  }
  
  // Insert between two items - use midpoint
  const prevIndex = items[targetIndex - 1].sortIndex;
  const nextIndex = items[targetIndex].sortIndex;
  return Math.floor((prevIndex + nextIndex) / 2);
}
