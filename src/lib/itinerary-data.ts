// ============================================================================
// LEGACY DEMO DATA -- Itinerary portion is from Provincetown Family Week 2026
// Guide data updated for Sankofa 2026 (Chicago / Oak Brook, IL)
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

/** @deprecated Use TRIP_CENTER instead */
export const PTOWN_CENTER = TRIP_CENTER;

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

/** @deprecated Use TRANSPORT_INFO instead */
export const FERRY_INFO = TRANSPORT_INFO;

// Sample Itinerary - 8-day Family Week, July 25 - August 1
export const ITINERARY: Day[] = [
  {
    id: 'day-1',
    date: 'Saturday, July 25, 2026',
    dayOfWeek: 'Saturday',
    title: 'Arrival Day',
    activities: [
      {
        id: 'day1-travel',
        time: '8:00 AM',
        title: 'Depart for Cape Cod',
        description: 'Pack the car and hit the road! Expect 2-3 hours depending on traffic.',
        category: 'transport',
        notes: 'Check traffic before leaving. Consider stopping in Plymouth for lunch.'
      },
      {
        id: 'day1-checkin',
        time: '2:00 PM',
        title: 'Check-in at Accommodation',
        description: 'Check into your rental and get settled.',
        category: 'accommodation',
        location: { lat: 42.0520, lng: -70.1890, name: 'Vacation Rental' }
      },
      {
        id: 'day1-explore',
        time: '4:00 PM',
        title: 'Explore Commercial Street',
        description: 'Take a stroll down the heart of Provincetown. Grab ice cream and browse the galleries.',
        category: 'activity',
        location: { lat: 42.0525, lng: -70.1855, name: 'Commercial Street' },
        mapLink: 'https://maps.google.com/?q=Commercial+Street+Provincetown+MA'
      },
      {
        id: 'day1-dinner',
        time: '6:30 PM',
        title: 'Dinner at The Mews',
        description: 'Upscale casual waterfront dining with stunning harbor views. Great for families.',
        category: 'dining',
        location: { lat: 42.0505, lng: -70.1870, name: 'The Mews Restaurant' },
        link: 'https://mewsptown.com/',
        linkLabel: 'View Menu',
        phone: '508-487-1500'
      }
    ]
  },
  {
    id: 'day-2',
    date: 'Sunday, July 26, 2026',
    dayOfWeek: 'Sunday',
    title: 'Beach Day & Family Week Kickoff',
    activities: [
      {
        id: 'day2-breakfast',
        time: '8:30 AM',
        title: 'Breakfast at Café Heaven',
        description: 'Local favorite with excellent pastries and coffee.',
        category: 'dining',
        location: { lat: 42.0530, lng: -70.1860, name: 'Café Heaven' },
        phone: '508-487-9639'
      },
      {
        id: 'day2-beach',
        time: '10:00 AM',
        title: 'Herring Cove Beach',
        description: 'Family-friendly beach with calm waters, bathrooms, and snack bar. Part of Cape Cod National Seashore.',
        category: 'beach',
        location: { lat: 42.0642, lng: -70.2095, name: 'Herring Cove Beach' },
        mapLink: 'https://maps.google.com/?q=Herring+Cove+Beach+Provincetown',
        notes: 'Bring beach umbrella and plenty of sunscreen!'
      },
      {
        id: 'day2-kickoff',
        time: '4:00 PM',
        title: 'Family Week Welcome Event',
        description: 'Official kickoff celebration for Family Week! Meet other families and get your schedule.',
        category: 'event',
        location: { lat: 42.0515, lng: -70.1865, name: 'Crown & Anchor' },
        link: 'https://www.familyequality.org/family-week/',
        linkLabel: 'Family Week Info'
      },
      {
        id: 'day2-dinner',
        time: '6:00 PM',
        title: 'Lobster Pot for Dinner',
        description: 'Iconic Provincetown seafood restaurant. Get the lobster roll!',
        category: 'dining',
        location: { lat: 42.0526, lng: -70.1842, name: 'The Lobster Pot' },
        phone: '508-487-0842',
        link: 'https://ptownlobsterpot.com/',
        linkLabel: 'Make Reservation'
      }
    ]
  },
  {
    id: 'day-3',
    date: 'Monday, July 27, 2026',
    dayOfWeek: 'Monday',
    title: 'Whale Watching Adventure',
    activities: [
      {
        id: 'day3-breakfast',
        time: '7:30 AM',
        title: 'Early Breakfast',
        description: 'Quick breakfast before the whale watch. Pack snacks for the boat!',
        category: 'dining'
      },
      {
        id: 'day3-whales',
        time: '9:00 AM',
        title: 'Whale Watching with Dolphin Fleet',
        description: '3-4 hour excursion to see humpback whales in Stellwagen Bank. Book tickets in advance!',
        category: 'activity',
        location: { lat: 42.0542, lng: -70.1838, name: 'MacMillan Pier' },
        link: 'https://whalewatch.com/',
        linkLabel: 'Book Tickets',
        phone: '508-240-3636',
        notes: 'Bring layers - it gets cold on the water even in summer!'
      },
      {
        id: 'day3-lunch',
        time: '1:30 PM',
        title: 'Lunch at Canteen',
        description: 'Casual local spot with great sandwiches and seafood.',
        category: 'dining',
        location: { lat: 42.0517, lng: -70.1868, name: 'Canteen' }
      },
      {
        id: 'day3-activities',
        time: '3:00 PM',
        title: 'Family Week Activities',
        description: 'Check the Family Week schedule for afternoon activities and workshops.',
        category: 'event',
        link: 'https://www.familyequality.org/family-week/',
        linkLabel: 'View Schedule'
      },
      {
        id: 'day3-sunset',
        time: '7:00 PM',
        title: 'Sunset at Race Point',
        description: 'Drive out to Race Point for stunning sunset views over the dunes.',
        category: 'beach',
        location: { lat: 42.0816, lng: -70.2396, name: 'Race Point Beach' },
        mapLink: 'https://maps.google.com/?q=Race+Point+Beach+Provincetown'
      }
    ]
  },
  {
    id: 'day-4',
    date: 'Tuesday, July 28, 2026',
    dayOfWeek: 'Tuesday',
    title: 'Art & Adventure Day',
    activities: [
      {
        id: 'day4-museum',
        time: '10:00 AM',
        title: 'Provincetown Art Association & Museum',
        description: 'Explore the vibrant local art scene. Great for all ages with interactive exhibits.',
        category: 'activity',
        location: { lat: 42.0566, lng: -70.1786, name: 'PAAM' },
        link: 'https://paam.org/',
        linkLabel: 'Plan Your Visit',
        phone: '508-487-1750'
      },
      {
        id: 'day4-bike',
        time: '1:00 PM',
        title: 'Bike the Province Lands Trail',
        description: 'Rent bikes and explore the beautiful Province Lands trails through dunes and forests.',
        category: 'activity',
        location: { lat: 42.0640, lng: -70.2080, name: 'Province Lands Visitor Center' },
        link: 'https://www.nps.gov/caco/planyourvisit/provincelandsbikepath.htm',
        linkLabel: 'Trail Info',
        notes: 'Bike rentals available at several shops on Commercial Street.'
      },
      {
        id: 'day4-beach2',
        time: '4:00 PM',
        title: 'Long Point Beach Exploration',
        description: 'Take the shuttle or walk the breakwater to Long Point for a secluded beach experience.',
        category: 'beach',
        location: { lat: 42.0336, lng: -70.1688, name: 'Long Point' }
      }
    ]
  },
  {
    id: 'day-5',
    date: 'Wednesday, July 29, 2026',
    dayOfWeek: 'Wednesday',
    title: 'Family Week Fun Day',
    activities: [
      {
        id: 'day5-parade-prep',
        time: '10:00 AM',
        title: 'Parade Prep & Crafts',
        description: 'Join other families creating costumes and decorations for the famous Family Week parade!',
        category: 'event',
        location: { lat: 42.0515, lng: -70.1865, name: 'Family Week HQ' }
      },
      {
        id: 'day5-picnic',
        time: '12:00 PM',
        title: 'Family Picnic',
        description: 'Large group picnic with all Family Week families. Games and activities for kids.',
        category: 'event'
      },
      {
        id: 'day5-monument',
        time: '3:00 PM',
        title: 'Pilgrim Monument & Museum',
        description: 'Climb the tallest all-granite structure in the US for 360-degree Cape views!',
        category: 'activity',
        location: { lat: 42.0555, lng: -70.1888, name: 'Pilgrim Monument' },
        link: 'https://www.pilgrim-monument.org/',
        linkLabel: 'Buy Tickets',
        phone: '508-487-1310',
        notes: '252 steps + 60 ramps. Worth it for the view!'
      }
    ]
  },
  {
    id: 'day-6',
    date: 'Thursday, July 30, 2026',
    dayOfWeek: 'Thursday',
    title: 'The Big Parade!',
    activities: [
      {
        id: 'day6-prep',
        time: '9:00 AM',
        title: 'Final Parade Preparations',
        description: 'Get costumes ready and meet up with your parade group!',
        category: 'event'
      },
      {
        id: 'day6-parade',
        time: '11:00 AM',
        title: 'Family Week Parade',
        description: 'The highlight of the week! March down Commercial Street celebrating family diversity.',
        category: 'event',
        location: { lat: 42.0525, lng: -70.1855, name: 'Commercial Street' },
        notes: 'This is an unforgettable experience. Cheer loud and proud!'
      },
      {
        id: 'day6-celebration',
        time: '1:00 PM',
        title: 'Post-Parade Celebration',
        description: 'Music, dancing, and festivities after the parade.',
        category: 'event'
      },
      {
        id: 'day6-farewell',
        time: '6:00 PM',
        title: 'Farewell Dinner at Napi\'s',
        description: 'Creative international cuisine in a unique artistic setting.',
        category: 'dining',
        location: { lat: 42.0585, lng: -70.1925, name: 'Napi\'s Restaurant' },
        phone: '508-487-1145',
        link: 'https://www.napisrestaurant.com/',
        linkLabel: 'Reserve Table'
      }
    ]
  },
  {
    id: 'day-7',
    date: 'Friday, July 31, 2026',
    dayOfWeek: 'Friday',
    title: 'Last Full Day',
    activities: [
      {
        id: 'day7-breakfast',
        time: '9:00 AM',
        title: 'Leisurely Breakfast at Café Heaven',
        description: 'Take your time over a delicious breakfast at this local favorite.',
        category: 'dining',
        location: { lat: 42.0530, lng: -70.1860, name: 'Café Heaven' },
        phone: '508-487-9639'
      },
      {
        id: 'day7-kayak',
        time: '10:30 AM',
        title: 'Kayaking or Paddleboarding',
        description: 'Explore the harbor by water! Rentals available at the pier.',
        category: 'activity',
        location: { lat: 42.0540, lng: -70.1835, name: 'Provincetown Harbor' },
        notes: 'Check weather conditions. Life jackets provided with rentals.'
      },
      {
        id: 'day7-lunch',
        time: '1:00 PM',
        title: 'Lunch at Fanizzi\'s by the Sea',
        description: 'Waterfront dining with stunning bay views. Great for families.',
        category: 'dining',
        location: { lat: 42.0495, lng: -70.1900, name: 'Fanizzi\'s Restaurant' },
        link: 'https://www.fanizzisrestaurant.com/',
        linkLabel: 'View Menu',
        phone: '508-487-1964'
      },
      {
        id: 'day7-shopping',
        time: '3:00 PM',
        title: 'Last-Minute Shopping',
        description: 'Browse the galleries and shops on Commercial Street for souvenirs and gifts.',
        category: 'activity',
        location: { lat: 42.0525, lng: -70.1855, name: 'Commercial Street' },
        mapLink: 'https://maps.google.com/?q=Commercial+Street+Provincetown+MA'
      },
      {
        id: 'day7-beach',
        time: '5:00 PM',
        title: 'Final Beach Sunset at Herring Cove',
        description: 'One last magical sunset at the beach. Bring a blanket and snacks.',
        category: 'beach',
        location: { lat: 42.0642, lng: -70.2095, name: 'Herring Cove Beach' },
        mapLink: 'https://maps.google.com/?q=Herring+Cove+Beach+Provincetown',
        notes: 'Arrive early for best parking. Sunset around 8:15 PM in late July.'
      },
      {
        id: 'day7-dinner',
        time: '7:30 PM',
        title: 'Farewell Dinner at The Red Inn',
        description: 'Elegant waterfront dining for a memorable last night. Reservations recommended.',
        category: 'dining',
        location: { lat: 42.0565, lng: -70.1902, name: 'The Red Inn' },
        link: 'https://www.theredinn.com/',
        linkLabel: 'Reserve Table',
        phone: '508-487-7334'
      }
    ]
  },
  {
    id: 'day-8',
    date: 'Saturday, August 1, 2026',
    dayOfWeek: 'Saturday',
    title: 'Departure Day',
    activities: [
      {
        id: 'day8-breakfast',
        time: '8:00 AM',
        title: 'Quick Breakfast',
        description: 'Grab a quick bite before hitting the road.',
        category: 'dining'
      },
      {
        id: 'day8-checkout',
        time: '10:00 AM',
        title: 'Check Out',
        description: 'Pack up and check out of accommodations.',
        category: 'accommodation'
      },
      {
        id: 'day8-depart',
        time: '11:00 AM',
        title: 'Head Home',
        description: 'Safe travels! Consider stopping in Plymouth or Sandwich on the way.',
        category: 'transport',
        notes: 'Saturday traffic can be heavy. Leave early if possible!'
      }
    ]
  }
];

// Packing List
export const PACKING_LIST: PackingItem[] = [
  { id: 'pack-1', category: 'Beach', item: 'Sunscreen SPF 50+' },
  { id: 'pack-2', category: 'Beach', item: 'Beach towels (multiple)' },
  { id: 'pack-3', category: 'Beach', item: 'Beach umbrella or tent' },
  { id: 'pack-4', category: 'Beach', item: 'Beach chairs' },
  { id: 'pack-5', category: 'Beach', item: 'Sand toys for kids' },
  { id: 'pack-6', category: 'Beach', item: 'Cooler for snacks' },
  { id: 'pack-7', category: 'Clothing', item: 'Swimsuits (2+ per person)' },
  { id: 'pack-8', category: 'Clothing', item: 'Cover-ups' },
  { id: 'pack-9', category: 'Clothing', item: 'Light layers for evening' },
  { id: 'pack-10', category: 'Clothing', item: 'Comfortable walking shoes' },
  { id: 'pack-11', category: 'Clothing', item: 'Water shoes' },
  { id: 'pack-12', category: 'Clothing', item: 'Rain jacket (just in case)' },
  { id: 'pack-13', category: 'Clothing', item: 'Parade costume supplies' },
  { id: 'pack-14', category: 'Kids', item: 'Favorite stuffed animal' },
  { id: 'pack-15', category: 'Kids', item: 'Books and activities' },
  { id: 'pack-16', category: 'Kids', item: 'Travel games' },
  { id: 'pack-17', category: 'Kids', item: 'Snacks for car ride' },
  { id: 'pack-18', category: 'Whale Watch', item: 'Binoculars' },
  { id: 'pack-19', category: 'Whale Watch', item: 'Motion sickness meds' },
  { id: 'pack-20', category: 'Whale Watch', item: 'Warm layers for boat' },
  { id: 'pack-21', category: 'Essentials', item: 'Camera/phone chargers' },
  { id: 'pack-22', category: 'Essentials', item: 'First aid kit' },
  { id: 'pack-23', category: 'Essentials', item: 'Insect repellent' },
  { id: 'pack-24', category: 'Essentials', item: 'Prescription medications' },
  { id: 'pack-25', category: 'Essentials', item: 'Cash for small shops' },
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

/** @deprecated Use CHICAGO_HIGHLIGHTS instead */
export const BEACHES = CHICAGO_HIGHLIGHTS;

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
  
  // Add beaches
  BEACHES.forEach(beach => {
    if (beach.location) {
      locations.push({
        ...beach.location,
        itemId: beach.id,
        itemType: 'beach'
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
