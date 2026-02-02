import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Memory, MemoryMedia, MediaType } from '@/types/trip';

// Fetch all memories for a trip
export function useMemories(tripId: string | undefined) {
  return useQuery({
    queryKey: ['memories', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      
      const { data, error } = await supabase
        .from('memories')
        .select(`
          *,
          media:memory_media(*),
          day:itinerary_days(*),
          itinerary_item:itinerary_items(*),
          location:locations(*)
        `)
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Memory[];
    },
    enabled: !!tripId
  });
}

// Fetch memories for a specific day
export function useDayMemories(dayId: string | undefined) {
  return useQuery({
    queryKey: ['day-memories', dayId],
    queryFn: async () => {
      if (!dayId) return [];
      
      const { data, error } = await supabase
        .from('memories')
        .select(`
          *,
          media:memory_media(*)
        `)
        .eq('day_id', dayId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Memory[];
    },
    enabled: !!dayId
  });
}

// Fetch memories for a specific location
export function useLocationMemories(locationId: string | undefined) {
  return useQuery({
    queryKey: ['location-memories', locationId],
    queryFn: async () => {
      if (!locationId) return [];
      
      const { data, error } = await supabase
        .from('memories')
        .select(`
          *,
          media:memory_media(*)
        `)
        .eq('location_id', locationId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Memory[];
    },
    enabled: !!locationId
  });
}

// Create a new memory
export function useCreateMemory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (memory: Omit<Memory, 'id' | 'created_at' | 'media' | 'day' | 'itinerary_item' | 'location'>) => {
      const { data, error } = await supabase
        .from('memories')
        .insert(memory)
        .select()
        .single();
      
      if (error) throw error;
      return data as Memory;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['memories', data.trip_id] });
      if (data.day_id) {
        queryClient.invalidateQueries({ queryKey: ['day-memories', data.day_id] });
      }
      if (data.location_id) {
        queryClient.invalidateQueries({ queryKey: ['location-memories', data.location_id] });
      }
      toast.success('Memory created!');
    },
    onError: (error) => {
      console.error('Failed to create memory:', error);
      toast.error('Failed to create memory');
    }
  });
}

// Update a memory
export function useUpdateMemory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Memory> & { id: string }) => {
      // Remove joined fields
      const { media, day, itinerary_item, location, ...dbUpdates } = updates as any;
      
      const { data, error } = await supabase
        .from('memories')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Memory;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['memories', data.trip_id] });
    },
    onError: (error) => {
      console.error('Failed to update memory:', error);
      toast.error('Failed to update memory');
    }
  });
}

// Delete a memory
export function useDeleteMemory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (memoryId: string) => {
      // First get memory info and its media
      const { data: memory } = await supabase
        .from('memories')
        .select('trip_id, day_id, location_id')
        .eq('id', memoryId)
        .single();
      
      const { data: media } = await supabase
        .from('memory_media')
        .select('storage_path, thumbnail_path')
        .eq('memory_id', memoryId);
      
      // Delete media files from storage
      if (media && media.length > 0) {
        const paths = media.flatMap(m => [m.storage_path, m.thumbnail_path].filter(Boolean));
        if (paths.length > 0) {
          await supabase.storage.from('trip-photos').remove(paths as string[]);
        }
      }
      
      // Delete the memory (cascades to memory_media)
      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', memoryId);
      
      if (error) throw error;
      return memory;
    },
    onSuccess: (memory) => {
      if (memory) {
        queryClient.invalidateQueries({ queryKey: ['memories', memory.trip_id] });
        if (memory.day_id) {
          queryClient.invalidateQueries({ queryKey: ['day-memories', memory.day_id] });
        }
        if (memory.location_id) {
          queryClient.invalidateQueries({ queryKey: ['location-memories', memory.location_id] });
        }
      }
      toast.success('Memory deleted');
    },
    onError: (error) => {
      console.error('Failed to delete memory:', error);
      toast.error('Failed to delete memory');
    }
  });
}

// Upload media to a memory
export function useUploadMemoryMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memoryId,
      tripId,
      file,
      mediaType
    }: {
      memoryId: string;
      tripId: string;
      file: File;
      mediaType: MediaType;
    }) => {
      const mediaId = crypto.randomUUID();
      const ext = file.name.split('.').pop() || 'jpg';
      const storagePath = `trips/${tripId}/memories/${memoryId}/${mediaId}/original.${ext}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('trip-photos')
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      // Get memory info for cache invalidation
      const { data: memory } = await supabase
        .from('memories')
        .select('day_id, location_id')
        .eq('id', memoryId)
        .single();

      // Create media record
      const { data, error: dbError } = await supabase
        .from('memory_media')
        .insert({
          memory_id: memoryId,
          storage_path: storagePath,
          media_type: mediaType,
          mime_type: file.type,
          byte_size: file.size,
        })
        .select()
        .single();

      if (dbError) throw dbError;
      return { media: data as MemoryMedia, tripId, dayId: memory?.day_id, locationId: memory?.location_id };
    },
    onSuccess: ({ tripId, dayId, locationId }) => {
      queryClient.invalidateQueries({ queryKey: ['memories', tripId] });
      if (dayId) {
        queryClient.invalidateQueries({ queryKey: ['day-memories', dayId] });
      }
      if (locationId) {
        queryClient.invalidateQueries({ queryKey: ['location-memories', locationId] });
      }
      toast.success('Photo uploaded!');
    },
    onError: (error) => {
      console.error('Failed to upload media:', error);
      toast.error('Failed to upload photo');
    }
  });
}

// Delete a single media item
export function useDeleteMemoryMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mediaId, storagePath, thumbnailPath }: {
      mediaId: string;
      storagePath: string;
      thumbnailPath?: string | null;
    }) => {
      // Get memory info for cache invalidation before deleting
      const { data: mediaRecord } = await supabase
        .from('memory_media')
        .select('memory_id')
        .eq('id', mediaId)
        .single();

      let memoryInfo = null;
      if (mediaRecord?.memory_id) {
        const { data } = await supabase
          .from('memories')
          .select('trip_id, day_id, location_id')
          .eq('id', mediaRecord.memory_id)
          .single();
        memoryInfo = data;
      }

      // Delete from storage
      const paths = [storagePath, thumbnailPath].filter(Boolean) as string[];
      await supabase.storage.from('trip-photos').remove(paths);

      // Delete record
      const { error } = await supabase
        .from('memory_media')
        .delete()
        .eq('id', mediaId);

      if (error) throw error;
      return memoryInfo;
    },
    onSuccess: (memoryInfo) => {
      if (memoryInfo) {
        queryClient.invalidateQueries({ queryKey: ['memories', memoryInfo.trip_id] });
        if (memoryInfo.day_id) {
          queryClient.invalidateQueries({ queryKey: ['day-memories', memoryInfo.day_id] });
        }
        if (memoryInfo.location_id) {
          queryClient.invalidateQueries({ queryKey: ['location-memories', memoryInfo.location_id] });
        }
      }
      toast.success('Photo deleted');
    },
    onError: (error) => {
      console.error('Failed to delete media:', error);
      toast.error('Failed to delete photo');
    }
  });
}

// Get public URL for media
export function getMemoryMediaUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from('trip-photos')
    .getPublicUrl(storagePath);
  
  return data.publicUrl;
}
