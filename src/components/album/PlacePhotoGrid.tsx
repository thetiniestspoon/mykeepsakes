import { MapPin, ImageOff } from 'lucide-react';
import { getMemoryMediaUrl } from '@/hooks/use-memories';
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
        memoryNote: m.note
      }))
    );
    return { location, memories: locationMemories, media: allMedia };
  }).filter(l => l.media.length > 0);

  // Also include unassigned memories (no location)
  const unassignedMemories = memories.filter(m => !m.location_id);
  const unassignedMedia = unassignedMemories.flatMap(m => 
    (m.media || []).map(media => ({
      ...media,
      memoryNote: m.note
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
                <button
                  key={item.id}
                  onClick={() => onOpenPhoto(photos, index)}
                  className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <img
                    src={getMemoryMediaUrl(item.storage_path)}
                    alt=""
                    className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                    loading="lazy"
                  />
                </button>
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
                <button
                  key={item.id}
                  onClick={() => onOpenPhoto(photos, index)}
                  className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <img
                    src={getMemoryMediaUrl(item.storage_path)}
                    alt=""
                    className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                    loading="lazy"
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
