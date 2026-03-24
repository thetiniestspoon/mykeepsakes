// ============================================================================
// LEGACY DEMO DATA -- Provincetown Family Week 2026
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
  category: 'beach' | 'restaurant' | 'activity' | 'shop';
  description: string;
  location?: Location;
  link?: string;
  phone?: string;
  mapLink?: string;
}

// Provincetown coordinates (center of town)
export const PTOWN_CENTER: Location = {
  lat: 42.0584,
  lng: -70.1836,
  name: "Provincetown Center"
};

// Emergency & Important Contacts
export const EMERGENCY_CONTACTS: Contact[] = [
  { id: 'emergency-911', name: 'Emergency Services', role: 'Police/Fire/EMS', phone: '911' },
  { id: 'ptown-police', name: 'Provincetown Police', role: 'Non-Emergency', phone: '508-487-1212' },
  { id: 'cape-cod-hospital', name: 'Cape Cod Hospital', role: 'Medical', phone: '508-771-1800' },
  { id: 'outer-cape-health', name: 'Outer Cape Health', role: 'Urgent Care Ptown', phone: '508-487-9395' },
  { id: 'family-week-info', name: 'Family Week Info', role: 'Event Hotline', phone: '508-487-2313' },
];

// Ferry Information
export const FERRY_INFO = {
  bostonFerry: {
    name: 'Bay State Cruise Company',
    phone: '617-748-1428',
    website: 'https://www.baystatecruisecompany.com/',
    schedule: 'Boston to Provincetown - ~90 minutes',
    note: 'Book in advance for summer weekends'
  },
  plymouthFerry: {
    name: 'Captain John Boats',
    phone: '508-927-5587',
    website: 'https://captjohn.com/',
    schedule: 'Plymouth to Provincetown',
    note: 'Scenic alternative route'
  }
};

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

// Guide - Beaches
export const BEACHES: GuideItem[] = [
  {
    id: 'beach-herring',
    name: 'Herring Cove Beach',
    category: 'beach',
    description: 'Most popular family beach. Calm waters, restrooms, snack bar, lifeguards. Stunning sunsets.',
    location: { lat: 42.0642, lng: -70.2095, name: 'Herring Cove Beach' },
    mapLink: 'https://maps.google.com/?q=Herring+Cove+Beach+Provincetown'
  },
  {
    id: 'beach-race',
    name: 'Race Point Beach',
    category: 'beach',
    description: 'Wilder, more dramatic beach facing the open Atlantic. Great for walking and sunset views.',
    location: { lat: 42.0816, lng: -70.2396, name: 'Race Point Beach' },
    mapLink: 'https://maps.google.com/?q=Race+Point+Beach+Provincetown'
  },
  {
    id: 'beach-long',
    name: 'Long Point Beach',
    category: 'beach',
    description: 'Remote and beautiful. Accessible via shuttle or 1.5 mile walk across the breakwater.',
    location: { lat: 42.0336, lng: -70.1688, name: 'Long Point' },
    mapLink: 'https://maps.google.com/?q=Long+Point+Provincetown'
  }
];

// Guide - Restaurants
export const RESTAURANTS: GuideItem[] = [
  {
    id: 'rest-lobster',
    name: 'The Lobster Pot',
    category: 'restaurant',
    description: 'Iconic Provincetown seafood. Get the lobster bisque and lobster roll.',
    location: { lat: 42.0526, lng: -70.1842, name: 'The Lobster Pot' },
    link: 'https://ptownlobsterpot.com/',
    phone: '508-487-0842'
  },
  {
    id: 'rest-mews',
    name: 'The Mews Restaurant',
    category: 'restaurant',
    description: 'Upscale waterfront dining with amazing harbor views.',
    location: { lat: 42.0505, lng: -70.1870, name: 'The Mews Restaurant' },
    link: 'https://mewsptown.com/',
    phone: '508-487-1500'
  },
  {
    id: 'rest-cafe-heaven',
    name: 'Café Heaven',
    category: 'restaurant',
    description: 'Cozy breakfast and lunch spot. Excellent pastries.',
    location: { lat: 42.0530, lng: -70.1860, name: 'Café Heaven' },
    phone: '508-487-9639'
  },
  {
    id: 'rest-canteen',
    name: 'Canteen',
    category: 'restaurant',
    description: 'Casual local spot with great sandwiches, tacos, and local seafood.',
    location: { lat: 42.0517, lng: -70.1868, name: 'Canteen' }
  },
  {
    id: 'rest-napis',
    name: 'Napi\'s Restaurant',
    category: 'restaurant',
    description: 'Creative international cuisine in an artistic, eclectic setting.',
    location: { lat: 42.0585, lng: -70.1925, name: 'Napi\'s Restaurant' },
    link: 'https://www.napisrestaurant.com/',
    phone: '508-487-1145'
  }
];

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
    category: 'activity',
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
