import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Activity, Day } from '@/lib/itinerary-data';

export interface CustomActivity {
  id: string;
  day_id: string;
  title: string;
  description: string | null;
  time: string | null;
  category: string;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  link: string | null;
  link_label: string | null;
  phone: string | null;
  map_link: string | null;
  notes: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface ActivityOrder {
  id: string;
  activity_id: string;
  day_id: string;
  order_index: number;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

// Fetch custom activities
export function useCustomActivities() {
  return useQuery({
    queryKey: ['custom-activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_activities')
        .select('*')
        .order('order_index');
      
      if (error) throw error;
      return data as CustomActivity[];
    }
  });
}

// Fetch activity order overrides
export function useActivityOrder() {
  return useQuery({
    queryKey: ['activity-order'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_order')
        .select('*');
      
      if (error) throw error;
      return data as ActivityOrder[];
    }
  });
}

// Add custom activity
export function useAddCustomActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (activity: Omit<CustomActivity, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('custom_activities')
        .insert(activity)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-activities'] });
      toast.success('Activity added!');
    },
    onError: () => {
      toast.error('Failed to add activity');
    }
  });
}

// Update custom activity
export function useUpdateCustomActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CustomActivity> & { id: string }) => {
      const { error } = await supabase
        .from('custom_activities')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-activities'] });
      toast.success('Activity updated!');
    },
    onError: () => {
      toast.error('Failed to update activity');
    }
  });
}

// Delete custom activity
export function useDeleteCustomActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('custom_activities')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-activities'] });
      toast.success('Activity deleted');
    },
    onError: () => {
      toast.error('Failed to delete activity');
    }
  });
}

// Update activity order
export function useUpdateActivityOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orders: { activity_id: string; day_id: string; order_index: number }[]) => {
      // Upsert all order records
      const { error } = await supabase
        .from('activity_order')
        .upsert(
          orders.map(o => ({
            activity_id: o.activity_id,
            day_id: o.day_id,
            order_index: o.order_index,
            is_hidden: false
          })),
          { onConflict: 'activity_id' }
        );
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-order'] });
    },
    onError: () => {
      toast.error('Failed to reorder activities');
    }
  });
}

// Hide/show activity
export function useToggleActivityVisibility() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ activityId, dayId, isHidden }: { activityId: string; dayId: string; isHidden: boolean }) => {
      const { error } = await supabase
        .from('activity_order')
        .upsert({
          activity_id: activityId,
          day_id: dayId,
          order_index: 0,
          is_hidden: isHidden
        }, { onConflict: 'activity_id' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-order'] });
    },
    onError: () => {
      toast.error('Failed to update activity visibility');
    }
  });
}

// Helper: Convert custom activity to Activity format
export function customActivityToActivity(custom: CustomActivity): Activity {
  return {
    id: custom.id,
    time: custom.time || undefined,
    title: custom.title,
    description: custom.description || '',
    category: custom.category as Activity['category'],
    location: custom.location_name ? {
      lat: custom.location_lat || 0,
      lng: custom.location_lng || 0,
      name: custom.location_name
    } : undefined,
    link: custom.link || undefined,
    linkLabel: custom.link_label || undefined,
    phone: custom.phone || undefined,
    mapLink: custom.map_link || undefined,
    notes: custom.notes || undefined
  };
}

// Merge and sort activities for a day
export function useMergedActivities(baseDay: Day) {
  const { data: customActivities } = useCustomActivities();
  const { data: activityOrder } = useActivityOrder();
  
  // Get custom activities for this day
  const dayCustomActivities = (customActivities || [])
    .filter(a => a.day_id === baseDay.id)
    .map(customActivityToActivity);
  
  // Combine base activities with custom ones
  const allActivities = [...baseDay.activities, ...dayCustomActivities];
  
  // Create order map
  const orderMap = (activityOrder || []).reduce((acc, order) => {
    acc[order.activity_id] = order;
    return acc;
  }, {} as Record<string, ActivityOrder>);
  
  // Filter hidden and sort by order
  const sortedActivities = allActivities
    .filter(a => !orderMap[a.id]?.is_hidden)
    .sort((a, b) => {
      const orderA = orderMap[a.id]?.order_index ?? 999;
      const orderB = orderMap[b.id]?.order_index ?? 999;
      return orderA - orderB;
    });
  
  return sortedActivities;
}
