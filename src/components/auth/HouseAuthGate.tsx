import { useEffect, useState, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { isAdmitted } from '@/lib/house-auth';
import { HousePinEntry } from '@/components/auth/HousePinEntry';
import { NotAdmittedNotice } from '@/components/auth/NotAdmittedNotice';

type GateState =
  | { status: 'loading' }
  | { status: 'locked' }
  | { status: 'admitted' }
  | { status: 'denied' };

/**
 * Gates MyKeepsakes on the SHARED Oak Park Supabase session.
 *
 * There is no app-local auth flag any more. If the house or an arcade game has
 * already signed this device in, the app simply opens. If not, we show the PIN
 * pad, which lands a session in the same shared slot.
 *
 * A denied persona is shown a notice and is deliberately NOT signed out — the
 * session belongs to the whole house, and evicting them here would evict them
 * from the games they are entitled to (spec D6).
 */
export function HouseAuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>({ status: 'loading' });

  useEffect(() => {
    let active = true;

    const apply = (session: { user?: { email?: string | null } } | null) => {
      if (!active) return;
      if (!session) {
        setState({ status: 'locked' });
        return;
      }
      setState(isAdmitted(session.user?.email) ? { status: 'admitted' } : { status: 'denied' });
    };

    supabase.auth
      .getSession()
      .then(({ data }) => apply(data.session))
      .catch(() => apply(null));

    const { data } = supabase.auth.onAuthStateChange((_event, session) => apply(session));

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (state.status === 'loading') {
    return (
      <div className="min-h-screen bg-beach-gradient flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking your house key...</p>
        </div>
      </div>
    );
  }

  if (state.status === 'locked') {
    // onAuthStateChange fires on the new session, which flips us to admitted or
    // denied — so this callback only needs to exist, not to carry state.
    return <HousePinEntry onAuthenticated={() => {}} />;
  }

  if (state.status === 'denied') {
    return <NotAdmittedNotice />;
  }

  return <>{children}</>;
}
