import '@/preview/collage/collage.css';

interface PanelDotsIndicatorProps {
  activeIndex: number;
  onDotClick: (index: number) => void;
}

const panels = [
  { label: 'Itinerary' },
  { label: 'Details' },
  { label: 'Map' },
];

/**
 * Swipe-page indicator — migrated to Collage 2026-04-23 (Phase 4 #1).
 * Active dot = pen-blue stamp square; inactive = ink-muted hairline ring.
 * Label uses Rubik Mono One uppercase. Presentation only — handlers preserved.
 * prefers-reduced-motion handled globally via .collage-root in collage.css.
 */
export function PanelDotsIndicator({ activeIndex, onDotClick }: PanelDotsIndicatorProps) {
  return (
    <nav
      className="collage-root"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        padding: '10px 0 12px',
        background: 'var(--c-paper)',
        borderTop: '1px solid var(--c-line)',
        minHeight: 0,
      }}
    >
      {panels.map((panel, i) => {
        const isActive = i === activeIndex;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onDotClick(i)}
            aria-label={`Go to ${panel.label}`}
            aria-current={isActive ? 'page' : undefined}
            style={{
              appearance: 'none',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              minWidth: 60,
              padding: '4px 8px',
              borderRadius: 'var(--c-r-sm)',
              color: isActive ? 'var(--c-pen)' : 'var(--c-ink-muted)',
              transition: 'color var(--c-t-fast) var(--c-ease-out)',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 2px var(--c-pen)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: 'var(--c-r-sm)',
                background: isActive ? 'var(--c-pen)' : 'transparent',
                border: isActive ? '1.5px solid var(--c-pen)' : '1.5px solid var(--c-ink-muted)',
                boxShadow: isActive ? 'var(--c-shadow-sm)' : 'none',
                transition: 'background var(--c-t-fast) var(--c-ease-out)',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--c-font-display)',
                fontSize: 9,
                letterSpacing: '.22em',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}
            >
              {panel.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
