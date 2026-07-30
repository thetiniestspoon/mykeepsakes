import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
  },
}));

const { SettingsDialog } = await import('@/components/SettingsDialog');

function wrap(node: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={qc}>{node}</QueryClientProvider>;
}

describe('SettingsDialog after house auth', () => {
  it('no longer offers to change a MyKeepsakes-local PIN', () => {
    render(wrap(<SettingsDialog open onOpenChange={() => {}} onLogout={() => {}} />));
    expect(screen.queryByText(/set new emoji pin/i)).toBeNull();
    expect(screen.queryByText(/change pin/i)).toBeNull();
  });

  it('warns that signing out is house-wide', () => {
    render(wrap(<SettingsDialog open onOpenChange={() => {}} onLogout={() => {}} />));
    expect(screen.getByText(/house/i)).toBeInTheDocument();
  });
});
