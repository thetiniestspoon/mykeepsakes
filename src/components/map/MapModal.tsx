import { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MapPin, Navigation, Loader2, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useLeafletMap } from '@/hooks/use-leaflet-map';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { MarginNote } from '@/preview/collage/ui/MarginNote';
import '@/preview/collage/collage.css';

/**
 * MapModal — migrated to Collage direction (Phase 4 #6).
 * useLeafletMap hook (tile loading / marker / invalidateSize) unchanged; the modal still
 * opens/closes via shadcn Dialog and keeps the same `dialogReady` handshake to prevent
 * layout races. Only the chrome restyled: DialogContent is stripped of its default skin
 * and the inner `collage-root` div supplies the paper surface, ink border, and Stamp/
 * MarginNote hierarchy. The mapRef container carries `.collage-mapframe` so the shared
 * sepia/saturation wash + popup/bar overrides in OverviewMap.tsx apply here too.
 */

interface MapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lat: number;
  lng: number;
  name: string;
  address?: string;
  zoom?: number;
}

export function MapModal({
  open,
  onOpenChange,
  lat,
  lng,
  name,
  address,
  zoom = 15,
}: MapModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [dialogReady, setDialogReady] = useState(false);

  // Reset dialog ready state when closing
  useEffect(() => {
    if (!open) {
      setDialogReady(false);
    }
  }, [open]);

  const popupContent = `<strong style="font-family: 'IBM Plex Serif', Georgia, serif;">${name}</strong>${address ? `<br/>${address}` : ''}`;

  const { map, isReady, error, updateView, updateMarker } = useLeafletMap(mapRef, {
    center: [lat, lng],
    zoom,
    enabled: open && dialogReady,
    markerPopup: popupContent,
    debug: false,
  });

  // Handle animation end - additional invalidateSize for safety
  const handleAnimationEnd = () => {
    if (map) {
      map.invalidateSize();
    }
  };

  // Update view and marker when location changes (after map is ready)
  useEffect(() => {
    if (!isReady) return;
    updateView(lat, lng, zoom);
    updateMarker(lat, lng, popupContent);
  }, [lat, lng, zoom, popupContent, isReady, updateView, updateMarker]);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const appleMapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(name)}&ll=${lat},${lng}`;
  const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;

  const linkItem: React.CSSProperties = {
    display: 'block',
    padding: '8px 10px',
    fontFamily: 'var(--c-font-body)',
    fontSize: 14,
    color: 'var(--c-ink)',
    textDecoration: 'none',
    cursor: 'pointer',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] w-full h-[85vh] max-h-[85vh] p-0 gap-0 overflow-hidden z-[100] border-0 bg-transparent shadow-none"
        onOpenAutoFocus={() => setDialogReady(true)}
      >
        <div
          className="collage-root"
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            background: 'var(--c-paper)',
            border: '1.5px solid var(--c-ink)',
            boxShadow: 'var(--c-shadow)',
            overflow: 'hidden',
          }}
        >
          <DialogHeader asChild>
            <div
              style={{
                padding: '14px 18px 12px',
                borderBottom: '1px solid var(--c-line)',
                background: 'var(--c-creme)',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, paddingRight: 28 }}>
                <Stamp variant="ink" size="sm" rotate={-2}>
                  location
                </Stamp>
                <DialogTitle asChild>
                  <h2
                    style={{
                      fontFamily: 'var(--c-font-body)',
                      fontSize: 18,
                      fontWeight: 500,
                      color: 'var(--c-ink)',
                      margin: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {name}
                  </h2>
                </DialogTitle>
              </div>
              <DialogDescription className="sr-only">
                Map showing the location of {name}
              </DialogDescription>
              {address && (
                <div style={{ marginTop: 4, paddingLeft: 2 }}>
                  <MarginNote rotate={-1} size={16} color="ink">
                    {address}
                  </MarginNote>
                </div>
              )}
            </div>
          </DialogHeader>

          {/* Map container - flex-1 takes remaining space */}
          <div
            ref={mapRef}
            className={cn(
              'collage-mapframe relative flex-1 min-h-[300px]',
              !isReady && 'invisible'
            )}
            style={{ background: 'var(--c-creme)' }}
            onAnimationEnd={handleAnimationEnd}
          >
            {/* Loading state overlay */}
            {!isReady && !error && (
              <div
                className="visible"
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(247, 243, 233, 0.85)',
                  zIndex: 10,
                }}
              >
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--c-ink-muted)' }} />
              </div>
            )}

            {/* Error state overlay */}
            {error && (
              <div
                className="visible"
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'rgba(247, 243, 233, 0.9)',
                  zIndex: 10,
                }}
              >
                <AlertCircle className="w-8 h-8" style={{ color: 'var(--c-ink-muted)' }} />
                <p style={{ fontFamily: 'var(--c-font-body)', fontSize: 14, color: 'var(--c-ink-muted)', margin: 0 }}>
                  Failed to load map
                </p>
              </div>
            )}
          </div>

          {/* Footer with Get Directions dropdown */}
          <div
            style={{
              padding: '12px 18px',
              borderTop: '1px solid var(--c-line)',
              background: 'var(--c-creme)',
              flexShrink: 0,
            }}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--c-pen)',
                    color: 'var(--c-creme)',
                    border: 0,
                    borderRadius: 'var(--c-r-sm)',
                    fontFamily: 'var(--c-font-display)',
                    fontSize: 11,
                    letterSpacing: '.22em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: 'var(--c-shadow-sm)',
                  }}
                >
                  <Navigation size={16} />
                  Get Directions
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                className="collage-root"
                style={{
                  width: 192,
                  background: 'var(--c-paper)',
                  border: '1.5px solid var(--c-ink)',
                  borderRadius: 'var(--c-r-sm)',
                  padding: 4,
                  zIndex: 150,
                  boxShadow: 'var(--c-shadow)',
                }}
              >
                <DropdownMenuItem asChild>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={linkItem}
                  >
                    Google Maps
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a
                    href={appleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={linkItem}
                  >
                    Apple Maps
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a
                    href={wazeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={linkItem}
                  >
                    Waze
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
