import { Camera, ChevronRight } from 'lucide-react';
import { useDashboardSelection } from '@/contexts/DashboardSelectionContext';
import { useMemories } from '@/hooks/use-memories';
import { useActiveTrip } from '@/hooks/use-trip';
import '@/preview/collage/collage.css';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { Tape } from '@/preview/collage/ui/Tape';
import { MarginNote } from '@/preview/collage/ui/MarginNote';

/**
 * Album summary card — migrated to Collage 2026-04-23 (Phase 4 #1).
 * Paper-flat card with tape accent + ALBUM stamp overline; Caveat counter caption.
 * Handlers/hooks preserved. Active state shown via ink border + pen-blue focus ring.
 */
export function AlbumSummaryCard() {
  const { data: trip } = useActiveTrip();
  const { data: memories = [] } = useMemories(trip?.id);
  const { selectItem, selectedItem } = useDashboardSelection();

  const isActive = selectedItem?.type === 'album';
  const memoryCount = memories.length;
  const photoCount = memories.reduce((acc, m) => acc + (m.media?.length || 0), 0);

  const handleClick = () => {
    selectItem('album', 'main', null);
  };

  const caption =
    memoryCount === 0
      ? 'No memories yet'
      : `${memoryCount} ${memoryCount === 1 ? 'memory' : 'memories'} · ${photoCount} ${photoCount === 1 ? 'photo' : 'photos'}`;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isActive}
      aria-label="Open photo album"
      className="collage-root"
      style={{
        appearance: 'none',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        position: 'relative',
        background: 'var(--c-paper)',
        padding: '14px 14px 12px',
        marginTop: 8, // breathing room for tape
        border: isActive ? '1.5px solid var(--c-ink)' : '1px solid var(--c-line)',
        borderRadius: 'var(--c-r-sm)',
        boxShadow: isActive ? 'var(--c-shadow)' : 'var(--c-shadow-sm)',
        transition: 'box-shadow var(--c-t-fast) var(--c-ease-out), transform var(--c-t-fast)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        outline: 'none',
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = '0 0 0 2px var(--c-pen), var(--c-shadow)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = isActive ? 'var(--c-shadow)' : 'var(--c-shadow-sm)';
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translate(-1px, -1px)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translate(0, 0)';
      }}
    >
      <Tape position="top-right" rotate={5} width={54} />

      {/* Camera chip — paper square, ink frame */}
      <div
        aria-hidden
        style={{
          flexShrink: 0,
          width: 40,
          height: 40,
          display: 'grid',
          placeItems: 'center',
          background: 'var(--c-ink)',
          color: 'var(--c-creme)',
          borderRadius: 'var(--c-r-sm)',
          boxShadow: 'var(--c-shadow-sm)',
        }}
      >
        <Camera style={{ width: 18, height: 18 }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <Stamp variant="plain" size="sm" style={{ fontSize: 9, padding: 0, color: 'var(--c-ink-muted)' }}>
            ◈ Album
          </Stamp>
        </div>
        <h3
          style={{
            fontFamily: 'var(--c-font-body)',
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--c-ink)',
            margin: 0,
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          Photo Album
        </h3>
        {memoryCount > 0 ? (
          <MarginNote
            rotate={-1}
            size={15}
            color="ink"
            style={{ display: 'block', marginTop: 2, fontStyle: 'normal' }}
          >
            {caption}
          </MarginNote>
        ) : (
          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontStyle: 'italic',
              fontSize: 11,
              color: 'var(--c-ink-muted)',
              margin: '2px 0 0',
              lineHeight: 1.3,
            }}
          >
            {caption}
          </p>
        )}
      </div>

      <ChevronRight
        style={{
          width: 16,
          height: 16,
          color: isActive ? 'var(--c-pen)' : 'var(--c-ink-muted)',
          flexShrink: 0,
        }}
        aria-hidden
      />

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .collage-root { transition: none !important; transform: none !important; }
        }
      `}</style>
    </button>
  );
}
