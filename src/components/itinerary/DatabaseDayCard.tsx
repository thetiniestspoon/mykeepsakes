import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ChevronDown, CheckCircle2, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardSelection, type SelectedItem } from '@/contexts/DashboardSelectionContext';
import { toast } from 'sonner';
import { DraggableActivity } from '@/components/itinerary/DraggableActivity';
import { DatabaseActivityCard } from '@/components/itinerary/DatabaseActivityCard';
import { SwipeableActivityCard } from '@/components/itinerary/SwipeableActivityCard';
import { QuickAddRow } from '@/components/itinerary/QuickAddRow';
import { WeatherBadge } from '@/components/itinerary/WeatherBadge';
import { StaggeredList } from '@/components/ui/staggered-list';
import { Confetti } from '@/components/ui/confetti';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { MapModal } from '@/components/map/MapModal';
import { PhotoViewer } from '@/components/photos/PhotoViewer';
import { MemoryPromptDialog } from '@/components/itinerary/MemoryPromptDialog';
import { MemoryCaptureDialog } from '@/components/album/MemoryCaptureDialog';
import { DatabaseActivityEditor } from '@/components/itinerary/DatabaseActivityEditor';
import { 
  useCollapsedSections,
  useToggleSection,
} from '@/hooks/use-trip-data';
import { useUpdateItemStatus, type LegacyDay, type LegacyActivity } from '@/hooks/use-database-itinerary';
import { useDeleteItem } from '@/hooks/use-itinerary';
import { useActiveTrip, useTripDays } from '@/hooks/use-trip';
import { useLocations } from '@/hooks/use-locations';
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
  isReceivingDrag?: boolean;  // True when item from another day is hovering
  previewTimes?: Map<string, string>;  // Activity ID -> preview time during drag
}

export function DatabaseDayCard({ day, nextActivityId, isReceivingDrag, previewTimes }: DatabaseDayCardProps) {
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoViewerPhotos, setPhotoViewerPhotos] = useState<Array<{ id: string; storage_path: string; caption?: string | null }>>([]);
  const [photoViewerIndex, setPhotoViewerIndex] = useState(0);
  
  // Memory prompt state
  const [memoryPromptOpen, setMemoryPromptOpen] = useState(false);
  const [completedActivity, setCompletedActivity] = useState<LegacyActivity | null>(null);
  
  // Memory capture dialog state (for adding photos directly)
  const [memoryCaptureOpen, setMemoryCaptureOpen] = useState(false);
  const [memoryTargetActivity, setMemoryTargetActivity] = useState<LegacyActivity | null>(null);
  
  // Activity editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<LegacyActivity | null>(null);
  
  // Confetti celebration state
  const [showConfetti, setShowConfetti] = useState(false);
  const [prevCompletedCount, setPrevCompletedCount] = useState(0);

  const { data: collapsedSections } = useCollapsedSections();
  const toggleSection = useToggleSection();
  const updateStatus = useUpdateItemStatus();
  const deleteItem = useDeleteItem();
  const { highlightPins, navigateToPanel, selectItem } = useDashboardSelection();
  
  // Get trip data for memory capture dialog
  const { data: trip } = useActiveTrip();
  const { data: daysData } = useTripDays(trip?.id);
  const { data: locations } = useLocations(trip?.id);
  
  // Convert days for MemoryCaptureDialog
  const legacyDays = daysData?.map((d, index) => ({
    id: d.id,
    date: d.date,
    dayOfWeek: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }),
    title: d.title || `Day ${index + 1}`,
    activities: []
  })) || [];
  
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
  
  // Check for day completion celebration
  const isDayComplete = totalCount > 0 && completedCount === totalCount;
  
  // Trigger confetti when all activities are completed
  useMemo(() => {
    if (isDayComplete && completedCount > prevCompletedCount && prevCompletedCount > 0) {
      setShowConfetti(true);
    }
    if (completedCount !== prevCompletedCount) {
      setPrevCompletedCount(completedCount);
    }
  }, [completedCount, isDayComplete, prevCompletedCount]);

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
  
  // Handle showing all day's locations on the map
  const handleShowDayOnMap = useCallback(() => {
    // Get activities with valid location coordinates
    const locationsWithCoords = day.activities
      .filter(a => a.location?.lat && a.location?.lng && a.location?.id)
      .map(a => a.location!.id);
    
    if (locationsWithCoords.length === 0) {
      toast.info('No locations to show on map for this day');
      return;
    }
    
    // Highlight all pins for this day
    highlightPins(locationsWithCoords, `${day.dayOfWeek} - ${day.title}`);
    
    // Navigate to Map panel
    navigateToPanel(2);
  }, [day, highlightPins, navigateToPanel]);
  
  return (
    <>
      {/* Confetti celebration for day completion */}
      <Confetti 
        trigger={showConfetti} 
        onComplete={() => setShowConfetti(false)}
      />
      
      <Collapsible
        open={!isCollapsed}
        onOpenChange={(open) => toggleSection.mutate({ sectionId: day.id, isCollapsed: !open })}
      >
        <Card className={cn(
          "shadow-warm overflow-hidden transition-all duration-200",
          isReceivingDrag && "ring-2 ring-dashed ring-primary/50 bg-primary/5 animate-day-expand"
        )}>
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
                  {/* Show Day on Map button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent collapsible toggle
                      handleShowDayOnMap();
                    }}
                    className="p-1.5 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-accent transition-colors"
                    title="Show day on map"
                  >
                    <Map className="w-4 h-4" />
                  </button>
                  
                  {/* Progress indicator with animated counter */}
                  <div className="flex items-center gap-2">
                    {progressPercent === 100 && (
                      <CheckCircle2 className="w-4 h-4 text-green-600 animate-bounce-in" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      <AnimatedCounter value={completedCount} />/{totalCount}
                    </span>
                  </div>
                  <ChevronDown className={cn(
                    "w-5 h-5 text-muted-foreground transition-transform",
                    !isCollapsed && "rotate-180"
                  )} />
                </div>
              </div>
              
              {/* Animated Progress bar */}
              {totalCount > 0 && (
                <div className="w-full h-1 bg-muted rounded-full mt-2 overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500 ease-out",
                      progressPercent === 100 ? "bg-green-500" : "bg-primary"
                    )}
                    style={{ 
                      width: `${progressPercent}%`,
                      transition: 'width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                  />
                </div>
              )}
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="space-y-3 pt-0">
              <SortableContext
                items={day.activities.map(a => a.id)}
                strategy={verticalListSortingStrategy}
              >
                {day.activities.map((activity) => (
                  <DraggableActivity 
                    key={activity.id} 
                    id={activity.id}
                    originalTime={activity.rawStartTime}
                    previewTime={previewTimes?.get(activity.id)}
                  >
                    <SwipeableActivityCard
                      activityId={activity.id}
                      isCompleted={activity.status === 'done'}
                      onComplete={() => handleToggleComplete(activity)}
                      onEdit={() => {
                        setEditingActivity(activity);
                        setEditorOpen(true);
                      }}
                      onSkip={() => handleSkip(activity)}
                      onDelete={() => deleteItem.mutate(activity.id)}
                      onAddMemory={() => {
                        setMemoryTargetActivity(activity);
                        setMemoryCaptureOpen(true);
                      }}
                    >
                      <DatabaseActivityCard 
                        activity={activity}
                        onOpenMap={openMapModal}
                        onOpenPhoto={openPhotoViewer}
                        isNextActivity={activity.id === nextActivityId}
                        onSelect={() => selectItem('activity', activity.id, activity as unknown as SelectedItem['data'])}
                      />
                    </SwipeableActivityCard>
                  </DraggableActivity>
                ))}
              </SortableContext>
              
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
            setMemoryTargetActivity(completedActivity);
            setMemoryCaptureOpen(true);
          }}
        />
      )}
      
      {/* Memory Capture Dialog */}
      <MemoryCaptureDialog
        open={memoryCaptureOpen}
        onOpenChange={setMemoryCaptureOpen}
        tripId={trip?.id}
        days={legacyDays}
        locations={locations || []}
        preselectedDayId={day.id}
        preselectedLocationId={memoryTargetActivity?.location?.id}
        itineraryItemId={memoryTargetActivity?.id}
      />
      
      {/* Activity Editor */}
      {trip && (
        <DatabaseActivityEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          dayId={day.id}
          tripId={trip.id}
          activity={editingActivity}
        />
      )}
    </>
  );
}
