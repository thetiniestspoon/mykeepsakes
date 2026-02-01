import { MapPin, Phone, Globe, StickyNote, Navigation, Heart, Check, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Location } from '@/types/trip';
import type { MapLocation } from '@/types/map';
import { useDashboardSelection } from '@/contexts/DashboardSelectionContext';

interface LocationDetailProps {
  location: Location | MapLocation | null;
  isAccommodation?: boolean;
}

/**
 * Detailed view of a location for the center column
 */
export function LocationDetail({ location, isAccommodation }: LocationDetailProps) {
  const { panMap, highlightPin, navigateToPanel } = useDashboardSelection();

  if (!location) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Select a location to see details</p>
      </div>
    );
  }

  // Normalize between Location and MapLocation types
  const lat = 'lat' in location ? location.lat : null;
  const lng = 'lng' in location ? location.lng : null;

  const handleShowOnMap = () => {
    if (lat && lng) {
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-xl font-semibold text-foreground">{location.name}</h2>
          {location.category && (
            <Badge variant="secondary" className="capitalize">
              {isAccommodation ? 'Accommodation' : location.category}
            </Badge>
          )}
        </div>
        
        {'address' in location && location.address && (
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            {location.address}
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={handleShowOnMap} disabled={!lat || !lng}>
          <MapPin className="w-4 h-4 mr-1" />
          Show on Map
        </Button>
        <Button variant="outline" size="sm" onClick={handleGetDirections} disabled={!lat || !lng}>
          <Navigation className="w-4 h-4 mr-1" />
          Get Directions
        </Button>
      </div>

      {/* Contact Info */}
      {'phone' in location && location.phone && (
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <a href={`tel:${location.phone}`} className="text-sm hover:underline">
              {location.phone}
            </a>
          </CardContent>
        </Card>
      )}

      {/* Website */}
      {'url' in location && location.url && (
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <a 
              href={location.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline truncate"
            >
              {location.url}
            </a>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {'notes' in location && location.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <StickyNote className="w-4 h-4" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {location.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1">
          <Check className="w-4 h-4 mr-2" />
          Mark Visited
        </Button>
        <Button variant="outline" className="flex-1">
          <Heart className="w-4 h-4 mr-2" />
          Favorite
        </Button>
        <Button variant="outline" className="flex-1">
          <Camera className="w-4 h-4 mr-2" />
          Add Memory
        </Button>
      </div>
    </div>
  );
}
