import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveTrip } from './use-trip';
import type { Accommodation, AccommodationInsert, AccommodationSelectDetails } from '@/types/accommodation';

const QUERY_KEY = 'accommodations';

// Fetch all accommodations for active trip
export function useAccommodations() {
  const { data: trip } = useActiveTrip();
  
  return useQuery({
    queryKey: [QUERY_KEY, trip?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accommodations')
        .select('*')
        .eq('trip_id', trip!.id)
        .order('is_deprioritized', { ascending: true })
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as Accommodation[];
    },
    enabled: !!trip?.id,
  });
}

// Get the selected accommodation (single)
export function useSelectedAccommodation() {
  const { data: trip } = useActiveTrip();
  
  return useQuery({
    queryKey: [QUERY_KEY, trip?.id, 'selected'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accommodations')
        .select('*')
        .eq('trip_id', trip!.id)
        .eq('is_selected', true)
        .maybeSingle();
      
      if (error) throw error;
      return data as Accommodation | null;
    },
    enabled: !!trip?.id,
  });
}

// Add new candidate
export function useAddAccommodation() {
  const queryClient = useQueryClient();
  const { data: trip } = useActiveTrip();

  return useMutation({
    mutationFn: async (input: AccommodationInsert) => {
      // Get max sort_order for new item
      const { data: existing } = await supabase
        .from('accommodations')
        .select('sort_order')
        .eq('trip_id', trip!.id)
        .eq('is_deprioritized', false)
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

      const { data, error } = await supabase
        .from('accommodations')
        .insert({
          trip_id: trip!.id,
          title: input.title,
          url: input.url || null,
          sort_order: nextOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, trip?.id] });
    },
  });
}

// Select accommodation (set is_selected=true, add details)
export function useSelectAccommodation() {
  const queryClient = useQueryClient();
  const { data: trip } = useActiveTrip();

  return useMutation({
    mutationFn: async ({ id, details }: { id: string; details: AccommodationSelectDetails }) => {
      // First, unselect any currently selected accommodation
      await supabase
        .from('accommodations')
        .update({ is_selected: false })
        .eq('trip_id', trip!.id)
        .eq('is_selected', true);

      // Then select the new one with details
      const { data, error } = await supabase
        .from('accommodations')
        .update({
          is_selected: true,
          address: details.address,
          check_in: details.check_in || null,
          check_out: details.check_out || null,
          notes: details.notes || null,
          location_lat: details.location_lat || null,
          location_lng: details.location_lng || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, trip?.id] });
    },
  });
}

// Unselect accommodation (move back to candidates)
export function useUnselectAccommodation() {
  const queryClient = useQueryClient();
  const { data: trip } = useActiveTrip();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('accommodations')
        .update({
          is_selected: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, trip?.id] });
    },
  });
}

// Update accommodation (for editing details)
export function useUpdateAccommodation() {
  const queryClient = useQueryClient();
  const { data: trip } = useActiveTrip();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Accommodation> }) => {
      const { data, error } = await supabase
        .from('accommodations')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, trip?.id] });
    },
  });
}

// Reorder candidates (batch update sort_order)
export function useReorderAccommodations() {
  const queryClient = useQueryClient();
  const { data: trip } = useActiveTrip();

  return useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      // Batch update using Promise.all
      await Promise.all(
        updates.map(({ id, sort_order }) =>
          supabase
            .from('accommodations')
            .update({ sort_order, updated_at: new Date().toISOString() })
            .eq('id', id)
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, trip?.id] });
    },
  });
}

// Deprioritize (gray out, send to bottom)
export function useDeprioritizeAccommodation() {
  const queryClient = useQueryClient();
  const { data: trip } = useActiveTrip();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('accommodations')
        .update({
          is_deprioritized: true,
          sort_order: 99999,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, trip?.id] });
    },
  });
}

// Unhide (un-deprioritize)
export function useUnhideAccommodation() {
  const queryClient = useQueryClient();
  const { data: trip } = useActiveTrip();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get max sort_order of non-deprioritized items
      const { data: existing } = await supabase
        .from('accommodations')
        .select('sort_order')
        .eq('trip_id', trip!.id)
        .eq('is_deprioritized', false)
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

      const { error } = await supabase
        .from('accommodations')
        .update({
          is_deprioritized: false,
          sort_order: nextOrder,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, trip?.id] });
    },
  });
}

// Delete accommodation
export function useDeleteAccommodation() {
  const queryClient = useQueryClient();
  const { data: trip } = useActiveTrip();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('accommodations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, trip?.id] });
    },
  });
}
