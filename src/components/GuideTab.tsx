import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { 
  Waves, 
  Utensils, 
  Backpack, 
  Star, 
  ExternalLink, 
  Phone, 
  MapPin,
  StickyNote,
  Camera,
  X,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BEACHES, RESTAURANTS, PACKING_LIST } from '@/lib/itinerary-data';
import type { GuideItem, PackingItem } from '@/lib/itinerary-data';
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
  getPhotoUrl
} from '@/hooks/use-trip-data';
import { MapModal } from '@/components/map/MapModal';

interface SelectedLocation {
  lat: number;
  lng: number;
  name: string;
  address?: string;
}

interface GuideItemCardProps {
  item: GuideItem;
  onOpenMap?: (location: SelectedLocation) => void;
}

function GuideItemCard({ item, onOpenMap }: GuideItemCardProps) {
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
                  <p className="flex-1 text-sm">{note.content}</p>
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
              {itemPhotos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={getPhotoUrl(photo.storage_path)}
                    alt={photo.caption || 'Photo'}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => deletePhoto.mutate({ photoId: photo.id, storagePath: photo.storage_path })}
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
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>
      </div>
    </div>
  );
}

interface PackingItemRowProps {
  item: PackingItem;
}

function PackingItemRow({ item }: PackingItemRowProps) {
  const { data: checklistItems } = useChecklistItems();
  const toggleChecklist = useToggleChecklistItem();
  
  const isCompleted = checklistItems?.[item.id] ?? false;

  return (
    <label className="flex items-center gap-3 p-2 rounded hover:bg-secondary/30 cursor-pointer">
      <Checkbox
        checked={isCompleted}
        onCheckedChange={(checked) => 
          toggleChecklist.mutate({ itemId: item.id, isCompleted: !!checked })
        }
      />
      <span className={cn(
        "text-sm",
        isCompleted && "line-through text-muted-foreground"
      )}>
        {item.item}
      </span>
    </label>
  );
}

export function GuideTab() {
  const { data: checklistItems } = useChecklistItems();
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  
  // Group packing items by category
  const packingByCategory = PACKING_LIST.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PackingItem[]>);
  
  // Calculate packing progress
  const packedCount = PACKING_LIST.filter(item => checklistItems?.[item.id]).length;
  const totalItems = PACKING_LIST.length;

  const openMapModal = (location: SelectedLocation) => {
    setSelectedLocation(location);
    setMapModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="text-center py-4">
        <h2 className="font-display text-2xl text-foreground">Trip Guide</h2>
        <p className="text-muted-foreground">Everything you need to know</p>
      </div>
      
      <Accordion type="single" collapsible className="space-y-4">
        {/* Beaches */}
        <AccordionItem value="beaches" className="border rounded-lg shadow-warm overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-beach-seafoam flex items-center justify-center">
                <Waves className="w-5 h-5 text-beach-ocean-deep" />
              </div>
              <div className="text-left">
                <span className="font-semibold">Beaches</span>
                <p className="text-sm text-muted-foreground">{BEACHES.length} spots to explore</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-3">
            {BEACHES.map((beach) => (
              <GuideItemCard key={beach.id} item={beach} onOpenMap={openMapModal} />
            ))}
          </AccordionContent>
        </AccordionItem>
        
        {/* Restaurants */}
        <AccordionItem value="restaurants" className="border rounded-lg shadow-warm overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-beach-sunset-coral/20 flex items-center justify-center">
                <Utensils className="w-5 h-5 text-beach-sunset-coral" />
              </div>
              <div className="text-left">
                <span className="font-semibold">Restaurants</span>
                <p className="text-sm text-muted-foreground">{RESTAURANTS.length} places to eat</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-3">
            {RESTAURANTS.map((restaurant) => (
              <GuideItemCard key={restaurant.id} item={restaurant} onOpenMap={openMapModal} />
            ))}
          </AccordionContent>
        </AccordionItem>
        
        {/* Packing List */}
        <AccordionItem value="packing" className="border rounded-lg shadow-warm overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Backpack className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div className="text-left">
                <span className="font-semibold">Packing List</span>
                <p className="text-sm text-muted-foreground">{packedCount}/{totalItems} items packed</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              {Object.entries(packingByCategory).map(([category, items]) => (
                <div key={category}>
                  <h4 className="font-medium text-foreground mb-2">{category}</h4>
                  <div className="space-y-1">
                    {items.map((item) => (
                      <PackingItemRow key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
    </div>
  );
}
