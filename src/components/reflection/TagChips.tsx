import { INSIGHT_TAGS, type InsightTag } from '@/types/conference';
import '@/preview/collage/collage.css';

interface TagChipsProps {
  selected: InsightTag[];
  onToggle: (tag: InsightTag) => void;
}

/**
 * TagChips — migrated to Collage direction (Phase 4 #10).
 * Selection state + onToggle behavior unchanged; only presentation restyled
 * to use Collage tokens (Rubik Mono One stamped labels, pen-blue selection,
 * sharp 2px radii, paper-flat styling). Selected state inverts to pen-blue
 * ink + crème text; unselected state is crème-on-ink border.
 */
export function TagChips({ selected, onToggle }: TagChipsProps) {
  return (
    <div
      className="mk-collage-tagchips"
      style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 4,
      }}
    >
      {INSIGHT_TAGS.map((tag) => {
        const isSelected = selected.includes(tag.value);
        const baseStyle: React.CSSProperties = {
          appearance: 'none',
          flexShrink: 0,
          minHeight: 40,
          padding: '8px 14px',
          fontFamily: 'var(--c-font-display)',
          fontSize: 11,
          letterSpacing: '.22em',
          textTransform: 'uppercase',
          lineHeight: 1,
          borderRadius: 'var(--c-r-sm)',
          cursor: 'pointer',
          transition:
            'background var(--c-t-fast) var(--c-ease-out), color var(--c-t-fast) var(--c-ease-out), border-color var(--c-t-fast) var(--c-ease-out), transform var(--c-t-fast) var(--c-ease-out)',
        };
        const selectedStyle: React.CSSProperties = {
          background: 'var(--c-pen)',
          color: 'var(--c-creme)',
          border: '1.5px solid var(--c-pen)',
          boxShadow: 'var(--c-shadow-sm)',
        };
        const unselectedStyle: React.CSSProperties = {
          background: 'var(--c-creme)',
          color: 'var(--c-ink)',
          border: '1.5px solid var(--c-ink)',
        };
        return (
          <button
            key={tag.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(tag.value)}
            style={{
              ...baseStyle,
              ...(isSelected ? selectedStyle : unselectedStyle),
            }}
          >
            {tag.label}
          </button>
        );
      })}
      <style>{`
        .mk-collage-tagchips { scrollbar-width: none; }
        .mk-collage-tagchips::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
