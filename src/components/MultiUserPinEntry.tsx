import { useState, useEffect, useCallback } from 'react';
import { CollageRoot } from '@/preview/collage/CollageRoot';
import { CollageEmojiPad } from '@/components/auth/CollageEmojiPad';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { StickerPill } from '@/preview/collage/ui/StickerPill';
import { MarginNote } from '@/preview/collage/ui/MarginNote';
import { Tape } from '@/preview/collage/ui/Tape';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface MultiUserPinEntryProps {
  onSuccess: (email: string, displayName: string) => void;
}

/**
 * PIN entry — migrated to Collage direction 2026-04-17.
 * Auth logic (edge-function verify, rate-limit lockout, sessionStorage) unchanged.
 * Only the presentation swapped to Collage tokens + Centered Card layout (PinV1).
 */
export function MultiUserPinEntry({ onSuccess }: MultiUserPinEntryProps) {
  const [step, setStep] = useState<'email' | 'pin'>('email');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds(s => {
        if (s <= 1) {
          setError(null);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    setStep('pin');
  };

  const handlePinSubmit = useCallback(
    async (emojiPin: string[]) => {
      if (lockoutSeconds > 0) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-user-pin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.toLowerCase().trim(), emojiPin: emojiPin.join('') }),
        });

        const data = await res.json();

        if (res.status === 429) {
          setLockoutSeconds(data.lockout_seconds || 300);
          setError(`Too many attempts. Try again in ${data.lockout_seconds || 300}s.`);
          setShake(true);
          setTimeout(() => setShake(false), 500);
          return;
        }

        if (!res.ok || !data.success) {
          const remaining = data.attempts_remaining;
          const msg =
            remaining != null && remaining <= 2
              ? `Incorrect PIN. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
              : 'Incorrect email or PIN. Please try again.';
          setError(msg);
          setShake(true);
          setTimeout(() => setShake(false), 500);
          setTimeout(() => setError(null), 3000);
          return;
        }

        sessionStorage.setItem('mk-authenticated', 'true');
        sessionStorage.setItem('mk-user-email', data.email);
        sessionStorage.setItem('mk-user-name', data.display_name);
        onSuccess(data.email, data.display_name);
      } catch {
        setError('Connection error. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [email, lockoutSeconds, onSuccess],
  );

  const handleBackToEmail = () => {
    setStep('email');
    setError(null);
    setLockoutSeconds(0);
  };

  return (
    <CollageRoot>
      <main
        style={{
          minHeight: '100vh',
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          padding: '48px 20px',
        }}
      >
        <section
          className={shake ? 'mk-pin-shake' : ''}
          style={{
            background: 'var(--c-paper)',
            position: 'relative',
            padding: '44px 36px 40px',
            boxShadow: 'var(--c-shadow)',
            width: 'min(440px, 100%)',
            textAlign: 'center',
          }}
        >
          <Tape position="top-left" rotate={-6} />
          <Tape position="top-right" rotate={8} />

          <Stamp variant="outline" size="sm" rotate={-3} style={{ marginBottom: 20 }}>
            {step === 'email' ? "who's coming in" : 'enter your four'}
          </Stamp>

          <h1
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: '-.005em',
              margin: '0 0 6px',
              color: 'var(--c-ink)',
            }}
          >
            MyKeepsakes
          </h1>
          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontStyle: 'italic',
              color: 'var(--c-ink-muted)',
              margin: '0 0 28px',
              fontSize: 15,
            }}
          >
            {step === 'email' ? 'Enter your email to begin' : email}
          </p>

          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontFamily: 'var(--c-font-body)',
                  fontSize: 16,
                  textAlign: 'center',
                  background: 'var(--c-creme)',
                  border: '1.5px solid var(--c-ink)',
                  borderRadius: 'var(--c-r-sm)',
                  color: 'var(--c-ink)',
                  outline: 'none',
                  transition: 'border-color var(--c-t-fast)',
                }}
                onFocus={ev => {
                  ev.currentTarget.style.borderColor = 'var(--c-pen)';
                }}
                onBlur={ev => {
                  ev.currentTarget.style.borderColor = 'var(--c-ink)';
                }}
              />
              {error && (
                <p
                  role="alert"
                  style={{
                    color: '#A83232',
                    fontFamily: 'var(--c-font-body)',
                    fontStyle: 'italic',
                    fontSize: 14,
                    margin: '12px 0 0',
                  }}
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading || !email}
                style={{
                  appearance: 'none',
                  cursor: loading || !email ? 'not-allowed' : 'pointer',
                  width: '100%',
                  marginTop: 20,
                  padding: '14px 18px',
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 12,
                  letterSpacing: '.22em',
                  textTransform: 'uppercase',
                  background: 'var(--c-ink)',
                  color: 'var(--c-creme)',
                  border: 0,
                  borderRadius: 'var(--c-r-sm)',
                  boxShadow: 'var(--c-shadow-sm)',
                  opacity: loading || !email ? 0.5 : 1,
                  transition: 'transform var(--c-t-fast) var(--c-ease-out)',
                }}
                onMouseOver={ev => {
                  if (!loading && email) ev.currentTarget.style.transform = 'translate(-2px,-2px)';
                }}
                onMouseOut={ev => (ev.currentTarget.style.transform = 'none')}
              >
                {loading ? 'looking up…' : 'continue →'}
              </button>
              <MarginNote rotate={1} size={18} style={{ marginTop: 22, display: 'block' }}>
                — welcome back
              </MarginNote>
            </form>
          ) : (
            <>
              {lockoutSeconds > 0 ? (
                <div style={{ padding: '24px 0' }}>
                  <p
                    role="alert"
                    style={{
                      color: '#A83232',
                      fontFamily: 'var(--c-font-body)',
                      fontWeight: 500,
                      margin: 0,
                    }}
                  >
                    Account temporarily locked
                  </p>
                  <p
                    style={{
                      color: 'var(--c-ink-muted)',
                      fontFamily: 'var(--c-font-body)',
                      fontStyle: 'italic',
                      fontSize: 14,
                      margin: '6px 0 0',
                    }}
                  >
                    Try again in {lockoutSeconds}s
                  </p>
                </div>
              ) : (
                <CollageEmojiPad onSubmit={handlePinSubmit} loading={loading} error={error} />
              )}

              <button
                type="button"
                onClick={handleBackToEmail}
                disabled={loading}
                style={{
                  appearance: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  width: '100%',
                  marginTop: 24,
                  padding: '12px 16px',
                  fontFamily: 'var(--c-font-body)',
                  fontSize: 14,
                  color: 'var(--c-ink-muted)',
                  background: 'transparent',
                  border: '1px dashed var(--c-line)',
                  borderRadius: 'var(--c-r-sm)',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                ← change email
              </button>
            </>
          )}

          <div style={{ marginTop: 28 }}>
            <StickerPill variant="pen" style={{ opacity: 0.75 }}>
              beacon uu · shawn &amp; dan
            </StickerPill>
          </div>
        </section>
      </main>

      <style>{`
        @keyframes mk-pin-shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .mk-pin-shake {
          animation: mk-pin-shake 0.5s ease-in-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .mk-pin-shake { animation: none !important; }
        }
      `}</style>
    </CollageRoot>
  );
}
