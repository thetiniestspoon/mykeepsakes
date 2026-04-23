import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Utensils, Waves, Home, Car, PartyPopper, Activity, Ticket } from 'lucide-react';
import type { LegacyActivity } from '@/hooks/use-database-itinerary';
import '@/preview/collage/collage.css';
import { MarginNote } from '@/preview/collage/ui/MarginNote';

/**
 * Single row in TimelineView — migrated to Collage (Phase 4 #2 core, W3.3a).
 * Presentation only; onClick + status indicators unchanged.
 *
 * Paper chip with a pen-blue or tape-yellow left rule depending on state.
 * Up-next activity carries a Caveat "up next" margin note. Completed rows
 * strike through and mute; chosen activities get a tape-yellow rule.
 */

interface TimelineItemProps {
  activity: LegacyActivity;
  isNext?: boolean;
  onClick?: () => void;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  activity: Activity,
  dining: Utensils,
  beach: Waves,
  accommodation: Home,
  transport: Car,
  event: PartyPopper,
};

export function TimelineItem({ activity, isNext, onClick }: TimelineItemProps) {
  const Icon = categoryIcons[activity.category] || Activity;
  const isCompleted = activity.status === 'done';

  // Left-rule color encodes state: pen for up-next, tape for chosen, ink-line for default.
  const ruleColor = isNext
    ? 'var(--c-pen)'
    : activity.isChosen && !isCompleted
      ? 'var(--c-tape)'
      : 'var(--c-ink-muted)';

  return (
    <button
      onClick={onClick}
      className="collage-root w-full text-left"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        width: '100%',
        padding: '10px 12px',
        background: 'var(--c-paper)',
        boxShadow: 'var(--c-shadow-sm)',
        border: 'none',
        borderLeft: `3px solid ${ruleColor}`,
        borderRadius: 'var(--c-r-sm)',
        cursor: onClick ? 'pointer' : 'default',
        opacity: isCompleted ? 0.65 : 1,
        transition: 'box-shadow var(--c-t-fast) var(--c-ease-out), transform var(--c-t-fast)',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.boxShadow = 'var(--c-shadow)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.boxShadow = 'var(--c-shadow-sm)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Status indicator */}
      <div className="flex-shrink-0 mt-0.5">
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--c-success)' }} />
        ) : (
          <Circle
            className="w-5 h-5"
            style={{ color: isNext ? 'var(--c-pen)' : 'var(--c-ink-muted)' }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Icon className="w-4 h-4" style={{ color: 'var(--c-ink-muted)' }} />
          {activity.time && (
            <span
              style={{
                fontFamily: 'var(--c-font-display)',
                fontSize: 10,
                letterSpacing: '.18em',
                color: 'var(--c-ink-muted)',
              }}
            >
              {activity.time}
            </span>
          )}
          {isNext && (
            <MarginNote rotate={-3} size={16} color="pen">
              up next
            </MarginNote>
          )}
          {activity.isChosen && (
            <span
              className="inline-flex items-center gap-1"
              style={{
                fontFamily: 'var(--c-font-display)',
                fontSize: 9,
                letterSpacing: '.2em',
                textTransform: 'uppercase',
                color: 'var(--c-pen)',
                opacity: isCompleted ? 0.7 : 1,
              }}
            >
              <Ticket className="w-3 h-3 fill-current" aria-hidden="true" />
              Registered
            </span>
          )}
        </div>
        <h4
          className={cn(isCompleted && "line-through")}
          style={{
            fontFamily: 'var(--c-font-body)',
            fontSize: 15,
            fontWeight: 500,
            lineHeight: 1.3,
            margin: '3px 0 0',
            color: isCompleted ? 'var(--c-ink-muted)' : 'var(--c-ink)',
          }}
        >
          {activity.title}
        </h4>
        {activity.description && (
          <p
            className="line-clamp-2"
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 12,
              lineHeight: 1.5,
              color: 'var(--c-ink-muted)',
              margin: '2px 0 0',
            }}
          >
            {activity.description}
          </p>
        )}
        {activity.location && (
          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 11,
              color: 'var(--c-ink-muted)',
              margin: '4px 0 0',
            }}
          >
            <span aria-hidden="true">⌾</span> {activity.location.name}
          </p>
        )}
      </div>
    </button>
  );
}
