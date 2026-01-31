import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, MapPin, Clock, Images } from 'lucide-react';
import { useMemories, getMemoryMediaUrl } from '@/hooks/use-memories';
import { useDatabaseItinerary } from '@/hooks/use-database-itinerary';
import { useLocations } from '@/hooks/use-locations';
import { useActiveTrip } from '@/hooks/use-trip';
import { PhotoViewer } from '@/components/photos/PhotoViewer';
import { MemoryCaptureDialog } from '@/components/album/MemoryCaptureDialog';
import { DayPhotoGrid } from '@/components/album/DayPhotoGrid';
import { PlacePhotoGrid } from '@/components/album/PlacePhotoGrid';
import { RecentPhotoGrid } from '@/components/album/RecentPhotoGrid';
import type { MemoryMedia } from '@/types/trip';

interface PhotoForViewer {
  id: string;
  storage_path: string;
  caption?: string | null;
}

export function AlbumTab() {
  const { data: trip } = useActiveTrip();
  const { data: memories, isLoading: memoriesLoading } = useMemories(trip?.id);
  const { days } = useDatabaseItinerary();
  const { data: locations } = useLocations(trip?.id);
  
  const [captureOpen, setCaptureOpen] = useState(false);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [viewerPhotos, setViewerPhotos] = useState<PhotoForViewer[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);

  // Flatten all media from memories for the viewer
  const allMedia: MemoryMedia[] = memories?.flatMap(m => m.media || []) || [];

  const openPhotoViewer = (photos: PhotoForViewer[], index: number) => {
    setViewerPhotos(photos);
    setViewerIndex(index);
    setPhotoViewerOpen(true);
  };

  const totalPhotos = allMedia.length;

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between px-4 py-4">
        <div>
          <h2 className="font-display text-2xl text-foreground flex items-center gap-2">
            <Images className="w-6 h-6 text-beach-sunset-coral" />
            Photo Album
          </h2>
          <p className="text-muted-foreground text-sm">
            {totalPhotos} {totalPhotos === 1 ? 'memory' : 'memories'} captured
          </p>
        </div>
        <Button 
          onClick={() => setCaptureOpen(true)}
          size="sm"
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          Add
        </Button>
      </div>

      <Tabs defaultValue="day" className="px-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="day" className="gap-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5" />
            By Day
          </TabsTrigger>
          <TabsTrigger value="place" className="gap-1.5 text-xs">
            <MapPin className="w-3.5 h-3.5" />
            By Place
          </TabsTrigger>
          <TabsTrigger value="recent" className="gap-1.5 text-xs">
            <Clock className="w-3.5 h-3.5" />
            Recent
          </TabsTrigger>
        </TabsList>

        <TabsContent value="day" className="mt-4">
          <DayPhotoGrid 
            days={days} 
            memories={memories || []} 
            onOpenPhoto={openPhotoViewer}
            isLoading={memoriesLoading}
          />
        </TabsContent>

        <TabsContent value="place" className="mt-4">
          <PlacePhotoGrid 
            locations={locations || []} 
            memories={memories || []} 
            onOpenPhoto={openPhotoViewer}
            isLoading={memoriesLoading}
          />
        </TabsContent>

        <TabsContent value="recent" className="mt-4">
          <RecentPhotoGrid 
            memories={memories || []} 
            onOpenPhoto={openPhotoViewer}
            isLoading={memoriesLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Memory Capture Dialog */}
      <MemoryCaptureDialog
        open={captureOpen}
        onOpenChange={setCaptureOpen}
        tripId={trip?.id}
        days={days}
        locations={locations || []}
      />

      {/* Photo Viewer */}
      <PhotoViewer
        photos={viewerPhotos}
        initialIndex={viewerIndex}
        open={photoViewerOpen}
        onOpenChange={setPhotoViewerOpen}
      />
    </div>
  );
}
