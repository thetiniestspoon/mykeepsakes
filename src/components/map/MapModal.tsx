import { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MapPin, Navigation, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useLeafletMap } from '@/hooks/use-leaflet-map';

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
  const [dialogReady, setDialogReady] = useState(false);

  // Reset dialog ready state when closing
  useEffect(() => {
    if (!open) {
      setDialogReady(false);
    }
  }, [open]);

  const popupContent = `<strong>${name}</strong>${address ? `<br/>${address}` : ''}`;

  const { map, isReady, error, updateView, updateMarker } = useLeafletMap(mapRef, {
    center: [lat, lng],
    zoom,
    enabled: open && dialogReady,
    markerPopup: popupContent,
    debug: false, // Enable for troubleshooting
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[95vw] w-full h-[85vh] max-h-[85vh] p-0 gap-0 flex flex-col overflow-hidden z-[100]"
        onOpenAutoFocus={() => setDialogReady(true)}
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
        
        {/* Map container - flex-1 takes remaining space, mapRef directly on flex container */}
        <div 
          ref={mapRef}
          className={cn(
            "flex-1 min-h-[300px] relative",
            !isReady && "invisible"
          )}
          onAnimationEnd={handleAnimationEnd}
        >
          {/* Loading state overlay */}
          {!isReady && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10 visible">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
          
          {/* Error state overlay */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/50 z-10 visible">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Failed to load map</p>
            </div>
          )}
        </div>
        
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
