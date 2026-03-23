import { useMemo, useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { ChevronDown, CheckCircle2, Calendar, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CompactActivityCard } from './CompactActivityCard';
import { DraggableActivity } from '@/components/itinerary/DraggableActivity';
import { WeatherBadge } from '@/components/itinerary/WeatherBadge';
import { useCollapsedSections, useToggleSection } from '@/hooks/use-trip-data';
import { useWeatherForDate } from '@/hooks/use-weather';
import { useActiveTrip } from '@/hooks/use-trip';
import type { LegacyDay } from '@/hooks/use-database-itinerary';
import type { ItineraryDay } from '@/types/trip';
import { lazy, Suspense } from 'react';

const DispatchEditor = lazy(() => import('@/components/dispatch/DispatchEditor'));

interface CompactDayCardProps {
  day: LegacyDay;
  nextActivityId?: string | null;
  isToday?: boolean;
  isReceivingDrag?: boolean;
  previewTimes?: Map<string, string>;
}

/**
 * Compact day card for the dashboard left column.
 * Shows day header with weather and collapsible list of compact activity cards.
 * Now with SortableContext for drag-and-drop reordering.
 */
export function CompactDayCard({
  day,
  nextActivityId,
  isToday,
  isReceivingDrag,
  previewTimes
}: CompactDayCardProps) {
  const { data: collapsedSections } = useCollapsedSections();
  const toggleSection = useToggleSection();
  const { data: trip } = useActiveTrip();
  const [dispatchOpen, setDispatchOpen] = useState(false);

  // Make the day card a droppable target
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: day.id,
  });

  // Get weather for this day's date
  const dayDateStr = useMemo(() => {
    const date = new Date(day.date);
    return date.toISOString().split('T')[0];
  }, [day.date]);
  const weatherData = useWeatherForDate(dayDateStr);

  const isCollapsed = collapsedSections?.[day.id] ?? false;

  // Filter out markers for completion count
  const activityItems = day.activities.filter(a => a.itemType === 'activity');
  const completedCount = activityItems.filter(a => a.status === 'done').length;
  const totalCount = activityItems.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isDayComplete = totalCount > 0 && completedCount === totalCount;

  // Activity IDs for sortable context
  const activityIds = useMemo(() => day.activities.map(a => a.id), [day.activities]);

  // Build a minimal ItineraryDay for DispatchEditor
  const itineraryDay = useMemo<ItineraryDay>(() => ({
    id: day.id,
    trip_id: trip?.id ?? '',
    date: dayDateStr,
    title: day.title,
    sort_index: 0,
    created_at: '',
    updated_at: '',
  }), [day.id, day.title, dayDateStr, trip?.id]);

  return (
    <Collapsible
      open={!isCollapsed}
      onOpenChange={(open) => toggleSection.mutate({ sectionId: day.id, isCollapsed: !open })}
    >
      <div
        ref={setDroppableRef}
        className={cn(
          "rounded-lg border bg-card overflow-hidden transition-all",
          isToday && "ring-2 ring-primary",
          isReceivingDrag && "ring-2 ring-dashed ring-primary/50 animate-day-expand bg-primary/5"
        )}
      >
        <CollapsibleTrigger asChild>
          <button className="w-full px-3 py-2 flex items-center justify-between hover:bg-accent/30 transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className={cn(
                "w-4 h-4 flex-shrink-0",
                isToday ? "text-primary" : "text-muted-foreground"
              )} />
              <div className="text-left min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{day.title}</span>
                  {isToday && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full flex-shrink-0">
                      Today
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{day.dayOfWeek}</span>
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
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Compact progress */}
              <div className="flex items-center gap-1">
                {isDayComplete ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <span className="text-xs text-muted-foreground">{completedCount}/{totalCount}</span>
                )}
              </div>
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                !isCollapsed && "rotate-180"
              )} />
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="h-0.5 bg-muted">
            <div
              className={cn(
                "h-full transition-all duration-300",
                isDayComplete ? "bg-green-500" : "bg-primary"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        <CollapsibleContent>
          <SortableContext items={activityIds} strategy={verticalListSortingStrategy}>
            <div className="p-2 space-y-1">
              {day.activities.map((activity) => (
                <DraggableActivity
                  key={activity.id}
                  id={activity.id}
                  originalTime={activity.rawStartTime || undefined}
                  previewTime={previewTimes?.get(activity.id)}
                >
                  <CompactActivityCard
                    activity={activity}
                    dayId={day.id}
                    isNextActivity={activity.id === nextActivityId}
                  />
                </DraggableActivity>
              ))}
            </div>
          </SortableContext>

          {/* Dispatch button */}
          {trip && (
            <div className="px-2 pb-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  setDispatchOpen(true);
                }}
              >
                <Send className="w-3.5 h-3.5" />
                Create Dispatch
              </Button>
            </div>
          )}
        </CollapsibleContent>
      </div>

      {/* Dispatch editor dialog (lazy loaded) */}
      {dispatchOpen && trip && (
        <Suspense fallback={null}>
          <DispatchEditor
            open={dispatchOpen}
            onOpenChange={setDispatchOpen}
            tripId={trip.id}
            day={itineraryDay}
            activities={[]}
          />
        </Suspense>
      )}
    </Collapsible>
  );
}
