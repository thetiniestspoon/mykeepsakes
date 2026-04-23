import { useMemo } from 'react';
import type { LegacyActivity } from '@/hooks/use-database-itinerary';
import '@/preview/collage/collage.css';

interface NowIndicatorProps {
  activities: LegacyActivity[];
}

/**
 * NowIndicator — migrated to Collage direction (Phase 4 #2 support).
 * "You are here" marker in the timeline. Pen-blue stamp + hairline rule.
 * Position calculation unchanged; presentation only. Respects
 * prefers-reduced-motion (nothing pulsing or animated by default).
 */
export function NowIndicator({ activities: _activities }: NowIndicatorProps) {
  void _activities; // reserved for future time-aware marker logic

  const position = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Calculate current time as hours from 6 AM
    const startHour = 6;
    const endHour = 23;
    const hoursFromStart = currentHour - startHour + currentMinute / 60;
    const totalHours = endHour - startHour;

    // Return percentage position
    const percentage = (hoursFromStart / totalHours) * 100;
    return Math.max(0, Math.min(100, percentage));
  }, []);

  const timeLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, []);

  return (
    <div
      className="collage-root"
      role="presentation"
      aria-label={`Current time ${timeLabel}`}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: `${position}%`,
        display: 'flex',
        alignItems: 'center',
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginLeft: -4,
          padding: '4px 8px',
          background: 'var(--c-pen)',
          color: 'var(--c-creme)',
          fontFamily: 'var(--c-font-display)',
          fontSize: 10,
          letterSpacing: '.22em',
          textTransform: 'uppercase',
          borderRadius: 'var(--c-r-sm)',
          boxShadow: 'var(--c-shadow-sm)',
          lineHeight: 1,
          transform: 'rotate(-2deg)',
        }}
      >
        <span
          aria-hidden
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--c-creme)',
            display: 'inline-block',
          }}
        />
        now
      </span>
      <span
        aria-hidden
        style={{
          flex: 1,
          height: 1,
          background: 'var(--c-pen)',
          opacity: 0.55,
          marginLeft: 4,
        }}
      />
    </div>
  );
}
