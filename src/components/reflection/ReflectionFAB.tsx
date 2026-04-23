import { useEffect, useState } from 'react';
import { Plus, PenLine, UserPlus, CalendarPlus, X } from 'lucide-react';
import '@/preview/collage/collage.css';

interface ReflectionFABProps {
  onReflection: () => void;
  onConnection: () => void;
  onEvent: () => void;
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

/**
 * Reflection FAB — migrated to Collage direction (Phase 4 #10).
 * Opens reflection / connection / event capture surfaces. State + callbacks
 * unchanged; only chrome restyled. Ink paper-flat surface, crème icon,
 * pen-blue focus ring, sharp 2px radii. Sub-buttons fade/slide in only when
 * reduced-motion is not requested.
 */
export function ReflectionFAB({ onReflection, onConnection, onEvent }: ReflectionFABProps) {
  const [expanded, setExpanded] = useState(false);
  const reduced = useReducedMotion();

  const subButtonStyle: React.CSSProperties = {
    appearance: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    height: 48,
    padding: '0 16px',
    background: 'var(--c-creme)',
    color: 'var(--c-ink)',
    border: '1.5px solid var(--c-ink)',
    borderRadius: 'var(--c-r-sm)',
    fontFamily: 'var(--c-font-display)',
    fontSize: 11,
    letterSpacing: '.22em',
    textTransform: 'uppercase',
    lineHeight: 1,
    boxShadow: 'var(--c-shadow)',
    transition:
      'transform var(--c-t-fast) var(--c-ease-out), background var(--c-t-fast) var(--c-ease-out)',
  };

  const mainButtonStyle: React.CSSProperties = {
    appearance: 'none',
    cursor: 'pointer',
    width: 56,
    height: 56,
    display: 'grid',
    placeItems: 'center',
    background: 'var(--c-ink)',
    color: 'var(--c-creme)',
    border: 0,
    borderRadius: 'var(--c-r-sm)',
    boxShadow: 'var(--c-shadow)',
    transition: 'transform var(--c-t-fast) var(--c-ease-out)',
  };

  return (
    <div
      className="collage-root mk-reflection-fab"
      style={{
        position: 'fixed',
        bottom: 80,
        right: 16,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column-reverse',
        alignItems: 'flex-end',
        gap: 10,
      }}
    >
      {expanded && (
        <>
          <button
            type="button"
            className={reduced ? '' : 'mk-fab-sub'}
            style={subButtonStyle}
            onClick={() => {
              onReflection();
              setExpanded(false);
            }}
          >
            <PenLine style={{ width: 18, height: 18 }} aria-hidden />
            Reflection
          </button>
          <button
            type="button"
            className={reduced ? '' : 'mk-fab-sub'}
            style={subButtonStyle}
            onClick={() => {
              onConnection();
              setExpanded(false);
            }}
          >
            <UserPlus style={{ width: 18, height: 18 }} aria-hidden />
            Connection
          </button>
          <button
            type="button"
            className={reduced ? '' : 'mk-fab-sub'}
            style={subButtonStyle}
            onClick={() => {
              onEvent();
              setExpanded(false);
            }}
          >
            <CalendarPlus style={{ width: 18, height: 18 }} aria-hidden />
            Event
          </button>
        </>
      )}
      <button
        type="button"
        aria-label={expanded ? 'Close quick capture menu' : 'Open quick capture menu'}
        aria-expanded={expanded}
        style={mainButtonStyle}
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? (
          <X style={{ width: 24, height: 24 }} aria-hidden />
        ) : (
          <Plus style={{ width: 24, height: 24 }} aria-hidden />
        )}
      </button>

      <style>{`
        .mk-reflection-fab button:focus-visible {
          outline: 2px solid var(--c-pen);
          outline-offset: 3px;
        }
        .mk-reflection-fab button:hover {
          transform: translate(-1px, -1px);
        }
        @keyframes mk-fab-sub-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .mk-fab-sub {
          animation: mk-fab-sub-in var(--c-t-med) var(--c-ease-out) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .mk-reflection-fab button:hover { transform: none; }
          .mk-fab-sub { animation: none; }
        }
      `}</style>
    </div>
  );
}
