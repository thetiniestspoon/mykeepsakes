import { useMemo } from 'react';
import { useActiveTrip, useTripDays } from '@/hooks/use-trip';
import { useMemories } from '@/hooks/use-memories';
import { Stamp } from '../../ui/Stamp';
import { StickerPill } from '../../ui/StickerPill';
import { PolaroidCard, resolveMood, type Mood } from '../../ui/PolaroidCard';
import { MarginNote } from '../../ui/MarginNote';
import { Tape } from '../../ui/Tape';
import type { Memory, ItineraryDay } from '@/types/trip';

/**
 * Album V1 — By Day (Scrapbook Pages).
 *
 * The photos/album view organized by day. Each trip day becomes a "page" in
 * the scrapbook: tape at top, a Caveat-style dateline header ("Sun · Apr 20"),
 * and a 4–6 slot polaroid grid beneath. Pre-conference (no memories yet) the
 * slots render as dashed-outline ghosts with a pre-tinted mood matched to the
 * day (so the empty state is expectant, not sad). As memories flow in, those
 * ghost slots fill in-place with the real caption + media indicator; any
 * extras spill after the baseline slots so the page never "runs out of room".
 *
 * Primary intent of this variant: make the empty state readable as a promise,
 * not a gap — the page already has the shape it'll have after the trip.
 *
 * Data: useActiveTrip, useTripDays, useMemories (all via TanStack Query).
 * Storage: memory.media[].storage_path is referenced as a pointer only;
 * actual Supabase storage fetching is deliberately NOT performed here — the
 * polaroid gradient serves as the visual placeholder, with a small overlay
 * pill indicating "📷 photo" when media is attached.
 */

const SLOTS_PER_DAY = 5;

/** Pick a per-day mood that gives the week visual rhythm. */
function dayMood(day: ItineraryDay, totalDays: number, index: number): Mood {
  // Explicit day-index heuristic: open (dawn), arrival/orientation (sky),
  // heart of the week (sage/gold), Saturday social (clay), closing (ink).
  if (totalDays <= 1) return 'sage';
  const pct = index / Math.max(totalDays - 1, 1);
  if (index === 0) return 'dawn';
  if (index === totalDays - 1) return 'ink';
  if (pct < 0.33) return 'sky';
  if (pct < 0.66) return 'sage';
  return 'gold';
}

function shortWeekday(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', { weekday: 'short' });
}

function monthDay(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric' });
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}

export function AlbumV1() {
  const { data: trip } = useActiveTrip();
  const { data: days = [] } = useTripDays(trip?.id);
  const { data: memories = [] } = useMemories(trip?.id);

  // Group memories by day_id; keep unassigned in a "floating" bucket
  const memoriesByDay = useMemo(() => {
    const map = new Map<string, Memory[]>();
    days.forEach(d => map.set(d.id, []));
    const floating: Memory[] = [];
    memories.forEach(m => {
      if (m.day_id && map.has(m.day_id)) {
        map.get(m.day_id)!.push(m);
      } else {
        floating.push(m);
      }
    });
    return { map, floating };
  }, [memories, days]);

  const totalMemories = memories.length;
  const totalWithMedia = useMemo(
    () => memories.filter(m => (m.media?.length ?? 0) > 0).length,
    [memories],
  );

  if (!trip) {
    return (
      <div style={{ padding: 80 }}>
        <Stamp size="md" variant="outline">No active trip</Stamp>
      </div>
    );
  }

  return (
    <main
      style={{
        padding: 'clamp(32px, 4vw, 56px) clamp(24px, 5vw, 64px) 96px',
        minHeight: 'calc(100vh - 120px)',
        position: 'relative',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 24,
          marginBottom: 44,
        }}
      >
        <div>
          <Stamp variant="outline" size="sm" rotate={-2} style={{ marginBottom: 14 }}>
            the album · by day
          </Stamp>
          <h1
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 500,
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            Scrapbook pages
          </h1>
          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontStyle: 'italic',
              color: 'var(--c-ink-muted)',
              margin: '6px 0 0',
              fontSize: 17,
              maxWidth: '56ch',
            }}
          >
            {totalMemories === 0
              ? 'Nothing pasted in yet — the pages are waiting. Each day below is a spread that will fill as the trip unfolds.'
              : `${totalMemories} ${totalMemories === 1 ? 'memory' : 'memories'} so far · ${totalWithMedia} with photos.`}
          </p>
        </div>

        {/* Summary chip strip */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <StickerPill variant="ink" style={{ fontSize: 9, padding: '8px 10px' }}>
            {days.length} {days.length === 1 ? 'page' : 'pages'}
          </StickerPill>
          <StickerPill variant="pen" style={{ fontSize: 9, padding: '8px 10px' }}>
            {totalMemories} memories
          </StickerPill>
          {totalMemories === 0 && (
            <MarginNote rotate={-3} size={22} style={{ marginLeft: 4 }}>
              waiting for Apr 20 ✦
            </MarginNote>
          )}
        </div>
      </header>

      {/* Day pages */}
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(32px, 4vw, 56px)',
        }}
      >
        {days.length === 0 && (
          <div style={{ padding: 40, color: 'var(--c-ink-muted)' }}>
            <MarginNote size={22}>no days on this trip yet</MarginNote>
          </div>
        )}

        {days.map((day, dayIdx) => {
          const dayMemories = memoriesByDay.map.get(day.id) ?? [];
          const mood = dayMood(day, days.length, dayIdx);
          const slotCount = Math.max(SLOTS_PER_DAY, dayMemories.length);
          const pageRotate = dayIdx % 2 === 0 ? -0.6 : 0.6;
          const tapeRot = dayIdx % 3 === 0 ? -4 : dayIdx % 3 === 1 ? 3 : -2;

          return (
            <article
              key={day.id}
              className="album-page collage-enter"
              style={{
                background: 'var(--c-paper)',
                boxShadow: 'var(--c-shadow)',
                padding: 'clamp(24px, 3vw, 40px) clamp(20px, 3vw, 36px) clamp(28px, 3vw, 40px)',
                position: 'relative',
                transform: `rotate(${pageRotate}deg)`,
                animationDelay: `${dayIdx * 60}ms`,
              }}
            >
              <Tape position="top" rotate={tapeRot} width={108} />

              {/* Dateline */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                  marginBottom: 22,
                  borderBottom: '1px dashed var(--c-line)',
                  paddingBottom: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontFamily: 'var(--c-font-script)',
                      fontWeight: 600,
                      fontSize: 30,
                      color: 'var(--c-ink)',
                      lineHeight: 1,
                    }}
                  >
                    {shortWeekday(day.date)} · {monthDay(day.date)}
                  </span>
                  {day.title && (
                    <span
                      style={{
                        fontFamily: 'var(--c-font-body)',
                        fontStyle: 'italic',
                        color: 'var(--c-ink-muted)',
                        fontSize: 16,
                      }}
                    >
                      {day.title}
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontFamily: 'var(--c-font-display)',
                    fontSize: 10,
                    letterSpacing: '.24em',
                    textTransform: 'uppercase',
                    color: dayMemories.length > 0 ? 'var(--c-pen)' : 'var(--c-ink-muted)',
                  }}
                >
                  {dayMemories.length > 0
                    ? `${dayMemories.length} pasted in`
                    : 'nothing yet'}
                </span>
              </div>

              {/* Polaroid grid */}
              <div
                className="album-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: 24,
                  justifyItems: 'center',
                }}
              >
                {Array.from({ length: slotCount }).map((_, slotIdx) => {
                  const memory = dayMemories[slotIdx];
                  const rot = [-3, 2, -2, 3, -1, 2][slotIdx % 6];
                  const hasMedia = (memory?.media?.length ?? 0) > 0;

                  if (!memory) {
                    // Empty slot — dashed-outline ghost polaroid
                    return (
                      <GhostPolaroid
                        key={`ghost-${slotIdx}`}
                        mood={mood}
                        rotate={rot}
                        entranceDelayMs={dayIdx * 60 + slotIdx * 40}
                      />
                    );
                  }

                  // Real memory — use mood derived from the linked item if present
                  const memMood: Mood = memory.itinerary_item
                    ? resolveMood(memory.itinerary_item.category, memory.itinerary_item.start_time)
                    : mood;
                  return (
                    <PolaroidCard
                      key={memory.id}
                      mood={memMood}
                      rotate={rot}
                      size="sm"
                      entrance
                      entranceDelayMs={dayIdx * 60 + slotIdx * 40}
                      tape={slotIdx === 0}
                      overline={hasMedia ? '📷 photo' : 'note'}
                      caption={truncate(memory.title ?? memory.note ?? 'moment', 28)}
                    />
                  );
                })}
              </div>

              {/* Per-page margin note when fully empty */}
              {dayMemories.length === 0 && dayIdx === 0 && (
                <MarginNote
                  rotate={-2}
                  size={20}
                  style={{
                    display: 'block',
                    marginTop: 22,
                    textAlign: 'center',
                  }}
                >
                  first photo lands here ✦
                </MarginNote>
              )}
            </article>
          );
        })}

        {/* Floating memories (not attached to any day) */}
        {memoriesByDay.floating.length > 0 && (
          <article
            style={{
              background: 'var(--c-paper)',
              boxShadow: 'var(--c-shadow)',
              padding: 'clamp(24px, 3vw, 40px)',
              position: 'relative',
            }}
          >
            <Tape position="top-left" rotate={-6} />
            <div style={{ marginBottom: 18 }}>
              <span
                style={{
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 12,
                  letterSpacing: '.24em',
                  textTransform: 'uppercase',
                  color: 'var(--c-ink)',
                }}
              >
                ✦ loose pages
              </span>
              <p
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontStyle: 'italic',
                  color: 'var(--c-ink-muted)',
                  fontSize: 14,
                  margin: '4px 0 0',
                }}
              >
                memories not yet filed to a day
              </p>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 24,
                justifyItems: 'center',
              }}
            >
              {memoriesByDay.floating.map((m, i) => {
                const hasMedia = (m.media?.length ?? 0) > 0;
                return (
                  <PolaroidCard
                    key={m.id}
                    mood="sage"
                    rotate={i % 2 === 0 ? -2 : 2}
                    size="sm"
                    entrance
                    entranceDelayMs={i * 40}
                    overline={hasMedia ? '📷 photo' : 'note'}
                    caption={truncate(m.title ?? m.note ?? 'moment', 28)}
                  />
                );
              })}
            </div>
          </article>
        )}
      </section>

      <style>{`
        @media (max-width: 560px) {
          .album-page { transform: none !important; }
          .album-grid { gap: 16px !important; }
        }
      `}</style>
    </main>
  );
}

/** Ghost polaroid — a slot-with-expectancy. Dashed border + reduced opacity + italic caption. */
function GhostPolaroid({
  mood,
  rotate,
  entranceDelayMs,
}: {
  mood: Mood;
  rotate: number;
  entranceDelayMs: number;
}) {
  return (
    <div
      className="collage-enter"
      style={{
        position: 'relative',
        width: 180,
        background: 'var(--c-paper)',
        padding: '16px 16px 40px',
        boxShadow: 'var(--c-shadow-sm)',
        transform: `rotate(${rotate}deg)`,
        border: '1.5px dashed var(--c-line)',
        opacity: 0.72,
        animationDelay: `${entranceDelayMs}ms`,
        // ensure @keyframes collage-shuffle-in sees correct final rotation
        ['--c-rot' as string]: `${rotate}deg`,
      } as React.CSSProperties}
    >
      <div
        aria-hidden
        style={{
          fontFamily: 'var(--c-font-display)',
          fontSize: 10,
          letterSpacing: '.22em',
          textTransform: 'uppercase',
          color: 'var(--c-ink-muted)',
          marginBottom: 10,
        }}
      >
        slot
      </div>
      <div
        aria-hidden
        style={{
          width: '100%',
          aspectRatio: '4/5',
          background: MOOD_TINT[mood],
          opacity: 0.55,
          position: 'relative',
          border: '1px dashed rgba(29,29,27,0.18)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 12,
          textAlign: 'center',
          fontFamily: 'var(--c-font-body)',
          fontStyle: 'italic',
          fontSize: 13,
          color: 'var(--c-ink-muted)',
          lineHeight: 1.2,
        }}
      >
        nothing yet
      </div>
    </div>
  );
}

// Reduced-saturation version of PolaroidCard moods for ghost slots.
const MOOD_TINT: Record<Mood, string> = {
  sage: 'linear-gradient(155deg, #b9c9a5 0%, #d6dcb9 60%, #ece5c9 100%)',
  gold: 'linear-gradient(160deg, #c9bb97 0%, #e0ceaa 50%, #ece0c4 100%)',
  sky:  'linear-gradient(140deg, #a6bcd3 0%, #c8d7e5 60%, #e4ecf3 100%)',
  dawn: 'linear-gradient(180deg, #f6d0b3 0%, #f5d9cc 60%, #fce4d6 100%)',
  clay: 'linear-gradient(200deg, #d3b19b 0%, #e3c4ac 50%, #f1dcc3 100%)',
  ink:  'linear-gradient(135deg, #8b8680 0%, #a6a199 55%, #c2bcb2 100%)',
};
