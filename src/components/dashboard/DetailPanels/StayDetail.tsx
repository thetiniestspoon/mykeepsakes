import { useState } from 'react';
import { Home, ExternalLink, MapPin, Bed, Bath, Users } from 'lucide-react';
import { useSelectedLodging } from '@/hooks/use-lodging';
import { useDashboardSelection } from '@/contexts/DashboardSelectionContext';
import { Button } from '@/components/ui/button';
import { MapModal } from '@/components/map/MapModal';

interface SelectedLocation {
  lat: number;
  lng: number;
  name: string;
  address?: string;
}

/**
 * Stay detail view for the center column
 * Shows accommodation information with map integration
 */
export function StayDetail() {
  const { data: selectedLodging, isLoading } = useSelectedLodging();
  const { panMap, focusLocation, navigateToPanel } = useDashboardSelection();
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);

  const handleShowOnMap = () => {
    if (selectedLodging?.location_lat && selectedLodging?.location_lng) {
      // Focus on the lodging location
      focusLocation({
        id: selectedLodging.id,
        category: 'lodging',
      });

      // Pan map to lodging coordinates
      panMap(selectedLodging.location_lat, selectedLodging.location_lng);

      // Navigate to map panel
      navigateToPanel(2);
    }
  };

  const openMapModal = (location: SelectedLocation) => {
    setSelectedLocation(location);
    setMapModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6 pb-20">
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-beach-ocean/20 flex items-center justify-center mx-auto mb-3">
            <Home className="w-8 h-8 text-beach-ocean" />
          </div>
          <h2 className="font-display text-2xl text-foreground">Stay</h2>
          <p className="text-muted-foreground">Your accommodation details</p>
        </div>

        {selectedLodging ? (
          <div className="p-4 rounded-lg border border-border bg-card shadow-warm">
            <h3 className="font-semibold text-lg text-foreground">{selectedLodging.name}</h3>

            {selectedLodging.description && (
              <p className="text-sm text-muted-foreground mt-2">{selectedLodging.description}</p>
            )}

            <div className="mt-4 space-y-3">
              {selectedLodging.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground">{selectedLodging.address}</span>
                </div>
              )}

              {(selectedLodging.bedrooms || selectedLodging.bathrooms || selectedLodging.max_guests) && (
                <div className="flex items-center gap-4 text-sm">
                  {selectedLodging.bedrooms && (
                    <div className="flex items-center gap-1">
                      <Bed className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedLodging.bedrooms} bed{selectedLodging.bedrooms > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {selectedLodging.bathrooms && (
                    <div className="flex items-center gap-1">
                      <Bath className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedLodging.bathrooms} bath{selectedLodging.bathrooms > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {selectedLodging.max_guests && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>Sleeps {selectedLodging.max_guests}</span>
                    </div>
                  )}
                </div>
              )}

              {selectedLodging.amenities && selectedLodging.amenities.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedLodging.amenities.map((amenity, i) => (
                      <span key={i} className="text-xs bg-secondary px-2 py-1 rounded">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
              {selectedLodging.url && (
                <a
                  href={selectedLodging.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Listing
                </a>
              )}
              {selectedLodging.location_lat && selectedLodging.location_lng && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShowOnMap}
                    className="gap-1.5"
                  >
                    <MapPin className="w-4 h-4" />
                    Show on Map
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openMapModal({
                      lat: selectedLodging.location_lat!,
                      lng: selectedLodging.location_lng!,
                      name: selectedLodging.name,
                      address: selectedLodging.address || undefined
                    })}
                    className="gap-1.5"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Get Directions
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-lg border border-dashed border-border bg-card/50 text-center">
            <Home className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No accommodation selected</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add your accommodation in the Lodging tab to see it here.
            </p>
          </div>
        )}
      </div>

      {/* Map Modal */}
      {selectedLocation && (
        <MapModal
          key={`${selectedLocation.lat}-${selectedLocation.lng}`}
          open={mapModalOpen}
          onOpenChange={setMapModalOpen}
          lat={selectedLocation.lat}
          lng={selectedLocation.lng}
          name={selectedLocation.name}
          address={selectedLocation.address}
        />
      )}
    </div>
  );
}
