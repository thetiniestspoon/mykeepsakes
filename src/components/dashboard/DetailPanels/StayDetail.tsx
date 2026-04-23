import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useAccommodations,
  useSelectAccommodation,
  useUnselectAccommodation,
  useReorderAccommodations,
  useDeprioritizeAccommodation,
  useUnhideAccommodation,
  useDeleteAccommodation,
  useUpdateAccommodation,
} from '@/hooks/use-accommodations';
import { useDashboardSelection } from '@/contexts/DashboardSelectionContext';
import { AccommodationAddForm } from './stay/AccommodationAddForm';
import { SelectedDropZone } from './stay/SelectedDropZone';
import { CandidateList } from './stay/CandidateList';
import { DeprioritizedSection } from './stay/DeprioritizedSection';
import { SelectionDetailsDialog } from './stay/SelectionDetailsDialog';
import type { Accommodation, AccommodationSelectDetails } from '@/types/accommodation';
import { toast } from 'sonner';
import '@/preview/collage/collage.css';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { Tape } from '@/preview/collage/ui/Tape';
import { MarginNote } from '@/preview/collage/ui/MarginNote';

/**
 * StayDetail — migrated to Collage direction (Phase 4d).
 * Vocabulary: Concierge Card (LodgingV1). One honored header treats the chosen
 * stay with authority — Rubik Mono overline ("YOUR STAY"), IBM Plex Serif hotel
 * name, Caveat address, tape accents. Under the header, the working surface
 * (add form, drop zone, candidates, deprioritized) keeps its production logic
 * and interactivity intact. Presentation only; state/hooks/handlers unchanged.
 */
export function StayDetail() {
  const { data: accommodations = [], isLoading } = useAccommodations();

  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isOverDropZone, setIsOverDropZone] = useState(false);

  // Dialog state
  const [pendingSelection, setPendingSelection] = useState<Accommodation | null>(null);
  const [editingAccommodation, setEditingAccommodation] = useState<Accommodation | null>(null);

  // Context for map actions
  const { panMap, navigateToPanel, focusLocation } = useDashboardSelection();

  // Mutations
  const selectMutation = useSelectAccommodation();
  const unselectMutation = useUnselectAccommodation();
  const reorderMutation = useReorderAccommodations();
  const deprioritizeMutation = useDeprioritizeAccommodation();
  const unhideMutation = useUnhideAccommodation();
  const deleteMutation = useDeleteAccommodation();
  const updateMutation = useUpdateAccommodation();

  // Sensors for drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Derived data
  const selected = useMemo(
    () => accommodations.find((a) => a.is_selected) || null,
    [accommodations]
  );

  const candidates = useMemo(
    () => accommodations.filter((a) => !a.is_selected && !a.is_deprioritized),
    [accommodations]
  );

  const deprioritized = useMemo(
    () => accommodations.filter((a) => a.is_deprioritized),
    [accommodations]
  );

  const activeItem = useMemo(
    () => (activeId ? accommodations.find((a) => a.id === activeId) : null),
    [activeId, accommodations]
  );

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setIsOverDropZone(event.over?.id === 'selected-zone');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setIsOverDropZone(false);

    if (!over) return;

    // Dropped on selection zone
    if (over.id === 'selected-zone') {
      const item = accommodations.find((a) => a.id === active.id);
      if (item && !item.is_selected) {
        setPendingSelection(item);
      }
      return;
    }

    // Reorder within candidates
    if (active.id !== over.id) {
      const oldIndex = candidates.findIndex((c) => c.id === active.id);
      const newIndex = candidates.findIndex((c) => c.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(candidates, oldIndex, newIndex);
        const updates = reordered.map((item, index) => ({
          id: item.id,
          sort_order: index,
        }));
        reorderMutation.mutate(updates);
      }
    }
  };

  // Action handlers
  const handleSelectConfirm = (details: AccommodationSelectDetails) => {
    if (!pendingSelection && !editingAccommodation) return;

    const target = pendingSelection || editingAccommodation;
    if (!target) return;

    if (target.is_selected) {
      // Editing existing selection
      updateMutation.mutate(
        { id: target.id, updates: details },
        {
          onSuccess: () => {
            toast.success('Accommodation updated');
            setEditingAccommodation(null);
          },
          onError: () => toast.error('Failed to update'),
        }
      );
    } else {
      // New selection
      selectMutation.mutate(
        { id: target.id, details },
        {
          onSuccess: () => {
            toast.success('Accommodation selected');
            setPendingSelection(null);
          },
          onError: () => toast.error('Failed to select'),
        }
      );
    }
  };

  const handleUnselect = () => {
    if (!selected) return;
    unselectMutation.mutate(selected.id, {
      onSuccess: () => toast.success('Moved back to candidates'),
      onError: () => toast.error('Failed to unselect'),
    });
  };

  const handleDeprioritize = (id: string) => {
    deprioritizeMutation.mutate(id, {
      onSuccess: () => toast.success('Hidden'),
      onError: () => toast.error('Failed to hide'),
    });
  };

  const handleUnhide = (id: string) => {
    unhideMutation.mutate(id, {
      onSuccess: () => toast.success('Restored'),
      onError: () => toast.error('Failed to restore'),
    });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success('Deleted'),
      onError: () => toast.error('Failed to delete'),
    });
  };

  const handleShowOnMap = () => {
    if (selected?.location_lat && selected?.location_lng) {
      panMap(selected.location_lat, selected.location_lng);
      focusLocation({ id: selected.id, category: 'lodging' });
      navigateToPanel(2);
    }
  };

  const handleGetDirections = () => {
    if (selected?.address) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selected.address)}`;
      window.open(url, '_blank');
    } else if (selected?.location_lat && selected?.location_lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${selected.location_lat},${selected.location_lng}`;
      window.open(url, '_blank');
    }
  };

  const handleEdit = (id: string) => {
    const item = accommodations.find((a) => a.id === id);
    if (item) {
      setEditingAccommodation(item);
    }
  };

  if (isLoading) {
    return (
      <div
        className="collage-root"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          background: 'var(--c-creme)',
        }}
      >
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--c-pen)' }} />
      </div>
    );
  }

  return (
    <div
      className="collage-root"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--c-creme)',
      }}
    >
      {/* Concierge-card header — "your stay" overline + title, taped */}
      <header
        style={{
          position: 'relative',
          padding: '20px 20px 18px',
          borderBottom: '1px solid var(--c-line)',
          background: 'var(--c-paper)',
        }}
      >
        <Tape position="top-left" rotate={-6} width={72} opacity={0.7} />
        <Tape position="top-right" rotate={4} width={56} opacity={0.6} />

        <div
          style={{
            fontFamily: 'var(--c-font-display)',
            fontSize: 10,
            letterSpacing: '.26em',
            textTransform: 'uppercase',
            color: 'var(--c-pen)',
            marginBottom: 6,
          }}
        >
          your stay
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <h2
            style={{
              fontFamily: 'var(--c-font-body)',
              fontWeight: 500,
              fontSize: 22,
              lineHeight: 1.1,
              letterSpacing: '-.005em',
              margin: 0,
              color: 'var(--c-ink)',
            }}
          >
            {selected?.title ?? 'No stay booked yet'}
          </h2>
          {selected ? (
            <Stamp variant="outline" size="sm" rotate={-2}>
              booked
            </Stamp>
          ) : (
            <MarginNote rotate={-1} size={18}>
              pick a place to come back to →
            </MarginNote>
          )}
        </div>

        {selected?.address && (
          <p
            aria-label={selected.address}
            style={{
              fontFamily: 'var(--c-font-script)',
              fontWeight: 600,
              fontSize: 18,
              color: 'var(--c-ink-muted)',
              margin: '6px 0 0',
              lineHeight: 1.25,
            }}
          >
            {selected.address}
          </p>
        )}
      </header>

      <ScrollArea className="flex-1">
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Add Form */}
          <AccommodationAddForm />

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {/* Selected Drop Zone */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Stamp variant="ink" size="sm" rotate={-2}>
                  the one we picked
                </Stamp>
              </div>
              <SelectedDropZone
                selected={selected}
                isOver={isOverDropZone}
                onShowOnMap={handleShowOnMap}
                onGetDirections={handleGetDirections}
                onUnselect={handleUnselect}
                onEdit={() => selected && setEditingAccommodation(selected)}
              />
            </section>

            {/* Candidates */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Stamp variant="outline" size="sm" rotate={-1}>
                  candidates
                </Stamp>
                <span
                  style={{
                    fontFamily: 'var(--c-font-display)',
                    fontSize: 10,
                    letterSpacing: '.22em',
                    textTransform: 'uppercase',
                    color: 'var(--c-ink-muted)',
                  }}
                >
                  {candidates.length} on the short list
                </span>
              </div>
              <CandidateList
                candidates={candidates}
                activeId={activeId}
                onEdit={handleEdit}
                onDeprioritize={handleDeprioritize}
                onDelete={handleDelete}
              />
            </section>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeItem && (
                <Card
                  className="p-3"
                  style={{
                    background: 'var(--c-paper)',
                    border: '1px solid var(--c-pen)',
                    borderRadius: 'var(--c-r-sm)',
                    boxShadow: 'var(--c-shadow)',
                    transform: 'rotate(-1deg)',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--c-font-body)',
                      fontWeight: 500,
                      color: 'var(--c-ink)',
                      margin: 0,
                    }}
                  >
                    {activeItem.title}
                  </p>
                </Card>
              )}
            </DragOverlay>
          </DndContext>

          {/* Deprioritized Section */}
          {deprioritized.length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Stamp variant="plain" size="sm" rotate={1}>
                  set aside
                </Stamp>
                <MarginNote rotate={-1} size={16} color="ink">
                  — not forgotten
                </MarginNote>
              </div>
              <DeprioritizedSection
                items={deprioritized}
                onUnhide={handleUnhide}
                onDelete={handleDelete}
              />
            </section>
          )}
        </div>
      </ScrollArea>

      {/* Selection Details Dialog */}
      <SelectionDetailsDialog
        accommodation={pendingSelection || editingAccommodation}
        open={!!(pendingSelection || editingAccommodation)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingSelection(null);
            setEditingAccommodation(null);
          }
        }}
        onConfirm={handleSelectConfirm}
        isPending={selectMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
