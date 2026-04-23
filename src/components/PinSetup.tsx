import { useState } from 'react';
import { CollageEmojiPad } from '@/components/auth/CollageEmojiPad';
import { CollageRoot } from '@/preview/collage/CollageRoot';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { StickerPill } from '@/preview/collage/ui/StickerPill';
import { MarginNote } from '@/preview/collage/ui/MarginNote';
import { Tape } from '@/preview/collage/ui/Tape';
import { useCreatePin } from '@/hooks/use-trip-data';
import '@/preview/collage/collage.css';

interface PinSetupProps {
  onComplete: () => void;
}

/**
 * First-run PIN setup — migrated to Collage direction (Phase 4 #12).
 * Presentation only: createPin hook + two-step confirm flow unchanged.
 */
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
      setError('PINs do not match. Starting over…');
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
    <CollageRoot>
      <main
        style={{
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          padding: '48px 20px',
        }}
      >
        <section
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
            {step === 'create' ? 'set your four' : 'confirm your four'}
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
            {step === 'create' ? 'Welcome to MyKeepsakes' : 'Confirm Your PIN'}
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
            {step === 'create'
              ? 'Choose 4 emojis as your PIN. Share it with your family.'
              : 'Tap the same 4 emojis again to confirm.'}
          </p>

          {step === 'create' ? (
            <CollageEmojiPad
              onSubmit={handleFirstPin}
              error={error}
              submitLabel="set pin"
              autoSubmit={false}
            />
          ) : (
            <CollageEmojiPad
              onSubmit={handleConfirmPin}
              loading={createPin.isPending}
              error={error}
              submitLabel="create pin"
              autoSubmit={false}
            />
          )}

          <MarginNote rotate={1} size={18} style={{ marginTop: 22, display: 'block' }}>
            {step === 'create'
              ? '— remember this; you’ll need it'
              : '— tap the dots to correct'}
          </MarginNote>

          <div style={{ marginTop: 24 }}>
            <StickerPill variant="pen" style={{ opacity: 0.75 }}>
              first run · welcome
            </StickerPill>
          </div>
        </section>
      </main>
    </CollageRoot>
  );
}
