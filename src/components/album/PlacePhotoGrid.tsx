import { MapPin, ImageOff, Trash2 } from 'lucide-react';
import { getMemoryMediaUrl, useDeleteMemory } from '@/hooks/use-memories';
import { Skeleton } from '@/components/ui/skeleton';
import type { Memory, Location } from '@/types/trip';

interface PhotoForViewer {
  id: string;
  storage_path: string;
  caption?: string | null;
}

interface PlacePhotoGridProps {
  locations: Location[];
  memories: Memory[];
  onOpenPhoto: (photos: PhotoForViewer[], index: number) => void;
  isLoading?: boolean;
}

export function PlacePhotoGrid({ locations, memories, onOpenPhoto, isLoading }: PlacePhotoGridProps) {
  const deleteMemory = useDeleteMemory();
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2].map(i => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <div className="flex gap-2 overflow-hidden">
              <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
              <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
              <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Group memories by location
  const memoriesByLocation = locations.map(location => {
    const locationMemories = memories.filter(m => m.location_id === location.id);
    const allMedia = locationMemories.flatMap(m => 
      (m.media || []).map(media => ({
        ...media,
        memoryNote: m.note,
        memoryId: m.id
      }))
    );
    return { location, memories: locationMemories, media: allMedia };
  }).filter(l => l.media.length > 0);

  // Also include unassigned memories (no location)
  const unassignedMemories = memories.filter(m => !m.location_id);
  const unassignedMedia = unassignedMemories.flatMap(m => 
    (m.media || []).map(media => ({
      ...media,
      memoryNote: m.note,
      memoryId: m.id
    }))
  );

  if (memoriesByLocation.length === 0 && unassignedMedia.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageOff className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">No photos yet</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Add memories linked to locations
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {memoriesByLocation.map(({ location, media }) => (
        <div key={location.id}>
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-beach-sunset-coral" />
            <h3 className="font-semibold text-foreground">{location.name}</h3>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              {media.length}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {media.map((item, index) => {
              const photos: PhotoForViewer[] = media.map(m => ({
                id: m.id,
                storage_path: m.storage_path,
                caption: m.memoryNote
              }));
              
              return (
                <div key={item.id} className="relative group flex-shrink-0">
                  <button
                    onClick={() => onOpenPhoto(photos, index)}
                    className="w-24 h-24 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <img
                      src={getMemoryMediaUrl(item.storage_path)}
                      alt=""
                      className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                      loading="lazy"
                    />
                  </button>
                  {/* Delete button on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this photo?')) {
                        deleteMemory.mutate(item.memoryId);
                      }
                    }}
                    className="absolute top-1 right-1 p-1 bg-destructive/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {unassignedMedia.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Other Photos</h3>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              {unassignedMedia.length}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {unassignedMedia.map((item, index) => {
              const photos: PhotoForViewer[] = unassignedMedia.map(m => ({
                id: m.id,
                storage_path: m.storage_path,
                caption: m.memoryNote
              }));
              
              return (
                <div key={item.id} className="relative group flex-shrink-0">
                  <button
                    onClick={() => onOpenPhoto(photos, index)}
                    className="w-24 h-24 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <img
                      src={getMemoryMediaUrl(item.storage_path)}
                      alt=""
                      className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                      loading="lazy"
                    />
                  </button>
                  {/* Delete button on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this photo?')) {
                        deleteMemory.mutate(item.memoryId);
                      }
                    }}
                    className="absolute top-1 right-1 p-1 bg-destructive/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
