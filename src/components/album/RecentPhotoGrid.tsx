import { Trash2 } from 'lucide-react';
import { getMemoryMediaUrl, useDeleteMemory } from '@/hooks/use-memories';
import { Skeleton } from '@/components/ui/skeleton';
import { StaggeredList } from '@/components/ui/staggered-list';
import { KenBurnsImage } from '@/components/photos/KenBurnsImage';
import type { Memory, MemoryMedia } from '@/types/trip';
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

/**
 * Recent photos, grouped by relative time (Today / Yesterday / This Week /
 * Earlier). Migrated to Collage 2026-04-23 (Phase 4 #5). Presentation only —
 * time grouping, sort order, selection/delete handlers unchanged. Each group
 * header uses IBM Plex Serif + a Caveat MarginNote; photos render as paper
 * chips with a ±2° rotation cycle that straightens + lifts on hover. Tape
 * lands on the first chip of each group.
 */

const ROT_CYCLE = [-2, 1, -1, 2, -1, 1];

export function RecentPhotoGrid({ memories, onOpenPhoto, isLoading }: RecentPhotoGridProps) {
  const deleteMemory = useDeleteMemory();

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-none" />
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
        memoryId: m.id,
      })),
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (allMedia.length === 0) {
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
          start capturing ✦
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
          As you add memories, the most recent will land at the top of this page.
        </p>
      </div>
    );
  }

  // Create photos array for viewer
  const allPhotos: PhotoForViewer[] = allMedia.map(m => ({
    id: m.id,
    storage_path: m.storage_path,
    caption: m.memoryNote,
    memoryId: m.memoryId,
  }));

  // Group by relative time for display
  const now = new Date();
  const groups: { label: string; aside: string; items: MediaWithMeta[] }[] = [
    {
      label: 'Today',
      aside: 'just now',
      items: allMedia.filter(m => {
        const d = new Date(m.created_at);
        return d.toDateString() === now.toDateString();
      }),
    },
    {
      label: 'Yesterday',
      aside: 'a day back',
      items: allMedia.filter(m => {
        const d = new Date(m.created_at);
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return d.toDateString() === yesterday.toDateString();
      }),
    },
    {
      label: 'This Week',
      aside: 'the rhythm',
      items: allMedia.filter(m => {
        const d = new Date(m.created_at);
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return (
          d > weekAgo &&
          d.toDateString() !== now.toDateString() &&
          d.toDateString() !== yesterday.toDateString()
        );
      }),
    },
    {
      label: 'Earlier',
      aside: 'further back',
      items: allMedia.filter(m => {
        const d = new Date(m.created_at);
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return d <= weekAgo;
      }),
    },
  ].filter(g => g.items.length > 0);

  return (
    <StaggeredList className="space-y-7" staggerDelay={80}>
      {groups.map((group, groupIdx) => {
        const tapeRot = groupIdx % 3 === 0 ? -4 : groupIdx % 3 === 1 ? 3 : -2;
        return (
          <section key={group.label}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 12,
                paddingBottom: 10,
                marginBottom: 14,
                borderBottom: '1px dashed var(--c-line)',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                <h3
                  style={{
                    fontFamily: 'var(--c-font-body)',
                    fontSize: 20,
                    fontWeight: 500,
                    color: 'var(--c-ink)',
                    margin: 0,
                    lineHeight: 1.05,
                  }}
                >
                  {group.label}
                </h3>
                <MarginNote rotate={-2} size={22} color="pen">
                  {group.aside}
                </MarginNote>
              </div>
              <StickerPill variant="pen" style={{ fontSize: 9, padding: '4px 8px' }}>
                {group.items.length}
              </StickerPill>
            </div>
            <div
              className="grid grid-cols-3 sm:grid-cols-4 album-recent-grid"
              style={{ gap: 14 }}
            >
              {group.items.map((item, idx) => {
                // Find the global index for this item
                const globalIndex = allMedia.findIndex(m => m.id === item.id);
                const rot = ROT_CYCLE[idx % ROT_CYCLE.length];
                const isFirst = idx === 0;

                return (
                  <div
                    key={item.id}
                    className="relative group album-chip"
                    style={{
                      position: 'relative',
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
                    {isFirst && <Tape position="top-left" rotate={tapeRot} width={44} />}
                    <button
                      onClick={() => onOpenPhoto(allPhotos, globalIndex)}
                      className="aspect-square w-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-[var(--c-pen)]"
                      style={{
                        display: 'block',
                        padding: 0,
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                      }}
                      aria-label="Open photo"
                    >
                      <KenBurnsImage
                        src={getMemoryMediaUrl(item.storage_path)}
                        alt=""
                        className="w-full h-full"
                      />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this photo?')) {
                          deleteMemory.mutate(item.memoryId);
                        }
                      }}
                      className="absolute top-1 right-1 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
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
              })}
            </div>
          </section>
        );
      })}

      <style>{`
        @media (max-width: 560px) {
          .album-recent-grid { gap: 10px !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .album-chip {
            transform: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </StaggeredList>
  );
}
