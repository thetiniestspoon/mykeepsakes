import { useMemo, useState, lazy, Suspense } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { ChevronDown, CheckCircle2, Calendar, Send } from 'lucide-react';
import { CompactActivityCard } from './CompactActivityCard';
import { DraggableActivity } from '@/components/itinerary/DraggableActivity';
import { WeatherBadge } from '@/components/itinerary/WeatherBadge';
import { useCollapsedSections, useToggleSection } from '@/hooks/use-trip-data';
import { useWeatherForDate } from '@/hooks/use-weather';
import { useActiveTrip } from '@/hooks/use-trip';
import type { LegacyDay } from '@/hooks/use-database-itinerary';
import type { ItineraryDay } from '@/types/trip';
import '@/preview/collage/collage.css';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { Tape } from '@/preview/collage/ui/Tape';

const DispatchEditor = lazy(() => import('@/components/dispatch/DispatchEditor'));

interface CompactDayCardProps {
  day: LegacyDay;
  nextActivityId?: string | null;
  isToday?: boolean;
  isReceivingDrag?: boolean;
  previewTimes?: Map<string, string>;
}

/**
 * Compact day card — migrated to Collage 2026-04-23 (Phase 4 #1).
 * Taped paper envelope header with DAY X stamp; collapsible body hosts the
 * reorder list of CompactActivityCard. Today = pen-blue inset; receiving-drag =
 * dashed ink outline + tape tint. Progress hairline uses pen-blue on active,
 * success-green on done. Handlers / DnD / lazy dispatch editor preserved.
 */
export function CompactDayCard({
  day,
  nextActivityId,
  isToday,
  isReceivingDrag,
  previewTimes,
}: CompactDayCardProps) {
  const { data: collapsedSections } = useCollapsedSections();
  const toggleSection = useToggleSection();
  const { data: trip } = useActiveTrip();
  const [dispatchOpen, setDispatchOpen] = useState(false);

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: day.id,
  });

  const dayDateStr = useMemo(() => {
    const date = new Date(day.date);
    return date.toISOString().split('T')[0];
  }, [day.date]);
  const weatherData = useWeatherForDate(dayDateStr);

  const isCollapsed = collapsedSections?.[day.id] ?? false;

  const activityItems = day.activities.filter((a) => a.itemType === 'activity');
  const completedCount = activityItems.filter((a) => a.status === 'done').length;
  const totalCount = activityItems.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isDayComplete = totalCount > 0 && completedCount === totalCount;

  const activityIds = useMemo(() => day.activities.map((a) => a.id), [day.activities]);

  const itineraryDay = useMemo<ItineraryDay>(
    () => ({
      id: day.id,
      trip_id: trip?.id ?? '',
      date: dayDateStr,
      title: day.title,
      sort_index: 0,
      created_at: '',
      updated_at: '',
    }),
    [day.id, day.title, dayDateStr, trip?.id],
  );

  // Outer frame decoration
  const outerBorder = isToday
    ? '1.5px solid var(--c-pen)'
    : isReceivingDrag
      ? '2px dashed var(--c-ink)'
      : '1px solid var(--c-line)';

  return (
    <Collapsible
      open={!isCollapsed}
      onOpenChange={(open) =>
        toggleSection.mutate({ sectionId: day.id, isCollapsed: !open })
      }
    >
      <div
        ref={setDroppableRef}
        className="collage-root"
        style={{
          position: 'relative',
          background: isReceivingDrag ? 'rgba(246, 213, 92, 0.15)' : 'var(--c-paper)',
          border: outerBorder,
          borderRadius: 'var(--c-r-sm)',
          boxShadow: 'var(--c-shadow-sm)',
          overflow: 'visible',
          marginTop: 8, // for tape overhang
          transition: 'background var(--c-t-fast) var(--c-ease-out), border-color var(--c-t-fast)',
        }}
      >
        {isToday && <Tape position="top-right" rotate={6} width={60} />}

        <CollapsibleTrigger asChild>
          <button
            type="button"
            style={{
              appearance: 'none',
              cursor: 'pointer',
              width: '100%',
              padding: '12px 14px 10px',
              background: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textAlign: 'left',
              borderRadius: 'var(--c-r-sm) var(--c-r-sm) 0 0',
              transition: 'background var(--c-t-fast) var(--c-ease-out)',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = 'inset 0 0 0 2px var(--c-pen)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(29, 29, 27, 0.03)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                minWidth: 0,
                flex: 1,
              }}
            >
              <Calendar
                style={{
                  width: 16,
                  height: 16,
                  flexShrink: 0,
                  color: isToday ? 'var(--c-pen)' : 'var(--c-ink-muted)',
                }}
                aria-hidden
              />
              <div style={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span
                    style={{
                      fontFamily: 'var(--c-font-body)',
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'var(--c-ink)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.25,
                    }}
                  >
                    {day.title}
                  </span>
                  {isToday && (
                    <Stamp variant="pen" size="sm" style={{ fontSize: 9, padding: '3px 7px', flexShrink: 0 }}>
                      today
                    </Stamp>
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: 'var(--c-font-body)',
                    fontSize: 11,
                    fontStyle: 'italic',
                    color: 'var(--c-ink-muted)',
                    marginTop: 2,
                  }}
                >
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

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexShrink: 0,
              }}
            >
              {isDayComplete ? (
                <CheckCircle2
                  style={{ width: 14, height: 14, color: 'var(--c-success)' }}
                  aria-label="Day complete"
                />
              ) : totalCount > 0 ? (
                <span
                  style={{
                    fontFamily: 'var(--c-font-display)',
                    fontSize: 9,
                    letterSpacing: '.18em',
                    color: 'var(--c-ink-muted)',
                  }}
                >
                  {completedCount}/{totalCount}
                </span>
              ) : null}
              <ChevronDown
                style={{
                  width: 16,
                  height: 16,
                  color: 'var(--c-ink-muted)',
                  transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                  transition: 'transform var(--c-t-fast) var(--c-ease-out)',
                }}
                aria-hidden
              />
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Progress hairline */}
        {totalCount > 0 && (
          <div
            style={{
              height: 2,
              background: 'var(--c-line)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: isDayComplete ? 'var(--c-success)' : 'var(--c-pen)',
                transition: 'width var(--c-t-med) var(--c-ease-out)',
              }}
              aria-hidden
            />
          </div>
        )}

        <CollapsibleContent>
          <SortableContext items={activityIds} strategy={verticalListSortingStrategy}>
            <div
              style={{
                padding: 8,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
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

          {/* Dispatch button — paper-flat, pen-blue */}
          {trip && (
            <div style={{ padding: '0 8px 10px' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDispatchOpen(true);
                }}
                style={{
                  appearance: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  padding: '8px 10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  background: 'transparent',
                  color: 'var(--c-pen)',
                  border: '1px dashed var(--c-pen)',
                  borderRadius: 'var(--c-r-sm)',
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 10,
                  letterSpacing: '.2em',
                  textTransform: 'uppercase',
                  lineHeight: 1,
                  transition: 'background var(--c-t-fast), color var(--c-t-fast)',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 2px var(--c-pen)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'var(--c-pen)';
                  e.currentTarget.style.color = 'var(--c-creme)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--c-pen)';
                }}
              >
                <Send style={{ width: 12, height: 12 }} aria-hidden />
                Create Dispatch
              </button>
            </div>
          )}
        </CollapsibleContent>

        <style>{`
          @media (prefers-reduced-motion: reduce) {
            .collage-root { transition: none !important; }
            .collage-root [style*="transform"] { transition: none !important; }
          }
        `}</style>
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
