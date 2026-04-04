import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Waves, Sun, Heart, Shell } from 'lucide-react';
import { EmojiPinPad } from '@/components/auth/emoji-pin-pad';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface MultiUserPinEntryProps {
  onSuccess: (email: string, displayName: string) => void;
}

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
      setLockoutSeconds((s) => {
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

  const handlePinSubmit = useCallback(async (emojiPin: string[]) => {
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
        const msg = remaining != null && remaining <= 2
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
  }, [email, lockoutSeconds, onSuccess]);

  const handleBackToEmail = () => {
    setStep('email');
    setError(null);
    setLockoutSeconds(0);
  };

  return (
    <div className="min-h-screen bg-beach-gradient flex flex-col items-center justify-center p-4">
      {/* Decorative elements */}
      <div className="absolute top-8 left-8 text-beach-sunset-coral opacity-50">
        <Sun className="w-12 h-12" />
      </div>
      <div className="absolute top-12 right-12 text-beach-ocean-light opacity-40">
        <Waves className="w-16 h-16" />
      </div>
      <div className="absolute bottom-16 left-16 text-beach-sand opacity-60">
        <Shell className="w-10 h-10" />
      </div>

      <Card className={`w-full max-w-sm shadow-warm-lg transition-all ${shake ? 'animate-shake' : ''}`}>
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-sunset-gradient rounded-full flex items-center justify-center shadow-warm">
            <Heart className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-display text-foreground">
            MyKeepsakes
          </CardTitle>
          <CardDescription className="text-body text-muted-foreground">
            {step === 'email' ? 'Enter your email to begin' : 'Enter your emoji PIN'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="text-center"
              />
              {error && <p className="text-destructive text-sm text-center">{error}</p>}
              <Button type="submit" disabled={loading || !email} className="w-full">
                {loading ? 'Looking up...' : 'Continue'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Your vacation adventure awaits!
              </p>
            </form>
          ) : (
            <>
              {lockoutSeconds > 0 ? (
                <div className="text-center py-4">
                  <p className="text-destructive font-medium">Account temporarily locked</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Try again in {lockoutSeconds}s
                  </p>
                </div>
              ) : (
                <EmojiPinPad
                  onSubmit={handlePinSubmit}
                  loading={loading}
                  error={error}
                  submitLabel="Unlock"
                />
              )}
              <Button
                variant="outline"
                onClick={handleBackToEmail}
                disabled={loading}
                className="w-full"
              >
                Change Email
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
