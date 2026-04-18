import { useState } from 'react';
import { Settings, Share2 } from 'lucide-react';
import { ShareDialog } from '@/components/sharing/ShareDialog';
import { ContactsFAB } from './ContactsFAB';
import { useActiveTrip, getTripMode } from '@/hooks/use-trip';
import type { TripMode } from '@/types/trip';
import '@/preview/collage/collage.css';

/**
 * Compact header — migrated to Collage direction 2026-04-17.
 * Sits atop the Dashboard shell. Logic unchanged (share dialog, settings trigger,
 * contacts FAB); presentation swapped to Collage tokens.
 */

const MODE_CONFIG: Record<TripMode, { label: string; bg: string; color: string; border: string }> = {
  pre:    { label: 'upcoming',  bg: '#1F3CC6', color: '#F7F3E9', border: '#1F3CC6' }, // pen
  active: { label: 'active',    bg: '#3C7A4E', color: '#F7F3E9', border: '#3C7A4E' },
  post:   { label: 'archived',  bg: '#1D1D1B1A', color: '#1D1D1B', border: '#1D1D1B' },
};

interface CompactHeaderProps {
  onOpenSettings: () => void;
}

export function CompactHeader({ onOpenSettings }: CompactHeaderProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const { data: trip } = useActiveTrip();

  const mode = trip ? getTripMode(trip) : 'pre';
  const modeInfo = MODE_CONFIG[mode];

  return (
    <>
      <div
        className="collage-root"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 48,
          padding: '0 16px',
          background: 'transparent',
          minHeight: 0, // let outer shell control height
          position: 'relative',
        }}
      >
        {/* Tape accent — decorative, subtle */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: -8,
            left: '28%',
            width: 64,
            height: 14,
            background: 'rgba(246, 213, 92, 0.62)',
            transform: 'rotate(-3deg)',
            boxShadow: '0 1px 2px rgba(0,0,0,.12)',
            pointerEvents: 'none',
          }}
        />

        {/* Left: brand + trip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <span
            aria-hidden
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              background: 'var(--c-ink)',
              color: 'var(--c-creme)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 13,
              fontWeight: 700,
              flexShrink: 0,
              boxShadow: 'var(--c-shadow-sm)',
              letterSpacing: '.08em',
            }}
          >
            MK
          </span>

          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <h1
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontSize: 15,
                  fontWeight: 500,
                  color: 'var(--c-ink)',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2,
                }}
              >
                {trip?.title ?? 'Trip Planner'}
              </h1>
              {trip && (
                <span
                  style={{
                    display: 'inline-block',
                    fontFamily: 'var(--c-font-display)',
                    fontSize: 9,
                    letterSpacing: '.22em',
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: 'var(--c-r-sm)',
                    background: modeInfo.bg,
                    color: modeInfo.color,
                    border: `1px solid ${modeInfo.border}`,
                    flexShrink: 0,
                    lineHeight: 1,
                  }}
                >
                  {modeInfo.label}
                </span>
              )}
            </div>
            {trip?.location_name && (
              <p
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontStyle: 'italic',
                  fontSize: 11,
                  color: 'var(--c-ink-muted)',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2,
                }}
              >
                {trip.location_name}
              </p>
            )}
          </div>
        </div>

        {/* Right: actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ContactsFAB />
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            aria-label="Share trip"
            style={iconButtonStyle}
            onMouseOver={(e) => (e.currentTarget.style.background = 'var(--c-line)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Share2 size={16} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Settings"
            style={iconButtonStyle}
            onMouseOver={(e) => (e.currentTarget.style.background = 'var(--c-line)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Settings size={16} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} />
    </>
  );
}

const iconButtonStyle: React.CSSProperties = {
  appearance: 'none',
  cursor: 'pointer',
  width: 32,
  height: 32,
  display: 'grid',
  placeItems: 'center',
  background: 'transparent',
  color: 'var(--c-ink)',
  border: '1px solid transparent',
  borderRadius: 'var(--c-r-sm)',
  transition: 'background var(--c-t-fast) var(--c-ease-out), border-color var(--c-t-fast)',
};
