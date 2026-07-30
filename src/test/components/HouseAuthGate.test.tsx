import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

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

vi.mock('@/components/auth/HousePinEntry', () => ({
  HousePinEntry: () => <div>PIN ENTRY</div>,
}));
vi.mock('@/components/auth/NotAdmittedNotice', () => ({
  NotAdmittedNotice: () => <div>NOT ADMITTED</div>,
}));

const { HouseAuthGate } = await import('@/components/auth/HouseAuthGate');

function sessionFor(email: string | null) {
  return { data: { session: { user: { email } } } };
}

beforeEach(() => {
  getSession.mockReset();
  onAuthStateChange.mockReset();
  signOut.mockReset();
  unsubscribe.mockReset();
  onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } });
});

describe('HouseAuthGate', () => {
  it('renders the app when an admitted persona already has a house session', async () => {
    getSession.mockResolvedValue(sessionFor('runx31021@gmail.com'));
    render(<HouseAuthGate><div>THE APP</div></HouseAuthGate>);
    await waitFor(() => expect(screen.getByText('THE APP')).toBeInTheDocument());
  });

  it('shows PIN entry when there is no session', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    render(<HouseAuthGate><div>THE APP</div></HouseAuthGate>);
    await waitFor(() => expect(screen.getByText('PIN ENTRY')).toBeInTheDocument());
    expect(screen.queryByText('THE APP')).toBeNull();
  });

  it('shows the notice for Nanny and NEVER signs her out', async () => {
    getSession.mockResolvedValue(sessionFor('cindy-nanny@family.internal'));
    render(<HouseAuthGate><div>THE APP</div></HouseAuthGate>);
    await waitFor(() => expect(screen.getByText('NOT ADMITTED')).toBeInTheDocument());
    expect(screen.queryByText('THE APP')).toBeNull();
    // Spec D6: the session is shared with the arcade games she IS entitled to.
    expect(signOut).not.toHaveBeenCalled();
  });

  it('denies a session with no email rather than admitting it', async () => {
    getSession.mockResolvedValue(sessionFor(null));
    render(<HouseAuthGate><div>THE APP</div></HouseAuthGate>);
    await waitFor(() => expect(screen.getByText('NOT ADMITTED')).toBeInTheDocument());
    expect(signOut).not.toHaveBeenCalled();
  });

  it('locks back to PIN entry when the session goes away mid-use', async () => {
    getSession.mockResolvedValue(sessionFor('runx31021@gmail.com'));
    render(<HouseAuthGate><div>THE APP</div></HouseAuthGate>);
    await waitFor(() => expect(screen.getByText('THE APP')).toBeInTheDocument());

    const handler = onAuthStateChange.mock.calls[0][0] as (e: string, s: unknown) => void;
    handler('SIGNED_OUT', null);
    await waitFor(() => expect(screen.getByText('PIN ENTRY')).toBeInTheDocument());
  });

  it('lands in locked (PIN entry) when getSession rejects, rather than spinning forever', async () => {
    getSession.mockRejectedValue(new Error('corrupt storage slot'));
    render(<HouseAuthGate><div>THE APP</div></HouseAuthGate>);
    await waitFor(() => expect(screen.getByText('PIN ENTRY')).toBeInTheDocument());
    expect(screen.queryByText('THE APP')).toBeNull();
    expect(signOut).not.toHaveBeenCalled();
  });

  it('unsubscribes on unmount', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    const { unmount } = render(<HouseAuthGate><div>THE APP</div></HouseAuthGate>);
    await waitFor(() => expect(screen.getByText('PIN ENTRY')).toBeInTheDocument());
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
