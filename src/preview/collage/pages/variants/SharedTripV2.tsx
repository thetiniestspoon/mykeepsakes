import { useMemo, CSSProperties, ReactNode } from 'react';
import { useActiveTrip } from '@/hooks/use-trip';
import { useItineraryItems } from '@/hooks/use-itinerary';
import { useConnections } from '@/hooks/use-connections';
import { useLocations } from '@/hooks/use-locations';
import { useMemories } from '@/hooks/use-memories';
import { useDispatches } from '@/hooks/use-dispatches';
import { Stamp } from '../../ui/Stamp';
import { StickerPill } from '../../ui/StickerPill';
import { PolaroidCard, resolveMood } from '../../ui/PolaroidCard';
import { MarginNote } from '../../ui/MarginNote';
import { Tape } from '../../ui/Tape';
import type { ItineraryItem, Location, Memory } from '@/types/trip';
import type { Connection } from '@/types/conference';

/**
 * Shared Trip V2 — Zine Booklet.
 *
 * Read-only public surface at /shared/:token. Scroll-through zine: each
 * section is a paper card with tape accents, slight rotation, and a page
 * number corner. Feels like turning pages of a folded zine sent in the mail.
 *
 * Pages:
 *   01 COVER             — large stamp + trip title + dates + location.
 *   02 WHO WE WERE WITH  — 3–4 speaker/connection highlights.
 *   03 WHERE WE WERE     — venue + hotel/location cards.
 *   04 THREE MOMENTS     — memory/dispatch excerpt cards, synthesized if empty.
 *   05 BACK COVER        — attribution + "made with MyKeepsakes" credit.
 *
 * No navigation, no capture FAB, no PIN chrome. Primitives only.
 * Reduced-motion is respected globally via collage.css.
 */

function fmtDateRange(startISO: string, endISO: string): string {
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

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '\u2026' : s;
}

/** Extract top speaker names from timed itinerary items. */
function collectSpeakers(items: ItineraryItem[], limit: number): ItineraryItem[] {
  const seen = new Set<string>();
  const out: ItineraryItem[] = [];
  for (const i of items) {
    if (!i.speaker) continue;
    const key = i.speaker.split(/[,(]/)[0].trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(i);
    if (out.length >= limit) break;
  }
  return out;
}

interface ZinePageProps {
  pageNumber: string;
  rotate?: number;
  tapeLeft?: number;
  tapeRight?: number;
  children: ReactNode;
  style?: CSSProperties;
}

function ZinePage({ pageNumber, rotate = 0, tapeLeft = -7, tapeRight = 5, children, style }: ZinePageProps) {
  return (
    <section
      className="zine-page"
      style={{
        position: 'relative',
        background: 'var(--c-paper)',
        boxShadow: 'var(--c-shadow)',
        padding: 'clamp(28px, 5vw, 56px) clamp(24px, 5vw, 52px) clamp(44px, 5vw, 64px)',
        transform: `rotate(${rotate}deg)`,
        transformOrigin: 'center top',
        maxWidth: 640,
        width: '100%',
        marginInline: 'auto',
        ...style,
      }}
    >
      <Tape position="top-left" rotate={tapeLeft} width={68} />
      <Tape position="top-right" rotate={tapeRight} width={68} />

      {children}

      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: 14,
          right: 20,
          fontFamily: 'var(--c-font-display)',
          fontSize: 10,
          letterSpacing: '.3em',
          color: 'var(--c-ink-muted)',
        }}
      >
        {pageNumber}
      </div>
    </section>
  );
}

export function SharedTripV2() {
  const { data: trip } = useActiveTrip();
  const { data: items = [] } = useItineraryItems(trip?.id);
  const { data: connections = [] } = useConnections(trip?.id);
  const { data: locations = [] } = useLocations(trip?.id);
  const { data: memories = [] } = useMemories(trip?.id);
  const { data: dispatches = [] } = useDispatches(trip?.id);

  // People page: prefer tracked connections; otherwise pull distinct speakers.
  const speakerHighlights = useMemo<ItineraryItem[]>(
    () => collectSpeakers(items, 4),
    [items],
  );
  const peopleSynth = connections.length === 0;

  // Locations: pick venue + accommodation style items.
  const placeHighlights = useMemo<Location[]>(() => {
    const venues = locations.filter(l =>
      (l.category ?? '').toLowerCase().includes('venue') ||
      (l.category ?? '').toLowerCase().includes('conference'),
    );
    const lodging = locations.filter(l =>
      (l.category ?? '').toLowerCase().includes('hotel') ||
      (l.category ?? '').toLowerCase().includes('accommodation') ||
      (l.category ?? '').toLowerCase().includes('lodging'),
    );
    const picked: Location[] = [];
    if (venues[0]) picked.push(venues[0]);
    if (lodging[0]) picked.push(lodging[0]);
    for (const loc of locations) {
      if (picked.length >= 3) break;
      if (!picked.includes(loc)) picked.push(loc);
    }
    return picked;
  }, [locations]);

  // Three moments: prefer real dispatches, fall back to memories with notes,
  // fall back to itinerary items of category worship/workshop.
  const moments = useMemo<Array<{
    id: string;
    title: string;
    body: string;
    meta: string;
    category?: string | null;
    startTime?: string | null;
    synth: boolean;
  }>>(() => {
    const fromDispatch = dispatches.slice(0, 3).map(d => ({
      id: d.id,
      title: d.title ?? 'A dispatch',
      body:
        d.note ??
        'A line we wanted to keep from this day \u2014 the kind you write down before you forget it.',
      meta: d.day?.date ? new Date(`${d.day.date}T00:00:00`).toLocaleString('en-US', { weekday: 'long' }) : 'dispatch',
      category: 'worship',
      startTime: null,
      synth: false,
    }));
    if (fromDispatch.length >= 3) return fromDispatch;

    const fromReflection: Memory[] = memories
      .filter(m => m.memory_type === 'reflection' && m.note)
      .slice(0, 3 - fromDispatch.length);
    const reflectionCards = fromReflection.map(m => ({
      id: m.id,
      title: m.title ?? m.itinerary_item?.title ?? 'A reflection',
      body: m.note ?? '',
      meta: m.day?.date ? new Date(`${m.day.date}T00:00:00`).toLocaleString('en-US', { weekday: 'long' }) : 'reflection',
      category: m.itinerary_item?.category ?? null,
      startTime: m.itinerary_item?.start_time ?? null,
      synth: false,
    }));

    const combined = [...fromDispatch, ...reflectionCards];
    if (combined.length >= 3) return combined;

    // Synthesize the rest from worship/workshop items.
    const synthPool = items.filter(
      i =>
        i.category === 'worship' ||
        i.category === 'workshop' ||
        (i.speaker && i.start_time),
    );
    const synthCards = synthPool.slice(0, 3 - combined.length).map(i => ({
      id: i.id,
      title: i.title,
      body:
        i.description ??
        `${i.speaker ? `${i.speaker.split(/[,(]/)[0].trim()} opened with a question we keep coming back to.` : 'A session that settled something that had been rattling.'} We wanted you to know about this one.`,
      meta: i.speaker ? i.speaker.split(/[,(]/)[0].trim() : i.category ?? '',
      category: i.category,
      startTime: i.start_time,
      synth: true,
    }));

    return [...combined, ...synthCards];
  }, [dispatches, memories, items]);

  if (!trip) {
    return (
      <div style={{ padding: 80, fontFamily: 'var(--c-font-body)', color: 'var(--c-ink-muted)' }}>
        Loading{'\u2026'}
      </div>
    );
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: 'clamp(28px, 5vw, 72px) clamp(16px, 4vw, 48px) 96px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'clamp(32px, 5vw, 56px)',
        fontFamily: 'var(--c-font-body)',
      }}
    >
      {/* Attribution strip */}
      <div
        style={{
          width: '100%',
          maxWidth: 640,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'var(--c-font-display)',
          fontSize: 10,
          letterSpacing: '.24em',
          textTransform: 'uppercase',
          color: 'var(--c-ink-muted)',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <span>sent by shawn &amp; dan</span>
        <span>beacon uu {'\u00b7'} sankofa cpe 2026</span>
      </div>

      {/* 01 COVER */}
      <ZinePage pageNumber="— 01 / cover —" rotate={-0.6}>
        <div style={{ textAlign: 'center' }}>
          <Stamp variant="outline" size="sm" rotate={-3} style={{ marginBottom: 22 }}>
            a zine from the trip
          </Stamp>

          <h1
            style={{
              fontFamily: 'var(--c-font-display)',
              fontSize: 'clamp(34px, 6vw, 64px)',
              lineHeight: 0.98,
              letterSpacing: '-.015em',
              margin: 0,
              color: 'var(--c-ink)',
              maxWidth: '14ch',
              marginInline: 'auto',
            }}
          >
            {trip.title}
          </h1>

          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontStyle: 'italic',
              fontSize: 18,
              color: 'var(--c-ink-muted)',
              margin: '18px auto 0',
              maxWidth: '40ch',
              lineHeight: 1.55,
            }}
          >
            {fmtDateRange(trip.start_date, trip.end_date)}
            {trip.location_name ? ` \u00b7 ${trip.location_name}` : ''}
          </p>

          <div
            style={{
              marginTop: 28,
              display: 'flex',
              justifyContent: 'center',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <StickerPill variant="ink">for your eyes</StickerPill>
            <StickerPill variant="tape" rotate={2}>
              folded &amp; mailed
            </StickerPill>
          </div>

          <MarginNote rotate={-3} size={24} style={{ display: 'block', marginTop: 28 }}>
            turn the page {'\u2193'}
          </MarginNote>
        </div>
      </ZinePage>

      {/* 02 WHO */}
      <ZinePage pageNumber="— 02 / who —" rotate={0.8} tapeLeft={-4} tapeRight={7}>
        <Stamp variant="ink" size="sm" rotate={-2} style={{ marginBottom: 14 }}>
          who we were with
        </Stamp>
        <h2 style={ZineHeading}>The people in the room.</h2>

        {peopleSynth && (
          <p style={ZineSubnote}>
            Names pulled from the program {'\u2014'} the connections page fills in once we swap cards.
          </p>
        )}

        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '24px 0 0',
            display: 'grid',
            gap: 16,
          }}
        >
          {peopleSynth
            ? speakerHighlights.map(s => (
                <PersonRow
                  key={s.id}
                  name={s.speaker?.split(/[,(]/)[0].trim() ?? 'Speaker'}
                  context={s.title}
                  detail={s.start_time ? `${s.start_time.slice(0, 5)} session` : s.category ?? ''}
                />
              ))
            : connections.slice(0, 4).map((c: Connection) => (
                <PersonRow
                  key={c.id}
                  name={c.name}
                  context={c.organization ?? c.met_context ?? ''}
                  detail={c.category === 'speaker' ? 'speaker' : 'connection'}
                />
              ))}
        </ul>
      </ZinePage>

      {/* 03 WHERE */}
      <ZinePage pageNumber="— 03 / where —" rotate={-0.4} tapeLeft={-8} tapeRight={3}>
        <Stamp variant="outline" size="sm" rotate={-1} style={{ marginBottom: 14 }}>
          where we were
        </Stamp>
        <h2 style={ZineHeading}>Rooms that held it.</h2>

        <div
          style={{
            marginTop: 24,
            display: 'grid',
            gap: 18,
          }}
        >
          {placeHighlights.length === 0 ? (
            <p style={ZineSubnote}>
              {trip.location_name
                ? `We were in ${trip.location_name}. The venue detail arrives with the full program.`
                : 'The location detail arrives with the full program.'}
            </p>
          ) : (
            placeHighlights.map(loc => (
              <div
                key={loc.id}
                style={{
                  padding: '16px 18px',
                  border: '1px solid var(--c-line)',
                  background: 'rgba(247, 243, 233, 0.6)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--c-font-display)',
                    fontSize: 10,
                    letterSpacing: '.24em',
                    textTransform: 'uppercase',
                    color: 'var(--c-pen)',
                    marginBottom: 6,
                  }}
                >
                  {loc.category ?? 'place'}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--c-font-body)',
                    fontSize: 18,
                    fontWeight: 500,
                    color: 'var(--c-ink)',
                    lineHeight: 1.35,
                  }}
                >
                  {loc.name}
                </div>
                {loc.address && (
                  <div
                    style={{
                      fontFamily: 'var(--c-font-body)',
                      fontStyle: 'italic',
                      fontSize: 15,
                      color: 'var(--c-ink-muted)',
                      marginTop: 4,
                      lineHeight: 1.45,
                    }}
                  >
                    {loc.address}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ZinePage>

      {/* 04 THREE MOMENTS */}
      <ZinePage pageNumber="— 04 / kept —" rotate={0.5} tapeLeft={-6} tapeRight={6}>
        <Stamp variant="ink" size="sm" rotate={-1} style={{ marginBottom: 14 }}>
          three moments that stayed
        </Stamp>
        <h2 style={ZineHeading}>The ones we kept writing about after.</h2>

        {moments.some(m => m.synth) && (
          <p style={ZineSubnote}>
            Seeded from the program {'\u2014'} our dispatches replace these once the first sessions run.
          </p>
        )}

        <div
          style={{
            marginTop: 28,
            display: 'grid',
            gap: 28,
          }}
        >
          {moments.length === 0 && (
            <p style={ZineSubnote}>Moments will arrive once the sessions begin.</p>
          )}
          {moments.map((m, idx) => (
            <div
              key={m.id}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: 22,
                alignItems: 'start',
              }}
              className="zine-moment"
            >
              <PolaroidCard
                mood={resolveMood(m.category, m.startTime)}
                rotate={idx % 2 === 0 ? -4 : 4}
                size="sm"
                entrance
                entranceDelayMs={idx * 80}
                tape
                caption={truncate(m.title, 22)}
                overline={m.meta || ''}
              />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--c-font-display)',
                    fontSize: 10,
                    letterSpacing: '.24em',
                    textTransform: 'uppercase',
                    color: 'var(--c-pen)',
                    marginBottom: 6,
                  }}
                >
                  no. {String(idx + 1).padStart(2, '0')}
                </div>
                <p
                  style={{
                    fontFamily: 'var(--c-font-body)',
                    fontSize: 17,
                    lineHeight: 1.7,
                    color: 'var(--c-ink)',
                    margin: 0,
                    maxWidth: '44ch',
                  }}
                >
                  {m.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ZinePage>

      {/* 05 BACK COVER */}
      <ZinePage pageNumber="— 05 / back cover —" rotate={-0.8} tapeLeft={-5} tapeRight={4}>
        <div style={{ textAlign: 'center' }}>
          <Stamp variant="outline" size="sm" rotate={-2} style={{ marginBottom: 22 }}>
            thanks for reading
          </Stamp>

          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontStyle: 'italic',
              fontSize: 18,
              lineHeight: 1.7,
              color: 'var(--c-ink)',
              margin: '0 auto',
              maxWidth: '42ch',
            }}
          >
            We folded this in half and mailed it to you on purpose. Write us back
            when something in here catches.
          </p>

          <MarginNote rotate={-1} size={30} style={{ display: 'block', marginTop: 28 }}>
            {'\u2014'} shawn &amp; dan
          </MarginNote>

          <div
            style={{
              marginTop: 36,
              paddingTop: 24,
              borderTop: '1px dashed var(--c-line)',
              display: 'flex',
              justifyContent: 'center',
              gap: 16,
              flexWrap: 'wrap',
              fontFamily: 'var(--c-font-display)',
              fontSize: 10,
              letterSpacing: '.24em',
              textTransform: 'uppercase',
              color: 'var(--c-ink-muted)',
            }}
          >
            <span>read-only share</span>
            <span>made with mykeepsakes</span>
          </div>
        </div>
      </ZinePage>

      <style>{`
        @media (max-width: 560px) {
          .zine-moment {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 420px) {
          .zine-page {
            transform: none !important;
          }
        }
      `}</style>
    </main>
  );
}

function PersonRow({
  name,
  context,
  detail,
}: {
  name: string;
  context: string;
  detail: string;
}) {
  return (
    <li
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'baseline',
        gap: 14,
        padding: '14px 0',
        borderBottom: '1px dashed var(--c-line)',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--c-font-body)',
            fontSize: 18,
            fontWeight: 500,
            color: 'var(--c-ink)',
            lineHeight: 1.35,
          }}
        >
          {name}
        </div>
        {context && (
          <div
            style={{
              fontFamily: 'var(--c-font-body)',
              fontStyle: 'italic',
              fontSize: 15,
              color: 'var(--c-ink-muted)',
              marginTop: 2,
              lineHeight: 1.45,
            }}
          >
            {context}
          </div>
        )}
      </div>
      {detail && (
        <span
          style={{
            fontFamily: 'var(--c-font-display)',
            fontSize: 10,
            letterSpacing: '.22em',
            textTransform: 'uppercase',
            color: 'var(--c-pen)',
            whiteSpace: 'nowrap',
          }}
        >
          {detail}
        </span>
      )}
    </li>
  );
}

const ZineHeading: CSSProperties = {
  fontFamily: 'var(--c-font-body)',
  fontSize: 'clamp(22px, 3vw, 28px)',
  fontWeight: 500,
  letterSpacing: '-.01em',
  color: 'var(--c-ink)',
  margin: '0 0 4px',
  lineHeight: 1.25,
  maxWidth: '22ch',
};

const ZineSubnote: CSSProperties = {
  fontFamily: 'var(--c-font-body)',
  fontStyle: 'italic',
  fontSize: 15,
  color: 'var(--c-ink-muted)',
  margin: '10px 0 0',
  lineHeight: 1.6,
  maxWidth: '48ch',
};
