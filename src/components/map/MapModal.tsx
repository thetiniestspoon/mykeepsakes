import { useEffect, useRef } from 'react';
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

  // Helper function to clean up the map container
  const cleanupContainer = () => {
    if (mapRef.current) {
      const el = mapRef.current as HTMLElement & { _leaflet_id?: number };
      delete el._leaflet_id;
      mapRef.current.innerHTML = '';
    }
  };

  // Helper function to clean up map instance
  const cleanupMap = () => {
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (e) {
        console.warn('Error removing map:', e);
      }
      mapInstanceRef.current = null;
      markerRef.current = null;
    }
  };

  // Effect for map initialization/cleanup based on open state only
  useEffect(() => {
    let isMounted = true;

    if (!open) {
      // Synchronous cleanup when closing
      cleanupMap();
      cleanupContainer();
      return;
    }

    if (!mapRef.current) return;

    // Clean container before initializing (remove any stale Leaflet state)
    cleanupMap();
    cleanupContainer();

    // Wait for dialog to be fully rendered (animation complete)
    const timer = setTimeout(() => {
      if (!isMounted || !mapRef.current || mapInstanceRef.current) return;

      // Ensure container is clean right before init
      const el = mapRef.current as HTMLElement & { _leaflet_id?: number };
      delete el._leaflet_id;

      try {
        // Initialize new map
        const map = L.map(mapRef.current, {
          center: [lat, lng],
          zoom: zoom,
        });
        mapInstanceRef.current = map;

        // Add OpenStreetMap tiles
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        // Add marker
        const marker = L.marker([lat, lng]).addTo(map);
        marker.bindPopup(`<strong>${name}</strong>${address ? `<br/>${address}` : ''}`).openPopup();
        markerRef.current = marker;

        // Force map to recalculate size after render
        setTimeout(() => {
          if (isMounted && mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 100);
      } catch (e) {
        console.error('Failed to initialize map:', e);
        // Reset state for potential retry
        cleanupContainer();
      }
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      cleanupMap();
      cleanupContainer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Map initialization only on open state change
  }, [open]);

  // Separate effect to update view when location changes while open
  useEffect(() => {
    if (!open || !mapInstanceRef.current) return;

    // Update map view
    mapInstanceRef.current.setView([lat, lng], zoom);

    // Update marker position
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setPopupContent(`<strong>${name}</strong>${address ? `<br/>${address}` : ''}`);
    }
  }, [lat, lng, zoom, name, address, open]);

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
        
        {/* Map container with explicit calculated height */}
        <div 
          ref={mapRef} 
          className="w-full"
          style={{ 
            height: 'calc(100% - 120px)',
            minHeight: '300px' 
          }}
        />
        
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
