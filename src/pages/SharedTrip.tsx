import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Waves, Sun, Calendar, MapPin, Clock, ExternalLink, Phone, Utensils, Activity, Home, Car, PartyPopper, Loader2, AlertCircle, Lock, Star } from 'lucide-react';
import { useValidateShareToken } from '@/hooks/use-sharing';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ItineraryDay, ItineraryItem, Location } from '@/types/trip';

const categoryConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  beach: { icon: Waves, color: 'bg-beach-seafoam text-beach-ocean-deep' },
  dining: { icon: Utensils, color: 'bg-beach-sunset-coral/20 text-beach-sunset-coral' },
  restaurant: { icon: Utensils, color: 'bg-beach-sunset-coral/20 text-beach-sunset-coral' },
  activity: { icon: Activity, color: 'bg-beach-ocean-light text-beach-ocean-deep' },
  accommodation: { icon: Home, color: 'bg-secondary text-secondary-foreground' },
  transport: { icon: Car, color: 'bg-muted text-muted-foreground' },
  event: { icon: PartyPopper, color: 'bg-beach-sunset-gold/20 text-beach-sunset-gold' },
};

// Fetch shared trip data
function useSharedTripData(tripId: string | undefined) {
  return useQuery({
    queryKey: ['shared-trip-data', tripId],
    queryFn: async () => {
      if (!tripId) throw new Error('No trip ID');
      
      // Fetch days
      const { data: days, error: daysError } = await supabase
        .from('itinerary_days')
        .select('*')
        .eq('trip_id', tripId)
        .order('date', { ascending: true });
      
      if (daysError) throw daysError;
      
      // Fetch items with locations
      const { data: items, error: itemsError } = await supabase
        .from('itinerary_items')
        .select(`
          *,
          location:locations(*)
        `)
        .eq('trip_id', tripId)
        .order('sort_index', { ascending: true });
      
      if (itemsError) throw itemsError;
      
      return {
        days: days as ItineraryDay[],
        items: items as (ItineraryItem & { location: Location | null })[],
      };
    },
    enabled: !!tripId,
  });
}

export default function SharedTrip() {
  const { token } = useParams<{ token: string }>();
  const { data: shareData, isLoading: validating, error: validationError } = useValidateShareToken(token);
  
  const tripId = shareData?.trip?.id;
  const { data: tripData, isLoading: loadingData } = useSharedTripData(tripId);
  
  // Loading state
  if (validating || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading shared trip...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (validationError || !shareData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              {validationError?.message?.includes('expired') ? (
                <Clock className="w-6 h-6 text-destructive" />
              ) : (
                <Lock className="w-6 h-6 text-destructive" />
              )}
            </div>
            <h2 className="text-lg font-semibold mb-2">Unable to Access Trip</h2>
            <p className="text-muted-foreground text-sm">
              {validationError?.message?.includes('expired') 
                ? 'This share link has expired. Please ask the trip owner for a new link.'
                : 'This share link is invalid or no longer available.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const trip = shareData.trip;
  const days = tripData?.days || [];
  const items = tripData?.items || [];
  
  // Group items by day
  const itemsByDay = items.reduce((acc, item) => {
    if (!acc[item.day_id]) acc[item.day_id] = [];
    acc[item.day_id].push(item);
    return acc;
  }, {} as Record<string, typeof items>);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sunset-gradient rounded-full flex items-center justify-center shadow-warm">
              <Sun className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold text-foreground">
                {trip.title}
              </h1>
              {trip.location_name && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Waves className="w-3 h-3" />
                  {trip.location_name}
                </p>
              )}
            </div>
          </div>
          
          <Badge variant="secondary" className="gap-1">
            <Lock className="w-3 h-3" />
            Read-only
          </Badge>
        </div>
      </header>
      
      <main className="container px-4 py-6 pb-20">
        {/* Trip dates */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Calendar className="w-4 h-4" />
          <span>
            {format(new Date(trip.start_date), 'MMM d')} - {format(new Date(trip.end_date), 'MMM d, yyyy')}
          </span>
        </div>
        
        {/* Days */}
        <div className="space-y-6">
          {days.map((day, index) => {
            const dayItems = itemsByDay[day.id] || [];
            const dayOfWeek = format(new Date(day.date + 'T00:00:00'), 'EEEE');
            const dateFormatted = format(new Date(day.date + 'T00:00:00'), 'MMMM d');
            
            return (
              <Card key={day.id} className="shadow-warm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-display">
                        Day {index + 1}: {dayOfWeek}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{dateFormatted}</p>
                    </div>
                    {day.title && (
                      <Badge variant="outline" className="shrink-0">
                        {day.title}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {dayItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No activities planned for this day.
                    </p>
                  ) : (
                    dayItems.map((item) => {
                      const config = categoryConfig[item.category] || categoryConfig.activity;
                      const Icon = config.icon;
                      
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "flex gap-3 p-3 rounded-lg bg-secondary/30",
                            item.is_chosen && "ring-1 ring-amber-400/60 bg-amber-50/30 dark:bg-amber-950/10"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                            config.color
                          )}>
                            <Icon className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-medium text-foreground">{item.title}</h3>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {item.is_chosen && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs border-amber-400/60 text-amber-700 dark:text-amber-400"
                                    title="Registered session"
                                  >
                                    <Star className="w-3 h-3 fill-current mr-1" />
                                    Registered
                                  </Badge>
                                )}
                                {item.start_time && (
                                  <Badge variant="secondary" className="text-xs">
                                    {item.start_time.slice(0, 5)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.description}
                              </p>
                            )}
                            
                            {item.location && (
                              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {item.location.name}
                                {item.location.address && ` - ${item.location.address}`}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap gap-2 mt-2">
                              {item.link && (
                                <a 
                                  href={item.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  {item.link_label || 'Link'}
                                </a>
                              )}
                              {item.phone && (
                                <a 
                                  href={`tel:${item.phone}`}
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                  <Phone className="w-3 h-3" />
                                  {item.phone}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {days.length === 0 && (
          <Card className="shadow-warm">
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No itinerary days found for this trip.</p>
            </CardContent>
          </Card>
        )}
      </main>
      
      {/* Footer */}
      <footer className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t border-border py-3">
        <div className="container px-4 text-center">
          <p className="text-xs text-muted-foreground">
            Shared with you • Powered by Family Trip Planner
          </p>
        </div>
      </footer>
    </div>
  );
}
