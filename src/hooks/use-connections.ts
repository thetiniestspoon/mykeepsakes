import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Connection } from '@/types/conference';
import { toast } from 'sonner';

export function useConnections(tripId: string | undefined) {
  return useQuery({
    queryKey: ['connections', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from('family_contacts')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Connection[];
    },
    enabled: !!tripId,
  });
}

export function useCreateConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tripId, name, email, organization, metContext, dayId, phone,
    }: {
      tripId: string; name: string; email?: string; organization?: string;
      metContext?: string; dayId?: string; phone?: string;
    }) => {
      const { data, error } = await supabase
        .from('family_contacts')
        .insert({
          name, trip_id: tripId, email: email || null,
          organization: organization || null, met_context: metContext || null,
          day_id: dayId || null, phone: phone || null, category: 'connection',
        })
        .select().single();
      if (error) throw error;
      return data as Connection;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['connections', data.trip_id] });
      toast.success('Connection saved');
    },
    onError: () => { toast.error('Failed to save connection'); },
  });
}
