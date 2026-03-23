export type MemoryType = 'photo' | 'reflection' | 'dispatch';

export type InsightTag = 'insight' | 'quote' | 'training-seed' | 'personal' | 'logistics';

export const INSIGHT_TAGS: { value: InsightTag; label: string; color: string }[] = [
  { value: 'insight', label: 'Insight', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'quote', label: 'Quote', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'training-seed', label: 'Training Seed', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'personal', label: 'Personal', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { value: 'logistics', label: 'Logistics', color: 'bg-gray-100 text-gray-800 border-gray-300' },
];

export interface DispatchItem {
  id: string;
  dispatch_id: string;
  item_type: 'reflection' | 'activity' | 'photo';
  item_id: string;
  sort_order: number;
  section: 'scene' | 'insight' | 'closing';
  created_at: string;
}

export interface Connection {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  organization: string | null;
  met_context: string | null;
  trip_id: string | null;
  day_id: string | null;
  photo_path: string | null;
  relationship: string | null;
  category: string;
  emergency_info: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
