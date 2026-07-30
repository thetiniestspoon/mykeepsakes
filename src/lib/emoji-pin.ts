// Emoji PIN constants and utilities (client-side)
//
// SOURCE OF TRUTH: command-center/house-pin.js:16-23 (30-emoji palette v3).
// This app and the house deploy from separate repos — if you change one, change
// both, or family PINs stop being typeable here. src/test/emoji-palette.test.ts
// exists to catch exactly that drift.
//
// Written as escapes on purpose: 🐿️ is U+1F43F + U+FE0F and ✈️ is U+2708 + U+FE0F.
// Those variation selectors are inside the SHA-256, so losing them in a copy-paste
// would break the PINs while still looking correct on screen.
export const EMOJI_PALETTE = [
  '\u{1F99D}', '\u{1F98A}', '\u{1F428}', '\u{1F989}', '\u{1F419}',       // 🦝🦊🐨🦉🐙
  '\u{1F99B}', '\u{1F40B}', '\u{1F9A9}', '\u{1F99A}', '\u{1F9AB}',       // 🦛🐋🦩🦚🦫
  '\u{1F43F}\uFE0F', '\u{1F994}', '\u{1F992}', '\u{1F409}', '\u{2708}\uFE0F', // 🐿️🦔🦒🐉✈️ — v3 row
  '\u{1F335}', '\u{1F33B}', '\u{1F344}', '\u{1F30A}', '\u{1F525}',       // 🌵🌻🍄🌊🔥
  '\u{2B50}', '\u{1F319}', '\u{1F3B8}', '\u{1F3B2}', '\u{1F52E}',          // ⭐🌙🎸🎲🔮
  '\u{1F3E0}', '\u{1F511}', '\u{1F48E}', '\u{1F680}', '\u{1F3AF}',       // 🏠🔑💎🚀🎯
] as const

export const PIN_LENGTH = 4

export type EmojiChar = typeof EMOJI_PALETTE[number]

export function isValidPin(pin: string[]): boolean {
  return (
    pin.length === PIN_LENGTH &&
    pin.every((e) => (EMOJI_PALETTE as readonly string[]).includes(e))
  )
}

// SHA-256 hash of emoji sequence (browser-native crypto)
export async function hashPin(emojis: string[]): Promise<string> {
  const text = emojis.join('')
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Check if a stored PIN value is a SHA-256 hex hash (64 hex chars)
export function isHashedPin(value: string): boolean {
  return /^[0-9a-f]{64}$/.test(value)
}
