import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Delete internal method to fix icon paths with bundlers
delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

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
  zoom = 15
}: MapModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map when dialog content is ready
  useEffect(() => {
    // Only initialize when open AND we have a container AND no map yet
    if (!open || !mapRef.current || mapInstanceRef.current) {
      return;
    }

    console.log('[MapModal] Initializing map...');

    // Use requestAnimationFrame to ensure DOM is painted
    const initMap = () => {
      if (!mapRef.current) return;

      // Clean any stale Leaflet state
      const el = mapRef.current as HTMLElement & { _leaflet_id?: number };
      if (el._leaflet_id) {
        delete el._leaflet_id;
      }

      try {
        // Initialize map - matching OverviewMap pattern
        const map = L.map(mapRef.current).setView([lat, lng], zoom);
        mapInstanceRef.current = map;

        console.log('[MapModal] Map created, adding tile layer...');

        // Add tile layer - identical to OverviewMap
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        // Add marker
        const marker = L.marker([lat, lng]).addTo(map);
        marker.bindPopup(`<strong>${name}</strong>${address ? `<br/>${address}` : ''}`).openPopup();
        markerRef.current = marker;

        console.log('[MapModal] Map initialized at:', lat, lng);

        // Force size recalculation after a brief delay
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
            console.log('[MapModal] invalidateSize called');
            setMapReady(true);
          }
        }, 100);

      } catch (e) {
        console.error('[MapModal] Failed to initialize map:', e);
      }
    };

    // Wait for dialog animation to complete, then init
    const timer = setTimeout(initMap, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [open, lat, lng, zoom, name, address]);

  // Cleanup when closing
  useEffect(() => {
    if (!open && mapInstanceRef.current) {
      console.log('[MapModal] Cleaning up map...');
      try {
        mapInstanceRef.current.remove();
      } catch (e) {
        console.warn('[MapModal] Error removing map:', e);
      }
      mapInstanceRef.current = null;
      markerRef.current = null;
      setMapReady(false);
    }
  }, [open]);

  // Update view when location changes (while map exists)
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;

    mapInstanceRef.current.setView([lat, lng], zoom);
    markerRef.current.setLatLng([lat, lng]);
    markerRef.current.setPopupContent(`<strong>${name}</strong>${address ? `<br/>${address}` : ''}`);
  }, [lat, lng, zoom, name, address]);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const appleMapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(name)}&ll=${lat},${lng}`;
  const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[95vw] w-full h-[85vh] max-h-[85vh] p-0 gap-0 flex flex-col overflow-hidden z-[100]"
      >
        <DialogHeader className="p-4 pb-2 border-b bg-background shrink-0">
          <div className="flex items-center gap-2 min-w-0 pr-8">
            <MapPin className="w-5 h-5 text-accent shrink-0" />
            <DialogTitle className="truncate">{name}</DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Map showing the location of {name}
          </DialogDescription>
          {address && (
            <p className="text-sm text-muted-foreground truncate pl-7">{address}</p>
          )}
        </DialogHeader>
        
        {/* Map container - uses flex-1 to fill remaining space */}
        <div
          ref={mapRef}
          className="w-full flex-1 relative"
          style={{ minHeight: '300px' }}
        />
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 pointer-events-none" style={{ top: '60px', bottom: '60px' }}>
            <span className="text-muted-foreground">Loading map...</span>
          </div>
        )}
        
        {/* Footer with Get Directions dropdown */}
        <div className="p-3 border-t bg-background shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Navigation className="w-4 h-4 mr-2" />
                Get Directions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48 bg-background z-[150]">
              <DropdownMenuItem asChild>
                <a 
                  href={googleMapsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                >
                  Google Maps
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a 
                  href={appleMapsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                >
                  Apple Maps
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a 
                  href={wazeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                >
                  Waze
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </DialogContent>
    </Dialog>
  );
}
