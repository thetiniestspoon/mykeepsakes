

# Details Panel Redesign: Icon Actions + Content Sections

## Overview

Redesign the `ActivityDetail` component to have:
1. **Compact icon-only action buttons** in a consistent order
2. **Clear content sections** for description, contact info, and website
3. **Photo accordion** showing memories linked to this location

---

## Current State

The `ActivityDetail.tsx` component currently has:
- Full-width text buttons ("Mark Complete", "Add Memory")
- Scattered cards for phone, link, notes, location
- No photo display from the album

---

## Proposed Layout

```text
┌─────────────────────────────────────────┐
│ [Title]                    [Status Badge]│
│ 10:00 AM - 12:00 PM                     │
├─────────────────────────────────────────┤
│ ⬤   ★   📷   🛤️   📍                    │  ← Icon action row
│ Visited Fav Memory Route  Map           │  ← Tooltips on hover
├─────────────────────────────────────────┤
│ 📝 Description                          │
│ Lorem ipsum activity description...     │
├─────────────────────────────────────────┤
│ 📍 Location                             │
│ Beach House Restaurant                  │
│ 123 Oceanview Dr, Malibu                │
├─────────────────────────────────────────┤
│ 📞 (310) 555-1234                       │
│ 🔗 www.beachhouse.com                   │
├─────────────────────────────────────────┤
│ ▶ Photos (3)                            │  ← Collapsible
│   [img] [img] [img]                     │
└─────────────────────────────────────────┘
```

---

## Icon Buttons Design

| Order | Action | Icon | Active State |
|-------|--------|------|--------------|
| 1 | Mark Visited | `Check` / `Undo2` | Green bg when done |
| 2 | Favorite | `Star` (FavoriteHeart) | Gold fill when favorited |
| 3 | Add Memory | `Camera` | Opens dialog |
| 4 | Get Directions | `Route` | Opens Google Maps |
| 5 | Show on Map | `MapPin` | Navigates to map panel |

The `Route` icon from Lucide shows a curved path between two circular pins - perfect for "Get Directions".

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/DetailPanels/ActivityDetail.tsx` | Complete redesign with icon actions, structured content, photo accordion |

---

## Detailed Implementation

### 1. New Imports

```tsx
import { 
  Clock, MapPin, Phone, Globe, Check, Camera, Undo2, 
  Route, ChevronDown, Image 
} from 'lucide-react';
import { FavoriteHeart } from '@/components/ui/favorite-heart';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useFavorites, useToggleFavorite } from '@/hooks/use-trip-data';
import { useLocationMemories, getMemoryMediaUrl } from '@/hooks/use-memories';
```

### 2. Icon Action Row

Replace the current `<div className="flex gap-2">` with:

```tsx
{/* Icon Action Row */}
<TooltipProvider>
  <div className="flex items-center justify-center gap-1 py-3 border-b border-border">
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
```

### 3. Get Directions Handler

```tsx
const handleGetDirections = () => {
  if (activity.location?.lat && activity.location?.lng) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${activity.location.lat},${activity.location.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
```

### 4. Favorite Hook Integration

```tsx
const { data: favorites } = useFavorites();
const toggleFavorite = useToggleFavorite();

const isFavorite = favorites?.[activity.id] ?? false;

const handleToggleFavorite = () => {
  toggleFavorite.mutate({
    itemId: activity.id,
    itemType: activity.category,
    isFavorite: !isFavorite
  });
};
```

### 5. Structured Content Sections

Replace the scattered cards with organized sections:

```tsx
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
      <a href={`tel:${activity.phone}`} className="flex items-center gap-1.5 text-accent hover:underline">
        <Phone className="w-4 h-4" />
        {activity.phone}
      </a>
    )}
    {activity.link && (
      <a 
        href={activity.link} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-accent hover:underline truncate max-w-[200px]"
      >
        <Globe className="w-4 h-4 flex-shrink-0" />
        {activity.link_label || new URL(activity.link).hostname}
      </a>
    )}
  </div>
)}
```

### 6. Photo Accordion

```tsx
{/* Photos Section */}
{locationPhotos.length > 0 && (
  <Collapsible open={photosOpen} onOpenChange={setPhotosOpen}>
    <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:bg-accent/30 rounded-md px-2 -mx-2">
      <div className="flex items-center gap-2">
        <Image className="w-4 h-4" />
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
```

### 7. Photo Data Hook

Use `useLocationMemories` to fetch photos linked to this activity's location:

```tsx
const { data: locationMemories = [] } = useLocationMemories(activity.location_id || undefined);

// Flatten all media from location memories
const locationPhotos = useMemo(() => {
  return locationMemories.flatMap(m => m.media || []);
}, [locationMemories]);

// State for photo viewer
const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
const [photoViewerIndex, setPhotoViewerIndex] = useState(0);
const [photosOpen, setPhotosOpen] = useState(true);

const handleOpenPhoto = (index: number) => {
  setPhotoViewerIndex(index);
  setPhotoViewerOpen(true);
};
```

---

## Mobile Optimization

- Icon buttons use `h-10 w-10` for comfortable touch targets (40px)
- Photo thumbnails are `w-16 h-16` (64px) - easy to tap
- Horizontal scroll on photos with `overflow-x-auto` 
- Content sections have appropriate spacing for scanning
- Collapsible photos save space when not needed

---

## Testing Checklist

- [ ] Icon buttons display in correct order
- [ ] Tooltips appear on hover/focus
- [ ] "Mark Visited" toggles status and shows green state
- [ ] Favorite toggle works and shows gold fill
- [ ] "Add Memory" opens the memory capture dialog
- [ ] "Get Directions" opens Google Maps in new tab
- [ ] "Show on Map" navigates to map panel with correct filters
- [ ] Description, location, phone, website display correctly
- [ ] Photo accordion shows correct count and images
- [ ] Photo viewer opens when clicking thumbnails
- [ ] All elements are touch-friendly on mobile
- [ ] Layout works well on both portrait and landscape

