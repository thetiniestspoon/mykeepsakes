import { useState, useMemo } from 'react';
import { Clock, MapPin, Phone, Globe, Check, Camera, Undo2, Route, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FavoriteHeart } from '@/components/ui/favorite-heart';
import { PhotoViewer } from '@/components/photos/PhotoViewer';
import type { ItineraryItem } from '@/types/trip';
import { useDashboardSelection } from '@/contexts/DashboardSelectionContext';
import { useUpdateItemStatus } from '@/hooks/use-database-itinerary';
import { MemoryCaptureDialog } from '@/components/album/MemoryCaptureDialog';
import { useTripDays } from '@/hooks/use-trip';
import { useActiveTrip } from '@/hooks/use-trip';
import { useLocations } from '@/hooks/use-locations';
import { useFavorites, useToggleFavorite } from '@/hooks/use-trip-data';
import { useLocationMemories, getMemoryMediaUrl } from '@/hooks/use-memories';
import { cn } from '@/lib/utils';

interface ActivityDetailProps {
  activity: ItineraryItem | null;
}

/**
 * Detailed view of a single activity for the center column
 */
export function ActivityDetail({ activity }: ActivityDetailProps) {
  const { panMap, highlightPin, navigateToPanel, focusLocation } = useDashboardSelection();
  const { data: trip } = useActiveTrip();
  const { data: days } = useTripDays(trip?.id);
  const { data: locations } = useLocations(trip?.id);
  const updateStatus = useUpdateItemStatus();
  const { data: favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const { data: locationMemories = [] } = useLocationMemories(activity?.location_id || undefined);
  
  const [memoryDialogOpen, setMemoryDialogOpen] = useState(false);
  const [photosOpen, setPhotosOpen] = useState(true);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoViewerIndex, setPhotoViewerIndex] = useState(0);

  // Flatten all media from location memories
  const locationPhotos = useMemo(() => {
    return locationMemories.flatMap(m => m.media || []);
  }, [locationMemories]);

  if (!activity) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Select an activity to see details</p>
      </div>
    );
  }

  const formatTime = (time: string | null) => {
    if (!time) return null;
    // Remove any existing AM/PM suffix from the time string
    const cleanTime = time.replace(/\s*(AM|PM)\s*/gi, '').trim();
    const [hours, minutes] = cleanTime.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const isCompleted = activity.status === 'done';
  const isFavorite = favorites?.[activity.id] ?? false;

  const handleShowOnMap = () => {
    if (activity.location?.lat && activity.location?.lng) {
      if (activity.location_id) {
        focusLocation({
          id: activity.location_id,
          category: activity.location.category || activity.category,
          dayId: activity.day_id,
        });
        highlightPin(activity.location_id);
      }
      panMap(activity.location.lat, activity.location.lng);
      navigateToPanel(2);
    }
  };

  const handleToggleComplete = () => {
    const newStatus = activity.status === 'done' ? 'planned' : 'done';
    updateStatus.mutate({ itemId: activity.id, status: newStatus });
  };

  const handleAddMemory = () => {
    setMemoryDialogOpen(true);
  };

  const handleGetDirections = () => {
    if (activity.location?.lat && activity.location?.lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${activity.location.lat},${activity.location.lng}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleToggleFavorite = () => {
    toggleFavorite.mutate({
      itemId: activity.id,
      itemType: activity.category,
      isFavorite: !isFavorite
    });
  };

  const handleOpenPhoto = (index: number) => {
    setPhotoViewerIndex(index);
    setPhotoViewerOpen(true);
  };

  // Safe URL parsing for link display
  const getLinkHostname = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  // Convert days data to format needed by MemoryCaptureDialog
  const legacyDays = days?.map((day, index) => ({
    id: day.id,
    date: day.date,
    dayOfWeek: new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }),
    title: day.title || `Day ${index + 1}`,
    activities: [],
  })) || [];

  // Convert photos for PhotoViewer
  const photoViewerData = locationPhotos.map(media => ({
    id: media.id,
    storage_path: media.storage_path,
    url: getMemoryMediaUrl(media.storage_path),
  }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className={cn(
          "text-xl font-semibold text-foreground",
          isCompleted && "line-through text-muted-foreground"
        )}>
          {activity.title}
        </h2>
        
        {activity.start_time && (
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <Clock className="w-4 h-4" />
            {formatTime(activity.start_time)}
            {activity.end_time && ` - ${formatTime(activity.end_time)}`}
          </p>
        )}
      </div>

      {/* Icon Action Row */}
      <TooltipProvider>
        <div className="flex items-center justify-center gap-1 py-3 border-y border-border">
          {/* Mark Visited */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isCompleted ? 'default' : 'ghost'}
                size="icon"
                onClick={handleToggleComplete}
                disabled={updateStatus.isPending}
                className={cn(
                  "h-10 w-10 rounded-full",
                  isCompleted && "bg-green-600 hover:bg-green-700 text-white"
                )}
              >
                {isCompleted ? <Undo2 className="h-5 w-5" /> : <Check className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isCompleted ? 'Mark as not visited' : 'Mark as visited'}
            </TooltipContent>
          </Tooltip>

          {/* Favorite */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <FavoriteHeart
                  isFavorite={isFavorite}
                  onToggle={handleToggleFavorite}
                  size="md"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            </TooltipContent>
          </Tooltip>

          {/* Add Memory */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={handleAddMemory}>
                <Camera className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add memory</TooltipContent>
          </Tooltip>

          {/* Get Directions */}
          {activity.location?.lat && activity.location?.lng && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={handleGetDirections}>
                  <Route className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Get directions</TooltipContent>
            </Tooltip>
          )}

          {/* Show on Map */}
          {activity.location && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={handleShowOnMap}>
                  <MapPin className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Show on map</TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>

      {/* Description */}
      {activity.description && (
        <div className="space-y-1">
          <p className="text-sm text-foreground leading-relaxed">{activity.description}</p>
        </div>
      )}

      {/* Location */}
      {activity.location && (
        <div className="space-y-1">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">{activity.location.name}</p>
              {activity.location.address && (
                <p className="text-xs text-muted-foreground">{activity.location.address}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contact Row - Phone & Website inline */}
      {(activity.phone || activity.link) && (
        <div className="flex flex-wrap gap-4 text-sm">
          {activity.phone && (
            <a href={`tel:${activity.phone}`} className="flex items-center gap-1.5 text-primary hover:underline">
              <Phone className="w-4 h-4" />
              {activity.phone}
            </a>
          )}
          {activity.link && (
            <a 
              href={activity.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-primary hover:underline truncate max-w-[200px]"
            >
              <Globe className="w-4 h-4 flex-shrink-0" />
              {activity.link_label || getLinkHostname(activity.link)}
            </a>
          )}
        </div>
      )}

      {/* Notes */}
      {activity.notes && (
        <div className="text-sm text-muted-foreground bg-secondary/50 rounded-md p-3">
          <p className="whitespace-pre-wrap">{activity.notes}</p>
        </div>
      )}

      {/* Photos Section */}
      {locationPhotos.length > 0 && (
        <Collapsible open={photosOpen} onOpenChange={setPhotosOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:bg-accent/30 rounded-md px-2 -mx-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Photos
              <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
                {locationPhotos.length}
              </span>
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform",
              photosOpen && "rotate-180"
            )} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="flex gap-2 overflow-x-auto py-2 scrollbar-hide">
              {locationPhotos.map((media, index) => (
                <button
                  key={media.id}
                  onClick={() => handleOpenPhoto(index)}
                  className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden focus:ring-2 focus:ring-primary"
                >
                  <img
                    src={getMemoryMediaUrl(media.storage_path)}
                    alt=""
                    className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Memory Capture Dialog */}
      <MemoryCaptureDialog
        open={memoryDialogOpen}
        onOpenChange={setMemoryDialogOpen}
        tripId={trip?.id}
        days={legacyDays}
        locations={locations || []}
        preselectedDayId={activity.day_id}
        preselectedLocationId={activity.location_id || undefined}
      />

      {/* Photo Viewer */}
      {photoViewerData.length > 0 && (
        <PhotoViewer
          photos={photoViewerData}
          initialIndex={photoViewerIndex}
          open={photoViewerOpen}
          onOpenChange={setPhotoViewerOpen}
        />
      )}
    </div>
  );
}
