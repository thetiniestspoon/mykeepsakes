import { useState } from 'react';
import { EMOJI_PALETTE, PIN_LENGTH } from '@/lib/emoji-pin';
import { Stamp } from '../../ui/Stamp';
import { StickerPill } from '../../ui/StickerPill';
import { MarginNote } from '../../ui/MarginNote';
import { Tape } from '../../ui/Tape';

// Seeded users — display only for the demo (no auth side-effect)
const USERS = [
  { name: 'Shawn', avatar: '🦅' },
  { name: 'Dan', avatar: '🐘' },
];

export function PinV1() {
  const [selected, setSelected] = useState<number | null>(0);
  const [picked, setPicked] = useState<number[]>([]);

  const togglePick = (i: number) => {
    setPicked(prev => {
      if (prev.length >= PIN_LENGTH) return [i];
      if (prev.includes(i) && prev[prev.length - 1] === i) return prev.slice(0, -1);
      return [...prev, i];
    });
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: '64px 24px',
      }}
    >
      <section
        style={{
          background: 'var(--c-paper)',
          position: 'relative',
          padding: '48px 40px 56px',
          boxShadow: 'var(--c-shadow)',
          width: 'min(460px, 100%)',
          textAlign: 'center',
        }}
      >
        <Tape position="top-left" rotate={-6} />
        <Tape position="top-right" rotate={8} />

        <Stamp variant="outline" size="sm" rotate={-3} style={{ marginBottom: 24 }}>
          who's coming in
        </Stamp>

        {/* user switcher */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 28 }}>
          {USERS.map((u, i) => (
            <button
              key={u.name}
              onClick={() => setSelected(i)}
              aria-pressed={selected === i}
              style={{
                appearance: 'none',
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                padding: 8,
              }}
            >
              <span
                style={{
                  fontSize: 42,
                  lineHeight: 1,
                  display: 'inline-block',
                  padding: 10,
                  borderRadius: 999,
                  background: selected === i ? 'var(--c-tape)' : 'transparent',
                  outline:
                    selected === i
                      ? '2px solid var(--c-ink)'
                      : '2px solid transparent',
                  transition: 'background var(--c-t-fast) var(--c-ease-out)',
                }}
              >
                {u.avatar}
              </span>
              <span
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontStyle: selected === i ? 'normal' : 'italic',
                  fontWeight: selected === i ? 500 : 400,
                  color: selected === i ? 'var(--c-ink)' : 'var(--c-ink-muted)',
                  fontSize: 16,
                }}
              >
                {u.name}
              </span>
            </button>
          ))}
        </div>

        {/* pin dots */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 12,
            marginBottom: 28,
            minHeight: 36,
          }}
          aria-label={`PIN progress: ${picked.length} of ${PIN_LENGTH}`}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => {
            const filled = i < picked.length;
            return (
              <span
                key={i}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 'var(--c-r-sm)',
                  border: '2px solid var(--c-ink)',
                  background: filled ? 'var(--c-ink)' : 'transparent',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 18,
                  color: 'var(--c-creme)',
                }}
                aria-hidden
              >
                {filled ? EMOJI_PALETTE[picked[i]] : ''}
              </span>
            );
          })}
        </div>

        {/* 25-emoji grid */}
        <div
          role="group"
          aria-label="Emoji PIN palette"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 10,
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
                  background: isChosen ? 'var(--c-tape)' : 'var(--c-creme)',
                  border: '1.5px solid var(--c-ink)',
                  borderRadius: 'var(--c-r-sm)',
                  padding: 10,
                  fontSize: 26,
                  lineHeight: 1,
                  transition:
                    'transform var(--c-t-fast) var(--c-ease-out), background var(--c-t-fast) var(--c-ease-out)',
                  boxShadow: isChosen ? 'var(--c-shadow-sm)' : 'none',
                }}
                onMouseOver={ev => (ev.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseOut={ev => (ev.currentTarget.style.transform = 'none')}
              >
                {e}
              </button>
            );
          })}
        </div>

        <MarginNote rotate={1} size={18} style={{ marginTop: 28, display: 'block' }}>
          — pick 4 in a row you'll remember
        </MarginNote>
      </section>

      {/* footer outside the paper card */}
      <footer
        style={{
          marginTop: 24,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <StickerPill variant="ink">display only</StickerPill>
        <span style={{ fontSize: 13, color: 'var(--c-ink-muted)', fontFamily: 'var(--c-font-body)' }}>
          No authentication side-effect. Real PIN entry lives on the Beach-themed home screen.
        </span>
      </footer>
    </main>
  );
}
