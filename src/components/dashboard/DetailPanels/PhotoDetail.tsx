import { Calendar, MapPin, StickyNote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Memory, MemoryMedia } from '@/types/trip';
import { supabase } from '@/integrations/supabase/client';

interface PhotoDetailProps {
  memory: Memory | null;
}

/**
 * Photo/memory detail viewer for the center column
 */
export function PhotoDetail({ memory }: PhotoDetailProps) {
  if (!memory) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Select a photo to see details</p>
      </div>
    );
  }

  // Get public URLs for media
  const getMediaUrl = (media: MemoryMedia) => {
    const { data } = supabase.storage.from('memories').getPublicUrl(media.storage_path);
    return data?.publicUrl;
  };

  return (
    <div className="space-y-4">
      {/* Photo Gallery */}
      {memory.media && memory.media.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {memory.media.map((media) => (
            <div 
              key={media.id} 
              className="aspect-square bg-muted rounded-lg overflow-hidden"
            >
              <img 
                src={getMediaUrl(media)} 
                alt={memory.title || 'Memory photo'} 
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Title */}
      {memory.title && (
        <h2 className="text-xl font-semibold text-foreground">{memory.title}</h2>
      )}

      {/* Metadata */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        {memory.day && (
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{memory.day.title || memory.day.date}</span>
          </div>
        )}
        {memory.location && (
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{memory.location.name}</span>
          </div>
        )}
      </div>

      {/* Note */}
      {memory.note && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <StickyNote className="w-4 h-4 text-muted-foreground mt-0.5" />
              <p className="text-sm text-foreground whitespace-pre-wrap">{memory.note}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
