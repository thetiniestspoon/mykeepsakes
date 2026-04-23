import { useState, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Star,
  ExternalLink,
  Phone,
  MapPin,
  StickyNote,
  Camera,
  Utensils,
  Waves,
  Home,
  Car,
  PartyPopper,
  Activity,
  X,
  Trash2,
  Plus,
  Edit2,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { Day, Activity as ActivityType } from '@/lib/itinerary-data';
import {
  useChecklistItems,
  useToggleChecklistItem,
  useFavorites,
  useToggleFavorite,
  useNotes,
  useAddNote,
  useDeleteNote,
  usePhotos,
  useUploadPhoto,
  useDeletePhoto,
  getPhotoUrl,
} from '@/hooks/use-trip-data';
import {
  useCustomActivities,
  useActivityOrder,
  useUpdateActivityOrder,
  useDeleteCustomActivity,
  useToggleActivityVisibility,
  customActivityToActivity,
} from '@/hooks/use-activity-order';
import {
  useActivityOverrides,
  applyOverride,
} from '@/hooks/use-activity-overrides';
import { DraggableActivity } from '@/components/itinerary/DraggableActivity';
import { ActivityEditor } from '@/components/itinerary/ActivityEditor';
import { MapModal } from '@/components/map/MapModal';
import { PhotoViewer } from '@/components/photos/PhotoViewer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import '@/preview/collage/collage.css';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { StickerPill } from '@/preview/collage/ui/StickerPill';
import { Tape } from '@/preview/collage/ui/Tape';
import { MarginNote } from '@/preview/collage/ui/MarginNote';

/**
 * Legacy (non-database) Itinerary surface — migrated to Collage (Phase 4 #2
 * core, W3.3a). Presentation only: all hooks (checklists, favorites, notes,
 * photo upload, custom activities, activity order, overrides, drag-reorder
 * DnDContext) preserved.
 *
 * Aesthetic: Session Blocks (Morning / Midday / Afternoon / Evening) grouping
 * within each day, matching DayV2. Legacy ActivityType.time is a string like
 * "10:00 AM" — a parse helper maps those to the same 4 blocks used by the
 * database surface. Paper-chip activity cards with ±2° rotation cycle by
 * index, hover straightens and lifts. Pen-blue StickerPill for track,
 * Caveat MarginNote for day-of-week/weather asides.
 *
 * Not imported anywhere in the live app (DatabaseItineraryTab is live),
 * but migrated for consistency. No drag surface change — the wrapping
 * DraggableActivity and DnDContext preserve reorder semantics.
 */

interface SelectedLocation {
  lat: number;
  lng: number;
  name: string;
  address?: string;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  activity: Activity,
  dining: Utensils,
  beach: Waves,
  accommodation: Home,
  transport: Car,
  event: PartyPopper,
};

// ---- Session-block helpers ----
type BlockName = 'morning' | 'midday' | 'afternoon' | 'evening';
const BLOCKS: {
  key: BlockName;
  stamp: string;
  range: string;
  fromH: number;
  toH: number;
  tapeRotate: number;
}[] = [
  { key: 'morning',   stamp: '☀ MORNING',   range: 'before 11', fromH: 0,  toH: 11, tapeRotate: -4 },
  { key: 'midday',    stamp: '✦ MIDDAY',    range: '11 — 2',    fromH: 11, toH: 14, tapeRotate: 2 },
  { key: 'afternoon', stamp: '◈ AFTERNOON', range: '2 — 5',     fromH: 14, toH: 17, tapeRotate: -2 },
  { key: 'evening',   stamp: '◐ EVENING',   range: 'after 5',   fromH: 17, toH: 24, tapeRotate: 4 },
];

// Map legacy "H:MM AM/PM" display time → 24-hour hour. Returns null if
// unparseable (treated as midday).
function parseLegacyHour(time?: string): number | null {
  if (!time) return null;
  const m = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const period = m[3].toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h;
}

function timeToBlock(time?: string): BlockName {
  const h = parseLegacyHour(time);
  if (h === null) return 'midday';
  const b = BLOCKS.find(b => h >= b.fromH && h < b.toH);
  return b?.key ?? 'midday';
}

// ---- ActivityCard ----

interface ActivityCardProps {
  activity: ActivityType;
  isCustom?: boolean;
  cardIndex?: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onHide?: () => void;
  onOpenMap?: (location: SelectedLocation) => void;
  onOpenPhoto?: (photos: Array<{ id: string; storage_path: string; caption?: string | null }>, index: number) => void;
}

function ActivityCard({
  activity,
  isCustom,
  cardIndex = 0,
  onEdit,
  onDelete,
  onHide,
  onOpenMap,
  onOpenPhoto,
}: ActivityCardProps) {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: checklistItems } = useChecklistItems();
  const { data: favorites } = useFavorites();
  const { data: notes } = useNotes();
  const { data: photos } = usePhotos();

  const toggleChecklist = useToggleChecklistItem();
  const toggleFavorite = useToggleFavorite();
  const addNote = useAddNote();
  const deleteNote = useDeleteNote();
  const uploadPhoto = useUploadPhoto();
  const deletePhoto = useDeletePhoto();

  const isCompleted = checklistItems?.[activity.id] ?? false;
  const isFavorite = favorites?.[activity.id] ?? false;
  const activityNotes = notes?.filter(n => n.item_id === activity.id) ?? [];
  const activityPhotos = photos?.filter(p => p.item_id === activity.id) ?? [];

  const Icon = categoryIcons[activity.category] || Activity;

  const restRotation = ((cardIndex % 3) - 1) * 2;
  const appliedRotation = isHovering ? 0 : restRotation;

  const handleAddNote = () => {
    if (noteContent.trim()) {
      addNote.mutate({ itemId: activity.id, content: noteContent });
      setNoteContent('');
      setShowNoteInput(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadPhoto.mutate({ itemId: activity.id, file });
    }
  };

  return (
    <div
      data-activity-id={activity.id}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        position: 'relative',
        background: 'var(--c-paper)',
        boxShadow: isHovering ? 'var(--c-shadow)' : 'var(--c-shadow-sm)',
        padding: '14px',
        borderRadius: 'var(--c-r-sm)',
        transform: `rotate(${appliedRotation}deg)${isHovering ? ' translateY(-2px)' : ''}`,
        transition: 'transform var(--c-t-fast) var(--c-ease-out), box-shadow var(--c-t-fast) var(--c-ease-out)',
        opacity: isCompleted ? 0.7 : 1,
      }}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={(checked) =>
            toggleChecklist.mutate({ itemId: activity.id, isCompleted: !!checked })
          }
          className="mt-1"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="inline-flex items-center gap-1"
              style={{
                fontFamily: 'var(--c-font-display)',
                fontSize: 9,
                letterSpacing: '.2em',
                textTransform: 'uppercase',
                color: 'var(--c-ink)',
                padding: '3px 6px',
                background: 'var(--c-creme)',
                border: '1px solid var(--c-line)',
                borderRadius: 'var(--c-r-sm)',
              }}
            >
              <Icon className="w-3 h-3" />
              {activity.category}
            </span>
            {activity.time && (
              <span
                style={{
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 9,
                  letterSpacing: '.18em',
                  color: 'var(--c-ink-muted)',
                }}
              >
                {activity.time}
              </span>
            )}
            {isCustom && (
              <StickerPill variant="pen" style={{ fontSize: 8, padding: '4px 8px' }}>
                Custom
              </StickerPill>
            )}
          </div>

          <h4
            className={cn(isCompleted && "line-through")}
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 16,
              fontWeight: 500,
              lineHeight: 1.3,
              color: isCompleted ? 'var(--c-ink-muted)' : 'var(--c-ink)',
              margin: 0,
            }}
          >
            {activity.title}
          </h4>

          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 13,
              lineHeight: 1.5,
              color: 'var(--c-ink-muted)',
              margin: '4px 0 0',
            }}
          >
            {activity.description}
          </p>

          {/* Links and actions — pen-blue dashed underlines */}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            {activity.link && (
              <a
                href={activity.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1"
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontSize: 12,
                  color: 'var(--c-pen)',
                  textDecoration: 'none',
                  borderBottom: '1px dashed var(--c-pen)',
                  paddingBottom: 1,
                }}
              >
                <ExternalLink className="w-3 h-3" />
                {activity.linkLabel || 'View'}
              </a>
            )}

            {activity.phone && (
              <a
                href={`tel:${activity.phone}`}
                className="inline-flex items-center gap-1"
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontSize: 12,
                  color: 'var(--c-pen)',
                  textDecoration: 'none',
                  borderBottom: '1px dashed var(--c-pen)',
                  paddingBottom: 1,
                }}
              >
                <Phone className="w-3 h-3" />
                {activity.phone}
              </a>
            )}

            {activity.location && onOpenMap && (
              <button
                onClick={() => onOpenMap({
                  lat: activity.location!.lat,
                  lng: activity.location!.lng,
                  name: activity.location!.name
                })}
                className="inline-flex items-center gap-1"
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontSize: 12,
                  color: 'var(--c-pen)',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px dashed var(--c-pen)',
                  paddingBottom: 1,
                  cursor: 'pointer',
                }}
              >
                <MapPin className="w-3 h-3" />
                Map
              </button>
            )}
          </div>

          {/* Built-in tip */}
          {activity.notes && (
            <aside
              style={{
                marginTop: 10,
                padding: '8px 10px',
                background: 'var(--c-creme)',
                borderLeft: '2px solid var(--c-ink-muted)',
                fontFamily: 'var(--c-font-body)',
                fontSize: 12,
                lineHeight: 1.5,
                color: 'var(--c-ink)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 9,
                  letterSpacing: '.22em',
                  textTransform: 'uppercase',
                  color: 'var(--c-ink-muted)',
                  marginRight: 6,
                }}
              >
                tip
              </span>
              {activity.notes}
            </aside>
          )}

          {/* User notes */}
          {activityNotes.length > 0 && (
            <div className="mt-2 space-y-2">
              {activityNotes.map((note) => (
                <div
                  key={note.id}
                  className="flex items-start gap-2"
                  style={{
                    padding: '8px 10px',
                    background: 'var(--c-creme)',
                    borderLeft: '2px solid var(--c-tape)',
                  }}
                >
                  <StickyNote className="w-3.5 h-3.5 mt-0.5" style={{ color: 'var(--c-ink-muted)', flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p
                      style={{
                        fontFamily: 'var(--c-font-body)',
                        fontSize: 13,
                        lineHeight: 1.5,
                        color: 'var(--c-ink)',
                        margin: 0,
                      }}
                    >
                      {note.content}
                    </p>
                    <span
                      style={{
                        fontFamily: 'var(--c-font-body)',
                        fontStyle: 'italic',
                        fontSize: 11,
                        color: 'var(--c-ink-muted)',
                      }}
                    >
                      {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteNote.mutate(note.id)}
                    style={{ color: 'var(--c-ink-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    aria-label="Delete note"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Note input */}
          {showNoteInput && (
            <div className="mt-3 space-y-2">
              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Add a note..."
                rows={2}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddNote} disabled={addNote.isPending}>
                  Save Note
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowNoteInput(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Photos — polaroid stack */}
          {activityPhotos.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {activityPhotos.map((photo, index) => {
                const pRot = ((index % 3) - 1) * 2;
                return (
                  <div key={photo.id} className="relative group">
                    <button
                      onClick={() => onOpenPhoto?.(activityPhotos, index)}
                      style={{
                        background: 'var(--c-paper)',
                        padding: 3,
                        boxShadow: 'var(--c-shadow-sm)',
                        border: 'none',
                        cursor: 'pointer',
                        transform: `rotate(${pRot}deg)`,
                        transition: 'transform var(--c-t-fast) var(--c-ease-out)',
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.transform = 'rotate(0deg) translateY(-2px)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.transform = `rotate(${pRot}deg)`; }}
                    >
                      <img
                        src={getPhotoUrl(photo.storage_path)}
                        alt={photo.caption || 'Trip photo'}
                        style={{ display: 'block', width: 64, height: 64, objectFit: 'cover' }}
                      />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePhoto.mutate({ photoId: photo.id, storagePath: photo.storage_path });
                      }}
                      className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        padding: 3,
                        background: 'var(--c-danger)',
                        color: 'var(--c-creme)',
                        borderRadius: 'var(--c-r-sm)',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action buttons — ink column */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => toggleFavorite.mutate({
              itemId: activity.id,
              itemType: activity.category,
              isFavorite: !isFavorite
            })}
            style={{
              padding: 6,
              background: 'transparent',
              border: 'none',
              color: isFavorite ? 'var(--c-tape)' : 'var(--c-ink-muted)',
              cursor: 'pointer',
            }}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={cn("w-4 h-4", isFavorite && "fill-current")} />
          </button>

          <button
            onClick={() => setShowNoteInput(!showNoteInput)}
            style={{
              padding: 6,
              background: 'transparent',
              border: 'none',
              color: 'var(--c-ink-muted)',
              cursor: 'pointer',
            }}
            aria-label="Add note"
          >
            <StickyNote className="w-4 h-4" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: 6,
              background: 'transparent',
              border: 'none',
              color: 'var(--c-ink-muted)',
              cursor: 'pointer',
            }}
            aria-label="Add photo"
          >
            <Camera className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoUpload}
          />

          {onEdit && (
            <button
              onClick={onEdit}
              style={{
                padding: 6,
                background: 'transparent',
                border: 'none',
                color: 'var(--c-ink-muted)',
                cursor: 'pointer',
              }}
              aria-label="Edit activity"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}

          {onHide && (
            <button
              onClick={onHide}
              style={{
                padding: 6,
                background: 'transparent',
                border: 'none',
                color: 'var(--c-ink-muted)',
                cursor: 'pointer',
              }}
              title="Hide this activity"
              aria-label="Hide activity"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          )}

          {isCustom && onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  style={{
                    padding: 6,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--c-danger)',
                    cursor: 'pointer',
                  }}
                  aria-label="Delete custom activity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Activity</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{activity.title}"? This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- DayCard ----

interface DayCardProps {
  day: Day;
  dayIndex?: number;
}

function DayCard({ day, dayIndex = 0 }: DayCardProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityType | null>(null);
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [editingBaseActivityId, setEditingBaseActivityId] = useState<string | null>(null);
  const [isEditingBaseActivity, setIsEditingBaseActivity] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoViewerPhotos, setPhotoViewerPhotos] = useState<Array<{ id: string; storage_path: string; caption?: string | null }>>([]);
  const [photoViewerIndex, setPhotoViewerIndex] = useState(0);

  const { data: customActivities } = useCustomActivities();
  const { data: activityOrder } = useActivityOrder();
  const { data: checklistItems } = useChecklistItems();
  const { data: activityOverrides } = useActivityOverrides();

  const updateActivityOrder = useUpdateActivityOrder();
  const deleteCustomActivity = useDeleteCustomActivity();
  const toggleActivityVisibility = useToggleActivityVisibility();

  // Create overrides map
  const overridesMap = (activityOverrides || []).reduce((acc, override) => {
    acc[override.activity_id] = override;
    return acc;
  }, {} as Record<string, typeof activityOverrides[0]>);

  // Get custom activities for this day
  const dayCustomActivities = (customActivities || [])
    .filter(a => a.day_id === day.id)
    .map(c => ({ ...customActivityToActivity(c), customId: c.id }));

  // Create order map
  const orderMap = (activityOrder || []).reduce((acc, order) => {
    acc[order.activity_id] = order;
    return acc;
  }, {} as Record<string, { order_index: number; is_hidden: boolean }>);

  // Combine base activities (with overrides applied) with custom ones
  const allActivities = [
    ...day.activities.map(a => ({
      ...applyOverride(a, overridesMap[a.id]),
      customId: undefined,
      isBaseActivity: true
    })),
    ...dayCustomActivities.map(a => ({ ...a, isBaseActivity: false }))
  ];

  // Filter hidden and sort by order
  const sortedActivities = allActivities
    .filter(a => !orderMap[a.id]?.is_hidden)
    .sort((a, b) => {
      const orderA = orderMap[a.id]?.order_index;
      const orderB = orderMap[b.id]?.order_index;

      if (orderA !== undefined && orderB !== undefined) {
        return orderA - orderB;
      }
      if (orderA !== undefined) return -1;
      if (orderB !== undefined) return 1;
      return 0;
    });

  // Group by session block for rendering
  const grouped = useMemo(() => {
    const map = new Map<BlockName, typeof sortedActivities>();
    BLOCKS.forEach(b => map.set(b.key, []));
    sortedActivities.forEach(a => {
      const key = timeToBlock(a.time);
      map.get(key)!.push(a);
    });
    return map;
  }, [sortedActivities]);

  // Count completed activities
  const completedCount = sortedActivities.filter(
    a => checklistItems?.[a.id]
  ).length;
  const totalCount = sortedActivities.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedActivities.findIndex(a => a.id === active.id);
      const newIndex = sortedActivities.findIndex(a => a.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(sortedActivities, oldIndex, newIndex);

        const orders = reordered.map((activity, index) => ({
          activity_id: activity.id,
          day_id: day.id,
          order_index: index
        }));

        updateActivityOrder.mutate(orders);
      }
    }
  }, [sortedActivities, day.id, updateActivityOrder]);

  const handleAddActivity = () => {
    setEditingActivity(null);
    setEditingCustomId(null);
    setEditingBaseActivityId(null);
    setIsEditingBaseActivity(false);
    setEditorOpen(true);
  };

  const handleEditActivity = (activity: ActivityType & { customId?: string; isBaseActivity?: boolean }) => {
    setEditingActivity(activity);

    if (activity.customId) {
      setEditingCustomId(activity.customId);
      setEditingBaseActivityId(null);
      setIsEditingBaseActivity(false);
    } else if (activity.isBaseActivity) {
      setEditingCustomId(null);
      setEditingBaseActivityId(activity.id);
      setIsEditingBaseActivity(true);
    }

    setEditorOpen(true);
  };

  const handleDeleteActivity = (customId: string) => {
    deleteCustomActivity.mutate(customId);
  };

  const handleHideActivity = (activityId: string) => {
    toggleActivityVisibility.mutate({
      activityId,
      dayId: day.id,
      isHidden: true
    });
  };

  const openMapModal = (location: SelectedLocation) => {
    setSelectedLocation(location);
    setMapModalOpen(true);
  };

  const openPhotoViewer = (photos: Array<{ id: string; storage_path: string; caption?: string | null }>, index: number) => {
    setPhotoViewerPhotos(photos);
    setPhotoViewerIndex(index);
    setPhotoViewerOpen(true);
  };

  const tapeRotate = ((dayIndex % 4) - 2) * 2;

  return (
    <>
      <div
        style={{
          position: 'relative',
          background: 'var(--c-paper)',
          boxShadow: 'var(--c-shadow)',
          padding: '24px 20px 20px',
          marginTop: 14,
        }}
      >
        <Tape position="top-left" rotate={tapeRotate} width={82} />

        {/* Day header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <Stamp variant="outline" size="sm" rotate={-2} style={{ marginBottom: 6 }}>
              {day.dayOfWeek}
            </Stamp>
            <h3
              style={{
                fontFamily: 'var(--c-font-body)',
                fontSize: 20,
                fontWeight: 500,
                lineHeight: 1.2,
                margin: '4px 0 2px',
                color: 'var(--c-ink)',
              }}
            >
              {day.title}
            </h3>
            <p
              style={{
                fontFamily: 'var(--c-font-body)',
                fontStyle: 'italic',
                fontSize: 13,
                color: 'var(--c-ink-muted)',
                margin: 0,
              }}
            >
              {day.date}
            </p>
          </div>
          <span
            style={{
              fontFamily: 'var(--c-font-display)',
              fontSize: 10,
              letterSpacing: '.2em',
              color: 'var(--c-ink-muted)',
              whiteSpace: 'nowrap',
            }}
          >
            {completedCount}/{totalCount}
          </span>
        </div>

        {totalCount > 0 && (
          <div
            style={{
              width: '100%',
              height: 2,
              background: 'var(--c-line)',
              marginTop: 12,
              marginBottom: 4,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                background: progressPercent === 100 ? 'var(--c-success)' : 'var(--c-pen)',
                width: `${progressPercent}%`,
                transition: 'width 0.5s cubic-bezier(0.22, 0.61, 0.36, 1)',
              }}
            />
          </div>
        )}

        {/* Session blocks */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedActivities.map(a => a.id)}
            strategy={verticalListSortingStrategy}
          >
            <div
              className="mt-5 grid gap-5 sm:gap-6"
              style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              }}
            >
              {BLOCKS.map(block => {
                const blockItems = grouped.get(block.key) ?? [];
                const hasAny = blockItems.length > 0;
                return (
                  <section
                    key={block.key}
                    style={{
                      opacity: hasAny ? 1 : 0.5,
                    }}
                  >
                    <div className="flex items-baseline justify-between mb-3 gap-2">
                      <span
                        style={{
                          fontFamily: 'var(--c-font-display)',
                          fontSize: 12,
                          letterSpacing: '.2em',
                          color: 'var(--c-ink)',
                        }}
                      >
                        {block.stamp}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--c-font-body)',
                          fontStyle: 'italic',
                          color: 'var(--c-ink-muted)',
                          fontSize: 11,
                        }}
                      >
                        {block.range}
                      </span>
                    </div>

                    {!hasAny ? (
                      <MarginNote rotate={-1} size={16} style={{ display: 'block' }}>
                        (nothing here)
                      </MarginNote>
                    ) : (
                      <div className="space-y-3">
                        {blockItems.map((activity, idx) => (
                          <div
                            key={activity.id}
                            style={{
                              paddingBottom: idx === blockItems.length - 1 ? 0 : 10,
                              borderBottom: idx === blockItems.length - 1 ? 'none' : '1px dashed var(--c-line)',
                            }}
                          >
                            <DraggableActivity id={activity.id}>
                              <ActivityCard
                                activity={activity}
                                isCustom={!!activity.customId}
                                cardIndex={idx}
                                onEdit={() => handleEditActivity(activity)}
                                onDelete={activity.customId ? () => handleDeleteActivity(activity.customId!) : undefined}
                                onHide={() => handleHideActivity(activity.id)}
                                onOpenMap={openMapModal}
                                onOpenPhoto={openPhotoViewer}
                              />
                            </DraggableActivity>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>

        {/* Add Activity — pen-blue dashed outline */}
        <button
          onClick={handleAddActivity}
          className="w-full mt-6 inline-flex items-center justify-center gap-2"
          style={{
            fontFamily: 'var(--c-font-display)',
            fontSize: 10,
            letterSpacing: '.24em',
            textTransform: 'uppercase',
            padding: '12px 16px',
            background: 'transparent',
            color: 'var(--c-pen)',
            border: '1.5px dashed var(--c-pen)',
            borderRadius: 'var(--c-r-sm)',
            cursor: 'pointer',
            transition: 'background var(--c-t-fast)',
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(31, 60, 198, .06)'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <Plus className="w-4 h-4" />
          Add Activity
        </button>
      </div>

      <ActivityEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        dayId={day.id}
        activity={editingActivity}
        customActivityId={editingCustomId}
        isBaseActivity={isEditingBaseActivity}
        baseActivityId={editingBaseActivityId}
        nextOrderIndex={sortedActivities.length}
      />

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

      <PhotoViewer
        photos={photoViewerPhotos}
        initialIndex={photoViewerIndex}
        open={photoViewerOpen}
        onOpenChange={setPhotoViewerOpen}
      />
    </>
  );
}

// ---- ItineraryTab ----

interface ItineraryTabProps {
  days: Day[];
}

export function ItineraryTab({ days }: ItineraryTabProps) {
  return (
    <div className="collage-root space-y-6 pb-20 px-4 sm:px-8 pt-6">
      <header className="text-center space-y-1">
        <Stamp variant="outline" size="sm" rotate={-2}>the trip · by day</Stamp>
        <h2
          style={{
            fontFamily: 'var(--c-font-body)',
            fontSize: 'clamp(22px, 3vw, 30px)',
            fontWeight: 500,
            color: 'var(--c-ink)',
            margin: '6px 0 0',
          }}
        >
          Your Trip Itinerary
        </h2>
        <p
          style={{
            fontFamily: 'var(--c-font-body)',
            fontStyle: 'italic',
            color: 'var(--c-ink-muted)',
            margin: 0,
          }}
        >
          July 25 — August 1, 2026
        </p>
        <MarginNote rotate={-2} size={18} style={{ display: 'inline-block', marginTop: 8 }}>
          drag to reorder · tap + to add
        </MarginNote>
      </header>

      {days.map((day, i) => (
        <DayCard key={day.id} day={day} dayIndex={i} />
      ))}
    </div>
  );
}
