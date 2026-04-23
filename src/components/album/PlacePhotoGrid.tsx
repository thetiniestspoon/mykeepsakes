import { MapPin, Trash2 } from 'lucide-react';
import { getMemoryMediaUrl, useDeleteMemory } from '@/hooks/use-memories';
import { Skeleton } from '@/components/ui/skeleton';
import type { Memory, Location } from '@/types/trip';
import '@/preview/collage/collage.css';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { StickerPill } from '@/preview/collage/ui/StickerPill';
import { MarginNote } from '@/preview/collage/ui/MarginNote';
import { Tape } from '@/preview/collage/ui/Tape';

interface PhotoForViewer {
  id: string;
  storage_path: string;
  caption?: string | null;
  memoryId?: string;
}

interface PlacePhotoGridProps {
  locations: Location[];
  memories: Memory[];
  onOpenPhoto: (photos: PhotoForViewer[], index: number) => void;
  isLoading?: boolean;
}

/**
 * Photos grouped by place / location. Migrated to Collage 2026-04-23 (Phase 4 #5).
 * Presentation only — grouping logic + selection/delete handlers unchanged.
 * Each place is a horizontal film-strip of paper chips (±2° rotation cycle,
 * tape on the first chip), headed by a MapPin ink icon + place name in IBM
 * Plex Serif and a count sticker pill. Empty state: MarginNote + outline Stamp.
 */

const ROT_CYCLE = [-2, 1, -1, 2, -1, 1];

interface MediaItem {
  id: string;
  storage_path: string;
  memoryNote: string | null;
  memoryId: string;
  [key: string]: unknown;
}

interface PhotoChipProps {
  item: MediaItem;
  photos: PhotoForViewer[];
  index: number;
  onOpenPhoto: (photos: PhotoForViewer[], index: number) => void;
  onDelete: (memoryId: string) => void;
  tapeRot: number;
}

function PhotoChip({ item, photos, index, onOpenPhoto, onDelete, tapeRot }: PhotoChipProps) {
  const rot = ROT_CYCLE[index % ROT_CYCLE.length];
  const isFirst = index === 0;
  return (
    <div
      className="relative group album-chip"
      style={{
        position: 'relative',
        flexShrink: 0,
        background: 'var(--c-paper)',
        boxShadow: 'var(--c-shadow-sm)',
        padding: 4,
        transform: `rotate(${rot}deg)`,
        transition: 'transform var(--c-t-fast) var(--c-ease-out), box-shadow var(--c-t-fast)',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'rotate(0deg) translate(-2px, -2px)';
        e.currentTarget.style.boxShadow = 'var(--c-shadow)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = `rotate(${rot}deg)`;
        e.currentTarget.style.boxShadow = 'var(--c-shadow-sm)';
      }}
    >
      {isFirst && <Tape position="top-left" rotate={tapeRot} width={40} />}
      <button
        onClick={() => onOpenPhoto(photos, index)}
        className="focus:outline-none focus:ring-2 focus:ring-[var(--c-pen)]"
        style={{
          display: 'block',
          width: 96,
          height: 96,
          padding: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          overflow: 'hidden',
        }}
        aria-label="Open photo"
      >
        <img
          src={getMemoryMediaUrl(item.storage_path)}
          alt=""
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          loading="lazy"
        />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (confirm('Delete this photo?')) {
            onDelete(item.memoryId);
          }
        }}
        className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: 'var(--c-danger)',
          color: 'var(--c-creme)',
          borderRadius: 'var(--c-r-sm)',
          boxShadow: 'var(--c-shadow-sm)',
        }}
        aria-label="Delete photo"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

export function PlacePhotoGrid({ locations, memories, onOpenPhoto, isLoading }: PlacePhotoGridProps) {
  const deleteMemory = useDeleteMemory();

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2].map(i => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <div className="flex gap-3 overflow-hidden">
              <Skeleton className="w-24 h-24 rounded-none flex-shrink-0" />
              <Skeleton className="w-24 h-24 rounded-none flex-shrink-0" />
              <Skeleton className="w-24 h-24 rounded-none flex-shrink-0" />
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
        memoryId: m.id,
      })),
    );
    return { location, memories: locationMemories, media: allMedia };
  }).filter(l => l.media.length > 0);

  // Also include unassigned memories (no location)
  const unassignedMemories = memories.filter(m => !m.location_id);
  const unassignedMedia = unassignedMemories.flatMap(m =>
    (m.media || []).map(media => ({
      ...media,
      memoryNote: m.note,
      memoryId: m.id,
    })),
  );

  if (memoriesByLocation.length === 0 && unassignedMedia.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '48px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <Stamp variant="outline" size="md" rotate={-2}>
          no photos here yet
        </Stamp>
        <MarginNote rotate={-3} size={22}>
          link memories to a place ✦
        </MarginNote>
        <p
          style={{
            fontFamily: 'var(--c-font-body)',
            fontStyle: 'italic',
            color: 'var(--c-ink-muted)',
            fontSize: 15,
            maxWidth: '36ch',
            margin: 0,
          }}
        >
          Add memories linked to locations and they'll surface here by place.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {memoriesByLocation.map(({ location, media }, locIdx) => {
        const photos: PhotoForViewer[] = media.map(m => ({
          id: m.id,
          storage_path: m.storage_path,
          caption: m.memoryNote,
          memoryId: m.memoryId,
        }));
        const tapeRot = locIdx % 3 === 0 ? -4 : locIdx % 3 === 1 ? 3 : -2;
        return (
          <section key={location.id}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                paddingBottom: 10,
                marginBottom: 14,
                borderBottom: '1px dashed var(--c-line)',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <MapPin style={{ width: 16, height: 16, color: 'var(--c-pen)' }} aria-hidden />
                <h3
                  style={{
                    fontFamily: 'var(--c-font-body)',
                    fontSize: 18,
                    fontWeight: 500,
                    color: 'var(--c-ink)',
                    margin: 0,
                  }}
                >
                  {location.name}
                </h3>
                <StickerPill variant="pen" style={{ fontSize: 9, padding: '4px 8px' }}>
                  {media.length}
                </StickerPill>
              </div>
            </div>
            <div
              className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
              style={{ paddingTop: 8, paddingLeft: 2, paddingRight: 2 }}
            >
              {media.map((item, index) => (
                <PhotoChip
                  key={item.id}
                  item={item as MediaItem}
                  photos={photos}
                  index={index}
                  onOpenPhoto={onOpenPhoto}
                  onDelete={(memoryId) => deleteMemory.mutate(memoryId)}
                  tapeRot={tapeRot}
                />
              ))}
            </div>
          </section>
        );
      })}

      {unassignedMedia.length > 0 && (() => {
        const photos: PhotoForViewer[] = unassignedMedia.map(m => ({
          id: m.id,
          storage_path: m.storage_path,
          caption: m.memoryNote,
          memoryId: m.memoryId,
        }));
        return (
          <section>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                paddingBottom: 10,
                marginBottom: 14,
                borderBottom: '1px dashed var(--c-line)',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <MapPin style={{ width: 16, height: 16, color: 'var(--c-ink-muted)' }} aria-hidden />
                <h3
                  style={{
                    fontFamily: 'var(--c-font-body)',
                    fontSize: 18,
                    fontWeight: 500,
                    color: 'var(--c-ink)',
                    margin: 0,
                  }}
                >
                  Loose pages
                </h3>
                <MarginNote rotate={-2} size={20}>not yet filed to a place</MarginNote>
                <StickerPill variant="ink" style={{ fontSize: 9, padding: '4px 8px' }}>
                  {unassignedMedia.length}
                </StickerPill>
              </div>
            </div>
            <div
              className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
              style={{ paddingTop: 8, paddingLeft: 2, paddingRight: 2 }}
            >
              {unassignedMedia.map((item, index) => (
                <PhotoChip
                  key={item.id}
                  item={item as MediaItem}
                  photos={photos}
                  index={index}
                  onOpenPhoto={onOpenPhoto}
                  onDelete={(memoryId) => deleteMemory.mutate(memoryId)}
                  tapeRot={-2}
                />
              ))}
            </div>
          </section>
        );
      })()}

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .album-chip {
            transform: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
