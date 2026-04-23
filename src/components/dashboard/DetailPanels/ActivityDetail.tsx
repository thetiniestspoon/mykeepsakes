import { useState, useMemo } from 'react';
import { Clock, MapPin, Phone, Globe, Check, Camera, Undo2, ChevronDown, Image as ImageIcon, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FavoriteHeart } from '@/components/ui/favorite-heart';
import type { ItineraryItem } from '@/types/trip';
import { useDashboardSelection } from '@/contexts/DashboardSelectionContext';
import { useUpdateItemStatus, type LegacyActivity } from '@/hooks/use-database-itinerary';
import { MemoryCaptureDialog } from '@/components/album/MemoryCaptureDialog';
import { MemoryEditDialog } from '@/components/album/MemoryEditDialog';
import { DatabaseActivityEditor } from '@/components/itinerary/DatabaseActivityEditor';
import { useTripDays } from '@/hooks/use-trip';
import { useActiveTrip } from '@/hooks/use-trip';
import { useLocations } from '@/hooks/use-locations';
import { useFavorites, useToggleFavorite } from '@/hooks/use-trip-data';
import { useItemMemories, useDeleteMemoryMedia, getMemoryMediaUrl } from '@/hooks/use-memories';
import { useDeleteItem } from '@/hooks/use-itinerary';
import { PhotoViewer, type Photo } from '@/components/photos/PhotoViewer';
import type { Memory } from '@/types/trip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import '@/preview/collage/collage.css';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { StickerPill } from '@/preview/collage/ui/StickerPill';
import { Tape } from '@/preview/collage/ui/Tape';
import { MarginNote } from '@/preview/collage/ui/MarginNote';

interface ActivityDetailProps {
  activity: ItineraryItem | null;
}

/**
 * Detailed view of a single activity for the center column.
 * Migrated to Collage direction 2026-04-23 (Phase 4d). Presentation only —
 * state/hooks/handlers/data logic unchanged. Outer wrapper scopes tokens via
 * className="collage-root"; body restyled with Stamp/StickerPill/Tape/MarginNote
 * per DayV2 / DashboardV2 vocabulary (session-block feel — stamped heading,
 * ink-and-pen typography, taped hero, index-card notes, polaroid photo grid).
 */

function timeOfDayStamp(start?: string | null): string {
  if (!start) return '◈ MOMENT';
  const h = parseInt(start.slice(0, 2), 10);
  if (Number.isNaN(h)) return '◈ MOMENT';
  if (h < 11) return '☀ MORNING';
  if (h < 14) return '✦ MIDDAY';
  if (h < 17) return '◈ AFTERNOON';
  return '◐ EVENING';
}

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
    data: itemMemories = []
  } = useItemMemories(activity?.id);
  const [memoryDialogOpen, setMemoryDialogOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const deleteItem = useDeleteItem();
  const deleteMemoryMedia = useDeleteMemoryMedia();
  const [photosOpen, setPhotosOpen] = useState(true);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoViewerIndex, setPhotoViewerIndex] = useState(0);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [memoryEditOpen, setMemoryEditOpen] = useState(false);

  // Flatten all media from this event's memories (item-scoped to prevent
  // cross-event bleed — two events at the same location no longer share photos)
  const locationPhotos = useMemo(() => {
    return itemMemories.flatMap(m => m.media || []);
  }, [itemMemories]);

  if (!activity) {
    return (
      <div
        className="collage-root"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: 240,
          padding: 32,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Stamp variant="outline" size="sm" rotate={-2} style={{ marginBottom: 14 }}>
            pick a moment
          </Stamp>
          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontStyle: 'italic',
              color: 'var(--c-ink-muted)',
              margin: 0,
              fontSize: 15,
            }}
          >
            Select an activity to see details
          </p>
        </div>
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
  const todStamp = timeOfDayStamp(activity.start_time);

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
  const handleDelete = () => {
    setDeleteConfirmOpen(true);
  };
  const handleConfirmDelete = () => {
    if (!activity) return;
    deleteItem.mutate(activity.id);
    setDeleteConfirmOpen(false);
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

  // Convert photos for PhotoViewer. Include memory_id so edit/delete flows work.
  const photoViewerData = locationPhotos.map(media => ({
    id: media.id,
    storage_path: media.storage_path,
    url: getMemoryMediaUrl(media.storage_path),
    memoryId: media.memory_id,
  }));

  const handleEditPhoto = (photo: Photo) => {
    if (!photo.memoryId) return;
    const mem = itemMemories.find(m => m.id === photo.memoryId);
    if (!mem) return;
    setEditingMemory(mem);
    setMemoryEditOpen(true);
  };

  const handleDeletePhoto = (photo: Photo) => {
    const media = locationPhotos.find(m => m.id === photo.id);
    if (!media) return;
    deleteMemoryMedia.mutate({
      mediaId: media.id,
      storagePath: media.storage_path,
      thumbnailPath: media.thumbnail_path,
    });
  };

  return (
    <div
      className="collage-root"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        background: 'transparent', // defer to parent shell background
      }}
    >
      {/* Hero — taped session block */}
      <header
        style={{
          position: 'relative',
          background: 'var(--c-paper)',
          boxShadow: 'var(--c-shadow)',
          padding: '24px 20px 18px',
          marginTop: 14, // room for the tape to overhang
        }}
      >
        <Tape position="top-left" rotate={-5} width={78} />

        {/* Time-of-day stamp */}
        <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: 'var(--c-font-display)',
              fontSize: 11,
              letterSpacing: '.22em',
              color: 'var(--c-ink)',
              lineHeight: 1,
            }}
          >
            {todStamp}
          </span>

          {activity.start_time && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'var(--c-font-body)',
                fontSize: 13,
                color: 'var(--c-ink-muted)',
                fontStyle: 'italic',
                whiteSpace: 'nowrap',
              }}
            >
              <Clock style={{ width: 13, height: 13 }} aria-hidden />
              <span>
                {formatTime(activity.start_time)}
                {activity.end_time && <> — {formatTime(activity.end_time)}</>}
              </span>
            </div>
          )}
        </div>

        <h2
          className={cn(isCompleted && "line-through")}
          style={{
            fontFamily: 'var(--c-font-body)',
            fontSize: 22,
            fontWeight: 500,
            lineHeight: 1.2,
            margin: 0,
            color: isCompleted ? 'var(--c-ink-muted)' : 'var(--c-ink)',
          }}
        >
          {activity.title}
        </h2>

        {/* Speaker + Track */}
        {(activity.speaker || activity.track) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
            {activity.track && (
              <StickerPill variant="pen" rotate={-2} style={{ fontSize: 9, padding: '6px 10px' }}>
                Track {activity.track}
              </StickerPill>
            )}
            {activity.speaker && (
              <span
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontStyle: 'italic',
                  fontSize: 14,
                  color: 'var(--c-ink-muted)',
                }}
              >
                {activity.speaker}
              </span>
            )}
          </div>
        )}

        {isCompleted && (
          <MarginNote rotate={-3} size={20} style={{ position: 'absolute', top: 10, right: 14 }}>
            visited ✓
          </MarginNote>
        )}
      </header>

      {/* Icon Action Row */}
      <TooltipProvider>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: '10px 8px',
            borderTop: '1px dashed var(--c-line)',
            borderBottom: '1px dashed var(--c-line)',
          }}
        >
          {/* Mark Visited */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isCompleted ? 'default' : 'ghost'}
                size="icon"
                onClick={handleToggleComplete}
                disabled={updateStatus.isPending}
                className={cn("h-10 w-10 rounded-full", isCompleted && "bg-[var(--c-success)] hover:bg-[var(--c-success)]/90 text-[var(--c-creme)]")}
                aria-label={isCompleted ? 'Mark as not visited' : 'Mark as visited'}
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
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={handleAddMemory} aria-label="Add memory">
                <Camera className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add memory</TooltipContent>
          </Tooltip>

          {/* Edit Activity */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={handleEdit} aria-label="Edit activity">
                <Pencil className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit activity</TooltipContent>
          </Tooltip>

          {/* Delete Activity */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full text-[var(--c-danger)] hover:bg-[var(--c-danger)]/10 hover:text-[var(--c-danger)]"
                onClick={handleDelete}
                aria-label="Delete activity"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete activity</TooltipContent>
          </Tooltip>

          {/* Show on Map */}
          {activity.location && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={handleShowOnMap} aria-label="Show on map">
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
        <p
          style={{
            fontFamily: 'var(--c-font-body)',
            fontSize: 15,
            lineHeight: 1.55,
            color: 'var(--c-ink)',
            margin: 0,
          }}
        >
          {activity.description}
        </p>
      )}

      {/* Contact Row - Phone & Website inline */}
      {(activity.phone || activity.link) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 14 }}>
          {activity.phone && (
            <a
              href={`tel:${activity.phone}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--c-pen)',
                textDecoration: 'none',
                fontFamily: 'var(--c-font-body)',
                borderBottom: '1px dashed var(--c-pen)',
                paddingBottom: 1,
              }}
            >
              <Phone style={{ width: 14, height: 14 }} aria-hidden />
              {activity.phone}
            </a>
          )}
          {activity.link && (
            <a
              href={activity.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--c-pen)',
                textDecoration: 'none',
                fontFamily: 'var(--c-font-body)',
                borderBottom: '1px dashed var(--c-pen)',
                paddingBottom: 1,
                maxWidth: 220,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <Globe style={{ width: 14, height: 14, flexShrink: 0 }} aria-hidden />
              {activity.link_label || getLinkHostname(activity.link)}
            </a>
          )}
        </div>
      )}

      {/* Notes — index-card aesthetic */}
      {activity.notes && (
        <aside
          style={{
            position: 'relative',
            background: 'var(--c-paper)',
            borderLeft: '3px solid var(--c-pen)',
            boxShadow: 'var(--c-shadow-sm)',
            padding: '12px 14px 14px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--c-font-display)',
              fontSize: 10,
              letterSpacing: '.22em',
              textTransform: 'uppercase',
              color: 'var(--c-ink-muted)',
              marginBottom: 6,
            }}
          >
            notes
          </div>
          <p
            style={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'var(--c-font-body)',
              fontSize: 14,
              lineHeight: 1.55,
              color: 'var(--c-ink)',
              margin: 0,
            }}
          >
            {activity.notes}
          </p>
        </aside>
      )}

      {/* Photos Section */}
      {locationPhotos.length > 0 && (
        <Collapsible open={photosOpen} onOpenChange={setPhotosOpen}>
          <CollapsibleTrigger
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '10px 12px',
              background: 'transparent',
              border: '1px dashed var(--c-line)',
              borderRadius: 'var(--c-r-sm)',
              cursor: 'pointer',
              color: 'var(--c-ink)',
              fontFamily: 'var(--c-font-body)',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <ImageIcon style={{ width: 16, height: 16 }} aria-hidden />
              <span>Photos</span>
              <Stamp variant="ink" size="sm" style={{ fontSize: 9, padding: '4px 8px' }}>
                {locationPhotos.length}
              </Stamp>
            </span>
            <ChevronDown
              className={cn("transition-transform", photosOpen && "rotate-180")}
              style={{ width: 16, height: 16 }}
              aria-hidden
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div
              className="scrollbar-hide"
              style={{
                display: 'flex',
                gap: 12,
                overflowX: 'auto',
                padding: '14px 2px 6px',
              }}
            >
              {locationPhotos.map((media, index) => {
                // Gentle ±2° polaroid-stack rotation so the row feels like pinned prints.
                const rot = (index % 3) - 1; // -1, 0, 1 cycling
                return (
                  <button
                    key={media.id}
                    onClick={() => handleOpenPhoto(index)}
                    aria-label={`Open photo ${index + 1}`}
                    style={{
                      flexShrink: 0,
                      background: 'var(--c-paper)',
                      padding: 4,
                      boxShadow: 'var(--c-shadow-sm)',
                      border: 'none',
                      cursor: 'pointer',
                      transform: `rotate(${rot * 2}deg)`,
                      transition: 'transform var(--c-t-fast) var(--c-ease-out), box-shadow var(--c-t-fast)',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'rotate(0deg) translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--c-shadow)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = `rotate(${rot * 2}deg)`;
                      e.currentTarget.style.boxShadow = 'var(--c-shadow-sm)';
                    }}
                  >
                    <img
                      src={getMemoryMediaUrl(media.storage_path)}
                      alt=""
                      style={{
                        display: 'block',
                        width: 64,
                        height: 64,
                        objectFit: 'cover',
                      }}
                      loading="lazy"
                    />
                  </button>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Respect reduced-motion for all tilt/hover effects inside this scope */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .collage-root button,
          .collage-root a,
          .collage-root [class*="collage-"] {
            transition: none !important;
            transform: none !important;
            animation: none !important;
          }
        }
      `}</style>

      {/* Memory Capture Dialog */}
      <MemoryCaptureDialog open={memoryDialogOpen} onOpenChange={setMemoryDialogOpen} tripId={trip?.id} days={legacyDays} locations={locations || []} preselectedDayId={activity.day_id} preselectedLocationId={activity.location_id || undefined} itineraryItemId={activity.id} />

      {/* Photo Viewer */}
      {photoViewerData.length > 0 && <PhotoViewer photos={photoViewerData} initialIndex={photoViewerIndex} open={photoViewerOpen} onOpenChange={setPhotoViewerOpen} onEdit={handleEditPhoto} onDelete={handleDeletePhoto} />}

      {/* Memory Edit (tags + note) */}
      <MemoryEditDialog
        open={memoryEditOpen}
        onOpenChange={setMemoryEditOpen}
        memory={editingMemory}
      />

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

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              "{activity.title}" will be removed from your itinerary. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
