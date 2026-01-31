import { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { X, MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
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

  useEffect(() => {
    if (!open || !mapRef.current) return;

    // Small delay to ensure dialog is fully rendered
    const timer = setTimeout(() => {
      if (!mapRef.current) return;

      // Clean up existing map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize new map
      const map = L.map(mapRef.current).setView([lat, lng], zoom);
      mapInstanceRef.current = map;

      // Add OpenStreetMap tiles
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      // Add marker
      const marker = L.marker([lat, lng]).addTo(map);
      marker.bindPopup(`<strong>${name}</strong>${address ? `<br/>${address}` : ''}`).openPopup();

      // Force map to recalculate size
      map.invalidateSize();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [open, lat, lng, name, address, zoom]);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const appleMapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(name)}&ll=${lat},${lng}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-[90vh] p-0 gap-0">
        <DialogHeader className="p-4 pb-2 border-b bg-background">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-5 h-5 text-accent shrink-0" />
              <DialogTitle className="truncate">{name}</DialogTitle>
            </div>
            <DialogClose className="rounded-full p-2 hover:bg-secondary transition-colors">
              <X className="w-5 h-5" />
            </DialogClose>
          </div>
          {address && (
            <p className="text-sm text-muted-foreground truncate pl-7">{address}</p>
          )}
        </DialogHeader>
        
        {/* Map container */}
        <div 
          ref={mapRef} 
          className="flex-1 w-full min-h-0"
          style={{ height: 'calc(100% - 120px)' }}
        />
        
        {/* Footer with external links */}
        <div className="p-3 border-t bg-background flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            asChild
            className="flex-1"
          >
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Google Maps
            </a>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            asChild
            className="flex-1"
          >
            <a href={appleMapsUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Apple Maps
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
