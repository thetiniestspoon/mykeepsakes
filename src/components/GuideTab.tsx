import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Landmark,
  Utensils,
  Star,
  ExternalLink,
  Phone,
  MapPin,
  StickyNote,
  Camera,
  X,
  Trash2,
  Info,
  Heart,
  CalendarPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { CHICAGO_HIGHLIGHTS, RESTAURANTS, ACTIVITIES, EVENTS } from '@/lib/itinerary-data';
import type { GuideItem } from '@/lib/itinerary-data';
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
import { useActiveTrip, useTripDays } from '@/hooks/use-trip';
import { useCreateItem } from '@/hooks/use-itinerary';
import { useCreateLocation } from '@/hooks/use-locations';
import { MapModal } from '@/components/map/MapModal';
import { PhotoViewer } from '@/components/photos/PhotoViewer';
import type { ItemCategory } from '@/types/trip';
import '@/preview/collage/collage.css';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { Tape } from '@/preview/collage/ui/Tape';
import { MarginNote } from '@/preview/collage/ui/MarginNote';

/**
 * Guide tab — Collage direction (Curator's Folio).
 * Migrated 2026-04-23 (Phase 4 #8). Presentation only — all section ordering,
 * data sources (CHICAGO_HIGHLIGHTS / RESTAURANTS / ACTIVITIES / EVENTS),
 * accordion value IDs, favorite/note/photo mutations, and navigation helpers
 * preserved. Outer wrapper scopes tokens via className="collage-root"; each
 * section reads as a tape-accented paper card under a Rubik Mono One stamp,
 * with hairline rules between sections and Caveat asides in the margin.
 */

interface SelectedLocation {
  lat: number;
  lng: number;
  name: string;
  address?: string;
}

interface GuideItemCardProps {
  item: GuideItem;
  onOpenMap?: (location: SelectedLocation) => void;
  onOpenPhoto?: (photos: Array<{ id: string; storage_path: string; caption?: string | null }>, index: number) => void;
  onAddToDay?: (item: GuideItem, dayId: string) => void;
  days?: Array<{ id: string; date: string; title: string | null }>;
}

function GuideItemCard({ item, onOpenMap, onOpenPhoto, onAddToDay, days }: GuideItemCardProps) {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [dayPickerOpen, setDayPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: favorites } = useFavorites();
  const { data: notes } = useNotes();
  const { data: photos } = usePhotos();

  const toggleFavorite = useToggleFavorite();
  const addNote = useAddNote();
  const deleteNote = useDeleteNote();
  const uploadPhoto = useUploadPhoto();
  const deletePhoto = useDeletePhoto();

  const isFavorite = favorites?.[item.id] ?? false;
  const itemNotes = notes?.filter(n => n.item_id === item.id) ?? [];
  const itemPhotos = photos?.filter(p => p.item_id === item.id) ?? [];

  const handleAddNote = () => {
    if (noteContent.trim()) {
      addNote.mutate({ itemId: item.id, content: noteContent });
      setNoteContent('');
      setShowNoteInput(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadPhoto.mutate({ itemId: item.id, file });
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--c-paper)',
        boxShadow: 'var(--c-shadow-sm)',
        padding: '16px 18px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 16,
              fontWeight: 500,
              color: 'var(--c-ink)',
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {item.name}
          </h4>
          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 14,
              color: 'var(--c-ink-muted)',
              margin: '6px 0 0',
              lineHeight: 1.5,
            }}
          >
            {item.description}
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 12,
              marginTop: 12,
              fontSize: 13,
            }}
          >
            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  color: 'var(--c-pen)',
                  textDecoration: 'none',
                  fontFamily: 'var(--c-font-body)',
                  borderBottom: '1px dashed var(--c-pen)',
                  paddingBottom: 1,
                }}
              >
                <ExternalLink style={{ width: 12, height: 12 }} aria-hidden />
                Website
              </a>
            )}
            {item.phone && (
              <a
                href={`tel:${item.phone}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  color: 'var(--c-pen)',
                  textDecoration: 'none',
                  fontFamily: 'var(--c-font-body)',
                  borderBottom: '1px dashed var(--c-pen)',
                  paddingBottom: 1,
                }}
              >
                <Phone style={{ width: 12, height: 12 }} aria-hidden />
                {item.phone}
              </a>
            )}
            {item.location && onOpenMap && (
              <button
                onClick={() => onOpenMap({
                  lat: item.location!.lat,
                  lng: item.location!.lng,
                  name: item.name
                })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  color: 'var(--c-pen)',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: 'var(--c-font-body)',
                  fontSize: 13,
                  borderBottom: '1px dashed var(--c-pen)',
                  paddingBottom: 1,
                }}
              >
                <MapPin style={{ width: 12, height: 12 }} aria-hidden />
                Map
              </button>
            )}
          </div>

          {/* User notes */}
          {itemNotes.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {itemNotes.map((note) => (
                <div
                  key={note.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '8px 10px',
                    background: 'var(--c-paper)',
                    borderLeft: '3px solid var(--c-pen)',
                    boxShadow: 'var(--c-shadow-sm)',
                  }}
                >
                  <StickyNote
                    style={{
                      width: 14,
                      height: 14,
                      color: 'var(--c-ink-muted)',
                      marginTop: 2,
                      flexShrink: 0,
                    }}
                    aria-hidden
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontFamily: 'var(--c-font-body)',
                        fontSize: 14,
                        color: 'var(--c-ink)',
                        margin: 0,
                        lineHeight: 1.45,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {note.content}
                    </p>
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: 4,
                        fontFamily: 'var(--c-font-body)',
                        fontStyle: 'italic',
                        fontSize: 12,
                        color: 'var(--c-ink-muted)',
                      }}
                    >
                      {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteNote.mutate(note.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 2,
                      cursor: 'pointer',
                      color: 'var(--c-ink-muted)',
                    }}
                    aria-label="Delete note"
                  >
                    <X style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showNoteInput && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Add a note..."
                rows={2}
                style={{ fontFamily: 'var(--c-font-body)' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <Button size="sm" onClick={handleAddNote}>Save Note</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowNoteInput(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Photos — polaroid-stack affordance */}
          {itemPhotos.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {itemPhotos.map((photo, index) => {
                const rot = (index % 3) - 1; // -1, 0, 1 cycling
                return (
                  <div key={photo.id} style={{ position: 'relative' }}>
                    <button
                      onClick={() => onOpenPhoto?.(itemPhotos, index)}
                      style={{
                        background: 'var(--c-paper)',
                        padding: 3,
                        boxShadow: 'var(--c-shadow-sm)',
                        border: 'none',
                        cursor: 'pointer',
                        transform: `rotate(${rot * 2}deg)`,
                        transition: 'transform var(--c-t-fast) var(--c-ease-out)',
                      }}
                      aria-label={`Open photo ${index + 1}`}
                    >
                      <img
                        src={getPhotoUrl(photo.storage_path)}
                        alt={photo.caption || ''}
                        style={{
                          display: 'block',
                          width: 60,
                          height: 60,
                          objectFit: 'cover',
                        }}
                      />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePhoto.mutate({ photoId: photo.id, storagePath: photo.storage_path });
                      }}
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        padding: 3,
                        background: 'var(--c-danger)',
                        color: 'var(--c-creme)',
                        border: 'none',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        opacity: 0.9,
                      }}
                      aria-label="Delete photo"
                    >
                      <Trash2 style={{ width: 10, height: 10 }} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
          {onAddToDay && days && days.length > 0 && (
            <Popover open={dayPickerOpen} onOpenChange={setDayPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  style={{
                    padding: 6,
                    borderRadius: 999,
                    color: 'var(--c-ink-muted)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'color var(--c-t-fast) var(--c-ease-out)',
                  }}
                  title="Add to itinerary"
                  aria-label="Add to itinerary"
                >
                  <CalendarPlus style={{ width: 16, height: 16 }} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="end">
                <p
                  style={{
                    fontFamily: 'var(--c-font-display)',
                    fontSize: 10,
                    letterSpacing: '.22em',
                    textTransform: 'uppercase',
                    color: 'var(--c-ink-muted)',
                    padding: '0 8px 8px',
                    margin: 0,
                  }}
                >
                  Add to day
                </p>
                {days.map((day) => (
                  <button
                    key={day.id}
                    onClick={() => {
                      onAddToDay(item, day.id);
                      setDayPickerOpen(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px',
                      fontFamily: 'var(--c-font-body)',
                      fontSize: 14,
                      color: 'var(--c-ink)',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 'var(--c-r-sm)',
                      cursor: 'pointer',
                    }}
                  >
                    {day.title || day.date}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          )}
          <button
            onClick={() => toggleFavorite.mutate({
              itemId: item.id,
              itemType: item.category,
              isFavorite: !isFavorite
            })}
            style={{
              padding: 6,
              borderRadius: 999,
              color: isFavorite ? 'var(--c-ink)' : 'var(--c-ink-muted)',
              background: isFavorite ? 'var(--c-tape)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all var(--c-t-fast) var(--c-ease-out)',
            }}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star
              className={cn(isFavorite && 'fill-current')}
              style={{ width: 16, height: 16 }}
            />
          </button>
          <button
            onClick={() => setShowNoteInput(!showNoteInput)}
            style={{
              padding: 6,
              borderRadius: 999,
              color: 'var(--c-ink-muted)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label="Add note"
          >
            <StickyNote style={{ width: 16, height: 16 }} />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: 6,
              borderRadius: 999,
              color: 'var(--c-ink-muted)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label="Add photo"
          >
            <Camera style={{ width: 16, height: 16 }} />
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
    </div>
  );
}

// Map guide category to itinerary category
function guideToItemCategory(guideCategory: GuideItem['category']): ItemCategory {
  switch (guideCategory) {
    case 'restaurant': return 'dining';
    case 'attraction':
    case 'cultural':
    case 'activity': return 'activity';
    case 'essential': return 'activity';
    case 'transport': return 'transport';
    default: return 'activity';
  }
}

/**
 * One folio section. Stamped header, paper-card content, tape accent, inline
 * MarginNote aside. Preserves the accordion value/expand-collapse contract
 * through the shadcn AccordionItem primitive.
 */
function FolioSection({
  value,
  stampLabel,
  title,
  subtitle,
  marginNote,
  tapePosition,
  tapeRotate,
  icon,
  children,
}: {
  value: string;
  stampLabel: string;
  title: string;
  subtitle: string;
  marginNote: string;
  tapePosition: 'top-left' | 'top-right';
  tapeRotate: number;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <AccordionItem
      value={value}
      className="border-0"
      style={{
        position: 'relative',
        background: 'var(--c-paper)',
        boxShadow: 'var(--c-shadow)',
        marginTop: 18, // room for tape overhang
      }}
    >
      <Tape position={tapePosition} rotate={tapeRotate} width={82} />

      <AccordionTrigger
        className="hover:no-underline"
        style={{
          padding: '20px 22px 18px',
          fontFamily: 'var(--c-font-body)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left' }}>
          <div
            aria-hidden
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              background: 'var(--c-creme)',
              border: '1.5px solid var(--c-ink)',
              color: 'var(--c-ink)',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ marginBottom: 4 }}>
              <Stamp variant="ink" size="sm" rotate={-1}>{stampLabel}</Stamp>
            </div>
            <div
              style={{
                fontFamily: 'var(--c-font-body)',
                fontSize: 17,
                fontWeight: 500,
                color: 'var(--c-ink)',
                lineHeight: 1.2,
              }}
            >
              {title}
            </div>
            <p
              style={{
                fontFamily: 'var(--c-font-body)',
                fontStyle: 'italic',
                fontSize: 13,
                color: 'var(--c-ink-muted)',
                margin: '4px 0 0',
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent style={{ padding: '0 22px 22px' }}>
        <div style={{ borderTop: '1px dashed var(--c-line)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
          <MarginNote
            rotate={-3}
            size={19}
            style={{ position: 'absolute', top: -12, right: 4, background: 'var(--c-paper)', padding: '0 6px' }}
          >
            {marginNote}
          </MarginNote>
          {children}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function GuideTab() {
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoViewerPhotos, setPhotoViewerPhotos] = useState<Array<{ id: string; storage_path: string; caption?: string | null }>>([]);
  const [photoViewerIndex, setPhotoViewerIndex] = useState(0);

  const { data: trip } = useActiveTrip();
  const { data: days = [] } = useTripDays(trip?.id);
  const createItem = useCreateItem();
  const createLocation = useCreateLocation();

  const openMapModal = (location: SelectedLocation) => {
    setSelectedLocation(location);
    setMapModalOpen(true);
  };

  const openPhotoViewer = (photos: Array<{ id: string; storage_path: string; caption?: string | null }>, index: number) => {
    setPhotoViewerPhotos(photos);
    setPhotoViewerIndex(index);
    setPhotoViewerOpen(true);
  };

  const handleAddToDay = async (guideItem: GuideItem, dayId: string) => {
    if (!trip?.id) return;

    let locationId: string | null = null;

    // Create a location if the guide item has coordinates
    if (guideItem.location) {
      try {
        const loc = await createLocation.mutateAsync({
          trip_id: trip.id,
          name: guideItem.location.name,
          category: guideToItemCategory(guideItem.category),
          address: guideItem.location.address || null,
          lat: guideItem.location.lat,
          lng: guideItem.location.lng,
          phone: guideItem.phone || null,
          url: guideItem.link || null,
          notes: null,
          visited_at: null,
        });
        locationId = loc.id;
      } catch {
        // Location may already exist — continue without it
      }
    }

    createItem.mutate({
      trip_id: trip.id,
      day_id: dayId,
      title: guideItem.name,
      description: guideItem.description,
      start_time: null,
      end_time: null,
      category: guideToItemCategory(guideItem.category),
      item_type: 'activity',
      location_id: locationId,
      source: 'manual',
      external_ref: guideItem.id,
      sort_index: 99,
      status: 'planned',
      completed_at: null,
      link: guideItem.link || null,
      link_label: null,
      phone: guideItem.phone || null,
      notes: null,
      tags: null,
      speaker: null,
      track: null,
    });
  };

  return (
    <div
      className="collage-root"
      style={{
        paddingBottom: 80,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {/* Header — Curator's Folio */}
      <header
        style={{
          position: 'relative',
          textAlign: 'center',
          paddingTop: 28,
          paddingBottom: 12,
        }}
      >
        <div style={{ display: 'inline-block', marginBottom: 10 }}>
          <Stamp variant="outline" size="sm" rotate={-3}>curator's folio</Stamp>
        </div>
        <h2
          style={{
            fontFamily: 'var(--c-font-display)',
            fontSize: 'clamp(28px, 6vw, 44px)',
            letterSpacing: '.02em',
            lineHeight: 0.95,
            margin: 0,
            color: 'var(--c-ink)',
          }}
        >
          TRIP GUIDE
        </h2>
        <p
          style={{
            fontFamily: 'var(--c-font-body)',
            fontStyle: 'italic',
            fontSize: 15,
            color: 'var(--c-ink-muted)',
            margin: '10px auto 0',
            maxWidth: '40ch',
          }}
        >
          Everything you need to know — pinned, stamped, within reach.
        </p>
      </header>

      {/* Hairline rule under the masthead */}
      <div
        aria-hidden
        style={{
          borderTop: '2px dashed var(--c-ink)',
          width: '100%',
        }}
      />

      <Accordion
        type="single"
        collapsible
        style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
      >
        {/* Getting Around & Essentials */}
        <FolioSection
          value="essentials"
          stampLabel="essentials"
          title="Getting Around & Essentials"
          subtitle="Transport, weather, pharmacy"
          marginNote="before you set out"
          tapePosition="top-left"
          tapeRotate={-5}
          icon={<Info style={{ width: 20, height: 20 }} />}
        >
          {ACTIVITIES.map((item) => (
            <GuideItemCard
              key={item.id}
              item={item}
              onOpenMap={openMapModal}
              onOpenPhoto={openPhotoViewer}
              onAddToDay={handleAddToDay}
              days={days}
            />
          ))}
        </FolioSection>

        {/* Dining Near Hotel */}
        <FolioSection
          value="restaurants"
          stampLabel="dining"
          title="Dining Near Hotel"
          subtitle={`${RESTAURANTS.length} places to eat`}
          marginNote="hungry? look here"
          tapePosition="top-right"
          tapeRotate={4}
          icon={<Utensils style={{ width: 20, height: 20 }} />}
        >
          {RESTAURANTS.map((restaurant) => (
            <GuideItemCard
              key={restaurant.id}
              item={restaurant}
              onOpenMap={openMapModal}
              onOpenPhoto={openPhotoViewer}
              onAddToDay={handleAddToDay}
              days={days}
            />
          ))}
        </FolioSection>

        {/* Chicago Highlights */}
        <FolioSection
          value="highlights"
          stampLabel="highlights"
          title="Chicago Highlights"
          subtitle={`${CHICAGO_HIGHLIGHTS.length} must-see attractions`}
          marginNote="the city, abridged"
          tapePosition="top-left"
          tapeRotate={-4}
          icon={<Landmark style={{ width: 20, height: 20 }} />}
        >
          {CHICAGO_HIGHLIGHTS.map((item) => (
            <GuideItemCard
              key={item.id}
              item={item}
              onOpenMap={openMapModal}
              onOpenPhoto={openPhotoViewer}
              onAddToDay={handleAddToDay}
              days={days}
            />
          ))}
        </FolioSection>

        {/* Cultural Sites */}
        <FolioSection
          value="cultural"
          stampLabel="cultural"
          title="Cultural Sites"
          subtitle="Relevant to Sankofa's mission"
          marginNote="sit with these"
          tapePosition="top-right"
          tapeRotate={5}
          icon={<Heart style={{ width: 20, height: 20 }} />}
        >
          {EVENTS.map((item) => (
            <GuideItemCard
              key={item.id}
              item={item}
              onOpenMap={openMapModal}
              onOpenPhoto={openPhotoViewer}
              onAddToDay={handleAddToDay}
              days={days}
            />
          ))}
        </FolioSection>
      </Accordion>

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
    </div>
  );
}

export default GuideTab;
