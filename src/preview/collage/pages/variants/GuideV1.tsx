import { useMemo } from 'react';
import { useActiveTrip } from '@/hooks/use-trip';
import { useItineraryItems } from '@/hooks/use-itinerary';
import { useLocations } from '@/hooks/use-locations';
import { useAccommodations } from '@/hooks/use-accommodations';
import { useConnections } from '@/hooks/use-connections';
import { Stamp } from '../../ui/Stamp';
import { Tape } from '../../ui/Tape';
import { PolaroidCard } from '../../ui/PolaroidCard';
import { MarginNote } from '../../ui/MarginNote';
import { StickerPill } from '../../ui/StickerPill';
import type { Location } from '@/types/trip';
import type { Accommodation } from '@/types/accommodation';
import type { Connection } from '@/types/conference';

/**
 * Guide V1 — Travel Brochure Trifold.
 * A three-column brochure layout (desktop) that collapses to stacked panels on mobile.
 * Columns: THE ROOM (accommodation), THE PLACE (venue), THE PEOPLE (top speakers).
 * Header uses the Rubik Mono One stamp mark "SANKOFA · POCKET GUIDE".
 * Reads as a paper trifold — tape accents between columns, stamp headers per panel.
 */
function fmtDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
}

function firstName(full: string) {
  return full.split(/[,(]/)[0].trim();
}

// Score a connection on likelihood of being a "speaker" vs a casual contact.
// family_contacts does not have dedicated speaker fields; infer from
// organization + met_context populated + category signals.
function speakerScore(c: Connection): number {
  let score = 0;
  if (c.organization && c.organization.trim()) score += 2;
  if (c.met_context && c.met_context.trim()) score += 1;
  const cat = (c.category ?? '').toLowerCase();
  if (cat.includes('speaker') || cat.includes('session') || cat.includes('faculty')) score += 4;
  if (c.notes && c.notes.trim()) score += 1;
  return score;
}

export function GuideV1() {
  const { data: trip } = useActiveTrip();
  const { data: items = [] } = useItineraryItems(trip?.id);
  const { data: locations = [] } = useLocations(trip?.id);
  const { data: accommodations = [] } = useAccommodations();
  const { data: people = [] } = useConnections(trip?.id);

  const stay = useMemo<Accommodation | undefined>(
    () => accommodations.find(a => a.is_selected) ?? accommodations[0],
    [accommodations],
  );

  // The venue: prefer a location whose name matches the trip's location,
  // else the first location, else a synthesized stub from trip.location_name.
  const venue = useMemo<Location | null>(() => {
    if (locations.length === 0) return null;
    const tripLoc = (trip?.location_name ?? '').toLowerCase();
    if (tripLoc) {
      const match = locations.find(l => l.name.toLowerCase().includes(tripLoc.split(',')[0].trim()));
      if (match) return match;
    }
    return locations[0];
  }, [locations, trip]);

  const topSpeakers = useMemo<Connection[]>(() => {
    const ranked = [...people].sort((a, b) => speakerScore(b) - speakerScore(a));
    return ranked.slice(0, 4);
  }, [people]);

  // Cross-reference: does any itinerary item's speaker field match a connection?
  // If so, mark that connection as "the one I'm here for".
  const headlineName = useMemo<string | null>(() => {
    const worship = items.find(i => i.category === 'worship' && i.speaker);
    const keynote = worship ?? items.find(i => i.speaker);
    if (!keynote?.speaker) return topSpeakers[0]?.name ?? null;
    return firstName(keynote.speaker);
  }, [items, topSpeakers]);

  if (!trip) return <div style={{ padding: 80 }}>Loading…</div>;

  const tripRange = `${fmtDate(trip.start_date)} – ${fmtDate(trip.end_date)}`;

  return (
    <main
      style={{
        minHeight: 'calc(100vh - 120px)',
        padding: 'clamp(32px, 4vw, 64px) clamp(20px, 4vw, 56px) 80px',
      }}
    >
      {/* Title bar */}
      <header
        style={{
          textAlign: 'center',
          marginBottom: 48,
          position: 'relative',
        }}
      >
        <Stamp variant="outline" size="sm" rotate={-2} style={{ marginBottom: 16 }}>
          pocket guide · trifold
        </Stamp>
        <h1
          style={{
            fontFamily: 'var(--c-font-display)',
            fontSize: 'clamp(30px, 5vw, 56px)',
            letterSpacing: '.04em',
            lineHeight: 1,
            margin: 0,
            color: 'var(--c-ink)',
          }}
        >
          SANKOFA · POCKET GUIDE
        </h1>
        <p
          style={{
            fontFamily: 'var(--c-font-body)',
            fontStyle: 'italic',
            color: 'var(--c-ink-muted)',
            margin: '10px 0 0',
            fontSize: 'clamp(14px, 1.2vw, 18px)',
          }}
        >
          {trip.title}
          {trip.location_name ? ` · ${trip.location_name}` : ''} · {tripRange}
        </p>
        <MarginNote rotate={-4} size={22} style={{ display: 'inline-block', marginTop: 12 }}>
          fold along dotted line ✦
        </MarginNote>
      </header>

      {/* Trifold body */}
      <div
        className="guide-trifold"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 16px 1fr 16px 1fr',
          gap: 0,
          alignItems: 'stretch',
          maxWidth: 1200,
          marginInline: 'auto',
        }}
      >
        {/* Column 1 — THE ROOM */}
        <section
          className="guide-col"
          style={{
            background: 'var(--c-paper)',
            boxShadow: 'var(--c-shadow)',
            padding: '28px 24px 28px',
            position: 'relative',
            minHeight: 520,
          }}
        >
          <Tape position="top-left" rotate={-6} />
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <Stamp variant="ink" size="md" rotate={-2}>the room</Stamp>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <PolaroidCard
              mood="ink"
              rotate={-3}
              size="sm"
              tape
              caption={stay ? firstName(stay.title) : 'no stay selected'}
              overline={stay?.check_in ? `check-in ${fmtDate(stay.check_in)}` : 'TBD'}
            />
          </div>

          {stay ? (
            <dl style={{ margin: 0, fontFamily: 'var(--c-font-body)', fontSize: 15, color: 'var(--c-ink)' }}>
              <KV label="Hotel" value={stay.title} />
              {stay.address && <KV label="Address" value={stay.address} multiline />}
              {stay.check_in && (
                <KV label="Check-in" value={fmtDate(stay.check_in) ?? stay.check_in} />
              )}
              {stay.check_out && (
                <KV label="Check-out" value={fmtDate(stay.check_out) ?? stay.check_out} />
              )}
              {stay.notes && <KV label="Notes" value={stay.notes} multiline />}
            </dl>
          ) : (
            <MarginNote rotate={-1} size={20} style={{ display: 'block', textAlign: 'center', marginTop: 24 }}>
              pick a place to stay →
            </MarginNote>
          )}
        </section>

        <FoldGutter />

        {/* Column 2 — THE PLACE */}
        <section
          className="guide-col"
          style={{
            background: 'var(--c-paper)',
            boxShadow: 'var(--c-shadow)',
            padding: '28px 24px 28px',
            position: 'relative',
            minHeight: 520,
          }}
        >
          <Tape position="top" rotate={3} />
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <Stamp variant="ink" size="md" rotate={2}>the place</Stamp>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <PolaroidCard
              mood="gold"
              rotate={3}
              size="sm"
              tape
              caption={venue ? firstName(venue.name) : firstName(trip.location_name ?? 'venue')}
              overline="the venue"
            />
          </div>

          {venue ? (
            <dl style={{ margin: 0, fontFamily: 'var(--c-font-body)', fontSize: 15, color: 'var(--c-ink)' }}>
              <KV label="Venue" value={venue.name} />
              {venue.address && <KV label="Address" value={venue.address} multiline />}
              {venue.phone && <KV label="Phone" value={venue.phone} />}
              {venue.notes && <KV label="Notes" value={venue.notes} multiline />}
            </dl>
          ) : trip.location_name ? (
            <dl style={{ margin: 0, fontFamily: 'var(--c-font-body)', fontSize: 15, color: 'var(--c-ink)' }}>
              <KV label="Venue" value={trip.location_name} />
              <MarginNote rotate={-1} size={20} style={{ display: 'block', marginTop: 12 }}>
                add more details →
              </MarginNote>
            </dl>
          ) : (
            <MarginNote rotate={-1} size={20} style={{ display: 'block', textAlign: 'center', marginTop: 24 }}>
              no venue set yet
            </MarginNote>
          )}
        </section>

        <FoldGutter />

        {/* Column 3 — THE PEOPLE */}
        <section
          className="guide-col"
          style={{
            background: 'var(--c-paper)',
            boxShadow: 'var(--c-shadow)',
            padding: '28px 24px 28px',
            position: 'relative',
            minHeight: 520,
          }}
        >
          <Tape position="top-right" rotate={6} />
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <Stamp variant="ink" size="md" rotate={-1}>the people</Stamp>
          </div>

          {topSpeakers.length > 0 ? (
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              {topSpeakers.map((p, i) => {
                const isHeadline =
                  !!headlineName && firstName(p.name).toLowerCase() === headlineName.toLowerCase();
                return (
                  <li key={p.id} style={{ position: 'relative' }}>
                    <div
                      className="collage-enter"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '42px 1fr',
                        gap: 12,
                        alignItems: 'center',
                        padding: '10px 12px',
                        border: '1.5px solid var(--c-ink)',
                        borderRadius: 'var(--c-r-sm)',
                        background: 'var(--c-creme)',
                        animationDelay: `${i * 60}ms`,
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          width: 42,
                          height: 42,
                          background: 'var(--c-ink)',
                          color: 'var(--c-creme)',
                          fontFamily: 'var(--c-font-display)',
                          fontSize: 12,
                          letterSpacing: '.08em',
                          display: 'grid',
                          placeItems: 'center',
                          borderRadius: 'var(--c-r-sm)',
                        }}
                      >
                        {initials(p.name)}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--c-font-body)', fontSize: 15, fontWeight: 500, color: 'var(--c-ink)', lineHeight: 1.2 }}>
                          {p.name}
                        </div>
                        {(p.organization || p.met_context) && (
                          <div style={{ fontFamily: 'var(--c-font-body)', fontStyle: 'italic', fontSize: 12, color: 'var(--c-ink-muted)', marginTop: 2 }}>
                            {p.organization ?? p.met_context}
                          </div>
                        )}
                      </div>
                    </div>
                    {isHeadline && (
                      <MarginNote
                        rotate={-6}
                        size={20}
                        style={{ position: 'absolute', right: -8, top: -14 }}
                      >
                        the one I'm here for ✦
                      </MarginNote>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <MarginNote rotate={-1} size={20} style={{ display: 'block', textAlign: 'center', marginTop: 24 }}>
              add people as you meet them →
            </MarginNote>
          )}

          <div
            style={{
              marginTop: 24,
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <StickerPill variant="pen">full schedule →</StickerPill>
          </div>
        </section>
      </div>

      <style>{`
        @media (max-width: 880px) {
          .guide-trifold {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .guide-trifold > .guide-fold-gutter { display: none; }
          .guide-col { min-height: auto !important; }
        }
      `}</style>
    </main>
  );
}

function FoldGutter() {
  return (
    <div
      aria-hidden
      className="guide-fold-gutter"
      style={{
        position: 'relative',
        minHeight: 60,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '50%',
          width: 0,
          borderLeft: '1.5px dashed var(--c-line)',
          transform: 'translateX(-50%)',
        }}
      />
      <span
        style={{
          position: 'absolute',
          top: 32,
          left: '50%',
          transform: 'translateX(-50%) rotate(-4deg)',
          width: 28,
          height: 18,
          background: 'rgba(246, 213, 92, .78)',
          boxShadow: '0 1px 2px rgba(0,0,0,.12)',
        }}
      />
    </div>
  );
}

function KV({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8, padding: '6px 0', borderBottom: '1px dashed var(--c-line)' }}>
      <dt
        style={{
          fontFamily: 'var(--c-font-display)',
          fontSize: 9,
          letterSpacing: '.2em',
          textTransform: 'uppercase',
          color: 'var(--c-ink-muted)',
          paddingTop: 4,
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          margin: 0,
          fontFamily: 'var(--c-font-body)',
          fontSize: 14,
          color: 'var(--c-ink)',
          lineHeight: multiline ? 1.4 : 1.25,
        }}
      >
        {value}
      </dd>
    </div>
  );
}

function initials(name: string): string {
  const parts = name
    .replace(/[()]/g, '')
    .split(/[\s,]+/)
    .filter(Boolean);
  if (parts.length === 0) return '··';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
