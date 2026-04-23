import { MapPin, Phone, Globe, StickyNote, Navigation, Heart, Check, Camera } from 'lucide-react';
import type { Location } from '@/types/trip';
import type { MapLocation } from '@/types/map';
import { useDashboardSelection } from '@/contexts/DashboardSelectionContext';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { StickerPill } from '@/preview/collage/ui/StickerPill';
import { Tape } from '@/preview/collage/ui/Tape';
import { MarginNote } from '@/preview/collage/ui/MarginNote';
import '@/preview/collage/collage.css';

interface LocationDetailProps {
  location: Location | MapLocation | null;
  isAccommodation?: boolean;
}

/**
 * Detailed view of a location for the center column.
 * Migrated to Collage direction — paper-flat surfaces, sharp corners, ink/pen
 * typography. Logic (map pan, directions, category normalization) unchanged.
 */
export function LocationDetail({ location, isAccommodation }: LocationDetailProps) {
  const { panMap, highlightPin, navigateToPanel, focusLocation } = useDashboardSelection();

  if (!location) {
    return (
      <div
        className="collage-root flex items-center justify-center h-full"
        style={{
          color: 'var(--c-ink-muted)',
          fontFamily: 'var(--c-font-body)',
          fontStyle: 'italic',
          fontSize: 14,
        }}
      >
        <p>Select a location to see details</p>
      </div>
    );
  }

  // Normalize between Location and MapLocation types
  const lat = 'lat' in location ? location.lat : null;
  const lng = 'lng' in location ? location.lng : null;

  const handleShowOnMap = () => {
    if (lat && lng) {
      // Set map filters to show this location's category and day
      focusLocation({
        id: location.id,
        category: location.category || undefined,
        dayId: 'dayId' in location ? location.dayId : undefined,
      });
      panMap(lat, lng);
      highlightPin(location.id);
      // Navigate to Map panel (index 2)
      navigateToPanel(2);
    }
  };

  const handleGetDirections = () => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    }
  };

  const hasCoords = Boolean(lat && lng);
  const categoryLabel = isAccommodation ? 'Accommodation' : location.category;

  return (
    <div className="collage-root" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header — main paper card with tape accent and section stamp */}
      <section style={surfaceStyle}>
        <Tape position="top-right" rotate={6} width={72} opacity={0.68} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <Stamp variant="outline" size="sm" style={{ marginBottom: 10 }}>
              {isAccommodation ? 'Stay' : 'Place'}
            </Stamp>
            <h2
              style={{
                fontFamily: 'var(--c-font-body)',
                fontSize: 20,
                fontWeight: 600,
                color: 'var(--c-ink)',
                margin: 0,
                lineHeight: 1.25,
                letterSpacing: '-0.01em',
              }}
            >
              {location.name}
            </h2>

            {'address' in location && location.address && (
              <p
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontSize: 13,
                  color: 'var(--c-ink-muted)',
                  margin: '6px 0 0',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 6,
                  lineHeight: 1.4,
                }}
              >
                <MapPin className="w-4 h-4 flex-shrink-0" style={{ marginTop: 2 }} />
                <span>{location.address}</span>
              </p>
            )}
          </div>

          {categoryLabel && (
            <StickerPill variant="ink" rotate={2} style={{ flexShrink: 0 }}>
              {categoryLabel}
            </StickerPill>
          )}
        </div>

        {/* Caveat address aside — decorative accent, aria-hidden */}
        {'address' in location && location.address && (
          <MarginNote
            rotate={-3}
            size={18}
            style={{ position: 'absolute', right: 14, bottom: -8, background: 'var(--c-paper)', padding: '0 6px' }}
          >
            here
          </MarginNote>
        )}

        {/* Quick Actions — paper-flat ghost buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
          <button
            type="button"
            onClick={handleShowOnMap}
            disabled={!hasCoords}
            style={hasCoords ? ghostButtonStyle : ghostButtonDisabledStyle}
            aria-label="Show on map"
          >
            <MapPin className="w-4 h-4" />
            <span>Show on Map</span>
          </button>
          <button
            type="button"
            onClick={handleGetDirections}
            disabled={!hasCoords}
            style={hasCoords ? ghostButtonStyle : ghostButtonDisabledStyle}
            aria-label="Get directions"
          >
            <Navigation className="w-4 h-4" />
            <span>Get Directions</span>
          </button>
        </div>
      </section>

      {/* Contact Info */}
      {'phone' in location && location.phone && (
        <section style={smallSurfaceStyle}>
          <Phone className="w-4 h-4" style={{ color: 'var(--c-ink-muted)', flexShrink: 0 }} />
          <a
            href={`tel:${location.phone}`}
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 14,
              color: 'var(--c-ink)',
              textDecoration: 'none',
            }}
            onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
          >
            {location.phone}
          </a>
        </section>
      )}

      {/* Website */}
      {'url' in location && location.url && (
        <section style={smallSurfaceStyle}>
          <Globe className="w-4 h-4" style={{ color: 'var(--c-ink-muted)', flexShrink: 0 }} />
          <a
            href={location.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 14,
              color: 'var(--c-pen)',
              textDecoration: 'none',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
            onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
          >
            {location.url}
          </a>
        </section>
      )}

      {/* Notes */}
      {'notes' in location && location.notes && (
        <section style={surfaceStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <StickyNote className="w-4 h-4" style={{ color: 'var(--c-ink)' }} />
            <Stamp variant="plain" size="sm">
              Notes
            </Stamp>
          </div>
          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 14,
              color: 'var(--c-ink-muted)',
              margin: 0,
              whiteSpace: 'pre-wrap',
              lineHeight: 1.55,
            }}
          >
            {location.notes}
          </p>
        </section>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" style={{ ...ghostButtonStyle, flex: 1, justifyContent: 'center' }}>
          <Check className="w-4 h-4" />
          <span>Mark Visited</span>
        </button>
        <button type="button" style={{ ...ghostButtonStyle, flex: 1, justifyContent: 'center' }}>
          <Heart className="w-4 h-4" />
          <span>Favorite</span>
        </button>
        <button type="button" style={{ ...ghostButtonStyle, flex: 1, justifyContent: 'center' }}>
          <Camera className="w-4 h-4" />
          <span>Add Memory</span>
        </button>
      </div>
    </div>
  );
}

// === Collage paper-flat surface styles ===

const surfaceStyle: React.CSSProperties = {
  position: 'relative',
  background: 'var(--c-paper)',
  border: '1px solid var(--c-line)',
  borderRadius: 'var(--c-r-sm)',
  boxShadow: 'var(--c-shadow)',
  padding: 16,
};

const smallSurfaceStyle: React.CSSProperties = {
  position: 'relative',
  background: 'var(--c-paper)',
  border: '1px solid var(--c-line)',
  borderRadius: 'var(--c-r-sm)',
  boxShadow: 'var(--c-shadow)',
  padding: '12px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const ghostButtonStyle: React.CSSProperties = {
  appearance: 'none',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: 'var(--c-font-body)',
  fontSize: 13,
  color: 'var(--c-ink)',
  background: 'var(--c-paper)',
  border: '1px solid var(--c-line)',
  borderRadius: 'var(--c-r-sm)',
  padding: '8px 12px',
  boxShadow: 'var(--c-shadow-sm)',
  transition: 'background var(--c-t-fast) var(--c-ease-out), border-color var(--c-t-fast)',
};

const ghostButtonDisabledStyle: React.CSSProperties = {
  ...ghostButtonStyle,
  cursor: 'not-allowed',
  opacity: 0.5,
  boxShadow: 'none',
};
