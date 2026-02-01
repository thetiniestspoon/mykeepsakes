import { useState, useEffect, useCallback, useMemo } from 'react';
import { useActiveTrip } from '@/hooks/use-trip';
import { getTripMode } from '@/hooks/use-trip';
import type { LegacyDay, LegacyActivity } from '@/hooks/use-database-itinerary';

const STORAGE_KEY = 'itinerary-today-mode';

export function useTodayMode(days: LegacyDay[]) {
  const { data: trip } = useActiveTrip();
  const [isTodayMode, setIsTodayMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    }
    return false;
  });
  
  const mode = trip ? getTripMode(trip) : 'pre';
  
  // Get today's date as a string for comparison
  const todayStr = useMemo(() => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }, []);
  
  // Filter days to show only today when in today mode
  const filteredDays = useMemo(() => {
    if (!isTodayMode || mode !== 'active') {
      return days;
    }
    
    // Find today's day based on the date string matching
    const todayDay = days.find(day => day.date === todayStr);
    return todayDay ? [todayDay] : [];
  }, [days, isTodayMode, mode, todayStr]);
  
  // Find the next planned activity for auto-scroll
  const nextPlannedActivity = useMemo((): { dayId: string; activityId: string } | null => {
    if (mode !== 'active') return null;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Parse time string like "10:00 AM" to hours and minutes
    const parseTime = (timeStr: string): { hours: number; minutes: number } | null => {
      const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!match) return null;
      
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const period = match[3].toUpperCase();
      
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      return { hours, minutes };
    };
    
    // Find the day that matches today
    const todayDay = days.find(day => day.date === todayStr);
    if (!todayDay) return null;
    
    // Get activities that are not completed and have a time
    const plannedActivities = todayDay.activities
      .filter(a => a.itemType === 'activity' && a.status !== 'done' && a.time)
      .map(a => {
        const time = parseTime(a.time!);
        return { activity: a, time };
      })
      .filter(a => a.time !== null)
      .sort((a, b) => {
        const aMinutes = a.time!.hours * 60 + a.time!.minutes;
        const bMinutes = b.time!.hours * 60 + b.time!.minutes;
        return aMinutes - bMinutes;
      });
    
    // Find the next activity (first one that's >= current time)
    const currentMinutes = currentHour * 60 + currentMinute;
    const nextActivity = plannedActivities.find(a => {
      const activityMinutes = a.time!.hours * 60 + a.time!.minutes;
      return activityMinutes >= currentMinutes;
    });
    
    if (nextActivity) {
      return {
        dayId: todayDay.id,
        activityId: nextActivity.activity.id
      };
    }
    
    // If no future activity, return the first planned one
    if (plannedActivities.length > 0) {
      return {
        dayId: todayDay.id,
        activityId: plannedActivities[0].activity.id
      };
    }
    
    return null;
  }, [days, mode, todayStr]);
  
  // Toggle today mode
  const toggleTodayMode = useCallback(() => {
    setIsTodayMode(prev => {
      const newValue = !prev;
      localStorage.setItem(STORAGE_KEY, String(newValue));
      return newValue;
    });
  }, []);
  
  // Auto-scroll to the next planned activity when entering today mode
  useEffect(() => {
    if (isTodayMode && nextPlannedActivity) {
      // Small delay to ensure the DOM is ready
      const timer = setTimeout(() => {
        const element = document.querySelector(`[data-activity-id="${nextPlannedActivity.activityId}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isTodayMode, nextPlannedActivity]);
  
  return {
    isTodayMode,
    toggleTodayMode,
    filteredDays,
    nextPlannedActivity,
    isActiveTrip: mode === 'active',
    hasTodayContent: filteredDays.length > 0 || mode !== 'active'
  };
}
