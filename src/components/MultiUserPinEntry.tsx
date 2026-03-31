import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Waves, Sun, Heart, Shell } from 'lucide-react';
import { EmojiPinPad } from '@/components/auth/emoji-pin-pad';
import { hashPin } from '@/lib/emoji-pin';
import { supabase } from '@/integrations/supabase/client';

interface MultiUserPinEntryProps {
  onSuccess: (email: string, displayName: string) => void;
}

interface UserPin {
  email: string;
  display_name: string;
  avatar_emoji: string;
  pin_hash: string;
}

export function MultiUserPinEntry({ onSuccess }: MultiUserPinEntryProps) {
  const [step, setStep] = useState<'email' | 'pin'>('email');
  const [email, setEmail] = useState('');
  const [currentUser, setCurrentUser] = useState<UserPin | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Look up user by email
      const { data, error: queryError } = await supabase
        .from('user_emoji_pins')
        .select('email, display_name, avatar_emoji, pin_hash')
        .eq('email', email.toLowerCase())
        .single();

      if (queryError || !data) {
        setError('Email not found. Please check and try again.');
        return;
      }

      setCurrentUser(data as UserPin);
      setStep('pin');
    } catch (err) {
      setError('Error looking up user. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (emojiPin: string[]) => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    try {
      const hash = await hashPin(emojiPin);
      if (hash === currentUser.pin_hash) {
        // Success! Store auth info and proceed
        sessionStorage.setItem('mk-authenticated', 'true');
        sessionStorage.setItem('mk-user-email', currentUser.email);
        sessionStorage.setItem('mk-user-name', currentUser.display_name);
        onSuccess(currentUser.email, currentUser.display_name);
      } else {
        setError('Incorrect PIN. Please try again.');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setTimeout(() => setError(null), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setCurrentUser(null);
    setError(null);
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
            {step === 'pin' && currentUser ? (
              <span className="text-4xl">{currentUser.avatar_emoji}</span>
            ) : (
              <Heart className="w-8 h-8 text-primary-foreground" />
            )}
          </div>
          <CardTitle className="text-2xl font-display text-foreground">
            MyKeepsakes
          </CardTitle>
          <CardDescription className="text-body text-muted-foreground">
            {step === 'email' ? 'Enter your email to begin' : `Welcome, ${currentUser?.display_name}!`}
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
              <EmojiPinPad
                onSubmit={handlePinSubmit}
                loading={loading}
                error={error}
                submitLabel="Unlock"
              />
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
