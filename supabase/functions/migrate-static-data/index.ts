import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Static itinerary data embedded for migration
const ITINERARY_DATA = {
  trip: {
    title: "Family Week 2026",
    location_name: "Provincetown, MA",
    start_date: "2026-07-25",
    end_date: "2026-08-01",
    timezone: "America/New_York"
  },
  days: [
    { date: "2026-07-25", title: "Arrival Day", dayOfWeek: "Saturday" },
    { date: "2026-07-26", title: "Beach Day & Family Week Kickoff", dayOfWeek: "Sunday" },
    { date: "2026-07-27", title: "Whale Watching Adventure", dayOfWeek: "Monday" },
    { date: "2026-07-28", title: "Art & Adventure Day", dayOfWeek: "Tuesday" },
    { date: "2026-07-29", title: "Family Week Fun Day", dayOfWeek: "Wednesday" },
    { date: "2026-07-30", title: "The Big Parade!", dayOfWeek: "Thursday" },
    { date: "2026-07-31", title: "Last Full Day", dayOfWeek: "Friday" },
    { date: "2026-08-01", title: "Departure Day", dayOfWeek: "Saturday" }
  ],
  activities: [
    // Day 1 - Arrival
    { dayIndex: 0, time: "08:00", title: "Depart for Cape Cod", description: "Pack the car and hit the road! Expect 2-3 hours depending on traffic.", category: "transport", notes: "Check traffic before leaving. Consider stopping in Plymouth for lunch." },
    { dayIndex: 0, time: "14:00", title: "Check-in at Accommodation", description: "Check into your rental and get settled.", category: "accommodation", location: { name: "Vacation Rental", lat: 42.0520, lng: -70.1890 } },
    { dayIndex: 0, time: "16:00", title: "Explore Commercial Street", description: "Take a stroll down the heart of Provincetown. Grab ice cream and browse the galleries.", category: "activity", location: { name: "Commercial Street", lat: 42.0525, lng: -70.1855 } },
    { dayIndex: 0, time: "18:30", title: "Dinner at The Mews", description: "Upscale casual waterfront dining with stunning harbor views. Great for families.", category: "dining", location: { name: "The Mews Restaurant", lat: 42.0505, lng: -70.1870 }, link: "https://mewsptown.com/", linkLabel: "View Menu", phone: "508-487-1500" },
    
    // Day 2 - Beach Day
    { dayIndex: 1, time: "08:30", title: "Breakfast at Café Heaven", description: "Local favorite with excellent pastries and coffee.", category: "dining", location: { name: "Café Heaven", lat: 42.0530, lng: -70.1860 }, phone: "508-487-9639" },
    { dayIndex: 1, time: "10:00", title: "Herring Cove Beach", description: "Family-friendly beach with calm waters, bathrooms, and snack bar. Part of Cape Cod National Seashore.", category: "beach", location: { name: "Herring Cove Beach", lat: 42.0642, lng: -70.2095 }, notes: "Bring beach umbrella and plenty of sunscreen!" },
    { dayIndex: 1, time: "16:00", title: "Family Week Welcome Event", description: "Official kickoff celebration for Family Week! Meet other families and get your schedule.", category: "event", location: { name: "Crown & Anchor", lat: 42.0515, lng: -70.1865 }, link: "https://www.familyequality.org/family-week/", linkLabel: "Family Week Info" },
    { dayIndex: 1, time: "18:00", title: "Lobster Pot for Dinner", description: "Iconic Provincetown seafood restaurant. Get the lobster roll!", category: "dining", location: { name: "The Lobster Pot", lat: 42.0526, lng: -70.1842 }, phone: "508-487-0842", link: "https://ptownlobsterpot.com/", linkLabel: "Make Reservation" },
    
    // Day 3 - Whale Watching
    { dayIndex: 2, time: "07:30", title: "Early Breakfast", description: "Quick breakfast before the whale watch. Pack snacks for the boat!", category: "dining" },
    { dayIndex: 2, time: "09:00", title: "Whale Watching with Dolphin Fleet", description: "3-4 hour excursion to see humpback whales in Stellwagen Bank. Book tickets in advance!", category: "activity", location: { name: "MacMillan Pier", lat: 42.0542, lng: -70.1838 }, link: "https://whalewatch.com/", linkLabel: "Book Tickets", phone: "508-240-3636", notes: "Bring layers - it gets cold on the water even in summer!" },
    { dayIndex: 2, time: "13:30", title: "Lunch at Canteen", description: "Casual local spot with great sandwiches and seafood.", category: "dining", location: { name: "Canteen", lat: 42.0517, lng: -70.1868 } },
    { dayIndex: 2, time: "15:00", title: "Family Week Activities", description: "Check the Family Week schedule for afternoon activities and workshops.", category: "event", link: "https://www.familyequality.org/family-week/", linkLabel: "View Schedule" },
    { dayIndex: 2, time: "19:00", title: "Sunset at Race Point", description: "Drive out to Race Point for stunning sunset views over the dunes.", category: "beach", location: { name: "Race Point Beach", lat: 42.0816, lng: -70.2396 } },
    
    // Day 4 - Art & Adventure
    { dayIndex: 3, time: "10:00", title: "Provincetown Art Association & Museum", description: "Explore the vibrant local art scene. Great for all ages with interactive exhibits.", category: "activity", location: { name: "PAAM", lat: 42.0566, lng: -70.1786 }, link: "https://paam.org/", linkLabel: "Plan Your Visit", phone: "508-487-1750" },
    { dayIndex: 3, time: "13:00", title: "Bike the Province Lands Trail", description: "Rent bikes and explore the beautiful Province Lands trails through dunes and forests.", category: "activity", location: { name: "Province Lands Visitor Center", lat: 42.0640, lng: -70.2080 }, link: "https://www.nps.gov/caco/planyourvisit/provincelandsbikepath.htm", linkLabel: "Trail Info", notes: "Bike rentals available at several shops on Commercial Street." },
    { dayIndex: 3, time: "16:00", title: "Long Point Beach Exploration", description: "Take the shuttle or walk the breakwater to Long Point for a secluded beach experience.", category: "beach", location: { name: "Long Point", lat: 42.0336, lng: -70.1688 } },
    
    // Day 5 - Family Week Fun Day
    { dayIndex: 4, time: "10:00", title: "Parade Prep & Crafts", description: "Join other families creating costumes and decorations for the famous Family Week parade!", category: "event", location: { name: "Family Week HQ", lat: 42.0515, lng: -70.1865 } },
    { dayIndex: 4, time: "12:00", title: "Family Picnic", description: "Large group picnic with all Family Week families. Games and activities for kids.", category: "event" },
    { dayIndex: 4, time: "15:00", title: "Pilgrim Monument & Museum", description: "Climb the tallest all-granite structure in the US for 360-degree Cape views!", category: "activity", location: { name: "Pilgrim Monument", lat: 42.0555, lng: -70.1888 }, link: "https://www.pilgrim-monument.org/", linkLabel: "Buy Tickets", phone: "508-487-1310", notes: "252 steps + 60 ramps. Worth it for the view!" },
    
    // Day 6 - The Big Parade
    { dayIndex: 5, time: "09:00", title: "Final Parade Preparations", description: "Get costumes ready and meet up with your parade group!", category: "event" },
    { dayIndex: 5, time: "11:00", title: "Family Week Parade", description: "The highlight of the week! March down Commercial Street celebrating family diversity.", category: "event", location: { name: "Commercial Street", lat: 42.0525, lng: -70.1855 }, notes: "This is an unforgettable experience. Cheer loud and proud!" },
    { dayIndex: 5, time: "13:00", title: "Post-Parade Celebration", description: "Music, dancing, and festivities after the parade.", category: "event" },
    { dayIndex: 5, time: "18:00", title: "Farewell Dinner at Napi's", description: "Creative international cuisine in a unique artistic setting.", category: "dining", location: { name: "Napi's Restaurant", lat: 42.0585, lng: -70.1925 }, phone: "508-487-1145", link: "https://www.napisrestaurant.com/", linkLabel: "Reserve Table" },
    
    // Day 7 - Last Full Day
    { dayIndex: 6, time: "09:00", title: "Leisurely Breakfast at Café Heaven", description: "Take your time over a delicious breakfast at this local favorite.", category: "dining", location: { name: "Café Heaven", lat: 42.0530, lng: -70.1860 }, phone: "508-487-9639" },
    { dayIndex: 6, time: "10:30", title: "Kayaking or Paddleboarding", description: "Explore the harbor by water! Rentals available at the pier.", category: "activity", location: { name: "Provincetown Harbor", lat: 42.0540, lng: -70.1835 }, notes: "Check weather conditions. Life jackets provided with rentals." },
    { dayIndex: 6, time: "13:00", title: "Lunch at Fanizzi's by the Sea", description: "Waterfront dining with stunning bay views. Great for families.", category: "dining", location: { name: "Fanizzi's Restaurant", lat: 42.0495, lng: -70.1900 }, link: "https://www.fanizzisrestaurant.com/", linkLabel: "View Menu", phone: "508-487-1964" },
    { dayIndex: 6, time: "15:00", title: "Last-Minute Shopping", description: "Browse the galleries and shops on Commercial Street for souvenirs and gifts.", category: "activity", location: { name: "Commercial Street", lat: 42.0525, lng: -70.1855 } },
    { dayIndex: 6, time: "17:00", title: "Final Beach Sunset at Herring Cove", description: "One last magical sunset at the beach. Bring a blanket and snacks.", category: "beach", location: { name: "Herring Cove Beach", lat: 42.0642, lng: -70.2095 }, notes: "Arrive early for best parking. Sunset around 8:15 PM in late July." },
    { dayIndex: 6, time: "19:30", title: "Farewell Dinner at The Red Inn", description: "Elegant waterfront dining for a memorable last night. Reservations recommended.", category: "dining", location: { name: "The Red Inn", lat: 42.0565, lng: -70.1902 }, link: "https://www.theredinn.com/", linkLabel: "Reserve Table", phone: "508-487-7334" },
    
    // Day 8 - Departure
    { dayIndex: 7, time: "08:00", title: "Quick Breakfast", description: "Grab a quick bite before hitting the road.", category: "dining" },
    { dayIndex: 7, time: "10:00", title: "Check Out", description: "Pack up and check out of accommodations.", category: "accommodation" },
    { dayIndex: 7, time: "11:00", title: "Head Home", description: "Safe travels! Consider stopping in Plymouth or Sandwich on the way.", category: "transport", notes: "Saturday traffic can be heavy. Leave early if possible!" }
  ],
  guideLocations: [
    // Beaches
    { name: "Herring Cove Beach", category: "beach", lat: 42.0642, lng: -70.2095, notes: "Most popular family beach. Calm waters, restrooms, snack bar, lifeguards. Stunning sunsets." },
    { name: "Race Point Beach", category: "beach", lat: 42.0816, lng: -70.2396, notes: "Wilder, more dramatic beach facing the open Atlantic. Great for walking and sunset views." },
    { name: "Long Point Beach", category: "beach", lat: 42.0336, lng: -70.1688, notes: "Remote and beautiful. Accessible via shuttle or 1.5 mile walk across the breakwater." },
    
    // Restaurants
    { name: "The Lobster Pot", category: "restaurant", lat: 42.0526, lng: -70.1842, phone: "508-487-0842", url: "https://ptownlobsterpot.com/", notes: "Iconic Provincetown seafood. Get the lobster bisque and lobster roll." },
    { name: "The Mews Restaurant", category: "restaurant", lat: 42.0505, lng: -70.1870, phone: "508-487-1500", url: "https://mewsptown.com/", notes: "Upscale waterfront dining with amazing harbor views." },
    { name: "Café Heaven", category: "restaurant", lat: 42.0530, lng: -70.1860, phone: "508-487-9639", notes: "Cozy breakfast and lunch spot. Excellent pastries." },
    { name: "Canteen", category: "restaurant", lat: 42.0517, lng: -70.1868, notes: "Casual local spot with great sandwiches, tacos, and local seafood." },
    { name: "Napi's Restaurant", category: "restaurant", lat: 42.0585, lng: -70.1925, phone: "508-487-1145", url: "https://www.napisrestaurant.com/", notes: "Creative international cuisine in an artistic, eclectic setting." },
    
    // Activities
    { name: "Dolphin Fleet Whale Watching", category: "activity", lat: 42.0542, lng: -70.1838, phone: "508-240-3636", url: "https://whalewatch.com/", notes: "3-4 hour excursion to see humpback whales in Stellwagen Bank." },
    { name: "Provincetown Art Association & Museum", category: "activity", lat: 42.0566, lng: -70.1786, phone: "508-487-1750", url: "https://paam.org/", notes: "Explore the vibrant local art scene with interactive exhibits." },
    { name: "Province Lands Bike Trail", category: "activity", lat: 42.0640, lng: -70.2080, url: "https://www.nps.gov/caco/planyourvisit/provincelandsbikepath.htm", notes: "Beautiful trails through dunes and forests." },
    { name: "Pilgrim Monument & Museum", category: "activity", lat: 42.0555, lng: -70.1888, phone: "508-487-1310", url: "https://www.pilgrim-monument.org/", notes: "Climb the tallest all-granite structure in the US for 360-degree views!" }
  ]
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if migration has already been run
    const { data: existingTrips } = await supabase
      .from('trips')
      .select('id')
      .limit(1);

    if (existingTrips && existingTrips.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Migration already completed. Trip data already exists.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting data migration...');

    // 1. Create the trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert(ITINERARY_DATA.trip)
      .select()
      .single();

    if (tripError) throw tripError;
    console.log('Created trip:', trip.id);

    // 2. Create itinerary days
    const daysToInsert = ITINERARY_DATA.days.map((day, index) => ({
      trip_id: trip.id,
      date: day.date,
      title: `${day.dayOfWeek} - ${day.title}`,
      sort_index: index
    }));

    const { data: days, error: daysError } = await supabase
      .from('itinerary_days')
      .insert(daysToInsert)
      .select();

    if (daysError) throw daysError;
    console.log('Created days:', days.length);

    // 3. Create guide locations (standalone locations)
    const locationsToInsert = ITINERARY_DATA.guideLocations.map(loc => ({
      trip_id: trip.id,
      name: loc.name,
      category: loc.category,
      lat: loc.lat,
      lng: loc.lng,
      phone: loc.phone || null,
      url: loc.url || null,
      notes: loc.notes || null
    }));

    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .insert(locationsToInsert)
      .select();

    if (locationsError) throw locationsError;
    console.log('Created locations:', locations.length);

    // Create a map for location lookups by name
    const locationMap = new Map(locations.map(l => [l.name, l.id]));

    // 4. Create activity locations and itinerary items
    const activityLocationsToInsert: any[] = [];
    const itemsToInsert: any[] = [];

    for (const activity of ITINERARY_DATA.activities) {
      const day = days[activity.dayIndex];
      let locationId = null;

      // If activity has a location, create it or use existing
      if (activity.location) {
        // Check if we already have this location
        const existingLocationId = locationMap.get(activity.location.name);
        
        if (existingLocationId) {
          locationId = existingLocationId;
        } else {
          // Create new location
          activityLocationsToInsert.push({
            trip_id: trip.id,
            name: activity.location.name,
            category: activity.category,
            lat: activity.location.lat,
            lng: activity.location.lng
          });
        }
      }

      itemsToInsert.push({
        trip_id: trip.id,
        day_id: day.id,
        title: activity.title,
        description: activity.description,
        start_time: activity.time ? `${activity.time}:00` : null,
        category: activity.category,
        item_type: 'activity',
        source: 'import',
        external_ref: `static-${activity.dayIndex}-${activity.title.toLowerCase().replace(/\s+/g, '-')}`,
        sort_index: itemsToInsert.filter(i => i.day_id === day.id).length,
        status: 'planned',
        link: activity.link || null,
        link_label: activity.linkLabel || null,
        phone: activity.phone || null,
        notes: activity.notes || null,
        _temp_location_name: activity.location?.name || null
      });
    }

    // Insert activity locations
    if (activityLocationsToInsert.length > 0) {
      const { data: activityLocations, error: actLocError } = await supabase
        .from('locations')
        .insert(activityLocationsToInsert)
        .select();

      if (actLocError) throw actLocError;
      
      // Add to location map
      activityLocations.forEach(l => locationMap.set(l.name, l.id));
      console.log('Created activity locations:', activityLocations.length);
    }

    // Now set location_id on items and remove temp field
    const finalItems = itemsToInsert.map(item => {
      const { _temp_location_name, ...rest } = item;
      return {
        ...rest,
        location_id: _temp_location_name ? locationMap.get(_temp_location_name) || null : null
      };
    });

    // Insert items
    const { data: items, error: itemsError } = await supabase
      .from('itinerary_items')
      .insert(finalItems)
      .select();

    if (itemsError) throw itemsError;
    console.log('Created items:', items.length);

    // 5. Mark migration as complete in app_settings
    await supabase
      .from('app_settings')
      .upsert({
        setting_key: 'data_migration_version',
        setting_value: '1.0'
      }, { onConflict: 'setting_key' });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Migration completed successfully!',
        summary: {
          trip: trip.id,
          days: days.length,
          locations: locations.length + activityLocationsToInsert.length,
          items: items.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Migration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
