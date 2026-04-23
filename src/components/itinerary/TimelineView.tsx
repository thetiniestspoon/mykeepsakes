import { useMemo } from 'react';
import { TimelineItem } from './TimelineItem';
import { NowIndicator } from './NowIndicator';
import type { LegacyDay, LegacyActivity } from '@/hooks/use-database-itinerary';
import { getTripMode, useActiveTrip } from '@/hooks/use-trip';
import '@/preview/collage/collage.css';

/**
 * Hour-ruled timeline — migrated to Collage (Phase 4 #2 core, W3.3a).
 * Presentation only. Time parsing, filter split (timed vs untimed), NowIndicator
 * mounting all preserved. Hour labels moved to stamp typography; center rail
 * is a hairline ink line; untimed section gets an "Anytime" stamp header.
 *
 * NowIndicator itself is out of scope (W3.3b) — rendered unmodified.
 */

interface TimelineViewProps {
  day: LegacyDay;
  nextActivityId?: string | null;
  onActivityClick?: (activity: LegacyActivity) => void;
}

// Parse time string like "10:00 AM" to minutes from midnight
function parseTimeToMinutes(timeStr: string): number | null {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

// Generate hour labels from 6 AM to 11 PM
const HOUR_LABELS = Array.from({ length: 18 }, (_, i) => {
  const hour = i + 6;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return { hour, label: `${displayHour}${period.toLowerCase()}` };
});

export function TimelineView({ day, nextActivityId, onActivityClick }: TimelineViewProps) {
  const { data: trip } = useActiveTrip();
  const mode = trip ? getTripMode(trip) : 'pre';
  const showNowIndicator = mode === 'active';

  // Separate activities with and without times
  const { timedActivities, untimedActivities } = useMemo(() => {
    const timed: Array<{ activity: typeof day.activities[0]; minutes: number }> = [];
    const untimed: typeof day.activities = [];

    day.activities.forEach(activity => {
      if (activity.itemType === 'marker') return; // Skip markers in timeline view

      if (activity.time) {
        const minutes = parseTimeToMinutes(activity.time);
        if (minutes !== null) {
          timed.push({ activity, minutes });
        } else {
          untimed.push(activity);
        }
      } else {
        untimed.push(activity);
      }
    });

    // Sort timed activities by time
    timed.sort((a, b) => a.minutes - b.minutes);

    return { timedActivities: timed, untimedActivities: untimed };
  }, [day.activities]);

  return (
    <div className="collage-root space-y-4">
      {/* Untimed activities section */}
      {untimedActivities.length > 0 && (
        <div className="space-y-2">
          <h4
            style={{
              fontFamily: 'var(--c-font-display)',
              fontSize: 10,
              letterSpacing: '.24em',
              textTransform: 'uppercase',
              color: 'var(--c-ink-muted)',
              margin: '0 0 6px',
            }}
          >
            ◇ ANYTIME
          </h4>
          <div className="space-y-2">
            {untimedActivities.map(activity => (
              <TimelineItem
                key={activity.id}
                activity={activity}
                isNext={activity.id === nextActivityId}
                onClick={() => onActivityClick?.(activity)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Timed activities timeline */}
      {timedActivities.length > 0 && (
        <div className="relative">
          {/* Hour markers — stamped typography, ink-muted */}
          <div className="absolute left-0 top-0 bottom-0 w-14 flex flex-col" aria-hidden="true">
            {HOUR_LABELS.filter((_, i) => i % 2 === 0).map(({ hour, label }) => (
              <div key={hour} className="flex-1 flex items-start">
                <span
                  style={{
                    fontFamily: 'var(--c-font-display)',
                    fontSize: 9,
                    letterSpacing: '.16em',
                    color: 'var(--c-ink-muted)',
                    transform: 'translateY(-50%)',
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Timeline track — ink hairline, not muted border */}
          <div
            className="relative min-h-[400px] space-y-3"
            style={{
              marginLeft: 56,
              borderLeft: '1px solid var(--c-ink)',
              paddingLeft: 16,
            }}
          >
            {showNowIndicator && <NowIndicator activities={day.activities} />}

            {timedActivities.map(({ activity }) => (
              <TimelineItem
                key={activity.id}
                activity={activity}
                isNext={activity.id === nextActivityId}
                onClick={() => onActivityClick?.(activity)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {timedActivities.length === 0 && untimedActivities.length === 0 && (
        <div
          className="text-center py-8"
          style={{
            fontFamily: 'var(--c-font-body)',
            fontStyle: 'italic',
            color: 'var(--c-ink-muted)',
          }}
        >
          No activities scheduled for this day
        </div>
      )}
    </div>
  );
}
