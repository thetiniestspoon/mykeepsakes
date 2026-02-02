import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AccommodationCard } from './AccommodationCard';
import type { Accommodation } from '@/types/accommodation';

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
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No candidates yet.</p>
        <p className="text-xs mt-1">Add an accommodation above to get started.</p>
      </div>
    );
  }

  return (
    <SortableContext items={candidates.map(c => c.id)} strategy={verticalListSortingStrategy}>
      <div className="space-y-2">
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
