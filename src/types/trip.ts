// Trip App Core Types
// These correspond to the new database schema

export type TripMode = 'pre' | 'active' | 'post';

export interface Trip {
  id: string;
  title: string;
  location_name: string | null;
  start_date: string; // DATE as ISO string
  end_date: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface ItineraryDay {
  id: string;
  trip_id: string;
  date: string; // DATE as ISO string
  title: string | null;
  sort_index: number;
  created_at: string;
  updated_at: string;
}

export type ItemType = 'activity' | 'marker';
export type ItemStatus = 'planned' | 'done' | 'skipped';
export type ItemSource = 'manual' | 'import';
export type ItemCategory = 'activity' | 'dining' | 'beach' | 'accommodation' | 'transport' | 'event';

export interface ItineraryItem {
  id: string;
  trip_id: string;
  day_id: string;
  title: string;
  description: string | null;
  start_time: string | null; // TIME as string HH:MM:SS
  end_time: string | null;
  category: ItemCategory;
  item_type: ItemType;
  location_id: string | null;
  source: ItemSource;
  external_ref: string | null;
  sort_index: number;
  status: ItemStatus;
  completed_at: string | null;
  link: string | null;
  link_label: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  location?: Location | null;
}

export interface Location {
  id: string;
  trip_id: string;
  name: string;
  category: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  url: string | null;
  notes: string | null;
  visited_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocationDay {
  id: string;
  location_id: string;
  day_id: string;
  created_at: string;
}

export interface Memory {
  id: string;
  trip_id: string;
  title: string | null;
  note: string | null;
  day_id: string | null;
  itinerary_item_id: string | null;
  location_id: string | null;
  created_at: string;
  // Joined data
  media?: MemoryMedia[];
  day?: ItineraryDay | null;
  itinerary_item?: ItineraryItem | null;
  location?: Location | null;
}

export type MediaType = 'image' | 'video';

export interface MemoryMedia {
  id: string;
  memory_id: string;
  storage_path: string;
  media_type: MediaType;
  mime_type: string | null;
  byte_size: number | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  thumbnail_path: string | null;
  created_at: string;
}

export type SharePermission = 'read';

export interface TripShareLink {
  id: string;
  trip_id: string;
  token: string;
  permission: SharePermission;
  expires_at: string | null;
  created_at: string;
}

// Utility type for polymorphic favorites
export type FavoriteEntityType = 'itinerary_item' | 'location' | 'memory';

export interface Favorite {
  id: string;
  trip_id: string | null;
  entity_type: FavoriteEntityType;
  entity_id: string;
  created_at: string;
}
