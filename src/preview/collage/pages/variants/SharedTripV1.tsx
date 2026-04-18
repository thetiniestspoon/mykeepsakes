import { useMemo } from 'react';
import { useActiveTrip } from '@/hooks/use-trip';
import { useItineraryItems } from '@/hooks/use-itinerary';
import { useMemories } from '@/hooks/use-memories';
import { useDispatches } from '@/hooks/use-dispatches';
import { Stamp } from '../../ui/Stamp';
import { StickerPill } from '../../ui/StickerPill';
import { PolaroidCard, resolveMood } from '../../ui/PolaroidCard';
import { MarginNote } from '../../ui/MarginNote';
import { Tape } from '../../ui/Tape';
import type { ItineraryItem, Memory } from '@/types/trip';

/**
 * Shared Trip V1 — Single Long Letter.
 *
 * Read-only public surface at /shared/:token. Composed as one vertical
 * letter a non-authenticated visitor is reading — not an app.
 *
 * Sections (top to bottom):
 *   HEADER   — Rubik Mono stamp "From Shawn & Dan" + trip title + dates.
 *   INTRO    — Caveat opener + IBM Plex italic paragraph framed as a personal note.
 *   MOMENTS  — 3 fanned polaroids from the itinerary.
 *   PULL     — A dispatch excerpt rendered as a pull-quote. Synthesizes from
 *              a worship/opening item when no dispatch exists yet.
 *   SCHEDULE — 3–4 key sessions at a glance (time + title + speaker).
 *   CLOSING  — Caveat sign-off + StickerPill "a trip we'll be carrying home a while."
 *   FOOTER   — small Rubik Mono attribution + "made with MyKeepsakes" credit.
 *
 * No navigation, no capture FAB, no PIN chrome. No new packages.
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

function fmtDayLabel(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function SharedTripV1() {
  const { data: trip } = useActiveTrip();
  const { data: allItems = [] } = useItineraryItems(trip?.id);
  const { data: memories = [] } = useMemories(trip?.id);
  const { data: dispatches = [] } = useDispatches(trip?.id);

  // Three photocards — take the first 3 timed items so they read like key moments.
  const moments = useMemo<ItineraryItem[]>(() => {
    return allItems.filter(i => i.start_time).slice(0, 3);
  }, [allItems]);

  // Pull-quote source: real dispatch first, fall back to a reflection memory,
  // else synthesize using a worship/opening session.
  const pullSource = useMemo<
    | { kind: 'dispatch'; dispatch: Memory }
    | { kind: 'memory'; memory: Memory }
    | { kind: 'synth'; item: ItineraryItem }
    | null
  >(() => {
    if (dispatches.length > 0) return { kind: 'dispatch', dispatch: dispatches[0] };
    const reflection = memories.find(m => m.memory_type === 'reflection' && m.note);
    if (reflection) return { kind: 'memory', memory: reflection };
    const item =
      allItems.find(i => i.category === 'worship' && i.speaker) ??
      allItems.find(i => i.category === 'workshop' && i.speaker) ??
      allItems.find(i => i.speaker) ??
      allItems[0];
    if (item) return { kind: 'synth', item };
    return null;
  }, [dispatches, memories, allItems]);

  // Schedule highlights — first 4 timed sessions with a speaker or clear title.
  const highlights = useMemo<ItineraryItem[]>(() => {
    const timed = allItems.filter(i => i.start_time);
    const withSpeaker = timed.filter(i => i.speaker);
    const base = withSpeaker.length >= 4 ? withSpeaker : timed;
    return base.slice(0, 4);
  }, [allItems]);

  if (!trip) {
    return (
      <div style={{ padding: 80, fontFamily: 'var(--c-font-body)', color: 'var(--c-ink-muted)' }}>
        Loading{'\u2026'}
      </div>
    );
  }

  const pullBody =
    pullSource?.kind === 'dispatch'
      ? pullSource.dispatch.note ??
        'A line we wanted to keep from this week — the kind you write down before you forget it.'
      : pullSource?.kind === 'memory'
      ? pullSource.memory.note ?? ''
      : 'We came in to go back and fetch it — and the opening session already handed us something to carry. A reminder that the work we are learning is older than any of us in the room.';

  const pullAttr =
    pullSource?.kind === 'dispatch'
      ? `dispatch \u00b7 ${fmtDayLabel(pullSource.dispatch.day?.date) || trip.location_name || 'in the room'}`
      : pullSource?.kind === 'memory'
      ? `reflection \u00b7 ${fmtDayLabel(pullSource.memory.day?.date) || 'this week'}`
      : pullSource?.kind === 'synth'
      ? `${pullSource.item.speaker ?? 'opening session'} \u00b7 ${pullSource.item.title}`
      : '';

  const isSynth = pullSource?.kind === 'synth';

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: 'clamp(28px, 5vw, 72px) clamp(20px, 5vw, 56px) 96px',
        display: 'grid',
        placeItems: 'start center',
        fontFamily: 'var(--c-font-body)',
      }}
    >
      {/* Attribution strip — unobtrusive, sits above the letter */}
      <div
        style={{
          width: '100%',
          maxWidth: 680,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'var(--c-font-display)',
          fontSize: 10,
          letterSpacing: '.24em',
          textTransform: 'uppercase',
          color: 'var(--c-ink-muted)',
          marginBottom: 28,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <span>sent by shawn &amp; dan</span>
        <span aria-hidden>{'\u00b7'}</span>
        <span>beacon uu</span>
        <span aria-hidden>{'\u00b7'}</span>
        <span>sankofa cpe 2026</span>
      </div>

      <article
        style={{
          width: '100%',
          maxWidth: 680,
          background: 'var(--c-paper)',
          boxShadow: 'var(--c-shadow)',
          padding: 'clamp(28px, 5vw, 64px) clamp(24px, 5vw, 56px) clamp(32px, 5vw, 64px)',
          position: 'relative',
        }}
      >
        <Tape position="top-left" rotate={-7} width={72} />
        <Tape position="top-right" rotate={5} width={72} />

        {/* HEADER */}
        <header style={{ marginBottom: 32 }}>
          <Stamp variant="outline" size="sm" rotate={-2} style={{ marginBottom: 18 }}>
            from shawn &amp; dan
          </Stamp>

          <h1
            style={{
              fontFamily: 'var(--c-font-display)',
              fontSize: 'clamp(32px, 5.2vw, 56px)',
              lineHeight: 0.98,
              letterSpacing: '-.015em',
              margin: 0,
              maxWidth: '14ch',
              color: 'var(--c-ink)',
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
              margin: '14px 0 0',
              lineHeight: 1.5,
            }}
          >
            {fmtDateRange(trip.start_date, trip.end_date)}
            {trip.location_name ? ` \u00b7 ${trip.location_name}` : ''}
          </p>
        </header>

        {/* INTRO */}
        <section style={{ marginBottom: 44 }}>
          <MarginNote rotate={-2} size={26} style={{ display: 'block', marginBottom: 10 }}>
            hi {'\u2014'}
          </MarginNote>

          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontStyle: 'italic',
              fontSize: 18,
              lineHeight: 1.75,
              color: 'var(--c-ink)',
              margin: 0,
              maxWidth: '54ch',
            }}
          >
            A few things we wanted you to see from this week. Not a full report{' '}
            {'\u2014'} more like the pages we dog-eared. Take what you like; the rest will keep.
          </p>
        </section>

        {/* MOMENTS */}
        <section style={{ marginBottom: 56 }}>
          <Stamp variant="ink" size="sm" rotate={-1} style={{ marginBottom: 18 }}>
            three we kept
          </Stamp>

          <div
            className="letter-moments"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end',
              gap: 'clamp(6px, 2vw, 18px)',
              minHeight: 260,
              paddingTop: 14,
              paddingBottom: 8,
            }}
          >
            {moments[0] && (
              <PolaroidCard
                mood={resolveMood(moments[0].category, moments[0].start_time)}
                rotate={-6}
                size="sm"
                entrance
                entranceDelayMs={0}
                tape
                caption={truncate(moments[0].title, 28)}
                overline={moments[0].start_time?.slice(0, 5) ?? ''}
                style={{ marginBottom: 10 }}
              />
            )}
            {moments[1] && (
              <PolaroidCard
                mood={resolveMood(moments[1].category, moments[1].start_time)}
                rotate={2}
                size="sm"
                entrance
                entranceDelayMs={80}
                tape
                caption={truncate(moments[1].title, 28)}
                overline={moments[1].start_time?.slice(0, 5) ?? ''}
                style={{ zIndex: 2 }}
              />
            )}
            {moments[2] && (
              <PolaroidCard
                mood={resolveMood(moments[2].category, moments[2].start_time)}
                rotate={6}
                size="sm"
                entrance
                entranceDelayMs={160}
                tape
                caption={truncate(moments[2].title, 28)}
                overline={moments[2].start_time?.slice(0, 5) ?? ''}
                style={{ marginBottom: 10 }}
              />
            )}
            {moments.length === 0 && (
              <p
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontStyle: 'italic',
                  color: 'var(--c-ink-muted)',
                  margin: 0,
                }}
              >
                Photos will appear here once the first sessions begin.
              </p>
            )}
          </div>
        </section>

        {/* PULL QUOTE */}
        {pullSource && (
          <section
            style={{
              marginBottom: 56,
              padding: '28px 28px 24px',
              borderLeft: '3px solid var(--c-pen)',
              background: 'rgba(31, 60, 198, 0.04)',
              position: 'relative',
            }}
          >
            <span
              aria-hidden
              style={{
                position: 'absolute',
                top: -10,
                left: 24,
                fontFamily: 'var(--c-font-display)',
                fontSize: 10,
                letterSpacing: '.24em',
                textTransform: 'uppercase',
                padding: '4px 10px',
                background: 'var(--c-paper)',
                color: 'var(--c-pen)',
              }}
            >
              {isSynth ? 'from the opening' : 'from our dispatch'}
            </span>

            <p
              style={{
                fontFamily: 'var(--c-font-body)',
                fontStyle: 'italic',
                fontSize: 18,
                lineHeight: 1.7,
                color: 'var(--c-ink)',
                margin: 0,
                maxWidth: '52ch',
              }}
            >
              &ldquo;{pullBody}&rdquo;
            </p>

            {pullAttr && (
              <p
                style={{
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 10,
                  letterSpacing: '.22em',
                  textTransform: 'uppercase',
                  color: 'var(--c-ink-muted)',
                  margin: '16px 0 0',
                }}
              >
                {'\u2014'} {pullAttr}
              </p>
            )}
          </section>
        )}

        {/* SCHEDULE */}
        {highlights.length > 0 && (
          <section style={{ marginBottom: 56 }}>
            <Stamp variant="outline" size="sm" rotate={-1} style={{ marginBottom: 18 }}>
              schedule at a glance
            </Stamp>

            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                borderTop: '1px dashed var(--c-line)',
              }}
            >
              {highlights.map(h => (
                <li
                  key={h.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '88px 1fr',
                    columnGap: 20,
                    padding: '14px 0',
                    borderBottom: '1px dashed var(--c-line)',
                    alignItems: 'baseline',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--c-font-display)',
                      fontSize: 11,
                      letterSpacing: '.22em',
                      textTransform: 'uppercase',
                      color: 'var(--c-pen)',
                      lineHeight: 1.2,
                    }}
                  >
                    {h.start_time ? h.start_time.slice(0, 5) : '\u2014'}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: 'var(--c-font-body)',
                        fontSize: 17,
                        fontWeight: 500,
                        lineHeight: 1.4,
                        color: 'var(--c-ink)',
                      }}
                    >
                      {h.title}
                    </div>
                    {h.speaker && (
                      <div
                        style={{
                          fontFamily: 'var(--c-font-body)',
                          fontStyle: 'italic',
                          fontSize: 15,
                          color: 'var(--c-ink-muted)',
                          marginTop: 2,
                        }}
                      >
                        with {h.speaker.split(/[,(]/)[0].trim()}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* CLOSING */}
        <section
          style={{
            marginTop: 24,
            paddingTop: 28,
            borderTop: '1px solid var(--c-line)',
          }}
        >
          <MarginNote rotate={-1} size={28} style={{ display: 'block', marginBottom: 14 }}>
            {'\u2014'} shawn &amp; dan
          </MarginNote>

          <StickerPill variant="tape" rotate={-1}>
            a trip we&rsquo;ll be carrying home a while
          </StickerPill>
        </section>
      </article>

      {/* FOOTER */}
      <footer
        style={{
          width: '100%',
          maxWidth: 680,
          marginTop: 36,
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
        <span>read-only share</span>
        <span>made with mykeepsakes</span>
      </footer>

      <style>{`
        @media (max-width: 640px) {
          .letter-moments {
            flex-wrap: wrap;
            min-height: auto;
          }
        }
      `}</style>
    </main>
  );
}
