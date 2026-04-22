import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { hashPin } from '@/lib/emoji-pin';
import { useActiveTrip } from '@/hooks/use-trip';

// PIN Management
export function usePin() {
  return useQuery({
    queryKey: ['pin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'pin')
        .maybeSingle();
      
      if (error) throw error;
      return data?.setting_value ?? null;
    }
  });
}

export function useCreatePin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (emojiPin: string[]) => {
      const hashed = await hashPin(emojiPin);
      const { error } = await supabase
        .from('app_settings')
        .upsert({ setting_key: 'pin', setting_value: hashed }, { onConflict: 'setting_key' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pin'] });
      toast.success('PIN created successfully!');
    },
    onError: () => {
      toast.error('Failed to create PIN');
    }
  });
}

export function useUpdatePin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (emojiPin: string[]) => {
      const hashed = await hashPin(emojiPin);
      const { error } = await supabase
        .from('app_settings')
        .update({ setting_value: hashed })
        .eq('setting_key', 'pin');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pin'] });
      toast.success('PIN updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update PIN');
    }
  });
}

// Checklist Items
export function useChecklistItems() {
  return useQuery({
    queryKey: ['checklist-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_items')
        .select('*');
      
      if (error) throw error;
      return data.reduce((acc, item) => {
        acc[item.item_id] = item.is_completed;
        return acc;
      }, {} as Record<string, boolean>);
    }
  });
}

export function useToggleChecklistItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ itemId, isCompleted }: { itemId: string; isCompleted: boolean }) => {
      const { error } = await supabase
        .from('checklist_items')
        .upsert({
          item_id: itemId,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null
        }, { onConflict: 'item_id' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
    }
  });
}

// Favorites
export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('*');
      
      if (error) throw error;
      return data.reduce((acc, item) => {
        acc[item.item_id] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ itemId, itemType, isFavorite }: { itemId: string; itemType: string; isFavorite: boolean }) => {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .insert({ item_id: itemId, item_type: itemType });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('item_id', itemId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    }
  });
}

// Notes
export function useNotes() {
  return useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
}

export function useAddNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ itemId, content }: { itemId: string; content: string }) => {
      const { error } = await supabase
        .from('notes')
        .insert({ item_id: itemId, content });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Note added!');
    },
    onError: () => {
      toast.error('Failed to add note');
    }
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Note deleted');
    }
  });
}

// Photos
// Cache is scoped to the active trip so a future multi-trip world doesn't
// serve stale cross-trip data. Today (single trip), this is preventive —
// the photos table has no trip_id column, so the server still returns all
// photos; render sites filter by item_id.
export function usePhotos() {
  const { data: trip } = useActiveTrip();
  return useQuery({
    queryKey: ['photos', trip?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!trip?.id
  });
}

export function useUploadPhoto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ itemId, file, caption }: { itemId: string; file: File; caption?: string }) => {
      const fileName = `${itemId}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('trip-photos')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { error: dbError } = await supabase
        .from('photos')
        .insert({
          item_id: itemId,
          storage_path: fileName,
          caption
        });
      
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      toast.success('Photo uploaded!');
    },
    onError: () => {
      toast.error('Failed to upload photo');
    }
  });
}

export function useDeletePhoto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ photoId, storagePath }: { photoId: string; storagePath: string }) => {
      const { error: storageError } = await supabase.storage
        .from('trip-photos')
        .remove([storagePath]);
      
      if (storageError) throw storageError;
      
      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);
      
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      toast.success('Photo deleted');
    }
  });
}

// Collapsed Sections
export function useCollapsedSections() {
  return useQuery({
    queryKey: ['collapsed-sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collapsed_sections')
        .select('*');
      
      if (error) throw error;
      return data.reduce((acc, item) => {
        acc[item.section_id] = item.is_collapsed;
        return acc;
      }, {} as Record<string, boolean>);
    }
  });
}

export function useToggleSection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sectionId, isCollapsed }: { sectionId: string; isCollapsed: boolean }) => {
      const { error } = await supabase
        .from('collapsed_sections')
        .upsert({
          section_id: sectionId,
          is_collapsed: isCollapsed
        }, { onConflict: 'section_id' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collapsed-sections'] });
    }
  });
}

// Get photo URL
export function getPhotoUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from('trip-photos')
    .getPublicUrl(storagePath);
  
  return data.publicUrl;
}

// Family Contacts
export interface FamilyContact {
  id: string;
  name: string;
  phone: string | null;
  relationship: string | null;
  category: string;
  emergency_info: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useFamilyContacts() {
  return useQuery({
    queryKey: ['family-contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('family_contacts')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as FamilyContact[];
    }
  });
}

export function useAddFamilyContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contact: Omit<FamilyContact, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('family_contacts')
        .insert(contact);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-contacts'] });
      toast.success('Contact added!');
    },
    onError: () => {
      toast.error('Failed to add contact');
    }
  });
}

export function useUpdateFamilyContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FamilyContact> & { id: string }) => {
      const { error } = await supabase
        .from('family_contacts')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-contacts'] });
      toast.success('Contact updated!');
    },
    onError: () => {
      toast.error('Failed to update contact');
    }
  });
}

export function useDeleteFamilyContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('family_contacts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-contacts'] });
      toast.success('Contact deleted');
    },
    onError: () => {
      toast.error('Failed to delete contact');
    }
  });
}
