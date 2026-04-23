import { useState, useMemo } from 'react';
import { Loader2, Calendar, Ticket } from 'lucide-react';
import { useDatabaseItinerary, type LegacyActivity } from '@/hooks/use-database-itinerary';
import { DatabaseActivityCard } from '@/components/itinerary/DatabaseActivityCard';
import { TodayModeToggle } from '@/components/itinerary/TodayModeToggle';
import { useTodayMode } from '@/hooks/use-today-mode';
import { getTripMode } from '@/hooks/use-trip';
import '@/preview/collage/collage.css';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { StickerPill } from '@/preview/collage/ui/StickerPill';
import { Tape } from '@/preview/collage/ui/Tape';
import { MarginNote } from '@/preview/collage/ui/MarginNote';
import { cn } from '@/lib/utils';

/**
 * Session Blocks day-view — port of DayV2 (locked variant) into production.
 * Shows ONE day at a time with activities grouped into 4 time-of-day blocks
 * (Morning / Midday / Afternoon / Evening) in a wide auto-fit grid.
 *
 * Preserved interactivity: click-to-select activity → opens DetailPanel in
 * the parent Dashboard context (via DatabaseActivityCard's onSelect), edit
 * dialog (via DatabaseActivityCard's inline edit), today-mode filter,
 * chosen-only filter.
 *
 * Intentionally omitted: drag-reorder. Time-delta drag doesn't map cleanly
 * to a 4-column layout — drop position and Y-delta would fight, and items
 * would appear to teleport back to their original block after drop when
 * their start_time didn't change. Drag-reorder stays available in the
 * compact sidebar (DashboardItinerary).
 *
 * 2026-04-23 (W3.3a): polished mode badges + filter pills to use Collage
 * tokens (ink / pen / tape) instead of the leftover bg-muted / emerald slate.
 */

type BlockName = 'morning' | 'midday' | 'afternoon' | 'evening';

const BLOCKS: {
  key: BlockName;
  label: string;
  range: string;
  stamp: string;
  fromH: number;
  toH: number;
  tapeRotate: number;
}[] = [
  { key: 'morning',   label: 'Morning',   range: 'before 11', stamp: '☀ MORNING',   fromH: 0,  toH: 11, tapeRotate: -4 },
  { key: 'midday',    label: 'Midday',    range: '11 — 2',    stamp: '✦ MIDDAY',    fromH: 11, toH: 14, tapeRotate: 2 },
  { key: 'afternoon', label: 'Afternoon', range: '2 — 5',     stamp: '◈ AFTERNOON', fromH: 14, toH: 17, tapeRotate: -2 },
  { key: 'evening',   label: 'Evening',   range: 'after 5',   stamp: '◐ EVENING',   fromH: 17, toH: 24, tapeRotate: 4 },
];

function timeToBlock(iso?: string | null): BlockName {
  if (!iso) return 'midday';
  const h = parseInt(iso.slice(0, 2), 10);
  const block = BLOCKS.find(b => h >= b.fromH && h < b.toH);
  return block?.key ?? 'midday';
}

export function DatabaseItineraryTab() {
  const { days, trip, isLoading, isError } = useDatabaseItinerary();
  const [chosenOnly, setChosenOnly] = useState(false);
  const [selectedDayIdRaw, setSelectedDayIdRaw] = useState<string | null>(null);

  const hasChosenItems = useMemo(
    () => days.some(d => d.activities.some(a => a.isChosen)),
    [days]
  );

  const chosenCount = useMemo(
    () => days.reduce((n, d) => n + d.activities.filter(a => a.isChosen).length, 0),
    [days]
  );

  // BUG-06: pass unfiltered `days` so nextPlannedActivity sees all workshops.
  const {
    isTodayMode,
    toggleTodayMode,
    filteredDays,
    nextPlannedActivity,
    isActiveTrip,
    hasTodayContent,
  } = useTodayMode(days);

  // Apply chosen-only filter after today-mode filter for rendering only.
  const daysToRender = useMemo(() => {
    if (!chosenOnly) return filteredDays;
    return filteredDays.map(day => ({
      ...day,
      activities: day.activities.filter(a => a.isChosen || !a.track),
    }));
  }, [filteredDays, chosenOnly]);

  // Resolve selected day with fallback — if current selection isn't in the
  // rendered list (filtered out), fall back to the first available day.
  const selectedDayId = useMemo(() => {
    if (selectedDayIdRaw && daysToRender.some(d => d.id === selectedDayIdRaw)) {
      return selectedDayIdRaw;
    }
    return daysToRender[0]?.id ?? null;
  }, [selectedDayIdRaw, daysToRender]);

  const selectedDay = useMemo(
    () => daysToRender.find(d => d.id === selectedDayId),
    [daysToRender, selectedDayId]
  );

  // Group the selected day's activities by time-of-day block.
  const grouped = useMemo(() => {
    const map = new Map<BlockName, LegacyActivity[]>();
    BLOCKS.forEach(b => map.set(b.key, []));
    if (!selectedDay) return map;
    selectedDay.activities.forEach(a => {
      const key = timeToBlock(a.rawStartTime);
      map.get(key)!.push(a);
    });
    return map;
  }, [selectedDay]);

  if (isLoading) {
    return (
      <div className="collage-root flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--c-ink-muted)' }} />
      </div>
    );
  }

  if (isError || !trip) {
    return (
      <div className="collage-root text-center py-12">
        <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--c-ink-muted)' }} />
        <p style={{ fontFamily: 'var(--c-font-body)', color: 'var(--c-ink-muted)', margin: 0 }}>
          No trip itinerary found.
        </p>
        <p
          style={{
            fontFamily: 'var(--c-font-body)',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--c-ink-muted)',
            marginTop: 4,
          }}
        >
          Create a trip to get started!
        </p>
      </div>
    );
  }

  const mode = getTripMode(trip);

  const startDate = new Date(trip.start_date + 'T00:00:00');
  const endDate = new Date(trip.end_date + 'T00:00:00');
  const dateRange = `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} — ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

  const allActivities = days.flatMap(d => d.activities.filter(a => a.itemType === 'activity'));
  const completedCount = allActivities.filter(a => a.status === 'done').length;
  const totalCount = allActivities.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const selectedDayIndex = daysToRender.findIndex(d => d.id === selectedDayId);
  const selectedDayDateLabel = selectedDay?.date
    ? new Date(selectedDay.date + 'T00:00:00').toLocaleString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
      })
    : '';

  return (
    <div className="collage-root space-y-6 pb-20 px-4 sm:px-8 pt-6">
      {/* Trip header */}
      <header className="text-center space-y-2">
        <Stamp variant="outline" size="sm" rotate={-2}>the day · by block</Stamp>
        <h2
          style={{
            fontFamily: 'var(--c-font-body)',
            fontSize: 'clamp(22px, 3vw, 30px)',
            fontWeight: 500,
            color: 'var(--c-ink)',
            margin: '6px 0 0',
            lineHeight: 1.1,
          }}
        >
          {trip.title}
        </h2>
        <p
          style={{
            fontFamily: 'var(--c-font-body)',
            fontStyle: 'italic',
            color: 'var(--c-ink-muted)',
            margin: 0,
          }}
        >
          {dateRange}
        </p>

        {totalCount > 0 && (
          <div className="mt-3 max-w-xs mx-auto">
            <div
              className="flex justify-between mb-1"
              style={{
                fontFamily: 'var(--c-font-display)',
                fontSize: 9,
                letterSpacing: '.2em',
                textTransform: 'uppercase',
                color: 'var(--c-ink-muted)',
              }}
            >
              <span>Progress</span>
              <span>{completedCount}/{totalCount} · {progressPercent}%</span>
            </div>
            <div
              style={{
                width: '100%',
                height: 2,
                background: 'var(--c-line)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  background: 'var(--c-pen)',
                  width: `${progressPercent}%`,
                  transition: 'width 0.5s cubic-bezier(0.22, 0.61, 0.36, 1)',
                }}
              />
            </div>
          </div>
        )}

        {/* Mode badge — Collage tokens instead of emerald / blue semantic pills */}
        <div className="mt-2 flex justify-center">
          {mode === 'pre' && (
            <StickerPill variant="pen" rotate={-1} style={{ fontSize: 9, padding: '6px 10px' }}>
              Upcoming
            </StickerPill>
          )}
          {mode === 'active' && (
            <StickerPill variant="ink" rotate={1} style={{ fontSize: 9, padding: '6px 10px' }}>
              In Progress
            </StickerPill>
          )}
          {mode === 'post' && (
            <StickerPill variant="tape" rotate={-1} style={{ fontSize: 9, padding: '6px 10px' }}>
              Complete
            </StickerPill>
          )}
        </div>

        <div className="mt-4 flex flex-col items-center gap-3">
          <TodayModeToggle
            isTodayMode={isTodayMode}
            onToggle={toggleTodayMode}
            isActiveTrip={isActiveTrip}
          />

          {hasChosenItems && (
            <div
              className="flex items-center gap-0 rounded-[var(--c-r-sm)]"
              role="group"
              aria-label="Filter workshop sessions"
              style={{
                padding: 3,
                background: 'var(--c-creme)',
                border: '1px solid var(--c-line)',
              }}
            >
              <button
                onClick={() => setChosenOnly(false)}
                className={cn("inline-flex items-center gap-1.5 transition-all")}
                style={{
                  padding: '6px 12px',
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 9,
                  letterSpacing: '.2em',
                  textTransform: 'uppercase',
                  background: !chosenOnly ? 'var(--c-ink)' : 'transparent',
                  color: !chosenOnly ? 'var(--c-creme)' : 'var(--c-ink-muted)',
                  border: 'none',
                  borderRadius: 'var(--c-r-sm)',
                  cursor: 'pointer',
                }}
                aria-pressed={!chosenOnly}
              >
                <span>All sessions</span>
              </button>
              <button
                onClick={() => setChosenOnly(true)}
                className={cn("inline-flex items-center gap-1.5 transition-all")}
                style={{
                  padding: '6px 12px',
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 9,
                  letterSpacing: '.2em',
                  textTransform: 'uppercase',
                  background: chosenOnly ? 'var(--c-ink)' : 'transparent',
                  color: chosenOnly ? 'var(--c-creme)' : 'var(--c-ink-muted)',
                  border: 'none',
                  borderRadius: 'var(--c-r-sm)',
                  cursor: 'pointer',
                }}
                aria-pressed={chosenOnly}
                title="Plenaries, meals, and worship still shown"
              >
                <Ticket className="w-3 h-3 fill-current" aria-hidden="true" />
                <span>My picks</span>
              </button>
            </div>
          )}
        </div>

        <div role="status" aria-live="polite" className="sr-only">
          {chosenOnly
            ? `Showing ${chosenCount} registered workshop${chosenCount === 1 ? '' : 's'}; other workshop options hidden.`
            : 'Showing all sessions.'}
        </div>
      </header>

      {/* Day switcher */}
      {daysToRender.length > 0 && (
        <div
          className="flex items-center justify-center gap-2 flex-wrap"
          role="tablist"
          aria-label="Select day"
        >
          {daysToRender.map((d, i) => {
            const isSelected = d.id === selectedDayId;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDayIdRaw(d.id)}
                role="tab"
                aria-selected={isSelected}
                className="transition-opacity"
                style={{
                  opacity: isSelected ? 1 : 0.55,
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                <StickerPill variant={isSelected ? 'ink' : 'pen'} style={{ fontSize: 9, padding: '8px 10px' }}>
                  Day {i + 1}
                </StickerPill>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected day label */}
      {selectedDay && (
        <div className="text-center">
          <h3
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 18,
              fontWeight: 500,
              color: 'var(--c-ink)',
              margin: 0,
            }}
          >
            {selectedDay.title ?? `Day ${selectedDayIndex + 1}`}
          </h3>
          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontStyle: 'italic',
              fontSize: 14,
              color: 'var(--c-ink-muted)',
              margin: '2px 0 0',
            }}
          >
            {selectedDayDateLabel}
            {trip.location_name ? ` · ${trip.location_name}` : ''}
          </p>
        </div>
      )}

      {/* No-content fallback for today mode */}
      {isTodayMode && !hasTodayContent && (
        <div className="text-center py-8">
          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontStyle: 'italic',
              color: 'var(--c-ink-muted)',
              margin: 0,
            }}
          >
            No activities scheduled for today.
          </p>
          <button
            onClick={toggleTodayMode}
            style={{
              marginTop: 8,
              fontFamily: 'var(--c-font-body)',
              fontSize: 13,
              color: 'var(--c-pen)',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px dashed var(--c-pen)',
              cursor: 'pointer',
              paddingBottom: 1,
            }}
          >
            View full timeline
          </button>
        </div>
      )}

      {/* Block grid */}
      {selectedDay && (
        <div
          className="grid gap-6 sm:gap-8"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}
        >
          {BLOCKS.map(block => {
            const blockItems = grouped.get(block.key) ?? [];
            const hasAny = blockItems.length > 0;
            return (
              <section
                key={block.key}
                className="relative"
                style={{
                  background: 'var(--c-paper)',
                  boxShadow: 'var(--c-shadow)',
                  padding: '28px 24px 22px',
                  opacity: hasAny ? 1 : 0.55,
                }}
              >
                <Tape position="top" rotate={block.tapeRotate} />

                <div className="flex items-baseline justify-between mb-5 gap-2">
                  <span
                    style={{
                      fontFamily: 'var(--c-font-display)',
                      fontSize: 14,
                      letterSpacing: '.2em',
                      color: 'var(--c-ink)',
                    }}
                  >
                    {block.stamp}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--c-font-body)',
                      fontStyle: 'italic',
                      color: 'var(--c-ink-muted)',
                      fontSize: 12,
                    }}
                  >
                    {block.range}
                  </span>
                </div>

                {!hasAny && (
                  <MarginNote rotate={-1} size={18} style={{ display: 'block' }}>
                    (nothing here)
                  </MarginNote>
                )}

                <div className="space-y-3">
                  {blockItems.map((activity, idx) => (
                    <div
                      key={activity.id}
                      style={{
                        paddingBottom: idx === blockItems.length - 1 ? 0 : 10,
                        borderBottom: idx === blockItems.length - 1 ? 'none' : '1px dashed var(--c-line)',
                      }}
                    >
                      <DatabaseActivityCard
                        activity={activity}
                        isNextActivity={activity.id === nextPlannedActivity?.activityId}
                        cardIndex={idx}
                      />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DatabaseItineraryTab;
