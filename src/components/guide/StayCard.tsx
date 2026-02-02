import { ExternalLink, MapPin } from 'lucide-react';
import type { Accommodation } from '@/types/accommodation';

interface SelectedLocation {
  lat: number;
  lng: number;
  name: string;
  address?: string;
}

interface StayCardProps {
  accommodation: Accommodation;
  onOpenMap?: (location: SelectedLocation) => void;
}

export function StayCard({ accommodation, onOpenMap }: StayCardProps) {
  return (
    <div className="p-4 rounded-lg border border-border bg-card">
      <h4 className="font-semibold text-foreground">{accommodation.title}</h4>
      {accommodation.notes && (
        <p className="text-sm text-muted-foreground mt-1">{accommodation.notes}</p>
      )}
      
      <div className="mt-3 space-y-2 text-sm">
        {accommodation.address && (
          <p className="text-muted-foreground">{accommodation.address}</p>
        )}
      </div>
      
      <div className="flex flex-wrap items-center gap-2 mt-3">
        {accommodation.url && (
          <a
            href={accommodation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            View Listing
          </a>
        )}
        {accommodation.location_lat && accommodation.location_lng && onOpenMap && (
          <button
            onClick={() => onOpenMap({
              lat: accommodation.location_lat!,
              lng: accommodation.location_lng!,
              name: accommodation.title,
              address: accommodation.address || undefined
            })}
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            <MapPin className="w-3 h-3" />
            Map
          </button>
        )}
      </div>
    </div>
  );
}
