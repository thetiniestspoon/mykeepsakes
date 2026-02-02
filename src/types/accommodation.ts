// Accommodation types for the Stay detail panel

export interface Accommodation {
  id: string;
  trip_id: string;
  title: string;
  url: string | null;
  is_selected: boolean;
  address: string | null;
  check_in: string | null;
  check_out: string | null;
  notes: string | null;
  location_lat: number | null;
  location_lng: number | null;
  sort_order: number;
  is_deprioritized: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccommodationInsert {
  title: string;
  url?: string;
}

export interface AccommodationSelectDetails {
  address: string;
  check_in?: string;
  check_out?: string;
  notes?: string;
  location_lat?: number;
  location_lng?: number;
}
