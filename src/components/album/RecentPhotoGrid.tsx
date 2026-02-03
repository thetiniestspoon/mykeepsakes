import { formatDistanceToNow } from 'date-fns';
import { Clock, ImageOff, Trash2 } from 'lucide-react';
import { getMemoryMediaUrl, useDeleteMemory } from '@/hooks/use-memories';
import { Skeleton } from '@/components/ui/skeleton';
import { StaggeredList } from '@/components/ui/staggered-list';
import { KenBurnsImage } from '@/components/photos/KenBurnsImage';
import type { Memory, MemoryMedia } from '@/types/trip';

interface PhotoForViewer {
  id: string;
  storage_path: string;
  caption?: string | null;
}

interface RecentPhotoGridProps {
  memories: Memory[];
  onOpenPhoto: (photos: PhotoForViewer[], index: number) => void;
  isLoading?: boolean;
}

interface MediaWithMeta extends MemoryMedia {
  memoryNote?: string | null;
  memoryCreatedAt: string;
  memoryId: string;
}

export function RecentPhotoGrid({ memories, onOpenPhoto, isLoading }: RecentPhotoGridProps) {
  const deleteMemory = useDeleteMemory();
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  // Flatten all media and sort by created_at
  const allMedia: MediaWithMeta[] = memories
    .flatMap(m => 
      (m.media || []).map(media => ({
        ...media,
        memoryNote: m.note,
        memoryCreatedAt: m.created_at,
        memoryId: m.id
      }))
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (allMedia.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageOff className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">No photos yet</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Start capturing memories!
        </p>
      </div>
    );
  }

  // Create photos array for viewer
  const allPhotos: PhotoForViewer[] = allMedia.map(m => ({
    id: m.id,
    storage_path: m.storage_path,
    caption: m.memoryNote
  }));

  // Group by relative time for display
  const now = new Date();
  const groups = [
    { 
      label: 'Today', 
      items: allMedia.filter(m => {
        const d = new Date(m.created_at);
        return d.toDateString() === now.toDateString();
      })
    },
    { 
      label: 'Yesterday', 
      items: allMedia.filter(m => {
        const d = new Date(m.created_at);
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return d.toDateString() === yesterday.toDateString();
      })
    },
    { 
      label: 'This Week', 
      items: allMedia.filter(m => {
        const d = new Date(m.created_at);
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return d > weekAgo && d.toDateString() !== now.toDateString() && d.toDateString() !== yesterday.toDateString();
      })
    },
    { 
      label: 'Earlier', 
      items: allMedia.filter(m => {
        const d = new Date(m.created_at);
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return d <= weekAgo;
      })
    },
  ].filter(g => g.items.length > 0);

  return (
    <StaggeredList className="space-y-6" staggerDelay={80}>
      {groups.map(group => (
        <div key={group.label}>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-beach-driftwood" />
            <h3 className="font-semibold text-foreground">{group.label}</h3>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              {group.items.length}
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {group.items.map((item) => {
              // Find the global index for this item
              const globalIndex = allMedia.findIndex(m => m.id === item.id);
              
              return (
                <div key={item.id} className="relative group">
                  <button
                    onClick={() => onOpenPhoto(allPhotos, globalIndex)}
                    className="aspect-square w-full rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <KenBurnsImage
                      src={getMemoryMediaUrl(item.storage_path)}
                      alt=""
                      className="w-full h-full"
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
                    className="absolute top-1 right-1 p-1.5 bg-destructive/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </StaggeredList>
  );
}
