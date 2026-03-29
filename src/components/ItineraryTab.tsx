import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
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
  ChevronDown, 
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
  useCollapsedSections,
  useToggleSection,
  getPhotoUrl
} from '@/hooks/use-trip-data';
import {
  useCustomActivities,
  useActivityOrder,
  useUpdateActivityOrder,
  useDeleteCustomActivity,
  useToggleActivityVisibility,
  customActivityToActivity,
  CustomActivity
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

const categoryColors: Record<string, string> = {
  activity: 'bg-beach-ocean-light text-beach-ocean-deep',
  dining: 'bg-beach-sunset-coral/20 text-beach-sunset-coral',
  beach: 'bg-beach-seafoam text-beach-ocean-deep',
  accommodation: 'bg-secondary text-secondary-foreground',
  transport: 'bg-muted text-muted-foreground',
  event: 'bg-beach-sunset-gold/20 text-beach-sunset-gold',
};

interface ActivityCardProps {
  activity: ActivityType;
  isCustom?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onHide?: () => void;
  onOpenMap?: (location: SelectedLocation) => void;
  onOpenPhoto?: (photos: Array<{ id: string; storage_path: string; caption?: string | null }>, index: number) => void;
}

function ActivityCard({ activity, isCustom, onEdit, onDelete, onHide, onOpenMap, onOpenPhoto }: ActivityCardProps) {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteContent, setNoteContent] = useState('');
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
    <div className={cn(
      "relative p-4 rounded-lg border border-border bg-card transition-all",
      isCompleted && "opacity-60"
    )}>
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
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
              categoryColors[activity.category]
            )}>
              <Icon className="w-3 h-3" />
              {activity.category}
            </span>
            {activity.time && (
              <span className="text-sm text-muted-foreground">{activity.time}</span>
            )}
            {isCustom && (
              <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                Custom
              </span>
            )}
          </div>
          
          <h4 className={cn(
            "font-semibold text-foreground",
            isCompleted && "line-through"
          )}>
            {activity.title}
          </h4>
          
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            {activity.description}
          </p>
          
          {/* Links and actions */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {activity.link && (
              <a
                href={activity.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                {activity.linkLabel || 'View'}
              </a>
            )}
            
            {activity.phone && (
              <a
                href={`tel:${activity.phone}`}
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
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
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
              >
                <MapPin className="w-3 h-3" />
                Map
              </button>
            )}
          </div>
          
          {/* Notes from original data */}
          {activity.notes && (
            <div className="mt-3 p-2 bg-secondary/50 rounded text-sm text-secondary-foreground">
              <strong>Tip:</strong> {activity.notes}
            </div>
          )}
          
          {/* User notes */}
          {activityNotes.length > 0 && (
            <div className="mt-3 space-y-2">
              {activityNotes.map((note) => (
                <div key={note.id} className="flex items-start gap-2 p-2 bg-beach-sand/30 rounded">
                  <StickyNote className="w-4 h-4 text-beach-driftwood mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm">{note.content}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteNote.mutate(note.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
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
          
          {/* Photos */}
          {activityPhotos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {activityPhotos.map((photo, index) => (
                <div key={photo.id} className="relative group">
                  <button
                    onClick={() => onOpenPhoto?.(activityPhotos, index)}
                    className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
                  >
                    <img
                      src={getPhotoUrl(photo.storage_path)}
                      alt={photo.caption || 'Trip photo'}
                      className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePhoto.mutate({ photoId: photo.id, storagePath: photo.storage_path });
                    }}
                    className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => toggleFavorite.mutate({ 
              itemId: activity.id, 
              itemType: activity.category,
              isFavorite: !isFavorite 
            })}
            className={cn(
              "p-1.5 rounded-full transition-colors",
              isFavorite 
                ? "text-beach-sunset-gold bg-beach-sunset-gold/20" 
                : "text-muted-foreground hover:text-beach-sunset-gold"
            )}
          >
            <Star className={cn("w-4 h-4", isFavorite && "fill-current")} />
          </button>
          
          <button
            onClick={() => setShowNoteInput(!showNoteInput)}
            className="p-1.5 rounded-full text-muted-foreground hover:text-accent transition-colors"
          >
            <StickyNote className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-full text-muted-foreground hover:text-accent transition-colors"
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

          {/* Edit button for all activities */}
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1.5 rounded-full text-muted-foreground hover:text-accent transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}

          {/* Hide activity */}
          {onHide && (
            <button
              onClick={onHide}
              className="p-1.5 rounded-full text-muted-foreground hover:text-destructive transition-colors"
              title="Hide this activity"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          )}

          {isCustom && onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="p-1.5 rounded-full text-muted-foreground hover:text-destructive transition-colors">
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

interface DayCardProps {
  day: Day;
}

function DayCard({ day }: DayCardProps) {
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

  const { data: collapsedSections } = useCollapsedSections();
  const { data: customActivities } = useCustomActivities();
  const { data: activityOrder } = useActivityOrder();
  const { data: checklistItems } = useChecklistItems();
  const { data: activityOverrides } = useActivityOverrides();

  const toggleSection = useToggleSection();
  const updateActivityOrder = useUpdateActivityOrder();
  const deleteCustomActivity = useDeleteCustomActivity();
  const toggleActivityVisibility = useToggleActivityVisibility();
  
  // Create overrides map
  const overridesMap = (activityOverrides || []).reduce((acc, override) => {
    acc[override.activity_id] = override;
    return acc;
  }, {} as Record<string, typeof activityOverrides[0]>);
  
  const isCollapsed = collapsedSections?.[day.id] ?? false;

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
      
      // If both have order, use it
      if (orderA !== undefined && orderB !== undefined) {
        return orderA - orderB;
      }
      // If only one has order, prioritize it
      if (orderA !== undefined) return -1;
      if (orderB !== undefined) return 1;
      // Otherwise, maintain original order
      return 0;
    });

  // Count completed activities
  const completedCount = sortedActivities.filter(
    a => checklistItems?.[a.id]
  ).length;
  const totalCount = sortedActivities.length;

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
        
        // Save new order to database
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
      // Editing a custom activity
      setEditingCustomId(activity.customId);
      setEditingBaseActivityId(null);
      setIsEditingBaseActivity(false);
    } else if (activity.isBaseActivity) {
      // Editing a base activity (will save to overrides)
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
  
  return (
    <>
      <Collapsible
        open={!isCollapsed}
        onOpenChange={(open) => toggleSection.mutate({ sectionId: day.id, isCollapsed: !open })}
      >
        <Card className="shadow-warm overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-secondary/30 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display text-xl">{day.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {day.dayOfWeek}, {day.date}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {completedCount}/{totalCount}
                  </span>
                  <ChevronDown className={cn(
                    "w-5 h-5 text-muted-foreground transition-transform",
                    !isCollapsed && "rotate-180"
                  )} />
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="space-y-3 pt-0">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortedActivities.map(a => a.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {sortedActivities.map((activity) => (
                    <DraggableActivity key={activity.id} id={activity.id}>
                      <ActivityCard 
                        activity={activity}
                        isCustom={!!activity.customId}
                        onEdit={() => handleEditActivity(activity)}
                        onDelete={activity.customId ? () => handleDeleteActivity(activity.customId!) : undefined}
                        onHide={() => handleHideActivity(activity.id)}
                        onOpenMap={openMapModal}
                        onOpenPhoto={openPhotoViewer}
                      />
                    </DraggableActivity>
                  ))}
                </SortableContext>
              </DndContext>

              {/* Add Activity Button */}
              <Button
                variant="outline"
                className="w-full border-dashed"
                onClick={handleAddActivity}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Activity
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

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

      {/* Map Modal */}
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

      {/* Photo Viewer */}
      <PhotoViewer
        photos={photoViewerPhotos}
        initialIndex={photoViewerIndex}
        open={photoViewerOpen}
        onOpenChange={setPhotoViewerOpen}
      />
    </>
  );
}

interface ItineraryTabProps {
  days: Day[];
}

export function ItineraryTab({ days }: ItineraryTabProps) {
  return (
    <div className="space-y-4 pb-20">
      <div className="text-center py-4">
        <h2 className="font-display text-2xl text-foreground">Your Trip Itinerary</h2>
        <p className="text-muted-foreground">July 25 - August 1, 2026</p>
        <p className="text-xs text-muted-foreground mt-1">
          Drag activities to reorder • Tap + to add custom activities
        </p>
      </div>
      
      {days.map((day) => (
        <DayCard key={day.id} day={day} />
      ))}
    </div>
  );
}
