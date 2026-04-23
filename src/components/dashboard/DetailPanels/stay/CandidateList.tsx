import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AccommodationCard } from './AccommodationCard';
import type { Accommodation } from '@/types/accommodation';
import '@/preview/collage/collage.css';
import { MarginNote } from '@/preview/collage/ui/MarginNote';

/**
 * CandidateList — migrated to Collage direction (Phase 4d, StayDetail inner).
 * Parent wraps in `.collage-root`. SortableContext + mapping logic unchanged.
 * Empty state gets a Caveat margin-note softener instead of plain muted text.
 */

interface CandidateListProps {
  candidates: Accommodation[];
  activeId: string | null;
  onEdit: (id: string) => void;
  onDeprioritize: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CandidateList({
  candidates,
  activeId,
  onEdit,
  onDeprioritize,
  onDelete,
}: CandidateListProps) {
  if (candidates.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '28px 20px',
          border: '1px dashed var(--c-line)',
          borderRadius: 'var(--c-r-sm)',
          background: 'var(--c-paper)',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--c-font-body)',
            fontSize: 14,
            color: 'var(--c-ink)',
            margin: 0,
          }}
        >
          No candidates yet.
        </p>
        <p
          style={{
            fontFamily: 'var(--c-font-body)',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--c-ink-muted)',
            margin: '6px 0 10px',
          }}
        >
          Add an accommodation above to get started.
        </p>
        <MarginNote rotate={-2} size={18}>
          where might we sleep?
        </MarginNote>
      </div>
    );
  }

  return (
    <SortableContext items={candidates.map(c => c.id)} strategy={verticalListSortingStrategy}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {candidates.map((accommodation) => (
          <AccommodationCard
            key={accommodation.id}
            accommodation={accommodation}
            onEdit={() => onEdit(accommodation.id)}
            onDeprioritize={() => onDeprioritize(accommodation.id)}
            onDelete={() => onDelete(accommodation.id)}
            isDragging={activeId === accommodation.id}
          />
        ))}
      </div>
    </SortableContext>
  );
}
