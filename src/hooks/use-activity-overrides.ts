import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Activity } from '@/lib/itinerary-data';

export interface ActivityOverride {
  id: string;
  activity_id: string;
  title: string | null;
  description: string | null;
  time: string | null;
  category: string | null;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  link: string | null;
  link_label: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Fetch all activity overrides
export function useActivityOverrides() {
  return useQuery({
    queryKey: ['activity-overrides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_overrides')
        .select('*');
      
      if (error) throw error;
      return data as ActivityOverride[];
    }
  });
}

// Upsert (create or update) an activity override
export function useUpsertActivityOverride() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (override: Omit<ActivityOverride, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('activity_overrides')
        .upsert(override, { onConflict: 'activity_id' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-overrides'] });
      toast.success('Activity updated!');
    },
    onError: () => {
      toast.error('Failed to update activity');
    }
  });
}

// Delete an activity override (reset to default)
export function useDeleteActivityOverride() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (activityId: string) => {
      const { error } = await supabase
        .from('activity_overrides')
        .delete()
        .eq('activity_id', activityId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-overrides'] });
      toast.success('Activity reset to default');
    },
    onError: () => {
      toast.error('Failed to reset activity');
    }
  });
}

// Helper: Apply override to a base activity
export function applyOverride(baseActivity: Activity, override?: ActivityOverride): Activity {
  if (!override) return baseActivity;
  
  return {
    ...baseActivity,
    title: override.title ?? baseActivity.title,
    description: override.description ?? baseActivity.description,
    time: override.time ?? baseActivity.time,
    category: (override.category as Activity['category']) ?? baseActivity.category,
    location: override.location_name ? {
      lat: override.location_lat ?? 0,
      lng: override.location_lng ?? 0,
      name: override.location_name
    } : baseActivity.location,
    link: override.link ?? baseActivity.link,
    linkLabel: override.link_label ?? baseActivity.linkLabel,
    phone: override.phone ?? baseActivity.phone,
    notes: override.notes ?? baseActivity.notes,
  };
}
