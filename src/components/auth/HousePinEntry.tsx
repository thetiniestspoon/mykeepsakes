import { useCallback, useState } from 'react';
import { CollageRoot } from '@/preview/collage/CollageRoot';
import { CollageEmojiPad } from '@/components/auth/CollageEmojiPad';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { MarginNote } from '@/preview/collage/ui/MarginNote';
import { verifyHousePin, HousePinError } from '@/lib/house-auth';

/**
 * PIN-only entry, matching the house and the arcade games.
 *
 * No email field and no roster of family names: the screen must not enumerate
 * who exists. The PIN alone identifies the persona, exactly as house-pin.js does.
 */
export function HousePinEntry({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (pin: string[]) => {
      setLoading(true);
      setError(null);
      try {
        await verifyHousePin(pin.join(''));
        onAuthenticated();
      } catch (err) {
        setError(
          err instanceof HousePinError ? err.message : "Can't reach the house right now."
        );
      } finally {
        setLoading(false);
      }
    },
    [onAuthenticated]
  );

  return (
    <CollageRoot>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <Stamp variant="outline" size="sm" rotate={-3}>
            oak park
          </Stamp>
          <h1
            style={{
              fontFamily: 'var(--c-font-display)',
              fontSize: 'clamp(26px, 6vw, 38px)',
              color: 'var(--c-ink)',
              margin: '14px 0 6px',
              lineHeight: 1,
            }}
          >
            MYKEEPSAKES
          </h1>
          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontStyle: 'italic',
              fontSize: 14,
              color: 'var(--c-ink-muted)',
              margin: '0 0 18px',
            }}
          >
            Your house PIN opens this too.
          </p>

          <CollageEmojiPad onSubmit={handleSubmit} loading={loading} error={error} />

          <div style={{ marginTop: 16 }}>
            <MarginNote rotate={-2} size={18}>
              same four emoji as the arcade
            </MarginNote>
          </div>
        </div>
      </div>
    </CollageRoot>
  );
}
