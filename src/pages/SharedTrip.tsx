import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useValidateShareToken } from '@/hooks/use-sharing';
import { supabase } from '@/integrations/supabase/client';
import { CollageRoot } from '@/preview/collage/CollageRoot';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { StickerPill } from '@/preview/collage/ui/StickerPill';
import { PolaroidCard, resolveMood } from '@/preview/collage/ui/PolaroidCard';
import { MarginNote } from '@/preview/collage/ui/MarginNote';
import { Tape } from '@/preview/collage/ui/Tape';
import type { ItineraryDay, ItineraryItem, Location } from '@/types/trip';

/**
 * SharedTrip — public trip-sharing page at /shared/:token
 *
 * Migrated to the Collage "Single Long Letter" vocabulary (SharedTripV1).
 * Public (un-authenticated) visitors read the trip as a handwritten letter:
 * centered paper article, Rubik Mono stamps, IBM Plex Serif body, Caveat
 * salutations, fanned PolaroidCard moments, dashed-hairline schedule.
 *
 * Token-based data fetching is preserved — we do NOT use useActiveTrip here.
 * `useValidateShareToken(token)` gates access and returns the trip;
 * `useSharedTripData(tripId)` pulls days + items. No authenticated hooks.
 *
 * Print-friendly: decorative tape/transforms suppress under @media print,
 * fixed footer and read-only pill hide, ink-on-crème contrast preserved.
 * Respects prefers-reduced-motion (collage.css globally suppresses entrance
 * animations under that query).
 */

// ── data hook (token-scoped, no auth) ─────────────────────────────────────────

function useSharedTripData(tripId: string | undefined) {
  return useQuery({
    queryKey: ['shared-trip-data', tripId],
    queryFn: async () => {
      if (!tripId) throw new Error('No trip ID');

      const { data: days, error: daysError } = await supabase
        .from('itinerary_days')
        .select('*')
        .eq('trip_id', tripId)
        .order('date', { ascending: true });

      if (daysError) throw daysError;

      const { data: items, error: itemsError } = await supabase
        .from('itinerary_items')
        .select(`
          *,
          location:locations(*)
        `)
        .eq('trip_id', tripId)
        .order('sort_index', { ascending: true });

      if (itemsError) throw itemsError;

      return {
        days: days as ItineraryDay[],
        items: items as (ItineraryItem & { location: Location | null })[],
      };
    },
    enabled: !!tripId,
  });
}

// ── helpers (mirrors SharedTripV1) ────────────────────────────────────────────

function fmtDateRange(startISO: string, endISO: string): string {
  const s = new Date(startISO);
  const e = new Date(endISO);
  const monthLong = s.toLocaleString('en-US', { month: 'long' });
  const monthLongEnd = e.toLocaleString('en-US', { month: 'long' });
  const sameMonth = s.getMonth() === e.getMonth();
  const year = e.getFullYear();
  return sameMonth
    ? `${monthLong} ${s.getDate()}–${e.getDate()}, ${year}`
    : `${monthLong} ${s.getDate()} – ${monthLongEnd} ${e.getDate()}, ${year}`;
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function SharedTrip() {
  const { token } = useParams<{ token: string }>();
  const { data: shareData, isLoading: validating, error: validationError } =
    useValidateShareToken(token);

  const tripId = shareData?.trip?.id;
  const { data: tripData, isLoading: loadingData } = useSharedTripData(tripId);

  const items = tripData?.items ?? [];

  // Three polaroids — first 3 timed items.
  const moments = useMemo<ItineraryItem[]>(
    () => items.filter((i) => i.start_time).slice(0, 3),
    [items],
  );

  // Synth pull-quote source from a worship/workshop/speaker item.
  const pullItem = useMemo<ItineraryItem | null>(() => {
    return (
      items.find((i) => i.category === 'worship' && i.speaker) ??
      items.find((i) => i.category === 'workshop' && i.speaker) ??
      items.find((i) => i.speaker) ??
      items[0] ??
      null
    );
  }, [items]);

  // Schedule highlights — first 4 timed items, preferring those with a speaker.
  const highlights = useMemo<ItineraryItem[]>(() => {
    const timed = items.filter((i) => i.start_time);
    const withSpeaker = timed.filter((i) => i.speaker);
    const base = withSpeaker.length >= 4 ? withSpeaker : timed;
    return base.slice(0, 4);
  }, [items]);

  // ── loading ───────────────────────────────────────────────────────────────
  if (validating || loadingData) {
    return (
      <CollageRoot>
        <div
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: 40,
            fontFamily: 'var(--c-font-body)',
            color: 'var(--c-ink-muted)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <Stamp variant="outline" size="sm" rotate={-2} style={{ marginBottom: 14 }}>
              loading
            </Stamp>
            <MarginNote rotate={-2} size={26} style={{ display: 'block' }}>
              one moment{'…'}
            </MarginNote>
          </div>
        </div>
      </CollageRoot>
    );
  }

  // ── error ─────────────────────────────────────────────────────────────────
  if (validationError || !shareData) {
    const isExpired = (validationError as Error | undefined)?.message?.includes('expired');
    return (
      <CollageRoot>
        <div
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: 24,
            fontFamily: 'var(--c-font-body)',
          }}
        >
          <article
            style={{
              width: '100%',
              maxWidth: 420,
              background: 'var(--c-paper)',
              boxShadow: 'var(--c-shadow)',
              padding: '36px 28px 32px',
              position: 'relative',
              textAlign: 'center',
            }}
          >
            <Tape position="top-left" rotate={-6} width={64} />
            <Tape position="top-right" rotate={5} width={64} />
            <Stamp variant="outline" size="sm" rotate={-2} style={{ marginBottom: 18 }}>
              {isExpired ? 'link expired' : 'link not available'}
            </Stamp>
            <h2
              style={{
                fontFamily: 'var(--c-font-display)',
                fontSize: 20,
                letterSpacing: '-.01em',
                margin: '0 0 12px',
                color: 'var(--c-ink)',
              }}
            >
              Unable to open this trip
            </h2>
            <p
              style={{
                fontFamily: 'var(--c-font-body)',
                fontStyle: 'italic',
                fontSize: 16,
                color: 'var(--c-ink-muted)',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {isExpired
                ? 'This share link has expired. Ask the sender for a new one.'
                : 'This share link is invalid or no longer available.'}
            </p>
          </article>
        </div>
      </CollageRoot>
    );
  }

  const trip = shareData.trip;
  const pullBody =
    'We came in to go back and fetch it — and the opening already handed us something to carry. A reminder that the work we are learning is older than any of us in the room.';
  const pullAttr = pullItem
    ? `${pullItem.speaker ?? 'opening session'} · ${pullItem.title}`
    : '';

  return (
    <CollageRoot>
      <main
        className="shared-letter"
        style={{
          minHeight: '100vh',
          padding: 'clamp(28px, 5vw, 72px) clamp(20px, 5vw, 56px) 96px',
          display: 'grid',
          placeItems: 'start center',
          fontFamily: 'var(--c-font-body)',
        }}
      >
        {/* Attribution strip */}
        <div
          className="shared-attribution"
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
          <span>a letter from this trip</span>
          <span aria-hidden>{'·'}</span>
          <span>{trip.title.toLowerCase()}</span>
          <span aria-hidden>{'·'}</span>
          <span className="shared-readonly">read-only</span>
        </div>

        <article
          className="shared-letter-article"
          style={{
            width: '100%',
            maxWidth: 680,
            background: 'var(--c-paper)',
            boxShadow: 'var(--c-shadow)',
            padding:
              'clamp(28px, 5vw, 64px) clamp(24px, 5vw, 56px) clamp(32px, 5vw, 64px)',
            position: 'relative',
          }}
        >
          <Tape position="top-left" rotate={-7} width={72} />
          <Tape position="top-right" rotate={5} width={72} />

          {/* HEADER */}
          <header style={{ marginBottom: 32 }}>
            <Stamp variant="outline" size="sm" rotate={-2} style={{ marginBottom: 18 }}>
              from this trip
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
              {trip.location_name ? ` · ${trip.location_name}` : ''}
            </p>
          </header>

          {/* INTRO */}
          <section style={{ marginBottom: 44 }}>
            <MarginNote rotate={-2} size={26} style={{ display: 'block', marginBottom: 10 }}>
              hi {'—'}
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
              A few things we wanted you to see from this trip. Not a full report{' '}
              {'—'} more like the pages we dog-eared. Take what you like; the rest will keep.
            </p>
          </section>

          {/* MOMENTS — "the people / the days / what we saw" feel */}
          <section style={{ marginBottom: 56 }}>
            <Stamp variant="ink" size="sm" rotate={-1} style={{ marginBottom: 18 }}>
              what we saw
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
          {pullItem && (
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
                from the opening
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
                  {'—'} {pullAttr}
                </p>
              )}
            </section>
          )}

          {/* SCHEDULE */}
          {highlights.length > 0 && (
            <section style={{ marginBottom: 56 }}>
              <Stamp variant="outline" size="sm" rotate={-1} style={{ marginBottom: 18 }}>
                the days
              </Stamp>

              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  borderTop: '1px dashed var(--c-line)',
                }}
              >
                {highlights.map((h) => (
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
                      {h.start_time ? h.start_time.slice(0, 5) : '—'}
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
                      {h.location?.name && (
                        <div
                          style={{
                            fontFamily: 'var(--c-font-body)',
                            fontSize: 13,
                            color: 'var(--c-ink-muted)',
                            marginTop: 2,
                          }}
                        >
                          {h.location.name}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Empty: no items at all */}
          {items.length === 0 && (
            <section style={{ marginBottom: 40 }}>
              <Stamp variant="outline" size="sm" rotate={-2} style={{ marginBottom: 14 }}>
                not yet
              </Stamp>
              <p
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontStyle: 'italic',
                  fontSize: 17,
                  lineHeight: 1.7,
                  color: 'var(--c-ink-muted)',
                  margin: 0,
                }}
              >
                Pages will fill in as the trip unfolds. Come back in a day or two.
              </p>
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
              {'—'} thanks for reading
            </MarginNote>

            <StickerPill variant="tape" rotate={-1}>
              a trip we&rsquo;ll be carrying home a while
            </StickerPill>
          </section>
        </article>

        {/* FOOTER */}
        <footer
          className="shared-footer"
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
          @media print {
            .shared-letter {
              padding: 0 !important;
              background: #fff !important;
            }
            .shared-attribution,
            .shared-footer {
              color: #444 !important;
            }
            .shared-letter-article {
              box-shadow: none !important;
              max-width: 100% !important;
              padding: 16pt 8pt !important;
              background: #fff !important;
            }
            /* decorative tape hides under print */
            .shared-letter-article > span[aria-hidden="true"] {
              display: none !important;
            }
            /* flatten polaroid tilt so nothing clips the page */
            .collage-polaroid {
              transform: none !important;
              break-inside: avoid;
              page-break-inside: avoid;
              box-shadow: none !important;
              border: 1px solid #ccc;
            }
            .letter-moments {
              flex-wrap: wrap !important;
              min-height: auto !important;
              gap: 12pt !important;
            }
          }
        `}</style>
      </main>
    </CollageRoot>
  );
}
