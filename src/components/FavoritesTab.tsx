import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, ExternalLink, Phone, MapPin, Calendar } from 'lucide-react';
import { useFavorites, useNotes, usePhotos, getPhotoUrl } from '@/hooks/use-trip-data';
import { ITINERARY, BEACHES, RESTAURANTS } from '@/lib/itinerary-data';
import type { Activity, GuideItem } from '@/lib/itinerary-data';

export function FavoritesTab() {
  const { data: favorites } = useFavorites();
  const { data: notes } = useNotes();
  const { data: photos } = usePhotos();
  
  if (!favorites) {
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  }
  
  const favoriteIds = Object.keys(favorites).filter(id => favorites[id]);
  
  // Find all favorite items across itinerary, beaches, and restaurants
  const favoriteActivities: (Activity & { dayTitle: string })[] = [];
  ITINERARY.forEach(day => {
    day.activities.forEach(activity => {
      if (favoriteIds.includes(activity.id)) {
        favoriteActivities.push({ ...activity, dayTitle: day.title });
      }
    });
  });
  
  const favoriteBeaches = BEACHES.filter(b => favoriteIds.includes(b.id));
  const favoriteRestaurants = RESTAURANTS.filter(r => favoriteIds.includes(r.id));
  
  const hasFavorites = favoriteActivities.length > 0 || 
                       favoriteBeaches.length > 0 || 
                       favoriteRestaurants.length > 0;

  return (
    <div className="space-y-6 pb-20">
      <div className="text-center py-4">
        <h2 className="font-display text-2xl text-foreground">Your Favorites</h2>
        <p className="text-muted-foreground">Quick access to starred items</p>
      </div>
      
      {!hasFavorites ? (
        <Card className="shadow-warm">
          <CardContent className="py-12 text-center">
            <Star className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-foreground mb-2">No favorites yet</h3>
            <p className="text-sm text-muted-foreground">
              Star activities, beaches, or restaurants to find them quickly here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Favorite Activities */}
          {favoriteActivities.length > 0 && (
            <Card className="shadow-warm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 text-primary" />
                  Itinerary Favorites
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {favoriteActivities.map((activity) => {
                  const activityPhotos = photos?.filter(p => p.item_id === activity.id) ?? [];
                  
                  return (
                    <div key={activity.id} className="p-3 rounded-lg bg-secondary/30">
                      <div className="flex items-start gap-3">
                        <Star className="w-5 h-5 text-beach-sunset-gold fill-beach-sunset-gold mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">{activity.dayTitle}</p>
                          <h4 className="font-medium text-foreground">{activity.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {activity.link && (
                              <a href={activity.link} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline inline-flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" />
                                {activity.linkLabel || 'View'}
                              </a>
                            )}
                            {activity.phone && (
                              <a href={`tel:${activity.phone}`} className="text-xs text-accent hover:underline inline-flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                Call
                              </a>
                            )}
                          </div>
                          
                          {activityPhotos.length > 0 && (
                            <div className="mt-2 flex gap-2">
                              {activityPhotos.slice(0, 4).map((photo) => (
                                <img
                                  key={photo.id}
                                  src={getPhotoUrl(photo.storage_path)}
                                  alt=""
                                  className="w-12 h-12 object-cover rounded"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
          
          {/* Favorite Beaches */}
          {favoriteBeaches.length > 0 && (
            <Card className="shadow-warm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="w-5 h-5 text-beach-sunset-gold fill-beach-sunset-gold" />
                  Favorite Beaches
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {favoriteBeaches.map((beach) => (
                  <div key={beach.id} className="p-3 rounded-lg bg-beach-seafoam/20">
                    <h4 className="font-medium text-foreground">{beach.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{beach.description}</p>
                    {beach.mapLink && (
                      <a href={beach.mapLink} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline inline-flex items-center gap-1 mt-2">
                        <MapPin className="w-3 h-3" />
                        Directions
                      </a>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          
          {/* Favorite Restaurants */}
          {favoriteRestaurants.length > 0 && (
            <Card className="shadow-warm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="w-5 h-5 text-beach-sunset-gold fill-beach-sunset-gold" />
                  Favorite Restaurants
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {favoriteRestaurants.map((restaurant) => (
                  <div key={restaurant.id} className="p-3 rounded-lg bg-beach-sunset-coral/10">
                    <h4 className="font-medium text-foreground">{restaurant.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{restaurant.description}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {restaurant.link && (
                        <a href={restaurant.link} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline inline-flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          Website
                        </a>
                      )}
                      {restaurant.phone && (
                        <a href={`tel:${restaurant.phone}`} className="text-xs text-accent hover:underline inline-flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {restaurant.phone}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
