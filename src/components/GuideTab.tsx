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
  Heart
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
import { MapModal } from '@/components/map/MapModal';
import { PhotoViewer } from '@/components/photos/PhotoViewer';

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
}

function GuideItemCard({ item, onOpenMap, onOpenPhoto }: GuideItemCardProps) {
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
    <div className="p-4 rounded-lg border border-border bg-card">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">{item.name}</h4>
          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
          
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Website
              </a>
            )}
            {item.phone && (
              <a
                href={`tel:${item.phone}`}
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
              >
                <Phone className="w-3 h-3" />
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
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
              >
                <MapPin className="w-3 h-3" />
                Map
              </button>
            )}
          </div>
          
          {/* User notes */}
          {itemNotes.length > 0 && (
            <div className="mt-3 space-y-2">
              {itemNotes.map((note) => (
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
          
          {showNoteInput && (
            <div className="mt-3 space-y-2">
              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Add a note..."
                rows={2}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddNote}>Save Note</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowNoteInput(false)}>Cancel</Button>
              </div>
            </div>
          )}
          
          {/* Photos */}
          {itemPhotos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {itemPhotos.map((photo, index) => (
                <div key={photo.id} className="relative group">
                  <button
                    onClick={() => onOpenPhoto?.(itemPhotos, index)}
                    className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
                  >
                    <img
                      src={getPhotoUrl(photo.storage_path)}
                      alt={photo.caption || 'Photo'}
                      className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
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
        
        <div className="flex flex-col gap-1">
          <button
            onClick={() => toggleFavorite.mutate({ 
              itemId: item.id, 
              itemType: item.category,
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
        </div>
      </div>
    </div>
  );
}

export function GuideTab() {
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoViewerPhotos, setPhotoViewerPhotos] = useState<Array<{ id: string; storage_path: string; caption?: string | null }>>([]);
  const [photoViewerIndex, setPhotoViewerIndex] = useState(0);

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
    <div className="space-y-6 pb-20">
      <div className="text-center py-4">
        <h2 className="font-display text-2xl text-foreground">Trip Guide</h2>
        <p className="text-muted-foreground">Everything you need to know</p>
      </div>
      
      <Accordion type="single" collapsible className="space-y-4">
        {/* Getting Around & Essentials */}
        <AccordionItem value="essentials" className="border rounded-lg shadow-warm overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <span className="font-semibold">Getting Around & Essentials</span>
                <p className="text-sm text-muted-foreground">Transport, weather, pharmacy</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-3">
            {ACTIVITIES.map((item) => (
              <GuideItemCard key={item.id} item={item} onOpenMap={openMapModal} onOpenPhoto={openPhotoViewer} />
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* Dining Near Hotel */}
        <AccordionItem value="restaurants" className="border rounded-lg shadow-warm overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Utensils className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-left">
                <span className="font-semibold">Dining Near Hotel</span>
                <p className="text-sm text-muted-foreground">{RESTAURANTS.length} places to eat</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-3">
            {RESTAURANTS.map((restaurant) => (
              <GuideItemCard key={restaurant.id} item={restaurant} onOpenMap={openMapModal} onOpenPhoto={openPhotoViewer} />
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* Chicago Highlights */}
        <AccordionItem value="highlights" className="border rounded-lg shadow-warm overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Landmark className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-left">
                <span className="font-semibold">Chicago Highlights</span>
                <p className="text-sm text-muted-foreground">{CHICAGO_HIGHLIGHTS.length} must-see attractions</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-3">
            {CHICAGO_HIGHLIGHTS.map((item) => (
              <GuideItemCard key={item.id} item={item} onOpenMap={openMapModal} onOpenPhoto={openPhotoViewer} />
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* Cultural Sites */}
        <AccordionItem value="cultural" className="border rounded-lg shadow-warm overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Heart className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <span className="font-semibold">Cultural Sites</span>
                <p className="text-sm text-muted-foreground">Relevant to Sankofa's mission</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-3">
            {EVENTS.map((item) => (
              <GuideItemCard key={item.id} item={item} onOpenMap={openMapModal} onOpenPhoto={openPhotoViewer} />
            ))}
          </AccordionContent>
        </AccordionItem>
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
    </div>
  );
}

export default GuideTab;
