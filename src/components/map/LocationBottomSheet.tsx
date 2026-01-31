import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  Camera, 
  Navigation, 
  Phone, 
  Check, 
  ExternalLink,
  MapPin,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFavorites, useToggleFavorite } from '@/hooks/use-trip-data';
import { useToggleLocationVisit } from '@/hooks/use-locations';
import { MemoryCaptureDialog } from '@/components/album/MemoryCaptureDialog';
import type { Location } from '@/types/trip';

interface LocationBottomSheetProps {
  location: Location | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId?: string;
  days?: Array<{ id: string; date: string; title: string | null }>;
  allLocations?: Location[];
}

export function LocationBottomSheet({ 
  location, 
  open, 
  onOpenChange, 
  tripId,
  days = [],
  allLocations = []
}: LocationBottomSheetProps) {
  const [memoryCaptureOpen, setMemoryCaptureOpen] = useState(false);
  
  const { data: favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const toggleVisit = useToggleLocationVisit();
  
  if (!location) return null;
  
  const isFavorite = favorites?.[location.id] ?? false;
  const isVisited = !!location.visited_at;
  
  const handleToggleFavorite = () => {
    toggleFavorite.mutate({
      itemId: location.id,
      itemType: 'location',
      isFavorite: !isFavorite
    });
  };
  
  const handleToggleVisited = () => {
    toggleVisit.mutate({
      id: location.id,
      visited: !isVisited
    });
  };
  
  const handleNavigate = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
    window.open(url, '_blank');
  };
  
  const handleCall = () => {
    if (location.phone) {
      window.open(`tel:${location.phone}`, '_self');
    }
  };
  
  const handleWebsite = () => {
    if (location.url) {
      window.open(location.url, '_blank');
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="text-left pb-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                isVisited 
                  ? "bg-green-100 text-green-600" 
                  : "bg-beach-ocean-light text-beach-ocean-deep"
              )}>
                {isVisited ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <MapPin className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-lg">{location.name}</SheetTitle>
                {location.address && (
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {location.address}
                  </p>
                )}
                {location.category && (
                  <span className="inline-block mt-1 text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full capitalize">
                    {location.category}
                  </span>
                )}
              </div>
            </div>
          </SheetHeader>

          {/* Notes */}
          {location.notes && (
            <div className="mb-4 p-3 bg-secondary/50 rounded-lg">
              <p className="text-sm text-secondary-foreground">{location.notes}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={isVisited ? "default" : "outline"}
              onClick={handleToggleVisited}
              disabled={toggleVisit.isPending}
              className="h-auto py-3 flex-col gap-1"
            >
              {toggleVisit.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Check className={cn("w-5 h-5", isVisited && "text-primary-foreground")} />
              )}
              <span className="text-xs">
                {isVisited ? 'Visited' : 'Mark Visited'}
              </span>
            </Button>
            
            <Button
              variant={isFavorite ? "default" : "outline"}
              onClick={handleToggleFavorite}
              disabled={toggleFavorite.isPending}
              className="h-auto py-3 flex-col gap-1"
            >
              <Star className={cn("w-5 h-5", isFavorite && "fill-current")} />
              <span className="text-xs">
                {isFavorite ? 'Favorited' : 'Favorite'}
              </span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setMemoryCaptureOpen(true)}
              className="h-auto py-3 flex-col gap-1"
            >
              <Camera className="w-5 h-5" />
              <span className="text-xs">Add Memory</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={handleNavigate}
              className="h-auto py-3 flex-col gap-1"
            >
              <Navigation className="w-5 h-5" />
              <span className="text-xs">Navigate</span>
            </Button>
            
            {location.phone && (
              <Button
                variant="outline"
                onClick={handleCall}
                className="h-auto py-3 flex-col gap-1"
              >
                <Phone className="w-5 h-5" />
                <span className="text-xs">Call</span>
              </Button>
            )}
            
            {location.url && (
              <Button
                variant="outline"
                onClick={handleWebsite}
                className="h-auto py-3 flex-col gap-1"
              >
                <ExternalLink className="w-5 h-5" />
                <span className="text-xs">Website</span>
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Memory Capture Dialog */}
      <MemoryCaptureDialog
        open={memoryCaptureOpen}
        onOpenChange={setMemoryCaptureOpen}
        tripId={tripId}
        days={days}
        locations={allLocations}
        preselectedLocationId={location.id}
      />
    </>
  );
}
