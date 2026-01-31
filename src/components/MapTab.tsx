import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Map, Filter, Waves, Utensils, Activity, Home, Car, PartyPopper, MapPin, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAllLocations, PTOWN_CENTER } from '@/lib/itinerary-data';
import { MapModal } from '@/components/map/MapModal';

type CategoryFilter = 'all' | 'beach' | 'dining' | 'activity' | 'accommodation' | 'transport' | 'event' | 'restaurant';

const categoryConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  beach: { label: 'Beaches', icon: Waves, color: 'bg-beach-seafoam text-beach-ocean-deep' },
  dining: { label: 'Dining', icon: Utensils, color: 'bg-beach-sunset-coral/20 text-beach-sunset-coral' },
  restaurant: { label: 'Restaurants', icon: Utensils, color: 'bg-beach-sunset-coral/20 text-beach-sunset-coral' },
  activity: { label: 'Activities', icon: Activity, color: 'bg-beach-ocean-light text-beach-ocean-deep' },
  accommodation: { label: 'Stay', icon: Home, color: 'bg-secondary text-secondary-foreground' },
  transport: { label: 'Transport', icon: Car, color: 'bg-muted text-muted-foreground' },
  event: { label: 'Events', icon: PartyPopper, color: 'bg-beach-sunset-gold/20 text-beach-sunset-gold' },
};

interface SelectedLocation {
  lat: number;
  lng: number;
  name: string;
}

export function MapTab() {
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all');
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  
  const locations = getAllLocations();
  
  // Filter locations by category
  const filteredLocations = activeFilter === 'all' 
    ? locations 
    : locations.filter(loc => 
        loc.itemType === activeFilter || 
        (activeFilter === 'dining' && loc.itemType === 'restaurant') ||
        (activeFilter === 'restaurant' && loc.itemType === 'dining')
      );
  
  // Create a Google Maps URL that shows all locations
  const allLocationsMapUrl = `https://www.google.com/maps/search/?api=1&query=Provincetown,+MA`;
  
  return (
    <div className="space-y-4 pb-20">
      <div className="text-center py-4">
        <h2 className="font-display text-2xl text-foreground">Trip Map</h2>
        <p className="text-muted-foreground">All locations at a glance</p>
      </div>
      
      {/* Open in Google Maps button */}
      <div className="px-4">
        <a 
          href={allLocationsMapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Card className="shadow-warm bg-ocean-gradient text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer">
            <CardContent className="py-6 text-center">
              <Map className="w-12 h-12 mx-auto mb-3" />
              <h3 className="font-semibold text-lg">Open Provincetown in Google Maps</h3>
              <p className="text-sm opacity-90 mt-1">View the full area with satellite imagery</p>
            </CardContent>
          </Card>
        </a>
      </div>
      
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2 justify-center px-4">
        <Button
          size="sm"
          variant={activeFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setActiveFilter('all')}
        >
          <MapPin className="w-4 h-4 mr-1" />
          All ({locations.length})
        </Button>
        {Object.entries(categoryConfig).filter(([key]) => key !== 'restaurant').map(([key, config]) => {
          const Icon = config.icon;
          const count = locations.filter(l => 
            l.itemType === key || (key === 'dining' && l.itemType === 'restaurant')
          ).length;
          
          if (count === 0) return null;
          
          return (
            <Button
              key={key}
              size="sm"
              variant={activeFilter === key ? 'default' : 'outline'}
              onClick={() => setActiveFilter(key as CategoryFilter)}
            >
              <Icon className="w-4 h-4 mr-1" />
              {config.label} ({count})
            </Button>
          );
        })}
      </div>
      
      {/* Location list */}
      <Card className="shadow-warm mx-4">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {activeFilter === 'all' ? 'All Locations' : categoryConfig[activeFilter]?.label || 'Filtered Locations'}
            <Badge variant="secondary" className="ml-auto">
              {filteredLocations.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredLocations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No locations in this category.
            </p>
          ) : (
            filteredLocations.map((location, index) => {
              const config = categoryConfig[location.itemType] || categoryConfig.activity;
              const Icon = config.icon;
              
              const handleClick = () => {
                setSelectedLocation({
                  lat: location.lat,
                  lng: location.lng,
                  name: location.name
                });
                setMapModalOpen(true);
              };
              
              return (
                <button 
                  key={`${location.itemId}-${index}`}
                  onClick={handleClick}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-colors group w-full text-left"
                >
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", config.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{location.name}</p>
                    <p className="text-xs text-muted-foreground">{config.label}</p>
                  </div>
                  <MapPin className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
                </button>
              );
            })
          )}
        </CardContent>
      </Card>
      
      {/* Tip card */}
      <Card className="shadow-warm mx-4 bg-beach-sand/30">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground text-center">
            💡 <strong>Tip:</strong> Tap any location to view it on an interactive map.
          </p>
        </CardContent>
      </Card>

      {/* Map Modal */}
      {selectedLocation && (
        <MapModal
          open={mapModalOpen}
          onOpenChange={setMapModalOpen}
          lat={selectedLocation.lat}
          lng={selectedLocation.lng}
          name={selectedLocation.name}
        />
      )}
    </div>
  );
}
