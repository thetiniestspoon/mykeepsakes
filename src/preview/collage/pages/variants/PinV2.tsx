import { useState } from 'react';
import { EMOJI_PALETTE, PIN_LENGTH } from '@/lib/emoji-pin';
import { Stamp } from '../../ui/Stamp';
import { StickerPill } from '../../ui/StickerPill';
import { MarginNote } from '../../ui/MarginNote';
import { Tape } from '../../ui/Tape';

/**
 * PIN V2 — Credential Card.
 * Full-bleed PIN pad center stage, decorated chrome around.
 * Taped profile cards in upper-left/right for user select.
 * CPE-check-in / conference-credential vibe.
 */
const USERS = [
  { name: 'Shawn', avatar: '🦅', role: 'chaplain · beacon uu' },
  { name: 'Dan', avatar: '🐘', role: 'chaplain · beacon uu' },
];

export function PinV2() {
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
        padding: 'clamp(24px, 4vw, 56px)',
        position: 'relative',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {/* Corner stamps */}
      <Stamp
        variant="outline"
        size="sm"
        rotate={-6}
        style={{ position: 'absolute', top: 32, left: 36 }}
      >
        admit · sankofa cpe
      </Stamp>
      <Stamp
        variant="outline"
        size="sm"
        rotate={5}
        style={{ position: 'absolute', top: 32, right: 36 }}
      >
        valid · apr 20–26
      </Stamp>

      {/* User credential strip */}
      <div
        style={{
          position: 'absolute',
          top: 90,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 32,
          flexWrap: 'wrap',
          padding: '0 24px',
        }}
      >
        {USERS.map((u, i) => (
          <button
            key={u.name}
            onClick={() => setSelected(i)}
            aria-pressed={selected === i}
            style={{
              appearance: 'none',
              border: '1.5px solid var(--c-ink)',
              background: selected === i ? 'var(--c-paper)' : 'rgba(255,255,255,.55)',
              padding: '12px 20px 12px 12px',
              cursor: 'pointer',
              position: 'relative',
              display: 'flex',
              gap: 14,
              alignItems: 'center',
              boxShadow: selected === i ? 'var(--c-shadow)' : 'none',
              transform: i === 0 ? 'rotate(-2deg)' : 'rotate(2deg)',
              opacity: selected === i ? 1 : 0.7,
              transition: 'opacity var(--c-t-fast), box-shadow var(--c-t-fast)',
            }}
          >
            <Tape position="top-left" rotate={-10} width={50} opacity={0.6} />
            <span
              style={{
                fontSize: 34,
                padding: 8,
                background: selected === i ? 'var(--c-tape)' : 'var(--c-creme)',
                borderRadius: 999,
                lineHeight: 1,
              }}
            >
              {u.avatar}
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
              <span style={{ fontFamily: 'var(--c-font-body)', fontSize: 16, fontWeight: 500, color: 'var(--c-ink)' }}>{u.name}</span>
              <span style={{ fontFamily: 'var(--c-font-display)', fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--c-ink-muted)' }}>
                {u.role}
              </span>
            </span>
          </button>
        ))}
      </div>

      {/* Main PIN card */}
      <section
        style={{
          background: 'var(--c-paper)',
          padding: 'clamp(40px, 5vw, 64px) clamp(32px, 5vw, 72px)',
          boxShadow: 'var(--c-shadow)',
          width: 'min(640px, 100%)',
          marginTop: 'clamp(56px, 10vh, 120px)',
          position: 'relative',
        }}
      >
        {/* Decorative tapes around the card */}
        <Tape position="top-left" rotate={-6} width={80} />
        <Tape position="top-right" rotate={10} width={80} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span
            style={{
              fontFamily: 'var(--c-font-display)',
              fontSize: 14,
              letterSpacing: '.28em',
              textTransform: 'uppercase',
              color: 'var(--c-pen)',
            }}
          >
            my · keepsakes
          </span>
          <h2
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 26,
              fontWeight: 500,
              letterSpacing: '-.005em',
              margin: '8px 0 0',
              color: 'var(--c-ink)',
            }}
          >
            Four in a row you'll remember.
          </h2>
        </div>

        {/* PIN dots */}
        <div
          aria-label={`PIN progress: ${picked.length} of ${PIN_LENGTH}`}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 14,
            marginBottom: 36,
            minHeight: 44,
          }}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => {
            const filled = i < picked.length;
            return (
              <span
                key={i}
                aria-hidden
                style={{
                  width: 42,
                  height: 42,
                  border: '2px solid var(--c-ink)',
                  background: filled ? 'var(--c-ink)' : 'transparent',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 22,
                  color: 'var(--c-creme)',
                  position: 'relative',
                }}
              >
                {filled ? EMOJI_PALETTE[picked[i]] : ''}
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
              </span>
            );
          })}
        </div>

        {/* Emoji grid — looser, larger tap targets, 5x5 */}
        <div
          role="group"
          aria-label="Emoji PIN palette"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 14,
            padding: '16px',
            background: 'rgba(31, 60, 198, 0.04)',
            border: '1.5px dashed var(--c-line)',
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
                  padding: 14,
                  fontSize: 32,
                  lineHeight: 1,
                  transition: 'transform var(--c-t-fast) var(--c-ease-out), background var(--c-t-fast)',
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

        <MarginNote rotate={1} size={20} style={{ marginTop: 20, display: 'block', textAlign: 'center' }}>
          — pick a portrait, not a sequence
        </MarginNote>
      </section>

      {/* Footer chrome */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          flexWrap: 'wrap',
          padding: '0 24px',
        }}
      >
        <StickerPill variant="ink">display only</StickerPill>
        <span style={{ fontSize: 12, color: 'var(--c-ink-muted)', fontFamily: 'var(--c-font-body)', alignSelf: 'center' }}>
          Real PIN entry lives on the Beach-themed home screen.
        </span>
      </div>
    </main>
  );
}
