import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Memory } from '@/types/trip';
import type { DispatchItem } from '@/types/conference';
import { toast } from 'sonner';

export function useDispatches(tripId: string | undefined) {
  return useQuery({
    queryKey: ['dispatches', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from('memories')
        .select('*, day:itinerary_days(*)')
        .eq('trip_id', tripId)
        .eq('memory_type', 'dispatch')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Memory[];
    },
    enabled: !!tripId,
  });
}

export function useDispatchItems(dispatchId: string | undefined) {
  return useQuery({
    queryKey: ['dispatch-items', dispatchId],
    queryFn: async () => {
      if (!dispatchId) return [];
      const { data, error } = await supabase
        .from('dispatch_items')
        .select('*')
        .eq('dispatch_id', dispatchId)
        .order('section')
        .order('sort_order');
      if (error) throw error;
      return data as DispatchItem[];
    },
    enabled: !!dispatchId,
  });
}

export function useCreateDispatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tripId, dayId, closingNote, items,
    }: {
      tripId: string;
      dayId: string;
      closingNote: string;
      items: Omit<DispatchItem, 'id' | 'dispatch_id' | 'created_at'>[];
    }) => {
      const { data: dispatch, error: dispatchError } = await supabase
        .from('memories')
        .insert({
          trip_id: tripId,
          day_id: dayId,
          memory_type: 'dispatch',
          note: closingNote || null,
        })
        .select()
        .single();
      if (dispatchError) throw dispatchError;

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('dispatch_items')
          .insert(items.map((item) => ({ ...item, dispatch_id: dispatch.id })));
        if (itemsError) throw itemsError;
      }

      const { data: shareLink, error: shareError } = await supabase
        .from('trip_share_links')
        .insert({ trip_id: tripId, dispatch_id: dispatch.id, permission: 'read' })
        .select()
        .single();
      if (shareError) throw shareError;

      return { dispatch, shareToken: shareLink.token };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dispatches', data.dispatch.trip_id] });
      queryClient.invalidateQueries({ queryKey: ['memories', data.dispatch.trip_id] });
      toast.success('Dispatch created');
    },
    onError: () => { toast.error('Failed to create dispatch'); },
  });
}

export function useDispatchShareLink(dispatchId: string | undefined) {
  return useQuery({
    queryKey: ['dispatch-share-link', dispatchId],
    queryFn: async () => {
      if (!dispatchId) return null;
      const { data, error } = await supabase
        .from('trip_share_links')
        .select('*')
        .eq('dispatch_id', dispatchId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!dispatchId,
  });
}
