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
import type { ItineraryItem, Location } from '@/types/trip';
import type { Accommodation } from '@/types/accommodation';
import type { Connection } from '@/types/conference';

/**
 * Guide V2 — Curator's Folio.
 * Single-page magazine-style layout.
 * Header: big Rubik Mono One with IBM Plex Serif italic subtitle, stamp corners.
 * Hero: large PolaroidCard of the venue, rotated slightly.
 * Two-column body: "THE WEEK AHEAD" (3 highlight sessions) + "WHERE YOU'LL BE" (stay + venue).
 * Footer strip: people chips (top 4–6 speakers).
 */
function fmtDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
}

function fmtDateRange(startISO: string, endISO: string) {
  const s = new Date(startISO);
  const e = new Date(endISO);
  const monthLong = s.toLocaleString('en-US', { month: 'long' });
  const sameMonth = s.getMonth() === e.getMonth();
  const year = e.getFullYear();
  return sameMonth
    ? `${monthLong} ${s.getDate()}\u2013${e.getDate()}, ${year}`
    : `${monthLong} ${s.getDate()} \u2013 ${e.toLocaleString('en-US', { month: 'long' })} ${e.getDate()}, ${year}`;
}

function fmtTime(iso?: string | null) {
  if (!iso) return null;
  const [h, m] = iso.split(':');
  const hr = parseInt(h, 10);
  if (Number.isNaN(hr)) return null;
  const ampm = hr >= 12 ? 'pm' : 'am';
  const hr12 = ((hr + 11) % 12) + 1;
  return `${hr12}:${m}${ampm}`;
}

function firstName(full: string) {
  return full.split(/[,(]/)[0].trim();
}

function speakerScore(c: Connection): number {
  let score = 0;
  if (c.organization && c.organization.trim()) score += 2;
  if (c.met_context && c.met_context.trim()) score += 1;
  const cat = (c.category ?? '').toLowerCase();
  if (cat.includes('speaker') || cat.includes('session') || cat.includes('faculty')) score += 4;
  if (c.notes && c.notes.trim()) score += 1;
  return score;
}

// Pull one worship item + up to two workshop items with speakers.
function pickHighlights(items: ItineraryItem[]): ItineraryItem[] {
  const out: ItineraryItem[] = [];
  const worship = items.find(i => i.category === 'worship');
  if (worship) out.push(worship);
  const workshops = items
    .filter(i => i.category === 'workshop' && i.speaker)
    .slice(0, 2);
  out.push(...workshops);
  // Backfill if needed with any speakered item.
  if (out.length < 3) {
    const fill = items.filter(i => i.speaker && !out.includes(i)).slice(0, 3 - out.length);
    out.push(...fill);
  }
  return out.slice(0, 3);
}

// A small rotation of pull-quote prompts for the margin notes.
const PULL_QUOTES = [
  'sit with this one',
  'the one I keep thinking about',
  'bring a notebook',
  'worth the early alarm',
  'ask a question',
];

export function GuideV2() {
  const { data: trip } = useActiveTrip();
  const { data: items = [] } = useItineraryItems(trip?.id);
  const { data: locations = [] } = useLocations(trip?.id);
  const { data: accommodations = [] } = useAccommodations();
  const { data: people = [] } = useConnections(trip?.id);

  const stay = useMemo<Accommodation | undefined>(
    () => accommodations.find(a => a.is_selected) ?? accommodations[0],
    [accommodations],
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

  const highlights = useMemo(() => pickHighlights(items), [items]);

  const topSpeakers = useMemo<Connection[]>(() => {
    const ranked = [...people].sort((a, b) => speakerScore(b) - speakerScore(a));
    return ranked.slice(0, 6);
  }, [people]);

  if (!trip) return <div style={{ padding: 80 }}>Loading…</div>;

  return (
    <main
      style={{
        minHeight: 'calc(100vh - 120px)',
        padding: 'clamp(32px, 4vw, 64px) clamp(20px, 4vw, 56px) 80px',
        maxWidth: 1120,
        marginInline: 'auto',
      }}
    >
      {/* HEADER */}
      <header
        style={{
          position: 'relative',
          textAlign: 'center',
          paddingTop: 24,
          paddingBottom: 8,
          marginBottom: 40,
        }}
      >
        <Stamp
          variant="outline"
          size="sm"
          rotate={-6}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          curator's folio
        </Stamp>
        <Stamp
          variant="outline"
          size="sm"
          rotate={5}
          style={{ position: 'absolute', top: 0, right: 0 }}
        >
          vol · 01
        </Stamp>

        <h1
          style={{
            fontFamily: 'var(--c-font-display)',
            fontSize: 'clamp(36px, 6.5vw, 78px)',
            letterSpacing: '.02em',
            lineHeight: 0.95,
            margin: '8px 0 0',
            color: 'var(--c-ink)',
          }}
        >
          THE WEEK, BOUND
        </h1>
        <p
          style={{
            fontFamily: 'var(--c-font-body)',
            fontStyle: 'italic',
            color: 'var(--c-ink-muted)',
            margin: '14px auto 0',
            fontSize: 'clamp(15px, 1.3vw, 19px)',
            maxWidth: '54ch',
          }}
        >
          {trip.title}
          {trip.location_name ? ` · ${trip.location_name}` : ''} ·{' '}
          {fmtDateRange(trip.start_date, trip.end_date)}
        </p>
      </header>

      {/* HERO POLAROID */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 56,
        }}
      >
        <PolaroidCard
          mood="gold"
          rotate={-4}
          size="lg"
          entrance
          tape
          caption={venue ? venue.name : (trip.location_name ? firstName(trip.location_name) : 'the venue')}
          overline="the venue"
        />
      </div>

      {/* TWO-COLUMN BODY */}
      <div
        className="folio-body"
        style={{
          display: 'grid',
          gridTemplateColumns: '1.25fr 1fr',
          gap: 48,
          alignItems: 'start',
        }}
      >
        {/* LEFT — THE WEEK AHEAD */}
        <section>
          <div style={{ marginBottom: 22 }}>
            <Stamp variant="ink" size="md" rotate={-2}>the week ahead</Stamp>
          </div>

          {highlights.length > 0 ? (
            <ol
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
              }}
            >
              {highlights.map((h, i) => {
                const pq = PULL_QUOTES[i % PULL_QUOTES.length];
                const time = fmtTime(h.start_time);
                return (
                  <li
                    key={h.id}
                    className="collage-enter"
                    style={{
                      position: 'relative',
                      background: 'var(--c-paper)',
                      boxShadow: 'var(--c-shadow-sm)',
                      padding: '18px 22px 20px',
                      animationDelay: `${i * 70}ms`,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--c-font-display)',
                        fontSize: 10,
                        letterSpacing: '.22em',
                        textTransform: 'uppercase',
                        color: 'var(--c-pen)',
                        marginBottom: 8,
                      }}
                    >
                      {h.category}
                      {time ? ` · ${time}` : ''}
                    </div>
                    <h3
                      style={{
                        fontFamily: 'var(--c-font-body)',
                        fontSize: 19,
                        fontWeight: 500,
                        color: 'var(--c-ink)',
                        margin: 0,
                        lineHeight: 1.25,
                      }}
                    >
                      {h.title}
                    </h3>
                    {h.speaker && (
                      <div
                        style={{
                          fontFamily: 'var(--c-font-body)',
                          fontStyle: 'italic',
                          fontSize: 14,
                          color: 'var(--c-ink-muted)',
                          marginTop: 4,
                        }}
                      >
                        with {firstName(h.speaker)}
                      </div>
                    )}
                    {h.description && (
                      <p
                        style={{
                          fontFamily: 'var(--c-font-body)',
                          fontSize: 14,
                          color: 'var(--c-ink-muted)',
                          margin: '10px 0 0',
                          lineHeight: 1.5,
                        }}
                      >
                        {h.description}
                      </p>
                    )}
                    <MarginNote
                      rotate={i % 2 === 0 ? -4 : 4}
                      size={22}
                      style={{
                        position: 'absolute',
                        right: 12,
                        bottom: -10,
                      }}
                    >
                      {pq}
                    </MarginNote>
                  </li>
                );
              })}
            </ol>
          ) : (
            <MarginNote rotate={-1} size={22} style={{ display: 'block' }}>
              highlights will surface once the schedule fills in
            </MarginNote>
          )}
        </section>

        {/* RIGHT — WHERE YOU'LL BE */}
        <section>
          <div style={{ marginBottom: 22 }}>
            <Stamp variant="ink" size="md" rotate={2}>where you'll be</Stamp>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <PaperCard tapeRotate={-4} tapePosition="top-left">
              <CardTitle kicker="the room" title={stay?.title ?? 'No stay selected'} />
              {stay?.address && <CardLine>{stay.address}</CardLine>}
              {stay?.check_in && (
                <CardLine italic>
                  in {fmtDate(stay.check_in)}
                  {stay.check_out ? ` — out ${fmtDate(stay.check_out)}` : ''}
                </CardLine>
              )}
              {!stay && (
                <MarginNote rotate={-1} size={20} style={{ display: 'block', marginTop: 8 }}>
                  pick a place to stay →
                </MarginNote>
              )}
            </PaperCard>

            <PaperCard tapeRotate={4} tapePosition="top-right">
              <CardTitle kicker="the place" title={venue?.name ?? trip.location_name ?? 'Venue TBD'} />
              {venue?.address && <CardLine>{venue.address}</CardLine>}
              {venue?.notes && <CardLine italic>{venue.notes}</CardLine>}
              {!venue && !trip.location_name && (
                <MarginNote rotate={-1} size={20} style={{ display: 'block', marginTop: 8 }}>
                  add the venue →
                </MarginNote>
              )}
            </PaperCard>
          </div>
        </section>
      </div>

      {/* FOOTER STRIP — people chips */}
      <footer
        style={{
          marginTop: 64,
          paddingTop: 24,
          borderTop: '2px dashed var(--c-ink)',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <Stamp variant="outline" size="sm" rotate={-1}>the people</Stamp>
        </div>
        {topSpeakers.length > 0 ? (
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              justifyContent: 'center',
            }}
          >
            {topSpeakers.map((p, i) => (
              <li key={p.id}>
                <StickerPill
                  variant={i === 0 ? 'ink' : i % 2 === 1 ? 'pen' : 'tape'}
                  rotate={i % 2 === 0 ? -1 : 1}
                >
                  {firstName(p.name)}
                </StickerPill>
              </li>
            ))}
          </ul>
        ) : (
          <MarginNote rotate={-1} size={20}>
            no connections yet — start collecting names
          </MarginNote>
        )}
      </footer>

      <style>{`
        @media (max-width: 820px) {
          .folio-body {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </main>
  );
}

function PaperCard({
  children,
  tapeRotate = -3,
  tapePosition = 'top-left',
}: {
  children: React.ReactNode;
  tapeRotate?: number;
  tapePosition?: 'top' | 'top-left' | 'top-right';
}) {
  return (
    <article
      style={{
        position: 'relative',
        background: 'var(--c-paper)',
        boxShadow: 'var(--c-shadow-sm)',
        padding: '22px 22px 20px',
      }}
    >
      <Tape position={tapePosition} rotate={tapeRotate} />
      {children}
    </article>
  );
}

function CardTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <>
      <div
        style={{
          fontFamily: 'var(--c-font-display)',
          fontSize: 10,
          letterSpacing: '.22em',
          textTransform: 'uppercase',
          color: 'var(--c-pen)',
          marginBottom: 6,
        }}
      >
        {kicker}
      </div>
      <h3
        style={{
          fontFamily: 'var(--c-font-body)',
          fontSize: 18,
          fontWeight: 500,
          color: 'var(--c-ink)',
          margin: 0,
          lineHeight: 1.25,
        }}
      >
        {title}
      </h3>
    </>
  );
}

function CardLine({
  children,
  italic = false,
}: {
  children: React.ReactNode;
  italic?: boolean;
}) {
  return (
    <p
      style={{
        fontFamily: 'var(--c-font-body)',
        fontSize: 14,
        fontStyle: italic ? 'italic' : 'normal',
        color: italic ? 'var(--c-ink-muted)' : 'var(--c-ink)',
        margin: '8px 0 0',
        lineHeight: 1.4,
      }}
    >
      {children}
    </p>
  );
}
