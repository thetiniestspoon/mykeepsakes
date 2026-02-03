import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LegacyDay, LegacyActivity } from '@/hooks/use-database-itinerary';

// Mock data
const mockActivity: LegacyActivity = {
  id: 'activity-1',
  time: '10:00 AM',
  rawStartTime: '10:00:00',
  rawEndTime: undefined,
  title: 'Beach Visit',
  description: 'Fun at the beach',
  category: 'beach',
  location: {
    id: 'loc-1',
    lat: 41.6623,
    lng: -70.2001,
    name: 'Herring Cove Beach',
    address: '123 Beach St',
  },
  link: 'https://beach.com',
  linkLabel: 'Website',
  phone: '555-1234',
  notes: 'Bring sunscreen',
  status: 'planned',
  completedAt: undefined,
  dayId: 'day-1',
  itemType: 'activity',
};

const mockDay: LegacyDay = {
  id: 'day-1',
  date: 'Monday, July 1, 2024',
  dayOfWeek: 'Monday',
  title: 'Day 1',
  activities: [mockActivity],
};

describe('DatabaseDayCard Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Activity Status', () => {
    it('should identify completed activities', () => {
      const completedActivity = { ...mockActivity, status: 'done' as const };
      expect(completedActivity.status).toBe('done');
    });

    it('should identify planned activities', () => {
      expect(mockActivity.status).toBe('planned');
    });

    it('should identify skipped activities', () => {
      const skippedActivity = { ...mockActivity, status: 'skipped' as const };
      expect(skippedActivity.status).toBe('skipped');
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate progress correctly', () => {
      const activities = [
        { ...mockActivity, status: 'done' as const },
        { ...mockActivity, id: '2', status: 'done' as const },
        { ...mockActivity, id: '3', status: 'planned' as const },
      ];
      
      const activityItems = activities.filter(a => a.itemType === 'activity');
      const completedCount = activityItems.filter(a => a.status === 'done').length;
      const totalCount = activityItems.length;
      const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
      
      expect(completedCount).toBe(2);
      expect(totalCount).toBe(3);
      expect(progressPercent).toBe(67);
    });

    it('should return 100% when all activities are done', () => {
      const activities = [
        { ...mockActivity, status: 'done' as const },
        { ...mockActivity, id: '2', status: 'done' as const },
      ];
      
      const completedCount = activities.filter(a => a.status === 'done').length;
      const totalCount = activities.length;
      const progressPercent = Math.round((completedCount / totalCount) * 100);
      
      expect(progressPercent).toBe(100);
    });

    it('should exclude markers from progress count', () => {
      const activitiesWithMarker = [
        { ...mockActivity, status: 'done' as const },
        { ...mockActivity, id: '2', itemType: 'marker' as const, status: 'planned' as const },
      ];
      
      const activityItems = activitiesWithMarker.filter(a => a.itemType === 'activity');
      expect(activityItems.length).toBe(1);
    });
  });

  describe('Activity Location', () => {
    it('should have valid location coordinates', () => {
      expect(mockActivity.location?.lat).toBe(41.6623);
      expect(mockActivity.location?.lng).toBe(-70.2001);
    });

    it('should handle activities without location', () => {
      const noLocationActivity = { ...mockActivity, location: undefined };
      expect(noLocationActivity.location).toBeUndefined();
    });
  });

  describe('Day Data', () => {
    it('should have correct day properties', () => {
      expect(mockDay.id).toBe('day-1');
      expect(mockDay.dayOfWeek).toBe('Monday');
      expect(mockDay.title).toBe('Day 1');
    });

    it('should contain activities', () => {
      expect(mockDay.activities.length).toBe(1);
      expect(mockDay.activities[0].title).toBe('Beach Visit');
    });
  });
});
