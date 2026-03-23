// Run with: npx tsx scripts/seed-sankofa.ts
// Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function seed() {
  console.log('Creating Sankofa 2026 trip...');

  // 1. Create trip
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .insert({
      title: 'Sankofa 2026 — Healing, Justice & Sacred Care',
      location_name: 'Chicago / Oak Brook, IL',
      start_date: '2026-04-21',
      end_date: '2026-04-24',
      timezone: 'America/Chicago',
    })
    .select()
    .single();
  if (tripError) throw tripError;
  console.log(`Trip created: ${trip.id}`);

  // 2. Create days
  const days = [
    { date: '2026-04-21', title: 'Arrival & Opening', sort_index: 0 },
    { date: '2026-04-22', title: 'Conference Day 1', sort_index: 1 },
    { date: '2026-04-23', title: 'Conference Day 2', sort_index: 2 },
    { date: '2026-04-24', title: 'Closing & Departure', sort_index: 3 },
  ];
  const { data: createdDays, error: daysError } = await supabase
    .from('itinerary_days')
    .insert(days.map((d) => ({ ...d, trip_id: trip.id })))
    .select();
  if (daysError) throw daysError;
  console.log(`${createdDays.length} days created`);

  // 3. Create accommodation
  const { error: accomError } = await supabase
    .from('accommodations')
    .insert({
      trip_id: trip.id,
      title: 'Chicago Marriott Oak Brook',
      address: '1401 W 22nd St, Oak Brook, IL 60523',
      check_in: '2026-04-21T16:00:00-05:00',
      check_out: '2026-04-24T12:00:00-05:00',
      is_selected: true,
      notes: 'Confirmation #84897700. $154/night ($503.58 total). Sharing with Dan Llanes. Complimentary parking. Phone: +1-630-573-8555',
      location_lat: 41.8505,
      location_lng: -87.9357,
    });
  if (accomError) throw accomError;
  console.log('Accommodation created');

  // 4. Create locations
  const locations = [
    { name: 'Chicago Marriott Oak Brook', category: 'accommodation', address: '1401 W 22nd St, Oak Brook, IL 60523', lat: 41.8505, lng: -87.9357 },
    { name: "O'Hare International Airport", category: 'transport', address: "10000 W O'Hare Ave, Chicago, IL 60666", lat: 41.9742, lng: -87.9073 },
    { name: 'Midway International Airport', category: 'transport', address: '5700 S Cicero Ave, Chicago, IL 60638', lat: 41.7868, lng: -87.7522 },
  ];
  const { error: locError } = await supabase
    .from('locations')
    .insert(locations.map((l) => ({ ...l, trip_id: trip.id })));
  if (locError) throw locError;
  console.log(`${locations.length} locations created`);

  // 5. Create contacts (Beacon team)
  const contacts = [
    { name: 'Dr. Danielle Buhuro', email: 'sankofacpeconference@gmail.com', phone: '773-953-9398', organization: 'Sankofa CPE Center — Organizer', category: 'connection', trip_id: trip.id },
    { name: 'Rev. Dr. Jé Exodus Hooper', email: 'je@summitbeacon.org', phone: '804-837-2404', organization: 'Beacon UU — Assistant Minister, Presenter', category: 'connection', trip_id: trip.id },
    { name: 'Rev. Dr. Robin Tanner', email: 'robin@summitbeacon.org', phone: '908-219-9959', organization: 'Beacon UU — Senior Minister', category: 'connection', trip_id: trip.id },
    { name: 'Dan Llanes', organization: 'Beacon UU — Chaplain, Roommate', category: 'connection', trip_id: trip.id },
    { name: 'Heather Stober', organization: 'Beacon UU — Chaplain', category: 'connection', trip_id: trip.id },
    { name: 'Catherine Menendez', organization: 'Beacon UU — Chaplain', category: 'connection', trip_id: trip.id },
    { name: 'Dana N. Moore', organization: 'Beacon UU — Congregational Coordinator', category: 'connection', trip_id: trip.id },
  ];
  const { error: contactError } = await supabase
    .from('family_contacts')
    .insert(contacts);
  if (contactError) throw contactError;
  console.log(`${contacts.length} contacts created`);

  // 6. Create known speakers as connections
  const speakers = [
    { name: 'Dr. Nathaniel D. West, LPC', organization: 'Samuel Dewitt Proctor School of Theology', met_context: 'Plenary: "Shifting Toward Consistent Self-Care"', category: 'connection', trip_id: trip.id },
    { name: 'Dr. Pamela Ayo Yetunde', organization: 'Pastoral Counselor & Author', category: 'connection', trip_id: trip.id },
    { name: 'Dr. Nisa Muhammad', organization: 'Howard University — Assistant Dean for Religious Life', category: 'connection', trip_id: trip.id },
  ];
  const { error: speakerError } = await supabase
    .from('family_contacts')
    .insert(speakers);
  if (speakerError) throw speakerError;
  console.log(`${speakers.length} speakers created`);

  // 7. Create itinerary items
  const dayMap = Object.fromEntries(createdDays.map((d) => [d.date, d.id]));
  const items = [
    { trip_id: trip.id, day_id: dayMap['2026-04-21'], title: 'Hotel Check-in', start_time: '16:00', category: 'accommodation', status: 'planned', sort_index: 0, item_type: 'activity' },
    { trip_id: trip.id, day_id: dayMap['2026-04-21'], title: 'Opening Session', category: 'event', status: 'planned', sort_index: 1, item_type: 'activity' },
    { trip_id: trip.id, day_id: dayMap['2026-04-22'], title: 'Morning Plenary', category: 'event', status: 'planned', sort_index: 0, item_type: 'activity' },
    { trip_id: trip.id, day_id: dayMap['2026-04-22'], title: 'Workshop Block 1', category: 'event', status: 'planned', sort_index: 1, item_type: 'activity' },
    { trip_id: trip.id, day_id: dayMap['2026-04-22'], title: 'Lunch', category: 'dining', status: 'planned', sort_index: 2, item_type: 'activity' },
    { trip_id: trip.id, day_id: dayMap['2026-04-22'], title: 'Workshop Block 2', category: 'event', status: 'planned', sort_index: 3, item_type: 'activity' },
    { trip_id: trip.id, day_id: dayMap['2026-04-22'], title: 'Dinner', category: 'dining', status: 'planned', sort_index: 4, item_type: 'activity' },
    { trip_id: trip.id, day_id: dayMap['2026-04-22'], title: 'Evening Programming', category: 'event', status: 'planned', sort_index: 5, item_type: 'activity' },
    { trip_id: trip.id, day_id: dayMap['2026-04-23'], title: 'Morning Plenary', category: 'event', status: 'planned', sort_index: 0, item_type: 'activity' },
    { trip_id: trip.id, day_id: dayMap['2026-04-23'], title: 'Workshop Block 1', category: 'event', status: 'planned', sort_index: 1, item_type: 'activity' },
    { trip_id: trip.id, day_id: dayMap['2026-04-23'], title: 'Lunch', category: 'dining', status: 'planned', sort_index: 2, item_type: 'activity' },
    { trip_id: trip.id, day_id: dayMap['2026-04-23'], title: 'Workshop Block 2', category: 'event', status: 'planned', sort_index: 3, item_type: 'activity' },
    { trip_id: trip.id, day_id: dayMap['2026-04-23'], title: 'Dinner & Celebration', category: 'dining', status: 'planned', sort_index: 4, item_type: 'activity' },
    { trip_id: trip.id, day_id: dayMap['2026-04-24'], title: 'Closing Session', category: 'event', status: 'planned', sort_index: 0, item_type: 'activity' },
    { trip_id: trip.id, day_id: dayMap['2026-04-24'], title: 'Hotel Checkout', start_time: '12:00', category: 'accommodation', status: 'planned', sort_index: 1, item_type: 'activity' },
    { trip_id: trip.id, day_id: dayMap['2026-04-24'], title: 'Departure', category: 'transport', status: 'planned', sort_index: 2, item_type: 'activity' },
  ];
  const { error: itemError } = await supabase
    .from('itinerary_items')
    .insert(items);
  if (itemError) throw itemError;
  console.log(`${items.length} itinerary items created`);

  console.log('\nSankofa 2026 trip scaffold complete!');
  console.log(`Trip ID: ${trip.id}`);
}

seed().catch(console.error);
