import { useMemo } from 'react';
import { useActiveTrip, useTripDays, getTripMode, getCurrentDayIndex } from '@/hooks/use-trip';
import { useItineraryItems } from '@/hooks/use-itinerary';
import { Stamp } from '../../ui/Stamp';
import { StickerPill } from '../../ui/StickerPill';
import { PolaroidCard, resolveMood } from '../../ui/PolaroidCard';
import { MarginNote } from '../../ui/MarginNote';
import type { ItineraryItem } from '@/types/trip';

function fmtDateRange(startISO: string, endISO: string) {
  const s = new Date(startISO);
  const e = new Date(endISO);
  const same = s.getMonth() === e.getMonth();
  const monthLong = s.toLocaleString('en-US', { month: 'long' });
  const monthLongEnd = e.toLocaleString('en-US', { month: 'long' });
  const year = e.getFullYear();
  if (same) return `${monthLong} ${s.getDate()}\u2013${e.getDate()}, ${year}`;
  return `${monthLong} ${s.getDate()} \u2013 ${monthLongEnd} ${e.getDate()}, ${year}`;
}

function fmtItemTime(item: ItineraryItem) {
  if (!item.start_time) return '';
  const [h, m] = item.start_time.split(':');
  const hr = parseInt(h, 10);
  const ampm = hr >= 12 ? 'pm' : 'am';
  const hr12 = ((hr + 11) % 12) + 1;
  return `${hr12}:${m} ${ampm}`;
}

export function DashboardV1() {
  const { data: trip, isLoading: tripLoading } = useActiveTrip();
  const { data: days = [] } = useTripDays(trip?.id);
  const { data: allItems = [] } = useItineraryItems(trip?.id);

  const mode = trip ? getTripMode(trip) : 'pre';
  const currentDayIdx = trip ? getCurrentDayIndex(trip, days, mode) : 0;
  const currentDay = days[currentDayIdx];

  // Pick 3 upcoming items from the current day + next day
  const featuredItems = useMemo<ItineraryItem[]>(() => {
    if (!allItems.length) return [];
    if (mode === 'pre') {
      // Pre-trip: show the first 3 real scheduled items (skip "arrival", "departure" transport)
      return allItems
        .filter(i => i.start_time)
        .slice(0, 3);
    }
    const curId = currentDay?.id;
    const next = allItems.filter(i => i.day_id === curId && i.status === 'planned' && i.start_time);
    if (next.length >= 3) return next.slice(0, 3);
    return allItems.filter(i => i.status === 'planned' && i.start_time).slice(0, 3);
  }, [allItems, mode, currentDay]);

  const dayCount = days.length;
  const itemCount = allItems.length;

  if (tripLoading) {
    return (
      <div style={{ padding: 80, textAlign: 'center', color: 'var(--c-ink-muted)' }}>
        Loading trip…
      </div>
    );
  }

  if (!trip) {
    return (
      <div style={{ padding: 80 }}>
        <Stamp size="md" variant="outline">No active trip</Stamp>
        <p style={{ marginTop: 24 }}>
          Seed a trip first: <code>npx tsx scripts/seed-sankofa.ts</code>
        </p>
      </div>
    );
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        minHeight: '100dvh',
        padding: 'clamp(40px, 6vw, 80px) clamp(24px, 5vw, 72px)',
        position: 'relative',
      }}
    >
      {/* corner mark */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontFamily: 'var(--c-font-display)',
          fontSize: 11,
          letterSpacing: '.28em',
          textTransform: 'uppercase',
        }}
      >
        <span
          aria-hidden
          style={{ width: 10, height: 10, borderRadius: 999, background: 'var(--c-pen)' }}
        />
        <span>
          MyKeepsakes · <span style={{ color: 'var(--c-pen)' }}>Sankofa CPE · 2026</span>
        </span>
      </div>

      <Stamp
        size="sm"
        variant="outline"
        rotate={4}
        style={{ position: 'absolute', top: 24, right: 32 }}
      >
        keep · return · send forward
      </Stamp>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 460px)',
          gap: 56,
          alignItems: 'center',
          marginTop: 64,
        }}
        className="collage-bed"
      >
        {/* words */}
        <section>
          <MarginNote rotate={-2} style={{ marginBottom: 16, display: 'block' }}>
            a field notebook for the work
          </MarginNote>

          <h1
            style={{
              fontFamily: 'var(--c-font-display)',
              fontSize: 'clamp(44px, 7vw, 88px)',
              lineHeight: 0.92,
              letterSpacing: '-.02em',
              margin: 0,
              maxWidth: '12ch',
            }}
          >
            <span style={{ color: 'var(--c-ink)' }}>{trip.title.split(/\s+/).slice(0, 1).join(' ')}</span>
            {trip.title.split(/\s+/).length > 1 && (
              <>
                <br />
                <span style={{ color: 'var(--c-pen)' }}>
                  {trip.title.split(/\s+/).slice(1, 3).join(' ')}
                </span>
              </>
            )}
          </h1>

          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 'clamp(16px, 1.25vw, 19px)',
              lineHeight: 1.6,
              color: 'var(--c-ink-muted)',
              maxWidth: '46ch',
              margin: '24px 0 28px',
            }}
          >
            {fmtDateRange(trip.start_date, trip.end_date)}
            {trip.location_name ? ` · ${trip.location_name}` : ''}. {dayCount} days, {itemCount} moments
            scheduled so far. Open it to carry a piece of it home.
          </p>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <StickerPill variant="ink">
              ✦ trip 01 of many
            </StickerPill>
            <StickerPill variant="pen">
              {mode === 'pre' ? 'begins in ' + daysUntil(trip.start_date) : mode === 'active' ? 'in progress' : 'archived'}
            </StickerPill>
          </div>
        </section>

        {/* polaroid stack */}
        <section
          aria-hidden={featuredItems.length === 0}
          style={{ position: 'relative', height: 420, minWidth: 280 }}
        >
          {featuredItems.map((item, i) => {
            const rot = [-4, 3, 6][i] ?? 0;
            const top = [0, '22%', 'auto'][i];
            const bottom = i === 2 ? 0 : undefined;
            const left = [undefined, 0, undefined][i];
            const right = [0, undefined, 0][i];
            const width = [260, 220, 200][i] ?? 200;
            return (
              <PolaroidCard
                key={item.id}
                mood={resolveMood(item.category, item.start_time)}
                rotate={rot}
                tape
                size="sm"
                entrance
                entranceDelayMs={i * 80}
                overline={fmtItemTime(item)}
                caption={
                  item.speaker
                    ? `${truncate(item.title, 34)} — ${item.speaker.split(/[,(]/)[0].trim()}`
                    : truncate(item.title, 44)
                }
                style={{
                  position: 'absolute',
                  top: top as any,
                  bottom,
                  left: left as any,
                  right: right as any,
                  width,
                  zIndex: 3 - i,
                }}
              />
            );
          })}
        </section>
      </div>

      {/* footer */}
      <footer
        style={{
          position: 'absolute',
          bottom: 28,
          left: 32,
          right: 32,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'end',
          color: 'var(--c-ink-muted)',
          fontSize: 13,
        }}
      >
        <span>Kept by Shawn &amp; Dan · Beacon UU</span>
        <MarginNote color="pen" rotate={0} size={22}>
          — go back &amp; fetch it
        </MarginNote>
      </footer>

      <style>{`
        @media (max-width: 900px) {
          .collage-bed {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .collage-bed > section:last-child {
            height: 320px !important;
          }
        }
      `}</style>
    </main>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}

function daysUntil(isoDate: string) {
  const d = new Date(isoDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return 'now';
  if (diff === 1) return '1 day';
  return `${diff} days`;
}
