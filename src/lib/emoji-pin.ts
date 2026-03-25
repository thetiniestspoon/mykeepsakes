// Emoji PIN constants and utilities (client-side)
// Travel/beach themed palette for MyKeepsakes trip companion

export const EMOJI_PALETTE = [
  '\u2708\uFE0F', '\u{1F3D6}\uFE0F', '\u{1F30A}', '\u{1F305}', '\u{1F334}',
  '\u{1F40B}', '\u{1F422}', '\u{1F41A}', '\u{1F420}', '\u{1F9DC}\u200D\u2640\uFE0F',
  '\u{1F3C4}', '\u26F5', '\u{1F697}', '\u{1F3D5}\uFE0F', '\u{1F30D}',
  '\u{1F340}', '\u{1F33B}', '\u{1F31E}', '\u2B50', '\u{1F308}',
  '\u{1F9F3}', '\u{1F5FA}\uFE0F', '\u{1F4F7}', '\u{1F3AF}', '\u{1F48E}',
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
