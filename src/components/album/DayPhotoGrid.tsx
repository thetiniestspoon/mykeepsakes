import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, ImageOff, Trash2 } from 'lucide-react';
import { getMemoryMediaUrl, useDeleteMemory } from '@/hooks/use-memories';
import { Skeleton } from '@/components/ui/skeleton';
import { StaggeredList } from '@/components/ui/staggered-list';
import { KenBurnsImage } from '@/components/photos/KenBurnsImage';
import { MemoryEditDialog } from './MemoryEditDialog';
import type { Memory } from '@/types/trip';

interface Day {
  id: string;
  date: string;
  title: string | null;
}

interface PhotoForViewer {
  id: string;
  storage_path: string;
  caption?: string | null;
  memoryId?: string;
}

interface DayPhotoGridProps {
  days: Day[];
  memories: Memory[];
  onOpenPhoto: (photos: PhotoForViewer[], index: number) => void;
  isLoading?: boolean;
}

export function DayPhotoGrid({ days, memories, onOpenPhoto, isLoading }: DayPhotoGridProps) {
  const deleteMemory = useDeleteMemory();
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="aspect-square rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Group memories by day
  const memoriesByDay = days.map(day => {
    const dayMemories = memories.filter(m => m.day_id === day.id);
    const allMedia = dayMemories.flatMap(m => 
      (m.media || []).map(media => ({
        ...media,
        memoryNote: m.note,
        memoryId: m.id,
        memory: m
      }))
    );
    return { day, memories: dayMemories, media: allMedia };
  }).filter(d => d.media.length > 0);

  if (memoriesByDay.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageOff className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">No photos yet</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Add memories to your trip days
        </p>
      </div>
    );
  }

  return (
    <StaggeredList className="space-y-6" staggerDelay={100}>
      {memoriesByDay.map(({ day, media }) => (
        <div key={day.id}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-beach-ocean" />
            <h3 className="font-semibold text-foreground">
              {format(new Date(day.date), 'EEEE, MMM d')}
            </h3>
            {day.title && (
              <span className="text-sm text-muted-foreground">• {day.title}</span>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {media.map((item, index) => {
              const photos: PhotoForViewer[] = media.map(m => ({
                id: m.id,
                storage_path: m.storage_path,
                caption: m.memoryNote,
                memoryId: m.memoryId
              }));
              
              return (
                <div key={item.id} className="relative group">
                  <button
                    onClick={() => onOpenPhoto(photos, index)}
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
      
      {/* Memory Edit Dialog */}
      <MemoryEditDialog
        open={!!editingMemory}
        onOpenChange={(open) => !open && setEditingMemory(null)}
        memory={editingMemory}
      />
    </StaggeredList>
  );
}
