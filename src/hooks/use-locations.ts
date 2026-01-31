import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Location, LocationDay } from '@/types/trip';

// Fetch all locations for a trip
export function useLocations(tripId: string | undefined) {
  return useQuery({
    queryKey: ['locations', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('trip_id', tripId)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as Location[];
    },
    enabled: !!tripId
  });
}

// Fetch locations with day associations
export function useLocationsWithDays(tripId: string | undefined) {
  return useQuery({
    queryKey: ['locations-with-days', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      
      const { data, error } = await supabase
        .from('locations')
        .select(`
          *,
          location_days(day_id)
        `)
        .eq('trip_id', tripId)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as (Location & { location_days: { day_id: string }[] })[];
    },
    enabled: !!tripId
  });
}

// Fetch locations for a specific day
export function useDayLocations(dayId: string | undefined) {
  return useQuery({
    queryKey: ['day-locations', dayId],
    queryFn: async () => {
      if (!dayId) return [];
      
      const { data, error } = await supabase
        .from('location_days')
        .select(`
          location:locations(*)
        `)
        .eq('day_id', dayId);
      
      if (error) throw error;
      return data.map(d => d.location).filter(Boolean) as Location[];
    },
    enabled: !!dayId
  });
}

// Create a new location
export function useCreateLocation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (location: Omit<Location, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('locations')
        .insert(location)
        .select()
        .single();
      
      if (error) throw error;
      return data as Location;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['locations', data.trip_id] });
      queryClient.invalidateQueries({ queryKey: ['locations-with-days', data.trip_id] });
      toast.success('Location added!');
    },
    onError: (error) => {
      console.error('Failed to create location:', error);
      toast.error('Failed to add location');
    }
  });
}

// Update a location
export function useUpdateLocation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Location> & { id: string }) => {
      const { data, error } = await supabase
        .from('locations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Location;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['locations', data.trip_id] });
      queryClient.invalidateQueries({ queryKey: ['locations-with-days', data.trip_id] });
    },
    onError: (error) => {
      console.error('Failed to update location:', error);
      toast.error('Failed to update location');
    }
  });
}

// Mark location as visited/unvisited
export function useToggleLocationVisit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, visited }: { id: string; visited: boolean }) => {
      const { data, error } = await supabase
        .from('locations')
        .update({ 
          visited_at: visited ? new Date().toISOString() : null 
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Location;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['locations', data.trip_id] });
      queryClient.invalidateQueries({ queryKey: ['locations-with-days', data.trip_id] });
    }
  });
}

// Delete a location
export function useDeleteLocation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (locationId: string) => {
      // First get the location to know which queries to invalidate
      const { data: location } = await supabase
        .from('locations')
        .select('trip_id')
        .eq('id', locationId)
        .single();
      
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', locationId);
      
      if (error) throw error;
      return location;
    },
    onSuccess: (location) => {
      if (location) {
        queryClient.invalidateQueries({ queryKey: ['locations', location.trip_id] });
        queryClient.invalidateQueries({ queryKey: ['locations-with-days', location.trip_id] });
      }
      toast.success('Location deleted');
    },
    onError: (error) => {
      console.error('Failed to delete location:', error);
      toast.error('Failed to delete location');
    }
  });
}

// Link location to a day
export function useLinkLocationToDay() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ locationId, dayId }: { locationId: string; dayId: string }) => {
      const { data, error } = await supabase
        .from('location_days')
        .insert({ location_id: locationId, day_id: dayId })
        .select()
        .single();
      
      if (error) throw error;
      return data as LocationDay;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations-with-days'] });
      queryClient.invalidateQueries({ queryKey: ['day-locations'] });
    }
  });
}

// Unlink location from a day
export function useUnlinkLocationFromDay() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ locationId, dayId }: { locationId: string; dayId: string }) => {
      const { error } = await supabase
        .from('location_days')
        .delete()
        .eq('location_id', locationId)
        .eq('day_id', dayId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations-with-days'] });
      queryClient.invalidateQueries({ queryKey: ['day-locations'] });
    }
  });
}
