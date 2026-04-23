import { useMemo } from 'react';
import {
  Utensils,
  Waves,
  Home,
  Car,
  PartyPopper,
  Activity,
  MapPin,
  CheckCircle2,
  GripVertical,
  Star,
} from 'lucide-react';
import { useDashboardSelectionOptional } from '@/contexts/DashboardSelectionContext';
import type { LegacyActivity } from '@/hooks/use-database-itinerary';
import '@/preview/collage/collage.css';

/**
 * Compact activity card — migrated to Collage 2026-04-23 (Phase 4 #1).
 * DayV2 Session Blocks vocabulary — ink title in Plex Serif, pen-blue Track pill,
 * paper-chip card with hairline dashed divider on hover. Time stamp uses
 * Rubik Mono One (monospaced). Drag handle + location action preserved as
 * distinct hit zones. prefers-reduced-motion honored.
 */

const categoryIcons: Record<string, React.ComponentType<{ style?: React.CSSProperties }>> = {
  activity: Activity,
  dining: Utensils,
  beach: Waves,
  accommodation: Home,
  transport: Car,
  event: PartyPopper,
};

/** Per-category tiny gradient swatch (paper-chip accent, not a full fill). */
const categorySwatch: Record<string, string> = {
  activity: 'linear-gradient(155deg, #4a6b3e 0%, #8ba66e 60%, #d6c084 100%)', // sage
  dining: 'linear-gradient(180deg, #f8c291 0%, #f3c9b9 60%, #fde0cf 100%)',   // dawn
  beach: 'linear-gradient(140deg, #5b7fa8 0%, #8aaecc 55%, #d6e3ee 100%)',     // sky
  accommodation: 'linear-gradient(135deg, #2A2724 0%, #4a4338 55%, #7a7160 100%)', // ink
  transport: 'linear-gradient(140deg, #5b7fa8 0%, #8aaecc 60%, #d6e3ee 100%)', // sky
  event: 'linear-gradient(200deg, #b0785a 0%, #d7a379 50%, #f0d3ae 100%)',     // clay
};

interface CompactActivityCardProps {
  activity: LegacyActivity;
  isNextActivity?: boolean;
  dayId: string;
  previewTime?: string;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function CompactActivityCard({
  activity,
  isNextActivity,
  dayId,
  previewTime,
  isDragging,
  dragHandleProps,
}: CompactActivityCardProps) {
  const dashboard = useDashboardSelectionOptional();

  const Icon = categoryIcons[activity.category] || Activity;
  const isCompleted = activity.status === 'done';
  const isSelected = dashboard?.selectedItem?.id === activity.id;

  // Convert LegacyActivity to ItineraryItem-like shape for the context
  const activityData = useMemo(
    () => ({
      id: activity.id,
      title: activity.title,
      description: activity.description,
      start_time: activity.rawStartTime || null,
      end_time: activity.rawEndTime || null,
      category: activity.category,
      status: activity.status,
      location_id: activity.location?.id || null,
      location: activity.location
        ? {
            id: activity.location.id,
            name: activity.location.name,
            lat: activity.location.lat,
            lng: activity.location.lng,
            category: activity.location.category || activity.category,
            trip_id: '',
            address: activity.location.address || null,
            phone: null,
            url: null,
            notes: null,
            visited_at: null,
            created_at: '',
            updated_at: '',
          }
        : null,
      link: activity.link,
      link_label: activity.linkLabel,
      phone: activity.phone,
      notes: activity.notes,
      day_id: dayId,
      trip_id: '',
      item_type: activity.itemType,
      source: 'manual' as const,
      external_ref: null,
      sort_index: 0,
      completed_at: null,
      created_at: '',
      updated_at: '',
    }),
    [activity, dayId],
  );

  const handleClick = () => {
    if (!dashboard) return;
    dashboard.selectItem('activity', activity.id, activityData);
    if (activity.location?.lat && activity.location?.lng) {
      dashboard.panMap(activity.location.lat, activity.location.lng);
    }
  };

  const handleShowOnMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dashboard || !activity.location) return;
    dashboard.navigateToPanel(2);
    dashboard.focusLocation({
      id: activity.location.id,
      category: activity.category,
      dayId: dayId,
    });
    dashboard.panMap(activity.location.lat, activity.location.lng);
    dashboard.highlightPin(activity.location.id);
  };

  const displayTime = previewTime || activity.time;
  const swatch = categorySwatch[activity.category] ?? categorySwatch.activity;

  // Outer frame: paper card with selection/next/chosen ink decorations.
  const outerBorder = isSelected
    ? '1.5px solid var(--c-ink)'
    : isNextActivity
      ? '1.5px solid var(--c-pen)'
      : activity.isChosen && !isCompleted
        ? '1.5px solid var(--c-tape)'
        : '1px solid var(--c-line)';

  return (
    <div
      data-activity-id={activity.id}
      className="collage-root"
      style={{
        display: 'flex',
        alignItems: 'stretch',
        width: '100%',
        background: isSelected ? 'var(--c-creme)' : 'var(--c-paper)',
        border: outerBorder,
        borderRadius: 'var(--c-r-sm)',
        boxShadow: isSelected || isNextActivity ? 'var(--c-shadow-sm)' : 'none',
        opacity: isCompleted ? 0.6 : 1,
        overflow: 'hidden',
        transition: 'box-shadow var(--c-t-fast) var(--c-ease-out), border-color var(--c-t-fast)',
      }}
    >
      {/* Drag handle — leftmost grip column */}
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          aria-label="Drag to reorder"
          style={{
            flexShrink: 0,
            width: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'stretch',
            color: isDragging ? 'var(--c-pen)' : 'var(--c-ink-muted)',
            cursor: isDragging ? 'grabbing' : 'grab',
            background: 'transparent',
            borderRight: '1px dashed var(--c-line)',
            touchAction: 'none',
            transition: 'color var(--c-t-fast), background var(--c-t-fast)',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'var(--c-creme)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <GripVertical style={{ width: 14, height: 14 }} aria-hidden />
        </div>
      )}

      {/* Main clickable area */}
      <button
        type="button"
        onClick={handleClick}
        style={{
          appearance: 'none',
          cursor: 'pointer',
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 10px',
          background: 'transparent',
          border: 'none',
          textAlign: 'left',
          color: 'var(--c-ink)',
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
          e.currentTarget.style.background = 'rgba(29, 29, 27, 0.04)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        {/* Category swatch + icon (paper-chip) */}
        <div
          aria-hidden
          style={{
            flexShrink: 0,
            width: 26,
            height: 26,
            borderRadius: 'var(--c-r-sm)',
            display: 'grid',
            placeItems: 'center',
            background: isCompleted ? 'var(--c-success)' : swatch,
            border: '1px solid var(--c-ink)',
            boxShadow: 'var(--c-shadow-sm)',
            color: 'var(--c-creme)',
          }}
        >
          {isCompleted ? (
            <CheckCircle2 style={{ width: 14, height: 14 }} />
          ) : (
            <Icon style={{ width: 13, height: 13, color: 'var(--c-creme)' }} />
          )}
        </div>

        {/* Title & meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
            {displayTime && (
              <span
                style={{
                  flexShrink: 0,
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 9,
                  letterSpacing: '.16em',
                  color: previewTime ? 'var(--c-pen)' : 'var(--c-ink)',
                  whiteSpace: 'nowrap',
                }}
              >
                {displayTime}
              </span>
            )}
            {activity.track && (
              <span
                style={{
                  flexShrink: 0,
                  display: 'inline-block',
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 8,
                  letterSpacing: '.2em',
                  textTransform: 'uppercase',
                  color: 'var(--c-creme)',
                  background: 'var(--c-pen)',
                  padding: '3px 6px',
                  borderRadius: 'var(--c-r-sm)',
                  lineHeight: 1,
                }}
              >
                Track {activity.track}
              </span>
            )}
            {activity.isChosen && !isCompleted && (
              <Star
                style={{
                  width: 12,
                  height: 12,
                  flexShrink: 0,
                  fill: 'var(--c-tape)',
                  color: 'var(--c-ink)',
                }}
                aria-label="Registered session"
              />
            )}
            <span
              style={{
                fontFamily: 'var(--c-font-body)',
                fontSize: 14,
                color: 'var(--c-ink)',
                lineHeight: 1.3,
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
                textDecoration: isCompleted ? 'line-through' : 'none',
              }}
            >
              {activity.title}
            </span>
          </div>
          {activity.speaker && (
            <div
              style={{
                fontFamily: 'var(--c-font-body)',
                fontStyle: 'italic',
                fontSize: 11,
                color: 'var(--c-ink-muted)',
                marginTop: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {activity.speaker}
            </div>
          )}
        </div>
      </button>

      {/* Show-on-map action (separate hit zone) */}
      {activity.location && (
        <button
          type="button"
          onClick={handleShowOnMap}
          aria-label="Show on map"
          style={{
            appearance: 'none',
            cursor: 'pointer',
            flexShrink: 0,
            width: 32,
            display: 'grid',
            placeItems: 'center',
            alignSelf: 'stretch',
            color: 'var(--c-pen)',
            background: 'transparent',
            border: 'none',
            borderLeft: '1px dashed var(--c-line)',
            transition: 'background var(--c-t-fast)',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = 'inset 0 0 0 2px var(--c-pen)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(31, 60, 198, 0.08)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <MapPin style={{ width: 14, height: 14 }} aria-hidden />
        </button>
      )}

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .collage-root { transition: none !important; }
          .collage-root button { transition: none !important; }
        }
      `}</style>
    </div>
  );
}
