import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useActiveTrip, useTripDays } from '@/hooks/use-trip';
import { useDayItems } from '@/hooks/use-itinerary';
import { Stamp } from '../../ui/Stamp';
import { StickerPill } from '../../ui/StickerPill';
import { PolaroidCard, resolveMood } from '../../ui/PolaroidCard';
import { MarginNote } from '../../ui/MarginNote';
import type { ItineraryItem } from '@/types/trip';

function fmtItemTime(item: ItineraryItem) {
  if (!item.start_time) return '';
  const [h, m] = item.start_time.split(':');
  const hr = parseInt(h, 10);
  const ampm = hr >= 12 ? 'pm' : 'am';
  const hr12 = ((hr + 11) % 12) + 1;
  return `${hr12}:${m} ${ampm}`;
}

export function DayV1() {
  const { dayId } = useParams<{ dayId?: string }>();
  const { data: trip } = useActiveTrip();
  const { data: days = [] } = useTripDays(trip?.id);

  // Default to the first day with items (usually opening day) if no id provided
  const selectedDayId = dayId ?? days[0]?.id;
  const { data: items = [], isLoading } = useDayItems(selectedDayId);

  const selectedDay = useMemo(
    () => days.find(d => d.id === selectedDayId) ?? days[0],
    [days, selectedDayId],
  );

  const dateLabel = useMemo(() => {
    if (!selectedDay?.date) return '';
    const d = new Date(selectedDay.date);
    return d.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, [selectedDay]);

  return (
    <main
      style={{
        minHeight: '100vh',
        minHeight: '100dvh',
        padding: 'clamp(32px, 5vw, 64px) clamp(24px, 5vw, 72px) 80px',
        position: 'relative',
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 24, flexWrap: 'wrap', marginBottom: 32 }}>
        <div>
          <Stamp variant="outline" size="sm" rotate={-2} style={{ marginBottom: 16 }}>
            the day · schedule
          </Stamp>
          <h1
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 'clamp(32px, 4.5vw, 52px)',
              fontWeight: 500,
              letterSpacing: '-.01em',
              margin: 0,
              lineHeight: 1.05,
              maxWidth: '24ch',
            }}
          >
            {selectedDay?.title ?? dateLabel ?? 'Day'}
          </h1>
          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontStyle: 'italic',
              color: 'var(--c-ink-muted)',
              margin: '8px 0 0',
              fontSize: 17,
            }}
          >
            {dateLabel}
            {trip?.location_name ? ` · ${trip.location_name}` : ''}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', maxWidth: 420 }}>
          {days.map((d, i) => (
            <StickerPill
              key={d.id}
              variant={d.id === selectedDayId ? 'ink' : 'pen'}
              style={{
                opacity: d.id === selectedDayId ? 1 : 0.55,
                fontSize: 9,
                padding: '8px 10px',
              }}
            >
              Day {i + 1}
            </StickerPill>
          ))}
        </div>
      </header>

      {isLoading && (
        <div style={{ color: 'var(--c-ink-muted)', padding: 40 }}>Loading schedule…</div>
      )}

      {!isLoading && items.length === 0 && (
        <div style={{ padding: 40 }}>
          <MarginNote size={24}>nothing on the schedule yet</MarginNote>
        </div>
      )}

      {/* Timeline — grid rows: [time | spine+dot | polaroid | text] */}
      <section className="collage-timeline" style={{ paddingBottom: 40 }}>
        {items.map((item, i) => {
          const rot = i % 2 === 0 ? -2 : 2;
          const isFirst = i === 0;
          const isLast = i === items.length - 1;
          return (
            <div key={item.id} className="collage-timeline-row">
              {/* Time column */}
              <div className="collage-time">
                {fmtItemTime(item) || '—'}
              </div>

              {/* Spine column (vertical line + dot) */}
              <div className="collage-spine">
                <span
                  aria-hidden
                  className="collage-spine-line"
                  style={{
                    top: isFirst ? 22 : 0,
                    bottom: isLast ? 'auto' : 0,
                    height: isLast ? 22 : 'auto',
                  }}
                />
                <span aria-hidden className="collage-spine-dot" />
              </div>

              {/* Polaroid */}
              <div className="collage-row-polaroid">
                <PolaroidCard
                  mood={resolveMood(item.category, item.start_time)}
                  rotate={rot}
                  size="sm"
                  entrance
                  entranceDelayMs={i * 60}
                  overline={item.track ? `Track ${item.track}` : item.category}
                  caption={item.category === 'worship' ? '✝ worship' : item.speaker ? item.speaker.split(/[,(]/)[0].trim() : ''}
                />
              </div>

              {/* Text */}
              <div className="collage-row-text">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                  {item.track && (
                    <StickerPill variant="pen" style={{ fontSize: 9, padding: '6px 10px' }}>
                      Track {item.track}
                    </StickerPill>
                  )}
                  {item.category && item.category !== 'activity' && (
                    <Stamp variant="plain" size="sm">
                      {item.category}
                    </Stamp>
                  )}
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--c-font-body)',
                    fontSize: 22,
                    fontWeight: 500,
                    margin: '0 0 6px',
                    lineHeight: 1.25,
                    color: 'var(--c-ink)',
                  }}
                >
                  {item.title}
                </h3>
                {item.speaker && (
                  <p
                    style={{
                      fontFamily: 'var(--c-font-body)',
                      fontStyle: 'italic',
                      fontSize: 15,
                      color: 'var(--c-ink-muted)',
                      margin: '0 0 6px',
                      lineHeight: 1.45,
                    }}
                  >
                    {item.speaker}
                  </p>
                )}
                {item.location?.name && (
                  <p style={{ fontSize: 13, color: 'var(--c-ink-muted)', margin: '4px 0 0', letterSpacing: '.02em' }}>
                    ⌾ {item.location.name}
                  </p>
                )}
                {item.notes && (
                  <MarginNote rotate={1} size={18} style={{ marginTop: 10, display: 'inline-block', maxWidth: '52ch' }}>
                    {truncate(item.notes, 120)}
                  </MarginNote>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <style>{`
        .collage-timeline-row {
          display: grid;
          grid-template-columns: 72px 28px minmax(200px, auto) minmax(0, 1fr);
          align-items: start;
          column-gap: 20px;
          margin-bottom: 28px;
        }
        .collage-time {
          font-family: var(--c-font-display);
          font-size: 10px;
          letter-spacing: .2em;
          color: var(--c-ink);
          text-align: right;
          padding-top: 20px;
          white-space: nowrap;
        }
        .collage-spine {
          position: relative;
          align-self: stretch;
          min-height: 40px;
        }
        .collage-spine-line {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 2px;
          background: var(--c-pen);
          opacity: 0.35;
        }
        .collage-spine-dot {
          position: absolute;
          left: 50%;
          top: 20px;
          transform: translateX(-50%);
          width: 14px;
          height: 14px;
          border-radius: 999px;
          background: var(--c-tape);
          border: 2px solid var(--c-ink);
          z-index: 1;
        }
        .collage-row-polaroid { padding-top: 4px; }
        .collage-row-text { min-width: 0; max-width: 560px; padding-top: 8px; }

        @media (max-width: 860px) {
          .collage-timeline-row {
            grid-template-columns: 56px 20px 1fr;
            row-gap: 8px;
          }
          .collage-time { padding-top: 12px; font-size: 9px; }
          .collage-row-polaroid { grid-column: 1 / -1; display: flex; justify-content: center; }
          .collage-row-text { grid-column: 3; }
        }
      `}</style>
    </main>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}
