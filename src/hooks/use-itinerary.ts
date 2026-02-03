import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ItineraryDay, ItineraryItem, ItemStatus, ItemCategory } from '@/types/trip';

// Fetch all itinerary items for a trip
export function useItineraryItems(tripId: string | undefined) {
  return useQuery({
    queryKey: ['itinerary-items', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      
      const { data, error } = await supabase
        .from('itinerary_items')
        .select(`
          *,
          location:locations(*)
        `)
        .eq('trip_id', tripId)
        .order('sort_index', { ascending: true });
      
      if (error) throw error;
      return data as ItineraryItem[];
    },
    enabled: !!tripId
  });
}

// Fetch items for a specific day
export function useDayItems(dayId: string | undefined) {
  return useQuery({
    queryKey: ['day-items', dayId],
    queryFn: async () => {
      if (!dayId) return [];
      
      const { data, error } = await supabase
        .from('itinerary_items')
        .select(`
          *,
          location:locations(*)
        `)
        .eq('day_id', dayId)
        .order('sort_index', { ascending: true });
      
      if (error) throw error;
      return data as ItineraryItem[];
    },
    enabled: !!dayId
  });
}

// Create a new itinerary day
export function useCreateDay() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (day: Omit<ItineraryDay, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('itinerary_days')
        .insert(day)
        .select()
        .single();
      
      if (error) throw error;
      return data as ItineraryDay;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['itinerary-days', data.trip_id] });
    }
  });
}

// Create a new itinerary item
export function useCreateItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: Omit<ItineraryItem, 'id' | 'created_at' | 'updated_at' | 'location'>) => {
      const { data, error } = await supabase
        .from('itinerary_items')
        .insert(item)
        .select(`
          *,
          location:locations(*)
        `)
        .single();
      
      if (error) throw error;
      return data as ItineraryItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['itinerary-items', data.trip_id] });
      queryClient.invalidateQueries({ queryKey: ['day-items', data.day_id] });
      toast.success('Activity added!');
    },
    onError: (error) => {
      console.error('Failed to create item:', error);
      toast.error('Failed to add activity');
    }
  });
}

// Update an itinerary item
export function useUpdateItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ItineraryItem> & { id: string }) => {
      // Remove location from updates as it's a joined field
      type JoinedFields = 'location';
      const { location, ...dbUpdates } = updates as Omit<Partial<ItineraryItem>, JoinedFields> & { location?: unknown };
      
      const { data, error } = await supabase
        .from('itinerary_items')
        .update(dbUpdates)
        .eq('id', id)
        .select(`
          *,
          location:locations(*)
        `)
        .single();
      
      if (error) throw error;
      return data as ItineraryItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['itinerary-items', data.trip_id] });
      queryClient.invalidateQueries({ queryKey: ['day-items', data.day_id] });
    },
    onError: (error) => {
      console.error('Failed to update item:', error);
      toast.error('Failed to update activity');
    }
  });
}

// Update item status (done/planned/skipped)
export function useUpdateItemStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ItemStatus }) => {
      const { data, error } = await supabase
        .from('itinerary_items')
        .update({ 
          status,
          completed_at: status === 'done' ? new Date().toISOString() : null
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as ItineraryItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['itinerary-items', data.trip_id] });
      queryClient.invalidateQueries({ queryKey: ['day-items', data.day_id] });
    }
  });
}

// Batch update item order (for drag and drop)
export function useReorderItems() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (items: { id: string; sort_index: number }[]) => {
      // Update each item's sort_index
      const updates = items.map(item => 
        supabase
          .from('itinerary_items')
          .update({ sort_index: item.sort_index })
          .eq('id', item.id)
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary-items'] });
      queryClient.invalidateQueries({ queryKey: ['day-items'] });
    }
  });
}

// Delete an itinerary item
export function useDeleteItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (itemId: string) => {
      // First get the item to know which queries to invalidate
      const { data: item } = await supabase
        .from('itinerary_items')
        .select('trip_id, day_id')
        .eq('id', itemId)
        .single();
      
      const { error } = await supabase
        .from('itinerary_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
      return item;
    },
    onSuccess: (item) => {
      if (item) {
        queryClient.invalidateQueries({ queryKey: ['itinerary-items', item.trip_id] });
        queryClient.invalidateQueries({ queryKey: ['day-items', item.day_id] });
      }
      toast.success('Activity deleted');
    },
    onError: (error) => {
      console.error('Failed to delete item:', error);
      toast.error('Failed to delete activity');
    }
  });
}

// Calculate day progress
export function useDayProgress(dayId: string | undefined) {
  const { data: items = [] } = useDayItems(dayId);
  
  const activityItems = items.filter(i => i.item_type === 'activity');
  const completedItems = activityItems.filter(i => i.status === 'done');
  
  return {
    total: activityItems.length,
    completed: completedItems.length,
    percentage: activityItems.length > 0 
      ? Math.round((completedItems.length / activityItems.length) * 100) 
      : 0
  };
}
