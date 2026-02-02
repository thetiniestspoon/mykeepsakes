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
import { Home, Loader2 } from 'lucide-react';
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
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Home className="w-6 h-6 text-primary" />
        <h2 className="font-display text-xl font-semibold">Stay</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
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
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Selected</h3>
              <SelectedDropZone
                selected={selected}
                isOver={isOverDropZone}
                onShowOnMap={handleShowOnMap}
                onGetDirections={handleGetDirections}
                onUnselect={handleUnselect}
                onEdit={() => selected && setEditingAccommodation(selected)}
              />
            </div>

            {/* Candidates */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Candidates ({candidates.length})
              </h3>
              <CandidateList
                candidates={candidates}
                activeId={activeId}
                onEdit={handleEdit}
                onDeprioritize={handleDeprioritize}
                onDelete={handleDelete}
              />
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeItem && (
                <Card className="shadow-lg ring-2 ring-primary p-3">
                  <p className="font-medium">{activeItem.title}</p>
                </Card>
              )}
            </DragOverlay>
          </DndContext>

          {/* Deprioritized Section */}
          <DeprioritizedSection
            items={deprioritized}
            onUnhide={handleUnhide}
            onDelete={handleDelete}
          />
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
