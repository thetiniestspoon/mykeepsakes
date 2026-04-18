import { useMemo } from 'react';
import { useTrips, useActiveTrip, getTripMode } from '@/hooks/use-trip';
import { Stamp } from '../../ui/Stamp';
import { MarginNote } from '../../ui/MarginNote';
import type { Trip, TripMode } from '@/types/trip';
import '@/preview/collage/collage.css';

/**
 * Trips V2 — Ticket Counter.
 * Vertical list of tear-off ticket stubs. Each real trip gets one with a
 * perforated left edge (dashed ink line), Rubik Mono One trip name, IBM Plex
 * date range, and a "CURRENT" ink-stamp badge on the active entry.
 * Filed under an ink masthead "DESTINATIONS · 2026" that feels like a
 * departure board. Empty/single-trip state: one ticket + a crème ghost-stub
 * saying "No other trips yet" in Caveat. Mobile-first (390px), reduced-motion
 * respected via collage.css global overrides.
 */

function fmtDateRange(startISO: string, endISO: string) {
  const s = new Date(startISO);
  const e = new Date(endISO);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return '';
  const sMon = s.toLocaleString('en-US', { month: 'short' });
  const eMon = e.toLocaleString('en-US', { month: 'short' });
  const sameYear = s.getFullYear() === e.getFullYear();
  const sameMonth = sameYear && s.getMonth() === e.getMonth();
  if (sameMonth) return `${sMon} ${s.getDate()}–${e.getDate()}, ${e.getFullYear()}`;
  if (sameYear) return `${sMon} ${s.getDate()} – ${eMon} ${e.getDate()}, ${e.getFullYear()}`;
  return `${sMon} ${s.getDate()}, ${s.getFullYear()} – ${eMon} ${e.getDate()}, ${e.getFullYear()}`;
}

function mastheadYear(trips: Trip[]): string {
  if (!trips.length) return String(new Date().getFullYear());
  const years = new Set(trips.map(t => new Date(t.start_date).getFullYear().toString()));
  if (years.size === 1) return [...years][0];
  const sorted = [...years].sort();
  return `${sorted[0]}–${sorted[sorted.length - 1].slice(-2)}`;
}

type ModeCopy = { label: string; variant: 'ink' | 'pen' | 'outline' };
const MODE_COPY: Record<TripMode, ModeCopy> = {
  pre:    { label: 'upcoming', variant: 'outline' },
  active: { label: 'current',  variant: 'ink' },
  post:   { label: 'returned', variant: 'outline' },
};

export function TripsV2() {
  const { data: trips = [], isLoading } = useTrips();
  const { data: activeTrip } = useActiveTrip();

  const sorted = useMemo<Trip[]>(
    () => [...trips].sort((a, b) => a.start_date.localeCompare(b.start_date)),
    [trips],
  );

  const year = mastheadYear(sorted);

  return (
    <div className="collage-root">
      <main
        style={{
          minHeight: 'calc(100vh - 120px)',
          padding: 'clamp(24px, 5vw, 56px) clamp(14px, 4vw, 40px) 80px',
          maxWidth: 640,
          marginInline: 'auto',
        }}
      >
        {/* MASTHEAD — departure-board */}
        <header
          style={{
            position: 'relative',
            background: 'var(--c-ink)',
            color: 'var(--c-creme)',
            padding: '18px 20px',
            marginBottom: 28,
            boxShadow: 'var(--c-shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--c-font-display)',
              fontSize: 'clamp(16px, 4vw, 22px)',
              letterSpacing: '.22em',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}
          >
            destinations
          </span>
          <span
            aria-hidden
            style={{
              height: 1,
              flex: 1,
              background: 'var(--c-creme)',
              opacity: 0.35,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--c-font-display)',
              fontSize: 'clamp(14px, 3.6vw, 18px)',
              letterSpacing: '.22em',
              color: 'var(--c-tape)',
              lineHeight: 1,
            }}
          >
            · {year} ·
          </span>
        </header>

        {isLoading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '64px 0',
              fontFamily: 'var(--c-font-body)',
              fontStyle: 'italic',
              color: 'var(--c-ink-muted)',
            }}
          >
            Checking the counter…
          </div>
        ) : sorted.length === 0 ? (
          <EmptyCounter />
        ) : (
          <ul
            aria-label="Your trips"
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}
          >
            {sorted.map((t, i) => (
              <li key={t.id} style={{ listStyle: 'none' }}>
                <TicketStub
                  trip={t}
                  isActive={activeTrip?.id === t.id}
                  index={i}
                />
              </li>
            ))}
            {sorted.length <= 1 && (
              <li style={{ listStyle: 'none' }}>
                <GhostStub />
              </li>
            )}
          </ul>
        )}

        {/* Footer — counter fine print */}
        <footer
          style={{
            marginTop: 40,
            paddingTop: 20,
            borderTop: '1.5px dashed var(--c-ink)',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--c-font-display)',
              fontSize: 10,
              letterSpacing: '.28em',
              textTransform: 'uppercase',
              color: 'var(--c-ink-muted)',
            }}
          >
            tear along perforation · keep your stub
          </span>
        </footer>
      </main>
    </div>
  );
}

function TicketStub({
  trip,
  isActive,
  index,
}: {
  trip: Trip;
  isActive: boolean;
  index: number;
}) {
  const mode = getTripMode(trip);
  const modeInfo = MODE_COPY[mode];
  const dateRange = fmtDateRange(trip.start_date, trip.end_date);

  return (
    <article
      className="collage-enter"
      style={{
        position: 'relative',
        background: isActive ? 'var(--c-paper)' : 'var(--c-paper)',
        boxShadow: isActive
          ? '0 10px 26px -8px rgba(29, 29, 27, 0.38)'
          : 'var(--c-shadow-sm)',
        display: 'grid',
        gridTemplateColumns: '28px 1fr',
        gap: 0,
        borderLeft: '1.5px solid var(--c-ink)',
        borderRight: '1.5px solid var(--c-ink)',
        borderTop: '1.5px solid var(--c-ink)',
        borderBottom: '1.5px solid var(--c-ink)',
        animationDelay: `${index * 70}ms`,
        transform: isActive ? 'translateX(-2px)' : 'translateX(0)',
        transition: 'transform var(--c-t-fast) var(--c-ease-out), box-shadow var(--c-t-fast) var(--c-ease-out)',
      }}
    >
      {/* Perforated left edge */}
      <div
        aria-hidden
        style={{
          position: 'relative',
          background: isActive ? 'var(--c-ink)' : 'var(--c-creme)',
          borderRight: '1.5px dashed var(--c-ink)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontFamily: 'var(--c-font-display)',
            fontSize: 9,
            letterSpacing: '.28em',
            textTransform: 'uppercase',
            color: isActive ? 'var(--c-creme)' : 'var(--c-ink-muted)',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          stub · {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* Stub body */}
      <div
        style={{
          padding: '16px 16px 16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          position: 'relative',
        }}
      >
        {/* Kicker row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--c-font-display)',
              fontSize: 10,
              letterSpacing: '.24em',
              textTransform: 'uppercase',
              color: 'var(--c-pen)',
            }}
          >
            {trip.location_name ?? 'destination tbd'}
          </span>
          {isActive ? (
            <Stamp variant="ink" size="sm" rotate={-3}>
              {modeInfo.label}
            </Stamp>
          ) : (
            <Stamp variant={modeInfo.variant} size="sm" rotate={2}>
              {modeInfo.label}
            </Stamp>
          )}
        </div>

        {/* Trip name — Rubik Mono One */}
        <h2
          style={{
            fontFamily: 'var(--c-font-display)',
            fontSize: 'clamp(18px, 4.4vw, 24px)',
            lineHeight: 1.05,
            letterSpacing: '.02em',
            color: 'var(--c-ink)',
            margin: '2px 0 4px',
            textTransform: 'uppercase',
          }}
        >
          {trip.title}
        </h2>

        {/* Date range — IBM Plex */}
        <div
          style={{
            fontFamily: 'var(--c-font-body)',
            fontSize: 15,
            color: 'var(--c-ink)',
            margin: 0,
          }}
        >
          {dateRange}
        </div>

        {/* Bottom rule — ticket fold line */}
        <div
          aria-hidden
          style={{
            marginTop: 10,
            height: 1,
            background:
              'repeating-linear-gradient(90deg, var(--c-ink) 0 6px, transparent 6px 12px)',
            opacity: 0.55,
          }}
        />

        {/* Active underline accent */}
        {isActive && (
          <MarginNote rotate={-1} size={18} style={{ marginTop: 2 }}>
            — you are here
          </MarginNote>
        )}
      </div>
    </article>
  );
}

function GhostStub() {
  return (
    <article
      aria-hidden
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '28px 1fr',
        border: '1.5px dashed var(--c-ink)',
        background:
          'repeating-linear-gradient(135deg, transparent 0 10px, rgba(29,29,27,.04) 10px 11px), var(--c-creme)',
        opacity: 0.8,
      }}
    >
      <div
        style={{
          borderRight: '1.5px dashed var(--c-ink)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontFamily: 'var(--c-font-display)',
            fontSize: 9,
            letterSpacing: '.28em',
            textTransform: 'uppercase',
            color: 'var(--c-ink-muted)',
            whiteSpace: 'nowrap',
          }}
        >
          stub · —
        </span>
      </div>
      <div style={{ padding: '22px 18px', textAlign: 'left' }}>
        <MarginNote rotate={-1} size={22} style={{ display: 'block' }}>
          No other trips yet
        </MarginNote>
        <p
          style={{
            fontFamily: 'var(--c-font-body)',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--c-ink-muted)',
            margin: '8px 0 0',
          }}
        >
          The next destination prints its own stub.
        </p>
      </div>
    </article>
  );
}

function EmptyCounter() {
  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--c-paper)',
        padding: '40px 24px',
        textAlign: 'center',
        boxShadow: 'var(--c-shadow-sm)',
        border: '1.5px solid var(--c-ink)',
      }}
    >
      <Stamp variant="outline" size="sm" rotate={-3} style={{ marginBottom: 16 }}>
        counter · closed
      </Stamp>
      <p
        style={{
          fontFamily: 'var(--c-font-body)',
          fontSize: 16,
          margin: '8px 0 14px',
          color: 'var(--c-ink)',
        }}
      >
        No tickets issued yet.
      </p>
      <MarginNote rotate={-2} size={20}>
        — first trip opens the window
      </MarginNote>
    </div>
  );
}
