import { useMemo } from 'react';
import { useActiveTrip, useTripDays, getTripMode, getCurrentDayIndex } from '@/hooks/use-trip';
import { useItineraryItems } from '@/hooks/use-itinerary';
import { Stamp } from '../../ui/Stamp';
import { StickerPill } from '../../ui/StickerPill';
import { PolaroidCard, resolveMood } from '../../ui/PolaroidCard';
import { MarginNote } from '../../ui/MarginNote';
import { Tape } from '../../ui/Tape';
import type { ItineraryItem } from '@/types/trip';

/**
 * Dashboard V3 — Zine Spread.
 * Two-column editorial spread with a vertical gutter.
 * LEFT: big polaroid, date stamp, location label, handwritten caption.
 * RIGHT: numbered upcoming list — time in display face, title, small tags.
 */
function fmtTime(iso?: string | null) {
  if (!iso) return '';
  const [h, m] = iso.split(':');
  const hr = parseInt(h, 10);
  const ampm = hr >= 12 ? 'pm' : 'am';
  const hr12 = ((hr + 11) % 12) + 1;
  return `${hr12}:${m} ${ampm}`;
}

export function DashboardV3() {
  const { data: trip } = useActiveTrip();
  const { data: days = [] } = useTripDays(trip?.id);
  const { data: allItems = [] } = useItineraryItems(trip?.id);

  const mode = trip ? getTripMode(trip) : 'pre';
  const currentDay = trip ? days[getCurrentDayIndex(trip, days, mode)] : undefined;

  const hero = useMemo<ItineraryItem | undefined>(() => {
    return (
      allItems.find(i => i.category === 'worship' && i.start_time) ??
      allItems.find(i => i.category === 'workshop' && i.speaker) ??
      allItems.find(i => i.start_time)
    );
  }, [allItems]);

  const upcoming = useMemo<ItineraryItem[]>(() => {
    return allItems.filter(i => i.start_time).slice(0, 6);
  }, [allItems]);

  if (!trip) return <div style={{ padding: 80 }}>Loading…</div>;

  return (
    <main
      style={{
        minHeight: 'calc(100vh - 120px)',
        padding: 'clamp(32px, 4vw, 64px) 0',
        display: 'grid',
        placeItems: 'start center',
      }}
    >
      <div
        className="zine-spread"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          maxWidth: 1200,
          width: '100%',
          background: 'var(--c-paper)',
          boxShadow: 'var(--c-shadow)',
          position: 'relative',
        }}
      >
        {/* Gutter */}
        <div
          aria-hidden
          className="zine-gutter"
          style={{
            position: 'absolute',
            left: '50%',
            top: 48,
            bottom: 48,
            width: 1,
            background: 'var(--c-line)',
            transform: 'translateX(-50%)',
          }}
        />

        {/* LEFT page */}
        <section
          className="zine-page"
          style={{
            padding: 'clamp(32px, 4vw, 56px)',
            position: 'relative',
            minHeight: 540,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 24,
              fontFamily: 'var(--c-font-display)',
              fontSize: 10,
              letterSpacing: '.3em',
              textTransform: 'uppercase',
              color: 'var(--c-ink-muted)',
            }}
          >
            <span>folio ONE</span>
            <span>sankofa · 2026</span>
          </div>

          <Stamp variant="outline" size="sm" rotate={-2} style={{ marginBottom: 24 }}>
            the days ahead
          </Stamp>

          <h1
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 'clamp(32px, 4vw, 52px)',
              fontWeight: 500,
              letterSpacing: '-.01em',
              margin: '0 0 8px',
              lineHeight: 1.05,
              maxWidth: '14ch',
            }}
          >
            {trip.title.replace(/\s*[–-].*$/, '')}
          </h1>
          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontStyle: 'italic',
              color: 'var(--c-ink-muted)',
              margin: '0 0 36px',
              fontSize: 17,
            }}
          >
            {trip.location_name ?? 'somewhere'} · {currentDay?.title ?? 'pre-trip'}
          </p>

          {hero && (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <PolaroidCard
                mood={resolveMood(hero.category, hero.start_time)}
                rotate={-3}
                size="lg"
                entrance
                tape
                caption={
                  hero.speaker
                    ? `${truncate(hero.title, 26)} — ${hero.speaker.split(/[,(]/)[0].trim()}`
                    : truncate(hero.title, 36)
                }
                overline={hero.start_time?.slice(0, 5) ?? hero.category}
              />
              <MarginNote
                rotate={-8}
                size={22}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -24,
                  background: 'var(--c-creme)',
                  padding: '2px 6px',
                }}
              >
                the one I'm waiting for ✦
              </MarginNote>
            </div>
          )}

          <MarginNote rotate={1} size={20} style={{ display: 'block', marginTop: 28, maxWidth: '32ch' }}>
            A week of listening. Four days in a room with people who have been at this longer than I have.
          </MarginNote>
        </section>

        {/* RIGHT page */}
        <section
          className="zine-page"
          style={{
            padding: 'clamp(32px, 4vw, 56px)',
            position: 'relative',
            minHeight: 540,
          }}
        >
          <Tape position="top-right" rotate={10} width={64} />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 24,
              fontFamily: 'var(--c-font-display)',
              fontSize: 10,
              letterSpacing: '.3em',
              textTransform: 'uppercase',
              color: 'var(--c-ink-muted)',
            }}
          >
            <span>folio TWO</span>
            <span>{upcoming.length} coming up</span>
          </div>

          <Stamp variant="ink" size="sm" rotate={3} style={{ marginBottom: 24 }}>
            on the schedule
          </Stamp>

          <ol
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}
          >
            {upcoming.map((item, i) => (
              <li
                key={item.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 90px 1fr',
                  alignItems: 'baseline',
                  gap: 16,
                  borderBottom: '1px dashed var(--c-line)',
                  paddingBottom: 14,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--c-font-display)',
                    fontSize: 14,
                    color: 'var(--c-pen)',
                    letterSpacing: 0,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--c-font-display)',
                    fontSize: 11,
                    color: 'var(--c-ink)',
                    letterSpacing: '.16em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {fmtTime(item.start_time)}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--c-font-body)',
                      fontSize: 16,
                      color: 'var(--c-ink)',
                      lineHeight: 1.35,
                      marginBottom: 2,
                    }}
                  >
                    {item.title}
                  </div>
                  {item.speaker && (
                    <div
                      style={{
                        fontFamily: 'var(--c-font-body)',
                        fontStyle: 'italic',
                        fontSize: 13,
                        color: 'var(--c-ink-muted)',
                        lineHeight: 1.35,
                      }}
                    >
                      {item.speaker.split(/[,(]/)[0].trim()}
                      {item.track ? ` · Track ${item.track}` : ''}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap' }}>
            <StickerPill variant="ink">open full schedule →</StickerPill>
          </div>
        </section>

        {/* Page number footer */}
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: 48,
            right: 48,
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'var(--c-font-display)',
            fontSize: 10,
            letterSpacing: '.3em',
            color: 'var(--c-ink-muted)',
          }}
        >
          <span>— 01 —</span>
          <span>— 02 —</span>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .zine-spread { grid-template-columns: 1fr !important; }
          .zine-gutter { display: none; }
          .zine-page:first-of-type { border-bottom: 1px solid var(--c-line); }
        }
      `}</style>
    </main>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}
