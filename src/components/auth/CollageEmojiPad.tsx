import { useState, useCallback } from 'react';
import { EMOJI_PALETTE, PIN_LENGTH } from '@/lib/emoji-pin';

interface Props {
  onSubmit: (pin: string[]) => void;
  loading?: boolean;
  error?: string | null;
  submitLabel?: string;
}

/**
 * Collage-styled emoji PIN pad. Same behavior as EmojiPinPad — different chrome.
 * Ink-rimmed square dots, crème/ink emoji buttons, Rubik Mono One position labels.
 * Auto-submits when 4 emojis are picked (same UX as the Beach version — no separate button).
 */
export function CollageEmojiPad({ onSubmit, loading, error }: Props) {
  const [pin, setPin] = useState<string[]>([]);

  const handleTap = useCallback(
    (emoji: string) => {
      if (loading) return;
      setPin(prev => {
        if (prev.length >= PIN_LENGTH) return prev;
        const next = [...prev, emoji];
        if (next.length === PIN_LENGTH) {
          // Defer submit so state can render the filled dot first
          setTimeout(() => {
            onSubmit(next);
            setPin([]);
          }, 120);
        }
        return next;
      });
    },
    [loading, onSubmit],
  );

  const handleDotTap = useCallback(
    (index: number) => {
      if (loading) return;
      setPin(prev => prev.slice(0, index));
    },
    [loading],
  );

  return (
    <div>
      {/* PIN dots */}
      <div
        aria-label={`PIN progress: ${pin.length} of ${PIN_LENGTH}`}
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 14,
          marginBottom: 20,
        }}
      >
        {Array.from({ length: PIN_LENGTH }).map((_, i) => {
          const filled = !!pin[i];
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleDotTap(i)}
              disabled={loading}
              aria-label={filled ? `Remove emoji at position ${i + 1}` : `Position ${i + 1} empty`}
              style={{
                appearance: 'none',
                cursor: filled ? 'pointer' : 'default',
                width: 44,
                height: 44,
                border: '2px solid var(--c-ink)',
                borderRadius: 'var(--c-r-sm)',
                background: filled ? 'var(--c-ink)' : 'transparent',
                color: 'var(--c-creme)',
                fontSize: 22,
                display: 'grid',
                placeItems: 'center',
                transition: 'background var(--c-t-fast) var(--c-ease-out)',
                position: 'relative',
              }}
            >
              {filled ? pin[i] : ''}
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  bottom: -14,
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 9,
                  letterSpacing: '.2em',
                  color: 'var(--c-ink-muted)',
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p
          style={{
            color: 'var(--c-danger, #A83232)',
            textAlign: 'center',
            fontFamily: 'var(--c-font-body)',
            fontSize: 14,
            margin: '0 0 16px',
            fontStyle: 'italic',
          }}
          role="alert"
        >
          {error}
        </p>
      )}

      {/* 5x5 grid */}
      <div
        role="group"
        aria-label="Emoji PIN palette"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 10,
          marginTop: 24,
        }}
      >
        {EMOJI_PALETTE.map(emoji => {
          const disabled = pin.length >= PIN_LENGTH || loading;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => handleTap(emoji)}
              disabled={disabled}
              aria-label={emoji}
              style={{
                appearance: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                background: 'var(--c-creme)',
                border: '1.5px solid var(--c-ink)',
                borderRadius: 'var(--c-r-sm)',
                padding: 12,
                fontSize: 26,
                lineHeight: 1,
                opacity: disabled ? 0.4 : 1,
                transition: 'transform var(--c-t-fast) var(--c-ease-out), background var(--c-t-fast)',
              }}
              onMouseOver={ev => {
                if (!disabled) ev.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={ev => (ev.currentTarget.style.transform = 'none')}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    </div>
  );
}
