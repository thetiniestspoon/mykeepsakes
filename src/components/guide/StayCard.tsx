import { ExternalLink, MapPin } from 'lucide-react';
import type { LodgingOption } from '@/hooks/use-lodging';
import { useMapHighlightOptional } from '@/contexts/MapHighlightContext';

interface SelectedLocation {
  lat: number;
  lng: number;
  name: string;
  address?: string;
}

interface StayCardProps {
  lodging: LodgingOption;
  onOpenMap?: (location: SelectedLocation) => void;
}

export function StayCard({ lodging, onOpenMap }: StayCardProps) {
  const mapHighlight = useMapHighlightOptional();
  return (
    <div className="p-4 rounded-lg border border-border bg-card">
      <h4 className="font-semibold text-foreground">{lodging.name}</h4>
      {lodging.description && (
        <p className="text-sm text-muted-foreground mt-1">{lodging.description}</p>
      )}
      
      <div className="mt-3 space-y-2 text-sm">
        {lodging.address && (
          <p className="text-muted-foreground">{lodging.address}</p>
        )}
        
        {(lodging.bedrooms || lodging.bathrooms || lodging.max_guests) && (
          <p className="text-muted-foreground">
            {lodging.bedrooms && `${lodging.bedrooms} bed`}
            {lodging.bathrooms && ` · ${lodging.bathrooms} bath`}
            {lodging.max_guests && ` · Sleeps ${lodging.max_guests}`}
          </p>
        )}
        
        {lodging.amenities && lodging.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {lodging.amenities.slice(0, 5).map((amenity, i) => (
              <span key={i} className="text-xs bg-secondary px-2 py-0.5 rounded">
                {amenity}
              </span>
            ))}
            {lodging.amenities.length > 5 && (
              <span className="text-xs text-muted-foreground">
                +{lodging.amenities.length - 5} more
              </span>
            )}
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap items-center gap-2 mt-3">
        {lodging.url && (
          <a
            href={lodging.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            View Listing
          </a>
        )}
        {lodging.location_lat && lodging.location_lng && (mapHighlight || onOpenMap) && (
          <button
            onClick={() => {
              const location = {
                id: lodging.id,
                lat: lodging.location_lat!,
                lng: lodging.location_lng!,
                name: lodging.name,
                address: lodging.address || undefined,
                category: 'lodging',
              };
              if (mapHighlight) {
                mapHighlight.showOnMap(location);
              } else if (onOpenMap) {
                onOpenMap(location);
              }
            }}
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            <MapPin className="w-3 h-3" />
            Show on Map
          </button>
        )}
      </div>
    </div>
  );
}
