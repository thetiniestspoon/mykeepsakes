import { format } from 'date-fns';
import { Calendar, ImageOff } from 'lucide-react';
import { getMemoryMediaUrl } from '@/hooks/use-memories';
import { Skeleton } from '@/components/ui/skeleton';
import { StaggeredList } from '@/components/ui/staggered-list';
import { KenBurnsImage } from '@/components/photos/KenBurnsImage';
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
}

interface DayPhotoGridProps {
  days: Day[];
  memories: Memory[];
  onOpenPhoto: (photos: PhotoForViewer[], index: number) => void;
  isLoading?: boolean;
}

export function DayPhotoGrid({ days, memories, onOpenPhoto, isLoading }: DayPhotoGridProps) {
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
        memoryNote: m.note
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
                caption: m.memoryNote
              }));
              
              return (
                <button
                  key={item.id}
                  onClick={() => onOpenPhoto(photos, index)}
                  className="aspect-square rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <KenBurnsImage
                    src={getMemoryMediaUrl(item.storage_path)}
                    alt=""
                    className="w-full h-full"
                  />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </StaggeredList>
  );
}
