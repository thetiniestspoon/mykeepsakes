import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Mock data
const mockAccommodations = [
  {
    id: '1',
    title: 'Beach House',
    trip_id: 'trip-1',
    is_selected: false,
    is_deprioritized: false,
    sort_order: 0,
    url: 'https://example.com',
    address: '123 Beach St',
    notes: 'Nice place',
    check_in: null,
    check_out: null,
    location_lat: null,
    location_lng: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Mountain Cabin',
    trip_id: 'trip-1',
    is_selected: true,
    is_deprioritized: false,
    sort_order: 1,
    url: 'https://cabin.com',
    address: '456 Mountain Rd',
    notes: null,
    check_in: null,
    check_out: null,
    location_lat: null,
    location_lng: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Deprioritized Option',
    trip_id: 'trip-1',
    is_selected: false,
    is_deprioritized: true,
    sort_order: 2,
    url: null,
    address: null,
    notes: null,
    check_in: null,
    check_out: null,
    location_lat: null,
    location_lng: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockAccommodations, error: null }),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockAccommodations[0], error: null }),
    }),
  },
}));

// Mock useActiveTrip
vi.mock('@/hooks/use-trip', () => ({
  useActiveTrip: vi.fn().mockReturnValue({
    data: { id: 'trip-1', title: 'Test Trip' },
    isLoading: false,
  }),
}));

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

describe('Accommodation Hook Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAccommodations', () => {
    it('should be callable without arguments', async () => {
      const { useAccommodations } = await import('@/hooks/use-accommodations');
      
      const { result } = renderHook(() => useAccommodations(), {
        wrapper: createWrapper(),
      });
      
      // Just verify hook doesn't throw
      expect(result.current).toBeDefined();
    });
  });

  describe('Accommodation Ordering', () => {
    it('should order deprioritized items after regular items', () => {
      const sorted = [...mockAccommodations].sort((a, b) => {
        // Deprioritized items go last
        if (a.is_deprioritized !== b.is_deprioritized) {
          return a.is_deprioritized ? 1 : -1;
        }
        // Then by sort_order
        return (a.sort_order || 0) - (b.sort_order || 0);
      });
      
      expect(sorted[0].id).toBe('1'); // Beach House (not deprioritized, sort 0)
      expect(sorted[1].id).toBe('2'); // Mountain Cabin (not deprioritized, sort 1)
      expect(sorted[2].id).toBe('3'); // Deprioritized Option
    });

    it('should identify selected accommodation', () => {
      const selected = mockAccommodations.find(a => a.is_selected);
      expect(selected?.title).toBe('Mountain Cabin');
    });
  });
});
