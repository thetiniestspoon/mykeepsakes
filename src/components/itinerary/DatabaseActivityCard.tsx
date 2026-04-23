import { useState, useRef } from 'react';
import { AnimatedCheckbox } from '@/components/ui/animated-checkbox';
import { FavoriteHeart } from '@/components/ui/favorite-heart';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
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
  CheckCircle2,
  GripVertical,
  Ticket
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
import '@/preview/collage/collage.css';
import { MarginNote } from '@/preview/collage/ui/MarginNote';

/**
 * Activity card — migrated to Collage direction (Phase 4 #2 core, W3.3a).
 * Presentation only — hooks / mutations / drag-handle wiring unchanged.
 *
 * Paper-chip aesthetic: each card is a sharp-cornered paper tile carrying a
 * ±2° rotation cycle based on index (passed via CSS custom property
 * --card-rotation by the parent). Hover straightens + lifts; drag state keeps
 * the chip upright and elevated. Ink body, pen-blue accents, Caveat MarginNote
 * for time-of-day whisper on the next-activity card.
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

interface DatabaseActivityCardProps {
  activity: LegacyActivity;
  onOpenMap?: (location: SelectedLocation) => void;
  onOpenPhoto?: (photos: Array<{ id: string; storage_path: string; caption?: string | null }>, index: number) => void;
  isNextActivity?: boolean;
  onSelect?: () => void;  // For tap to open details
  previewTime?: string | null;  // Live time during drag
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  /** Index within day list; drives ±2° paper-chip rotation. */
  cardIndex?: number;
}

export function DatabaseActivityCard({
  activity,
  onOpenMap,
  onOpenPhoto,
  isNextActivity,
  onSelect,
  previewTime,
  isDragging,
  dragHandleProps,
  cardIndex = 0,
}: DatabaseActivityCardProps) {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [isHovering, setIsHovering] = useState(false);
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

  // ±2° rotation cycle: index % 3 maps to [-1, 0, 1] × 2° = [-2°, 0°, 2°].
  // Hover straightens to 0°; drag pins to 0° too.
  const restRotation = ((cardIndex % 3) - 1) * 2;
  const appliedRotation = isHovering || isDragging ? 0 : restRotation;

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
    <div
      className="collage-root"
      data-activity-id={activity.id}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        position: 'relative',
        background: 'var(--c-paper)',
        boxShadow: isHovering || isDragging ? 'var(--c-shadow)' : 'var(--c-shadow-sm)',
        padding: '14px 14px 12px',
        // Sharp paper corners — no rounded-xl per DESIGN-SYSTEM.
        borderRadius: 'var(--c-r-sm)',
        transform: `rotate(${appliedRotation}deg) ${isHovering && !isDragging ? 'translateY(-2px)' : ''}`,
        transition: 'transform var(--c-t-fast) var(--c-ease-out), box-shadow var(--c-t-fast) var(--c-ease-out)',
        opacity: isCompleted ? 0.7 : 1,
        // Next-activity marker — pen-blue rule rail down the left edge.
        borderLeft: isNextActivity
          ? '3px solid var(--c-pen)'
          : activity.isChosen && !isCompleted
            ? '3px solid var(--c-tape)'
            : '3px solid transparent',
      }}
    >
      {/* Header row */}
      <div className="flex items-start gap-2">
        {/* Drag handle — ink, then pen-blue while dragging. */}
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className={cn(
              "flex-shrink-0 w-6 self-stretch flex items-center justify-center -ml-1",
              "cursor-grab active:cursor-grabbing touch-none",
              "transition-colors"
            )}
            style={{
              color: isDragging ? 'var(--c-pen)' : 'var(--c-ink-muted)',
            }}
            aria-label="Drag to reorder"
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        <AnimatedCheckbox
          checked={isCompleted}
          onCheckedChange={handleToggleComplete}
          className="mt-1"
        />

        {/* Clickable time/title region for opening details */}
        <div
          onClick={onSelect}
          className={cn(
            "flex-1 min-w-0",
            onSelect && "cursor-pointer"
          )}
          style={{
            // Hairline underline on hover — no muted bg pill.
            transition: 'opacity var(--c-t-fast)',
          }}
        >
          {/* Registered chip on its own line so narrow screens don't wrap it */}
          {activity.isChosen && (
            <div className="mb-1">
              <span
                className="inline-flex items-center gap-1"
                style={{
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 9,
                  letterSpacing: '.2em',
                  textTransform: 'uppercase',
                  color: 'var(--c-pen)',
                  opacity: isCompleted ? 0.7 : 1,
                }}
              >
                <Ticket className="w-3 h-3 fill-current" aria-hidden="true" />
                Registered
              </span>
            </div>
          )}

          {/* Meta row: category + time + Done */}
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
              <Icon className="w-3 h-3" aria-hidden="true" />
              {activity.category}
            </span>
            {(previewTime || activity.time) && (
              <span
                style={{
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 9,
                  letterSpacing: '.18em',
                  color: previewTime ? 'var(--c-pen)' : 'var(--c-ink-muted)',
                  fontWeight: previewTime ? 500 : 400,
                }}
                className={cn(isDragging && previewTime && "animate-pulse")}
              >
                {previewTime || activity.time}
              </span>
            )}
            {isCompleted && (
              <span
                className="inline-flex items-center gap-1"
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontStyle: 'italic',
                  fontSize: 12,
                  color: 'var(--c-success)',
                }}
              >
                <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                done
              </span>
            )}
            {isNextActivity && !isCompleted && (
              <MarginNote rotate={-3} size={16} color="pen">
                up next
              </MarginNote>
            )}
          </div>

          <h4
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 16,
              fontWeight: 500,
              lineHeight: 1.3,
              color: isCompleted ? 'var(--c-ink-muted)' : 'var(--c-ink)',
              textDecoration: isCompleted ? 'line-through' : 'none',
              margin: 0,
            }}
          >
            {activity.title}
          </h4>

          {activity.description && (
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
          )}

          {/* Links and actions */}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {activity.link && (
              <a
                href={activity.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
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
                onClick={e => e.stopPropagation()}
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
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenMap({
                    lat: activity.location!.lat,
                    lng: activity.location!.lng,
                    name: activity.location!.name
                  });
                }}
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
                aria-label="Show on map"
              >
                <MapPin className="w-3 h-3" />
                Map
              </button>
            )}
          </div>

          {/* Tip note from original data — index-card aesthetic */}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote.mutate(note.id);
                    }}
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
            <div className="mt-2 space-y-2" onClick={e => e.stopPropagation()}>
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

          {/* Photos — polaroid-stack strip */}
          {activityPhotos.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {activityPhotos.map((photo, index) => {
                const pRot = ((index % 3) - 1) * 2;
                return (
                  <div key={photo.id} className="relative group" onClick={e => e.stopPropagation()}>
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
                      aria-label="Delete photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action buttons — ink column, no ghost bubbles */}
        <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
          <FavoriteHeart
            isFavorite={isFavorite}
            onToggle={() => toggleFavorite.mutate({
              itemId: activity.id,
              itemType: activity.category,
              isFavorite: !isFavorite
            })}
            size="sm"
          />

          <button
            onClick={() => setShowNoteInput(!showNoteInput)}
            style={{
              padding: 6,
              background: 'transparent',
              border: 'none',
              color: 'var(--c-ink-muted)',
              cursor: 'pointer',
              transition: 'color var(--c-t-fast)',
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = 'var(--c-pen)'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = 'var(--c-ink-muted)'; }}
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
              transition: 'color var(--c-t-fast)',
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = 'var(--c-pen)'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = 'var(--c-ink-muted)'; }}
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
        </div>
      </div>

      {/* Reduced-motion: flatten the tilt + lift animations */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          [data-activity-id="${activity.id}"] {
            transform: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
