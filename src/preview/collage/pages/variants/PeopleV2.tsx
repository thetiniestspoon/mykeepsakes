/**
 * People V2 — Who's Who Index.
 *
 * Editorial program-back-matter layout. Left column is a ruled alphabetical
 * index of surnames (Rubik Mono One on paper); right column is a detail panel
 * that reacts to which name is hovered/focused, rendering a larger "profile"
 * card with organization, met_context, email, phone, and (inferred) session
 * signal. Stamp header reads "WHO'S COMING" plus the trip title.
 *
 * Data source: useConnections(trip.id) from @/hooks/use-connections.
 * Prioritization for the default selection: presenters → organizers → others.
 * Hover state tracked via local useState; respects prefers-reduced-motion.
 */
import { useEffect, useMemo, useState } from 'react';
import { useActiveTrip } from '@/hooks/use-trip';
import { useConnections } from '@/hooks/use-connections';
import { Stamp } from '../../ui/Stamp';
import { Tape } from '../../ui/Tape';
import { MarginNote } from '../../ui/MarginNote';
import { StickerPill } from '../../ui/StickerPill';
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

function surnameOf(name: string | null | undefined): string {
  if (!name) return '';
  // last token, stripping punctuation
  const parts = name.trim().split(/\s+/);
  const last = parts[parts.length - 1] ?? '';
  return last.replace(/[.,]/g, '');
}

function initialOf(name: string | null | undefined): string {
  const s = surnameOf(name);
  return (s[0] ?? '?').toUpperCase();
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

const CATEGORY_LABEL: Record<CategoryKey, string> = {
  speaker: 'Speaker',
  chaplain: 'Chaplain',
  organizer: 'Organizer',
  transport: 'Transport',
  other: 'Guest',
};

export function PeopleV2() {
  const { data: trip } = useActiveTrip();
  const { data: connections = [], isLoading } = useConnections(trip?.id);
  const reduced = useReducedMotion();

  // Sort alphabetically by surname for the left index (keeps scanning sane).
  const alphabetical = useMemo(() => {
    return [...connections].sort((a, b) => {
      const s = surnameOf(a.name).localeCompare(surnameOf(b.name));
      if (s !== 0) return s;
      return (a.name ?? '').localeCompare(b.name ?? '');
    });
  }, [connections]);

  // Default selection: first presenter, then organizer, then first alpha entry.
  const defaultId = useMemo(() => {
    if (alphabetical.length === 0) return null;
    const ranked = [...alphabetical].sort((a, b) => groupRank(a) - groupRank(b));
    return ranked[0]?.id ?? alphabetical[0]?.id ?? null;
  }, [alphabetical]);

  const [activeId, setActiveId] = useState<string | null>(null);
  useEffect(() => {
    setActiveId(prev => (prev && alphabetical.some(c => c.id === prev) ? prev : defaultId));
  }, [alphabetical, defaultId]);

  const active: Connection | null = useMemo(() => {
    if (!activeId) return null;
    return alphabetical.find(c => c.id === activeId) ?? null;
  }, [alphabetical, activeId]);

  // Group the left index by initial letter with subheaders.
  const byLetter = useMemo(() => {
    const groups: { letter: string; entries: Connection[] }[] = [];
    let current: { letter: string; entries: Connection[] } | null = null;
    for (const c of alphabetical) {
      const l = initialOf(c.name);
      if (!current || current.letter !== l) {
        current = { letter: l, entries: [] };
        groups.push(current);
      }
      current.entries.push(c);
    }
    return groups;
  }, [alphabetical]);

  return (
    <main
      style={{
        padding: 'clamp(32px, 4vw, 56px) clamp(24px, 5vw, 64px) 80px',
        minHeight: 'calc(100vh - 120px)',
      }}
    >
      <header style={{ marginBottom: 36, display: 'flex', alignItems: 'baseline', gap: 18, flexWrap: 'wrap' }}>
        <Stamp variant="ink" size="lg" rotate={reduced ? 0 : -1.5}>
          WHO'S COMING
        </Stamp>
        <div>
          <h1 style={{ fontFamily: 'var(--c-font-body)', fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 500, margin: 0, lineHeight: 1.05 }}>
            {trip?.title ?? 'This trip'}
          </h1>
          <p style={{ fontFamily: 'var(--c-font-body)', fontStyle: 'italic', color: 'var(--c-ink-muted)', margin: '4px 0 0', fontSize: 14 }}>
            {alphabetical.length > 0
              ? `${alphabetical.length} name${alphabetical.length === 1 ? '' : 's'} in the index`
              : 'Program back matter'}
          </p>
        </div>
      </header>

      {!trip && (
        <div style={{ padding: 40 }}>
          <Stamp size="md" variant="outline">No active trip</Stamp>
        </div>
      )}

      {trip && !isLoading && alphabetical.length === 0 && (
        <div
          style={{
            position: 'relative',
            background: 'var(--c-paper)',
            boxShadow: 'var(--c-shadow)',
            padding: '40px 32px',
            maxWidth: 520,
          }}
        >
          <Tape position="top" rotate={reduced ? 0 : -3} />
          <p style={{ fontFamily: 'var(--c-font-body)', fontSize: 16, color: 'var(--c-ink-muted)', margin: 0 }}>
            The index is empty.
          </p>
          <MarginNote rotate={reduced ? 0 : -4} size={22} style={{ display: 'block', marginTop: 14 }}>
            — first roster lands with intake
          </MarginNote>
        </div>
      )}

      {alphabetical.length > 0 && (
        <div
          className="people-v2-split"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(220px, 320px) minmax(0, 1fr)',
            gap: 40,
            alignItems: 'start',
          }}
        >
          {/* LEFT — alphabetical index */}
          <section
            aria-label="Index of attendees"
            style={{
              position: 'relative',
              background: 'var(--c-paper)',
              boxShadow: 'var(--c-shadow)',
              padding: '22px 4px 24px',
              maxHeight: '72vh',
              overflowY: 'auto',
            }}
          >
            <Tape position="top" rotate={reduced ? 0 : -3} width={72} />
            <div
              style={{
                fontFamily: 'var(--c-font-display)',
                fontSize: 10,
                letterSpacing: '.24em',
                color: 'var(--c-ink-muted)',
                textTransform: 'uppercase',
                padding: '0 20px 12px',
                borderBottom: '1px solid var(--c-line)',
                marginBottom: 8,
              }}
            >
              Index
            </div>

            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {byLetter.map(group => (
                <li key={group.letter}>
                  <div
                    style={{
                      fontFamily: 'var(--c-font-display)',
                      fontSize: 12,
                      letterSpacing: '.22em',
                      color: 'var(--c-pen)',
                      padding: '14px 20px 6px',
                    }}
                  >
                    {group.letter}
                  </div>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {group.entries.map(c => {
                      const active = c.id === activeId;
                      const key = categoryOf(c);
                      return (
                        <li key={c.id}>
                          <button
                            type="button"
                            onMouseEnter={() => setActiveId(c.id)}
                            onFocus={() => setActiveId(c.id)}
                            onClick={() => setActiveId(c.id)}
                            className="people-v2-index-row"
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'minmax(0, 1fr) auto',
                              alignItems: 'baseline',
                              gap: 10,
                              width: '100%',
                              textAlign: 'left',
                              padding: '8px 20px',
                              background: active ? 'rgba(31, 60, 198, 0.08)' : 'transparent',
                              border: 'none',
                              borderBottom: '1px dashed var(--c-line)',
                              cursor: 'pointer',
                              color: 'var(--c-ink)',
                              transition: 'background var(--c-t-fast) var(--c-ease-out)',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: 'var(--c-font-body)',
                                fontSize: 15,
                                fontWeight: active ? 500 : 400,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={c.name}
                            >
                              {surnameOf(c.name).toUpperCase()}
                              <span style={{ color: 'var(--c-ink-muted)', fontWeight: 400 }}>
                                {c.name?.replace(new RegExp(`\\s*${surnameOf(c.name)}\\s*$`), '')
                                  ? `, ${c.name.replace(new RegExp(`\\s*${surnameOf(c.name)}\\s*$`), '')}`
                                  : ''}
                              </span>
                            </span>
                            <span
                              aria-hidden
                              style={{
                                fontFamily: 'var(--c-font-display)',
                                fontSize: 8,
                                letterSpacing: '.2em',
                                color: isPresenter(c) ? 'var(--c-pen)' : 'var(--c-ink-muted)',
                                textTransform: 'uppercase',
                              }}
                            >
                              {isPresenter(c) ? '★' : key === 'organizer' ? '◆' : key === 'chaplain' ? '✚' : '·'}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          {/* RIGHT — profile detail */}
          <section
            aria-live="polite"
            aria-label="Attendee detail"
            style={{ position: 'sticky', top: 24 }}
          >
            {active ? (
              <article
                key={active.id}
                className="collage-enter"
                style={{
                  position: 'relative',
                  background: 'var(--c-paper)',
                  boxShadow: 'var(--c-shadow)',
                  padding: '36px 36px 40px',
                  maxWidth: 620,
                  ['--c-rot' as never]: '0deg',
                }}
              >
                <Tape position="top-left" rotate={reduced ? 0 : -8} width={80} />
                <Tape position="top-right" rotate={reduced ? 0 : 6} width={80} />

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                  <StickerPill variant={isPresenter(active) ? 'ink' : 'pen'}>
                    {isPresenter(active) ? 'Presenter' : CATEGORY_LABEL[categoryOf(active)]}
                  </StickerPill>
                  {active.relationship && (
                    <Stamp variant="outline" size="sm">
                      {truncate(active.relationship, 24)}
                    </Stamp>
                  )}
                </div>

                <h2
                  style={{
                    fontFamily: 'var(--c-font-body)',
                    fontSize: 'clamp(26px, 3vw, 36px)',
                    fontWeight: 500,
                    margin: 0,
                    lineHeight: 1.1,
                    letterSpacing: '-.01em',
                  }}
                >
                  {active.name}
                </h2>
                {active.organization && (
                  <p
                    style={{
                      fontFamily: 'var(--c-font-body)',
                      fontStyle: 'italic',
                      fontSize: 17,
                      color: 'var(--c-ink-muted)',
                      margin: '6px 0 0',
                    }}
                  >
                    {truncate(active.organization, 120)}
                  </p>
                )}

                {active.met_context && (
                  <div
                    style={{
                      marginTop: 22,
                      padding: '16px 18px',
                      borderLeft: '3px solid var(--c-pen)',
                      background: 'rgba(31, 60, 198, 0.04)',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--c-font-display)',
                        fontSize: 9,
                        letterSpacing: '.22em',
                        textTransform: 'uppercase',
                        color: 'var(--c-pen)',
                        marginBottom: 6,
                      }}
                    >
                      Where we met
                    </div>
                    <p
                      style={{
                        fontFamily: 'var(--c-font-script)',
                        fontWeight: 600,
                        fontSize: 20,
                        lineHeight: 1.3,
                        color: 'var(--c-ink)',
                        margin: 0,
                      }}
                    >
                      {active.met_context}
                    </p>
                  </div>
                )}

                {active.notes && (
                  <p
                    style={{
                      fontFamily: 'var(--c-font-body)',
                      fontSize: 15,
                      lineHeight: 1.6,
                      color: 'var(--c-ink)',
                      margin: '22px 0 0',
                      maxWidth: '46ch',
                    }}
                  >
                    {active.notes}
                  </p>
                )}

                <dl
                  style={{
                    marginTop: 26,
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr',
                    rowGap: 8,
                    columnGap: 20,
                    fontFamily: 'var(--c-font-body)',
                    fontSize: 14,
                    color: 'var(--c-ink-muted)',
                  }}
                >
                  {active.email && (
                    <>
                      <dt style={{ fontFamily: 'var(--c-font-display)', fontSize: 9, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--c-ink)' }}>
                        email
                      </dt>
                      <dd style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{active.email}</dd>
                    </>
                  )}
                  {active.phone && (
                    <>
                      <dt style={{ fontFamily: 'var(--c-font-display)', fontSize: 9, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--c-ink)' }}>
                        phone
                      </dt>
                      <dd style={{ margin: 0 }}>{active.phone}</dd>
                    </>
                  )}
                  {active.category && (
                    <>
                      <dt style={{ fontFamily: 'var(--c-font-display)', fontSize: 9, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--c-ink)' }}>
                        role
                      </dt>
                      <dd style={{ margin: 0 }}>{CATEGORY_LABEL[categoryOf(active)]}</dd>
                    </>
                  )}
                </dl>

                <MarginNote rotate={reduced ? 0 : -3} size={20} style={{ display: 'block', marginTop: 26 }}>
                  — hover the index to riffle through
                </MarginNote>
              </article>
            ) : (
              <div style={{ padding: 40, color: 'var(--c-ink-muted)' }}>
                Hover a name in the index.
              </div>
            )}
          </section>
        </div>
      )}

      <style>{`
        .people-v2-index-row:hover { background: rgba(31, 60, 198, 0.06); }
        .people-v2-index-row:focus-visible {
          outline: 2px solid var(--c-pen);
          outline-offset: -2px;
        }
        @media (max-width: 860px) {
          .people-v2-split {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
