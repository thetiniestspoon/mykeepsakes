

## Migrate Entire App to Leaflet — Drop Google Maps Dependencies

Complete the transition to Leaflet by replacing all remaining Google Maps links with the interactive Leaflet-based `MapModal`. This creates a consistent, beautiful in-app map experience everywhere.

---

## Current State

The app has **two mapping patterns** right now:

| Pattern | Components | Experience |
|---------|------------|------------|
| ✅ **Leaflet MapModal** | LodgingCard, MapTab | Interactive in-app map with OpenStreetMap |
| ❌ **External Google/Apple Links** | ItineraryTab, GuideTab, FavoritesTab, MapModal footer | Opens external browser/app |

---

## What We're Changing

### 1. Update MapModal Footer
**File:** `src/components/map/MapModal.tsx`

Keep the Google/Apple Maps links in the footer, but rebrand them as "Get Directions" options since that's their real purpose — users can open native apps for turn-by-turn navigation.

```text
Current:  [Google Maps] [Apple Maps]
After:    [Get Directions ▸]  (dropdown with Google/Apple/Waze options)
```

### 2. Replace Map Links in ItineraryTab
**File:** `src/components/ItineraryTab.tsx`

When an activity has `location` data, replace the external "Map" link with a button that opens the `MapModal`:

```text
Before: <a href={activity.mapLink}> Map </a>
After:  <button onClick={() => openMap(activity.location)}> Map </button>
```

### 3. Replace Map Links in GuideTab
**File:** `src/components/GuideTab.tsx`

Same pattern for beaches and restaurants in the Guide section:

```text
Before: <a href={item.mapLink}> Map </a>
After:  <button onClick={() => openMap(item.location)}> Map </button>
```

### 4. Replace Map Links in FavoritesTab
**File:** `src/components/FavoritesTab.tsx`

Update favorite beaches to open the in-app modal:

```text
Before: <a href={beach.mapLink}> Directions </a>
After:  <button onClick={() => openMap(beach.location)}> View Map </button>
```

### 5. Clean Up MapTab
**File:** `src/components/MapTab.tsx`

Remove the standalone "Google Maps" external link that appears below the location count. The map is already in-app!

### 6. Remove Unused Dependency
**File:** `package.json`

Remove `@types/google.maps` since we're no longer using Google Maps API.

---

## Technical Details

### New State Management Pattern

Each component that needs the modal will get:

```typescript
const [mapModalOpen, setMapModalOpen] = useState(false);
const [selectedLocation, setSelectedLocation] = useState<{
  lat: number;
  lng: number;
  name: string;
  address?: string;
} | null>(null);

const openMapModal = (location: { lat: number; lng: number; name: string }) => {
  setSelectedLocation(location);
  setMapModalOpen(true);
};
```

### MapModal Enhancement

The footer will be enhanced to be more useful:

```typescript
// Simplified footer with "Get Directions" dropdown
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" size="sm" className="w-full">
      <Navigation className="w-4 h-4 mr-2" />
      Get Directions
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem asChild>
      <a href={googleMapsUrl} target="_blank">Google Maps</a>
    </DropdownMenuItem>
    <DropdownMenuItem asChild>
      <a href={appleMapsUrl} target="_blank">Apple Maps</a>
    </DropdownMenuItem>
    <DropdownMenuItem asChild>
      <a href={wazeUrl} target="_blank">Waze</a>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/map/MapModal.tsx` | Enhance footer with "Get Directions" dropdown |
| `src/components/ItineraryTab.tsx` | Add MapModal, replace mapLink anchors with buttons |
| `src/components/GuideTab.tsx` | Add MapModal, replace mapLink anchors with buttons |
| `src/components/FavoritesTab.tsx` | Add MapModal, replace mapLink anchors with buttons |
| `src/components/MapTab.tsx` | Remove standalone Google Maps link |
| `package.json` | Remove `@types/google.maps` |

---

## User Experience After Changes

1. **Tap "Map" on any activity** → Full-screen Leaflet modal opens
2. **See the location** on an interactive map with marker and popup
3. **Need directions?** → Tap "Get Directions" → Choose Google/Apple/Waze
4. **Close modal** → Tap X or background to return

This keeps users in the app while still allowing them to use their preferred navigation app when they actually need directions.

---

## What We're NOT Changing

- The `mapLink` property in `itinerary-data.ts` can stay (backward compatibility)
- Components will prefer `location` (lat/lng) over `mapLink` when available
- The "Get Directions" feature still opens external apps (that's the right UX for navigation)

