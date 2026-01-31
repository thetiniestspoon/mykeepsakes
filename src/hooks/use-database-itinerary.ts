import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useActiveTrip, useTripDays } from '@/hooks/use-trip';
import type { ItineraryItem, ItineraryDay, ItemStatus, Location } from '@/types/trip';

// Format time from TIME type to display string (e.g., "08:00:00" -> "8:00 AM")
function formatTime(time: string | null): string | undefined {
  if (!time) return undefined;
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Format date from DATE type to display string
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

// Get day of week from date
function getDayOfWeek(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

// Legacy Activity interface for backward compatibility with existing components
export interface LegacyActivity {
  id: string;
  time?: string;
  title: string;
  description: string;
  category: 'activity' | 'dining' | 'beach' | 'accommodation' | 'transport' | 'event';
  location?: {
    lat: number;
    lng: number;
    name: string;
    address?: string;
  };
  link?: string;
  linkLabel?: string;
  phone?: string;
  mapLink?: string;
  notes?: string;
  // Database-specific fields
  status: ItemStatus;
  completedAt?: string;
  dayId: string;
  itemType: 'activity' | 'marker';
}

// Legacy Day interface for backward compatibility
export interface LegacyDay {
  id: string;
  date: string;
  dayOfWeek: string;
  title: string;
  activities: LegacyActivity[];
}

// Convert database item to legacy activity format
function toActivities(items: ItineraryItem[]): LegacyActivity[] {
  return items.map(item => ({
    id: item.id,
    time: formatTime(item.start_time),
    title: item.title,
    description: item.description || '',
    category: item.category as LegacyActivity['category'],
    location: item.location ? {
      lat: item.location.lat!,
      lng: item.location.lng!,
      name: item.location.name,
      address: item.location.address || undefined,
    } : undefined,
    link: item.link || undefined,
    linkLabel: item.link_label || undefined,
    phone: item.phone || undefined,
    notes: item.notes || undefined,
    status: item.status,
    completedAt: item.completed_at || undefined,
    dayId: item.day_id,
    itemType: item.item_type as 'activity' | 'marker',
  }));
}

// Fetch all itinerary data for the active trip
export function useDatabaseItinerary() {
  const { data: trip } = useActiveTrip();
  const { data: daysData = [] } = useTripDays(trip?.id);
  
  const itemsQuery = useQuery({
    queryKey: ['all-itinerary-items', trip?.id],
    queryFn: async () => {
      if (!trip?.id) return [];
      
      const { data, error } = await supabase
        .from('itinerary_items')
        .select(`
          *,
          location:locations(*)
        `)
        .eq('trip_id', trip.id)
        .order('sort_index', { ascending: true });
      
      if (error) throw error;
      return data as ItineraryItem[];
    },
    enabled: !!trip?.id
  });

  // Transform into legacy format grouped by day
  const legacyDays: LegacyDay[] = daysData.map((day, index) => {
    const dayItems = (itemsQuery.data || []).filter(item => item.day_id === day.id);
    
    return {
      id: day.id,
      date: formatDate(day.date),
      dayOfWeek: getDayOfWeek(day.date),
      title: day.title || `Day ${index + 1}`,
      activities: toActivities(dayItems),
    };
  });

  return {
    days: legacyDays,
    trip,
    isLoading: itemsQuery.isLoading,
    isError: itemsQuery.isError,
    error: itemsQuery.error,
  };
}

// Hook to update item status (for completion tracking)
export function useUpdateItemStatus() {
  const queryClient = useQueryClient();
  const { data: trip } = useActiveTrip();
  
  return useMutation({
    mutationFn: async ({ itemId, status }: { itemId: string; status: ItemStatus }) => {
      const { data, error } = await supabase
        .from('itinerary_items')
        .update({ 
          status,
          completed_at: status === 'done' ? new Date().toISOString() : null
        })
        .eq('id', itemId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-itinerary-items', trip?.id] });
    },
    onError: (error) => {
      console.error('Failed to update item status:', error);
      toast.error('Failed to update activity status');
    }
  });
}

// Hook to get locations for the map
export function useDatabaseLocations() {
  const { data: trip } = useActiveTrip();
  const { data: daysData = [] } = useTripDays(trip?.id);
  
  const locationsQuery = useQuery({
    queryKey: ['trip-locations', trip?.id],
    queryFn: async () => {
      if (!trip?.id) return [];
      
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('trip_id', trip.id);
      
      if (error) throw error;
      return data as Location[];
    },
    enabled: !!trip?.id
  });

  // Also get itinerary items to associate locations with days
  const itemsQuery = useQuery({
    queryKey: ['items-for-locations', trip?.id],
    queryFn: async () => {
      if (!trip?.id) return [];
      
      const { data, error } = await supabase
        .from('itinerary_items')
        .select('id, day_id, location_id, category, title')
        .eq('trip_id', trip.id)
        .not('location_id', 'is', null);
      
      if (error) throw error;
      return data;
    },
    enabled: !!trip?.id
  });

  // Build map locations with day info
  const mapLocations = (locationsQuery.data || [])
    .filter(loc => loc.lat && loc.lng)
    .map(loc => {
      // Find associated item to get day info
      const item = (itemsQuery.data || []).find(i => i.location_id === loc.id);
      const day = item ? daysData.find(d => d.id === item.day_id) : null;
      
      return {
        id: loc.id,
        lat: loc.lat!,
        lng: loc.lng!,
        name: loc.name,
        category: loc.category || 'activity',
        address: loc.address || undefined,
        dayId: item?.day_id,
        dayLabel: day ? `${getDayOfWeek(day.date)} - ${day.title || ''}` : undefined,
      };
    });

  return {
    locations: mapLocations,
    isLoading: locationsQuery.isLoading || itemsQuery.isLoading,
    trip,
    days: daysData,
  };
}
