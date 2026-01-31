import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Trip, TripMode, ItineraryDay } from '@/types/trip';

// Calculate trip mode based on dates
export function getTripMode(trip: Trip): TripMode {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const start = new Date(trip.start_date);
  const end = new Date(trip.end_date);
  
  if (today < start) return 'pre';
  if (today > end) return 'post';
  return 'active';
}

// Get current day based on trip mode
export function getCurrentDayIndex(trip: Trip, days: ItineraryDay[], mode: TripMode): number {
  if (mode === 'pre') return 0;
  if (mode === 'post') return days.length - 1;
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const index = days.findIndex(d => d.date === todayStr);
  return index >= 0 ? index : 0;
}

// Fetch all trips
export function useTrips() {
  return useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      return data as Trip[];
    }
  });
}

// Fetch a single trip by ID
export function useTrip(tripId: string | undefined) {
  return useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      if (!tripId) return null;
      
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();
      
      if (error) throw error;
      return data as Trip;
    },
    enabled: !!tripId
  });
}

// Get the active/default trip (most recently starting trip that hasn't ended)
export function useActiveTrip() {
  return useQuery({
    queryKey: ['active-trip'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // First try to find an active trip (today is between start and end)
      let { data, error } = await supabase
        .from('trips')
        .select('*')
        .lte('start_date', today)
        .gte('end_date', today)
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      if (data) return data as Trip;
      
      // If no active trip, get the next upcoming trip
      const upcoming = await supabase
        .from('trips')
        .select('*')
        .gt('start_date', today)
        .order('start_date', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (upcoming.error) throw upcoming.error;
      if (upcoming.data) return upcoming.data as Trip;
      
      // If no upcoming trip, get the most recent past trip
      const past = await supabase
        .from('trips')
        .select('*')
        .lt('end_date', today)
        .order('end_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (past.error) throw past.error;
      return past.data as Trip | null;
    }
  });
}

// Create a new trip
export function useCreateTrip() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (trip: Omit<Trip, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('trips')
        .insert(trip)
        .select()
        .single();
      
      if (error) throw error;
      return data as Trip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['active-trip'] });
      toast.success('Trip created!');
    },
    onError: (error) => {
      console.error('Failed to create trip:', error);
      toast.error('Failed to create trip');
    }
  });
}

// Update a trip
export function useUpdateTrip() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Trip> & { id: string }) => {
      const { data, error } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Trip;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trip', data.id] });
      queryClient.invalidateQueries({ queryKey: ['active-trip'] });
      toast.success('Trip updated!');
    },
    onError: (error) => {
      console.error('Failed to update trip:', error);
      toast.error('Failed to update trip');
    }
  });
}

// Delete a trip
export function useDeleteTrip() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tripId: string) => {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['active-trip'] });
      toast.success('Trip deleted');
    },
    onError: (error) => {
      console.error('Failed to delete trip:', error);
      toast.error('Failed to delete trip');
    }
  });
}

// Custom hook that provides trip mode and current day
export function useTripContext(tripId: string | undefined) {
  const { data: trip, isLoading: tripLoading } = useTrip(tripId);
  const { data: days = [], isLoading: daysLoading } = useTripDays(tripId);
  
  const mode = trip ? getTripMode(trip) : 'pre';
  const currentDayIndex = trip && days.length > 0 
    ? getCurrentDayIndex(trip, days, mode) 
    : 0;
  const currentDay = days[currentDayIndex] || null;
  
  return {
    trip,
    mode,
    days,
    currentDay,
    currentDayIndex,
    isLoading: tripLoading || daysLoading
  };
}

// Fetch itinerary days for a trip
export function useTripDays(tripId: string | undefined) {
  return useQuery({
    queryKey: ['itinerary-days', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      
      const { data, error } = await supabase
        .from('itinerary_days')
        .select('*')
        .eq('trip_id', tripId)
        .order('sort_index', { ascending: true });
      
      if (error) throw error;
      return data as ItineraryDay[];
    },
    enabled: !!tripId
  });
}
