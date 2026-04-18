import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useActiveTrip, useTripDays } from '@/hooks/use-trip';
import { useDayItems } from '@/hooks/use-itinerary';
import { Stamp } from '../../ui/Stamp';
import { StickerPill } from '../../ui/StickerPill';
import { MarginNote } from '../../ui/MarginNote';
import { Tape } from '../../ui/Tape';

/**
 * Day V3 — Schedule Pages (stacked sheets).
 * No polaroids. Each item is a paper page with tape top, laid out in a fanned column
 * with slight rotation and offset. Reads like flipping through a CPE program book.
 */
function fmtTime(iso?: string | null) {
  if (!iso) return '';
  const [h, m] = iso.split(':');
  const hr = parseInt(h, 10);
  const ampm = hr >= 12 ? 'pm' : 'am';
  const hr12 = ((hr + 11) % 12) + 1;
  return `${hr12}:${m} ${ampm}`;
}

export function DayV3() {
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

  return (
    <main
      style={{
        padding: 'clamp(32px, 4vw, 56px) clamp(24px, 5vw, 64px) 120px',
        minHeight: 'calc(100vh - 120px)',
      }}
    >
      <header
        style={{
          textAlign: 'center',
          marginBottom: 48,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Stamp variant="outline" size="sm" rotate={-3}>program · day</Stamp>
        <h1
          style={{
            fontFamily: 'var(--c-font-body)',
            fontSize: 'clamp(32px, 4.5vw, 52px)',
            fontWeight: 500,
            margin: 0,
            lineHeight: 1.05,
            maxWidth: '22ch',
          }}
        >
          {selectedDay?.title ?? dateLabel ?? 'Day'}
        </h1>
        <p style={{ fontFamily: 'var(--c-font-body)', fontStyle: 'italic', color: 'var(--c-ink-muted)', margin: 0, fontSize: 16 }}>
          {dateLabel}{trip?.location_name ? ` · ${trip.location_name}` : ''}
        </p>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
          {days.map((d, i) => (
            <StickerPill
              key={d.id}
              variant={d.id === selectedDayId ? 'ink' : 'pen'}
              style={{ opacity: d.id === selectedDayId ? 1 : 0.55, fontSize: 9, padding: '7px 10px' }}
            >
              Day {i + 1}
            </StickerPill>
          ))}
        </div>
      </header>

      {items.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--c-ink-muted)' }}>
          <MarginNote size={22}>nothing scheduled yet</MarginNote>
        </div>
      )}

      {/* Fanned stack of sheets */}
      <ul
        className="sheet-stack"
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          maxWidth: 680,
        }}
      >
        {items.map((item, i) => {
          const rot = ((i % 2 === 0 ? -1 : 1) * (0.6 + (i % 3) * 0.4)).toFixed(2);
          return (
            <li
              key={item.id}
              className="collage-enter"
              style={{
                width: '100%',
                maxWidth: 640,
                background: 'var(--c-paper)',
                boxShadow: 'var(--c-shadow)',
                padding: '28px 32px 24px',
                position: 'relative',
                transform: `rotate(${rot}deg)`,
                ['--c-rot' as any]: `${rot}deg`,
                animationDelay: `${i * 60}ms`,
              }}
            >
              <Tape position="top-left" rotate={-6} width={72} />
              <Tape position="top-right" rotate={8} width={72} />

              {/* Sheet header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  alignItems: 'baseline',
                  gap: 20,
                  paddingBottom: 12,
                  marginBottom: 14,
                  borderBottom: '1.5px solid var(--c-ink)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--c-font-display)',
                    fontSize: 11,
                    letterSpacing: '.22em',
                    color: 'var(--c-ink)',
                  }}
                >
                  #{String(i + 1).padStart(2, '0')}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--c-font-display)',
                    fontSize: 16,
                    letterSpacing: '.12em',
                    color: 'var(--c-pen)',
                  }}
                >
                  {fmtTime(item.start_time) || '—'}
                  {item.end_time && ` — ${fmtTime(item.end_time)}`}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--c-font-display)',
                    fontSize: 10,
                    letterSpacing: '.22em',
                    textTransform: 'uppercase',
                    color: 'var(--c-ink-muted)',
                  }}
                >
                  {item.track ? `Track ${item.track}` : item.category}
                </span>
              </div>

              {/* Title */}
              <h3
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontSize: 22,
                  fontWeight: 500,
                  margin: '0 0 6px',
                  lineHeight: 1.3,
                  color: 'var(--c-ink)',
                }}
              >
                {item.title}
              </h3>

              {/* Speaker + location */}
              {(item.speaker || item.location?.name) && (
                <div
                  style={{
                    display: 'flex',
                    gap: 18,
                    fontFamily: 'var(--c-font-body)',
                    fontStyle: 'italic',
                    fontSize: 14,
                    color: 'var(--c-ink-muted)',
                    flexWrap: 'wrap',
                  }}
                >
                  {item.speaker && <span>{item.speaker.split(/[,(]/)[0].trim()}</span>}
                  {item.location?.name && <span>⌾ {item.location.name}</span>}
                </div>
              )}

              {/* Notes as margin scrawl */}
              {item.notes && (
                <MarginNote rotate={-1} size={18} style={{ display: 'block', marginTop: 12, maxWidth: '48ch' }}>
                  {truncate(item.notes, 120)}
                </MarginNote>
              )}

              {/* Page number */}
              <span
                style={{
                  position: 'absolute',
                  bottom: 10,
                  right: 18,
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 9,
                  letterSpacing: '.3em',
                  color: 'var(--c-ink-muted)',
                }}
              >
                — {String(i + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')} —
              </span>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}
