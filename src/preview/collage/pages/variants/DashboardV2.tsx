import { useMemo } from 'react';
import { useActiveTrip, useTripDays } from '@/hooks/use-trip';
import { useItineraryItems } from '@/hooks/use-itinerary';
import { useConnections } from '@/hooks/use-connections';
import { Stamp } from '../../ui/Stamp';
import { StickerPill } from '../../ui/StickerPill';
import { PolaroidCard, resolveMood } from '../../ui/PolaroidCard';
import { MarginNote } from '../../ui/MarginNote';
import type { ItineraryItem } from '@/types/trip';

/**
 * Dashboard V2 — Center Altar.
 * Symmetrical. Hero words centered over a fanned polaroid row, larger middle card.
 * Stats strip running under the polaroids as a stamped ticket strip.
 * Reads more formal / ceremonial — good for CPE weight.
 */
function fmtDateRange(startISO: string, endISO: string) {
  const s = new Date(startISO);
  const e = new Date(endISO);
  const monthLong = s.toLocaleString('en-US', { month: 'long' });
  const monthLongEnd = e.toLocaleString('en-US', { month: 'long' });
  const sameMonth = s.getMonth() === e.getMonth();
  const year = e.getFullYear();
  return sameMonth
    ? `${monthLong} ${s.getDate()}\u2013${e.getDate()}, ${year}`
    : `${monthLong} ${s.getDate()} \u2013 ${monthLongEnd} ${e.getDate()}, ${year}`;
}

export function DashboardV2() {
  const { data: trip } = useActiveTrip();
  const { data: days = [] } = useTripDays(trip?.id);
  const { data: allItems = [] } = useItineraryItems(trip?.id);
  const { data: people = [] } = useConnections(trip?.id);

  const featured = useMemo<ItineraryItem[]>(() => {
    return allItems.filter(i => i.start_time).slice(0, 3);
  }, [allItems]);

  if (!trip) return <div style={{ padding: 80 }}>Loading…</div>;

  const [left, center, right] = featured;

  return (
    <main
      style={{
        minHeight: 'calc(100vh - 120px)',
        padding: 'clamp(32px, 5vw, 72px) clamp(24px, 5vw, 64px)',
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        position: 'relative',
      }}
    >
      <MarginNote
        rotate={-8}
        size={22}
        style={{ position: 'absolute', top: 36, left: 40 }}
      >
        beacon uu · chaplaincy
      </MarginNote>
      <MarginNote
        rotate={6}
        size={22}
        style={{ position: 'absolute', top: 36, right: 40 }}
      >
        chicago · april
      </MarginNote>

      <div style={{ maxWidth: 980, width: '100%' }}>
        {/* Hero */}
        <Stamp variant="outline" size="sm" rotate={-3} style={{ marginBottom: 20 }}>
          sankofa cpe · vol · 01
        </Stamp>

        <h1
          style={{
            fontFamily: 'var(--c-font-display)',
            fontSize: 'clamp(44px, 7vw, 96px)',
            lineHeight: 0.95,
            letterSpacing: '-.02em',
            margin: 0,
            maxWidth: '14ch',
            marginInline: 'auto',
          }}
        >
          <span style={{ color: 'var(--c-ink)' }}>Go back &amp; </span>
          <span style={{ color: 'var(--c-pen)' }}>fetch</span>
          <span style={{ color: 'var(--c-ink)' }}> it.</span>
        </h1>

        <p
          style={{
            fontFamily: 'var(--c-font-body)',
            fontStyle: 'italic',
            fontSize: 'clamp(16px, 1.25vw, 20px)',
            color: 'var(--c-ink-muted)',
            margin: '18px auto 0',
            maxWidth: '44ch',
            lineHeight: 1.5,
          }}
        >
          {trip.title} — {fmtDateRange(trip.start_date, trip.end_date)}
          {trip.location_name ? ` · ${trip.location_name}` : ''}
        </p>

        {/* Fanned polaroid row */}
        <div
          className="altar-row"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            gap: 'clamp(8px, 2vw, 28px)',
            marginTop: 56,
            marginBottom: 40,
            minHeight: 320,
            position: 'relative',
          }}
        >
          {left && (
            <PolaroidCard
              mood={resolveMood(left.category, left.start_time)}
              rotate={-8}
              size="sm"
              entrance
              entranceDelayMs={0}
              tape
              caption={truncate(left.title, 28)}
              overline={left.start_time?.slice(0, 5) ?? ''}
              style={{ marginBottom: 12 }}
            />
          )}
          {center && (
            <PolaroidCard
              mood={resolveMood(center.category, center.start_time)}
              rotate={2}
              size="lg"
              entrance
              entranceDelayMs={80}
              tape
              caption={
                center.speaker
                  ? `${truncate(center.title, 24)} — ${center.speaker.split(/[,(]/)[0].trim()}`
                  : truncate(center.title, 32)
              }
              overline={center.start_time?.slice(0, 5) ?? ''}
              style={{ zIndex: 2 }}
            />
          )}
          {right && (
            <PolaroidCard
              mood={resolveMood(right.category, right.start_time)}
              rotate={7}
              size="sm"
              entrance
              entranceDelayMs={160}
              tape
              caption={truncate(right.title, 28)}
              overline={right.start_time?.slice(0, 5) ?? ''}
              style={{ marginBottom: 12 }}
            />
          )}
        </div>

        {/* Ticket strip */}
        <div
          className="altar-ticket"
          style={{
            display: 'inline-grid',
            gridTemplateColumns: 'auto 1px auto 1px auto 1px auto',
            gap: 'clamp(16px, 3vw, 40px)',
            alignItems: 'center',
            padding: '18px clamp(20px, 4vw, 44px)',
            background: 'var(--c-paper)',
            boxShadow: 'var(--c-shadow-sm)',
            borderTop: '2px dashed var(--c-ink)',
            borderBottom: '2px dashed var(--c-ink)',
            fontFamily: 'var(--c-font-display)',
            fontSize: 11,
            letterSpacing: '.22em',
            textTransform: 'uppercase',
            color: 'var(--c-ink)',
            marginInline: 'auto',
          }}
        >
          <span><strong style={{ fontSize: 20, display: 'block', letterSpacing: 0 }}>{days.length}</strong> days</span>
          <span aria-hidden style={{ width: 1, height: 32, background: 'var(--c-line)' }} />
          <span><strong style={{ fontSize: 20, display: 'block', letterSpacing: 0 }}>{allItems.length}</strong> moments</span>
          <span aria-hidden style={{ width: 1, height: 32, background: 'var(--c-line)' }} />
          <span><strong style={{ fontSize: 20, display: 'block', letterSpacing: 0 }}>{people.length}</strong> people</span>
          <span aria-hidden style={{ width: 1, height: 32, background: 'var(--c-line)' }} />
          <span><strong style={{ fontSize: 20, display: 'block', letterSpacing: 0 }}>{trip.location_name?.split(',')[0] ?? '—'}</strong> place</span>
        </div>

        {/* Footer signature */}
        <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <StickerPill variant="ink">open sankofa →</StickerPill>
          <StickerPill variant="pen">next trip</StickerPill>
        </div>

        <MarginNote rotate={-1} size={22} style={{ display: 'block', marginTop: 28 }}>
          — Shawn &amp; Dan, carrying it home
        </MarginNote>
      </div>

      <style>{`
        @media (max-width: 760px) {
          .altar-row { flex-wrap: wrap; min-height: auto !important; }
          .altar-ticket { grid-template-columns: repeat(2, auto) !important; row-gap: 14px !important; }
          .altar-ticket > span[aria-hidden] { display: none; }
        }
      `}</style>
    </main>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}
