import { Calendar, Clock } from 'lucide-react';
import '@/preview/collage/collage.css';

interface TodayModeToggleProps {
  isTodayMode: boolean;
  onToggle: () => void;
  isActiveTrip: boolean;
}

/**
 * TodayModeToggle — migrated to Collage direction (Phase 4 #2 support).
 * Two-segment ink/crème toggle — paper flat (no rounded-full). Active side
 * reads as stamped ink-on-creme label; inactive side is hairline-only.
 * Logic unchanged (isTodayMode controlled by parent). Respects
 * prefers-reduced-motion — no transitions beyond a hair-fast color fade.
 */
export function TodayModeToggle({ isTodayMode, onToggle, isActiveTrip }: TodayModeToggleProps) {
  // Only show toggle during active trips
  if (!isActiveTrip) {
    return null;
  }

  const segment = (active: boolean): React.CSSProperties => ({
    appearance: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    fontFamily: 'var(--c-font-display)',
    fontSize: 10,
    letterSpacing: '.22em',
    textTransform: 'uppercase',
    lineHeight: 1,
    border: 0,
    borderRadius: 'var(--c-r-sm)',
    cursor: active ? 'default' : 'pointer',
    background: active ? 'var(--c-ink)' : 'transparent',
    color: active ? 'var(--c-creme)' : 'var(--c-ink-muted)',
    boxShadow: active ? 'var(--c-shadow-sm)' : 'none',
    transition: 'background var(--c-t-fast) var(--c-ease-out), color var(--c-t-fast) var(--c-ease-out)',
  });

  return (
    <div
      className="collage-root"
      role="tablist"
      aria-label="Itinerary view mode"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        padding: 3,
        background: 'var(--c-creme)',
        border: '1px solid var(--c-line)',
        borderRadius: 'var(--c-r-sm)',
      }}
    >
      <button
        type="button"
        role="tab"
        aria-selected={!isTodayMode}
        onClick={() => !isTodayMode || onToggle()}
        style={segment(!isTodayMode)}
      >
        <Calendar style={{ width: 12, height: 12 }} aria-hidden />
        <span>Timeline</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={isTodayMode}
        onClick={() => isTodayMode || onToggle()}
        style={segment(isTodayMode)}
      >
        <Clock style={{ width: 12, height: 12 }} aria-hidden />
        <span>Today</span>
      </button>
    </div>
  );
}
