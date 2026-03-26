import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Waves, Sun, Heart, Shell } from 'lucide-react';
import { EmojiPinPad } from '@/components/auth/emoji-pin-pad';
import { hashPin } from '@/lib/emoji-pin';

interface PinEntryProps {
  storedHash: string;
  onSuccess: () => void;
}

export function PinEntry({ storedHash, onSuccess }: PinEntryProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (emojiPin: string[]) => {
    setLoading(true);
    setError(null);

    try {
      const hash = await hashPin(emojiPin);
      if (hash === storedHash) {
        sessionStorage.setItem('mk-authenticated', 'true');
        onSuccess();
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
            Tap your emoji PIN to unlock
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <EmojiPinPad
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
            submitLabel="Unlock"
          />

          <p className="text-center text-sm text-muted-foreground">
            Your vacation adventure awaits!
          </p>
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
