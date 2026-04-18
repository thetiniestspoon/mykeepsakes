import { useState } from 'react';
import { EMOJI_PALETTE, PIN_LENGTH } from '@/lib/emoji-pin';
import { Stamp } from '../../ui/Stamp';
import { StickerPill } from '../../ui/StickerPill';
import { MarginNote } from '../../ui/MarginNote';

/**
 * PIN V3 — Receipt / Passport.
 * Narrow tall paper strip, perforated edges, "ADMIT" stamp.
 * Emoji grid in 3-column layout (taller). Quirky ritual-of-entry vibe.
 */
const USERS = [
  { name: 'Shawn', avatar: '🦅' },
  { name: 'Dan',   avatar: '🐘' },
];

export function PinV3() {
  const [selected, setSelected] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);

  const togglePick = (i: number) => {
    setPicked(prev => {
      if (prev.length >= PIN_LENGTH) return [i];
      return [...prev, i];
    });
  };

  return (
    <main
      style={{
        minHeight: 'calc(100vh - 120px)',
        padding: '48px 20px 80px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <section
        className="pin-receipt"
        style={{
          width: 360,
          maxWidth: '100%',
          background: 'var(--c-paper)',
          boxShadow: 'var(--c-shadow)',
          position: 'relative',
          padding: '32px 28px 28px',
          // Perforation edges via radial gradients
          // left & right edges get zig-zag cutouts
          backgroundImage:
            'radial-gradient(circle at 0 12px, var(--c-creme) 5px, transparent 6px),' +
            'radial-gradient(circle at 100% 12px, var(--c-creme) 5px, transparent 6px),' +
            'radial-gradient(circle at 0 calc(100% - 12px), var(--c-creme) 5px, transparent 6px),' +
            'radial-gradient(circle at 100% calc(100% - 12px), var(--c-creme) 5px, transparent 6px)',
          backgroundPosition: 'left top, right top, left bottom, right bottom',
          backgroundRepeat: 'repeat-y',
          backgroundSize: '12px 24px, 12px 24px, 12px 24px, 12px 24px',
        }}
      >
        {/* Top torn edge with perforations */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: -1,
            left: 0,
            right: 0,
            height: 6,
            background:
              'repeating-linear-gradient(90deg, transparent 0 8px, var(--c-creme) 8px 10px)',
          }}
        />

        {/* Title: admit-one stamp */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 18,
          }}
        >
          <span aria-hidden style={{ color: 'var(--c-pen)' }}>✦</span>
          <Stamp variant="outline" size="md" rotate={-3}>
            admit · one
          </Stamp>
          <span aria-hidden style={{ color: 'var(--c-pen)' }}>✦</span>
        </div>

        <h2
          style={{
            fontFamily: 'var(--c-font-body)',
            fontSize: 20,
            fontWeight: 500,
            letterSpacing: '-.005em',
            textAlign: 'center',
            margin: '0 0 6px',
            color: 'var(--c-ink)',
          }}
        >
          MyKeepsakes
        </h2>
        <p
          style={{
            fontFamily: 'var(--c-font-display)',
            fontSize: 10,
            letterSpacing: '.28em',
            textAlign: 'center',
            color: 'var(--c-ink-muted)',
            margin: '0 0 24px',
          }}
        >
          a ticket stub you'll pick yourself
        </p>

        {/* Dashed divider */}
        <div style={{ borderTop: '1px dashed var(--c-ink)', margin: '0 -4px 22px' }} />

        {/* Who's entering */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
            marginBottom: 22,
          }}
        >
          {USERS.map((u, i) => (
            <button
              key={u.name}
              onClick={() => setSelected(i)}
              aria-pressed={selected === i}
              style={{
                appearance: 'none',
                cursor: 'pointer',
                background: selected === i ? 'var(--c-ink)' : 'transparent',
                color: selected === i ? 'var(--c-creme)' : 'var(--c-ink)',
                border: '1.5px dashed var(--c-ink)',
                padding: '10px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                transition: 'background var(--c-t-fast), color var(--c-t-fast)',
              }}
            >
              <span style={{ fontSize: 28, lineHeight: 1 }}>{u.avatar}</span>
              <span
                style={{
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 10,
                  letterSpacing: '.22em',
                  textTransform: 'uppercase',
                }}
              >
                {u.name}
              </span>
            </button>
          ))}
        </div>

        {/* Dashed divider */}
        <div style={{ borderTop: '1px dashed var(--c-ink)', margin: '0 -4px 22px' }} />

        {/* PIN perforation */}
        <div
          aria-label={`PIN progress: ${picked.length} of ${PIN_LENGTH}`}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 24,
            padding: '0 8px',
          }}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => {
            const filled = i < picked.length;
            return (
              <span
                key={i}
                aria-hidden
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  border: '2px dashed var(--c-ink)',
                  background: filled ? 'var(--c-tape)' : 'transparent',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 22,
                }}
              >
                {filled ? EMOJI_PALETTE[picked[i]] : ''}
              </span>
            );
          })}
        </div>

        <p
          style={{
            fontFamily: 'var(--c-font-display)',
            fontSize: 10,
            letterSpacing: '.24em',
            textTransform: 'uppercase',
            textAlign: 'center',
            color: 'var(--c-ink-muted)',
            margin: '0 0 12px',
          }}
        >
          choose your four
        </p>

        {/* 3-column emoji grid (taller layout) */}
        <div
          role="group"
          aria-label="Emoji PIN palette"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 8,
          }}
        >
          {EMOJI_PALETTE.map((e, i) => {
            const isChosen = picked[picked.length - 1] === i && picked.length > 0;
            return (
              <button
                key={i}
                onClick={() => togglePick(i)}
                aria-label={`Emoji ${i + 1}`}
                style={{
                  appearance: 'none',
                  cursor: 'pointer',
                  background: isChosen ? 'var(--c-tape)' : 'transparent',
                  border: '1px solid var(--c-ink)',
                  padding: 8,
                  fontSize: 22,
                  lineHeight: 1,
                  transition: 'background var(--c-t-fast)',
                }}
              >
                {e}
              </button>
            );
          })}
        </div>

        {/* Bottom dashed divider + stub */}
        <div style={{ borderTop: '1px dashed var(--c-ink)', margin: '22px -4px 14px' }} />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: 'var(--c-font-display)',
            fontSize: 9,
            letterSpacing: '.22em',
            color: 'var(--c-ink-muted)',
            textTransform: 'uppercase',
          }}
        >
          <span>stub · no. 0001</span>
          <span>{picked.length}/{PIN_LENGTH}</span>
        </div>

        <MarginNote rotate={-1} size={18} style={{ marginTop: 16, display: 'block', textAlign: 'center' }}>
          — keep this, it's how we know it's you
        </MarginNote>

        {/* Bottom torn edge */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: -1,
            left: 0,
            right: 0,
            height: 6,
            background:
              'repeating-linear-gradient(90deg, transparent 0 8px, var(--c-creme) 8px 10px)',
          }}
        />

        {/* Demo banner */}
        <div style={{ marginTop: 18, textAlign: 'center' }}>
          <StickerPill variant="ink">display only</StickerPill>
        </div>
      </section>
    </main>
  );
}
