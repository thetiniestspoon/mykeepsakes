export type PinState = 'planned' | 'visited' | 'favorited' | 'has-memories';

export interface MapLocation {
  id: string;
  lat: number;
  lng: number;
  name: string;
  category: string;
  address?: string;
  dayId?: string;
  dayLabel?: string;
  // Enhanced pin state info
  pinState?: PinState;
  isVisited?: boolean;
  isFavorited?: boolean;
  hasMemories?: boolean;
  phone?: string;
  url?: string;
  notes?: string;
}
