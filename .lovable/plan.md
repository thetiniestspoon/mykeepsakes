

## Trip Guide Enhancement - Implementation Plan

This plan adds three new guide sections (Activities, Events, Stay) and a Photo Album that collates all photos from across the trip.

---

## Current State

The Trip Guide currently has 3 accordion sections:
1. **Beaches** - Static list from `BEACHES` constant
2. **Restaurants** - Static list from `RESTAURANTS` constant  
3. **Packing List** - Checklist with progress tracking

---

## Proposed Changes

### New Sections to Add

| Section | Data Source | Icon |
|---------|-------------|------|
| Activities | Extract from `ITINERARY` where `category === 'activity'` | Compass |
| Events | Extract from `ITINERARY` where `category === 'event'` | PartyPopper |
| Stay | Selected lodging from `useSelectedLodging()` hook | Home |
| Photo Album | All photos from `usePhotos()` hook | Images |

---

## Implementation Details

### 1. Create Guide Data Constants for Activities & Events

**File:** `src/lib/itinerary-data.ts`

Add two new exports that extract unique activities and events from the itinerary:

```typescript
// Guide - Activities (unique attractions/things to do)
export const ACTIVITIES: GuideItem[] = [
  {
    id: 'activity-whalewatch',
    name: 'Dolphin Fleet Whale Watching',
    category: 'activity',
    description: '3-4 hour excursion to see humpback whales in Stellwagen Bank.',
    location: { lat: 42.0542, lng: -70.1838, name: 'MacMillan Pier' },
    link: 'https://whalewatch.com/',
    phone: '508-240-3636'
  },
  {
    id: 'activity-paam',
    name: 'Provincetown Art Association & Museum',
    category: 'activity',
    description: 'Explore the vibrant local art scene with interactive exhibits.',
    location: { lat: 42.0566, lng: -70.1786, name: 'PAAM' },
    link: 'https://paam.org/',
    phone: '508-487-1750'
  },
  {
    id: 'activity-bike',
    name: 'Province Lands Bike Trail',
    category: 'activity',
    description: 'Beautiful trails through dunes and forests.',
    location: { lat: 42.0640, lng: -70.2080, name: 'Province Lands Visitor Center' },
    link: 'https://www.nps.gov/caco/planyourvisit/provincelandsbikepath.htm'
  },
  {
    id: 'activity-monument',
    name: 'Pilgrim Monument & Museum',
    category: 'activity',
    description: 'Climb the tallest all-granite structure in the US for 360-degree views!',
    location: { lat: 42.0555, lng: -70.1888, name: 'Pilgrim Monument' },
    link: 'https://www.pilgrim-monument.org/',
    phone: '508-487-1310'
  }
];

// Guide - Events (Family Week specific)
export const EVENTS: GuideItem[] = [
  {
    id: 'event-welcome',
    name: 'Family Week Welcome Event',
    category: 'activity', // using 'activity' since GuideItem doesn't have 'event'
    description: 'Official kickoff celebration! Meet other families and get your schedule.',
    location: { lat: 42.0515, lng: -70.1865, name: 'Crown & Anchor' },
    link: 'https://www.familyequality.org/family-week/'
  },
  {
    id: 'event-parade',
    name: 'Family Week Parade',
    category: 'activity',
    description: 'The highlight of the week! March down Commercial Street celebrating family diversity.',
    location: { lat: 42.0525, lng: -70.1855, name: 'Commercial Street' }
  },
  {
    id: 'event-picnic',
    name: 'Family Picnic',
    category: 'activity',
    description: 'Large group picnic with all Family Week families. Games and activities for kids.'
  },
  {
    id: 'event-crafts',
    name: 'Parade Prep & Crafts',
    category: 'activity',
    description: 'Join other families creating costumes and decorations for the parade!',
    location: { lat: 42.0515, lng: -70.1865, name: 'Family Week HQ' }
  }
];
```

---

### 2. Update GuideTab Component

**File:** `src/components/GuideTab.tsx`

Add four new accordion sections:

#### 2a. Import New Data & Icons

```typescript
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
  Trash2,
  Compass,      // NEW: for Activities
  PartyPopper,  // NEW: for Events
  Home,         // NEW: for Stay
  Images        // NEW: for Photo Album
} from 'lucide-react';

import { BEACHES, RESTAURANTS, PACKING_LIST, ACTIVITIES, EVENTS } from '@/lib/itinerary-data';
import { useSelectedLodging } from '@/hooks/use-lodging';
```

#### 2b. Add useSelectedLodging Hook

Inside the `GuideTab` component:
```typescript
const { data: selectedLodging } = useSelectedLodging();
const { data: allPhotos } = usePhotos();
```

#### 2c. Add Activities Section (after Beaches)

```tsx
<AccordionItem value="activities" className="border rounded-lg shadow-warm overflow-hidden">
  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/30">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-beach-driftwood/20 flex items-center justify-center">
        <Compass className="w-5 h-5 text-beach-driftwood" />
      </div>
      <div className="text-left">
        <span className="font-semibold">Activities</span>
        <p className="text-sm text-muted-foreground">{ACTIVITIES.length} things to do</p>
      </div>
    </div>
  </AccordionTrigger>
  <AccordionContent className="px-4 pb-4 space-y-3">
    {ACTIVITIES.map((activity) => (
      <GuideItemCard key={activity.id} item={activity} onOpenMap={openMapModal} onOpenPhoto={openPhotoViewer} />
    ))}
  </AccordionContent>
</AccordionItem>
```

#### 2d. Add Events Section

```tsx
<AccordionItem value="events" className="border rounded-lg shadow-warm overflow-hidden">
  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/30">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-beach-sunset-gold/20 flex items-center justify-center">
        <PartyPopper className="w-5 h-5 text-beach-sunset-gold" />
      </div>
      <div className="text-left">
        <span className="font-semibold">Events</span>
        <p className="text-sm text-muted-foreground">Family Week schedule</p>
      </div>
    </div>
  </AccordionTrigger>
  <AccordionContent className="px-4 pb-4 space-y-3">
    {EVENTS.map((event) => (
      <GuideItemCard key={event.id} item={event} onOpenMap={openMapModal} onOpenPhoto={openPhotoViewer} />
    ))}
  </AccordionContent>
</AccordionItem>
```

#### 2e. Add Stay Section

Display the selected lodging with details and a link to view more:

```tsx
<AccordionItem value="stay" className="border rounded-lg shadow-warm overflow-hidden">
  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/30">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-beach-ocean/20 flex items-center justify-center">
        <Home className="w-5 h-5 text-beach-ocean" />
      </div>
      <div className="text-left">
        <span className="font-semibold">Stay</span>
        <p className="text-sm text-muted-foreground">
          {selectedLodging ? selectedLodging.name : 'No accommodation selected'}
        </p>
      </div>
    </div>
  </AccordionTrigger>
  <AccordionContent className="px-4 pb-4">
    {selectedLodging ? (
      <StayCard lodging={selectedLodging} onOpenMap={openMapModal} />
    ) : (
      <p className="text-sm text-muted-foreground">
        Add your accommodation in the Lodging tab to see it here.
      </p>
    )}
  </AccordionContent>
</AccordionItem>
```

#### 2f. Add Photo Album Section

A new accordion that displays ALL photos from the trip in a gallery grid:

```tsx
<AccordionItem value="photos" className="border rounded-lg shadow-warm overflow-hidden">
  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/30">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-beach-sunset-coral/30 flex items-center justify-center">
        <Images className="w-5 h-5 text-beach-sunset-coral" />
      </div>
      <div className="text-left">
        <span className="font-semibold">Photo Album</span>
        <p className="text-sm text-muted-foreground">
          {allPhotos?.length || 0} memories captured
        </p>
      </div>
    </div>
  </AccordionTrigger>
  <AccordionContent className="px-4 pb-4">
    {allPhotos && allPhotos.length > 0 ? (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {allPhotos.map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => openPhotoViewer(allPhotos, index)}
            className="aspect-square rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <img
              src={getPhotoUrl(photo.storage_path)}
              alt={photo.caption || 'Trip photo'}
              className="w-full h-full object-cover hover:opacity-90 transition-opacity"
            />
          </button>
        ))}
      </div>
    ) : (
      <p className="text-sm text-muted-foreground text-center py-4">
        No photos yet. Add photos to activities in your itinerary!
      </p>
    )}
  </AccordionContent>
</AccordionItem>
```

---

### 3. Create StayCard Component

A new internal component to display lodging details nicely:

```typescript
interface StayCardProps {
  lodging: LodgingOption;
  onOpenMap?: (location: SelectedLocation) => void;
}

function StayCard({ lodging, onOpenMap }: StayCardProps) {
  return (
    <div className="p-4 rounded-lg border border-border bg-card">
      <h4 className="font-semibold text-foreground">{lodging.name}</h4>
      {lodging.description && (
        <p className="text-sm text-muted-foreground mt-1">{lodging.description}</p>
      )}
      
      <div className="mt-3 space-y-2 text-sm">
        {lodging.address && (
          <p className="text-muted-foreground">{lodging.address}</p>
        )}
        
        {(lodging.bedrooms || lodging.bathrooms || lodging.max_guests) && (
          <p className="text-muted-foreground">
            {lodging.bedrooms && `${lodging.bedrooms} bed`}
            {lodging.bathrooms && ` · ${lodging.bathrooms} bath`}
            {lodging.max_guests && ` · Sleeps ${lodging.max_guests}`}
          </p>
        )}
        
        {lodging.amenities && lodging.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {lodging.amenities.slice(0, 5).map((amenity, i) => (
              <span key={i} className="text-xs bg-secondary px-2 py-0.5 rounded">
                {amenity}
              </span>
            ))}
            {lodging.amenities.length > 5 && (
              <span className="text-xs text-muted-foreground">
                +{lodging.amenities.length - 5} more
              </span>
            )}
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap items-center gap-2 mt-3">
        {lodging.url && (
          <a
            href={lodging.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            View Listing
          </a>
        )}
        {lodging.location_lat && lodging.location_lng && onOpenMap && (
          <button
            onClick={() => onOpenMap({
              lat: lodging.location_lat!,
              lng: lodging.location_lng!,
              name: lodging.name,
              address: lodging.address || undefined
            })}
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            <MapPin className="w-3 h-3" />
            Map
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## Files Summary

| File | Action | Changes |
|------|--------|---------|
| `src/lib/itinerary-data.ts` | Modify | Add `ACTIVITIES` and `EVENTS` exports |
| `src/components/GuideTab.tsx` | Modify | Add 4 new accordion sections (Activities, Events, Stay, Photo Album) |

---

## Section Order in Guide

1. Photo Album (most important for memory keeping - top)
2. Stay (accommodation info)
3. Activities (things to do)
4. Events (Family Week schedule)
5. Beaches (existing)
6. Restaurants (existing)
7. Packing List (existing)

---

## Expected Outcomes

| Feature | Description |
|---------|-------------|
| Activities Section | 4 activity cards with links, maps, photos, and notes |
| Events Section | 4 Family Week event cards |
| Stay Section | Selected accommodation with details, map link, listing link |
| Photo Album | Grid of ALL photos from across the trip with count badge |

