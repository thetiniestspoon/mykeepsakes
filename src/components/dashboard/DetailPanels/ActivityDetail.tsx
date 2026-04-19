import { useState, useMemo } from 'react';
import { Clock, MapPin, Phone, Globe, Check, Camera, Undo2, Route, ChevronDown, Image as ImageIcon, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FavoriteHeart } from '@/components/ui/favorite-heart';
import { PhotoViewer } from '@/components/photos/PhotoViewer';
import type { ItineraryItem } from '@/types/trip';
import { useDashboardSelection } from '@/contexts/DashboardSelectionContext';
import { useUpdateItemStatus, type LegacyActivity } from '@/hooks/use-database-itinerary';
import { MemoryCaptureDialog } from '@/components/album/MemoryCaptureDialog';
import { DatabaseActivityEditor } from '@/components/itinerary/DatabaseActivityEditor';
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
export function ActivityDetail({
  activity
}: ActivityDetailProps) {
  const {
    panMap,
    highlightPin,
    navigateToPanel,
    focusLocation
  } = useDashboardSelection();
  const {
    data: trip
  } = useActiveTrip();
  const {
    data: days
  } = useTripDays(trip?.id);
  const {
    data: locations
  } = useLocations(trip?.id);
  const updateStatus = useUpdateItemStatus();
  const {
    data: favorites
  } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const {
    data: locationMemories = []
  } = useLocationMemories(activity?.location_id || undefined);
  const [memoryDialogOpen, setMemoryDialogOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [photosOpen, setPhotosOpen] = useState(true);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoViewerIndex, setPhotoViewerIndex] = useState(0);

  // Flatten all media from location memories
  const locationPhotos = useMemo(() => {
    return locationMemories.flatMap(m => m.media || []);
  }, [locationMemories]);
  if (!activity) {
    return <div className="flex items-center justify-center h-full text-[var(--c-ink-muted)]">
        <p>Select an activity to see details</p>
      </div>;
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
          dayId: activity.day_id
        });
        highlightPin(activity.location_id);
      }
      panMap(activity.location.lat, activity.location.lng);
      navigateToPanel(2);
    }
  };
  const handleToggleComplete = () => {
    const newStatus = activity.status === 'done' ? 'planned' : 'done';
    updateStatus.mutate({
      itemId: activity.id,
      status: newStatus
    });
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
  
  const handleEdit = () => {
    setEditorOpen(true);
  };
  
  // Convert ItineraryItem to LegacyActivity format for editor
  const legacyActivity: LegacyActivity | null = activity ? {
    id: activity.id,
    time: activity.start_time ? undefined : undefined,
    rawStartTime: activity.start_time || undefined,
    rawEndTime: activity.end_time || undefined,
    title: activity.title,
    description: activity.description || '',
    category: activity.category as LegacyActivity['category'],
    location: activity.location ? {
      id: activity.location.id,
      lat: activity.location.lat!,
      lng: activity.location.lng!,
      name: activity.location.name,
      address: activity.location.address || undefined,
      category: activity.location.category || undefined,
    } : undefined,
    link: activity.link || undefined,
    linkLabel: activity.link_label || undefined,
    phone: activity.phone || undefined,
    notes: activity.notes || undefined,
    status: activity.status as LegacyActivity['status'],
    completedAt: activity.completed_at || undefined,
    dayId: activity.day_id,
    itemType: activity.item_type as 'activity' | 'marker',
  } : null;

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
    dayOfWeek: new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long'
    }),
    title: day.title || `Day ${index + 1}`,
    activities: []
  })) || [];

  // Convert photos for PhotoViewer
  const photoViewerData = locationPhotos.map(media => ({
    id: media.id,
    storage_path: media.storage_path,
    url: getMemoryMediaUrl(media.storage_path)
  }));
  return <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h2 className={cn("text-xl font-semibold text-[var(--c-ink)] flex-1", isCompleted && "line-through text-[var(--c-ink-muted)]")}>
          {activity.title}
        </h2>

        {activity.start_time && <div className="text-right text-sm text-[var(--c-ink-muted)] flex-shrink-0">
            <div className="flex items-center justify-end gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(activity.start_time)}
            </div>
            {activity.end_time && <div className="text-xs">to {formatTime(activity.end_time)}</div>}
          </div>}
      </div>

      {/* Speaker & Track */}
      {(activity.speaker || activity.track) && <div className="flex items-center gap-2 flex-wrap">
          {activity.speaker && <span className="text-sm text-[var(--c-ink-muted)]">{activity.speaker}</span>}
          {activity.track && <Badge variant="outline" className="text-xs">Track {activity.track}</Badge>}
        </div>}

      {/* Icon Action Row */}
      <TooltipProvider>
        <div className="flex items-center justify-center gap-1 py-3 border-y border-[var(--c-line)]">
          {/* Mark Visited */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant={isCompleted ? 'default' : 'ghost'} size="icon" onClick={handleToggleComplete} disabled={updateStatus.isPending} className={cn("h-10 w-10 rounded-full", isCompleted && "bg-green-600 hover:bg-green-700 text-white")}>
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
                <FavoriteHeart isFavorite={isFavorite} onToggle={handleToggleFavorite} size="md" />
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

          {/* Edit Activity */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={handleEdit}>
                <Pencil className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit activity</TooltipContent>
          </Tooltip>

          {/* Get Directions */}
          {activity.location?.lat && activity.location?.lng && <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={handleGetDirections}>
                  <Route className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Get directions</TooltipContent>
            </Tooltip>}

          {/* Show on Map */}
          {activity.location && <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={handleShowOnMap}>
                  <MapPin className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Show on map</TooltipContent>
            </Tooltip>}
        </div>
      </TooltipProvider>

      {/* Description */}
      {activity.description && <div className="space-y-1">
          <p className="text-sm text-[var(--c-ink)] leading-relaxed">{activity.description}</p>
        </div>}

      {/* Location */}
      {activity.location && <div className="space-y-1">
          
        </div>}

      {/* Contact Row - Phone & Website inline */}
      {(activity.phone || activity.link) && <div className="flex flex-wrap gap-4 text-sm">
          {activity.phone && <a href={`tel:${activity.phone}`} className="flex items-center gap-1.5 text-[var(--c-pen)] hover:underline">
              <Phone className="w-4 h-4" />
              {activity.phone}
            </a>}
          {activity.link && <a href={activity.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[var(--c-pen)] hover:underline truncate max-w-[200px]">
              <Globe className="w-4 h-4 flex-shrink-0" />
              {activity.link_label || getLinkHostname(activity.link)}
            </a>}
        </div>}

      {/* Notes */}
      {activity.notes && <div className="text-sm text-[var(--c-ink-muted)] bg-[var(--c-creme)] rounded-md p-3">
          <p className="whitespace-pre-wrap">{activity.notes}</p>
        </div>}

      {/* Photos Section */}
      {locationPhotos.length > 0 && <Collapsible open={photosOpen} onOpenChange={setPhotosOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium text-[var(--c-ink)] hover:bg-[var(--c-creme)] rounded-md px-2 -mx-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Photos
              <span className="text-xs text-[var(--c-ink-muted)] bg-[var(--c-creme)] px-1.5 py-0.5 rounded-full">
                {locationPhotos.length}
              </span>
            </div>
            <ChevronDown className={cn("w-4 h-4 transition-transform", photosOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="flex gap-2 overflow-x-auto py-2 scrollbar-hide">
              {locationPhotos.map((media, index) => <button key={media.id} onClick={() => handleOpenPhoto(index)} className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden focus:ring-2 focus:ring-[var(--c-pen)]">
                  <img src={getMemoryMediaUrl(media.storage_path)} alt="" className="w-full h-full object-cover hover:opacity-90 transition-opacity" loading="lazy" />
                </button>)}
            </div>
          </CollapsibleContent>
        </Collapsible>}

      {/* Memory Capture Dialog */}
      <MemoryCaptureDialog open={memoryDialogOpen} onOpenChange={setMemoryDialogOpen} tripId={trip?.id} days={legacyDays} locations={locations || []} preselectedDayId={activity.day_id} preselectedLocationId={activity.location_id || undefined} />

      {/* Photo Viewer */}
      {photoViewerData.length > 0 && <PhotoViewer photos={photoViewerData} initialIndex={photoViewerIndex} open={photoViewerOpen} onOpenChange={setPhotoViewerOpen} />}
      
      {/* Activity Editor */}
      {trip && legacyActivity && (
        <DatabaseActivityEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          dayId={activity.day_id}
          tripId={trip.id}
          activity={legacyActivity}
        />
      )}
    </div>;
}