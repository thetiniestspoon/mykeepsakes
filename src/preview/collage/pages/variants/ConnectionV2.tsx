/**
 * Connection V2 — Index Card + Live Preview.
 *
 * Wider 720×440 modal split into two columns: LEFT is the composition
 * surface (name / organization / role / where'd-you-meet select +
 * current-session chip); RIGHT is a LIVE preview that renders the entry
 * as it would appear in the Who's Who Index (PeopleV2) page — the user
 * sees the row they are creating in context while they fill it out.
 *
 * The "where'd you meet" field is a crème-backed styled native <select>
 * with the usual presets plus the current-day session prefilled from
 * useItineraryItems (best guess — the first session of the active day,
 * else the first scheduled item on the trip). All state is local
 * React state; no persistence. Respects prefers-reduced-motion. If
 * connection records already exist for the active trip, a small
 * "X people so far" pill shows at the top of the card.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  useActiveTrip,
  useTripDays,
  getTripMode,
  getCurrentDayIndex,
} from '@/hooks/use-trip';
import { useItineraryItems } from '@/hooks/use-itinerary';
import { useConnections } from '@/hooks/use-connections';
import { Stamp } from '../../ui/Stamp';
import { Tape } from '../../ui/Tape';
import { StickerPill } from '../../ui/StickerPill';
import { MarginNote } from '../../ui/MarginNote';
import type { ItineraryItem } from '@/types/trip';

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

const PRESETS: { value: string; label: string }[] = [
  { value: 'at lunch', label: 'at lunch' },
  { value: 'in the workshop', label: 'in the workshop' },
  { value: 'over coffee', label: 'over coffee' },
  { value: 'between sessions', label: 'between sessions' },
  { value: 'at worship', label: 'at worship' },
];

function surnameOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  return (parts[parts.length - 1] ?? '').replace(/[.,]/g, '');
}

export function ConnectionV2() {
  const reduced = useReducedMotion();

  const { data: trip } = useActiveTrip();
  const { data: days = [] } = useTripDays(trip?.id);
  const { data: allItems = [] } = useItineraryItems(trip?.id);
  const { data: connections = [] } = useConnections(trip?.id);

  // Best-guess "current session" prefill.
  const currentSession = useMemo<ItineraryItem | undefined>(() => {
    if (!trip || allItems.length === 0) return undefined;
    const mode = getTripMode(trip);
    const idx = getCurrentDayIndex(trip, days, mode);
    const currentDay = days[idx];
    const inDay = allItems.filter(
      i => i.day_id === currentDay?.id && i.start_time
    );
    if (inDay.length > 0) return inDay[0];
    return allItems.find(i => i.start_time) ?? allItems[0];
  }, [trip, days, allItems]);

  const sessionPhrase = currentSession?.speaker
    ? `during ${currentSession.speaker.split(/[,(]/)[0].trim()}'s session`
    : currentSession?.title
    ? `during ${currentSession.title}`
    : '';

  const prefilledOptionValue = sessionPhrase;

  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState('');
  const [metContext, setMetContext] = useState<string>(
    prefilledOptionValue || PRESETS[0].value
  );
  const [customContext, setCustomContext] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [useSessionChip, setUseSessionChip] = useState<boolean>(!!sessionPhrase);

  // When the prefilled session phrase arrives async, lock it in once.
  useEffect(() => {
    if (sessionPhrase && useSessionChip) {
      setMetContext(sessionPhrase);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionPhrase]);

  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'var(--c-pen)';
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'var(--c-ink)';
  };

  const canSave = name.trim().length > 0;
  const soFar = connections.length;

  const effectiveContext =
    metContext === '__custom__' ? customContext : metContext;

  const previewName = name.trim() || 'New Name';
  const previewOrg = organization.trim();
  const previewRole = role.trim();
  const previewContext = effectiveContext.trim();

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.45)',
        display: 'grid',
        placeItems: 'center',
        padding: 'clamp(16px, 4vw, 40px)',
        zIndex: 50,
      }}
    >
      <DemoHint />

      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby="conn-v2-title"
        className={reduced ? '' : 'collage-enter'}
        style={{
          position: 'relative',
          background: 'var(--c-paper)',
          boxShadow: 'var(--c-shadow)',
          width: 'min(720px, 100%)',
          minHeight: 440,
          padding: 'clamp(28px, 4vw, 40px) clamp(28px, 4vw, 40px) 32px',
          ['--c-rot' as never]: '0deg',
        }}
      >
        {/* Top stamp + tape */}
        <Stamp
          variant="ink"
          size="md"
          rotate={reduced ? 0 : -4}
          style={{ position: 'absolute', top: -14, left: 22 }}
        >
          add to the book
        </Stamp>
        <Tape position="top-right" rotate={reduced ? 0 : 5} width={90} />

        <button
          type="button"
          aria-label="Close"
          className="conn-v2-close"
          style={{
            position: 'absolute',
            top: 14,
            right: 16,
            width: 32,
            height: 32,
            border: 0,
            background: 'transparent',
            fontFamily: 'var(--c-font-body)',
            fontSize: 24,
            lineHeight: 1,
            color: 'var(--c-ink-muted)',
            cursor: 'pointer',
            borderRadius: 'var(--c-r-sm)',
          }}
        >
          ×
        </button>

        {soFar > 0 && (
          <div style={{ marginBottom: 16, marginTop: 4 }}>
            <StickerPill variant="ink" rotate={reduced ? 0 : -2}>
              {soFar} {soFar === 1 ? 'person' : 'people'} so far
            </StickerPill>
          </div>
        )}

        <h2
          id="conn-v2-title"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          Add a connection
        </h2>

        <div
          className="conn-v2-split"
          style={{
            marginTop: soFar > 0 ? 4 : 16,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr)',
            gap: 28,
            alignItems: 'start',
          }}
        >
          {/* LEFT — form */}
          <section aria-label="Connection form">
            <FieldLabel htmlFor="conn-v2-name">Name</FieldLabel>
            <input
              id="conn-v2-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="full name"
              autoComplete="off"
              style={{
                ...inputStyle,
                fontSize: 18,
                fontWeight: 500,
              }}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />

            <div style={{ height: 14 }} />
            <FieldLabel htmlFor="conn-v2-org">Organization</FieldLabel>
            <input
              id="conn-v2-org"
              type="text"
              value={organization}
              onChange={e => setOrganization(e.target.value)}
              placeholder="where they're from"
              autoComplete="off"
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />

            <div style={{ height: 14 }} />
            <FieldLabel htmlFor="conn-v2-role">Role (optional)</FieldLabel>
            <input
              id="conn-v2-role"
              type="text"
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="title / what they do"
              autoComplete="off"
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />

            <div style={{ height: 14 }} />
            <FieldLabel htmlFor="conn-v2-met">Where'd you meet</FieldLabel>

            {/* Session chip row */}
            {sessionPhrase && (
              <div style={{ marginBottom: 8 }}>
                <button
                  type="button"
                  aria-pressed={useSessionChip}
                  onClick={() => {
                    const next = !useSessionChip;
                    setUseSessionChip(next);
                    if (next) setMetContext(sessionPhrase);
                    else setMetContext(PRESETS[0].value);
                  }}
                  className="conn-v2-chip"
                  style={{
                    appearance: 'none',
                    cursor: 'pointer',
                    border: `1.5px dashed ${useSessionChip ? 'var(--c-pen)' : 'var(--c-line)'}`,
                    background: useSessionChip ? 'rgba(31, 60, 198, 0.08)' : 'transparent',
                    color: 'var(--c-ink)',
                    fontFamily: 'var(--c-font-body)',
                    fontSize: 13,
                    fontStyle: 'italic',
                    padding: '8px 12px',
                    borderRadius: 'var(--c-r-sm)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    transition:
                      'background var(--c-t-fast) var(--c-ease-out), border-color var(--c-t-fast) var(--c-ease-out)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--c-font-display)',
                      fontSize: 9,
                      letterSpacing: '.22em',
                      textTransform: 'uppercase',
                      color: 'var(--c-pen)',
                    }}
                  >
                    {useSessionChip ? '✓ met' : '+ met'}
                  </span>
                  <span>{sessionPhrase}</span>
                </button>
              </div>
            )}

            <select
              id="conn-v2-met"
              value={
                metContext === sessionPhrase && useSessionChip
                  ? '__session__'
                  : PRESETS.some(p => p.value === metContext)
                  ? metContext
                  : '__custom__'
              }
              onChange={e => {
                const v = e.target.value;
                if (v === '__session__') {
                  setUseSessionChip(true);
                  setMetContext(sessionPhrase);
                } else if (v === '__custom__') {
                  setUseSessionChip(false);
                  setMetContext('__custom__');
                } else {
                  setUseSessionChip(false);
                  setMetContext(v);
                }
              }}
              style={{
                ...inputStyle,
                appearance: 'auto',
                fontFamily: 'var(--c-font-body)',
                fontSize: 15,
              }}
              onFocus={focusStyle}
              onBlur={blurStyle}
            >
              {sessionPhrase && (
                <option value="__session__">{sessionPhrase}</option>
              )}
              {PRESETS.map(p => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
              <option value="__custom__">somewhere else…</option>
            </select>
            {metContext === '__custom__' && (
              <input
                type="text"
                value={customContext}
                onChange={e => setCustomContext(e.target.value)}
                placeholder="where was it?"
                style={{ ...inputStyle, marginTop: 8 }}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            )}

            <div
              className="conn-v2-contact"
              style={{
                marginTop: 14,
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                gap: 12,
              }}
            >
              <div>
                <FieldLabel htmlFor="conn-v2-email">Email (opt.)</FieldLabel>
                <input
                  id="conn-v2-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  autoComplete="off"
                  style={inputStyle}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>
              <div>
                <FieldLabel htmlFor="conn-v2-phone">Phone (opt.)</FieldLabel>
                <input
                  id="conn-v2-phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  autoComplete="off"
                  style={inputStyle}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>
            </div>
          </section>

          {/* RIGHT — preview */}
          <section
            aria-label="Live preview"
            aria-live="polite"
            style={{
              position: 'relative',
              background: 'var(--c-creme)',
              border: '1px dashed var(--c-line)',
              borderRadius: 'var(--c-r-sm)',
              padding: '22px 22px 24px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--c-font-display)',
                fontSize: 9,
                letterSpacing: '.24em',
                textTransform: 'uppercase',
                color: 'var(--c-ink-muted)',
                marginBottom: 14,
              }}
            >
              how it'll read in the index
            </div>

            {/* Simulated index row */}
            <div
              style={{
                borderBottom: '1px dashed var(--c-line)',
                padding: '10px 0',
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) auto',
                alignItems: 'baseline',
                gap: 8,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontSize: 15,
                  fontWeight: 500,
                  color: 'var(--c-ink)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {surnameOf(previewName).toUpperCase() || '—'}
                <span style={{ color: 'var(--c-ink-muted)', fontWeight: 400 }}>
                  {surnameOf(previewName) && previewName
                    ? `, ${previewName.replace(new RegExp(`\\s*${surnameOf(previewName)}\\s*$`), '')}`
                    : ''}
                </span>
              </span>
              <span
                aria-hidden
                style={{
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 8,
                  letterSpacing: '.2em',
                  color: 'var(--c-ink-muted)',
                }}
              >
                ·
              </span>
            </div>

            {/* Detail card stand-in */}
            <div
              style={{
                marginTop: 18,
                position: 'relative',
                background: 'var(--c-paper)',
                boxShadow: 'var(--c-shadow-sm)',
                padding: '22px 20px',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontSize: 22,
                  fontWeight: 500,
                  margin: 0,
                  lineHeight: 1.15,
                  letterSpacing: '-.01em',
                  color: 'var(--c-ink)',
                }}
              >
                {previewName}
              </h3>
              {(previewOrg || previewRole) && (
                <p
                  style={{
                    fontFamily: 'var(--c-font-body)',
                    fontStyle: 'italic',
                    fontSize: 14,
                    color: 'var(--c-ink-muted)',
                    margin: '4px 0 0',
                  }}
                >
                  {[previewRole, previewOrg].filter(Boolean).join(' · ')}
                </p>
              )}

              {previewContext && (
                <div
                  style={{
                    marginTop: 14,
                    padding: '10px 12px',
                    borderLeft: '3px solid var(--c-pen)',
                    background: 'rgba(31, 60, 198, 0.04)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--c-font-display)',
                      fontSize: 8,
                      letterSpacing: '.22em',
                      textTransform: 'uppercase',
                      color: 'var(--c-pen)',
                      marginBottom: 4,
                    }}
                  >
                    Where we met
                  </div>
                  <p
                    style={{
                      fontFamily: 'var(--c-font-script)',
                      fontWeight: 600,
                      fontSize: 17,
                      lineHeight: 1.3,
                      color: 'var(--c-ink)',
                      margin: 0,
                    }}
                  >
                    {previewContext}
                  </p>
                </div>
              )}

              {(email.trim() || phone.trim()) && (
                <dl
                  style={{
                    marginTop: 14,
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr',
                    rowGap: 4,
                    columnGap: 12,
                    fontFamily: 'var(--c-font-body)',
                    fontSize: 12,
                    color: 'var(--c-ink-muted)',
                  }}
                >
                  {email.trim() && (
                    <>
                      <dt style={DtStyle}>email</dt>
                      <dd style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {email.trim()}
                      </dd>
                    </>
                  )}
                  {phone.trim() && (
                    <>
                      <dt style={DtStyle}>phone</dt>
                      <dd style={{ margin: 0 }}>{phone.trim()}</dd>
                    </>
                  )}
                </dl>
              )}
            </div>

            <MarginNote rotate={reduced ? 0 : -3} size={19} style={{ display: 'block', marginTop: 14 }}>
              — updates as you type
            </MarginNote>
          </section>
        </div>

        <div
          style={{
            marginTop: 24,
            display: 'flex',
            gap: 14,
            alignItems: 'center',
            flexWrap: 'wrap',
            borderTop: '1px dashed var(--c-line)',
            paddingTop: 18,
          }}
        >
          <button
            type="button"
            disabled={!canSave}
            onClick={() => {
              /* demo only — no writes */
            }}
            className="conn-v2-add"
            style={{
              appearance: 'none',
              cursor: canSave ? 'pointer' : 'not-allowed',
              border: 0,
              padding: '12px 22px',
              background: canSave ? 'var(--c-ink)' : 'var(--c-ink-muted)',
              color: 'var(--c-creme)',
              fontFamily: 'var(--c-font-display)',
              fontSize: 13,
              letterSpacing: '.26em',
              textTransform: 'uppercase',
              borderRadius: 'var(--c-r-sm)',
              boxShadow: canSave ? 'var(--c-shadow-sm)' : 'none',
              opacity: canSave ? 1 : 0.6,
              transform: reduced ? 'none' : 'rotate(-2deg)',
              transition: 'transform var(--c-t-fast) var(--c-ease-out)',
            }}
          >
            add
          </button>
          <StickerPill variant="pen" rotate={reduced ? 0 : 2}>
            cancel
          </StickerPill>
          <span style={{ marginLeft: 'auto' }}>
            <MarginNote rotate={reduced ? 0 : -2} size={19}>
              — demo · no writes
            </MarginNote>
          </span>
        </div>

        <style>{`
          .conn-v2-close:hover { background: rgba(29, 29, 27, 0.06); color: var(--c-ink); }
          .conn-v2-close:focus-visible {
            outline: 2px solid var(--c-pen);
            outline-offset: 2px;
          }
          .conn-v2-chip:hover { border-color: var(--c-pen); }
          .conn-v2-chip:focus-visible {
            outline: 2px solid var(--c-pen);
            outline-offset: 2px;
          }
          .conn-v2-add:not(:disabled):hover {
            transform: rotate(-2deg) translate(-1px, -1px);
          }
          .conn-v2-add:focus-visible {
            outline: 2px solid var(--c-pen);
            outline-offset: 3px;
          }
          @media (max-width: 720px) {
            .conn-v2-split { grid-template-columns: 1fr !important; }
          }
          @media (max-width: 520px) {
            .conn-v2-contact { grid-template-columns: 1fr !important; }
          }
          @media (prefers-reduced-motion: reduce) {
            .conn-v2-add:not(:disabled):hover { transform: none !important; }
          }
        `}</style>
      </article>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontFamily: 'var(--c-font-body)',
  fontSize: 15,
  color: 'var(--c-ink)',
  background: 'var(--c-creme)',
  border: '1.5px solid var(--c-ink)',
  borderRadius: 'var(--c-r-sm)',
  padding: '10px 12px',
  outline: 'none',
  transition: 'border-color var(--c-t-fast) var(--c-ease-out)',
  boxSizing: 'border-box',
};

const DtStyle: React.CSSProperties = {
  fontFamily: 'var(--c-font-display)',
  fontSize: 8,
  letterSpacing: '.22em',
  textTransform: 'uppercase',
  color: 'var(--c-ink)',
};

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: 'block',
        fontFamily: 'var(--c-font-display)',
        fontSize: 10,
        letterSpacing: '.22em',
        textTransform: 'uppercase',
        color: 'var(--c-ink-muted)',
        marginBottom: 6,
      }}
    >
      {children}
    </label>
  );
}

function DemoHint() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(247, 243, 233, 0.92)',
        border: '1px dashed var(--c-pen)',
        padding: '6px 12px',
        fontFamily: 'var(--c-font-body)',
        fontSize: 12,
        color: 'var(--c-pen)',
        letterSpacing: '.02em',
        pointerEvents: 'none',
        zIndex: 51,
      }}
    >
      demo: the sheet appears after tapping ✧ Met someone on the Dashboard
    </div>
  );
}
