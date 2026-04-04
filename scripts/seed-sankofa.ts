// Run with: npx tsx scripts/seed-sankofa.ts
// Requires VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local
//
// IMPORTANT: Run the migration supabase/migrations/20260402000000_add_speaker_track.sql
// before running this script (adds speaker + track columns to itinerary_items).

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

async function seed() {
  console.log('Creating Sankofa 2026 trip...');

  // 1. Create trip
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .insert({
      title: 'Sankofa 2026 — Healing, Justice & Sacred Care',
      location_name: 'Chicago / Oak Brook, IL',
      start_date: '2026-04-20',
      end_date: '2026-04-26',
      timezone: 'America/Chicago',
    })
    .select()
    .single();
  if (tripError) throw tripError;
  console.log(`Trip created: ${trip.id}`);

  // 2. Create days
  const days = [
    { date: '2026-04-20', title: 'Travel Day — EWR → ORD', sort_index: 0 },
    { date: '2026-04-21', title: 'Sankofa Day 1 — Opening & Registration', sort_index: 1 },
    { date: '2026-04-22', title: 'Sankofa Day 2 — Deep Work', sort_index: 2 },
    { date: '2026-04-23', title: 'Sankofa Day 3 — Healing & Leadership', sort_index: 3 },
    { date: '2026-04-24', title: 'Sankofa Day 4 — Closing', sort_index: 4 },
    { date: '2026-04-25', title: 'Free Day — Explore Chicago', sort_index: 5 },
    { date: '2026-04-26', title: 'Departure Day — ORD → EWR', sort_index: 6 },
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
      check_in: '2026-04-20T15:00:00-05:00',
      check_out: '2026-04-26T04:00:00-05:00',
      is_selected: true,
      notes: 'Confirmation #84897700. Sharing with Dan Llanes. Complimentary parking. Phone: +1-630-573-8555. Flight confirmation: PKMJGM (United).',
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
    { name: 'Sankofa Conference Venue', category: 'event', address: '1333 S. Wabash Ave., Unit #2804, Chicago, IL 60605', lat: 41.8653, lng: -87.6258 },
  ];
  const { data: createdLocations, error: locError } = await supabase
    .from('locations')
    .insert(locations.map((l) => ({ ...l, trip_id: trip.id })))
    .select();
  if (locError) throw locError;
  console.log(`${createdLocations.length} locations created`);

  const locMap = Object.fromEntries(createdLocations.map((l: any) => [l.name, l.id]));
  const venueId = locMap['Sankofa Conference Venue'];

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

  // 6. Create all speakers as connections
  const speakers = [
    { name: 'Dr. Danie J. Buhuro', organization: 'Sankofa CPE Center', met_context: 'Conference organizer & presenter — Spiritual Entrepreneurship, Sankofa Address', category: 'connection', trip_id: trip.id },
    { name: 'Dr. Nathaniel D. West, LPC', organization: 'Samuel Dewitt Proctor School of Theology', met_context: 'Plenary: Shifting Toward Consistent Self-Care', category: 'connection', trip_id: trip.id },
    { name: 'Dr. Nicholas Grier', met_context: 'One-On-One Conversation with Dr. Danie (Tue)', category: 'connection', trip_id: trip.id },
    { name: 'Pastor Stephen J. Thurston, II', met_context: 'One-On-One Conversation with Dr. Danie (Tue)', category: 'connection', trip_id: trip.id },
    { name: 'Dr. Pamela Ayo Yetunde', organization: 'Pastoral Counselor & Author', met_context: 'One-On-One Conversation with Dr. Danie (Wed)', category: 'connection', trip_id: trip.id },
    { name: 'Dr. Nisa Muhammad', organization: 'Howard University — Assistant Dean for Religious Life', met_context: 'One-On-One Conversation with Dr. Danie (Wed)', category: 'connection', trip_id: trip.id },
    { name: 'Rev. Vahisha Hasan', met_context: 'Workshop: Joy as Resistance (Wed)', category: 'connection', trip_id: trip.id },
    { name: 'Rev. Dr. Ebony D. Only', organization: 'Executive Pastor, Chaplain, Coach & Consultant', met_context: 'Workshop: Spiritual Practices for Surviving and Thriving + Thursday Worship', category: 'connection', trip_id: trip.id },
    { name: 'Dr. Sherri L. Jackson, BCC', met_context: 'Workshop: Permission to Pause (Wed)', category: 'connection', trip_id: trip.id },
    { name: 'Nala Simone Toussaint', met_context: 'Workshop: Transcendent Healing (Wed)', category: 'connection', trip_id: trip.id },
    { name: 'Rev. Michael Washington, Ph.D.', met_context: 'Workshop: Creating Space for Mental Wellness (Wed)', category: 'connection', trip_id: trip.id },
    { name: 'Rev. Lauren Frazier-McGuin, MA, MDiv, BCC', met_context: 'Workshop: Womanist Approaches to Resistance in Healthcare Chaplaincy (Wed)', category: 'connection', trip_id: trip.id },
    { name: 'Jessica Young Brown, Ph.D.', met_context: 'Plenary: Wells of Joy (Wed)', category: 'connection', trip_id: trip.id },
    { name: 'Dr. Christophe Ringer', met_context: 'Seminar: Listening to Our Bodies for Real (Wed)', category: 'connection', trip_id: trip.id },
    { name: 'Rev. Jia Johnson', met_context: 'Seminar: Listening to Our Bodies for Real (Wed)', category: 'connection', trip_id: trip.id },
    { name: 'Rev. Dr. Gail Rice', organization: 'Associate Pastor of Ministry Development at Freedom Baptist Church', met_context: 'Evening Worship (Wed)', category: 'connection', trip_id: trip.id },
    { name: 'Dr. Candace M. Lewis', met_context: 'One-On-One Conversation with Dr. Danie (Thu)', category: 'connection', trip_id: trip.id },
    { name: 'Dr. Lee H. Butler, Jr.', met_context: 'One-On-One Conversation with Dr. Danie (Thu)', category: 'connection', trip_id: trip.id },
    { name: 'Natasha L. Robinson, JD', met_context: 'Workshop: Legal Issues in Sacred Spaces (Thu)', category: 'connection', trip_id: trip.id },
    { name: 'Rev. Annettra Jones', met_context: 'Workshop: Ministry in the Mirror (Thu)', category: 'connection', trip_id: trip.id },
    { name: 'Rev. Dr. Christal L. Bell, D.Min', met_context: 'Workshop: Pediatric Chaplaincy (Thu)', category: 'connection', trip_id: trip.id },
    { name: 'Rev. Dr. Wm. Marcus Small', met_context: 'Plenary: The Entanglement (Thu)', category: 'connection', trip_id: trip.id },
    { name: 'Rev. Dr. Irie Lynne Session', met_context: 'Workshop: Clergy Boundary Training (Thu) — Certificate provided', category: 'connection', trip_id: trip.id },
    { name: 'Rev. Dr. Jamie Eaddy', met_context: 'Workshop: Grief and Loss (Thu)', category: 'connection', trip_id: trip.id },
    { name: 'Pastor Elise Saulsberry', met_context: 'Seminar: Sacred Ego (Thu)', category: 'connection', trip_id: trip.id },
    { name: 'Rev. Dr. Reginald Williams Jr.', organization: 'Senior Pastor of First Baptist Church of University Park', met_context: 'Evening Worship (Thu)', category: 'connection', trip_id: trip.id },
    { name: 'Bishop Dr. Vanessa M. Brown', met_context: 'Plenary: Leading While Bleeding and Healing at the Same Time (Fri)', category: 'connection', trip_id: trip.id },
  ];
  const { error: speakerError } = await supabase
    .from('family_contacts')
    .insert(speakers);
  if (speakerError) throw speakerError;
  console.log(`${speakers.length} speakers created`);

  // 7. Create itinerary items
  const dayMap = Object.fromEntries(createdDays.map((d: any) => [d.date, d.id]));

  // Helper for building items
  const item = (
    date: string,
    title: string,
    start_time: string | null,
    category: string,
    sort_index: number,
    opts: {
      speaker?: string;
      track?: string;
      tags?: string[];
      notes?: string;
      link?: string;
      link_label?: string;
      location_id?: string;
      end_time?: string;
      description?: string;
    } = {}
  ) => ({
    trip_id: trip.id,
    day_id: dayMap[date],
    title,
    start_time,
    end_time: opts.end_time || null,
    category,
    item_type: 'activity' as const,
    sort_index,
    status: 'planned' as const,
    source: 'import' as const,
    speaker: opts.speaker || null,
    track: opts.track || null,
    tags: opts.tags || null,
    notes: opts.notes || null,
    link: opts.link || null,
    link_label: opts.link_label || null,
    location_id: opts.location_id || null,
    description: opts.description || null,
  });

  const items = [
    // ═══════════════════════════════════════════════════════════
    // APR 20 — TRAVEL DAY
    // ═══════════════════════════════════════════════════════════
    item('2026-04-20', 'Flight EWR → ORD (UA1525)', '10:22', 'transport', 0, {
      notes: 'Confirmation: PKMJGM. Arrive ORD 12:06 PM CT.',
    }),
    item('2026-04-20', 'Hotel Check-in', '15:00', 'accommodation', 1),
    item('2026-04-20', 'Dinner at Wildfire', '19:00', 'dining', 2),

    // ═══════════════════════════════════════════════════════════
    // APR 21 (TUE) — SANKOFA DAY 1: OPENING & REGISTRATION
    // ═══════════════════════════════════════════════════════════
    item('2026-04-21', 'Conference Registration', '12:00', 'event', 0, {
      tags: ['registration'],
      notes: 'Vendors Available',
      location_id: venueId,
    }),
    item('2026-04-21', 'Hotel Check In', '14:00', 'accommodation', 1),
    item('2026-04-21', 'One-On-One Conversation with Dr. Danie', '18:00', 'event', 2, {
      speaker: 'Dr. Nicholas Grier & Pastor Stephen J. Thurston, II',
      tags: ['conversation'],
      location_id: venueId,
    }),
    item('2026-04-21', 'Social Event / House Party', '19:00', 'social', 3, {
      tags: ['social'],
      notes: 'Vendors Available',
      location_id: venueId,
    }),

    // ═══════════════════════════════════════════════════════════
    // APR 22 (WED) — SANKOFA DAY 2: DEEP WORK
    // ═══════════════════════════════════════════════════════════
    item('2026-04-22', 'Continental Breakfast', '07:00', 'meal', 0, {
      tags: ['meal'],
      notes: 'Vendors Available',
      location_id: venueId,
    }),
    item('2026-04-22', 'Plenary: Shifting Toward Consistent Self-Care', '08:00', 'event', 1, {
      speaker: 'Dr. Nathaniel D. West, LPC',
      tags: ['plenary'],
      description: 'Reclaiming Emotional and Spiritual Well-Being for Pastors, Clergy & Chaplains',
      location_id: venueId,
    }),
    item('2026-04-22', 'One-On-One Conversation with Dr. Danie', '09:00', 'event', 2, {
      speaker: 'Dr. Pamela Ayo Yetunde & Dr. Nisa Muhammad',
      tags: ['conversation'],
      location_id: venueId,
    }),
    item('2026-04-22', 'Mid-Morning Break', '09:45', 'event', 3, {
      tags: ['break'],
      notes: 'Vendors Available',
    }),
    // 10:00 AM Concurrent Workshops (first session)
    item('2026-04-22', 'Joy as Resistance: Sustaining the Soul in the Struggle', '10:00', 'event', 4, {
      speaker: 'Rev. Vahisha Hasan',
      track: 'A',
      tags: ['workshop', 'track-a'],
      link: 'https://www.blackchaplainsrock.com/wednesdaysessions',
      link_label: 'Session details',
      location_id: venueId,
    }),
    item('2026-04-22', 'Spiritual Practices for Surviving and Thriving', '10:00', 'event', 5, {
      speaker: 'Rev. Dr. Ebony D. Only',
      track: 'B',
      tags: ['workshop', 'track-b'],
      link: 'https://www.blackchaplainsrock.com/wednesdaysessions',
      link_label: 'Session details',
      location_id: venueId,
    }),
    item('2026-04-22', 'Permission to Pause: Breaking the Cycle of Exhaustion in Ministry Leaders', '10:00', 'event', 6, {
      speaker: 'Dr. Sherri L. Jackson, BCC',
      track: 'C',
      tags: ['workshop', 'track-c'],
      link: 'https://www.blackchaplainsrock.com/wednesdaysessions',
      link_label: 'Session details',
      location_id: venueId,
    }),
    // 11:00 AM Concurrent Workshops (second session)
    item('2026-04-22', 'Transcendent Healing: Embodying Freedom in Ministry', '11:00', 'event', 7, {
      speaker: 'Nala Simone Toussaint',
      track: 'A',
      tags: ['workshop', 'track-a'],
      link: 'https://www.blackchaplainsrock.com/wednesdaysessions',
      link_label: 'Session details',
      location_id: venueId,
    }),
    item('2026-04-22', 'Creating Space for Mental Wellness in Our Sacred Spaces', '11:00', 'event', 8, {
      speaker: 'Rev. Michael Washington, Ph.D.',
      track: 'B',
      tags: ['workshop', 'track-b'],
      link: 'https://www.blackchaplainsrock.com/wednesdaysessions',
      link_label: 'Session details',
      location_id: venueId,
    }),
    item('2026-04-22', 'Womanist Approaches to Resistance in Healthcare Chaplaincy', '11:00', 'event', 9, {
      speaker: 'Rev. Lauren Frazier-McGuin, MA, MDiv, BCC',
      track: 'C',
      tags: ['workshop', 'track-c'],
      link: 'https://www.blackchaplainsrock.com/wednesdaysessions',
      link_label: 'Session details',
      location_id: venueId,
    }),
    item('2026-04-22', 'Lunch', '12:00', 'meal', 10, {
      tags: ['meal'],
      notes: 'Provided',
      location_id: venueId,
    }),
    item('2026-04-22', 'Plenary: Wells of Joy', '13:00', 'event', 11, {
      speaker: 'Jessica Young Brown, Ph.D.',
      tags: ['plenary'],
      location_id: venueId,
    }),
    // 2:00 PM Concurrent Workshops (repeat of morning tracks)
    item('2026-04-22', 'Joy as Resistance: Sustaining the Soul in the Struggle', '14:00', 'event', 12, {
      speaker: 'Rev. Vahisha Hasan',
      track: 'A',
      tags: ['workshop', 'track-a'],
      link: 'https://www.blackchaplainsrock.com/wednesdaysessions',
      link_label: 'Session details',
      location_id: venueId,
    }),
    item('2026-04-22', 'Spiritual Practices for Surviving and Thriving', '14:00', 'event', 13, {
      speaker: 'Rev. Dr. Ebony D. Only',
      track: 'B',
      tags: ['workshop', 'track-b'],
      link: 'https://www.blackchaplainsrock.com/wednesdaysessions',
      link_label: 'Session details',
      location_id: venueId,
    }),
    item('2026-04-22', 'Permission to Pause: Breaking the Cycle of Exhaustion in Ministry Leaders', '14:00', 'event', 14, {
      speaker: 'Dr. Sherri L. Jackson, BCC',
      track: 'C',
      tags: ['workshop', 'track-c'],
      link: 'https://www.blackchaplainsrock.com/wednesdaysessions',
      link_label: 'Session details',
      location_id: venueId,
    }),
    // 3:10 PM Concurrent Workshops (repeat of morning tracks)
    item('2026-04-22', 'Transcendent Healing: Embodying Freedom in Ministry', '15:10', 'event', 15, {
      speaker: 'Nala Simone Toussaint',
      track: 'A',
      tags: ['workshop', 'track-a'],
      link: 'https://www.blackchaplainsrock.com/wednesdaysessions',
      link_label: 'Session details',
      location_id: venueId,
    }),
    item('2026-04-22', 'Creating Space for Mental Wellness in Our Sacred Spaces', '15:10', 'event', 16, {
      speaker: 'Rev. Dr. Michael Washington',
      track: 'B',
      tags: ['workshop', 'track-b'],
      link: 'https://www.blackchaplainsrock.com/wednesdaysessions',
      link_label: 'Session details',
      location_id: venueId,
    }),
    item('2026-04-22', 'Womanist Approaches to Resistance in Healthcare Chaplaincy', '15:10', 'event', 17, {
      speaker: 'Rev. Lauren Frazier-McGuin, MA, MDiv, BCC',
      track: 'C',
      tags: ['workshop', 'track-c'],
      link: 'https://www.blackchaplainsrock.com/wednesdaysessions',
      link_label: 'Session details',
      location_id: venueId,
    }),
    item('2026-04-22', 'Free Seminar: Listening to Our Bodies for Real', '16:15', 'event', 18, {
      speaker: 'Dr. Christophe Ringer & Rev. Jia Johnson',
      tags: ['seminar'],
      description: 'Somatic and Spiritual Coaching for Chaplains',
      location_id: venueId,
    }),
    item('2026-04-22', 'Evening Worship', '19:00', 'event', 19, {
      speaker: 'Rev. Dr. Gail Rice',
      tags: ['worship'],
      notes: 'Associate Pastor of Ministry Development at Freedom Baptist Church',
      location_id: venueId,
    }),

    // ═══════════════════════════════════════════════════════════
    // APR 23 (THU) — SANKOFA DAY 3: HEALING & LEADERSHIP
    // ═══════════════════════════════════════════════════════════
    item('2026-04-23', 'Continental Breakfast', '07:00', 'meal', 0, {
      tags: ['meal'],
      notes: 'Vendors Available',
      location_id: venueId,
    }),
    item('2026-04-23', 'Morning Worship', '08:00', 'event', 1, {
      speaker: 'Rev. Dr. Ebony D. Only',
      tags: ['worship'],
      notes: 'Executive Pastor, Chaplain, Pastoral Care, Coach & Consultant',
      location_id: venueId,
    }),
    item('2026-04-23', 'One-On-One Conversation with Dr. Danie', '09:00', 'event', 2, {
      speaker: 'Dr. Candace M. Lewis & Dr. Lee H. Butler, Jr.',
      tags: ['conversation'],
      location_id: venueId,
    }),
    item('2026-04-23', 'Mid-Morning Break', '09:45', 'event', 3, {
      tags: ['break'],
    }),
    // 10:00 AM Concurrent Workshops
    item('2026-04-23', 'Legal Issues in Sacred Spaces', '10:00', 'event', 4, {
      speaker: 'Natasha L. Robinson, JD',
      track: 'A',
      tags: ['workshop', 'track-a'],
      link: 'https://www.blackchaplainsrock.com/thursdaysessions',
      link_label: 'Session details',
      location_id: venueId,
    }),
    item('2026-04-23', 'Ministry in the Mirror: Healing the Hidden Burdens of Shame and Imposter Syndrome', '10:00', 'event', 5, {
      speaker: 'Rev. Annettra Jones',
      track: 'B',
      tags: ['workshop', 'track-b'],
      link: 'https://www.blackchaplainsrock.com/thursdaysessions',
      link_label: 'Session details',
      location_id: venueId,
    }),
    item('2026-04-23', 'Pediatric Chaplaincy', '10:00', 'event', 6, {
      speaker: 'Rev. Dr. Christal L. Bell, D.Min',
      track: 'C',
      tags: ['workshop', 'track-c'],
      link: 'https://www.blackchaplainsrock.com/thursdaysessions',
      link_label: 'Session details',
      location_id: venueId,
    }),
    item('2026-04-23', 'Mid-Morning Break', '11:00', 'event', 7, {
      tags: ['break'],
      notes: 'Vendors Available',
    }),
    item('2026-04-23', 'Plenary: The Entanglement', '11:15', 'event', 8, {
      speaker: 'Rev. Dr. Wm. Marcus Small',
      tags: ['plenary'],
      description: 'The Complexities of Self-Care for the Caregiver',
      location_id: venueId,
    }),
    item('2026-04-23', 'Lunch', '12:15', 'meal', 9, {
      tags: ['meal'],
      notes: 'Provided. Vendors Available.',
      location_id: venueId,
    }),
    // 1:30 PM Concurrent Workshops
    item('2026-04-23', 'Spiritual Entrepreneurship: C.R.E.A.M.', '13:30', 'event', 10, {
      speaker: 'Dr. Danie J. Buhuro',
      track: 'A',
      tags: ['workshop', 'track-a'],
      description: 'Cash Rules Everything Around Me',
      link: 'https://www.blackchaplainsrock.com/thursdaysessions',
      link_label: 'Session details',
      location_id: venueId,
    }),
    item('2026-04-23', 'Clergy Boundary Training', '13:30', 'event', 11, {
      speaker: 'Rev. Dr. Irie Lynne Session',
      track: 'B',
      tags: ['workshop', 'track-b'],
      notes: 'Certificate of Completion provided',
      link: 'https://www.blackchaplainsrock.com/thursdaysessions',
      link_label: 'Session details',
      location_id: venueId,
    }),
    item('2026-04-23', 'Grief and Loss', '13:30', 'event', 12, {
      speaker: 'Rev. Dr. Jamie Eaddy',
      track: 'C',
      tags: ['workshop', 'track-c'],
      link: 'https://www.blackchaplainsrock.com/thursdaysessions',
      link_label: 'Session details',
      location_id: venueId,
    }),
    // 2:45 PM Concurrent Workshops (repeat)
    item('2026-04-23', 'Spiritual Entrepreneurship: C.R.E.A.M.', '14:45', 'event', 13, {
      speaker: 'Dr. Danie J. Buhuro',
      track: 'A',
      tags: ['workshop', 'track-a'],
      description: 'Cash Rules Everything Around Me',
      link: 'https://www.blackchaplainsrock.com/thursdaysessions',
      link_label: 'Session details',
      location_id: venueId,
    }),
    item('2026-04-23', 'Clergy Boundary Training', '14:45', 'event', 14, {
      speaker: 'Rev. Dr. Irie Lynne Session',
      track: 'B',
      tags: ['workshop', 'track-b'],
      notes: 'Certificate of Completion provided',
      link: 'https://www.blackchaplainsrock.com/thursdaysessions',
      link_label: 'Session details',
      location_id: venueId,
    }),
    item('2026-04-23', 'Grief and Loss', '14:45', 'event', 15, {
      speaker: 'Rev. Dr. Jamie Eaddy',
      track: 'C',
      tags: ['workshop', 'track-c'],
      link: 'https://www.blackchaplainsrock.com/thursdaysessions',
      link_label: 'Session details',
      location_id: venueId,
    }),
    item('2026-04-23', 'Free Seminar: Sacred Ego — Power, Control, and Unchecked Authority', '16:15', 'event', 16, {
      speaker: 'Pastor Elise Saulsberry',
      tags: ['seminar'],
      location_id: venueId,
    }),
    item('2026-04-23', 'Evening Worship', '18:30', 'event', 17, {
      speaker: 'Rev. Dr. Reginald Williams Jr.',
      tags: ['worship'],
      notes: 'Senior Pastor of First Baptist Church of University Park',
      location_id: venueId,
    }),

    // ═══════════════════════════════════════════════════════════
    // APR 24 (FRI) — SANKOFA DAY 4: CLOSING
    // ═══════════════════════════════════════════════════════════
    item('2026-04-24', 'Continental Breakfast', '07:30', 'meal', 0, {
      tags: ['meal'],
      notes: 'Vendors Available',
      location_id: venueId,
    }),
    item('2026-04-24', 'Plenary: Leading While Bleeding and Healing at the Same Time', '08:30', 'event', 1, {
      speaker: 'Bishop Dr. Vanessa M. Brown',
      tags: ['plenary'],
      link: 'https://www.blackchaplainsrock.com/fridaysessions',
      link_label: 'Session details',
      location_id: venueId,
    }),
    item('2026-04-24', 'Sankofa Address', '09:30', 'event', 2, {
      speaker: 'Dr. Danie J. Buhuro',
      tags: ['plenary', 'keynote'],
      location_id: venueId,
    }),
    item('2026-04-24', 'Conclusion / Departure', '10:45', 'event', 3, {
      tags: ['closing'],
      location_id: venueId,
    }),

    // ═══════════════════════════════════════════════════════════
    // APR 25 — FREE DAY (keep times)
    // ═══════════════════════════════════════════════════════════
    item('2026-04-25', 'Brookfield Zoo', '10:00', 'activity', 0),
    item('2026-04-25', 'Explore Downtown', '14:00', 'activity', 1),
    item('2026-04-25', 'Final Dinner — Seasons 52', '19:00', 'dining', 2),

    // ═══════════════════════════════════════════════════════════
    // APR 26 — DEPARTURE
    // ═══════════════════════════════════════════════════════════
    item('2026-04-26', 'Flight ORD → EWR (UA563)', '07:00', 'transport', 0, {
      notes: 'Confirmation: PKMJGM. Arrive EWR 10:20 AM ET.',
    }),
  ];

  const { error: itemError } = await supabase
    .from('itinerary_items')
    .insert(items);
  if (itemError) throw itemError;
  console.log(`${items.length} itinerary items created`);

  console.log('\nSankofa 2026 trip scaffold complete!');
  console.log(`Trip ID: ${trip.id}`);
  console.log(`Conference venue: ${venueId}`);
  console.log(`Total items: ${items.length}`);
}

seed().catch(console.error);
