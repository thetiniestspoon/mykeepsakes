import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, MapPin, Clock } from 'lucide-react';
import { useMemories, useDeleteMemoryMedia } from '@/hooks/use-memories';
import { useDatabaseItinerary } from '@/hooks/use-database-itinerary';
import { useLocations } from '@/hooks/use-locations';
import { useActiveTrip } from '@/hooks/use-trip';
import { PhotoViewer, type Photo } from '@/components/photos/PhotoViewer';
import { MemoryCaptureDialog } from '@/components/album/MemoryCaptureDialog';
import { MemoryEditDialog } from '@/components/album/MemoryEditDialog';
import { DayPhotoGrid } from '@/components/album/DayPhotoGrid';
import { PlacePhotoGrid } from '@/components/album/PlacePhotoGrid';
import { RecentPhotoGrid } from '@/components/album/RecentPhotoGrid';
import type { Memory, MemoryMedia } from '@/types/trip';
import '@/preview/collage/collage.css';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { StickerPill } from '@/preview/collage/ui/StickerPill';
import { MarginNote } from '@/preview/collage/ui/MarginNote';

interface PhotoForViewer {
  id: string;
  storage_path: string;
  caption?: string | null;
  memoryId?: string;
}

/**
 * Album / Photos tab.
 * Migrated to Collage direction 2026-04-23 (Phase 4 #5). Presentation only —
 * tab switching, queries, selection handlers, and dialog wiring are unchanged.
 * Aesthetic vocabulary follows AlbumV1 ("Scrapbook Pages by Day"): stamped
 * eyebrow, IBM Plex Serif hero, Caveat margin note, ink/pen/tape tab bar.
 * Per-tab grids (DayPhotoGrid / PlacePhotoGrid / RecentPhotoGrid) restyled in
 * their own files. Memory dialogs in this directory stay on a parallel branch.
 */

export function AlbumTab() {
  const { data: trip } = useActiveTrip();
  const { data: memories, isLoading: memoriesLoading } = useMemories(trip?.id);
  const { days } = useDatabaseItinerary();
  const { data: locations } = useLocations(trip?.id);

  const [captureOpen, setCaptureOpen] = useState(false);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [viewerPhotos, setViewerPhotos] = useState<PhotoForViewer[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [memoryEditOpen, setMemoryEditOpen] = useState(false);

  const deleteMemoryMedia = useDeleteMemoryMedia();

  // Flatten all media from memories for the viewer
  const allMedia: MemoryMedia[] = memories?.flatMap(m => m.media || []) || [];

  const openPhotoViewer = (photos: PhotoForViewer[], index: number) => {
    setViewerPhotos(photos);
    setViewerIndex(index);
    setPhotoViewerOpen(true);
  };

  const handleEditPhoto = (photo: Photo) => {
    if (!photo.memoryId || !memories) return;
    const mem = memories.find(m => m.id === photo.memoryId);
    if (!mem) return;
    setEditingMemory(mem);
    setMemoryEditOpen(true);
  };

  const handleDeletePhoto = (photo: Photo) => {
    // Find the source media to get storage_path + thumbnail_path for proper storage cleanup.
    const media = allMedia.find(m => m.id === photo.id);
    if (!media) return;
    deleteMemoryMedia.mutate({
      mediaId: media.id,
      storagePath: media.storage_path,
      thumbnailPath: media.thumbnail_path,
    });
    // Drop the deleted photo from the viewer array so the next/prev works immediately.
    setViewerPhotos(prev => prev.filter(p => p.id !== photo.id));
  };

  const totalPhotos = allMedia.length;

  return (
    <div className="collage-root pb-20">
      {/* Album masthead */}
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          padding: '20px 16px 18px',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <Stamp variant="outline" size="sm" rotate={-2} style={{ marginBottom: 10 }}>
            the album · by day
          </Stamp>
          <h2
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 'clamp(22px, 5vw, 28px)',
              fontWeight: 500,
              lineHeight: 1.1,
              margin: 0,
              color: 'var(--c-ink)',
            }}
          >
            Scrapbook pages
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
            <StickerPill variant="ink" style={{ fontSize: 9, padding: '6px 10px' }}>
              {totalPhotos} {totalPhotos === 1 ? 'memory' : 'memories'}
            </StickerPill>
            {totalPhotos === 0 && (
              <MarginNote rotate={-3} size={20}>
                waiting to be pasted in ✦
              </MarginNote>
            )}
          </div>
        </div>

        <Button
          onClick={() => setCaptureOpen(true)}
          size="sm"
          className="gap-1"
          style={{
            background: 'var(--c-ink)',
            color: 'var(--c-creme)',
            borderRadius: 'var(--c-r-sm)',
            fontFamily: 'var(--c-font-body)',
            fontWeight: 500,
          }}
        >
          <Plus className="w-4 h-4" />
          Add
        </Button>
      </header>

      <Tabs defaultValue="day" className="px-4">
        <TabsList
          className="grid w-full grid-cols-3"
          style={{
            background: 'var(--c-paper)',
            border: '1px solid var(--c-line)',
            borderRadius: 'var(--c-r-sm)',
            padding: 4,
            boxShadow: 'var(--c-shadow-sm)',
          }}
        >
          <TabsTrigger
            value="day"
            className="gap-1.5 text-xs data-[state=active]:bg-[var(--c-ink)] data-[state=active]:text-[var(--c-creme)] data-[state=active]:shadow-none"
            style={{
              fontFamily: 'var(--c-font-display)',
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              fontSize: 10,
              borderRadius: 'var(--c-r-sm)',
            }}
          >
            <Calendar className="w-3.5 h-3.5" />
            By Day
          </TabsTrigger>
          <TabsTrigger
            value="place"
            className="gap-1.5 text-xs data-[state=active]:bg-[var(--c-ink)] data-[state=active]:text-[var(--c-creme)] data-[state=active]:shadow-none"
            style={{
              fontFamily: 'var(--c-font-display)',
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              fontSize: 10,
              borderRadius: 'var(--c-r-sm)',
            }}
          >
            <MapPin className="w-3.5 h-3.5" />
            By Place
          </TabsTrigger>
          <TabsTrigger
            value="recent"
            className="gap-1.5 text-xs data-[state=active]:bg-[var(--c-ink)] data-[state=active]:text-[var(--c-creme)] data-[state=active]:shadow-none"
            style={{
              fontFamily: 'var(--c-font-display)',
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              fontSize: 10,
              borderRadius: 'var(--c-r-sm)',
            }}
          >
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

      {/* Reduced-motion fallback for any tilt/hover inside this tree */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .collage-root .album-chip,
          .collage-root .album-chip * {
            transition: none !important;
            transform: none !important;
            animation: none !important;
          }
        }
      `}</style>

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
        onEdit={handleEditPhoto}
        onDelete={handleDeletePhoto}
      />

      {/* Memory Edit Dialog (tags + note) */}
      <MemoryEditDialog
        open={memoryEditOpen}
        onOpenChange={setMemoryEditOpen}
        memory={editingMemory}
      />
    </div>
  );
}
