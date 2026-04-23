import { useState, useCallback } from 'react';
import { EMOJI_PALETTE, PIN_LENGTH } from '@/lib/emoji-pin';

interface Props {
  onSubmit: (pin: string[]) => void;
  loading?: boolean;
  error?: string | null;
  submitLabel?: string;
  /**
   * When true (default), the pad calls onSubmit automatically once the 4th
   * emoji is tapped. When false, the pad renders an explicit submit button
   * that becomes enabled once all 4 slots are filled, giving the user a
   * chance to review/correct a mistap before committing the PIN. Used by
   * PinSetup to prevent users from mis-locking themselves out on a typo.
   */
  autoSubmit?: boolean;
}

/**
 * Collage-styled emoji PIN pad. Same behavior as EmojiPinPad — different chrome.
 * Ink-rimmed square dots, crème/ink emoji buttons, Rubik Mono One position labels.
 * Auto-submits when 4 emojis are picked by default (matches the Beach version).
 * Pass autoSubmit={false} to require an explicit submit tap (PIN-setup mode).
 */
export function CollageEmojiPad({
  onSubmit,
  loading,
  error,
  submitLabel = 'confirm',
  autoSubmit = true,
}: Props) {
  const [pin, setPin] = useState<string[]>([]);

  const handleTap = useCallback(
    (emoji: string) => {
      if (loading) return;
      setPin(prev => {
        if (prev.length >= PIN_LENGTH) return prev;
        const next = [...prev, emoji];
        if (autoSubmit && next.length === PIN_LENGTH) {
          // Defer submit so state can render the filled dot first
          setTimeout(() => {
            onSubmit(next);
            setPin([]);
          }, 120);
        }
        return next;
      });
    },
    [loading, onSubmit, autoSubmit],
  );

  const handleDotTap = useCallback(
    (index: number) => {
      if (loading) return;
      setPin(prev => prev.slice(0, index));
    },
    [loading],
  );

  const handleManualSubmit = useCallback(() => {
    if (loading) return;
    if (pin.length !== PIN_LENGTH) return;
    const snapshot = pin;
    setPin([]);
    onSubmit(snapshot);
  }, [loading, onSubmit, pin]);

  const submitReady = pin.length === PIN_LENGTH;
  const submitDisabled = !submitReady || !!loading;

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

      {/* Explicit submit — only when autoSubmit is opted out (e.g. PIN setup). */}
      {!autoSubmit && (
        <button
          type="button"
          onClick={handleManualSubmit}
          disabled={submitDisabled}
          className="mk-collage-emoji-pad-submit"
          style={{
            appearance: 'none',
            cursor: submitDisabled ? 'not-allowed' : 'pointer',
            width: '100%',
            marginTop: 24,
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
            opacity: submitDisabled ? 0.5 : 1,
            transition: 'transform var(--c-t-fast) var(--c-ease-out)',
          }}
          onFocus={ev => {
            ev.currentTarget.style.outline = '2px solid var(--c-pen)';
            ev.currentTarget.style.outlineOffset = '2px';
          }}
          onBlur={ev => {
            ev.currentTarget.style.outline = 'none';
            ev.currentTarget.style.outlineOffset = '0';
          }}
          onMouseOver={ev => {
            if (!submitDisabled) ev.currentTarget.style.transform = 'translate(-2px,-2px)';
          }}
          onMouseOut={ev => (ev.currentTarget.style.transform = 'none')}
        >
          {loading ? 'saving…' : submitLabel}
        </button>
      )}

      {!autoSubmit && (
        <style>{`
          @media (prefers-reduced-motion: reduce) {
            .mk-collage-emoji-pad-submit {
              transition: none !important;
            }
            .mk-collage-emoji-pad-submit:hover {
              transform: none !important;
            }
          }
        `}</style>
      )}
    </div>
  );
}
