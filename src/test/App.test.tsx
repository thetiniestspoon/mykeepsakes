import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';

// This test exists because deleting <HouseAuthGate> from Index.tsx (or from the
// /preview/collage route in App.tsx) would leave the whole suite green while the
// app went wide open — the single largest coverage gap on this branch (Finding 4).
// It renders the REAL routed App with a REAL HouseAuthGate and asserts the PIN
// screen — not dashboard/collage content — is what shows up with no session.

const getSession = vi.fn();
const onAuthStateChange = vi.fn();
const signOut = vi.fn();
const unsubscribe = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: (...a: unknown[]) => getSession(...a),
      onAuthStateChange: (...a: unknown[]) => onAuthStateChange(...a),
      signOut: (...a: unknown[]) => signOut(...a),
    },
  },
}));

// Index calls these hooks unconditionally (outside the gate), so they need a
// safe stub regardless of admission state. Mocked, not the thing under test.
vi.mock('@/hooks/use-trip', () => ({
  useActiveTrip: () => ({ data: undefined }),
  useTripDays: () => ({ data: [] }),
  getTripMode: () => 'pre',
  getCurrentDayIndex: () => 0,
}));

vi.mock('@/hooks/use-dashboard-mode', () => ({
  useDashboardMode: () => ({
    isDashboard: true,
    isWideLayout: false,
    isPortrait: true,
    isMobileLandscape: false,
  }),
}));

const { default: App } = await import('@/App');

const PIN_SCREEN_MARKER = /same four emoji as the arcade/i;

function goTo(path: string) {
  window.history.pushState({}, '', path);
}

beforeEach(() => {
  getSession.mockReset();
  onAuthStateChange.mockReset();
  signOut.mockReset();
  unsubscribe.mockReset();
  onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } });
  getSession.mockResolvedValue({ data: { session: null } });
});

describe('routed app auth gating (Finding 4)', () => {
  it('requires the house PIN at / when there is no session', async () => {
    goTo('/mykeepsakes/');
    render(<App />);
    await waitFor(() => expect(screen.getByText(PIN_SCREEN_MARKER)).toBeInTheDocument());
    cleanup();
  });

  it('requires the house PIN at /preview/collage/album when there is no session', async () => {
    goTo('/mykeepsakes/preview/collage/album');
    render(<App />);
    await waitFor(() => expect(screen.getByText(PIN_SCREEN_MARKER)).toBeInTheDocument());
    cleanup();
  });
});
