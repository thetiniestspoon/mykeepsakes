import { useMemo } from 'react';
import { useActiveTrip } from '@/hooks/use-trip';
import { useLocations } from '@/hooks/use-locations';
import { useMemories } from '@/hooks/use-memories';
import { Stamp } from '../../ui/Stamp';
import { StickerPill } from '../../ui/StickerPill';
import { PolaroidCard, type Mood } from '../../ui/PolaroidCard';
import { MarginNote } from '../../ui/MarginNote';
import { Tape } from '../../ui/Tape';
import type { Memory, Location } from '@/types/trip';

/**
 * Album V2 — By Place (Location Clusters).
 *
 * The photos/album view organized by `location_id` rather than date. Each
 * location becomes a "sticker-album page": a taped header card bearing the
 * location name (Rubik Mono / IBM Plex Serif duet) plus address, and
 * a horizontal row of polaroid slots beneath. Locations with zero attached
 * photos show a single outlined "waiting" polaroid and a Caveat margin note
 * ("first photo goes here ✦") — empty-state as invitation rather than
 * absence.
 *
 * Locations are sorted by category priority (venue → accommodation/hotel →
 * airport/transport → other) so the most-visited places live near the top
 * of the album.
 *
 * Data: useActiveTrip, useLocations, useMemories. Memories without a
 * location_id are folded into an "unfiled" cluster at the bottom so nothing
 * is ever hidden. Storage paths are NOT fetched — the polaroid gradient
 * serves as the visual placeholder; a "📷 photo" overline marks slots whose
 * memory has real media attached.
 */

const BASE_SLOTS = 4;

/** Category → sort weight (lower = earlier). */
function categoryPriority(category: string | null | undefined): number {
  const c = (category ?? '').toLowerCase();
  if (c.includes('venue') || c.includes('conference') || c === 'event') return 0;
  if (c.includes('hotel') || c.includes('accommodation') || c.includes('lodging')) return 1;
  if (c.includes('airport') || c.includes('transit') || c.includes('transport')) return 2;
  if (c.includes('dining') || c.includes('restaurant') || c === 'meal') return 3;
  if (c.includes('worship') || c.includes('church')) return 4;
  return 5;
}

/** Category → mood for the location banner gradient. */
function categoryMood(category: string | null | undefined): Mood {
  const c = (category ?? '').toLowerCase();
  if (c.includes('venue') || c.includes('conference') || c === 'event') return 'sage';
  if (c.includes('hotel') || c.includes('accommodation') || c.includes('lodging')) return 'ink';
  if (c.includes('airport') || c.includes('transit') || c.includes('transport')) return 'sky';
  if (c.includes('dining') || c.includes('restaurant') || c === 'meal') return 'dawn';
  if (c.includes('worship') || c.includes('church')) return 'gold';
  return 'clay';
}

/** Label for the category sticker pill. */
function categoryLabel(category: string | null | undefined): string {
  const c = (category ?? '').trim();
  if (!c) return 'place';
  return c.toLowerCase();
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}

export function AlbumV2() {
  const { data: trip } = useActiveTrip();
  const { data: locations = [] } = useLocations(trip?.id);
  const { data: memories = [] } = useMemories(trip?.id);

  // Group memories by location_id; keep unassigned in an "unfiled" bucket
  const memoriesByLocation = useMemo(() => {
    const map = new Map<string, Memory[]>();
    locations.forEach(l => map.set(l.id, []));
    const unfiled: Memory[] = [];
    memories.forEach(m => {
      if (m.location_id && map.has(m.location_id)) {
        map.get(m.location_id)!.push(m);
      } else {
        unfiled.push(m);
      }
    });
    return { map, unfiled };
  }, [memories, locations]);

  // Sort locations by priority, then by name
  const orderedLocations = useMemo(() => {
    return [...locations].sort((a, b) => {
      const dp = categoryPriority(a.category) - categoryPriority(b.category);
      if (dp !== 0) return dp;
      return (a.name ?? '').localeCompare(b.name ?? '');
    });
  }, [locations]);

  const totalMemories = memories.length;
  const filledLocations = useMemo(
    () => orderedLocations.filter(l => (memoriesByLocation.map.get(l.id)?.length ?? 0) > 0).length,
    [orderedLocations, memoriesByLocation],
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
          <Stamp variant="outline" size="sm" rotate={2} style={{ marginBottom: 14 }}>
            the album · by place
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
            Sticker-book of places
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
            {orderedLocations.length === 0
              ? 'No pinned places yet — once locations are added, each becomes its own album page.'
              : totalMemories === 0
                ? `${orderedLocations.length} places pinned, no photos in yet. The stickers below are waiting for their first scan.`
                : `${totalMemories} ${totalMemories === 1 ? 'memory' : 'memories'} across ${filledLocations}/${orderedLocations.length} places.`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <StickerPill variant="ink" style={{ fontSize: 9, padding: '8px 10px' }}>
            {orderedLocations.length} {orderedLocations.length === 1 ? 'place' : 'places'}
          </StickerPill>
          <StickerPill variant="pen" style={{ fontSize: 9, padding: '8px 10px' }}>
            {totalMemories} memories
          </StickerPill>
          {totalMemories === 0 && (
            <MarginNote rotate={4} size={22} style={{ marginLeft: 4 }}>
              ✦ conference soon
            </MarginNote>
          )}
        </div>
      </header>

      {/* Location clusters */}
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(28px, 3.5vw, 44px)',
        }}
      >
        {orderedLocations.length === 0 && (
          <div style={{ padding: 40, color: 'var(--c-ink-muted)' }}>
            <MarginNote size={22}>no places pinned yet</MarginNote>
          </div>
        )}

        {orderedLocations.map((loc, idx) => (
          <LocationCluster
            key={loc.id}
            location={loc}
            memories={memoriesByLocation.map.get(loc.id) ?? []}
            index={idx}
          />
        ))}

        {/* Unfiled memories */}
        {memoriesByLocation.unfiled.length > 0 && (
          <UnfiledCluster memories={memoriesByLocation.unfiled} />
        )}
      </section>

      <style>{`
        .album-v2-row {
          display: flex;
          gap: 20px;
          overflow-x: auto;
          padding: 8px 4px 14px;
          scroll-snap-type: x mandatory;
        }
        .album-v2-row > * {
          scroll-snap-align: start;
          flex: 0 0 auto;
        }
        @media (max-width: 560px) {
          .album-v2-cluster { transform: none !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .album-v2-row { scroll-behavior: auto; }
        }
      `}</style>
    </main>
  );
}

function LocationCluster({
  location,
  memories,
  index,
}: {
  location: Location;
  memories: Memory[];
  index: number;
}) {
  const mood = categoryMood(location.category);
  const slotCount = Math.max(BASE_SLOTS, memories.length);
  const clusterRotate = index % 2 === 0 ? -0.5 : 0.5;
  const hasAny = memories.length > 0;

  return (
    <article
      className="album-v2-cluster collage-enter"
      style={{
        background: 'var(--c-paper)',
        boxShadow: 'var(--c-shadow)',
        padding: 'clamp(20px, 3vw, 32px)',
        position: 'relative',
        transform: `rotate(${clusterRotate}deg)`,
        animationDelay: `${index * 50}ms`,
      }}
    >
      <Tape
        position={index % 2 === 0 ? 'top-left' : 'top-right'}
        rotate={index % 2 === 0 ? -6 : 6}
        width={96}
      />

      {/* Header band */}
      <header
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          gap: 16,
          alignItems: 'end',
          marginBottom: 22,
          paddingBottom: 16,
          borderBottom: '1px dashed var(--c-line)',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: 10,
            }}
          >
            <StickerPill variant="ink" style={{ fontSize: 9, padding: '6px 10px' }}>
              {categoryLabel(location.category)}
            </StickerPill>
            {location.visited_at && (
              <Stamp variant="plain" size="sm" style={{ color: 'var(--c-success)' }}>
                ✓ visited
              </Stamp>
            )}
          </div>
          <h2
            style={{
              fontFamily: 'var(--c-font-display)',
              fontSize: 'clamp(18px, 2.4vw, 26px)',
              letterSpacing: '.04em',
              margin: 0,
              lineHeight: 1.1,
              color: 'var(--c-ink)',
              wordBreak: 'break-word',
            }}
          >
            {location.name}
          </h2>
          {location.address && (
            <p
              style={{
                fontFamily: 'var(--c-font-body)',
                fontStyle: 'italic',
                fontSize: 14,
                color: 'var(--c-ink-muted)',
                margin: '6px 0 0',
                lineHeight: 1.4,
              }}
            >
              {location.address}
            </p>
          )}
        </div>

        <div style={{ textAlign: 'right' }}>
          <span
            style={{
              fontFamily: 'var(--c-font-display)',
              fontSize: 10,
              letterSpacing: '.24em',
              textTransform: 'uppercase',
              color: hasAny ? 'var(--c-pen)' : 'var(--c-ink-muted)',
              display: 'block',
            }}
          >
            {hasAny ? `${memories.length} scan${memories.length === 1 ? '' : 's'}` : 'waiting'}
          </span>
        </div>
      </header>

      {/* Horizontal polaroid row */}
      {!hasAny ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            padding: '8px 4px',
            flexWrap: 'wrap',
          }}
        >
          <WaitingPolaroid mood={mood} />
          <MarginNote rotate={-3} size={22} style={{ maxWidth: 280 }}>
            first photo goes here ✦
          </MarginNote>
        </div>
      ) : (
        <div className="album-v2-row">
          {Array.from({ length: slotCount }).map((_, slotIdx) => {
            const memory = memories[slotIdx];
            const rot = [-3, 2, -2, 3, -1, 2][slotIdx % 6];
            if (!memory) {
              return (
                <WaitingPolaroid
                  key={`ghost-${slotIdx}`}
                  mood={mood}
                  rotate={rot}
                  compact
                />
              );
            }
            const hasMedia = (memory.media?.length ?? 0) > 0;
            return (
              <PolaroidCard
                key={memory.id}
                mood={mood}
                rotate={rot}
                size="sm"
                entrance
                entranceDelayMs={slotIdx * 40}
                tape={slotIdx === 0}
                overline={hasMedia ? '📷 photo' : 'note'}
                caption={truncate(memory.title ?? memory.note ?? 'moment', 26)}
              />
            );
          })}
        </div>
      )}
    </article>
  );
}

function UnfiledCluster({ memories }: { memories: Memory[] }) {
  return (
    <article
      style={{
        background: 'var(--c-paper)',
        boxShadow: 'var(--c-shadow)',
        padding: 'clamp(20px, 3vw, 32px)',
        position: 'relative',
      }}
    >
      <Tape position="top" rotate={-3} width={96} />
      <div style={{ marginBottom: 16 }}>
        <span
          style={{
            fontFamily: 'var(--c-font-display)',
            fontSize: 12,
            letterSpacing: '.24em',
            textTransform: 'uppercase',
            color: 'var(--c-ink)',
          }}
        >
          ✦ unfiled
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
          memories without a pinned place yet
        </p>
      </div>
      <div className="album-v2-row">
        {memories.map((m, i) => {
          const hasMedia = (m.media?.length ?? 0) > 0;
          return (
            <PolaroidCard
              key={m.id}
              mood="clay"
              rotate={i % 2 === 0 ? -2 : 2}
              size="sm"
              entrance
              entranceDelayMs={i * 40}
              overline={hasMedia ? '📷 photo' : 'note'}
              caption={truncate(m.title ?? m.note ?? 'moment', 26)}
            />
          );
        })}
      </div>
    </article>
  );
}

/** The "waiting" polaroid — outlined, tinted, one per location cluster when empty. */
function WaitingPolaroid({
  mood,
  rotate = -2,
  compact = false,
}: {
  mood: Mood;
  rotate?: number;
  compact?: boolean;
}) {
  return (
    <div
      className="collage-enter"
      style={{
        position: 'relative',
        width: compact ? 160 : 200,
        background: 'var(--c-paper)',
        padding: compact ? '14px 14px 36px' : '16px 16px 44px',
        boxShadow: 'var(--c-shadow-sm)',
        transform: `rotate(${rotate}deg)`,
        border: '1.5px dashed var(--c-line)',
        opacity: 0.78,
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
          background: MOOD_TINT_V2[mood],
          opacity: 0.6,
          border: '1px dashed rgba(29,29,27,0.2)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: compact ? 14 : 16,
          right: compact ? 14 : 16,
          bottom: 12,
          textAlign: 'center',
          fontFamily: 'var(--c-font-body)',
          fontStyle: 'italic',
          fontSize: compact ? 12 : 13,
          color: 'var(--c-ink-muted)',
          lineHeight: 1.2,
        }}
      >
        waiting
      </div>
    </div>
  );
}

// Reduced-saturation mood tints for waiting slots.
const MOOD_TINT_V2: Record<Mood, string> = {
  sage: 'linear-gradient(155deg, #b9c9a5 0%, #d6dcb9 60%, #ece5c9 100%)',
  gold: 'linear-gradient(160deg, #c9bb97 0%, #e0ceaa 50%, #ece0c4 100%)',
  sky:  'linear-gradient(140deg, #a6bcd3 0%, #c8d7e5 60%, #e4ecf3 100%)',
  dawn: 'linear-gradient(180deg, #f6d0b3 0%, #f5d9cc 60%, #fce4d6 100%)',
  clay: 'linear-gradient(200deg, #d3b19b 0%, #e3c4ac 50%, #f1dcc3 100%)',
  ink:  'linear-gradient(135deg, #8b8680 0%, #a6a199 55%, #c2bcb2 100%)',
};
