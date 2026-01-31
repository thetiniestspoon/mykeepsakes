import { useState, useRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { 
  useFavorites,
  useToggleFavorite,
  useNotes,
  useAddNote,
  useDeleteNote,
  usePhotos,
  useUploadPhoto,
  useDeletePhoto,
  getPhotoUrl
} from '@/hooks/use-trip-data';
import { useUpdateItemStatus } from '@/hooks/use-database-itinerary';
import type { LegacyActivity } from '@/hooks/use-database-itinerary';
import type { ItemStatus } from '@/types/trip';

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

interface DatabaseActivityCardProps {
  activity: LegacyActivity;
  onOpenMap?: (location: SelectedLocation) => void;
  onOpenPhoto?: (photos: Array<{ id: string; storage_path: string; caption?: string | null }>, index: number) => void;
}

export function DatabaseActivityCard({ activity, onOpenMap, onOpenPhoto }: DatabaseActivityCardProps) {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: favorites } = useFavorites();
  const { data: notes } = useNotes();
  const { data: photos } = usePhotos();
  
  const toggleFavorite = useToggleFavorite();
  const addNote = useAddNote();
  const deleteNote = useDeleteNote();
  const uploadPhoto = useUploadPhoto();
  const deletePhoto = useDeletePhoto();
  const updateStatus = useUpdateItemStatus();
  
  const isCompleted = activity.status === 'done';
  const isFavorite = favorites?.[activity.id] ?? false;
  const activityNotes = notes?.filter(n => n.item_id === activity.id) ?? [];
  const activityPhotos = photos?.filter(p => p.item_id === activity.id) ?? [];
  
  const Icon = categoryIcons[activity.category] || Activity;
  
  const handleToggleComplete = () => {
    const newStatus: ItemStatus = isCompleted ? 'planned' : 'done';
    updateStatus.mutate({ itemId: activity.id, status: newStatus });
  };
  
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
      isCompleted && "opacity-60 bg-muted/30"
    )}>
      {/* Header row */}
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleToggleComplete}
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
            {isCompleted && (
              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="w-3 h-3" />
                Done
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
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>
      </div>
    </div>
  );
}
