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
import { SwipeableActivityCard } from '@/components/itinerary/SwipeableActivityCard';
import { QuickAddRow } from '@/components/itinerary/QuickAddRow';
import { WeatherBadge } from '@/components/itinerary/WeatherBadge';
import { MapModal } from '@/components/map/MapModal';
import { PhotoViewer } from '@/components/photos/PhotoViewer';
import { MemoryPromptDialog } from '@/components/itinerary/MemoryPromptDialog';
import { 
  useCollapsedSections,
  useToggleSection,
} from '@/hooks/use-trip-data';
import { useUpdateItemStatus, type LegacyDay, type LegacyActivity } from '@/hooks/use-database-itinerary';
import { useReorderDayItems, calculateNewSortIndices } from '@/hooks/use-reorder-items';
import { useWeatherForDate } from '@/hooks/use-weather';
import type { ItemStatus } from '@/types/trip';

interface SelectedLocation {
  lat: number;
  lng: number;
  name: string;
  address?: string;
}

interface DatabaseDayCardProps {
  day: LegacyDay;
  nextActivityId?: string | null;
}

export function DatabaseDayCard({ day, nextActivityId }: DatabaseDayCardProps) {
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoViewerPhotos, setPhotoViewerPhotos] = useState<Array<{ id: string; storage_path: string; caption?: string | null }>>([]);
  const [photoViewerIndex, setPhotoViewerIndex] = useState(0);
  
  // Memory prompt state
  const [memoryPromptOpen, setMemoryPromptOpen] = useState(false);
  const [completedActivity, setCompletedActivity] = useState<LegacyActivity | null>(null);

  const { data: collapsedSections } = useCollapsedSections();
  const toggleSection = useToggleSection();
  const updateStatus = useUpdateItemStatus();
  const reorderItems = useReorderDayItems();
  
  // Get weather for this day's date
  const dayDateStr = useMemo(() => {
    // Parse the date from the formatted string back to ISO format
    const date = new Date(day.date);
    return date.toISOString().split('T')[0];
  }, [day.date]);
  const weatherData = useWeatherForDate(dayDateStr);
  
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
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    // Calculate new sort indices
    const newIndices = calculateNewSortIndices(
      day.activities.map(a => ({ id: a.id })),
      String(active.id),
      String(over.id)
    );
    
    if (newIndices.length > 0) {
      reorderItems.mutate(newIndices);
    }
  }, [day.activities, reorderItems]);

  const openMapModal = (location: SelectedLocation) => {
    setSelectedLocation(location);
    setMapModalOpen(true);
  };

  const openPhotoViewer = (photos: Array<{ id: string; storage_path: string; caption?: string | null }>, index: number) => {
    setPhotoViewerPhotos(photos);
    setPhotoViewerIndex(index);
    setPhotoViewerOpen(true);
  };
  
  // Handle activity completion with memory prompt
  const handleToggleComplete = useCallback((activity: LegacyActivity) => {
    const wasCompleted = activity.status === 'done';
    const newStatus: ItemStatus = wasCompleted ? 'planned' : 'done';
    
    updateStatus.mutate(
      { itemId: activity.id, status: newStatus },
      {
        onSuccess: () => {
          // Show memory prompt only when marking as done (not when undoing)
          if (!wasCompleted) {
            setCompletedActivity(activity);
            setMemoryPromptOpen(true);
          }
        }
      }
    );
  }, [updateStatus]);
  
  // Handle skip action
  const handleSkip = useCallback((activity: LegacyActivity) => {
    updateStatus.mutate({ itemId: activity.id, status: 'skipped' });
  }, [updateStatus]);
  
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
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-muted-foreground">
                      {day.dayOfWeek}, {day.date}
                    </p>
                    {/* Weather badge */}
                    {weatherData && (
                      <WeatherBadge
                        temp={weatherData.tempHigh}
                        tempHigh={weatherData.tempHigh}
                        tempLow={weatherData.tempLow}
                        condition={weatherData.condition}
                      />
                    )}
                  </div>
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
                      <SwipeableActivityCard
                        activityId={activity.id}
                        isCompleted={activity.status === 'done'}
                        onComplete={() => handleToggleComplete(activity)}
                        onEdit={() => {/* TODO: Open editor */}}
                        onSkip={() => handleSkip(activity)}
                        onDelete={() => {/* TODO: Implement delete */}}
                        onAddMemory={() => {
                          setCompletedActivity(activity);
                          setMemoryPromptOpen(true);
                        }}
                      >
                        <DatabaseActivityCard 
                          activity={activity}
                          onOpenMap={openMapModal}
                          onOpenPhoto={openPhotoViewer}
                          isNextActivity={activity.id === nextActivityId}
                        />
                      </SwipeableActivityCard>
                    </DraggableActivity>
                  ))}
                </SortableContext>
              </DndContext>
              
              {/* Quick Add Row */}
              <QuickAddRow dayId={day.id} />
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
      
      {/* Memory Prompt Dialog */}
      {completedActivity && (
        <MemoryPromptDialog
          open={memoryPromptOpen}
          onOpenChange={setMemoryPromptOpen}
          activityTitle={completedActivity.title}
          activityId={completedActivity.id}
          dayId={day.id}
          onAddPhoto={() => {
            // TODO: Open memory capture dialog
            // For now, just close the prompt
          }}
        />
      )}
    </>
  );
}
