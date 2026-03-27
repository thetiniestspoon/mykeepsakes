import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TripShareLink, Trip } from '@/types/trip';

// Fetch share links for a trip
export function useTripShareLinks(tripId: string | undefined) {
  return useQuery({
    queryKey: ['share-links', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      
      const { data, error } = await supabase
        .from('trip_share_links')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TripShareLink[];
    },
    enabled: !!tripId
  });
}

// Create a new share link
export function useCreateShareLink() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ tripId, expiresAt }: { tripId: string; expiresAt?: string }) => {
      const { data, error } = await supabase
        .from('trip_share_links')
        .insert({ 
          trip_id: tripId,
          expires_at: expiresAt 
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as TripShareLink;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['share-links', data.trip_id] });
      toast.success('Share link created!');
    },
    onError: (error) => {
      console.error('Failed to create share link:', error);
      toast.error('Failed to create share link');
    }
  });
}

// Delete a share link
export function useDeleteShareLink() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (linkId: string) => {
      const { data: link } = await supabase
        .from('trip_share_links')
        .select('trip_id')
        .eq('id', linkId)
        .single();
      
      const { error } = await supabase
        .from('trip_share_links')
        .delete()
        .eq('id', linkId);
      
      if (error) throw error;
      return link;
    },
    onSuccess: (link) => {
      if (link) {
        queryClient.invalidateQueries({ queryKey: ['share-links', link.trip_id] });
      }
      toast.success('Share link deleted');
    },
    onError: (error) => {
      console.error('Failed to delete share link:', error);
      toast.error('Failed to delete share link');
    }
  });
}

// Validate a share token and get trip info
export function useValidateShareToken(token: string | undefined) {
  return useQuery({
    queryKey: ['share-token', token],
    queryFn: async () => {
      if (!token) return null;
      
      const { data, error } = await supabase
        .from('trip_share_links')
        .select(`
          *,
          trip:trips(*)
        `)
        .eq('token', token)
        .single();
      
      if (error) throw error;
      
      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        throw new Error('Share link has expired');
      }
      
      return data as TripShareLink & { trip: Trip };
    },
    enabled: !!token,
    retry: false
  });
}

// Generate shareable URL
export function getShareUrl(token: string): string {
  return `${window.location.origin}/mykeepsakes/shared/${token}`;
}
