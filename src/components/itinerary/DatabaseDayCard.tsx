import { useState, useCallback, useMemo } from 'react';
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
import '@/preview/collage/collage.css';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { Tape } from '@/preview/collage/ui/Tape';
import { MarginNote } from '@/preview/collage/ui/MarginNote';

/**
 * Day card — migrated to Collage (Phase 4 #2 core, W3.3a). Presentation only:
 * all state, hooks, drag-and-drop sortable wiring, memory prompt, editor
 * dialogs, map/photo viewer, celebration confetti preserved.
 *
 * Paper plate with a taped strip per day. Stamped day-of-week, italic date
 * line, ink progress bar (no blue-ring-for-ring on completion — pen accent
 * only). Activities sit beneath as ±2° paper chips with hairline dashed
 * dividers, echoing the Session Blocks aesthetic.
 */

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
  /** Index of the day in the list — rotates the tape strip for visual variety. */
  dayIndex?: number;
}

export function DatabaseDayCard({ day, nextActivityId, isReceivingDrag, previewTimes, dayIndex = 0 }: DatabaseDayCardProps) {
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

  // Tape rotates by day index so a column of day cards doesn't look identical.
  const tapeRotate = ((dayIndex % 4) - 2) * 2; // -4, -2, 0, 2 cycle

  return (
    <>
      {/* Confetti celebration for day completion */}
      <Confetti
        trigger={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />

      <div
        className="collage-root"
        style={{
          position: 'relative',
          background: 'var(--c-paper)',
          boxShadow: 'var(--c-shadow)',
          marginTop: 14, // room for tape to overhang
          // Highlight when receiving a cross-day drag: dashed pen-blue ring
          outline: isReceivingDrag ? '2px dashed var(--c-pen)' : 'none',
          outlineOffset: isReceivingDrag ? '-2px' : 0,
          transition: 'outline var(--c-t-fast) var(--c-ease-out)',
        }}
      >
        <Tape position="top-left" rotate={tapeRotate} width={82} />

        <Collapsible
          open={!isCollapsed}
          onOpenChange={(open) => toggleSection.mutate({ sectionId: day.id, isCollapsed: !open })}
        >
          <CollapsibleTrigger asChild>
            <div
              className="cursor-pointer"
              style={{
                padding: '22px 20px 16px',
                transition: 'background var(--c-t-fast)',
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(247, 243, 233, .4)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {/* Stamped day-of-week eyebrow */}
                  <Stamp variant="outline" size="sm" rotate={-2} style={{ marginBottom: 6 }}>
                    {day.dayOfWeek}
                  </Stamp>
                  <h3
                    style={{
                      fontFamily: 'var(--c-font-body)',
                      fontSize: 20,
                      fontWeight: 500,
                      lineHeight: 1.2,
                      margin: '4px 0 2px',
                      color: 'var(--c-ink)',
                    }}
                  >
                    {day.title}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      style={{
                        fontFamily: 'var(--c-font-body)',
                        fontStyle: 'italic',
                        fontSize: 13,
                        color: 'var(--c-ink-muted)',
                        margin: 0,
                      }}
                    >
                      {day.date}
                    </p>
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

                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Show Day on Map — ghost with pen-on-hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShowDayOnMap();
                    }}
                    style={{
                      padding: 6,
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--c-ink-muted)',
                      cursor: 'pointer',
                      transition: 'color var(--c-t-fast)',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.color = 'var(--c-pen)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = 'var(--c-ink-muted)'; }}
                    title="Show day on map"
                    aria-label="Show day on map"
                  >
                    <Map className="w-4 h-4" />
                  </button>

                  {/* Progress count */}
                  <div className="flex items-center gap-2">
                    {progressPercent === 100 && (
                      <CheckCircle2
                        className="w-4 h-4 animate-bounce-in"
                        style={{ color: 'var(--c-success)' }}
                      />
                    )}
                    <span
                      style={{
                        fontFamily: 'var(--c-font-display)',
                        fontSize: 10,
                        letterSpacing: '.2em',
                        color: 'var(--c-ink-muted)',
                      }}
                    >
                      <AnimatedCounter value={completedCount} />/{totalCount}
                    </span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 transition-transform",
                      !isCollapsed && "rotate-180"
                    )}
                    style={{ color: 'var(--c-ink-muted)' }}
                  />
                </div>
              </div>

              {/* Progress rail — ink hairline → pen fill */}
              {totalCount > 0 && (
                <div
                  style={{
                    width: '100%',
                    height: 2,
                    background: 'var(--c-line)',
                    marginTop: 12,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      background: progressPercent === 100 ? 'var(--c-success)' : 'var(--c-pen)',
                      width: `${progressPercent}%`,
                      transition: 'width 0.5s cubic-bezier(0.22, 0.61, 0.36, 1)',
                    }}
                  />
                </div>
              )}

              {isDayComplete && (
                <MarginNote rotate={-3} size={18} style={{ position: 'absolute', top: 18, right: 58 }}>
                  done!
                </MarginNote>
              )}
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div
              style={{
                padding: '4px 20px 22px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                borderTop: '1px dashed var(--c-line)',
              }}
            >
              <SortableContext
                items={day.activities.map(a => a.id)}
                strategy={verticalListSortingStrategy}
              >
                {day.activities.map((activity, idx) => (
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
                        cardIndex={idx}
                      />
                    </SwipeableActivityCard>
                  </DraggableActivity>
                ))}
              </SortableContext>

              {/* Quick Add Row */}
              <QuickAddRow dayId={day.id} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

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
