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


// Guide - Dining Near Hotel (Oak Brook / nearby)
export const RESTAURANTS: GuideItem[] = [
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
