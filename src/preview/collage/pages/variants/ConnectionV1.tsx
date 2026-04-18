/**
 * Connection V1 — Business Card Filling Out.
 *
 * A small fixed-backdrop modal that reads like a blank business card being
 * completed in pen. 560×340 desktop, collapses on mobile. Slower, more
 * careful tone than Reflection: the user is writing down someone ELSE's
 * name, a tiny commitment, so every field gets space and the primary
 * button is weighted ("KEEP THIS PERSON").
 *
 * Fields (local useState only — no persistence):
 *   - name (required)
 *   - organization + optional role on the same row
 *   - met_context picked from a radiogroup of StickerPills (at lunch,
 *     workshop, over coffee, between sessions, at worship, or a custom
 *     free-text entry revealed inline)
 *   - optional email + phone hidden behind a toggle
 *
 * Decorative: Rubik Mono "NEW NAME" stamp rotating top-left, tape strip
 * top-right, Caveat margin note at the bottom. Respects
 * prefers-reduced-motion (no tilt, no translate). If connection records
 * already exist for the active trip, a small "X people so far" pill shows
 * at the top of the card.
 */
import { useEffect, useMemo, useState } from 'react';
import { useActiveTrip } from '@/hooks/use-trip';
import { useConnections } from '@/hooks/use-connections';
import { Stamp } from '../../ui/Stamp';
import { Tape } from '../../ui/Tape';
import { StickerPill } from '../../ui/StickerPill';
import { MarginNote } from '../../ui/MarginNote';

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

const CONTEXT_PRESETS: { id: string; label: string; phrase: string }[] = [
  { id: 'lunch', label: 'at lunch', phrase: 'at lunch' },
  { id: 'workshop', label: 'workshop', phrase: 'in the workshop' },
  { id: 'coffee', label: 'over coffee', phrase: 'over coffee' },
  { id: 'between', label: 'between sessions', phrase: 'between sessions' },
  { id: 'worship', label: 'at worship', phrase: 'at worship' },
  { id: 'custom', label: 'somewhere else', phrase: '' },
];

export function ConnectionV1() {
  const reduced = useReducedMotion();
  const { data: trip } = useActiveTrip();
  const { data: connections = [] } = useConnections(trip?.id);

  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState('');
  const [contextId, setContextId] = useState<string>('lunch');
  const [customContext, setCustomContext] = useState('');
  const [showContact, setShowContact] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const canSave = name.trim().length > 0;
  const soFar = connections.length;

  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'var(--c-pen)';
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'var(--c-ink)';
  };

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
        aria-labelledby="conn-v1-title"
        className={reduced ? '' : 'collage-enter'}
        style={{
          position: 'relative',
          background: 'var(--c-paper)',
          boxShadow: 'var(--c-shadow)',
          width: 'min(560px, 100%)',
          minHeight: 340,
          padding: 'clamp(28px, 4vw, 40px) clamp(28px, 4vw, 44px) 32px',
          ['--c-rot' as never]: '0deg',
        }}
      >
        {/* Corner decorations */}
        <Stamp
          variant="ink"
          size="md"
          rotate={reduced ? 0 : -6}
          style={{ position: 'absolute', top: -14, left: 18 }}
        >
          new name
        </Stamp>
        <Tape position="top-right" rotate={reduced ? 0 : 5} width={84} />

        {/* Close × */}
        <button
          type="button"
          aria-label="Close"
          className="conn-v1-close"
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

        {/* Counter pill */}
        {soFar > 0 && (
          <div style={{ marginBottom: 18, marginTop: 6 }}>
            <StickerPill variant="ink" rotate={reduced ? 0 : -2}>
              {soFar} {soFar === 1 ? 'person' : 'people'} so far
            </StickerPill>
          </div>
        )}

        {/* NAME row */}
        <div style={{ marginTop: soFar > 0 ? 6 : 18 }}>
          <FieldLabel htmlFor="conn-v1-name">Who?</FieldLabel>
          <input
            id="conn-v1-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="full name"
            autoComplete="off"
            style={{
              ...inputStyle,
              fontSize: 20,
              fontFamily: 'var(--c-font-body)',
              fontWeight: 500,
            }}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
        </div>

        {/* ORG + ROLE row */}
        <div
          className="conn-v1-orgrow"
          style={{
            marginTop: 16,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)',
            gap: 14,
          }}
        >
          <div>
            <FieldLabel htmlFor="conn-v1-org">Organization</FieldLabel>
            <input
              id="conn-v1-org"
              type="text"
              value={organization}
              onChange={e => setOrganization(e.target.value)}
              placeholder="where they're from"
              autoComplete="off"
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>
          <div>
            <FieldLabel htmlFor="conn-v1-role">Role (optional)</FieldLabel>
            <input
              id="conn-v1-role"
              type="text"
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="title / what they do"
              autoComplete="off"
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>
        </div>

        {/* MET CONTEXT radiogroup */}
        <fieldset
          style={{
            marginTop: 20,
            border: 0,
            padding: 0,
          }}
        >
          <legend
            style={{
              fontFamily: 'var(--c-font-script)',
              fontWeight: 600,
              fontSize: 20,
              color: 'var(--c-ink)',
              marginBottom: 10,
              padding: 0,
            }}
          >
            Where'd you meet?
          </legend>
          <div
            role="radiogroup"
            aria-label="Where'd you meet"
            style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
          >
            {CONTEXT_PRESETS.map(p => {
              const active = p.id === contextId;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setContextId(p.id)}
                  className="conn-v1-ctx-pill"
                  style={{
                    appearance: 'none',
                    cursor: 'pointer',
                    border: `1.5px solid ${active ? 'var(--c-ink)' : 'var(--c-line)'}`,
                    background: active ? 'var(--c-ink)' : 'transparent',
                    color: active ? 'var(--c-creme)' : 'var(--c-ink)',
                    fontFamily: 'var(--c-font-display)',
                    fontSize: 10,
                    letterSpacing: '.22em',
                    textTransform: 'uppercase',
                    padding: '8px 12px',
                    borderRadius: 'var(--c-r-sm)',
                    transition:
                      'background var(--c-t-fast) var(--c-ease-out), color var(--c-t-fast) var(--c-ease-out), border-color var(--c-t-fast) var(--c-ease-out)',
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          {contextId === 'custom' && (
            <input
              type="text"
              value={customContext}
              onChange={e => setCustomContext(e.target.value)}
              placeholder="where was it?"
              style={{ ...inputStyle, marginTop: 10 }}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          )}
        </fieldset>

        {/* CONTACT TOGGLE */}
        <div style={{ marginTop: 20 }}>
          {!showContact ? (
            <button
              type="button"
              onClick={() => setShowContact(true)}
              className="conn-v1-toggle"
              style={{
                appearance: 'none',
                border: 0,
                background: 'transparent',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              <StickerPill variant="pen" rotate={reduced ? 0 : -2}>
                + add contact info
              </StickerPill>
            </button>
          ) : (
            <div
              className={reduced ? '' : 'collage-enter'}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                gap: 14,
                ['--c-rot' as never]: '0deg',
              }}
            >
              <div>
                <FieldLabel htmlFor="conn-v1-email">Email</FieldLabel>
                <input
                  id="conn-v1-email"
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
                <FieldLabel htmlFor="conn-v1-phone">Phone</FieldLabel>
                <input
                  id="conn-v1-phone"
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
          )}
        </div>

        {/* FOOTER */}
        <div
          style={{
            marginTop: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={!canSave}
              onClick={() => {
                /* demo only — no writes */
              }}
              className="conn-v1-keep"
              style={{
                appearance: 'none',
                cursor: canSave ? 'pointer' : 'not-allowed',
                border: 0,
                padding: '13px 22px',
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
              keep this person
            </button>
            <StickerPill variant="pen" rotate={reduced ? 0 : 2}>
              skip for now
            </StickerPill>
          </div>
          <MarginNote rotate={reduced ? 0 : -3} size={20}>
            you'll thank yourself later ✦
          </MarginNote>
        </div>

        <style>{`
          .conn-v1-close:hover { background: rgba(29, 29, 27, 0.06); color: var(--c-ink); }
          .conn-v1-close:focus-visible {
            outline: 2px solid var(--c-pen);
            outline-offset: 2px;
          }
          .conn-v1-ctx-pill:hover {
            border-color: var(--c-ink);
          }
          .conn-v1-ctx-pill:focus-visible {
            outline: 2px solid var(--c-pen);
            outline-offset: 2px;
          }
          .conn-v1-keep:not(:disabled):hover {
            transform: rotate(-2deg) translate(-1px, -1px);
          }
          .conn-v1-keep:focus-visible {
            outline: 2px solid var(--c-pen);
            outline-offset: 3px;
          }
          @media (max-width: 520px) {
            .conn-v1-orgrow { grid-template-columns: 1fr !important; }
          }
          @media (prefers-reduced-motion: reduce) {
            .conn-v1-keep:not(:disabled):hover { transform: none !important; }
          }
        `}</style>
      </article>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontFamily: 'var(--c-font-body)',
  fontSize: 16,
  color: 'var(--c-ink)',
  background: 'var(--c-creme)',
  border: '1.5px solid var(--c-ink)',
  borderRadius: 'var(--c-r-sm)',
  padding: '10px 12px',
  outline: 'none',
  transition: 'border-color var(--c-t-fast) var(--c-ease-out)',
  boxSizing: 'border-box',
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
