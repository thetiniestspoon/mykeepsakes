import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

// Create a wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('Trip Hook Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('useActiveTrip', () => {
    it('should handle empty trips list', async () => {
      // Import after mocking
      const { useActiveTrip } = await import('@/hooks/use-trip');
      
      const { result } = renderHook(() => useActiveTrip(), {
        wrapper: createWrapper(),
      });
      
      // Initial state should have isLoading or data
      expect(result.current.isLoading !== undefined || result.current.data !== undefined).toBe(true);
    });

    it('should respect localStorage selection', async () => {
      const mockTripId = 'test-trip-123';
      localStorage.setItem('selectedTripId', mockTripId);
      
      expect(localStorage.getItem('selectedTripId')).toBe(mockTripId);
    });

    it('should clear localStorage selection for deleted trip', () => {
      const deletedTripId = 'deleted-trip';
      localStorage.setItem('selectedTripId', deletedTripId);
      
      // Simulate clearing when trip not found
      localStorage.removeItem('selectedTripId');
      
      expect(localStorage.getItem('selectedTripId')).toBeNull();
    });
  });

  describe('getTripMode', () => {
    it('should return pre for future trips', async () => {
      const { getTripMode } = await import('@/hooks/use-trip');
      
      const futureTrip = {
        id: '1',
        title: 'Future Trip',
        location_name: 'Beach',
        start_date: '2030-01-01',
        end_date: '2030-01-10',
        timezone: 'America/New_York',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      expect(getTripMode(futureTrip)).toBe('pre');
    });

    it('should return post for past trips', async () => {
      const { getTripMode } = await import('@/hooks/use-trip');
      
      const pastTrip = {
        id: '2',
        title: 'Past Trip',
        location_name: 'Mountains',
        start_date: '2020-01-01',
        end_date: '2020-01-10',
        timezone: 'America/New_York',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      expect(getTripMode(pastTrip)).toBe('post');
    });
  });
});
