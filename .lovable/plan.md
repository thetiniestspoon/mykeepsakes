

## Provincetown Family Planner 2.0 — Dynamic Planning Features

Transform the app from a static itinerary viewer into a full collaborative trip planning tool your family can use before, during, and after the vacation.

---

## 1. ITINERARY EDITING & ORGANIZATION

### Drag-and-Drop Itinerary Management
- **Reorder activities** within a day by dragging them up/down
- **Move activities between days** — drag an activity from Tuesday to Wednesday
- **Add new activities** with a simple "+" button on each day
- **Edit existing activities** — tap to edit title, time, description, links
- **Delete activities** you decide not to do

### Custom Activities
- **Add custom activities** not in the original plan (impromptu ideas!)
- **Create entirely new days** if the trip extends
- **Quick-add templates**: "Beach Day", "Dinner Out", "Free Time"

---

## 2. LODGING COMPARISON & SELECTION

### Accommodation Candidates Section
A dedicated area to compare lodging options before booking:
- **Add potential rentals/hotels** with photos, links, pricing, location
- **See all options on the map** with color-coded pins
- **Vote/rate each option** — family members can indicate preferences
- **Mark pros/cons** on each option (beach access, parking, kitchen, etc.)
- **"Set as booked"** — when you decide, one-click to confirm and move to itinerary
- **Archive rejected options** — keeps the research but declutters the view

### Comparison View
- Side-by-side comparison of top contenders
- Price per night, total cost calculator
- Distance from key locations (beach, downtown, ferry)

---

## 3. FAMILY CONTACTS DIRECTORY

### Custom Contact Cards
- **Add family members' phone numbers** for quick access during the trip
- **Add travel companions** (grandparents, cousins, friends joining)
- **Include emergency info**: allergies, medical info, car seat needs, etc.
- **Edit/delete contacts** as needed

### Contact Categories
- **Family** — core trip members
- **Travel Party** — others joining for part of the trip
- **Local Contacts** — babysitters, rental hosts, local friends
- **Emergency** — existing emergency services (current implementation)

---

## 4. ENHANCED MAP FEATURES

### Full Trip Overview Map
- **See everything at once** — all accommodations, activities, restaurants, beaches
- **Smart clustering** — zoom out to see clusters, zoom in for individual pins
- **Category toggles** — show/hide beaches, dining, activities, lodging candidates
- **"Day View" filter** — show only locations for a specific day
- **Tap pins for quick info** — name, time scheduled, link to full details

### Location Additions
- **Add custom locations** to the map (secret beach spot, friend's house, parking lot)
- **Mark "visited" locations** — track what you've actually done

---

## 5. SHARED WISHLISTS & VOTING

### "Maybe" List
- **Save ideas you're considering** but haven't committed to
- **Restaurants to try** if you have time
- **Activities that might be too ambitious**
- **Vote on items** — thumbs up/down from family members

### Group Decision Tools
- **Quick polls** — "Beach or whale watch tomorrow?"
- **Priority ranking** — drag to rank must-dos
- **Assignment** — who's in charge of booking each thing?

---

## 6. BUDGET & EXPENSE TRACKING (Bonus)

### Trip Budget
- **Set overall trip budget**
- **Log expenses** as you go (with categories)
- **Running total** vs. budget remaining
- **Split by category** — lodging, food, activities, transport

---

## 7. MEMORIES & SCRAPBOOK MODE (Post-Trip)

### Trip Memory Gallery
- **View all photos** organized by day or activity
- **Add captions and stories** to photos after the trip
- **"Best moments" highlights** — star your favorites
- **Shareable summary** — generate a link to share with family who couldn't come

---

## TECHNICAL APPROACH

### New Database Tables Needed

```text
+------------------------+     +-------------------+
|   custom_activities    |     |   lodging_options |
+------------------------+     +-------------------+
| id                     |     | id                |
| day_id                 |     | name              |
| title                  |     | description       |
| description            |     | price_per_night   |
| time                   |     | total_price       |
| category               |     | url               |
| location               |     | location (lat/lng)|
| links                  |     | is_selected       |
| order_index            |     | pros_cons         |
| is_custom              |     | photos            |
| created_at             |     | created_at        |
+------------------------+     +-------------------+

+------------------------+     +-------------------+
|   family_contacts      |     |   activity_order  |
+------------------------+     +-------------------+
| id                     |     | id                |
| name                   |     | activity_id       |
| phone                  |     | day_id            |
| relationship           |     | order_index       |
| category               |     | updated_at        |
| emergency_info         |     +-------------------+
| created_at             |
+------------------------+
```

### UI Components Needed
1. **DraggableActivity** — using `@dnd-kit` for smooth drag-and-drop
2. **ActivityEditor** — modal/sheet for editing activity details
3. **LodgingCard** — comparison card with vote buttons
4. **LodgingMap** — filtered Google Maps view
5. **ContactEditor** — form for adding family contacts
6. **WishlistItem** — voteable item component

### Data Flow
- All changes persist immediately to the database (real-time sync)
- Optimistic updates for snappy UI
- Changes reflect across all devices viewing the app

---

## RECOMMENDED PRIORITY ORDER

| Phase | Features | Why |
|-------|----------|-----|
| **Phase 1** | Family Contacts + Itinerary Editing | Most useful for pre-trip planning |
| **Phase 2** | Lodging Comparison | Critical decision to make early |
| **Phase 3** | Enhanced Map | Better visualization of the plan |
| **Phase 4** | Voting/Wishlists | Collaborative decision making |
| **Phase 5** | Budget Tracking | Nice-to-have for during trip |
| **Phase 6** | Scrapbook Mode | Post-trip enhancement |

---

## IMMEDIATE NEXT STEPS

If you approve this direction, I would:

1. **Create database migrations** for new tables (family_contacts, custom_activities, lodging_options, activity_order)
2. **Implement family contacts** section with add/edit/delete
3. **Add itinerary editing** with drag-and-drop reordering
4. **Build lodging comparison** module with map integration
5. **Enhance the map** with filtering and custom pins

Would you like me to proceed with all phases, or focus on specific features first?

