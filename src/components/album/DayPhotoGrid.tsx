import { useState } from 'react';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { getMemoryMediaUrl, useDeleteMemory } from '@/hooks/use-memories';
import { Skeleton } from '@/components/ui/skeleton';
import { StaggeredList } from '@/components/ui/staggered-list';
import { KenBurnsImage } from '@/components/photos/KenBurnsImage';
import { MemoryEditDialog } from './MemoryEditDialog';
import type { Memory } from '@/types/trip';
import '@/preview/collage/collage.css';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { MarginNote } from '@/preview/collage/ui/MarginNote';
import { Tape } from '@/preview/collage/ui/Tape';

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

/**
 * Photos grouped by day. Migrated to Collage 2026-04-23 (Phase 4 #5).
 * Presentation only — grouping logic, open/delete handlers, query loading
 * state unchanged. Day heading uses IBM Plex Serif date + Caveat day-of-week
 * aside with a hairline dashed rule. Each photo is a small paper chip with a
 * ±2° rotation cycle (by index) that straightens + lifts on hover; the first
 * photo of each day group carries a Tape accent to land the scrapbook feel.
 * Empty state: MarginNote + outline Stamp.
 */

const ROT_CYCLE = [-2, 1, -1, 2, -1, 1];

export function DayPhotoGrid({ days, memories, onOpenPhoto, isLoading }: DayPhotoGridProps) {
  const deleteMemory = useDeleteMemory();
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="aspect-square rounded-none" />
              <Skeleton className="aspect-square rounded-none" />
              <Skeleton className="aspect-square rounded-none" />
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
        memory: m,
      })),
    );
    return { day, memories: dayMemories, media: allMedia };
  }).filter(d => d.media.length > 0);

  if (memoriesByDay.length === 0) {
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
          first photo lands on a day page ✦
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
          Add memories to your trip days and they'll start pasting in here.
        </p>
      </div>
    );
  }

  return (
    <StaggeredList className="space-y-7" staggerDelay={100}>
      {memoriesByDay.map(({ day, media }, dayIdx) => {
        const tapeRot = dayIdx % 3 === 0 ? -4 : dayIdx % 3 === 1 ? 3 : -2;
        return (
          <section key={day.id} style={{ position: 'relative' }}>
            {/* Dateline: IBM Plex Serif date, Caveat day aside, hairline rule */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
                paddingBottom: 10,
                marginBottom: 14,
                borderBottom: '1px dashed var(--c-line)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                <h3
                  style={{
                    fontFamily: 'var(--c-font-body)',
                    fontSize: 20,
                    fontWeight: 500,
                    color: 'var(--c-ink)',
                    lineHeight: 1.05,
                    margin: 0,
                  }}
                >
                  {format(new Date(day.date), 'MMM d')}
                </h3>
                <MarginNote rotate={-2} size={22} color="pen">
                  {format(new Date(day.date), 'EEEE')}
                </MarginNote>
                {day.title && (
                  <span
                    style={{
                      fontFamily: 'var(--c-font-body)',
                      fontStyle: 'italic',
                      color: 'var(--c-ink-muted)',
                      fontSize: 14,
                    }}
                  >
                    · {day.title}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 10,
                  letterSpacing: '.22em',
                  textTransform: 'uppercase',
                  color: 'var(--c-pen)',
                }}
              >
                {media.length} pasted in
              </span>
            </div>

            {/* Paper-chip photo grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 14,
              }}
              className="album-day-grid"
            >
              {media.map((item, index) => {
                const photos: PhotoForViewer[] = media.map(m => ({
                  id: m.id,
                  storage_path: m.storage_path,
                  caption: m.memoryNote,
                  memoryId: m.memoryId,
                }));
                const rot = ROT_CYCLE[index % ROT_CYCLE.length];
                const isFirst = index === 0;

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
                    {isFirst && <Tape position="top-left" rotate={tapeRot} width={48} />}
                    <button
                      onClick={() => onOpenPhoto(photos, index)}
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
                    {/* Delete button on hover */}
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

      {/* Memory Edit Dialog */}
      <MemoryEditDialog
        open={!!editingMemory}
        onOpenChange={(open) => !open && setEditingMemory(null)}
        memory={editingMemory}
      />

      <style>{`
        @media (max-width: 560px) {
          .album-day-grid { gap: 10px !important; }
        }
        @media (min-width: 640px) {
          .album-day-grid { grid-template-columns: repeat(4, 1fr) !important; }
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
