import { describe, it, expect } from 'vitest';
import { EMOJI_PALETTE, PIN_LENGTH, hashPin, isValidPin } from '@/lib/emoji-pin';

/**
 * The house is the source of truth: command-center/house-pin.js:16-23.
 * MyKeepsakes and the house deploy from separate repos, so nothing but a test
 * stops them drifting. They drifted once already: this app sat on the 25-glyph
 * v2 set after the house moved to 30 on 2026-04-17, which made any PIN using a
 * v3 glyph physically untypeable here.
 */
const HOUSE_PALETTE_V3 = [
  '\u{1F99D}', '\u{1F98A}', '\u{1F428}', '\u{1F989}', '\u{1F419}',
  '\u{1F99B}', '\u{1F40B}', '\u{1F9A9}', '\u{1F99A}', '\u{1F9AB}',
  '\u{1F43F}\uFE0F', '\u{1F994}', '\u{1F992}', '\u{1F409}', '\u{2708}\uFE0F',
  '\u{1F335}', '\u{1F33B}', '\u{1F344}', '\u{1F30A}', '\u{1F525}',
  '\u{2B50}', '\u{1F319}', '\u{1F3B8}', '\u{1F3B2}', '\u{1F52E}',
  '\u{1F3E0}', '\u{1F511}', '\u{1F48E}', '\u{1F680}', '\u{1F3AF}',
];

describe('emoji palette parity with the house', () => {
  it('has exactly 30 glyphs', () => {
    expect(EMOJI_PALETTE).toHaveLength(30);
  });

  it('matches the house palette exactly, in order', () => {
    expect([...EMOJI_PALETTE]).toEqual(HOUSE_PALETTE_V3);
  });

  it('preserves the variation selectors that are inside the hash', () => {
    // Index 10 is the squirrel, index 14 the airplane. Dropping U+FE0F from
    // either still *renders* correctly but changes the SHA-256, silently
    // breaking every PIN that uses them.
    expect(EMOJI_PALETTE[10]).toBe('\u{1F43F}\uFE0F');
    expect(EMOJI_PALETTE[14]).toBe('\u{2708}\uFE0F');
  });

  it('includes the whole v3 row that was missing', () => {
    for (const glyph of ['\u{1F43F}\uFE0F', '\u{1F994}', '\u{1F992}', '\u{1F409}', '\u{2708}\uFE0F']) {
      expect(EMOJI_PALETTE).toContain(glyph);
    }
  });

  it('keeps a 4-emoji PIN length', () => {
    expect(PIN_LENGTH).toBe(4);
  });

  it('hashes a known vector the same way the edge function does', async () => {
    // sha256(join('')) of the first four palette glyphs. NOT anyone's PIN.
    // Verified against node: crypto.createHash('sha256').update('🦝🦊🐨🦉','utf8')
    await expect(hashPin(['\u{1F99D}', '\u{1F98A}', '\u{1F428}', '\u{1F989}'])).resolves.toBe(
      '6aba12c20a7bf0f452326953b3dfbf1102c31a07e20f62b2c453f893adf36d01'
    );
  });

  it('accepts a v3-glyph PIN as valid', () => {
    expect(isValidPin(['\u{1F43F}\uFE0F', '\u{2708}\uFE0F', '\u{1F409}', '\u{1F992}'])).toBe(true);
  });
});
