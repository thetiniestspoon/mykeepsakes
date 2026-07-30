// ============================================================================
// SANKOFA 2026 — Healing, Justice & Sacred Care
// Conference: April 21-25, 2026 at Chicago Marriott Oak Brook
// Guide & itinerary data for Chicago / Oak Brook, IL
// ============================================================================
// This file contains static itinerary data used as fallback / seed content.
// The app should pull live itinerary data from Supabase (conference_events,
// dispatches tables). This file is kept as a reference and offline fallback
// until the Supabase data pipeline is fully wired.
// See: scripts/seed-sankofa.ts, supabase/migrations/20260323000000_conference_companion.sql
// ============================================================================

export interface Location {
  lat: number;
  lng: number;
  name: string;
  address?: string;
}

export interface Activity {
  id: string;
  time?: string;
  title: string;
  description: string;
  category: 'activity' | 'dining' | 'beach' | 'accommodation' | 'transport' | 'event';
  location?: Location;
  link?: string;
  linkLabel?: string;
  phone?: string;
  mapLink?: string;
  notes?: string;
}

export interface Day {
  id: string;
  date: string;
  dayOfWeek: string;
  title: string;
  activities: Activity[];
}

export interface PackingItem {
  id: string;
  category: string;
  item: string;
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  phone: string;
}

export interface GuideItem {
  id: string;
  name: string;
  category: 'beach' | 'restaurant' | 'activity' | 'shop' | 'attraction' | 'essential' | 'transport' | 'cultural';
  description: string;
  location?: Location;
  link?: string;
  phone?: string;
  mapLink?: string;
}

// Chicago / Oak Brook coordinates (conference hotel area)
export const TRIP_CENTER: Location = {
  lat: 41.8505,
  lng: -87.9357,
  name: "Oak Brook, IL"
};


// Emergency & Important Contacts
export const EMERGENCY_CONTACTS: Contact[] = [
  { id: 'emergency-911', name: 'Emergency Services', role: 'Police/Fire/EMS', phone: '911' },
  { id: 'oak-brook-police', name: 'Oak Brook Police', role: 'Non-Emergency', phone: '630-368-8700' },
  { id: 'advocate-good-sam', name: 'Advocate Good Samaritan Hospital', role: 'Hospital (5 min from hotel)', phone: '630-275-5900' },
  { id: 'loyola-medical', name: 'Loyola University Medical Center', role: 'Hospital / Trauma Center', phone: '708-216-9000' },
  { id: 'walgreens-oak-brook', name: 'Walgreens - Oak Brook', role: 'Pharmacy (open late)', phone: '630-574-0420' },
  { id: 'marriott-front-desk', name: 'Chicago Marriott Oak Brook', role: 'Hotel Front Desk', phone: '630-573-8555' },
  { id: 'sankofa-info', name: 'Sankofa CPE Conference', role: 'Conference Contact', phone: '773-953-9398' },
];

// Getting Around - Chicago / Oak Brook
export const TRANSPORT_INFO = {
  ohare: {
    name: "O'Hare International Airport (ORD)",
    phone: '800-832-6352',
    website: 'https://www.flychicago.com/ohare/',
    schedule: '~25 min drive to Oak Brook (no traffic), 45-60 min with traffic',
    note: 'Rideshare (Uber/Lyft) recommended. Hotel does not offer shuttle from airport.'
  },
  midway: {
    name: 'Midway International Airport (MDW)',
    phone: '800-832-6352',
    website: 'https://www.flychicago.com/midway/',
    schedule: '~30 min drive to Oak Brook',
    note: 'Southwest hub. Smaller, often less traffic than ORD.'
  },
  metra: {
    name: 'Metra BNSF Line',
    website: 'https://metra.com/bnsf',
    schedule: 'Closest station: Westmont or Hinsdale (~10 min drive from hotel)',
    note: 'Connects to downtown Chicago Union Station in ~35 min.'
  },
  cta: {
    name: 'CTA Blue Line (from ORD)',
    website: 'https://www.transitchicago.com/',
    schedule: "O'Hare to downtown ~45 min, then rideshare to Oak Brook",
    note: 'Affordable option to/from the airport ($5 one-way).'
  }
};


// Sankofa 2026 Conference Itinerary — April 20-26, 2026 (Chicago / Oak Brook, IL)
// Flights: UA1525 EWR→ORD Apr 20 (10:22a→12:06p) / UA563 ORD→EWR Apr 26 (7:00a→10:20a)
// Confirmation: PKMJGM | Travelers: Shawn Jordan & Daniel Llanes
export const ITINERARY: Day[] = [
  {
    id: 'day-1',
    date: 'Monday, April 20, 2026',
    dayOfWeek: 'Monday',
    title: 'Travel & Check-In',
    activities: [
      {
        id: 'day1-flight-out',
        time: '10:22 AM',
        title: 'Flight: EWR → ORD (UA1525)',
        description: "United Airlines UA1525, Newark (EWR) to O'Hare (ORD). Departs 10:22 AM, arrives 12:06 PM CT. Economy class. Travelers: Shawn Jordan & Daniel Llanes.",
        category: 'transport',
        location: { lat: 41.9742, lng: -87.9073, name: "O'Hare International Airport" },
        notes: "Confirmation: PKMJGM. Seats: EWR-ORD 31B/29E. Allow 90 min before departure at EWR — aim to leave Maplewood by 7:30 AM."
      },
      {
        id: 'day1-arrive-ord',
        time: '12:06 PM',
        title: "Arrive at O'Hare",
        description: "Land at ORD. Grab bags and Uber/Lyft to Oak Brook — about 25-30 min depending on midday traffic.",
        category: 'transport',
        location: { lat: 41.9742, lng: -87.9073, name: "O'Hare International Airport" },
        notes: "Rideshare pickup at Terminal 1 or 2 (United). Follow signs to 'Rideshare Pickup'."
      },
      {
        id: 'day1-checkin',
        time: '3:00 PM',
        title: 'Check In — Chicago Marriott Oak Brook',
        description: 'Conference hotel. Get settled and explore the property — on-site restaurant, bar, and Starbucks.',
        category: 'accommodation',
        location: { lat: 41.8505, lng: -87.9357, name: 'Chicago Marriott Oak Brook', address: '1401 W 22nd St, Oak Brook, IL 60523' },
        phone: '630-573-8555'
      },
      {
        id: 'day1-explore',
        time: '5:00 PM',
        title: 'Walk to Oakbrook Center',
        description: 'Large outdoor shopping center across the street from the hotel. Good for a stretch, window shopping, and getting your bearings.',
        category: 'activity',
        location: { lat: 41.8490, lng: -87.9525, name: 'Oakbrook Center' },
        link: 'https://www.oakbrookcenter.com/',
        mapLink: 'https://maps.google.com/?q=Oakbrook+Center+Mall'
      },
      {
        id: 'day1-dinner',
        time: '7:00 PM',
        title: 'Dinner at Wildfire',
        description: 'Upscale steakhouse and grill at Oakbrook Center. Wood-fired steaks, chops, and seafood. Great first-night spot.',
        category: 'dining',
        location: { lat: 41.8495, lng: -87.9520, name: 'Wildfire - Oakbrook Center' },
        link: 'https://www.wildfirerestaurant.com/',
        linkLabel: 'View Menu',
        phone: '630-586-9000'
      }
    ]
  },
  {
    id: 'day-2',
    date: 'Tuesday, April 21, 2026',
    dayOfWeek: 'Tuesday',
    title: 'Sankofa Day 1 — Opening',
    activities: [
      {
        id: 'day2-breakfast',
        time: '7:30 AM',
        title: 'Hotel Breakfast',
        description: 'Breakfast at 1401 West Restaurant (on-site at the Marriott) or grab Starbucks in the lobby.',
        category: 'dining',
        location: { lat: 41.8505, lng: -87.9357, name: 'Chicago Marriott Oak Brook' }
      },
      {
        id: 'day2-sessions',
        time: '9:00 AM',
        title: 'Conference Sessions Begin',
        description: 'Opening plenary and morning workshops. Healing, Justice & Sacred Care.',
        category: 'event',
        location: { lat: 41.8505, lng: -87.9357, name: 'Chicago Marriott Oak Brook' }
      },
      {
        id: 'day2-lunch',
        time: '12:00 PM',
        title: 'Lunch Break',
        description: 'Conference lunch or walk to Oakbrook Center for options. Beatrix is a great neighborhood spot with health-conscious menu.',
        category: 'dining',
        location: { lat: 41.8498, lng: -87.9510, name: 'Beatrix - Oakbrook Center' }
      },
      {
        id: 'day2-afternoon',
        time: '1:30 PM',
        title: 'Afternoon Workshops',
        description: 'Afternoon conference sessions and breakout groups.',
        category: 'event'
      },
      {
        id: 'day2-dinner',
        time: '6:30 PM',
        title: 'Group Dinner at Antico Posto',
        description: 'Italian trattoria near the mall. Great pasta, pizza, and wine list. Casual and welcoming for a group.',
        category: 'dining',
        location: { lat: 41.8492, lng: -87.9530, name: 'Antico Posto' },
        link: 'https://www.anticoposto.com/',
        linkLabel: 'View Menu',
        phone: '630-586-9200'
      }
    ]
  },
  {
    id: 'day-3',
    date: 'Wednesday, April 22, 2026',
    dayOfWeek: 'Wednesday',
    title: 'Sankofa Day 2 — Deep Work',
    activities: [
      {
        id: 'day3-breakfast',
        time: '7:30 AM',
        title: 'Breakfast at Hotel',
        description: 'Fuel up for a full day of sessions.',
        category: 'dining'
      },
      {
        id: 'day3-sessions',
        time: '9:00 AM',
        title: 'Morning Sessions',
        description: 'Full day of conference programming.',
        category: 'event',
        location: { lat: 41.8505, lng: -87.9357, name: 'Chicago Marriott Oak Brook' }
      },
      {
        id: 'day3-grauemill',
        time: '12:30 PM',
        title: 'Lunch Break — Visit Graue Mill',
        description: 'Only operating waterwheel gristmill in Illinois and a documented Underground Railroad station. Free admission. 10-minute drive from hotel. Opens mid-April.',
        category: 'activity',
        location: { lat: 41.8310, lng: -87.9370, name: 'Graue Mill and Museum', address: '3800 York Rd, Oak Brook, IL 60523' },
        link: 'https://www.dupageforest.org/places-to-go/centers/graue-mill-and-museum',
        linkLabel: 'Visit Info',
        notes: 'Open Wed-Sun 10am-4pm mid-April through mid-November. Deeply relevant to Sankofa\'s mission — one of three authenticated Underground Railroad stations in Illinois.'
      },
      {
        id: 'day3-afternoon',
        time: '2:00 PM',
        title: 'Afternoon Workshops',
        description: 'Afternoon conference sessions.',
        category: 'event'
      },
      {
        id: 'day3-dinner',
        time: '7:00 PM',
        title: "Portillo's — Chicago Institution",
        description: "You can't come to Chicago and not try Portillo's. Italian beef, Chicago-style hot dogs, and the legendary chocolate cake shake.",
        category: 'dining',
        location: { lat: 41.8340, lng: -87.9590, name: "Portillo's - Downers Grove" },
        link: 'https://www.portillos.com/',
        linkLabel: 'Menu',
        phone: '630-596-2910',
        notes: 'Must-try: Italian beef (dipped, with hot peppers) and the chocolate cake shake.'
      }
    ]
  },
  {
    id: 'day-4',
    date: 'Thursday, April 23, 2026',
    dayOfWeek: 'Thursday',
    title: 'Sankofa Day 3 + Chicago Exploration',
    activities: [
      {
        id: 'day4-sessions',
        time: '9:00 AM',
        title: 'Morning Sessions',
        description: 'Conference programming continues.',
        category: 'event'
      },
      {
        id: 'day4-downtown',
        time: '1:00 PM',
        title: 'Afternoon in Downtown Chicago',
        description: 'Take the Metra BNSF from Hinsdale station (~35 min to Union Station) or rideshare (~30 min). Explore the Magnificent Mile, Millennium Park, and the lakefront.',
        category: 'activity',
        location: { lat: 41.8826, lng: -87.6226, name: 'Millennium Park' },
        mapLink: 'https://maps.google.com/?q=Millennium+Park+Chicago',
        notes: 'Metra BNSF line from Hinsdale or Westmont station is the easiest public transit option. ~$6 one-way.'
      },
      {
        id: 'day4-bean',
        time: '2:00 PM',
        title: 'Cloud Gate & Millennium Park',
        description: 'The iconic "Bean" sculpture, Crown Fountain, and Lurie Garden. Free admission. Perfect for photos.',
        category: 'activity',
        location: { lat: 41.8827, lng: -87.6233, name: 'Cloud Gate (The Bean)' },
        mapLink: 'https://maps.google.com/?q=Cloud+Gate+Chicago'
      },
      {
        id: 'day4-artinstitute',
        time: '3:30 PM',
        title: 'Art Institute of Chicago',
        description: 'World-class art museum across from Millennium Park. 300,000+ works including iconic pieces by Seurat, Hopper, and Grant Wood.',
        category: 'activity',
        location: { lat: 41.8796, lng: -87.6237, name: 'Art Institute of Chicago' },
        link: 'https://www.artic.edu/',
        linkLabel: 'Plan Your Visit',
        phone: '312-443-3600',
        notes: 'Budget 2-3 hours minimum. Thursday evenings are extended hours.'
      },
      {
        id: 'day4-artonmart',
        time: '8:30 PM',
        title: 'Art on theMART',
        description: 'Contemporary artwork projected on the Merchandise Mart building facade. Free outdoor viewing from the Riverwalk. Launches April 23!',
        category: 'activity',
        location: { lat: 41.8885, lng: -87.6354, name: 'theMART - Chicago Riverwalk' },
        link: 'https://www.artonthemart.com/',
        linkLabel: 'Event Info',
        notes: 'Projections run 8:30-9:00 PM, Thu-Sun starting April 23, 2026. Best viewed from the Riverwalk.'
      }
    ]
  },
  {
    id: 'day-5',
    date: 'Friday, April 24, 2026',
    dayOfWeek: 'Friday',
    title: 'Sankofa Day 4 — Culture & Heritage',
    activities: [
      {
        id: 'day5-sessions',
        time: '9:00 AM',
        title: 'Morning Sessions',
        description: 'Conference programming.',
        category: 'event',
        location: { lat: 41.8505, lng: -87.9357, name: 'Chicago Marriott Oak Brook' }
      },
      {
        id: 'day5-dusable',
        time: '1:00 PM',
        title: 'DuSable Black History Museum',
        description: 'First museum in the US dedicated to African American history and culture. Over 15,000 pieces in its archives. Deeply relevant to Sankofa\'s mission of healing and justice.',
        category: 'activity',
        location: { lat: 41.7919, lng: -87.6087, name: 'DuSable Black History Museum' },
        link: 'https://www.dusablemuseum.org/',
        linkLabel: 'Plan Visit',
        phone: '773-947-0600',
        notes: '~30 min drive from hotel. In Washington Park on the South Side.'
      },
      {
        id: 'day5-bronzeville',
        time: '3:30 PM',
        title: 'Walk Through Bronzeville',
        description: 'Historic Black Metropolis neighborhood. Walk the trail of murals, monuments, and cultural landmarks on Martin Luther King Jr. Drive.',
        category: 'activity',
        location: { lat: 41.8183, lng: -87.6167, name: 'Bronzeville Historic District' },
        mapLink: 'https://maps.google.com/?q=Bronzeville+Chicago',
        notes: 'The "Walk of Fame" on King Dr. between 25th and 35th streets honors Black American achievers.'
      },
      {
        id: 'day5-southside',
        time: '4:30 PM',
        title: 'South Side Community Art Center',
        description: 'One of the first Black art centers in the US (est. 1940). Exhibitions, performances, and community programming. A living testament to Black creative resilience.',
        category: 'activity',
        location: { lat: 41.8166, lng: -87.6158, name: 'South Side Community Art Center' },
        link: 'https://www.sscartcenter.org/',
        linkLabel: 'Current Exhibits',
        phone: '773-373-1026'
      },
      {
        id: 'day5-farewell',
        time: '7:00 PM',
        title: 'Conference Farewell Dinner',
        description: 'Closing dinner for Sankofa 2026. Location TBD by conference organizers.',
        category: 'event'
      }
    ]
  },
  {
    id: 'day-6',
    date: 'Saturday, April 25, 2026',
    dayOfWeek: 'Saturday',
    title: 'Free Day — Explore Chicago',
    activities: [
      {
        id: 'day6-breakfast',
        time: '8:00 AM',
        title: 'Breakfast at Lucca Osteria',
        description: 'Sit-down brunch just 0.1 miles from the Marriott. No conference schedule today — take it easy.',
        category: 'dining',
        location: { lat: 41.8508, lng: -87.9350, name: 'Lucca Osteria & Bar' }
      },
      {
        id: 'day6-zoo',
        time: '10:00 AM',
        title: 'Brookfield Zoo',
        description: 'World-renowned zoo, just 10 minutes from the hotel. Adults $24.95, kids 3-11 $17.95.',
        category: 'activity',
        location: { lat: 41.8317, lng: -87.8360, name: 'Brookfield Zoo Chicago' },
        link: 'https://www.brookfieldzoo.org/',
        linkLabel: 'Buy Tickets',
        phone: '708-688-8000',
        notes: 'Open 10am-6pm weekends. Parking $17-20. Only 10 min drive from hotel!'
      },
      {
        id: 'day6-downtown',
        time: '2:00 PM',
        title: 'Afternoon in the City',
        description: 'Last chance to hit anything you missed — Magnificent Mile, the Riverwalk, deep-dish pizza. Metra BNSF from Hinsdale (~35 min to Union Station) or rideshare.',
        category: 'activity',
        location: { lat: 41.8826, lng: -87.6226, name: 'Downtown Chicago' },
        notes: 'Lou Malnati\'s or Giordano\'s for deep dish if you haven\'t yet.'
      },
      {
        id: 'day6-dinner',
        time: '7:00 PM',
        title: 'Final Dinner — Seasons 52',
        description: 'Fresh seasonal grill at Oakbrook Center. Nice wine selection and mini desserts. Good send-off dinner close to the hotel.',
        category: 'dining',
        location: { lat: 41.8498, lng: -87.9515, name: 'Seasons 52' },
        link: 'https://www.seasons52.com/',
        linkLabel: 'View Menu',
        phone: '630-571-4752'
      },
      {
        id: 'day6-pack',
        time: '9:30 PM',
        title: 'Pack Up — Early Flight Tomorrow',
        description: 'Flight departs ORD at 7:00 AM. Uber pickup around 4:30 AM. Pack tonight, set two alarms.',
        category: 'accommodation',
        notes: 'Request late checkout or store luggage at front desk if exploring during the day. Final checkout tonight.'
      }
    ]
  },
  {
    id: 'day-7',
    date: 'Sunday, April 26, 2026',
    dayOfWeek: 'Sunday',
    title: 'Departure Day',
    activities: [
      {
        id: 'day7-wakeup',
        time: '4:00 AM',
        title: 'Wake Up & Check Out',
        description: 'Early morning — 7:00 AM flight means leaving the hotel by 4:30 AM latest. Express checkout at the front desk or use the Marriott app.',
        category: 'accommodation',
        location: { lat: 41.8505, lng: -87.9357, name: 'Chicago Marriott Oak Brook' }
      },
      {
        id: 'day7-to-airport',
        time: '4:30 AM',
        title: "Uber to O'Hare",
        description: "Sunday early morning — expect 20-25 min to ORD with no traffic. Schedule the Uber the night before.",
        category: 'transport',
        notes: 'Pre-schedule Uber/Lyft for 4:30 AM. Sunday morning traffic will be minimal.'
      },
      {
        id: 'day7-flight-home',
        time: '7:00 AM',
        title: 'Flight: ORD → EWR (UA563)',
        description: "United Airlines UA563, O'Hare (ORD) to Newark (EWR). Departs 7:00 AM CT, arrives 10:20 AM ET. Economy class. Travelers: Shawn Jordan & Daniel Llanes.",
        category: 'transport',
        location: { lat: 41.9742, lng: -87.9073, name: "O'Hare International Airport" },
        notes: "Confirmation: PKMJGM. Seats: ORD-EWR 31C/29D. Arrive EWR by 10:20 AM — home to Maplewood by noon."
      },
      {
        id: 'day7-arrive-home',
        time: '10:20 AM',
        title: 'Arrive Newark — Home',
        description: 'Land at EWR. Grab bags and head home to Maplewood. Welcome back!',
        category: 'transport',
        location: { lat: 40.6895, lng: -74.1745, name: 'Newark Liberty International Airport' }
      }
    ]
  }
];

// Packing List — Chicago in Late April (expect 50-65°F, variable weather)
export const PACKING_LIST: PackingItem[] = [
  { id: 'pack-1', category: 'Layers', item: 'Light jacket or blazer' },
  { id: 'pack-2', category: 'Layers', item: 'Sweater or fleece for chilly mornings' },
  { id: 'pack-3', category: 'Layers', item: 'Rain jacket or compact umbrella' },
  { id: 'pack-4', category: 'Layers', item: 'Scarf or wrap (wind off the lake)' },
  { id: 'pack-5', category: 'Clothing', item: 'Comfortable walking shoes (city exploring)' },
  { id: 'pack-6', category: 'Clothing', item: 'Conference-appropriate outfits (4-5 days)' },
  { id: 'pack-7', category: 'Clothing', item: 'One nice dinner outfit' },
  { id: 'pack-8', category: 'Clothing', item: 'Casual clothes for museum/zoo days' },
  { id: 'pack-9', category: 'Conference', item: 'Notebook and pens' },
  { id: 'pack-10', category: 'Conference', item: 'Business cards' },
  { id: 'pack-11', category: 'Conference', item: 'Laptop and charger' },
  { id: 'pack-12', category: 'Conference', item: 'Printed schedule / badge info' },
  { id: 'pack-13', category: 'Essentials', item: 'Phone charger / portable battery' },
  { id: 'pack-14', category: 'Essentials', item: 'Prescription medications' },
  { id: 'pack-15', category: 'Essentials', item: 'Sunglasses (April sun is bright!)' },
  { id: 'pack-16', category: 'Essentials', item: 'Reusable water bottle' },
  { id: 'pack-17', category: 'Essentials', item: 'Snacks for travel days' },
  { id: 'pack-18', category: 'Essentials', item: 'Cash + credit cards (some spots are cash-only)' },
  { id: 'pack-19', category: 'Travel', item: 'ID / boarding pass' },
  { id: 'pack-20', category: 'Travel', item: 'Ventra card or transit app (CTA/Metra)' },
];

// Guide - Chicago Highlights & Attractions
export const CHICAGO_HIGHLIGHTS: GuideItem[] = [
  {
    id: 'highlight-millennium',
    name: 'Millennium Park & Cloud Gate',
    category: 'attraction',
    description: 'Iconic public park featuring "The Bean" sculpture, Crown Fountain, and Lurie Garden. Free admission.',
    location: { lat: 41.8826, lng: -87.6226, name: 'Millennium Park' },
    mapLink: 'https://maps.google.com/?q=Millennium+Park+Chicago',
    link: 'https://www.chicago.gov/city/en/depts/dca/supp_info/millennium_park.html'
  },
  {
    id: 'highlight-art-institute',
    name: 'Art Institute of Chicago',
    category: 'attraction',
    description: 'World-class art museum with 300,000+ works. Home to iconic pieces by Seurat, Hopper, and Grant Wood.',
    location: { lat: 41.8796, lng: -87.6237, name: 'Art Institute of Chicago' },
    link: 'https://www.artic.edu/',
    phone: '312-443-3600',
    mapLink: 'https://maps.google.com/?q=Art+Institute+of+Chicago'
  },
  {
    id: 'highlight-navy-pier',
    name: 'Navy Pier',
    category: 'attraction',
    description: 'Lakefront landmark with Centennial Wheel, restaurants, and boat tours. Great views of the skyline.',
    location: { lat: 41.8917, lng: -87.6086, name: 'Navy Pier' },
    link: 'https://navypier.org/',
    phone: '312-595-7437',
    mapLink: 'https://maps.google.com/?q=Navy+Pier+Chicago'
  },
  {
    id: 'highlight-willis',
    name: 'Willis Tower Skydeck',
    category: 'attraction',
    description: 'Step onto The Ledge glass balcony 1,353 feet up for breathtaking city views.',
    location: { lat: 41.8789, lng: -87.6359, name: 'Willis Tower' },
    link: 'https://theskydeck.com/',
    phone: '312-875-9696',
    mapLink: 'https://maps.google.com/?q=Willis+Tower+Chicago'
  },
  {
    id: 'highlight-msi',
    name: 'Museum of Science & Industry',
    category: 'attraction',
    description: 'Largest science museum in the Western hemisphere. U-505 submarine, coal mine tour, and more.',
    location: { lat: 41.7906, lng: -87.5831, name: 'Museum of Science & Industry' },
    link: 'https://www.msichicago.org/',
    phone: '773-684-1414',
    mapLink: 'https://maps.google.com/?q=Museum+of+Science+and+Industry+Chicago'
  }
];


// Guide - Where to Eat (city picks first by neighborhood, Oak Brook spots after)
export const RESTAURANTS: GuideItem[] = [
  // ─── City picks (alphabetical by neighborhood) ───────────────────────────
  {
    id: 'rest-xocome-antojeria',
    name: 'Xocome Antojeria',
    category: 'restaurant',
    description: 'Archer Heights. Tacos. Blue-corn handmade tortillas and regional Mexican cooking — Chicago Magazine Restaurant of the Year. Counter service, 10a–7:30p daily. Worth the trek.',
    location: { lat: 41.8001271, lng: -87.7348724, name: 'Xocome Antojeria — 5200 S Archer Ave' },
    phone: '(773) 498-6679',
    mapLink: 'https://maps.google.com/?q=Xocome+Antojeria+5200+S+Archer+Ave+Chicago',
  },
  {
    id: 'rest-vito-and-nicks',
    name: "Vito & Nick's Pizzeria",
    category: 'restaurant',
    description: 'Ashburn (Southwest Side). Pizza. Tavern-style thin crust cut into squares — the Chicago "party cut" done right. Family-run since 1965, no reservations, bring cash.',
    location: { lat: 41.7392952, lng: -87.7212480, name: "Vito & Nick's — 8433 S Pulaski Rd" },
    mapLink: 'https://maps.google.com/?q=Vito+and+Nicks+Pizzeria+8433+S+Pulaski+Chicago',
  },
  {
    id: 'rest-patty-please',
    name: 'Patty Please',
    category: 'restaurant',
    description: 'Avondale (pop-up at Small Bar). Burgers. The Pleaser ($12, no fries) — two smash patties, American, onion, pleaser sauce, pickles. Cash-easy, low-frills, excellent.',
    location: { lat: 41.9355689, lng: -87.7053387, name: 'Patty Please — 2956 N Albany Ave' },
    mapLink: 'https://maps.google.com/?q=Patty+Please+2956+N+Albany+Ave+Chicago',
  },
  {
    id: 'rest-la-internacional',
    name: 'La Internacional',
    category: 'restaurant',
    description: 'Back of the Yards. Tacos. Supermercado with an adjoining taqueria counter — al pastor, asada, carnitas, all under $3. Cult favorite.',
    location: { lat: 41.8112096, lng: -87.6651493, name: 'La Internacional — 4556 S Ashland Ave' },
    phone: '(773) 523-9745',
    mapLink: 'https://maps.google.com/?q=La+Internacional+4556+S+Ashland+Ave+Chicago',
  },
  {
    id: 'rest-momotaro',
    name: 'Momotaro',
    category: 'restaurant',
    description: 'Fulton Market. Sushi / Japanese. Boka Group\'s upscale three-floor temple — robata grill, sushi counter, hidden basement izakaya. Dressy, date-night tier.',
    location: { lat: 41.8859058, lng: -87.6484698, name: 'Momotaro — 820 W Lake St' },
    mapLink: 'https://maps.google.com/?q=Momotaro+820+W+Lake+St+Chicago',
  },
  {
    id: 'rest-taqueria-chingon',
    name: 'Taqueria Chingón',
    category: 'restaurant',
    description: 'Fulton Market. Tacos. Modern taqueria from chef Jonathan Zaragoza — handmade masa, regional Mexican focus.',
    location: { lat: 41.886567, lng: -87.648217, name: 'Taqueria Chingón — 817 W Fulton Market' },
    link: 'https://taqueriachingon.com',
    mapLink: 'https://maps.google.com/?q=Taqueria+Chingon+817+W+Fulton+Market+Chicago',
  },
  {
    id: 'rest-gibsons',
    name: 'Gibsons Bar & Steakhouse',
    category: 'restaurant',
    description: 'Gold Coast / Rush Street. Steak. Chicago institution since 1989 — massive steaks, old-school showmanship, politicians + tourists in equal parts. Reservations a must.',
    location: { lat: 41.9013564, lng: -87.6280782, name: 'Gibsons — 1028 N Rush St' },
    link: 'https://gibsonssteakhouse.com/gibsons-chicago/',
    mapLink: 'https://maps.google.com/?q=Gibsons+1028+N+Rush+St+Chicago',
  },
  {
    id: 'rest-maple-and-ash',
    name: 'Maple & Ash',
    category: 'restaurant',
    description: 'Gold Coast. Steak. Wood-fire-driven, second-floor steakhouse — sommelier-forward wine list, signature tomahawk, party-energy weekends. Reservations essential.',
    location: { lat: 41.9019662, lng: -87.6287408, name: 'Maple & Ash — 8 W Maple St' },
    mapLink: 'https://maps.google.com/?q=Maple+and+Ash+8+W+Maple+St+Chicago',
  },
  {
    id: 'rest-3lp-chi',
    name: '3LP Chi',
    category: 'restaurant',
    description: 'Hyde Park. Italian beef + fried chicken. "3 Little Pigs" — hybrid Italian-beef / fried-chicken-sandwich shop near U of Chicago. Counter service. Pairs with 5 Rabanitos for a Hyde Park crawl.',
    location: { lat: 41.7912792, lng: -87.5939365, name: '3LP Chi — 1321 E 57th St' },
    link: 'https://www.eat3lp.com/',
    mapLink: 'https://maps.google.com/?q=3LP+Chi+1321+E+57th+St+Chicago',
  },
  {
    id: 'rest-5-rabanitos',
    name: '5 Rabanitos',
    category: 'restaurant',
    description: 'Hyde Park. Tacos. Chef Alfonso Sotelo (Topolobampo alum) making traditional moles, handmade tortillas, deeply flavored tacos. BYOB, reservations accepted.',
    location: { lat: 41.7993384, lng: -87.5948433, name: '5 Rabanitos — 1301 E 53rd St' },
    mapLink: 'https://maps.google.com/?q=5+Rabanitos+1301+E+53rd+St+Chicago',
  },
  {
    id: 'rest-chilam-balam',
    name: 'Chilam Balam',
    category: 'restaurant',
    description: 'Lakeview. Mexican (BYOB). Small plates, agave spirits, intimate room. Long-running Lakeview favorite.',
    location: { lat: 41.971605, lng: -87.659732, name: 'Chilam Balam — 3023 N Broadway St' },
    link: 'https://chilambalamchicago.com',
    mapLink: 'https://maps.google.com/?q=Chilam+Balam+3023+N+Broadway+Chicago',
  },
  {
    id: 'rest-pequods',
    name: "Pequod's Pizza",
    category: 'restaurant',
    description: 'Lincoln Park. Pizza. Famous for the caramelized-cheese crust — a pan-pizza variant unique to Pequod\'s. In Lincoln Park since 1992. Expect a wait at peak.',
    location: { lat: 41.9219163, lng: -87.6643863, name: "Pequod's — 2207 N Clybourn Ave" },
    link: 'https://pequodspizza.com/chicago/',
    phone: '773-327-1512',
    mapLink: 'https://maps.google.com/?q=Pequods+Pizza+2207+N+Clybourn+Chicago',
  },
  {
    id: 'rest-als-italian-beef',
    name: "Al's #1 Italian Beef",
    category: 'restaurant',
    description: 'Little Italy / Taylor Street. Italian beef. The original Al\'s — operating since 1938 and the benchmark for dipped Chicago-style beef. Dipped + hot giardiniera. Stand-up counter.',
    location: { lat: 41.8693169, lng: -87.6540015, name: "Al's #1 — 1079 W Taylor St" },
    link: 'https://www.alsbeef.com/chicago-little-italy-taylor-street',
    mapLink: 'https://maps.google.com/?q=Als+1+Italian+Beef+1079+W+Taylor+Chicago',
  },
  {
    id: 'rest-carms',
    name: "Carm's",
    category: 'restaurant',
    description: 'Little Italy. Italian beef + Italian ice. Old-school stand at Polk & Carpenter — UIC neighborhood institution, cash-friendly, seasonal ice window in summer.',
    location: { lat: 41.8716482, lng: -87.6534228, name: "Carm's — 1057 W Polk St" },
    link: 'https://www.carmslittleitaly.com/',
    phone: '312-738-1046',
    mapLink: 'https://maps.google.com/?q=Carms+1057+W+Polk+St+Chicago',
  },
  {
    id: 'rest-asian-cuisine-express',
    name: 'Asian Cuisine Express',
    category: 'restaurant',
    description: 'Little Village. Tacos. Chinese-owned taqueria famous for Thai-Mexican fusion al pastor — crowned by multiple critics as among the city\'s best. Counter service.',
    location: { lat: 41.8367981, lng: -87.7204303, name: 'Asian Cuisine Express — 3823 W 31st St' },
    phone: '(773) 847-4883',
    mapLink: 'https://maps.google.com/?q=Asian+Cuisine+Express+3823+W+31st+Chicago',
  },
  {
    id: 'rest-best-intentions',
    name: 'Best Intentions',
    category: 'restaurant',
    description: 'Logan Square. Burgers. Neighborhood cocktail bar with a cult smashburger program. Unpretentious, late-night-friendly. Walk-in.',
    location: { lat: 41.9172470, lng: -87.7101436, name: 'Best Intentions — 3281 W Armitage Ave' },
    mapLink: 'https://maps.google.com/?q=Best+Intentions+3281+W+Armitage+Chicago',
  },
  {
    id: 'rest-gretel',
    name: 'Gretel',
    category: 'restaurant',
    description: 'Logan Square. Burgers. Cocktail bar / griddle-burger destination — two-patty Griddle Burger ($19, fries included), oysters, strong beer list. Walk-in.',
    location: { lat: 41.9172689, lng: -87.6985729, name: 'Gretel — 2833 W Armitage Ave' },
    link: 'https://gretelchicago.com/',
    phone: '(773) 770-3427',
    mapLink: 'https://maps.google.com/?q=Gretel+2833+W+Armitage+Ave+Chicago',
  },
  {
    id: 'rest-longman-and-eagle',
    name: 'Longman & Eagle',
    category: 'restaurant',
    description: 'Logan Square. Gastropub. Michelin-starred neighborhood spot with inn rooms upstairs — seasonal menu, deep whiskey list. Reservations recommended.',
    location: { lat: 41.930084, lng: -87.707127, name: 'Longman & Eagle — 2657 N Kedzie Ave' },
    link: 'https://longmanandeagle.com',
    mapLink: 'https://maps.google.com/?q=Longman+and+Eagle+2657+N+Kedzie+Chicago',
  },
  {
    id: 'rest-mi-tocaya',
    name: 'Mi Tocaya Antojería',
    category: 'restaurant',
    description: 'Logan Square. Mexican. Chef Diana Dávila\'s regional Mexican — James Beard semifinalist. Vibrant room, masa-forward menu.',
    location: { lat: 41.92893, lng: -87.69771, name: 'Mi Tocaya — 2800 W Logan Blvd' },
    link: 'https://mitocaya.com',
    phone: '872-315-3947',
    mapLink: 'https://maps.google.com/?q=Mi+Tocaya+Antojeria+2800+W+Logan+Blvd+Chicago',
  },
  {
    id: 'rest-table-donkey-and-stick',
    name: 'Table, Donkey and Stick',
    category: 'restaurant',
    description: 'Logan Square. Alpine-inspired gastropub. NOTE: official site stopped resolving as of 2026-04-10 — verify the spot is still operating before going.',
    location: { lat: 41.917685, lng: -87.695996, name: 'Table, Donkey and Stick — 2728 W Armitage Ave' },
    mapLink: 'https://maps.google.com/?q=Table+Donkey+and+Stick+2728+W+Armitage+Chicago',
  },
  {
    id: 'rest-taco-sublime',
    name: 'Taco Sublime',
    category: 'restaurant',
    description: 'McKinley Park (inside Marz Brewing). Burgers + tacos. Dual-threat pop-up — fried-cheese tacos AND a smashburger that South-Side bloggers rave about. Brewery seating.',
    location: { lat: 41.8277727, lng: -87.6595159, name: 'Taco Sublime @ Marz Brewing — 3630 S Iron St' },
    mapLink: 'https://maps.google.com/?q=Taco+Sublime+3630+S+Iron+St+Chicago',
  },
  {
    id: 'rest-carnitas-uruapan',
    name: 'Carnitas Uruapan',
    category: 'restaurant',
    description: 'Pilsen. Tacos. The Lopez family\'s 1975 original — Michoacán-style carnitas by the pound with handmade tortillas. Cash-friendly, weekend brunch lines. Iconic.',
    location: { lat: 41.8575313, lng: -87.6696912, name: 'Carnitas Uruapan — 1725 W 18th St' },
    mapLink: 'https://maps.google.com/?q=Carnitas+Uruapan+1725+W+18th+St+Chicago',
  },
  {
    id: 'rest-casa-madai',
    name: 'Casa Madai',
    category: 'restaurant',
    description: 'Pilsen. Sushi. Intimate omakase counter — 13- and 15-course tastings only, reserved via Tock. Tue–Sat evenings. Special-occasion price tier.',
    location: { lat: 41.8544443, lng: -87.6560708, name: 'Casa Madai — 2023 S Racine Ave' },
    link: 'https://www.casamadai.com',
    phone: '(872) 342-2105',
    mapLink: 'https://maps.google.com/?q=Casa+Madai+2023+S+Racine+Chicago',
  },
  {
    id: 'rest-spacca-napoli',
    name: 'Spacca Napoli',
    category: 'restaurant',
    description: 'Ravenswood. Pizza. VPN-certified Neapolitan — wood-fired 900°F oven, 60-second bake, San Marzano tomatoes. Chicago\'s reference for traditional Naples pizza.',
    location: { lat: 41.9632016, lng: -87.6737278, name: 'Spacca Napoli — 1769 W Sunnyside Ave' },
    mapLink: 'https://maps.google.com/?q=Spacca+Napoli+1769+W+Sunnyside+Chicago',
  },
  {
    id: 'rest-asador-bastian',
    name: 'Asador Bastian',
    category: 'restaurant',
    description: 'River North. Steak. Basque-inspired asador in an 1883 brownstone — named #1 steak restaurant in North America (World\'s Best Steaks 2025). Reservation-essential splurge.',
    location: { lat: 41.8942259, lng: -87.6347899, name: 'Asador Bastian — 214 W Erie St' },
    link: 'https://www.asadorbastian.com/',
    mapLink: 'https://maps.google.com/?q=Asador+Bastian+214+W+Erie+St+Chicago',
  },
  {
    id: 'rest-bavettes',
    name: "Bavette's Bar & Boeuf",
    category: 'restaurant',
    description: 'River North. Steak. Boka Group\'s velvet-drapes, speakeasy-era French steakhouse. Dry-aged ribeye, classic tableside pomp. Reservations lock 30 days ahead.',
    location: { lat: 41.8892850, lng: -87.6348919, name: "Bavette's — 218 W Kinzie St" },
    mapLink: 'https://maps.google.com/?q=Bavettes+218+W+Kinzie+St+Chicago',
  },
  {
    id: 'rest-frontera-grill',
    name: 'Frontera Grill',
    category: 'restaurant',
    description: 'River North. Regional Mexican. Rick Bayless\'s flagship — pioneering Mexican fine dining since 1987. Reservations a must.',
    location: { lat: 41.890537, lng: -87.630921, name: 'Frontera Grill — 445 N Clark St' },
    link: 'https://fronteragrill.com',
    mapLink: 'https://maps.google.com/?q=Frontera+Grill+445+N+Clark+Chicago',
  },
  {
    id: 'rest-gilt-bar',
    name: 'Gilt Bar',
    category: 'restaurant',
    description: 'River North. Gastropub. Rowhouse bar with Italian-leaning menu — comfortable, dimly lit, late-night friendly.',
    location: { lat: 41.889285, lng: -87.634892, name: 'Gilt Bar — 218 W Kinzie St' },
    link: 'https://giltbarchicago.com',
    mapLink: 'https://maps.google.com/?q=Gilt+Bar+218+W+Kinzie+Chicago',
  },
  {
    id: 'rest-sushi-san',
    name: 'Sushi-san',
    category: 'restaurant',
    description: 'River North. Sushi. Lettuce Entertain You\'s hip-hop-soundtracked sushi room — loud, fun, reasonably priced, solid fish. Reservations recommended; bar takes walk-ins.',
    location: { lat: 41.8914679, lng: -87.6304875, name: 'Sushi-san — 63 W Grand Ave' },
    mapLink: 'https://maps.google.com/?q=Sushi-san+63+W+Grand+Ave+Chicago',
  },
  {
    id: 'rest-zarella',
    name: 'Zarella Pizzeria & Taverna',
    category: 'restaurant',
    description: 'River North. Pizza. Boka Group\'s 2025 pizzeria — artisan + tavern-style pies in a polished tavern setting. Reservation-friendly; walk-in possible at the bar.',
    location: { lat: 41.8917574, lng: -87.6337956, name: 'Zarella — 531 N Wells St' },
    link: 'https://www.zarellachicago.com/',
    mapLink: 'https://maps.google.com/?q=Zarella+531+N+Wells+St+Chicago',
  },
  {
    id: 'rest-buona',
    name: 'Buona',
    category: 'restaurant',
    description: 'Streeterville. Italian beef. Central-Chicago branch of the Buona chain — Buonavolanto family Italian-beef institution since 1981 (original in Berwyn). Counter service, Mag Mile-adjacent.',
    location: { lat: 41.8929717, lng: -87.6175483, name: 'Buona — 613 N McClurg Ct' },
    link: 'https://buona.com/',
    mapLink: 'https://maps.google.com/?q=Buona+613+N+McClurg+Ct+Chicago',
  },
  {
    id: 'rest-tonys-italian-beef',
    name: "Tony's Italian Beef",
    category: 'restaurant',
    description: 'West Lawn (Southwest Side). Italian beef. Cult-favorite Southwest-Side beef stand — often mentioned alongside Johnnie\'s and Al\'s by beef-hunters.',
    location: { lat: 41.7656251, lng: -87.7221580, name: "Tony's — 7007 S Pulaski Rd" },
    link: 'https://www.tonysbeef.com/',
    phone: '(773) 284-6787',
    mapLink: 'https://maps.google.com/?q=Tonys+Italian+Beef+7007+S+Pulaski+Chicago',
  },
  {
    id: 'rest-diego',
    name: 'Diego',
    category: 'restaurant',
    description: 'West Loop. Burgers + Mexican. Chef-driven Baja-Mediterranean spot from Sandoval + Sotelo (opened 2023). Burgers alongside tacos, mezcal, strong cocktails. Reservations recommended.',
    location: { lat: 41.8908482, lng: -87.6594489, name: 'Diego — 459 N Ogden Ave' },
    link: 'https://www.diegochicago.com/',
    mapLink: 'https://maps.google.com/?q=Diego+459+N+Ogden+Ave+Chicago',
  },
  {
    id: 'rest-girl-and-the-goat',
    name: 'Girl & the Goat',
    category: 'restaurant',
    description: 'West Loop / Fulton Market. New American. Stephanie Izard\'s flagship — bold flavors, shared plates. Reservations essential.',
    location: { lat: 41.884175, lng: -87.647889, name: 'Girl & the Goat — 809 W Randolph St' },
    link: 'https://girlandthegoat.com/chicago',
    mapLink: 'https://maps.google.com/?q=Girl+and+the+Goat+809+W+Randolph+Chicago',
  },
  {
    id: 'rest-boeufhaus',
    name: 'Boeufhaus',
    category: 'restaurant',
    description: 'West Town (Smith Park). Steak. Neighborhood dry-aged steakhouse — smaller, earnest, in-house butchery, strong natural-wine list. Reservations on weekends.',
    location: { lat: 41.8998468, lng: -87.6871843, name: 'Boeufhaus — 1012 N Western Ave' },
    mapLink: 'https://maps.google.com/?q=Boeufhaus+1012+N+Western+Chicago',
  },
  {
    id: 'rest-kai-zan',
    name: 'Kai Zan',
    category: 'restaurant',
    description: 'West Town. Sushi. Twin-chef (Carlo + Melvin Imamura) sushi-ya, warm and personal — extensive omakase + à la carte. Reservations essential.',
    location: { lat: 41.8955355, lng: -87.6915560, name: 'Kai Zan — 2557 W Chicago Ave' },
    mapLink: 'https://maps.google.com/?q=Kai+Zan+2557+W+Chicago+Ave+Chicago',
  },
  {
    id: 'rest-noriko-handroll-bar',
    name: 'Noriko Handroll Bar',
    category: 'restaurant',
    description: 'West Town. Sushi. Hidden handroll bar beneath Michelin-recognized Perilla Fare — enter via Perilla, check in with the host. Nori-forward rapid-fire counter omakase. Book ahead.',
    location: { lat: 41.8893525, lng: -87.6445067, name: 'Noriko — 401 N Milwaukee Ave (under Perilla Fare)' },
    link: 'https://www.norikohandrollbar.com',
    mapLink: 'https://maps.google.com/?q=Noriko+Handroll+Bar+401+N+Milwaukee+Chicago',
  },
  {
    id: 'rest-pizzamici',
    name: "Pizz'amici",
    category: 'restaurant',
    description: 'West Town. Pizza. BYOB Italian-style pies — thinner, blistered crust, small menu, neighborhood feel. Wed–Sun dinners only.',
    location: { lat: 41.8908383, lng: -87.6580640, name: "Pizz'amici — 1215 W Grand Ave" },
    link: 'https://www.pizz-amici.com/',
    phone: '312-285-2382',
    mapLink: 'https://maps.google.com/?q=Pizzamici+1215+W+Grand+Ave+Chicago',
  },

  // ─── Near the hotel (Oak Brook & nearby) ─────────────────────────────────
  {
    id: 'rest-wildfire',
    name: 'Wildfire',
    category: 'restaurant',
    description: 'Upscale steakhouse and grill at Oakbrook Center. Wood-fired steaks, chops, and seafood.',
    location: { lat: 41.8495, lng: -87.9520, name: 'Wildfire - Oakbrook Center' },
    link: 'https://www.wildfirerestaurant.com/',
    phone: '630-586-9000',
    mapLink: 'https://maps.google.com/?q=Wildfire+Oakbrook+Center'
  },
  {
    id: 'rest-antico-posto',
    name: 'Antico Posto',
    category: 'restaurant',
    description: 'Italian trattoria near the mall. Great pasta, pizza, and wine list. Casual and welcoming.',
    location: { lat: 41.8492, lng: -87.9530, name: 'Antico Posto' },
    link: 'https://www.anticoposto.com/',
    phone: '630-586-9200',
    mapLink: 'https://maps.google.com/?q=Antico+Posto+Oak+Brook'
  },
  {
    id: 'rest-seasons52',
    name: 'Seasons 52',
    category: 'restaurant',
    description: 'Fresh seasonal grill with a health-conscious menu. Nice wine selection and mini desserts.',
    location: { lat: 41.8498, lng: -87.9515, name: 'Seasons 52' },
    link: 'https://www.seasons52.com/',
    phone: '630-571-4752',
    mapLink: 'https://maps.google.com/?q=Seasons+52+Oak+Brook'
  },
  {
    id: 'rest-oakbrook-food-hall',
    name: 'Oakbrook Center Food Hall',
    category: 'restaurant',
    description: 'Multiple quick-service options at the outdoor mall, 5 min from hotel. Variety for every taste.',
    location: { lat: 41.8490, lng: -87.9525, name: 'Oakbrook Center' },
    link: 'https://www.oakbrookcenter.com/',
    mapLink: 'https://maps.google.com/?q=Oakbrook+Center+Mall'
  },
  {
    id: 'rest-marriott-dining',
    name: 'Chicago Marriott Oak Brook (On-Site)',
    category: 'restaurant',
    description: 'Hotel restaurant and bar for convenient meals between sessions. Room service also available.',
    location: { lat: 41.8505, lng: -87.9357, name: 'Chicago Marriott Oak Brook' },
    phone: '630-573-8555'
  },
  {
    id: 'rest-portillos',
    name: "Portillo's Hot Dogs",
    category: 'restaurant',
    description: "Chicago institution! Italian beef, Chicago-style hot dogs, and chocolate cake shake. Don't miss it.",
    location: { lat: 41.8340, lng: -87.9590, name: "Portillo's - Downers Grove" },
    link: 'https://www.portillos.com/',
    phone: '630-596-2910',
    mapLink: "https://maps.google.com/?q=Portillo's+Downers+Grove"
  }
];

// Guide - Getting Around & Essentials
export const ACTIVITIES: GuideItem[] = [
  {
    id: 'essential-weather',
    name: 'Late April Weather Tips',
    category: 'essential',
    description: 'Expect 50-65\u00B0F (10-18\u00B0C). Dress in layers! Mornings can be chilly, afternoons pleasant. Rain is possible -- pack a light rain jacket and umbrella.',
  },
  {
    id: 'essential-walgreens',
    name: 'Walgreens - Oakbrook Terrace',
    category: 'essential',
    description: 'Pharmacy and convenience store, open late. About 5 minutes from the hotel.',
    location: { lat: 41.8580, lng: -87.9580, name: 'Walgreens' },
    phone: '630-574-0420',
    mapLink: 'https://maps.google.com/?q=Walgreens+Oakbrook+Terrace+IL'
  },
  {
    id: 'essential-cvs',
    name: 'CVS Pharmacy - Oak Brook',
    category: 'essential',
    description: 'Another pharmacy option nearby with extended hours.',
    location: { lat: 41.8470, lng: -87.9490, name: 'CVS Pharmacy' },
    phone: '630-368-0075',
    mapLink: 'https://maps.google.com/?q=CVS+Pharmacy+Oak+Brook+IL'
  },
  {
    id: 'essential-hospital',
    name: 'Advocate Good Samaritan Hospital',
    category: 'essential',
    description: 'Full-service hospital with ER, about 5 minutes from the Marriott.',
    location: { lat: 41.8579, lng: -87.9746, name: 'Advocate Good Samaritan Hospital' },
    phone: '630-275-5900',
    link: 'https://www.advocatehealth.com/good-samaritan/',
    mapLink: 'https://maps.google.com/?q=Advocate+Good+Samaritan+Hospital+Downers+Grove'
  },
  {
    id: 'transport-ohare',
    name: "O'Hare International Airport (ORD)",
    category: 'transport',
    description: '~25 min drive to hotel (no traffic), 45-60 min with traffic. Uber/Lyft recommended.',
    location: { lat: 41.9742, lng: -87.9073, name: "O'Hare International Airport" },
    link: 'https://www.flychicago.com/ohare/',
    mapLink: "https://maps.google.com/?q=O'Hare+International+Airport"
  },
  {
    id: 'transport-midway',
    name: 'Midway International Airport (MDW)',
    category: 'transport',
    description: '~30 min drive to hotel. Southwest hub -- smaller and often less congested than ORD.',
    location: { lat: 41.7868, lng: -87.7522, name: 'Midway International Airport' },
    link: 'https://www.flychicago.com/midway/',
    mapLink: 'https://maps.google.com/?q=Midway+International+Airport'
  },
  {
    id: 'transport-metra',
    name: 'Metra BNSF Line (to Downtown)',
    category: 'transport',
    description: 'Closest station: Westmont or Hinsdale (~10 min drive). Connects to Union Station in ~35 min. Great for exploring downtown.',
    link: 'https://metra.com/bnsf'
  }
];

// Guide - Cultural Sites (relevant to Sankofa's mission)
export const EVENTS: GuideItem[] = [
  {
    id: 'cultural-dusable',
    name: 'DuSable Black History Museum',
    category: 'cultural',
    description: 'First museum in the US dedicated to African American history and culture. Deeply relevant to Sankofa\'s mission of healing and justice.',
    location: { lat: 41.7919, lng: -87.6087, name: 'DuSable Black History Museum' },
    link: 'https://www.dusablemuseum.org/',
    phone: '773-947-0600',
    mapLink: 'https://maps.google.com/?q=DuSable+Black+History+Museum+Chicago'
  },
  {
    id: 'cultural-bronzeville',
    name: 'Bronzeville Historic District',
    category: 'cultural',
    description: 'Historic Black Metropolis neighborhood. Walk the trail of murals, monuments, and cultural landmarks on Martin Luther King Jr. Drive.',
    location: { lat: 41.8183, lng: -87.6167, name: 'Bronzeville' },
    mapLink: 'https://maps.google.com/?q=Bronzeville+Chicago'
  },
  {
    id: 'cultural-south-side-mural',
    name: 'South Side Community Art Center',
    category: 'cultural',
    description: 'One of the first Black art centers in the US (est. 1940). Exhibitions, performances, and community programming.',
    location: { lat: 41.8166, lng: -87.6158, name: 'South Side Community Art Center' },
    link: 'https://www.sscartcenter.org/',
    phone: '773-373-1026',
    mapLink: 'https://maps.google.com/?q=South+Side+Community+Art+Center+Chicago'
  },
  {
    id: 'cultural-hotel-area',
    name: 'Oak Brook Area & Oakbrook Center',
    category: 'activity',
    description: 'The conference hotel is in suburban Oak Brook. Oakbrook Center is a large outdoor shopping mall 5 min away with dining, shopping, and walking paths.',
    location: { lat: 41.8490, lng: -87.9525, name: 'Oakbrook Center' },
    link: 'https://www.oakbrookcenter.com/',
    mapLink: 'https://maps.google.com/?q=Oakbrook+Center+Mall'
  }
];

// Get all locations for map
export function getAllLocations(): (Location & { itemId: string; itemType: string })[] {
  const locations: (Location & { itemId: string; itemType: string })[] = [];
  
  // Add locations from itinerary
  ITINERARY.forEach(day => {
    day.activities.forEach(activity => {
      if (activity.location) {
        locations.push({
          ...activity.location,
          itemId: activity.id,
          itemType: activity.category
        });
      }
    });
  });
  
  // Add Chicago highlights / attractions
  CHICAGO_HIGHLIGHTS.forEach(highlight => {
    if (highlight.location) {
      locations.push({
        ...highlight.location,
        itemId: highlight.id,
        itemType: 'attraction'
      });
    }
  });
  
  // Add restaurants
  RESTAURANTS.forEach(restaurant => {
    if (restaurant.location) {
      locations.push({
        ...restaurant.location,
        itemId: restaurant.id,
        itemType: 'restaurant'
      });
    }
  });

  return locations;
}

// ============================================================================
// CHARLESTON 2026 — "Charleston, all of us"
// Aug 14-21, 2026. Base: 1558 S Pinebark Ln, West Ashley. 12 adults, 5 kids.
// Source: .planning/charleston-2026-itinerary.html (ingested 2026-07-29)
// ----------------------------------------------------------------------------
// Added alongside the Sankofa arrays above, NOT merged into them. Everything
// above this line is untouched, so the Sankofa trip renders exactly the objects
// it rendered before. Trip selection happens in getGuideSet() at the bottom.
//
// `location` is omitted where the venue's coordinates could not be verified —
// a missing pin is honest; a pin in the wrong neighbourhood is not. The address
// still travels in the description. See .planning/CHARLESTON-2026-AUDIT.md §7.
// ============================================================================

// Guide - Charleston attractions (the things the days are built around)
export const CHARLESTON_HIGHLIGHTS: GuideItem[] = [
  {
    id: 'chs-highlight-aquarium',
    name: 'South Carolina Aquarium',
    category: 'attraction',
    description: 'Downtown waterfront. Open 9-5, last entry 3:30. The Zucker Family Sea Turtle Recovery is the thing the kids will still be talking about at the send-off dinner. Book timed entry for all 17 in advance -- weekends sell out.',
    location: { lat: 32.7910697, lng: -79.9254807, name: 'South Carolina Aquarium', address: '100 Aquarium Wharf, Charleston, SC' },
    link: 'https://scaquarium.org/',
    mapLink: 'https://maps.google.com/?q=South+Carolina+Aquarium+100+Aquarium+Wharf+Charleston+SC'
  },
  {
    id: 'chs-highlight-childrens-museum',
    name: "Children's Museum of the Lowcountry",
    category: 'attraction',
    description: 'Downtown, ~20 min from base. A pirate ship to captain, a working splash pad, an art studio and a STEM lab -- built for exactly the 4-to-7 range. Doubles as the rain plan.',
    location: { lat: 32.7891769, lng: -79.9375054, name: "Children's Museum of the Lowcountry", address: '25 Ann St, Charleston, SC' },
    link: 'https://explorecml.org/',
    mapLink: 'https://maps.google.com/?q=Childrens+Museum+of+the+Lowcountry+25+Ann+St+Charleston+SC'
  },
  {
    id: 'chs-highlight-birds-of-prey',
    name: 'Center for Birds of Prey',
    category: 'attraction',
    description: 'Awendaw, ~40-45 min -- the one deliberate exception to the 40-minute radius. THU-SAT ONLY, 10-4, with the guided tour and flight demonstration at 10:30. That is why it lands on Thursday: it is here or nowhere, since Saturday is the pirate cruise. 4719 Hwy 17 N, Awendaw.',
    link: 'https://thecenterforbirdsofprey.org/',
    mapLink: 'https://maps.google.com/?q=Center+for+Birds+of+Prey+4719+Highway+17+Awendaw+SC'
  },
  {
    id: 'chs-highlight-middleton',
    name: 'Middleton Place',
    category: 'attraction',
    description: 'Ashley River Road, ~20-25 min from base. The Equestrian Center runs a guided trail ride along the Ashley River, about an hour, one rider to one horse -- riders 8 and up only. 4300 Ashley River Rd.',
    link: 'https://www.middletonplace.org/',
    mapLink: 'https://maps.google.com/?q=Middleton+Place+4300+Ashley+River+Road+Charleston+SC'
  },
  {
    id: 'chs-highlight-magnolia',
    name: 'Magnolia Plantation & Gardens',
    category: 'attraction',
    description: 'Ashley River Road, minutes from Middleton. Petting zoo (goats, whitetail deer), gardens and the nature tram, all on general admission. Peacock Cafe on the grounds is where the age-split reunites for lunch. The wildlife boat tour was listed closed for the season -- bonus if it is back.',
    location: { lat: 32.8746113, lng: -80.0832425, name: 'Magnolia Plantation & Gardens', address: '3550 Ashley River Rd, Charleston, SC' },
    link: 'https://www.magnoliaplantation.com/',
    mapLink: 'https://maps.google.com/?q=Magnolia+Plantation+and+Gardens+Charleston+SC'
  },
  {
    id: 'chs-highlight-pirates',
    name: 'Pirates of Charleston -- the Black Ghost',
    category: 'attraction',
    description: 'ANCHOR: already booked by Mom, nothing to plan. Every kid is sworn in as crew -- water cannons, a treasure hunt, maps to read, and a sword battle with Sneaky Pete. Confirm the departure dock with Mom; the source names no address.',
    link: 'https://www.piratesofcharleston.com/',
    mapLink: 'https://maps.google.com/?q=Pirates+of+Charleston+SC'
  }
];

// Guide - Charleston out of doors (free, easy, close)
export const CHARLESTON_OUTDOORS: GuideItem[] = [
  {
    id: 'chs-out-folly',
    name: 'Folly Beach',
    category: 'beach',
    description: 'The closest real beach to Pinebark Lane, ~20-25 min via Folly Rd, and easy for a group this size -- wide sand, gentle surf. Claim a stretch early; bring shade for the littlest kids and the grandparents both.',
    location: { lat: 32.6549715, lng: -79.9396423, name: 'Folly Beach', address: 'Folly Beach, SC' },
    mapLink: 'https://maps.google.com/?q=Folly+Beach+SC'
  },
  {
    id: 'chs-out-angel-oak',
    name: 'The Angel Oak',
    category: 'attraction',
    description: 'Johns Island. Free, and a genuinely easy ten-minute stop -- a 400-year-old live oak with limbs that touch the ground. Good for restless legs after a morning of standing around gardens.',
    location: { lat: 32.7170450, lng: -80.0804039, name: 'The Angel Oak', address: '3688 Angel Oak Rd, Johns Island, SC' },
    mapLink: 'https://maps.google.com/?q=Angel+Oak+3688+Angel+Oak+Rd+Johns+Island+SC'
  },
  {
    id: 'chs-out-waterfront-park',
    name: 'Waterfront Park & the Pineapple Fountain',
    category: 'attraction',
    description: 'Downtown, a five-minute walk from the aquarium. Wading in the fountain is allowed and expected, and there is a second splash fountain too. Bring a towel and a change of clothes for the little ones.',
    location: { lat: 32.7788542, lng: -79.9256069, name: 'Waterfront Park', address: 'Vendue Range, Charleston, SC' },
    mapLink: 'https://maps.google.com/?q=Waterfront+Park+Charleston+SC'
  },
  {
    id: 'chs-out-battery',
    name: 'The Battery & White Point Garden',
    category: 'attraction',
    description: 'The south end of the peninsula -- for whoever still has legs after the fountain.',
    location: { lat: 32.7698140, lng: -79.9303481, name: 'White Point Garden', address: 'White Point Garden, Charleston, SC' },
    mapLink: 'https://maps.google.com/?q=White+Point+Garden+Charleston+SC'
  },
  {
    id: 'chs-out-bikeway',
    name: 'West Ashley Bikeway',
    category: 'activity',
    description: 'Two minutes from the house -- the unstructured-morning option when nobody wants to get in a car.',
    location: { lat: 32.7902360, lng: -80.0100880, name: 'West Ashley Bikeway', address: 'West Ashley Bikeway, Charleston, SC' },
    mapLink: 'https://maps.google.com/?q=West+Ashley+Bikeway+Charleston+SC'
  }
];

// Guide - Charleston essentials: the constraints that actually shaped the week
export const CHARLESTON_ESSENTIALS: GuideItem[] = [
  {
    id: 'chs-ess-flights',
    name: 'Flights -- UA 2355 out, UA 674 back',
    category: 'transport',
    description: 'Out: UA 2355, EWR to CHS, Fri Aug 14, 7:00a-9:13a. Back: UA 674, CHS to EWR, Fri Aug 21, 11:10a-1:06p. For a group this size, leave Pinebark Lane by 9:00a on departure day to clear a stroller-and-carseat-heavy TSA line comfortably.',
  },
  {
    id: 'chs-ess-table-for-17',
    name: 'Table for 17',
    category: 'essential',
    description: 'Most Charleston restaurants cap online booking at 8-10. Call ahead for anything with a reservation, especially the date-night spots on a weekend.',
  },
  {
    id: 'chs-ess-aviary-hours',
    name: "The aviary's hours",
    category: 'essential',
    description: 'Center for Birds of Prey is open Thursday through Saturday only, 10-4. That is the whole reason it lands on Day 7 -- it is the only open day left once the pirate cruise claims Saturday.',
  },
  {
    id: 'chs-ess-splash-zone',
    name: 'Splash Zone is closed',
    category: 'essential',
    description: "James Island County Park's waterpark ends its season Aug 9, before you land. Do not chase it -- the museum splash pad and the Pineapple Fountain cover the same need.",
  },
  {
    id: 'chs-ess-magnolia-boat',
    name: "Magnolia's boat tour",
    category: 'essential',
    description: 'The wildlife boat tour was listed as closed for the season as of this research. Treat the gardens, petting zoo and tram as the reliable plan, and the boat as a bonus if it is back.',
  },
  {
    id: 'chs-ess-radius',
    name: 'The 40-minute radius',
    category: 'essential',
    description: 'Folly Beach, downtown, Ashley River Road and West Ashley itself all sit inside it. Awendaw (the aviary) is the one deliberate exception.',
  },
  {
    id: 'chs-ess-pool-time',
    name: 'Pool time',
    category: 'essential',
    description: 'Built into the afternoon after every busy morning outing -- Days 3, 4, 6 and 7 all route back to Pinebark Lane rather than stacking a second excursion.',
  },
  {
    id: 'chs-ess-groceries',
    name: 'Provisioning -- Publix on Sam Rittenberg',
    category: 'essential',
    description: 'Seventeen people eat a lot. Do the big grocery run on arrival day so the house is stocked before the week gets its momentum. Publix or Harris Teeter off Sam Rittenberg is closest to Pinebark Lane.',
    location: { lat: 32.8146548, lng: -79.9952910, name: 'Publix -- Sam Rittenberg', address: 'Sam Rittenberg Blvd, Charleston, SC' },
    mapLink: 'https://maps.google.com/?q=Publix+Sam+Rittenberg+Blvd+Charleston+SC'
  }
];

// Guide - Where to Eat, Charleston. The numbered-pin eating list from the
// source, grouped exactly as it groups them. Pin numbers preserved so the
// printed itinerary and the app agree.
export const CHARLESTON_EATS: GuideItem[] = [
  // --- Kid-friendly, full group -------------------------------------------
  {
    id: 'chs-eat-fleet-landing',
    name: 'Fleet Landing Restaurant & Raw Bar',
    category: 'restaurant',
    description: 'Pin 4. Kid-friendly, full group. Downtown waterfront. Dockside seafood with a real kids’ menu -- and already the Day 2 pick after the pirate cruise, so nobody drives far with overtired kids.',
    location: { lat: 32.7803578, lng: -79.9249765, name: 'Fleet Landing -- 186 Concord St', address: '186 Concord St, Charleston, SC' },
    mapLink: 'https://maps.google.com/?q=Fleet+Landing+Restaurant+186+Concord+St+Charleston+SC'
  },
  {
    id: 'chs-eat-taco-boy',
    name: 'Taco Boy',
    category: 'restaurant',
    description: 'Pin 5. Kid-friendly, full group. Huger St, downtown. A real kids’ menu -- tacos, burritos, quesadillas.',
    location: { lat: 32.8032038, lng: -79.9413841, name: 'Taco Boy -- 217 Huger St', address: '217 Huger St, Charleston, SC' },
    mapLink: 'https://maps.google.com/?q=Taco+Boy+217+Huger+St+Charleston+SC'
  },
  {
    id: 'chs-eat-garage-75',
    name: 'Garage 75',
    category: 'restaurant',
    description: 'Pin 16. Kid-friendly, full group. James Island. Arcade games and big screens buy you an extra twenty minutes of adult conversation. Steaks and burgers, not just kid food.',
    location: { lat: 32.7772250, lng: -79.9733500, name: 'Garage 75 -- 75 Folly Rd', address: '75 Folly Rd, Charleston, SC' },
    mapLink: 'https://maps.google.com/?q=Garage+75+Folly+Rd+Charleston+SC'
  },
  {
    id: 'chs-eat-holy-city',
    name: 'Holy City Brewing',
    category: 'restaurant',
    description: 'Pin 21. Kid-friendly, full group. North Charleston. A genuine play area -- basketball net, full-size Jenga -- alongside a real beer list for the adults.',
    location: { lat: 32.8718762, lng: -79.9785144, name: 'Holy City Brewing -- 4155 Dorchester Rd', address: '4155 Dorchester Rd, North Charleston, SC' },
    mapLink: 'https://maps.google.com/?q=Holy+City+Brewing+North+Charleston+SC'
  },
  {
    id: 'chs-eat-evo',
    name: 'EVO Pizzeria',
    category: 'restaurant',
    description: 'Pin 20. Kid-friendly, full group. Park Circle, North Charleston. Voted #1 pizza in South Carolina. A little further out -- worth a dedicated pizza night rather than a drive-by.',
    location: { lat: 32.8813957, lng: -79.9769401, name: 'EVO Pizzeria -- 1075 E Montague Ave', address: '1075 E Montague Ave, North Charleston, SC' },
    mapLink: 'https://maps.google.com/?q=EVO+Pizzeria+1075+E+Montague+Ave+North+Charleston+SC'
  },
  // --- Close to Pinebark Lane, dine-in ------------------------------------
  {
    id: 'chs-eat-mellow-mushroom',
    name: 'Mellow Mushroom',
    category: 'restaurant',
    description: 'Pin 1. Close to base, dine-in. West Ashley. The no-debate option when everyone is tired and nobody wants to drive.',
    location: { lat: 32.7825454, lng: -79.9863552, name: 'Mellow Mushroom -- 19 Magnolia Rd', address: '19 Magnolia Rd, Charleston, SC' },
    mapLink: 'https://maps.google.com/?q=Mellow+Mushroom+19+Magnolia+Rd+Charleston+SC'
  },
  {
    id: 'chs-eat-famularis',
    name: "Famulari's Pizzeria",
    category: 'restaurant',
    description: 'Pin 2. Close to base, dine-in AND delivers. West Ashley. Old-school, family-run, minutes from base -- and the easiest call for a night nobody wants to leave the house.',
    location: { lat: 32.8269348, lng: -80.0392770, name: "Famulari's Pizzeria -- 1704 Ashley River Rd", address: '1704 Ashley River Rd, Charleston, SC' },
    mapLink: 'https://maps.google.com/?q=Famularis+Pizzeria+West+Ashley+Charleston+SC'
  },
  // --- Delivery to Pinebark Lane ------------------------------------------
  {
    id: 'chs-eat-paisanos',
    name: "Paisano's Pizza Grill",
    category: 'restaurant',
    description: 'Pin 3. Delivery to the house, via Uber Eats. West Ashley. Pizza, wings and salads ordered from the couch -- good for a Tuesday-easy-day dinner.',
    mapLink: 'https://maps.google.com/?q=Paisanos+Pizza+Grill+West+Ashley+Charleston+SC'
  },
  {
    id: 'chs-eat-chain-pizza',
    name: "Pizza Hut / Papa John's",
    category: 'restaurant',
    description: 'Delivery to the house. Ashley River Rd, West Ashley. Not exciting, but reliable and fast when the local kitchens are slammed -- both deliver straight to Pinebark Lane.',
    mapLink: 'https://maps.google.com/?q=Pizza+Hut+Ashley+River+Rd+Charleston+SC'
  },
  // --- Date night, adults only --------------------------------------------
  {
    id: 'chs-eat-chez-nous',
    name: 'Chez Nous',
    category: 'restaurant',
    description: 'Pin 6. Date night, adults only. Downtown. Tiny, candlelit, set in an antebellum house -- the most intimate option on this list. Reserve early.',
    location: { lat: 32.7917393, lng: -79.9432121, name: 'Chez Nous -- 6 Payne Ct', address: '6 Payne Ct, Charleston, SC' },
    mapLink: 'https://maps.google.com/?q=Chez+Nous+6+Payne+Ct+Charleston+SC'
  },
  {
    id: 'chs-eat-sorelle',
    name: 'Sorelle',
    category: 'restaurant',
    description: 'Pin 7. Date night, adults only. Broad St, downtown. Wood-fired Italian; ask for the Romeo & Juliet balcony over Broad Street.',
    location: { lat: 32.7765281, lng: -79.9317118, name: 'Sorelle -- 88 Broad St', address: '88 Broad St, Charleston, SC' },
    mapLink: 'https://maps.google.com/?q=Sorelle+88+Broad+St+Charleston+SC'
  },
  {
    id: 'chs-eat-fig',
    name: 'FIG',
    category: 'restaurant',
    description: 'Pin 8. Date night, adults only. Meeting St, downtown. A neighbourhood restaurant in the best sense -- quietly excellent, not trying to be an event.',
    location: { lat: 32.7824112, lng: -79.9316170, name: 'FIG -- 232 Meeting St', address: '232 Meeting St, Charleston, SC' },
    mapLink: 'https://maps.google.com/?q=FIG+232+Meeting+St+Charleston+SC'
  },
  {
    id: 'chs-eat-charleston-grill',
    name: 'Charleston Grill',
    category: 'restaurant',
    description: 'Pin 9. Date night, adults only. French Quarter. Live jazz, candlelight, a seafood-forward menu built for a slow night.',
    location: { lat: 32.7812597, lng: -79.9329796, name: 'Charleston Grill -- 205 Meeting St', address: '205 Meeting St, Charleston, SC' },
    mapLink: 'https://maps.google.com/?q=Charleston+Grill+205+Meeting+St+Charleston+SC'
  },
  {
    id: 'chs-eat-husk',
    name: 'Husk',
    category: 'restaurant',
    description: 'Pin 10. Date night, adults only. Queen St, downtown. Heirloom Southern ingredients, and a menu that changes with what is actually in season.',
    location: { lat: 32.7780172, lng: -79.9321415, name: 'Husk -- 76 Queen St', address: '76 Queen St, Charleston, SC' },
    mapLink: 'https://maps.google.com/?q=Husk+76+Queen+St+Charleston+SC'
  },
  // --- Sweets downtown ----------------------------------------------------
  {
    id: 'chs-eat-jenis',
    name: "Jeni's Splendid Ice Creams",
    category: 'restaurant',
    description: 'Pin 11. Sweets. King St. A kid-size vanilla honey is the move -- not too sweet, genuinely good.',
    location: { lat: 32.7900770, lng: -79.9393301, name: "Jeni's -- King St", address: 'King St, Charleston, SC' },
    mapLink: 'https://maps.google.com/?q=Jenis+Splendid+Ice+Creams+King+St+Charleston+SC'
  },
  {
    id: 'chs-eat-king-of-pops',
    name: 'King of Pops',
    category: 'restaurant',
    description: 'Sweets. A roaming cart, downtown and in the parks. Chocolate sea salt, banana puddin’ -- catch the cart wherever the day already has you. No fixed address.',
    mapLink: 'https://maps.google.com/?q=King+of+Pops+Charleston+SC'
  },
  {
    id: 'chs-eat-kaminskys',
    name: "Kaminsky's Dessert Cafe",
    category: 'restaurant',
    description: 'Pin 12. Sweets. Market St. Sundaes and milkshakes for the kids, cocktails and cake for everyone else at the same table.',
    location: { lat: 32.7810641, lng: -79.9299856, name: "Kaminsky's -- 78 N Market St", address: '78 N Market St, Charleston, SC' },
    mapLink: 'https://maps.google.com/?q=Kaminskys+Dessert+Cafe+Market+St+Charleston+SC'
  },
  {
    id: 'chs-eat-christophe',
    name: 'Christophe Artisan Chocolatier',
    category: 'restaurant',
    description: 'Pin 13. Sweets. Downtown. Hand-painted chocolates and an almond croissant worth the detour -- a grown-up sweet stop while the kids get their pops.',
    location: { lat: 32.7833541, lng: -79.9339504, name: 'Christophe Artisan Chocolatier -- 90 Society St', address: '90 Society St, Charleston, SC' },
    mapLink: 'https://maps.google.com/?q=Christophe+Artisan+Chocolatier+Charleston+SC'
  },
  {
    id: 'chs-eat-sugar-bakeshop',
    name: 'Sugar Bakeshop',
    category: 'restaurant',
    description: 'Pin 14. Sweets. Downtown. Small-batch cupcakes since 2007 -- vanilla blueberry, lime curd coconut. A short stop, not a whole outing.',
    location: { lat: 32.7902467, lng: -79.9443364, name: 'Sugar Bakeshop -- 59 1/2 Cannon St', address: '59 1/2 Cannon St, Charleston, SC' },
    mapLink: 'https://maps.google.com/?q=Sugar+Bakeshop+Cannon+St+Charleston+SC'
  },
  {
    id: 'chs-eat-carmellas',
    name: "Carmella's Cafe & Dessert Bar",
    category: 'restaurant',
    description: 'Pin 15. Sweets. East Bay St. Miniature cakes in a pale-pink building -- the key lime tart is the one to order.',
    location: { lat: 32.7801964, lng: -79.9270135, name: "Carmella's -- 198 East Bay St", address: '198 East Bay St, Charleston, SC' },
    mapLink: 'https://maps.google.com/?q=Carmellas+Cafe+198+East+Bay+St+Charleston+SC'
  },
  // --- Beach lunch --------------------------------------------------------
  {
    id: 'chs-eat-chico-feo',
    name: 'Chico Feo',
    category: 'restaurant',
    description: 'Pin 19. Beach lunch. Folly Beach. Steps from the sand, casual enough for sandy feet and cranky four-year-olds.',
    location: { lat: 32.6557789, lng: -79.9402464, name: 'Chico Feo -- 122 E Ashley Ave', address: '122 E Ashley Ave, Folly Beach, SC' },
    mapLink: 'https://maps.google.com/?q=Chico+Feo+122+E+Ashley+Ave+Folly+Beach+SC'
  },
  {
    id: 'chs-eat-loggerheads',
    name: "Loggerhead's Beach Grill",
    category: 'restaurant',
    description: 'Beach lunch. Folly Beach, Center St. The other option steps from the sand.',
    location: { lat: 32.6551995, lng: -79.9406733, name: "Loggerhead's -- Center St", address: 'Center St, Folly Beach, SC' },
    mapLink: 'https://maps.google.com/?q=Loggerheads+Folly+Beach+SC'
  },
  // --- Seafood markets for the send-off dinner -----------------------------
  {
    id: 'chs-eat-cudaco',
    name: 'CudaCo Seafood House',
    category: 'restaurant',
    description: 'Pin 17. Seafood market for the send-off. Folly Rd, close to base, known for what is actually fresh that day. A low-country boil scales cleanly for seventeen and can be mostly prepped ahead.',
    location: { lat: 32.7419381, lng: -79.9679513, name: 'CudaCo Seafood House -- 765 Folly Rd', address: '765 Folly Rd, Charleston, SC' },
    mapLink: 'https://maps.google.com/?q=CudaCo+Seafood+765+Folly+Rd+Charleston+SC'
  },
  {
    id: 'chs-eat-crosbys',
    name: "Crosby's Fish & Shrimp Co.",
    category: 'restaurant',
    description: 'Pin 18. Seafood market for the send-off. Folly Rd, open daily 6-6. The other supply option, also close to base.',
    location: { lat: 32.6733794, lng: -79.9489372, name: "Crosby's Fish & Shrimp -- 2223 Folly Rd", address: '2223 Folly Rd, Charleston, SC' },
    mapLink: 'https://maps.google.com/?q=Crosbys+Fish+and+Shrimp+2223+Folly+Rd+Charleston+SC'
  }
];

// ============================================================================
// TRIP-SCOPED GUIDE REGISTRY
// ----------------------------------------------------------------------------
// The four Trip Guide sections used to read four module-level constants
// directly, which meant every trip saw Chicago. A GuideSet bundles one trip's
// four sections plus their section copy; getGuideSet() picks the bundle from
// the active trip. SANKOFA_GUIDE points at the original arrays by reference,
// so the Sankofa trip renders the exact same objects as before.
// ============================================================================

export interface GuideSection {
  items: GuideItem[];
  title: string;
  subtitle: string;
  marginNote: string;
}

export interface GuideSet {
  tripKey: string;
  essentials: GuideSection;
  restaurants: GuideSection;
  highlights: GuideSection;
  cultural: GuideSection;
}

export const SANKOFA_GUIDE: GuideSet = {
  tripKey: 'sankofa-2026',
  essentials: {
    items: ACTIVITIES,
    title: 'Getting Around & Essentials',
    subtitle: 'Transport, weather, pharmacy',
    marginNote: 'before you set out',
  },
  restaurants: {
    items: RESTAURANTS,
    title: 'Where to Eat',
    subtitle: `${RESTAURANTS.length} places to eat`,
    marginNote: 'hungry? look here',
  },
  highlights: {
    items: CHICAGO_HIGHLIGHTS,
    title: 'Chicago Highlights',
    subtitle: `${CHICAGO_HIGHLIGHTS.length} must-see attractions`,
    marginNote: 'the city, abridged',
  },
  cultural: {
    items: EVENTS,
    title: 'Cultural Sites',
    subtitle: "Relevant to Sankofa's mission",
    marginNote: 'sit with these',
  },
};

export const CHARLESTON_GUIDE: GuideSet = {
  tripKey: 'charleston-2026',
  essentials: {
    items: CHARLESTON_ESSENTIALS,
    title: 'Need to Know',
    subtitle: 'Flights, hours, and the constraints that shaped the week',
    marginNote: 'read this first',
  },
  restaurants: {
    items: CHARLESTON_EATS,
    title: 'Where to Eat',
    subtitle: `${CHARLESTON_EATS.length} places to eat`,
    marginNote: 'numbers match the map',
  },
  highlights: {
    items: CHARLESTON_HIGHLIGHTS,
    title: 'The Big Ones',
    subtitle: `${CHARLESTON_HIGHLIGHTS.length} attractions the days are built around`,
    marginNote: 'book the aquarium early',
  },
  cultural: {
    items: CHARLESTON_OUTDOORS,
    title: 'Out of Doors',
    subtitle: 'Beach, oak, fountain -- mostly free',
    marginNote: 'bring a towel',
  },
};

/** Fixed id of the Charleston trip row (see .planning/INGEST-2026-07-29-charleston.sql). */
export const CHARLESTON_TRIP_ID = 'c4a71e00-8a3f-4b21-9d55-3c17e0aa2026';

/**
 * Pick the guide bundle for a trip. Matches on the known trip id first, then
 * falls back to a name/location sniff so a re-seeded trip still resolves.
 * Anything unrecognised gets the Sankofa/Chicago set, which is what every
 * caller got before this registry existed.
 */
export function getGuideSet(
  trip?: { id?: string; title?: string | null; location_name?: string | null } | null
): GuideSet {
  if (!trip) return SANKOFA_GUIDE;
  if (trip.id === CHARLESTON_TRIP_ID) return CHARLESTON_GUIDE;

  const haystack = `${trip.title ?? ''} ${trip.location_name ?? ''}`.toLowerCase();
  if (haystack.includes('charleston')) return CHARLESTON_GUIDE;

  return SANKOFA_GUIDE;
}
