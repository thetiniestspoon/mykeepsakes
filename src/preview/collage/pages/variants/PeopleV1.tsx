/**
 * People V1 — Rolodex Cards.
 *
 * A grid of paper "business cards" for the trip's connections. Each card carries
 * a Rubik Mono One category stamp (SPEAKER / CHAPLAIN / ORGANIZER / GUEST), an
 * IBM Plex Serif name with italic organization, a Caveat "met_context" note
 * scribbled across the bottom, and a small tape strip at the top. Cards get a
 * mild ±rotation for the shuffle feel; hover lifts + blooms the shadow.
 *
 * Data source: useConnections(trip.id) from @/hooks/use-connections.
 * Grouping: people whose category or met_context reads as "presenter" bubble
 * up, then organizers, then everyone else.
 */
import { useEffect, useMemo, useState } from 'react';
import { useActiveTrip } from '@/hooks/use-trip';
import { useConnections } from '@/hooks/use-connections';
import { Stamp } from '../../ui/Stamp';
import { Tape } from '../../ui/Tape';
import { MarginNote } from '../../ui/MarginNote';
import type { Connection } from '@/types/conference';

type CategoryKey = 'speaker' | 'chaplain' | 'organizer' | 'transport' | 'other';

function categoryOf(c: Connection): CategoryKey {
  const cat = (c.category ?? '').toLowerCase();
  if (cat.includes('speaker') || cat.includes('presenter') || cat.includes('facilitator')) return 'speaker';
  if (cat.includes('chaplain')) return 'chaplain';
  if (cat.includes('organizer') || cat.includes('organiser') || cat.includes('host')) return 'organizer';
  if (cat.includes('transport') || cat.includes('driver')) return 'transport';
  return 'other';
}

function isPresenter(c: Connection): boolean {
  // family_contacts has no speaker_session/session_title columns; infer from
  // category + met_context content.
  if (categoryOf(c) === 'speaker') return true;
  const ctx = (c.met_context ?? '').toLowerCase();
  return /session|workshop|plenary|keynote|panel|presented|taught|led/.test(ctx);
}

function groupRank(c: Connection): number {
  if (isPresenter(c)) return 0;
  const k = categoryOf(c);
  if (k === 'organizer') return 1;
  if (k === 'chaplain') return 2;
  if (k === 'transport') return 4;
  return 3;
}

const CATEGORY_STAMP: Record<CategoryKey, { label: string; variant: 'ink' | 'pen' | 'outline' }> = {
  speaker:   { label: '★ SPEAKER',   variant: 'ink' },
  chaplain:  { label: '✚ CHAPLAIN',  variant: 'pen' },
  organizer: { label: '◆ ORGANIZER', variant: 'ink' },
  transport: { label: '➜ TRANSPORT', variant: 'outline' },
  other:     { label: '· GUEST',     variant: 'outline' },
};

// Rotation "house range" — deterministic off the id so re-renders don't jitter.
function rotateFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) | 0;
  const r = ((h % 11) - 5) * 0.6; // −3.0 .. +3.0
  return Number(r.toFixed(2));
}

function truncate(s: string | null | undefined, max: number): string {
  if (!s) return '';
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trimEnd()}…`;
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

export function PeopleV1() {
  const { data: trip } = useActiveTrip();
  const { data: connections = [], isLoading } = useConnections(trip?.id);
  const reduced = useReducedMotion();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return [...connections].sort((a, b) => {
      const r = groupRank(a) - groupRank(b);
      if (r !== 0) return r;
      return (a.name ?? '').localeCompare(b.name ?? '');
    });
  }, [connections]);

  return (
    <main
      style={{
        padding: 'clamp(32px, 4vw, 56px) clamp(24px, 5vw, 64px) 80px',
        minHeight: 'calc(100vh - 120px)',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, marginBottom: 36 }}>
        <div>
          <Stamp variant="outline" size="sm" rotate={reduced ? 0 : -2} style={{ marginBottom: 14 }}>
            the rolodex
          </Stamp>
          <h1 style={{ fontFamily: 'var(--c-font-body)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 500, margin: 0, lineHeight: 1.05 }}>
            People met
          </h1>
          <p style={{ fontFamily: 'var(--c-font-body)', fontStyle: 'italic', color: 'var(--c-ink-muted)', margin: '6px 0 0', fontSize: 16 }}>
            {trip?.title ?? 'This trip'}
            {sorted.length > 0 && ` · ${sorted.length} card${sorted.length === 1 ? '' : 's'}`}
          </p>
        </div>
      </header>

      {!trip && (
        <div style={{ padding: 40 }}>
          <Stamp size="md" variant="outline">No active trip</Stamp>
        </div>
      )}

      {trip && !isLoading && sorted.length === 0 && (
        <div
          style={{
            position: 'relative',
            background: 'var(--c-paper)',
            boxShadow: 'var(--c-shadow)',
            padding: '40px 32px',
            maxWidth: 480,
          }}
        >
          <Tape position="top" rotate={reduced ? 0 : -3} />
          <p style={{ fontFamily: 'var(--c-font-body)', fontSize: 16, color: 'var(--c-ink-muted)', margin: 0 }}>
            Nobody in the rolodex yet.
          </p>
          <MarginNote rotate={reduced ? 0 : -4} size={22} style={{ display: 'block', marginTop: 14 }}>
            — add the first card after session 1
          </MarginNote>
        </div>
      )}

      {sorted.length > 0 && (
        <div
          className="people-v1-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 28,
            paddingTop: 12,
          }}
        >
          {sorted.map((c, i) => {
            const key = categoryOf(c);
            const stamp = CATEGORY_STAMP[key];
            const rot = reduced ? 0 : rotateFor(c.id);
            const isHovered = hoveredId === c.id;
            return (
              <article
                key={c.id}
                className="collage-enter people-v1-card"
                onMouseEnter={() => setHoveredId(c.id)}
                onMouseLeave={() => setHoveredId(prev => (prev === c.id ? null : prev))}
                style={{
                  position: 'relative',
                  background: 'var(--c-paper)',
                  boxShadow: isHovered
                    ? '0 16px 34px -10px rgba(29, 29, 27, 0.32)'
                    : 'var(--c-shadow)',
                  padding: '26px 22px 56px',
                  minHeight: 200,
                  transform: reduced
                    ? 'none'
                    : `rotate(${rot}deg) ${isHovered ? 'translateY(-4px)' : 'translateY(0)'}`,
                  transformOrigin: 'center',
                  transition:
                    'transform var(--c-t-fast) var(--c-ease-out), box-shadow var(--c-t-fast) var(--c-ease-out)',
                  ['--c-rot' as never]: `${rot}deg`,
                  animationDelay: reduced ? undefined : `${Math.min(i, 16) * 35}ms`,
                }}
              >
                <Tape
                  position="top-left"
                  rotate={reduced ? 0 : (i % 2 === 0 ? -7 : 5)}
                  width={64}
                />
                <div style={{ position: 'absolute', top: 14, right: 14 }}>
                  <Stamp
                    variant={stamp.variant}
                    size="sm"
                    rotate={reduced ? 0 : (i % 2 === 0 ? 3 : -3)}
                  >
                    {stamp.label}
                  </Stamp>
                </div>

                <div style={{ marginTop: 34 }}>
                  <h2
                    style={{
                      fontFamily: 'var(--c-font-body)',
                      fontSize: 20,
                      fontWeight: 500,
                      margin: 0,
                      lineHeight: 1.2,
                      color: 'var(--c-ink)',
                      // allow two lines then ellipsis
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                    title={c.name}
                  >
                    {c.name}
                  </h2>
                  {c.organization && (
                    <p
                      style={{
                        fontFamily: 'var(--c-font-body)',
                        fontStyle: 'italic',
                        fontSize: 14,
                        color: 'var(--c-ink-muted)',
                        margin: '4px 0 0',
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                      title={c.organization}
                    >
                      {truncate(c.organization, 80)}
                    </p>
                  )}
                </div>

                {(c.email || c.phone) && (
                  <div
                    style={{
                      marginTop: 14,
                      display: 'flex',
                      gap: 12,
                      flexWrap: 'wrap',
                      fontFamily: 'var(--c-font-display)',
                      fontSize: 9,
                      letterSpacing: '.18em',
                      color: 'var(--c-ink-muted)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {c.email && (
                      <span
                        style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={c.email}
                      >
                        ✉ {truncate(c.email, 28)}
                      </span>
                    )}
                    {c.phone && <span>☎ {c.phone}</span>}
                  </div>
                )}

                {c.met_context && (
                  <MarginNote
                    rotate={reduced ? 0 : (i % 2 === 0 ? -3 : 2)}
                    size={18}
                    style={{
                      position: 'absolute',
                      left: 22,
                      right: 22,
                      bottom: 16,
                      display: 'block',
                      borderTop: '1px dashed var(--c-line)',
                      paddingTop: 10,
                      // truncate handwriting to one line-ish
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      transform: reduced ? 'none' : `rotate(${i % 2 === 0 ? -1.5 : 1}deg)`,
                    }}
                  >
                    {truncate(c.met_context, 60)}
                  </MarginNote>
                )}
              </article>
            );
          })}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .people-v1-grid { grid-template-columns: 1fr !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .people-v1-card { transform: none !important; }
        }
      `}</style>
    </main>
  );
}
