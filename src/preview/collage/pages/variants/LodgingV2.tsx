import { useMemo } from 'react';
import { useActiveTrip } from '@/hooks/use-trip';
import { useAccommodations } from '@/hooks/use-accommodations';
import { useLocations } from '@/hooks/use-locations';
import { Stamp } from '../../ui/Stamp';
import { MarginNote } from '../../ui/MarginNote';
import { StickerPill } from '../../ui/StickerPill';
import type { Accommodation } from '@/types/accommodation';
import type { Location } from '@/types/trip';

/**
 * Lodging V2 — Ticket + Stubs.
 * Visual metaphor of an airline/hotel ticket: a tall paper strip with
 * perforated top/bottom edges (dashed border + circular left/right cutouts),
 * dashed horizontal dividers separating three sections — BOOKING, LOCATION,
 * DETAILS — and a tear-off stub at the bottom that summarizes the stay in
 * a single tabular-figures line.
 *
 * A rotating CONFIRMED / ADMIT ONE stamp sits in the upper right corner.
 * Thin-data defense: external links from Accommodation.url and notes render
 * as StickerPill stubs so the DETAILS section has something to carry; venue
 * from useLocations fills the LOCATION section below the hotel address.
 *
 * Empty state: the ticket stays on the page but its text content swaps to
 * a MarginNote + "no stay booked yet" pill, preserving the visual anchor.
 */
function fmtDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function extractConfirmation(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const m = notes.match(/conf(?:irmation)?[\s#:.-]*([A-Z0-9-]{4,})/i);
  return m ? m[1] : null;
}

function extractPhone(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const m = notes.match(/(\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/);
  return m ? m[1] : null;
}

// Very rough "distance to venue" — if both sides have coordinates, use them;
// otherwise fall back to a shared-city nod from the trip title.
function roughDistance(stay: Accommodation | undefined, venue: Location | null): string | null {
  if (!stay || !venue) return null;
  const sLat = stay.location_lat;
  const sLng = stay.location_lng;
  const vLat = venue.lat;
  const vLng = venue.lng;
  if (sLat == null || sLng == null || vLat == null || vLng == null) return null;
  // Haversine (miles)
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(vLat - sLat);
  const dLng = toRad(vLng - sLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(sLat)) * Math.cos(toRad(vLat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const miles = R * c;
  if (miles < 0.15) return 'on-site';
  if (miles < 10) return `${miles.toFixed(1)} mi to venue`;
  return `${Math.round(miles)} mi to venue`;
}

export function LodgingV2() {
  const { data: trip } = useActiveTrip();
  const { data: accommodations = [] } = useAccommodations();
  const { data: locations = [] } = useLocations(trip?.id);

  const stay = useMemo<Accommodation | undefined>(
    () => accommodations.find(a => a.is_selected) ?? accommodations[0],
    [accommodations],
  );

  const alternatives = useMemo<Accommodation[]>(
    () => accommodations.filter(a => a.id !== stay?.id && !a.is_deprioritized).slice(0, 3),
    [accommodations, stay],
  );

  const venue = useMemo<Location | null>(() => {
    if (locations.length === 0) return null;
    const tripLoc = (trip?.location_name ?? '').toLowerCase();
    if (tripLoc) {
      const match = locations.find(l => l.name.toLowerCase().includes(tripLoc.split(',')[0].trim()));
      if (match) return match;
    }
    return locations[0];
  }, [locations, trip]);

  if (!trip) return <div style={{ padding: 80 }}>Loading…</div>;

  const confirmation = extractConfirmation(stay?.notes);
  const phone = extractPhone(stay?.notes);
  const distance = roughDistance(stay, venue);

  return (
    <main
      style={{
        minHeight: 'calc(100vh - 120px)',
        padding: 'clamp(32px, 5vw, 72px) clamp(20px, 4vw, 56px) 96px',
        maxWidth: 720,
        marginInline: 'auto',
        position: 'relative',
      }}
    >
      <MarginNote
        rotate={-6}
        size={22}
        style={{ position: 'absolute', top: 40, left: -4 }}
      >
        tear along the dotted line
      </MarginNote>

      {/* TICKET */}
      <article
        className="collage-enter lodging-ticket"
        style={{
          position: 'relative',
          background: 'var(--c-paper)',
          boxShadow: 'var(--c-shadow)',
          border: '2px dashed var(--c-ink)',
          padding: 0,
          marginTop: 56,
          // Leave room for the notch cutouts on the horizontal edges
          clipPath: 'none',
        }}
      >
        {/* Perforation notches — left + right circles, purely decorative */}
        <span aria-hidden style={notchStyle('left', 'top')} />
        <span aria-hidden style={notchStyle('right', 'top')} />
        <span aria-hidden style={notchStyle('left', 'middle-1')} />
        <span aria-hidden style={notchStyle('right', 'middle-1')} />
        <span aria-hidden style={notchStyle('left', 'middle-2')} />
        <span aria-hidden style={notchStyle('right', 'middle-2')} />
        <span aria-hidden style={notchStyle('left', 'stub')} />
        <span aria-hidden style={notchStyle('right', 'stub')} />
        <span aria-hidden style={notchStyle('left', 'bottom')} />
        <span aria-hidden style={notchStyle('right', 'bottom')} />

        {/* Corner stamp */}
        <Stamp
          variant="outline"
          size="sm"
          rotate={8}
          style={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}
        >
          {stay ? 'confirmed' : 'pending'}
        </Stamp>

        {/* SECTION 1 — BOOKING */}
        <section style={{ padding: '36px 36px 28px' }}>
          <SectionLabel>booking</SectionLabel>

          <h1
            style={{
              fontFamily: 'var(--c-font-display)',
              fontSize: 'clamp(22px, 3.6vw, 34px)',
              letterSpacing: '.02em',
              lineHeight: 1.05,
              margin: '10px 0 0',
              color: 'var(--c-ink)',
              textTransform: 'uppercase',
              maxWidth: '14ch',
            }}
          >
            {stay ? stay.title : 'no stay booked'}
          </h1>

          {!stay && (
            <div style={{ marginTop: 18 }}>
              <StickerPill variant="tape" rotate={-2}>
                no stay booked yet
              </StickerPill>
              <MarginNote rotate={-1} size={20} style={{ display: 'block', marginTop: 14 }}>
                add one to print this ticket →
              </MarginNote>
            </div>
          )}

          {stay && (
            <div
              style={{
                marginTop: 22,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 20,
              }}
            >
              <StubCell label="check-in" value={fmtDate(stay.check_in) ?? '—'} />
              <StubCell label="check-out" value={fmtDate(stay.check_out) ?? '—'} />
            </div>
          )}
        </section>

        <Perforation />

        {/* SECTION 2 — LOCATION */}
        <section style={{ padding: '28px 36px 28px' }}>
          <SectionLabel>location</SectionLabel>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              marginTop: 12,
            }}
          >
            {/* Tiny collage "map pin" graphic */}
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: 22,
                height: 30,
                flexShrink: 0,
                background: 'var(--c-pen)',
                borderRadius: '50% 50% 50% 0',
                transform: 'rotate(-45deg)',
                boxShadow: 'var(--c-shadow-sm)',
                marginTop: 4,
                position: 'relative',
              }}
            />
            <div>
              <p
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontSize: 16,
                  color: 'var(--c-ink)',
                  margin: 0,
                  lineHeight: 1.35,
                  maxWidth: '38ch',
                }}
              >
                {stay?.address ?? trip.location_name ?? 'address pending'}
              </p>
              {venue && (
                <p
                  style={{
                    fontFamily: 'var(--c-font-body)',
                    fontStyle: 'italic',
                    fontSize: 13,
                    color: 'var(--c-ink-muted)',
                    margin: '6px 0 0',
                  }}
                >
                  near {venue.name}
                  {distance ? ` · ${distance}` : ''}
                </p>
              )}
            </div>
          </div>
        </section>

        <Perforation />

        {/* SECTION 3 — DETAILS */}
        <section style={{ padding: '28px 36px 32px' }}>
          <SectionLabel>details</SectionLabel>

          {(confirmation || phone || stay?.url || alternatives.length > 0) ? (
            <div
              style={{
                marginTop: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              {(confirmation || phone) && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 20,
                  }}
                >
                  <StubCell
                    label="confirm #"
                    value={confirmation ?? '—'}
                    tabular
                  />
                  <StubCell label="phone" value={phone ?? '—'} tabular />
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {stay?.url && (
                  <a
                    href={stay.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    style={{ textDecoration: 'none' }}
                  >
                    <StickerPill variant="pen" rotate={-1}>
                      reservation ↗
                    </StickerPill>
                  </a>
                )}
                {alternatives.map((a, i) => (
                  <StickerPill
                    key={a.id}
                    variant="tape"
                    rotate={i % 2 === 0 ? -1 : 1}
                  >
                    alt · {truncate(a.title, 20)}
                  </StickerPill>
                ))}
              </div>
            </div>
          ) : (
            <MarginNote rotate={-1} size={20} style={{ display: 'block', marginTop: 12 }}>
              no extra details on file
            </MarginNote>
          )}
        </section>

        <Perforation />

        {/* STUB — one-line summary, tabular figures */}
        <section
          style={{
            padding: '20px 36px',
            background: 'rgba(246, 213, 92, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--c-font-display)',
              fontSize: 10,
              letterSpacing: '.24em',
              textTransform: 'uppercase',
              color: 'var(--c-ink)',
            }}
          >
            admit one
          </div>
          <div
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 14,
              color: 'var(--c-ink)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {stay
              ? `${truncate(stay.title, 28)} · ${fmtDate(stay.check_in) ?? '—'} → ${
                  fmtDate(stay.check_out) ?? '—'
                }`
              : 'ticket unissued'}
          </div>
        </section>
      </article>

      <style>{`
        @media (max-width: 560px) {
          .lodging-ticket section > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'var(--c-font-display)',
        fontSize: 10,
        letterSpacing: '.26em',
        textTransform: 'uppercase',
        color: 'var(--c-pen)',
      }}
    >
      {children}
    </div>
  );
}

function StubCell({
  label,
  value,
  tabular = false,
}: {
  label: string;
  value: string;
  tabular?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--c-font-display)',
          fontSize: 9,
          letterSpacing: '.22em',
          textTransform: 'uppercase',
          color: 'var(--c-ink-muted)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--c-font-body)',
          fontSize: 16,
          color: 'var(--c-ink)',
          fontVariantNumeric: tabular ? 'tabular-nums' : 'normal',
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Perforation() {
  return (
    <div
      aria-hidden
      style={{
        height: 0,
        borderTop: '2px dashed var(--c-ink)',
        marginInline: 18,
        opacity: 0.45,
      }}
    />
  );
}

// Position the small circular "hole-punch" notches that sell the ticket edge.
function notchStyle(
  side: 'left' | 'right',
  row: 'top' | 'middle-1' | 'middle-2' | 'stub' | 'bottom',
): React.CSSProperties {
  const rowTop: Record<typeof row, string> = {
    top: '0',
    'middle-1': 'calc(28% - 8px)',
    'middle-2': 'calc(56% - 8px)',
    stub: 'calc(82% - 8px)',
    bottom: 'calc(100% - 16px)',
  } as Record<typeof row, string>;
  return {
    position: 'absolute',
    width: 16,
    height: 16,
    background: 'var(--c-creme)',
    borderRadius: '50%',
    boxShadow: 'inset 0 0 0 2px var(--c-ink)',
    top: rowTop[row],
    [side]: -10,
    pointerEvents: 'none',
  } as React.CSSProperties;
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}
