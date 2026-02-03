import { useMemo } from 'react';
import type { LegacyDay, LegacyActivity } from '@/hooks/use-database-itinerary';

export interface FlattenedItem {
  id: string;
  dayId: string;
  dayDate: string;      // ISO date "2026-07-15"
  dayIndex: number;     // Day position (0-based)
  startTime: string | null;  // "HH:mm:ss" or null
  endTime: string | null;
  sortIndex: number;
  globalIndex: number;  // Position across ALL items
  title: string;
  category: string;
  activity: LegacyActivity;  // Original activity reference
}

/**
 * Extract ISO date from formatted date string
 * e.g., "Monday, July 15, 2026" -> "2026-07-15"
 */
function extractISODate(formattedDate: string): string {
  try {
    const date = new Date(formattedDate);
    if (isNaN(date.getTime())) {
      // Fallback: return as-is if parsing fails
      return formattedDate;
    }
    return date.toISOString().split('T')[0];
  } catch {
    return formattedDate;
  }
}

/**
 * Hook to flatten all itinerary items across days into a single sorted array
 * Useful for cross-day drag operations
 */
export function useFlattenedItinerary(days: LegacyDay[]): FlattenedItem[] {
  return useMemo(() => {
    let globalIdx = 0;
    return days.flatMap((day, dayIndex) => 
      day.activities.map(activity => ({
        id: activity.id,
        dayId: day.id,
        dayDate: extractISODate(day.date),
        dayIndex,
        startTime: activity.rawStartTime || null,
        endTime: activity.rawEndTime || null,
        sortIndex: globalIdx,
        globalIndex: globalIdx++,
        title: activity.title,
        category: activity.category,
        activity,
      }))
    );
  }, [days]);
}

/**
 * Get all items for a specific day
 */
export function getItemsForDay(items: FlattenedItem[], dayId: string): FlattenedItem[] {
  return items.filter(item => item.dayId === dayId);
}

/**
 * Find item by ID
 */
export function findItemById(items: FlattenedItem[], itemId: string): FlattenedItem | undefined {
  return items.find(item => item.id === itemId);
}

/**
 * Get next/previous day info relative to current day
 */
export function getAdjacentDay(
  days: LegacyDay[], 
  currentDayId: string, 
  direction: 'next' | 'prev'
): LegacyDay | undefined {
  const currentIndex = days.findIndex(d => d.id === currentDayId);
  if (currentIndex === -1) return undefined;
  
  const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
  return days[targetIndex];
}
