import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LodgingOption {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  price_per_night?: number | null;
  total_price?: number | null;
  url?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  max_guests?: number | null;
  amenities?: string[] | null;
  pros?: string[] | null;
  cons?: string[] | null;
  is_selected: boolean;
  is_archived: boolean;
  votes_up: number;
  votes_down: number;
  photos?: string[] | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export type LodgingInsert = Omit<LodgingOption, 'id' | 'created_at' | 'updated_at' | 'is_selected' | 'is_archived' | 'votes_up' | 'votes_down'> & {
  is_selected?: boolean;
  is_archived?: boolean;
  votes_up?: number;
  votes_down?: number;
};

export type LodgingUpdate = Partial<LodgingInsert>;

// Fetch all lodging options
export function useLodgingOptions(includeArchived = false) {
  return useQuery({
    queryKey: ['lodging-options', includeArchived],
    queryFn: async () => {
      let query = supabase
        .from('lodging_options')
        .select('*')
        .order('is_selected', { ascending: false })
        .order('created_at', { ascending: false });

      if (!includeArchived) {
        query = query.eq('is_archived', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LodgingOption[];
    }
  });
}

// Get selected lodging
export function useSelectedLodging() {
  return useQuery({
    queryKey: ['selected-lodging'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lodging_options')
        .select('*')
        .eq('is_selected', true)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as LodgingOption | null;
    }
  });
}

// Add new lodging option
export function useAddLodging() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lodging: LodgingInsert) => {
      const { data, error } = await supabase
        .from('lodging_options')
        .insert(lodging)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lodging-options'] });
    }
  });
}

// Update lodging option
export function useUpdateLodging() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: LodgingUpdate }) => {
      const { data, error } = await supabase
        .from('lodging_options')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lodging-options'] });
      queryClient.invalidateQueries({ queryKey: ['selected-lodging'] });
    }
  });
}

// Delete lodging option
export function useDeleteLodging() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lodging_options')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lodging-options'] });
      queryClient.invalidateQueries({ queryKey: ['selected-lodging'] });
    }
  });
}

// Select a lodging (and deselect others)
export function useSelectLodging() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First, deselect all
      await supabase
        .from('lodging_options')
        .update({ is_selected: false })
        .neq('id', id);
      
      // Then select the chosen one
      const { data, error } = await supabase
        .from('lodging_options')
        .update({ is_selected: true })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lodging-options'] });
      queryClient.invalidateQueries({ queryKey: ['selected-lodging'] });
    }
  });
}

// Archive/Unarchive lodging
export function useArchiveLodging() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isArchived }: { id: string; isArchived: boolean }) => {
      const { data, error } = await supabase
        .from('lodging_options')
        .update({ is_archived: isArchived })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lodging-options'] });
    }
  });
}

// Vote on lodging
export function useVoteLodging() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, voteType }: { id: string; voteType: 'up' | 'down' }) => {
      // Get current values
      const { data: current, error: fetchError } = await supabase
        .from('lodging_options')
        .select('votes_up, votes_down')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;

      const updates = voteType === 'up' 
        ? { votes_up: (current.votes_up || 0) + 1 }
        : { votes_down: (current.votes_down || 0) + 1 };

      const { data, error } = await supabase
        .from('lodging_options')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lodging-options'] });
    }
  });
}
