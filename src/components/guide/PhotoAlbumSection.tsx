import { Images } from 'lucide-react';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { getPhotoUrl } from '@/hooks/use-trip-data';

interface Photo {
  id: string;
  storage_path: string;
  caption?: string | null;
}

interface PhotoAlbumSectionProps {
  photos: Photo[] | undefined;
  onOpenPhoto: (photos: Photo[], index: number) => void;
}

export function PhotoAlbumSection({ photos, onOpenPhoto }: PhotoAlbumSectionProps) {
  return (
    <AccordionItem value="photos" className="border rounded-lg shadow-warm overflow-hidden">
      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-beach-sunset-coral/30 flex items-center justify-center">
            <Images className="w-5 h-5 text-beach-sunset-coral" />
          </div>
          <div className="text-left">
            <span className="font-semibold">Photo Album</span>
            <p className="text-sm text-muted-foreground">
              {photos?.length || 0} memories captured
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        {photos && photos.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => onOpenPhoto(photos, index)}
                className="aspect-square rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <img
                  src={getPhotoUrl(photo.storage_path)}
                  alt={photo.caption || 'Trip photo'}
                  className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                />
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No photos yet. Add photos to activities in your itinerary!
          </p>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
