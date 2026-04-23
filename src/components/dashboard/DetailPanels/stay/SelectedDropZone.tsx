import { useDroppable } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Pencil, X, Calendar, Home } from 'lucide-react';
import { format } from 'date-fns';
import type { Accommodation } from '@/types/accommodation';
import '@/preview/collage/collage.css';
import { Tape } from '@/preview/collage/ui/Tape';
import { StickerPill } from '@/preview/collage/ui/StickerPill';

/**
 * SelectedDropZone — migrated to Collage direction (Phase 4d, StayDetail inner).
 * Parent wraps in `.collage-root`; tokens cascade. useDroppable + props unchanged.
 * Selected state = tape-accented paper card ("the room you'll come back to at
 * night" aesthetic from LodgingV1). Empty state = dashed ink border drop target
 * that flashes pen-blue when a draggable hovers.
 */

interface SelectedDropZoneProps {
  selected: Accommodation | null;
  isOver: boolean;
  onShowOnMap: () => void;
  onGetDirections: () => void;
  onUnselect: () => void;
  onEdit: () => void;
}

const actionBtnStyle: React.CSSProperties = {
  appearance: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '6px 10px',
  fontFamily: 'var(--c-font-display)',
  fontSize: 10,
  letterSpacing: '.22em',
  textTransform: 'uppercase',
  color: 'var(--c-ink)',
  background: 'var(--c-paper)',
  border: '1.5px solid var(--c-ink)',
  borderRadius: 'var(--c-r-sm)',
  cursor: 'pointer',
  transition: 'transform var(--c-t-fast) var(--c-ease-out)',
};

export function SelectedDropZone({
  selected,
  isOver,
  onShowOnMap,
  onGetDirections,
  onUnselect,
  onEdit,
}: SelectedDropZoneProps) {
  const { setNodeRef } = useDroppable({ id: 'selected-zone' });

  if (selected) {
    return (
      <article
        style={{
          position: 'relative',
          background: 'var(--c-paper)',
          border: '1px solid var(--c-line)',
          borderRadius: 'var(--c-r-sm)',
          boxShadow: 'var(--c-shadow)',
          padding: '18px 18px 16px',
        }}
      >
        <Tape position="top-left" rotate={-6} width={72} opacity={0.7} />
        <Tape position="top-right" rotate={4} width={56} opacity={0.55} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
            <Home
              className="w-5 h-5"
              style={{ color: 'var(--c-pen)', flexShrink: 0, marginTop: 2 }}
            />
            <div style={{ minWidth: 0 }}>
              <h3
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontWeight: 500,
                  fontSize: 18,
                  lineHeight: 1.2,
                  color: 'var(--c-ink)',
                  margin: 0,
                  letterSpacing: '-.005em',
                }}
              >
                {selected.title}
              </h3>
              {selected.address && (
                <p
                  style={{
                    fontFamily: 'var(--c-font-script)',
                    fontWeight: 600,
                    fontSize: 16,
                    color: 'var(--c-ink-muted)',
                    margin: '4px 0 0',
                    lineHeight: 1.25,
                  }}
                >
                  {selected.address}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onUnselect}
            className="h-8 w-8 shrink-0"
            aria-label="Unselect accommodation"
            style={{ color: 'var(--c-ink-muted)' }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {(selected.check_in || selected.check_out) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 12,
              fontFamily: 'var(--c-font-body)',
              fontSize: 14,
              color: 'var(--c-ink)',
            }}
          >
            <Calendar className="w-4 h-4" style={{ color: 'var(--c-ink-muted)' }} />
            <span>
              {selected.check_in && format(new Date(selected.check_in), 'MMM d')}
              {selected.check_in && selected.check_out && ' → '}
              {selected.check_out && format(new Date(selected.check_out), 'MMM d')}
            </span>
          </div>
        )}

        {selected.notes && (
          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 13,
              color: 'var(--c-ink-muted)',
              margin: '10px 0 0',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {selected.notes}
          </p>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          {selected.location_lat && selected.location_lng && (
            <>
              <button type="button" onClick={onShowOnMap} style={actionBtnStyle}>
                <MapPin className="w-3.5 h-3.5" />
                Map
              </button>
              <button type="button" onClick={onGetDirections} style={actionBtnStyle}>
                <Navigation className="w-3.5 h-3.5" />
                Directions
              </button>
            </>
          )}
          <button type="button" onClick={onEdit} style={actionBtnStyle}>
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>
      </article>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        border: isOver ? '2px dashed var(--c-pen)' : '2px dashed var(--c-line)',
        borderRadius: 'var(--c-r-sm)',
        padding: '24px 20px',
        textAlign: 'center',
        background: isOver ? 'rgba(31,60,198,.06)' : 'var(--c-paper)',
        transition: 'border-color var(--c-t-fast) var(--c-ease-out), background-color var(--c-t-fast) var(--c-ease-out)',
      }}
    >
      <Home
        className="w-8 h-8"
        style={{ margin: '0 auto 8px', color: 'var(--c-ink-muted)', display: 'block' }}
      />
      <p
        style={{
          fontFamily: 'var(--c-font-body)',
          fontSize: 14,
          color: 'var(--c-ink-muted)',
          margin: 0,
        }}
      >
        Drag an accommodation here to select it
      </p>
      <div style={{ marginTop: 10 }}>
        <StickerPill variant={isOver ? 'pen' : 'ink'} rotate={-1}>
          drop zone
        </StickerPill>
      </div>
    </div>
  );
}
