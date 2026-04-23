import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getMemoryMediaUrl } from '@/hooks/use-memories';
import { CollageRoot } from '@/preview/collage/CollageRoot';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { StickerPill } from '@/preview/collage/ui/StickerPill';
import { MarginNote } from '@/preview/collage/ui/MarginNote';
import { Tape } from '@/preview/collage/ui/Tape';
import type { Memory, ItineraryDay } from '@/types/trip';
import type { DispatchItem } from '@/types/conference';

/**
 * SharedDispatch — public dispatch/digest page at /shared-dispatch/:token/:id
 *
 * Phase 4 #11: the PAGE CHROME around the dispatch is migrated to Collage
 * (header, meta strip, loading/error/empty states, print styles, footer).
 * The inner dispatch body (Scene / Insights / Closing) is restyled with
 * Collage tokens only — a fuller composition-surface restyle of the
 * dispatch body itself is tracked under Phase 4 #3.
 *
 * Token-based data fetching preserved. No useActiveTrip — all data comes
 * from the `useSharedDispatch(token, dispatchId)` query below.
 *
 * Print-friendly: FAB-less, header + footer collapse to plain text,
 * ink-on-crème contrast retained. Respects prefers-reduced-motion.
 */

interface DispatchData {
  dispatch: Memory & { day: ItineraryDay | null };
  items: DispatchItem[];
  photos: Memory[];
  reflections: Memory[];
  tripTitle: string;
  tripShareToken: string | null;
}

// ── data hook (token-scoped, no auth) ─────────────────────────────────────────

function useSharedDispatch(token: string | undefined, dispatchId: string | undefined) {
  return useQuery<DispatchData>({
    queryKey: ['shared-dispatch', token, dispatchId],
    queryFn: async () => {
      if (!token || !dispatchId) throw new Error('Missing token or dispatch id');

      // 1. Validate token — must match dispatch_id
      const { data: link, error: linkError } = await supabase
        .from('trip_share_links')
        .select('*')
        .eq('token', token)
        .eq('dispatch_id', dispatchId)
        .single();

      if (linkError || !link) throw new Error('Invalid or not found');

      // 2. Check expiry
      if (link.expires_at && new Date(link.expires_at) < new Date()) {
        throw new Error('expired');
      }

      // 3. Fetch dispatch memory + day join
      const { data: dispatch, error: dispatchError } = await supabase
        .from('memories')
        .select('*, day:itinerary_days(*)')
        .eq('id', dispatchId)
        .single();

      if (dispatchError || !dispatch) throw new Error('Dispatch not found');

      // 4. Fetch dispatch items
      const { data: items, error: itemsError } = await supabase
        .from('dispatch_items')
        .select('*')
        .eq('dispatch_id', dispatchId)
        .order('section')
        .order('sort_order');

      if (itemsError) throw itemsError;

      // 5. Resolve referenced memories (photos + reflections)
      const photoIds = (items as DispatchItem[])
        .filter((i) => i.item_type === 'photo' || i.section === 'scene')
        .map((i) => i.item_id);

      const reflectionIds = (items as DispatchItem[])
        .filter((i) => i.item_type === 'reflection' || i.section === 'insight')
        .map((i) => i.item_id);

      const allIds = [...new Set([...photoIds, ...reflectionIds])];

      let photos: Memory[] = [];
      let reflections: Memory[] = [];

      if (allIds.length > 0) {
        const { data: memories, error: memError } = await supabase
          .from('memories')
          .select('*, media:memory_media(*)')
          .in('id', allIds);

        if (memError) throw memError;

        const photoSet = new Set(photoIds);
        const reflectionSet = new Set(reflectionIds);

        photos = ((memories ?? []) as Memory[])
          .filter((m) => photoSet.has(m.id))
          .sort(
            (a, b) =>
              ((items as DispatchItem[]).find((i) => i.item_id === a.id)?.sort_order ?? 0) -
              ((items as DispatchItem[]).find((i) => i.item_id === b.id)?.sort_order ?? 0),
          );

        reflections = ((memories ?? []) as Memory[])
          .filter((m) => reflectionSet.has(m.id))
          .sort(
            (a, b) =>
              ((items as DispatchItem[]).find((i) => i.item_id === a.id)?.sort_order ?? 0) -
              ((items as DispatchItem[]).find((i) => i.item_id === b.id)?.sort_order ?? 0),
          );
      }

      // 6. Fetch trip title
      const { data: trip } = await supabase
        .from('trips')
        .select('title')
        .eq('id', link.trip_id)
        .single();

      // 7. Check for a trip-level share link (no dispatch_id = trip-level)
      const { data: tripShareLink } = await supabase
        .from('trip_share_links')
        .select('token')
        .eq('trip_id', link.trip_id)
        .is('dispatch_id', null)
        .maybeSingle();

      return {
        dispatch: dispatch as Memory & { day: ItineraryDay | null },
        items: (items ?? []) as DispatchItem[],
        photos,
        reflections,
        tripTitle: trip?.title ?? 'Trip',
        tripShareToken: tripShareLink?.token ?? null,
      };
    },
    enabled: !!token && !!dispatchId,
    retry: false,
  });
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function SharedDispatch() {
  const { token, id } = useParams<{ token: string; id: string }>();
  const { data, isLoading, error } = useSharedDispatch(token, id);

  // ── loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
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
              loading dispatch
            </Stamp>
            <MarginNote rotate={-2} size={26} style={{ display: 'block' }}>
              one moment{'…'}
            </MarginNote>
          </div>
        </div>
      </CollageRoot>
    );
  }

  // ── error / invalid ───────────────────────────────────────────────────────
  if (error || !data) {
    const isExpired = (error as Error | undefined)?.message?.includes('expired');
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
              Unable to open this dispatch
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
                : 'This dispatch link is invalid or no longer available.'}
            </p>
          </article>
        </div>
      </CollageRoot>
    );
  }

  const { dispatch, photos, reflections, tripTitle, tripShareToken } = data;
  const day = dispatch.day;
  const dayLabel = day?.title ?? day?.date ?? 'Day';
  const closingNote = dispatch.note;
  const hasContent =
    photos.length > 0 || reflections.length > 0 || (closingNote && closingNote.trim().length > 0);

  return (
    <CollageRoot>
      <main
        className="shared-dispatch"
        style={{
          minHeight: '100vh',
          padding: 'clamp(24px, 4vw, 56px) clamp(16px, 4vw, 40px) 96px',
          display: 'grid',
          placeItems: 'start center',
          fontFamily: 'var(--c-font-body)',
        }}
      >
        {/* Attribution / meta strip */}
        <div
          className="shared-dispatch-meta"
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
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <span>a dispatch from</span>
          <span aria-hidden>{'·'}</span>
          <span>{tripTitle.toLowerCase()}</span>
          <span aria-hidden>{'·'}</span>
          <span>read-only</span>
        </div>

        <article
          className="shared-dispatch-article"
          style={{
            width: '100%',
            maxWidth: 640,
            background: 'var(--c-paper)',
            boxShadow: 'var(--c-shadow)',
            padding:
              'clamp(24px, 4vw, 56px) clamp(20px, 4vw, 48px) clamp(28px, 4vw, 56px)',
            position: 'relative',
          }}
        >
          <Tape position="top-left" rotate={-7} width={72} />
          <Tape position="top-right" rotate={5} width={72} />

          {/* HEADER / PAGE CHROME */}
          <header style={{ marginBottom: 32 }}>
            <Stamp variant="outline" size="sm" rotate={-2} style={{ marginBottom: 16 }}>
              dispatch
            </Stamp>

            <h1
              style={{
                fontFamily: 'var(--c-font-display)',
                fontSize: 'clamp(26px, 4vw, 40px)',
                lineHeight: 1,
                letterSpacing: '-.01em',
                margin: 0,
                color: 'var(--c-ink)',
              }}
            >
              {dayLabel}
            </h1>

            <p
              style={{
                fontFamily: 'var(--c-font-body)',
                fontStyle: 'italic',
                fontSize: 16,
                color: 'var(--c-ink-muted)',
                margin: '10px 0 0',
                lineHeight: 1.5,
              }}
            >
              {tripTitle}
            </p>

            {/* Print/save affordance — only visible on-screen */}
            <div
              className="shared-dispatch-actions"
              style={{
                marginTop: 18,
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  display: 'inline-block',
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 10,
                  letterSpacing: '.22em',
                  textTransform: 'uppercase',
                  padding: '8px 14px',
                  borderRadius: 'var(--c-r-sm)',
                  border: '1.5px dashed var(--c-pen)',
                  background: 'transparent',
                  color: 'var(--c-pen)',
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >
                print / save
              </button>
            </div>
          </header>

          {/* BODY: Scene / Insights / Closing — Collage-token restyle only */}

          {photos.length > 0 && (
            <section style={{ marginBottom: 40 }}>
              <Stamp variant="ink" size="sm" rotate={-1} style={{ marginBottom: 14 }}>
                scene
              </Stamp>
              <div
                className="shared-dispatch-photos"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: 10,
                }}
              >
                {photos.map((photo) => {
                  const firstMedia = photo.media?.[0];
                  if (!firstMedia) return null;
                  const url = getMemoryMediaUrl(firstMedia.storage_path);
                  return (
                    <div
                      key={photo.id}
                      style={{
                        aspectRatio: '1 / 1',
                        background: 'var(--c-paper)',
                        padding: 8,
                        boxShadow: 'var(--c-shadow)',
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={url}
                        alt={photo.title ?? 'Photo'}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {reflections.length > 0 && (
            <section style={{ marginBottom: 40 }}>
              <Stamp variant="outline" size="sm" rotate={-1} style={{ marginBottom: 14 }}>
                insights
              </Stamp>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  borderTop: '1px dashed var(--c-line)',
                }}
              >
                {reflections.map((reflection) => (
                  <li
                    key={reflection.id}
                    style={{
                      padding: '14px 0',
                      borderBottom: '1px dashed var(--c-line)',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: 'var(--c-font-body)',
                        fontSize: 16,
                        lineHeight: 1.65,
                        color: 'var(--c-ink)',
                        margin: 0,
                      }}
                    >
                      {reflection.note}
                    </p>
                    {reflection.speaker && (
                      <p
                        style={{
                          fontFamily: 'var(--c-font-display)',
                          fontSize: 10,
                          letterSpacing: '.22em',
                          textTransform: 'uppercase',
                          color: 'var(--c-ink-muted)',
                          margin: '8px 0 0',
                        }}
                      >
                        {'—'} {reflection.speaker}
                        {reflection.session_title ? ` · ${reflection.session_title}` : ''}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {closingNote && (
            <section
              style={{
                marginBottom: 12,
                padding: '24px 24px 20px',
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
                  left: 20,
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 10,
                  letterSpacing: '.24em',
                  textTransform: 'uppercase',
                  padding: '4px 10px',
                  background: 'var(--c-paper)',
                  color: 'var(--c-pen)',
                }}
              >
                closing
              </span>
              <p
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontStyle: 'italic',
                  fontSize: 17,
                  lineHeight: 1.7,
                  color: 'var(--c-ink)',
                  margin: 0,
                  maxWidth: '52ch',
                }}
              >
                {closingNote}
              </p>
            </section>
          )}

          {!hasContent && (
            <section style={{ marginTop: 24 }}>
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
                This dispatch is still being composed. Come back in a bit.
              </p>
            </section>
          )}

          {/* CLOSING SIGN-OFF */}
          <section
            style={{
              marginTop: 32,
              paddingTop: 24,
              borderTop: '1px solid var(--c-line)',
            }}
          >
            <MarginNote rotate={-1} size={24} style={{ display: 'block', marginBottom: 12 }}>
              {'—'} thanks for reading
            </MarginNote>
            <StickerPill variant="tape" rotate={-1}>
              a dispatch from the road
            </StickerPill>
          </section>
        </article>

        {/* FOOTER */}
        <footer
          className="shared-dispatch-footer"
          style={{
            width: '100%',
            maxWidth: 640,
            marginTop: 32,
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
          <span>made with mykeepsakes</span>
          {tripShareToken && (
            <Link
              to={`/shared/${tripShareToken}`}
              style={{
                color: 'var(--c-pen)',
                textDecoration: 'none',
                borderBottom: '1px solid currentColor',
                paddingBottom: 1,
              }}
            >
              view full trip {'→'}
            </Link>
          )}
        </footer>

        <style>{`
          @media print {
            .shared-dispatch {
              padding: 0 !important;
              background: #fff !important;
            }
            .shared-dispatch-meta,
            .shared-dispatch-footer,
            .shared-dispatch-actions {
              display: none !important;
            }
            .shared-dispatch-article {
              box-shadow: none !important;
              max-width: 100% !important;
              padding: 16pt 8pt !important;
              background: #fff !important;
            }
            .shared-dispatch-article > span[aria-hidden="true"] {
              display: none !important;
            }
            .shared-dispatch-photos {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .shared-dispatch-photos > div {
              box-shadow: none !important;
              border: 1px solid #ccc;
            }
          }
        `}</style>
      </main>
    </CollageRoot>
  );
}
