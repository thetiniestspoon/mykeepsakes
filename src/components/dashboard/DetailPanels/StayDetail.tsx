import { useState } from 'react';
import { Home, MapPin, ExternalLink, Bed, Bath, Users, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSelectedLodging } from '@/hooks/use-lodging';
import { useDashboardSelection } from '@/contexts/DashboardSelectionContext';
import { MapModal } from '@/components/map/MapModal';

/**
 * Full-page detail view for accommodation when Stay tab is selected
 */
export function StayDetail() {
  const { data: lodging, isLoading } = useSelectedLodging();
  const { panMap, navigateToPanel, focusLocation } = useDashboardSelection();
  const [mapModalOpen, setMapModalOpen] = useState(false);

  const handleShowOnMap = () => {
    if (lodging?.location_lat && lodging?.location_lng) {
      panMap(lodging.location_lat, lodging.location_lng);
      focusLocation({ id: lodging.id, category: 'lodging' });
      navigateToPanel(2);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!lodging) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Home className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-foreground mb-2">No Accommodation Selected</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Add and select your accommodation in the Lodging tab to see it here.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Home className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Accommodation</h2>
            <p className="text-sm text-muted-foreground">Your stay details</p>
          </div>
        </div>

        {/* Lodging Name & Description */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{lodging.name}</h3>
          {lodging.description && (
            <p className="text-sm text-muted-foreground">{lodging.description}</p>
          )}
        </div>

        {/* Address */}
        {lodging.address && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
            <span className="text-muted-foreground">{lodging.address}</span>
          </div>
        )}

        {/* Room Details */}
        {(lodging.bedrooms || lodging.bathrooms || lodging.max_guests) && (
          <div className="flex flex-wrap gap-3">
            {lodging.bedrooms && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Bed className="w-4 h-4" />
                <span>{lodging.bedrooms} {lodging.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</span>
              </div>
            )}
            {lodging.bathrooms && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Bath className="w-4 h-4" />
                <span>{lodging.bathrooms} {lodging.bathrooms === 1 ? 'Bath' : 'Baths'}</span>
              </div>
            )}
            {lodging.max_guests && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>Sleeps {lodging.max_guests}</span>
              </div>
            )}
          </div>
        )}

        {/* Amenities */}
        {lodging.amenities && lodging.amenities.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Amenities</h4>
            <div className="flex flex-wrap gap-2">
              {lodging.amenities.map((amenity, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  <Check className="w-3 h-3 mr-1" />
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {lodging.notes && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Notes</h4>
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              {lodging.notes}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          {lodging.location_lat && lodging.location_lng && (
            <>
              <Button onClick={handleShowOnMap} variant="outline" className="w-full">
                <MapPin className="w-4 h-4 mr-2" />
                Show on Map
              </Button>
              <Button onClick={() => setMapModalOpen(true)} variant="outline" className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                Get Directions
              </Button>
            </>
          )}
          {lodging.url && (
            <Button asChild variant="outline" className="w-full">
              <a href={lodging.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Listing
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Map Modal for Directions */}
      {lodging.location_lat && lodging.location_lng && (
        <MapModal
          open={mapModalOpen}
          onOpenChange={setMapModalOpen}
          lat={lodging.location_lat}
          lng={lodging.location_lng}
          name={lodging.name}
          address={lodging.address || undefined}
        />
      )}
    </ScrollArea>
  );
}
