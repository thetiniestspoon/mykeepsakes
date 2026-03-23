import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Memory } from '@/types/trip';
import type { InsightTag } from '@/types/conference';
import { toast } from 'sonner';

export function useReflections(tripId: string | undefined) {
  return useQuery({
    queryKey: ['reflections', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from('memories')
        .select('*, media:memory_media(*), day:itinerary_days(*)')
        .eq('trip_id', tripId)
        .in('memory_type', ['reflection'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Memory[];
    },
    enabled: !!tripId,
  });
}

export function useCreateReflection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tripId,
      note,
      tags,
      speaker,
      sessionTitle,
      dayId,
      locationId,
    }: {
      tripId: string;
      note: string;
      tags?: InsightTag[];
      speaker?: string;
      sessionTitle?: string;
      dayId?: string;
      locationId?: string;
    }) => {
      const { data, error } = await supabase
        .from('memories')
        .insert({
          trip_id: tripId,
          note,
          memory_type: 'reflection',
          tags: tags?.length ? tags : null,
          speaker: speaker || null,
          session_title: sessionTitle || null,
          day_id: dayId || null,
          location_id: locationId || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Memory;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reflections', data.trip_id] });
      queryClient.invalidateQueries({ queryKey: ['memories', data.trip_id] });
      toast.success('Reflection saved');
    },
    onError: () => {
      toast.error('Failed to save reflection');
    },
  });
}
