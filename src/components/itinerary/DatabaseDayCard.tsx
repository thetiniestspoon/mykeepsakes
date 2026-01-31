import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent 
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ChevronDown, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DraggableActivity } from '@/components/itinerary/DraggableActivity';
import { DatabaseActivityCard } from '@/components/itinerary/DatabaseActivityCard';
import { MapModal } from '@/components/map/MapModal';
import { PhotoViewer } from '@/components/photos/PhotoViewer';
import { 
  useCollapsedSections,
  useToggleSection,
} from '@/hooks/use-trip-data';
import type { LegacyDay } from '@/hooks/use-database-itinerary';

interface SelectedLocation {
  lat: number;
  lng: number;
  name: string;
  address?: string;
}

interface DatabaseDayCardProps {
  day: LegacyDay;
}

export function DatabaseDayCard({ day }: DatabaseDayCardProps) {
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoViewerPhotos, setPhotoViewerPhotos] = useState<Array<{ id: string; storage_path: string; caption?: string | null }>>([]);
  const [photoViewerIndex, setPhotoViewerIndex] = useState(0);

  const { data: collapsedSections } = useCollapsedSections();
  const toggleSection = useToggleSection();
  
  const isCollapsed = collapsedSections?.[day.id] ?? false;

  // Filter out markers for completion count (only count activities)
  const activityItems = day.activities.filter(a => a.itemType === 'activity');
  const completedCount = activityItems.filter(a => a.status === 'done').length;
  const totalCount = activityItems.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    // TODO: Implement reorder mutation for database items
    const { active, over } = event;
    if (over && active.id !== over.id) {
      // Will implement reordering in next iteration
      console.log('Reorder:', active.id, 'to', over.id);
    }
  }, []);

  const openMapModal = (location: SelectedLocation) => {
    setSelectedLocation(location);
    setMapModalOpen(true);
  };

  const openPhotoViewer = (photos: Array<{ id: string; storage_path: string; caption?: string | null }>, index: number) => {
    setPhotoViewerPhotos(photos);
    setPhotoViewerIndex(index);
    setPhotoViewerOpen(true);
  };
  
  return (
    <>
      <Collapsible
        open={!isCollapsed}
        onOpenChange={(open) => toggleSection.mutate({ sectionId: day.id, isCollapsed: !open })}
      >
        <Card className="shadow-warm overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-secondary/30 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display text-xl">{day.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {day.dayOfWeek}, {day.date}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Progress indicator */}
                  <div className="flex items-center gap-2">
                    {progressPercent === 100 && (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      {completedCount}/{totalCount}
                    </span>
                  </div>
                  <ChevronDown className={cn(
                    "w-5 h-5 text-muted-foreground transition-transform",
                    !isCollapsed && "rotate-180"
                  )} />
                </div>
              </div>
              
              {/* Progress bar */}
              {totalCount > 0 && (
                <div className="w-full h-1 bg-muted rounded-full mt-2 overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-300 rounded-full",
                      progressPercent === 100 ? "bg-green-500" : "bg-primary"
                    )}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="space-y-3 pt-0">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={day.activities.map(a => a.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {day.activities.map((activity) => (
                    <DraggableActivity key={activity.id} id={activity.id}>
                      <DatabaseActivityCard 
                        activity={activity}
                        onOpenMap={openMapModal}
                        onOpenPhoto={openPhotoViewer}
                      />
                    </DraggableActivity>
                  ))}
                </SortableContext>
              </DndContext>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Map Modal */}
      {selectedLocation && (
        <MapModal
          key={`${selectedLocation.lat}-${selectedLocation.lng}`}
          open={mapModalOpen}
          onOpenChange={setMapModalOpen}
          lat={selectedLocation.lat}
          lng={selectedLocation.lng}
          name={selectedLocation.name}
          address={selectedLocation.address}
        />
      )}

      {/* Photo Viewer */}
      <PhotoViewer
        photos={photoViewerPhotos}
        initialIndex={photoViewerIndex}
        open={photoViewerOpen}
        onOpenChange={setPhotoViewerOpen}
      />
    </>
  );
}
