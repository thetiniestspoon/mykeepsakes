import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useActiveTrip, useTripDays } from '@/hooks/use-trip';
import { useDayItems } from '@/hooks/use-itinerary';
import { Stamp } from '../../ui/Stamp';
import { StickerPill } from '../../ui/StickerPill';
import { PolaroidCard, resolveMood } from '../../ui/PolaroidCard';
import { MarginNote } from '../../ui/MarginNote';
import { Tape } from '../../ui/Tape';
import type { ItineraryItem } from '@/types/trip';

/**
 * Day V2 — Session Blocks.
 * Items grouped by time-of-day (Morning / Midday / Afternoon / Evening).
 * Each block is a taped-envelope header; items underneath as compact receipt cards.
 * Day-at-a-glance, less vertical scroll.
 */
type BlockName = 'morning' | 'midday' | 'afternoon' | 'evening';
const BLOCKS: { key: BlockName; label: string; range: string; stamp: string; fromH: number; toH: number }[] = [
  { key: 'morning',   label: 'Morning',   range: 'before 11',  stamp: '☀ MORNING',    fromH: 0,  toH: 11 },
  { key: 'midday',    label: 'Midday',    range: '11 — 2',     stamp: '✦ MIDDAY',     fromH: 11, toH: 14 },
  { key: 'afternoon', label: 'Afternoon', range: '2 — 5',      stamp: '◈ AFTERNOON',  fromH: 14, toH: 17 },
  { key: 'evening',   label: 'Evening',   range: 'after 5',    stamp: '◐ EVENING',    fromH: 17, toH: 24 },
];

function timeToBlock(iso?: string | null): BlockName {
  if (!iso) return 'midday';
  const h = parseInt(iso.slice(0, 2), 10);
  const block = BLOCKS.find(b => h >= b.fromH && h < b.toH);
  return block?.key ?? 'midday';
}

function fmtTime(iso?: string | null) {
  if (!iso) return '—';
  const [h, m] = iso.split(':');
  const hr = parseInt(h, 10);
  const ampm = hr >= 12 ? 'pm' : 'am';
  const hr12 = ((hr + 11) % 12) + 1;
  return `${hr12}:${m}${ampm}`;
}

export function DayV2() {
  const { dayId } = useParams<{ dayId?: string }>();
  const { data: trip } = useActiveTrip();
  const { data: days = [] } = useTripDays(trip?.id);
  const selectedDayId = dayId ?? days[0]?.id;
  const { data: items = [] } = useDayItems(selectedDayId);

  const selectedDay = useMemo(
    () => days.find(d => d.id === selectedDayId) ?? days[0],
    [days, selectedDayId],
  );

  const dateLabel = useMemo(() => {
    if (!selectedDay?.date) return '';
    return new Date(selectedDay.date).toLocaleString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    });
  }, [selectedDay]);

  const grouped = useMemo(() => {
    const map = new Map<BlockName, ItineraryItem[]>();
    BLOCKS.forEach(b => map.set(b.key, []));
    items.forEach(item => {
      const key = timeToBlock(item.start_time);
      map.get(key)!.push(item);
    });
    return map;
  }, [items]);

  return (
    <main
      style={{
        padding: 'clamp(32px, 4vw, 56px) clamp(24px, 5vw, 64px) 80px',
        minHeight: 'calc(100vh - 120px)',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, marginBottom: 36 }}>
        <div>
          <Stamp variant="outline" size="sm" rotate={-2} style={{ marginBottom: 14 }}>the day · by block</Stamp>
          <h1 style={{ fontFamily: 'var(--c-font-body)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 500, margin: 0, lineHeight: 1.05 }}>
            {selectedDay?.title ?? dateLabel ?? 'Day'}
          </h1>
          <p style={{ fontFamily: 'var(--c-font-body)', fontStyle: 'italic', color: 'var(--c-ink-muted)', margin: '6px 0 0', fontSize: 16 }}>
            {dateLabel}{trip?.location_name ? ` · ${trip.location_name}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 420 }}>
          {days.map((d, i) => (
            <StickerPill
              key={d.id}
              variant={d.id === selectedDayId ? 'ink' : 'pen'}
              style={{ opacity: d.id === selectedDayId ? 1 : 0.55, fontSize: 9, padding: '8px 10px' }}
            >
              Day {i + 1}
            </StickerPill>
          ))}
        </div>
      </header>

      <div
        className="blocks-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 32,
        }}
      >
        {BLOCKS.map(block => {
          const blockItems = grouped.get(block.key) ?? [];
          const hasAny = blockItems.length > 0;
          return (
            <section
              key={block.key}
              style={{
                background: 'var(--c-paper)',
                boxShadow: 'var(--c-shadow)',
                padding: '28px 24px 22px',
                position: 'relative',
                opacity: hasAny ? 1 : 0.55,
              }}
            >
              <Tape position="top" rotate={block.key === 'morning' ? -4 : block.key === 'midday' ? 2 : block.key === 'afternoon' ? -2 : 4} />

              {/* Block header */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20, gap: 8 }}>
                <span
                  style={{
                    fontFamily: 'var(--c-font-display)',
                    fontSize: 14,
                    letterSpacing: '.2em',
                    color: 'var(--c-ink)',
                  }}
                >
                  {block.stamp}
                </span>
                <span style={{ fontFamily: 'var(--c-font-body)', fontStyle: 'italic', color: 'var(--c-ink-muted)', fontSize: 12 }}>
                  {block.range}
                </span>
              </div>

              {!hasAny && (
                <MarginNote rotate={-1} size={18} style={{ display: 'block' }}>
                  (nothing here)
                </MarginNote>
              )}

              {/* Item receipts */}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {blockItems.map((item, i) => {
                  const mood = resolveMood(item.category, item.start_time);
                  return (
                    <li
                      key={item.id}
                      className="collage-enter"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '54px 1fr',
                        gap: 12,
                        paddingBottom: 12,
                        borderBottom: i === blockItems.length - 1 ? 'none' : '1px dashed var(--c-line)',
                        animationDelay: `${i * 50}ms`,
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span
                          aria-hidden
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 'var(--c-r-sm)',
                            background: MOOD_PREVIEW[mood],
                            boxShadow: 'var(--c-shadow-sm)',
                            border: '1.5px solid var(--c-ink)',
                          }}
                        />
                        <span
                          style={{
                            fontFamily: 'var(--c-font-display)',
                            fontSize: 9,
                            letterSpacing: '.16em',
                            color: 'var(--c-ink)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {fmtTime(item.start_time)}
                        </span>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        {item.track && (
                          <span
                            style={{
                              display: 'inline-block',
                              fontFamily: 'var(--c-font-display)',
                              fontSize: 9,
                              letterSpacing: '.2em',
                              textTransform: 'uppercase',
                              color: 'var(--c-pen)',
                              marginRight: 8,
                            }}
                          >
                            Track {item.track}
                          </span>
                        )}
                        <div style={{ fontFamily: 'var(--c-font-body)', fontSize: 15, color: 'var(--c-ink)', lineHeight: 1.3, fontWeight: 500 }}>
                          {item.title}
                        </div>
                        {item.speaker && (
                          <div style={{ fontFamily: 'var(--c-font-body)', fontStyle: 'italic', fontSize: 13, color: 'var(--c-ink-muted)', marginTop: 2 }}>
                            {item.speaker.split(/[,(]/)[0].trim()}
                          </div>
                        )}
                        {item.location?.name && (
                          <div style={{ fontSize: 11, color: 'var(--c-ink-muted)', marginTop: 4 }}>⌾ {item.location.name}</div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}

// Mood → 48x48 preview square gradient (reduced version of PolaroidCard gradients)
const MOOD_PREVIEW: Record<ReturnType<typeof resolveMood>, string> = {
  sage: 'linear-gradient(155deg, #4a6b3e 0%, #8ba66e 55%, #d6c084 100%)',
  gold: 'linear-gradient(160deg, #8E7E59 0%, #C2A87A 50%, #D9BE8C 100%)',
  sky:  'linear-gradient(140deg, #5b7fa8 0%, #8aaecc 60%, #d6e3ee 100%)',
  dawn: 'linear-gradient(180deg, #f8c291 0%, #f3c9b9 60%, #fde0cf 100%)',
  clay: 'linear-gradient(200deg, #b0785a 0%, #d7a379 50%, #f0d3ae 100%)',
  ink:  'linear-gradient(135deg, #2A2724 0%, #4a4338 55%, #7a7160 100%)',
};
