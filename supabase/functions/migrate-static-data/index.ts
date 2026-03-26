import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Static itinerary data embedded for migration
// NOTE: This function is deprecated for Sankofa. Use scripts/seed-sankofa.ts instead.
// Kept as a migration scaffold for future trips.
const ITINERARY_DATA = {
  trip: {
    title: "Sankofa 2026 — Healing, Justice & Sacred Care",
    location_name: "Chicago / Oak Brook, IL",
    start_date: "2026-04-20",
    end_date: "2026-04-26",
    timezone: "America/Chicago"
  },
  days: [
    { date: "2026-04-20", title: "Travel Day — EWR → ORD", dayOfWeek: "Monday" },
    { date: "2026-04-21", title: "Sankofa Day 1 — Opening", dayOfWeek: "Tuesday" },
    { date: "2026-04-22", title: "Sankofa Day 2 — Deep Work", dayOfWeek: "Wednesday" },
    { date: "2026-04-23", title: "Sankofa Day 3 + Chicago", dayOfWeek: "Thursday" },
    { date: "2026-04-24", title: "Sankofa Day 4 — Culture & Heritage", dayOfWeek: "Friday" },
    { date: "2026-04-25", title: "Free Day — Explore Chicago", dayOfWeek: "Saturday" },
    { date: "2026-04-26", title: "Departure Day — ORD → EWR", dayOfWeek: "Sunday" }
  ],
  activities: [
    { dayIndex: 0, time: "10:22", title: "Flight EWR → ORD (UA1525)", description: "United Airlines. Arrive ORD 12:06 PM CT.", category: "transport", notes: "Confirmation: PKMJGM" },
    { dayIndex: 0, time: "15:00", title: "Hotel Check-in", description: "Chicago Marriott Oak Brook", category: "accommodation", location: { name: "Chicago Marriott Oak Brook", lat: 41.8505, lng: -87.9357 } },
    { dayIndex: 1, time: "09:00", title: "Conference Sessions Begin", description: "Opening plenary and morning workshops.", category: "event", location: { name: "Chicago Marriott Oak Brook", lat: 41.8505, lng: -87.9357 } },
    { dayIndex: 2, time: "09:00", title: "Morning Sessions", description: "Full day of conference programming.", category: "event", location: { name: "Chicago Marriott Oak Brook", lat: 41.8505, lng: -87.9357 } },
    { dayIndex: 3, time: "09:00", title: "Morning Sessions", description: "Conference programming continues.", category: "event" },
    { dayIndex: 3, time: "13:00", title: "Downtown Chicago Afternoon", description: "Millennium Park, Art Institute, and Riverwalk.", category: "activity", location: { name: "Millennium Park", lat: 41.8826, lng: -87.6226 } },
    { dayIndex: 4, time: "09:00", title: "Morning Sessions", description: "Conference programming.", category: "event" },
    { dayIndex: 4, time: "13:00", title: "DuSable Black History Museum", description: "First museum in the US dedicated to African American history.", category: "activity", location: { name: "DuSable Black History Museum", lat: 41.7919, lng: -87.6087 } },
    { dayIndex: 5, time: "10:00", title: "Brookfield Zoo", description: "World-renowned zoo, 10 min from hotel.", category: "activity", location: { name: "Brookfield Zoo Chicago", lat: 41.8317, lng: -87.8360 } },
    { dayIndex: 6, time: "07:00", title: "Flight ORD → EWR (UA563)", description: "United Airlines. Arrive EWR 10:20 AM ET.", category: "transport", notes: "Confirmation: PKMJGM" }
  ],
  guideLocations: [
    { name: "Chicago Marriott Oak Brook", category: "accommodation", lat: 41.8505, lng: -87.9357, phone: "630-573-8555", notes: "Conference hotel. 1401 W 22nd St, Oak Brook, IL 60523." },
    { name: "Oakbrook Center", category: "activity", lat: 41.8490, lng: -87.9525, url: "https://www.oakbrookcenter.com/", notes: "Large outdoor shopping center, 5 min walk from hotel. Dining and shops." },
    { name: "Millennium Park", category: "attraction", lat: 41.8826, lng: -87.6226, notes: "Iconic public park with The Bean, Crown Fountain, and Lurie Garden. Free." },
    { name: "Art Institute of Chicago", category: "attraction", lat: 41.8796, lng: -87.6237, phone: "312-443-3600", url: "https://www.artic.edu/", notes: "World-class art museum. 300,000+ works." },
    { name: "DuSable Black History Museum", category: "attraction", lat: 41.7919, lng: -87.6087, phone: "773-947-0600", url: "https://www.dusablemuseum.org/", notes: "First US museum dedicated to African American history." },
    { name: "Graue Mill and Museum", category: "attraction", lat: 41.8310, lng: -87.9370, notes: "Underground Railroad station. Only operating waterwheel gristmill in Illinois." },
    { name: "Brookfield Zoo Chicago", category: "activity", lat: 41.8317, lng: -87.8360, phone: "708-688-8000", url: "https://www.brookfieldzoo.org/", notes: "10 min from hotel. Open 10am-6pm weekends." },
    { name: "Wildfire", category: "restaurant", lat: 41.8495, lng: -87.9520, phone: "630-586-9000", url: "https://www.wildfirerestaurant.com/", notes: "Upscale steakhouse at Oakbrook Center." },
    { name: "Antico Posto", category: "restaurant", lat: 41.8492, lng: -87.9530, phone: "630-586-9200", url: "https://www.anticoposto.com/", notes: "Italian trattoria near Oakbrook Center." },
    { name: "Portillo's", category: "restaurant", lat: 41.8340, lng: -87.9590, phone: "630-596-2910", url: "https://www.portillos.com/", notes: "Chicago institution. Italian beef, hot dogs, chocolate cake shake." },
    { name: "Seasons 52", category: "restaurant", lat: 41.8498, lng: -87.9515, phone: "630-571-4752", url: "https://www.seasons52.com/", notes: "Fresh seasonal grill with health-conscious menu." },
    { name: "O'Hare International Airport", category: "transport", lat: 41.9742, lng: -87.9073, url: "https://www.flychicago.com/ohare/", notes: "25-30 min from hotel. Uber/Lyft recommended." }
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
