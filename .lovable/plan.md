

## Add URL Import for Lodging Options

Add a feature that lets users paste an Airbnb (or similar rental site) URL and automatically extract property information to populate the lodging form.

---

## How It Works

1. User taps "Import from URL" button in the Lodging tab
2. Pastes a property listing URL (Airbnb, VRBO, etc.)
3. System scrapes the page and extracts key details
4. Form is pre-populated with extracted data
5. User reviews, makes any edits, and saves

---

## Implementation Overview

### 1. Connect Firecrawl
Use the Firecrawl connector to enable web scraping. This provides AI-powered extraction of property details from rental listing pages.

### 2. Create Edge Function
**File:** `supabase/functions/scrape-lodging/index.ts`

An edge function that:
- Receives a listing URL
- Calls Firecrawl with structured data extraction
- Parses the response into our lodging format
- Returns extracted property data

The extraction will use Firecrawl's JSON format with a schema tailored for rental properties:

```text
+------------------+     +-----------------+     +------------------+
|  User pastes URL | --> | Edge Function   | --> | Firecrawl API    |
+------------------+     | (scrape-lodging)|     +------------------+
                         +-----------------+            |
                                  ^                     |
                                  |                     v
                         +-----------------+     +------------------+
                         | Pre-fill form   | <-- | Extract property |
                         | with data       |     | details          |
                         +-----------------+     +------------------+
```

### 3. Add Import UI Components
**Files:** 
- `src/components/LodgingTab.tsx` - Add "Import from URL" button
- `src/components/lodging/LodgingUrlImporter.tsx` - New dialog for URL input
- `src/components/lodging/LodgingEditor.tsx` - Accept pre-filled data

### 4. Add Import Hook
**File:** `src/hooks/use-lodging.ts`

Add a mutation hook for calling the scrape edge function.

---

## Technical Details

### Edge Function Logic

The scrape function will extract:

| Field | Extraction Method |
|-------|------------------|
| Name | Property title |
| Description | Main description text |
| Address | Location/neighborhood info |
| Price per night | Nightly rate |
| Bedrooms | Bedroom count |
| Bathrooms | Bathroom count |
| Max guests | Guest capacity |
| Amenities | Amenities list |
| Photos | Image URLs (first few) |

### Firecrawl JSON Schema

```typescript
const lodgingSchema = {
  type: "object",
  properties: {
    name: { type: "string", description: "Property title or name" },
    description: { type: "string", description: "Property description" },
    address: { type: "string", description: "Location or address" },
    price_per_night: { type: "number", description: "Nightly price in USD" },
    bedrooms: { type: "number", description: "Number of bedrooms" },
    bathrooms: { type: "number", description: "Number of bathrooms" },
    max_guests: { type: "number", description: "Maximum guest capacity" },
    amenities: { 
      type: "array", 
      items: { type: "string" },
      description: "List of amenities" 
    }
  }
};
```

### URL Importer Component

A simple dialog with:
- URL input field with validation
- "Import" button with loading state
- Error handling for failed scrapes
- Success callback to open the editor with data

### UI Flow

```text
[Add Lodging Option]  [Import from URL]
         |                    |
         v                    v
  +-------------+      +---------------+
  | Empty form  |      | URL Dialog    |
  +-------------+      +---------------+
                              |
                              v
                       +---------------+
                       | Loading...    |
                       +---------------+
                              |
                              v
                       +---------------+
                       | Pre-filled    |
                       | Editor form   |
                       +---------------+
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/scrape-lodging/index.ts` | Create | Edge function for web scraping |
| `src/components/lodging/LodgingUrlImporter.tsx` | Create | URL input dialog |
| `src/components/LodgingTab.tsx` | Modify | Add "Import from URL" button |
| `src/components/lodging/LodgingEditor.tsx` | Modify | Accept initial data prop |
| `src/hooks/use-lodging.ts` | Modify | Add scrape mutation hook |

---

## User Experience

1. **On Lodging Tab**: Two buttons side-by-side
   - "Add Lodging Option" (manual entry)
   - "Import from URL" (auto-extract)

2. **Import Dialog**: Clean, simple interface
   - Paste URL field
   - Supported sites hint (Airbnb, VRBO, etc.)
   - Import button

3. **Loading State**: Shows progress while scraping (~3-5 seconds)

4. **Pre-filled Editor**: Opens with extracted data
   - All fields populated where data was found
   - User can review and adjust
   - Missing fields left empty for manual entry

5. **Error Handling**: 
   - Invalid URL format
   - Scraping failed
   - No data extracted

---

## Prerequisites

Before implementing, the Firecrawl connector needs to be connected to provide the API key for web scraping.

