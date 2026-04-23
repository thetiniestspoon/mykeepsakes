import { Book, Home, ListChecks, Images, Users } from 'lucide-react';
import { useDashboardSelection, type SelectionType } from '@/contexts/DashboardSelectionContext';
import '@/preview/collage/collage.css';

/**
 * Quick access icon row — migrated to Collage 2026-04-23 (Phase 4 #1).
 * Row of paper-chip icon buttons; active chip gets pen-blue ink + tape underlay.
 * Inactive chips are hairline-bordered paper with ink glyphs. Pen-blue focus
 * ring via box-shadow on keyboard focus. prefers-reduced-motion honored.
 * Presentation only — selectItem wiring unchanged.
 */
export function QuickIconRow() {
  const { selectItem, selectedItem } = useDashboardSelection();

  const buttons = [
    {
      id: 'guide',
      icon: Book,
      label: 'Guide',
      type: 'guide' as SelectionType,
      section: 'overview',
    },
    {
      id: 'packing',
      icon: ListChecks,
      label: 'Packing',
      type: 'packing' as SelectionType,
      section: 'packing',
    },
    {
      id: 'stay',
      icon: Home,
      label: 'Stay',
      type: 'stay' as SelectionType,
      section: 'lodging',
    },
    {
      id: 'album',
      icon: Images,
      label: 'Album',
      type: 'album' as SelectionType,
      section: 'album',
    },
    {
      id: 'people',
      icon: Users,
      label: 'People',
      type: 'people' as SelectionType,
      section: 'people',
    },
  ];

  return (
    <div
      className="collage-root"
      style={{
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'space-between',
        gap: 6,
        padding: '10px 10px 12px',
        borderBottom: '1px solid var(--c-line)',
        background: 'var(--c-paper)',
      }}
    >
      {buttons.map(({ id, icon: Icon, label, type, section }) => {
        const isActive = selectedItem?.type === type;

        return (
          <button
            key={id}
            type="button"
            onClick={() => selectItem(type, section, { section })}
            aria-current={isActive ? 'true' : undefined}
            aria-label={label}
            style={{
              appearance: 'none',
              cursor: 'pointer',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '8px 4px',
              borderRadius: 'var(--c-r-sm)',
              background: isActive ? 'var(--c-tape)' : 'var(--c-paper)',
              color: 'var(--c-ink)',
              border: isActive ? '1.5px solid var(--c-ink)' : '1px solid var(--c-line)',
              boxShadow: isActive ? 'var(--c-shadow-sm)' : 'none',
              fontFamily: 'var(--c-font-display)',
              fontSize: 9,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              lineHeight: 1,
              transition: 'background var(--c-t-fast) var(--c-ease-out), border-color var(--c-t-fast)',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 2px var(--c-pen)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = isActive ? 'var(--c-shadow-sm)' : 'none';
            }}
            onMouseOver={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'var(--c-creme)';
              }
            }}
            onMouseOut={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'var(--c-paper)';
              }
            }}
          >
            <Icon style={{ width: 16, height: 16 }} aria-hidden />
            <span style={{ fontSize: 9, letterSpacing: '.18em' }}>{label}</span>
          </button>
        );
      })}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .collage-root button {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
