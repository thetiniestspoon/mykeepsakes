import { useMemo } from 'react';
import { useActiveTrip } from '@/hooks/use-trip';
import { useLocations } from '@/hooks/use-locations';
import { Stamp } from '../../ui/Stamp';
import { StickerPill } from '../../ui/StickerPill';
import { MarginNote } from '../../ui/MarginNote';
import { Tape } from '../../ui/Tape';
import type { Location } from '@/types/trip';

/**
 * Map V2 — Route Card Stack.
 * Vertical travel-journal itinerary: each location is a paper card with an
 * overline category stamp, serif name/address, and a Caveat note estimating
 * travel time to the next stop. Cards are tape-connected in airport→hotel→venue order.
 */

type Category = 'airport' | 'hotel' | 'venue' | 'other';
const CATEGORY_ORDER: Record<Category, number> = {
  airport: 0,
  hotel: 1,
  venue: 2,
  other: 3,
};
const CATEGORY_LABEL: Record<Category, string> = {
  airport: 'airport',
  hotel: 'hotel',
  venue: 'venue',
  other: 'stop',
};

function categorize(loc: Location): Category {
  const cat = (loc.category ?? '').toLowerCase();
  const name = (loc.name ?? '').toLowerCase();
  if (cat.includes('airport') || name.includes('airport') || name.includes("o'hare") || name.includes('ohare') || name.includes('newark') || name.includes('ewr') || name.includes('ord')) {
    return 'airport';
  }
  if (cat.includes('hotel') || cat.includes('accommodation') || cat.includes('lodging') || name.includes('hotel') || name.includes('marriott') || name.includes('inn') || name.includes('suites')) {
    return 'hotel';
  }
  if (cat.includes('venue') || cat.includes('conference') || cat.includes('event') || name.includes('venue') || name.includes('center') || name.includes('centre') || name.includes('convention')) {
    return 'venue';
  }
  return 'other';
}

// Fallback Sankofa data when no locations exist yet.
const FALLBACK: Location[] = [
  {
    id: 'fallback-1',
    trip_id: 'fallback',
    name: "O'Hare International Airport",
    category: 'airport',
    address: '10000 W O\'Hare Ave, Chicago, IL 60666',
    lat: 41.9742,
    lng: -87.9073,
    phone: null,
    url: null,
    notes: null,
    visited_at: null,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'fallback-2',
    trip_id: 'fallback',
    name: 'Marriott Oak Brook',
    category: 'hotel',
    address: '1401 W 22nd St, Oak Brook, IL 60523',
    lat: 41.8395,
    lng: -87.9534,
    phone: null,
    url: null,
    notes: null,
    visited_at: null,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'fallback-3',
    trip_id: 'fallback',
    name: 'Conference Venue · Chicago',
    category: 'venue',
    address: 'Chicago, IL',
    lat: 41.8781,
    lng: -87.6298,
    phone: null,
    url: null,
    notes: null,
    visited_at: null,
    created_at: '',
    updated_at: '',
  },
];

// Haversine distance in miles (rough, fine for a "distance to next" caption).
function distanceMiles(a: Location, b: Location): number | null {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.7613;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

function travelNote(a: Location, b: Location): string {
  const miles = distanceMiles(a, b);
  if (miles == null) return 'next stop →';
  const minutes = Math.max(5, Math.round((miles / 28) * 60)); // ~28mph average w/ traffic
  if (miles < 1) return `just ${Math.round(miles * 10) / 10} mi — a short hop`;
  return `${Math.round(miles)} mi · ~${minutes} min`;
}

export function MapV2() {
  const { data: trip } = useActiveTrip();
  const { data: locations = [] } = useLocations(trip?.id);

  const source: Location[] = locations.length > 0 ? locations : FALLBACK;

  const ordered = useMemo(() => {
    const enriched = source.map(loc => ({ loc, cat: categorize(loc) }));
    // Sort by category priority, then by name (stable-ish) — venue last.
    return enriched.sort((a, b) => {
      const pa = CATEGORY_ORDER[a.cat];
      const pb = CATEGORY_ORDER[b.cat];
      if (pa !== pb) return pa - pb;
      return (a.loc.name ?? '').localeCompare(b.loc.name ?? '');
    });
  }, [source]);

  return (
    <main
      style={{
        padding: 'clamp(24px, 4vw, 56px) clamp(16px, 5vw, 64px) 80px',
        minHeight: 'calc(100vh - 120px)',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, marginBottom: 32 }}>
        <div>
          <Stamp variant="outline" size="sm" rotate={-2} style={{ marginBottom: 14 }}>the map · route card</Stamp>
          <h1 style={{ fontFamily: 'var(--c-font-body)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 500, margin: 0, lineHeight: 1.05 }}>
            {trip?.title ?? 'Sankofa'} — itinerary
          </h1>
          <p style={{ fontFamily: 'var(--c-font-body)', fontStyle: 'italic', color: 'var(--c-ink-muted)', margin: '6px 0 0', fontSize: 16 }}>
            {trip?.location_name ? `${trip.location_name} · ` : ''}turn-by-turn, airport → hotel → venue
          </p>
        </div>
        <StickerPill variant="ink" rotate={2}>{ordered.length} stop{ordered.length === 1 ? '' : 's'}</StickerPill>
      </header>

      <ol
        className="collage-route-stack"
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '0 auto',
          maxWidth: 640,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {ordered.map(({ loc, cat }, i) => {
          const next = ordered[i + 1];
          const note = next ? travelNote(loc, next.loc) : 'you have arrived';
          const isLast = i === ordered.length - 1;
          return (
            <li key={loc.id} style={{ position: 'relative' }}>
              <article
                className="collage-enter"
                style={{
                  position: 'relative',
                  background: 'var(--c-paper)',
                  boxShadow: 'var(--c-shadow)',
                  padding: '22px 24px 20px',
                  border: '1px solid var(--c-line)',
                  animationDelay: `${i * 70}ms`,
                }}
              >
                {i === 0 && <Tape position="top-left" rotate={-6} width={80} />}
                {/* Step number + overline */}
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                  <span
                    style={{
                      fontFamily: 'var(--c-font-display)',
                      fontSize: 10,
                      letterSpacing: '.22em',
                      textTransform: 'uppercase',
                      color: 'var(--c-pen)',
                    }}
                  >
                    Stop {String(i + 1).padStart(2, '0')} · {CATEGORY_LABEL[cat]}
                  </span>
                  {loc.visited_at && (
                    <StickerPill variant="tape" style={{ fontSize: 8, padding: '6px 8px' }}>visited</StickerPill>
                  )}
                </div>
                <h2
                  style={{
                    fontFamily: 'var(--c-font-body)',
                    fontSize: 22,
                    fontWeight: 500,
                    margin: '2px 0 4px',
                    color: 'var(--c-ink)',
                    lineHeight: 1.2,
                  }}
                >
                  {loc.name}
                </h2>
                {loc.address && (
                  <p
                    style={{
                      fontFamily: 'var(--c-font-body)',
                      fontSize: 14,
                      color: 'var(--c-ink-muted)',
                      margin: '0 0 10px',
                      lineHeight: 1.4,
                    }}
                  >
                    {loc.address}
                  </p>
                )}
                {loc.notes && (
                  <p
                    style={{
                      fontFamily: 'var(--c-font-body)',
                      fontStyle: 'italic',
                      fontSize: 13,
                      color: 'var(--c-ink)',
                      margin: '0 0 10px',
                      paddingLeft: 10,
                      borderLeft: '2px solid var(--c-pen)',
                      lineHeight: 1.4,
                    }}
                  >
                    {loc.notes}
                  </p>
                )}
                {/* Caveat travel-to-next note */}
                <div
                  style={{
                    marginTop: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <MarginNote rotate={-1} size={18} color={isLast ? 'ink' : 'pen'}>
                    {isLast ? '— you\'ve arrived' : `→ ${note}`}
                  </MarginNote>
                  {/* AT-readable copy shadowing the Caveat note */}
                  <span
                    style={{
                      fontFamily: 'var(--c-font-body)',
                      fontSize: 11,
                      color: 'var(--c-ink-muted)',
                      textAlign: 'right',
                    }}
                  >
                    {isLast ? 'Final stop' : note}
                  </span>
                </div>
              </article>

              {/* Tape connector to the next card */}
              {!isLast && (
                <div
                  aria-hidden
                  style={{
                    position: 'relative',
                    height: 36,
                    margin: '0 auto',
                    width: 18,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: -4,
                      left: '50%',
                      transform: 'translateX(-50%) rotate(-3deg)',
                      width: 18,
                      height: 44,
                      background: 'rgba(246,213,92,0.78)',
                      boxShadow: '0 1px 2px rgba(0,0,0,.12)',
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: 6,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 2,
                      height: 28,
                      background: 'var(--c-pen)',
                      opacity: 0.7,
                    }}
                  />
                </div>
              )}
            </li>
          );
        })}

        {ordered.length === 0 && (
          <li>
            <article style={{ background: 'var(--c-paper)', padding: '32px', textAlign: 'center', boxShadow: 'var(--c-shadow)' }}>
              <StickerPill variant="ink">no stops yet</StickerPill>
              <p style={{ fontFamily: 'var(--c-font-body)', fontStyle: 'italic', color: 'var(--c-ink-muted)', marginTop: 16 }}>
                Add locations to the trip to see the route.
              </p>
            </article>
          </li>
        )}
      </ol>

      <style>{`
        @media (max-width: 560px) {
          .collage-route-stack article { padding: 18px 18px 16px; }
          .collage-route-stack h2 { font-size: 19px !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .collage-route-stack article { animation: none !important; }
        }
      `}</style>
    </main>
  );
}
