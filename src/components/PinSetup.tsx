import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Waves, Sun, Shell, KeyRound } from 'lucide-react';
import { EmojiPinPad } from '@/components/auth/emoji-pin-pad';
import { useCreatePin } from '@/hooks/use-trip-data';

interface PinSetupProps {
  onComplete: () => void;
}

export function PinSetup({ onComplete }: PinSetupProps) {
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [firstPin, setFirstPin] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const createPin = useCreatePin();

  const handleFirstPin = (emojiPin: string[]) => {
    setFirstPin(emojiPin);
    setStep('confirm');
    setError(null);
  };

  const handleConfirmPin = async (emojiPin: string[]) => {
    if (emojiPin.join('') !== firstPin.join('')) {
      setError('PINs do not match. Starting over...');
      setTimeout(() => {
        setStep('create');
        setFirstPin([]);
        setError(null);
      }, 1500);
      return;
    }

    try {
      await createPin.mutateAsync(emojiPin);
      onComplete();
    } catch {
      setError('Failed to save PIN. Please try again.');
      setStep('create');
      setFirstPin([]);
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

      <Card className="w-full max-w-sm shadow-warm-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-sunset-gradient rounded-full flex items-center justify-center shadow-warm">
            <KeyRound className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-display text-foreground">
            {step === 'create' ? 'Welcome to MyKeepsakes' : 'Confirm Your PIN'}
          </CardTitle>
          <CardDescription className="text-body text-muted-foreground">
            {step === 'create'
              ? 'Choose 4 emojis as your PIN. Share it with your family!'
              : 'Tap the same 4 emojis again to confirm.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === 'create' ? (
            <EmojiPinPad
              onSubmit={handleFirstPin}
              error={error}
              submitLabel="Next"
            />
          ) : (
            <EmojiPinPad
              onSubmit={handleConfirmPin}
              loading={createPin.isPending}
              error={error}
              submitLabel="Create PIN"
            />
          )}

          <p className="text-center text-sm text-muted-foreground">
            {step === 'create'
              ? 'Remember this PIN! You\'ll need it to access your trip.'
              : 'Tap the dots to correct mistakes.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
