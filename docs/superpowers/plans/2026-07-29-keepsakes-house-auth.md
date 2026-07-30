# MyKeepsakes ↔ Oak Park House Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the same emoji PIN that opens the Oak Park house and the arcade games open MyKeepsakes — except Nanny, who is authenticated by the house but not admitted here.

**Architecture:** MyKeepsakes already points at Family Core (`ckjcieeccopqowlfljja`) and its Supabase client already reads the same `sb-ckjcieeccopqowlfljja-auth-token` localStorage slot that `command-center/house-auth.js` writes — it simply never consults it, gating instead on `sessionStorage['mk-authenticated']` plus a private 2-person `user_emoji_pins` table. We delete that private path, bring the emoji palette up to the house's v3 30-glyph set (byte-exact, or PINs cannot be typed), call the shared `verify-emoji-pin` edge function, and gate the app on the shared Supabase session.

**Tech Stack:** React 18 + TypeScript + Vite, `@supabase/supabase-js` v2, vitest + @testing-library/react (jsdom, `globals: true`), path alias `@` → `./src`.

**Spec:** `docs/superpowers/specs/2026-07-29-keepsakes-house-auth-design.md`

## Global Constraints

- **Scope is login parity only.** Do NOT touch RLS policies, do NOT add per-user attribution columns, do NOT add rate limiting to any shared function. These are deferred in spec §7.
- **Read any existing file before your first Edit or Write to it.**
- **Never ask the operator to type, paste, or reveal a PIN** — not in chat, not in a command, not in a tool call. Test vectors use the first four palette glyphs (🦝🦊🐨🦉), which are not anyone's PIN.
- **Never call `supabase.auth.signOut()` on a denial.** The session is shared house-wide; signing Nanny out would evict her from the arcade games she is entitled to use. (Spec D6. Task 4 asserts this.)
- **Invoke the shared function with `supabase.functions.invoke`, never raw `fetch`.** `verify-emoji-pin` is owned by command-center and is not in this repo's `config.toml`, so its `verify_jwt` setting is unknown here; `functions.invoke` attaches the anon key, matching `house-pin.js:320` exactly. (Raw `fetch` works for this repo's own functions only because they set `verify_jwt = false`.)
- **Palette source of truth is `command-center/house-pin.js:16-23`.** Write it as explicit `\u{...}` escapes. The variation selectors on `🐿️` (`1F43F FE0F`) and `✈️` (`2708 FE0F`) are inside the SHA-256 and must be preserved.
- `PIN_LENGTH` stays `4` (matches `house-pin.js:280`).
- Run the full suite with `npx vitest run`. **`src/test/components/TagChips.test.tsx` fails before this work begins** (a pre-existing `bg-blue-100` class assertion). Do not fix it, do not treat it as your regression.

---

### Task 1: Palette to v3, with a drift guard

**Files:**
- Modify: `src/lib/emoji-pin.ts:4-11` (the `EMOJI_PALETTE` array and its comment)
- Test: `src/test/emoji-palette.test.ts` (create)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `EMOJI_PALETTE: readonly string[]` (30 entries), `PIN_LENGTH: 4`, `hashPin(emojis: string[]): Promise<string>`, `isValidPin(pin: string[]): boolean` — all already exported; only `EMOJI_PALETTE`'s contents change. `CollageEmojiPad` consumes `EMOJI_PALETTE` and `PIN_LENGTH` and needs no edit.

- [ ] **Step 1: Write the failing test**

Create `src/test/emoji-palette.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/emoji-palette.test.ts`
Expected: FAIL. `toHaveLength(30)` receives 25, and the `toEqual` diff shows the missing `🐿️🦔🦒🐉✈️` row. The `isValidPin` v3 case also fails.

- [ ] **Step 3: Replace the palette**

In `src/lib/emoji-pin.ts`, replace the `EMOJI_PALETTE` declaration and the misleading comment above it with:

```ts
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
```

Leave `PIN_LENGTH`, `EmojiChar`, `isValidPin`, `hashPin`, and `isHashedPin` untouched.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/test/emoji-palette.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Verify the pad still renders 30 buttons and typechecks**

Run: `npx tsc --noEmit`
Expected: exit 0. (`CollageEmojiPad` maps over `EMOJI_PALETTE`, so it picks up all 30 with no edit. Its grid is CSS-driven and reflows from 5 rows to 6.)

- [ ] **Step 6: Commit**

```bash
git add src/lib/emoji-pin.ts src/test/emoji-palette.test.ts
git commit -m "Bring emoji palette to house v3 (30 glyphs) with a drift guard

MyKeepsakes sat on the 25-glyph v2 set after the house moved to 30 on
2026-04-17, so any family PIN using the new row was untypeable here.
Palette now written as escapes to protect the U+FE0F selectors that are
inside the SHA-256."
```

---

### Task 2: `house-auth.ts` — PIN → session, plus the admission rule

**Files:**
- Create: `src/lib/house-auth.ts`
- Test: `src/test/house-auth.test.ts` (create)

**Interfaces:**
- Consumes: `supabase` from `@/integrations/supabase/client`.
- Produces, relied on by Tasks 3 and 4:
  - `KEEPSAKES_DENIED_EMAILS: readonly string[]`
  - `isAdmitted(email: string | null | undefined): boolean`
  - `verifyHousePin(emojiPin: string): Promise<{ email: string; displayName: string }>`
  - `class HousePinError extends Error` with `kind: 'wrong-pin' | 'unreachable' | 'session-failed'`

- [ ] **Step 1: Write the failing test**

Create `src/test/house-auth.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const invoke = vi.fn();
const verifyOtp = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: (...a: unknown[]) => invoke(...a) },
    auth: { verifyOtp: (...a: unknown[]) => verifyOtp(...a) },
  },
}));

const { isAdmitted, verifyHousePin, HousePinError, KEEPSAKES_DENIED_EMAILS } = await import(
  '@/lib/house-auth'
);

beforeEach(() => {
  invoke.mockReset();
  verifyOtp.mockReset();
});

describe('isAdmitted', () => {
  it('denies Nanny', () => {
    expect(isAdmitted('cindy-nanny@family.internal')).toBe(false);
  });

  it('denies Nanny regardless of case or surrounding whitespace', () => {
    expect(isAdmitted('  Cindy-Nanny@Family.Internal  ')).toBe(false);
    expect(isAdmitted('CINDY-NANNY@FAMILY.INTERNAL')).toBe(false);
  });

  it('admits the accounts this repo knows about', () => {
    expect(isAdmitted('runx31021@gmail.com')).toBe(true);
    expect(isAdmitted('danllanes22@gmail.com')).toBe(true);
  });

  it('denies a session with no email at all', () => {
    // Fail closed on unknown input. Distinct from the fail-OPEN behaviour for
    // an unrecognised persona below — see spec D7; these are different axes and
    // the difference is deliberate.
    expect(isAdmitted(null)).toBe(false);
    expect(isAdmitted(undefined)).toBe(false);
    expect(isAdmitted('')).toBe(false);
    expect(isAdmitted('   ')).toBe(false);
  });

  it('admits an unrecognised persona (documented fail-open of a denylist)', () => {
    expect(isAdmitted('someone-new@example.com')).toBe(true);
  });

  it('denies exactly one address today', () => {
    expect(KEEPSAKES_DENIED_EMAILS).toEqual(['cindy-nanny@family.internal']);
  });
});

describe('verifyHousePin', () => {
  it('exchanges a PIN for a session and returns the persona', async () => {
    invoke.mockResolvedValue({
      data: { success: true, token_hash: 'abc123', email: 'runx31021@gmail.com', display_name: 'Shawn' },
      error: null,
    });
    verifyOtp.mockResolvedValue({ data: {}, error: null });

    await expect(verifyHousePin('🦝🦊🐨🦉')).resolves.toEqual({
      email: 'runx31021@gmail.com',
      displayName: 'Shawn',
    });

    expect(invoke).toHaveBeenCalledWith('verify-emoji-pin', { body: { emojiPin: '🦝🦊🐨🦉' } });
    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: 'abc123', type: 'magiclink' });
  });

  it('reports a wrong PIN when the function rejects it', async () => {
    invoke.mockResolvedValue({ data: null, error: { message: 'Invalid emoji PIN' } });
    await expect(verifyHousePin('🦝🦝🦝🦝')).rejects.toMatchObject({ kind: 'wrong-pin' });
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it('treats a malformed success payload as unreachable, not as a login', async () => {
    invoke.mockResolvedValue({ data: { success: true }, error: null }); // no token_hash
    await expect(verifyHousePin('🦝🦊🐨🦉')).rejects.toMatchObject({ kind: 'unreachable' });
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it('fails loudly if the session exchange fails after a valid PIN', async () => {
    invoke.mockResolvedValue({
      data: { success: true, token_hash: 'abc123', email: 'a@b.c', display_name: 'A' },
      error: null,
    });
    verifyOtp.mockResolvedValue({ data: null, error: { message: 'token expired' } });
    await expect(verifyHousePin('🦝🦊🐨🦉')).rejects.toMatchObject({ kind: 'session-failed' });
  });

  it('throws HousePinError instances', async () => {
    invoke.mockRejectedValue(new Error('network down'));
    await expect(verifyHousePin('🦝🦊🐨🦉')).rejects.toBeInstanceOf(HousePinError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/house-auth.test.ts`
Expected: FAIL — cannot resolve `@/lib/house-auth`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/house-auth.ts`:

```ts
// Oak Park house authentication for MyKeepsakes.
//
// The house (command-center/house-pin.js) and every Family Arcade game share ONE
// Supabase session on the thetiniestspoon.github.io origin, via the storage key
// sb-ckjcieeccopqowlfljja-auth-token. This app's client already reads that slot,
// so unlocking the house unlocks this app and vice versa.
//
// This module does one thing: turn a 4-emoji PIN into that shared session, and
// answer whether the resulting persona is allowed in HERE.
import { supabase } from '@/integrations/supabase/client';

/**
 * Personas the house authenticates but MyKeepsakes does not admit.
 * Operator decision, 2026-07-29: Nanny has house and arcade access, not the
 * family photo archive.
 *
 * This is a DENYLIST, so it fails OPEN: a persona added at the house later gets
 * in here automatically. An allowlist would fail closed and be safer, but writing
 * one needs Ted's and Brian's account emails, which are not in this repo. Spec §7
 * tracks the upgrade.
 *
 * Keyed on email, not display_name: display names are mutable labels, this
 * synthetic address is a stable identifier.
 */
export const KEEPSAKES_DENIED_EMAILS: readonly string[] = ['cindy-nanny@family.internal'];

export type HousePinErrorKind = 'wrong-pin' | 'unreachable' | 'session-failed';

export class HousePinError extends Error {
  readonly kind: HousePinErrorKind;
  constructor(message: string, kind: HousePinErrorKind) {
    super(message);
    this.name = 'HousePinError';
    this.kind = kind;
  }
}

/** Is this persona allowed into MyKeepsakes? Absent email => denied (fail closed). */
export function isAdmitted(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return !KEEPSAKES_DENIED_EMAILS.includes(normalized);
}

/**
 * Exchange a 4-emoji PIN for the shared Supabase session.
 *
 * Uses supabase.functions.invoke (not raw fetch) so the anon key is attached —
 * verify-emoji-pin belongs to command-center and is not in this repo's
 * config.toml, so we must not assume verify_jwt is false. Mirrors
 * house-pin.js:320.
 *
 * Note this does NOT check admission. Callers must consult isAdmitted() on the
 * resulting session, and must NOT sign a denied persona out — the session is
 * shared with the arcade games they are entitled to use.
 */
export async function verifyHousePin(
  emojiPin: string
): Promise<{ email: string; displayName: string }> {
  let payload: { token_hash?: string; email?: string; display_name?: string } | null = null;

  try {
    const { data, error } = await supabase.functions.invoke('verify-emoji-pin', {
      body: { emojiPin },
    });
    if (error) {
      // The shared function answers 401 for a bad PIN. invoke() collapses any
      // non-2xx into `error`, so a wrong PIN and a broken function are not
      // distinguishable here; treat it as a wrong PIN, which is both the common
      // case and the message that leaks nothing about who exists.
      throw new HousePinError('Wrong PIN — try again.', 'wrong-pin');
    }
    payload = data as typeof payload;
  } catch (err) {
    if (err instanceof HousePinError) throw err;
    throw new HousePinError("Can't reach the house right now.", 'unreachable');
  }

  if (!payload?.token_hash || !payload?.email) {
    throw new HousePinError("Can't reach the house right now.", 'unreachable');
  }

  const { error: otpError } = await supabase.auth.verifyOtp({
    token_hash: payload.token_hash,
    type: 'magiclink',
  });
  if (otpError) {
    throw new HousePinError('Could not start your session. Try again.', 'session-failed');
  }

  return { email: payload.email, displayName: payload.display_name ?? '' };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/test/house-auth.test.ts`
Expected: PASS, 12 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/house-auth.ts src/test/house-auth.test.ts
git commit -m "Add house-auth: exchange an emoji PIN for the shared session

Calls the shared verify-emoji-pin via functions.invoke so the anon key is
attached, then verifyOtp to land the session in the storage key the house
and the arcade already share.

isAdmitted() keeps Nanny out of this app. Denylist, so it fails open for
future personas - an allowlist needs emails this repo does not have."
```

---

### Task 3: `HousePinEntry` — the PIN-only screen

**Files:**
- Create: `src/components/auth/HousePinEntry.tsx`
- Create: `src/components/auth/NotAdmittedNotice.tsx`
- Test: `src/test/components/HousePinEntry.test.tsx` (create)

**Interfaces:**
- Consumes: `verifyHousePin`, `HousePinError` from `@/lib/house-auth` (Task 2); `CollageEmojiPad` from `@/components/auth/CollageEmojiPad` with props `{ onSubmit: (pin: string[]) => void; loading?: boolean; error?: string | null; submitLabel?: string; autoSubmit?: boolean }`; `CollageRoot`, `Stamp`, `MarginNote` from `@/preview/collage/*`.
- Produces: `HousePinEntry({ onAuthenticated }: { onAuthenticated: () => void })` and `NotAdmittedNotice()` (no props), both used by Task 4.

> **Note on `NotAdmittedNotice` taking no props:** the spec sketched a `displayName`, but the gate only ever has the session's *email*, and showing a raw email on a rejection screen is worse than showing nothing. Dropping the prop also avoids an unused-variable in the gate. Deliberate deviation from spec §4.3.

- [ ] **Step 1: Write the failing test**

Create `src/test/components/HousePinEntry.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const verifyHousePin = vi.fn();

vi.mock('@/lib/house-auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/house-auth')>('@/lib/house-auth');
  return { ...actual, verifyHousePin: (...a: unknown[]) => verifyHousePin(...a) };
});

const { HousePinEntry } = await import('@/components/auth/HousePinEntry');
const { HousePinError } = await import('@/lib/house-auth');

// Tap the first four palette buttons, which auto-submits.
async function typeAPin() {
  const buttons = screen.getAllByRole('button');
  for (const glyph of ['\u{1F99D}', '\u{1F98A}', '\u{1F428}', '\u{1F989}']) {
    const btn = buttons.find((b) => b.textContent === glyph);
    expect(btn, `palette button ${glyph} should exist`).toBeTruthy();
    fireEvent.click(btn!);
  }
}

beforeEach(() => verifyHousePin.mockReset());

describe('HousePinEntry', () => {
  it('offers all 30 house glyphs', () => {
    render(<HousePinEntry onAuthenticated={() => {}} />);
    const buttons = screen.getAllByRole('button');
    for (const glyph of ['\u{1F43F}\uFE0F', '\u{2708}\uFE0F', '\u{1F409}', '\u{1F99D}']) {
      expect(buttons.some((b) => b.textContent === glyph)).toBe(true);
    }
  });

  it('never lists who exists', () => {
    render(<HousePinEntry onAuthenticated={() => {}} />);
    for (const name of ['Shawn', 'Dan', 'Ted', 'Brian', 'Miles', 'Brennon', 'Cindy', 'Nanny']) {
      expect(screen.queryByText(new RegExp(name, 'i'))).toBeNull();
    }
    expect(screen.queryByRole('textbox')).toBeNull(); // no email field
  });

  it('calls onAuthenticated after a good PIN', async () => {
    verifyHousePin.mockResolvedValue({ email: 'runx31021@gmail.com', displayName: 'Shawn' });
    const onAuthenticated = vi.fn();
    render(<HousePinEntry onAuthenticated={onAuthenticated} />);
    await typeAPin();
    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledTimes(1));
    expect(verifyHousePin).toHaveBeenCalledWith('\u{1F99D}\u{1F98A}\u{1F428}\u{1F989}');
  });

  it('shows the wrong-PIN message and does not admit anyone', async () => {
    verifyHousePin.mockRejectedValue(new HousePinError('Wrong PIN — try again.', 'wrong-pin'));
    const onAuthenticated = vi.fn();
    render(<HousePinEntry onAuthenticated={onAuthenticated} />);
    await typeAPin();
    await waitFor(() => expect(screen.getByText(/wrong pin/i)).toBeInTheDocument());
    expect(onAuthenticated).not.toHaveBeenCalled();
  });

  it('shows a reachability message when the house cannot be reached', async () => {
    verifyHousePin.mockRejectedValue(new HousePinError("Can't reach the house right now.", 'unreachable'));
    render(<HousePinEntry onAuthenticated={() => {}} />);
    await typeAPin();
    await waitFor(() => expect(screen.getByText(/can't reach the house/i)).toBeInTheDocument());
  });

  it('does not admit anyone when the session exchange fails', async () => {
    verifyHousePin.mockRejectedValue(
      new HousePinError('Could not start your session. Try again.', 'session-failed')
    );
    const onAuthenticated = vi.fn();
    render(<HousePinEntry onAuthenticated={onAuthenticated} />);
    await typeAPin();
    await waitFor(() => expect(screen.getByText(/could not start your session/i)).toBeInTheDocument());
    expect(onAuthenticated).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/components/HousePinEntry.test.tsx`
Expected: FAIL — cannot resolve `@/components/auth/HousePinEntry`.

- [ ] **Step 3: Write both components**

Create `src/components/auth/NotAdmittedNotice.tsx`:

```tsx
import { CollageRoot } from '@/preview/collage/CollageRoot';
import { Stamp } from '@/preview/collage/ui/Stamp';

/**
 * Shown when the house authenticated this persona but MyKeepsakes does not
 * admit them.
 *
 * Deliberately does NOT offer a sign-out button and the caller must NOT sign
 * them out: the Supabase session is shared across the whole origin, so evicting
 * them here would also evict them from the arcade games they ARE entitled to.
 */
export function NotAdmittedNotice() {
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
        <div style={{ maxWidth: '38ch', textAlign: 'center' }}>
          <Stamp variant="outline" size="sm" rotate={-3}>
            not this door
          </Stamp>
          <h1
            style={{
              fontFamily: 'var(--c-font-display)',
              fontSize: 'clamp(22px, 5vw, 32px)',
              color: 'var(--c-ink)',
              margin: '14px 0 0',
              lineHeight: 1.1,
            }}
          >
            MyKeepsakes isn't part of your account
          </h1>
          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 15,
              color: 'var(--c-ink-muted)',
              marginTop: 12,
              lineHeight: 1.5,
            }}
          >
            The trip album is limited to the family accounts it was set up for.
            Everything else in the house still works normally — you can head back
            to the arcade.
          </p>
        </div>
      </div>
    </CollageRoot>
  );
}
```

Create `src/components/auth/HousePinEntry.tsx`:

```tsx
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/test/components/HousePinEntry.test.tsx`
Expected: PASS, 6 tests.

If the "never lists who exists" test fails on an unrelated word match, tighten the assertion to the exact rendered strings rather than weakening the intent — the requirement is that no persona name and no email input appear.

- [ ] **Step 5: Commit**

```bash
git add src/components/auth/HousePinEntry.tsx src/components/auth/NotAdmittedNotice.tsx src/test/components/HousePinEntry.test.tsx
git commit -m "Add PIN-only house entry screen and not-admitted notice

No email field and no roster of names - the PIN alone identifies the
persona, matching house-pin.js. The notice deliberately offers no sign-out,
because the session is shared with the arcade."
```

---

### Task 4: Gate the app on the shared session

**Files:**
- Create: `src/components/auth/HouseAuthGate.tsx`
- Modify: `src/pages/Index.tsx` (remove the `usePin` / `PinSetup` / `MultiUserPinEntry` / `sessionStorage` gate at lines 24-88 and 111-116; wrap the authed tree in `HouseAuthGate`)
- Test: `src/test/components/HouseAuthGate.test.tsx` (create)

**Interfaces:**
- Consumes: `isAdmitted` from `@/lib/house-auth` (Task 2); `HousePinEntry`, `NotAdmittedNotice` (Task 3); `supabase.auth.getSession()` and `supabase.auth.onAuthStateChange()`.
- Produces: `HouseAuthGate({ children }: { children: React.ReactNode })`.

The gate lives in its own component rather than inside `Index.tsx` so it can be tested without mounting the whole dashboard.

- [ ] **Step 1: Write the failing test**

Create `src/test/components/HouseAuthGate.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const getSession = vi.fn();
const onAuthStateChange = vi.fn();
const signOut = vi.fn();
const unsubscribe = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: (...a: unknown[]) => getSession(...a),
      onAuthStateChange: (...a: unknown[]) => onAuthStateChange(...a),
      signOut: (...a: unknown[]) => signOut(...a),
    },
  },
}));

vi.mock('@/components/auth/HousePinEntry', () => ({
  HousePinEntry: () => <div>PIN ENTRY</div>,
}));
vi.mock('@/components/auth/NotAdmittedNotice', () => ({
  NotAdmittedNotice: () => <div>NOT ADMITTED</div>,
}));

const { HouseAuthGate } = await import('@/components/auth/HouseAuthGate');

function sessionFor(email: string | null) {
  return { data: { session: { user: { email } } } };
}

beforeEach(() => {
  getSession.mockReset();
  onAuthStateChange.mockReset();
  signOut.mockReset();
  unsubscribe.mockReset();
  onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } });
});

describe('HouseAuthGate', () => {
  it('renders the app when an admitted persona already has a house session', async () => {
    getSession.mockResolvedValue(sessionFor('runx31021@gmail.com'));
    render(<HouseAuthGate><div>THE APP</div></HouseAuthGate>);
    await waitFor(() => expect(screen.getByText('THE APP')).toBeInTheDocument());
  });

  it('shows PIN entry when there is no session', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    render(<HouseAuthGate><div>THE APP</div></HouseAuthGate>);
    await waitFor(() => expect(screen.getByText('PIN ENTRY')).toBeInTheDocument());
    expect(screen.queryByText('THE APP')).toBeNull();
  });

  it('shows the notice for Nanny and NEVER signs her out', async () => {
    getSession.mockResolvedValue(sessionFor('cindy-nanny@family.internal'));
    render(<HouseAuthGate><div>THE APP</div></HouseAuthGate>);
    await waitFor(() => expect(screen.getByText('NOT ADMITTED')).toBeInTheDocument());
    expect(screen.queryByText('THE APP')).toBeNull();
    // Spec D6: the session is shared with the arcade games she IS entitled to.
    expect(signOut).not.toHaveBeenCalled();
  });

  it('denies a session with no email rather than admitting it', async () => {
    getSession.mockResolvedValue(sessionFor(null));
    render(<HouseAuthGate><div>THE APP</div></HouseAuthGate>);
    await waitFor(() => expect(screen.getByText('NOT ADMITTED')).toBeInTheDocument());
    expect(signOut).not.toHaveBeenCalled();
  });

  it('locks back to PIN entry when the session goes away mid-use', async () => {
    getSession.mockResolvedValue(sessionFor('runx31021@gmail.com'));
    render(<HouseAuthGate><div>THE APP</div></HouseAuthGate>);
    await waitFor(() => expect(screen.getByText('THE APP')).toBeInTheDocument());

    const handler = onAuthStateChange.mock.calls[0][0] as (e: string, s: unknown) => void;
    handler('SIGNED_OUT', null);
    await waitFor(() => expect(screen.getByText('PIN ENTRY')).toBeInTheDocument());
  });

  it('unsubscribes on unmount', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    const { unmount } = render(<HouseAuthGate><div>THE APP</div></HouseAuthGate>);
    await waitFor(() => expect(screen.getByText('PIN ENTRY')).toBeInTheDocument());
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/components/HouseAuthGate.test.tsx`
Expected: FAIL — cannot resolve `@/components/auth/HouseAuthGate`.

- [ ] **Step 3: Write the gate**

Create `src/components/auth/HouseAuthGate.tsx`:

```tsx
import { useEffect, useState, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { isAdmitted } from '@/lib/house-auth';
import { HousePinEntry } from '@/components/auth/HousePinEntry';
import { NotAdmittedNotice } from '@/components/auth/NotAdmittedNotice';

type GateState =
  | { status: 'loading' }
  | { status: 'locked' }
  | { status: 'admitted' }
  | { status: 'denied' };

/**
 * Gates MyKeepsakes on the SHARED Oak Park Supabase session.
 *
 * There is no app-local auth flag any more. If the house or an arcade game has
 * already signed this device in, the app simply opens. If not, we show the PIN
 * pad, which lands a session in the same shared slot.
 *
 * A denied persona is shown a notice and is deliberately NOT signed out — the
 * session belongs to the whole house, and evicting them here would evict them
 * from the games they are entitled to (spec D6).
 */
export function HouseAuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>({ status: 'loading' });

  useEffect(() => {
    let active = true;

    const apply = (session: { user?: { email?: string | null } } | null) => {
      if (!active) return;
      if (!session) {
        setState({ status: 'locked' });
        return;
      }
      setState(isAdmitted(session.user?.email) ? { status: 'admitted' } : { status: 'denied' });
    };

    supabase.auth.getSession().then(({ data }) => apply(data.session));

    const { data } = supabase.auth.onAuthStateChange((_event, session) => apply(session));

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (state.status === 'loading') {
    return (
      <div className="min-h-screen bg-beach-gradient flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking your house key...</p>
        </div>
      </div>
    );
  }

  if (state.status === 'locked') {
    // onAuthStateChange fires on the new session, which flips us to admitted or
    // denied — so this callback only needs to exist, not to carry state.
    return <HousePinEntry onAuthenticated={() => {}} />;
  }

  if (state.status === 'denied') {
    return <NotAdmittedNotice />;
  }

  return <>{children}</>;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/test/components/HouseAuthGate.test.tsx`
Expected: PASS, 6 tests.

- [ ] **Step 5: Wire it into `Index.tsx`**

Read `src/pages/Index.tsx` first. Then:

1. Delete these imports: `MultiUserPinEntry`, `PinSetup`, `usePin`, `isHashedPin`, and `useQueryClient` **only if** it becomes unused (it is also used by nothing else in this file once the `PinSetup` `onComplete` goes — verify with `npx tsc --noEmit`).
2. Add: `import { HouseAuthGate } from '@/components/auth/HouseAuthGate';`
3. Delete the `isAuthenticated` state, the `useEffect` that reads `sessionStorage.getItem('mk-authenticated')`, the `pinLoading` early return, the `needsSetup` / `PinSetup` branch, and the `!isAuthenticated` / `MultiUserPinEntry` branch (lines 24-88 in the current file).
4. Keep `handleLogout`, but make it a real sign-out:

```tsx
const handleLogout = async () => {
  await supabase.auth.signOut();
};
```

Add `import { supabase } from '@/integrations/supabase/client';` for that.

5. Wrap the returned tree in the gate, and drop the now-absent `currentPin` prop:

```tsx
return (
  <HouseAuthGate>
    <CollageRoot>
      {/* ...existing DashboardSelectionProvider tree unchanged... */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onLogout={handleLogout}
      />
      {/* ...rest unchanged... */}
    </CollageRoot>
  </HouseAuthGate>
);
```

Note the hooks that were previously below the auth early-returns (`useActiveTrip`, `useTripDays`, `useDashboardMode`) now run before the gate resolves. That is fine — they are React Query hooks that no-op on `undefined` input — but do not move them inside conditionals, or you will break the rules of hooks.

- [ ] **Step 6: Verify the app compiles and the suite is green**

Run: `npx tsc --noEmit`
Expected: exit 0. If it reports `currentPin` still required by `SettingsDialogProps`, that is fixed in Task 5 — you may complete Task 5's prop removal now rather than leaving the tree broken.

Run: `npx vitest run`
Expected: all pass except the pre-existing `TagChips` failure.

- [ ] **Step 7: Commit**

```bash
git add src/components/auth/HouseAuthGate.tsx src/test/components/HouseAuthGate.test.tsx src/pages/Index.tsx
git commit -m "Gate MyKeepsakes on the shared house session

Replaces the sessionStorage flag, the PinSetup first-run flow and the
email+PIN entry with a gate over the shared Supabase session. Unlock the
house or a game and this app is already open.

Nanny gets a notice and is NOT signed out - the session is shared, so
evicting her would evict her from the arcade too. Asserted by test."
```

---

### Task 5: Remove the retired PIN paths

**Files:**
- Modify: `src/components/SettingsDialog.tsx` — remove `currentPin` from props (line 26), the PIN-change state and handlers (lines 37-39, 47-88), the "Change PIN Section" block (lines 271-330) and its trailing `{hairline}`, the `CollageEmojiPad` and `useUpdatePin` imports, and `sessionStorage.removeItem('mk-authenticated')` from `handleLogout` (line 91)
- Delete: `src/components/MultiUserPinEntry.tsx`, `src/components/PinSetup.tsx`
- Test: `src/test/components/SettingsDialog.test.tsx` (create)

**Interfaces:**
- Consumes: nothing new.
- Produces: `SettingsDialogProps` loses `currentPin`. Signature becomes `{ open: boolean; onOpenChange: (open: boolean) => void; onLogout: () => void }`.

`usePin` and `useUpdatePin` stay in `src/hooks/use-trip-data.ts` — the legacy `app_settings` row is untouched data, and deleting the hooks is a separate cleanup. They simply have no callers after this task.

- [ ] **Step 1: Write the failing test**

Create `src/test/components/SettingsDialog.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
  },
}));

const { SettingsDialog } = await import('@/components/SettingsDialog');

function wrap(node: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={qc}>{node}</QueryClientProvider>;
}

describe('SettingsDialog after house auth', () => {
  it('no longer offers to change a MyKeepsakes-local PIN', () => {
    render(wrap(<SettingsDialog open onOpenChange={() => {}} onLogout={() => {}} />));
    expect(screen.queryByText(/set new emoji pin/i)).toBeNull();
    expect(screen.queryByText(/change pin/i)).toBeNull();
  });

  it('warns that signing out is house-wide', () => {
    render(wrap(<SettingsDialog open onOpenChange={() => {}} onLogout={() => {}} />));
    expect(screen.getByText(/house/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/components/SettingsDialog.test.tsx`
Expected: FAIL — "Set new emoji PIN" is still rendered, and TypeScript/React complains about the missing required `currentPin` prop.

- [ ] **Step 3: Strip the PIN-change surface**

Read `src/components/SettingsDialog.tsx` first, then:

1. Remove `currentPin: string;` from `SettingsDialogProps`.
2. Remove the `pinStep`, `firstPin`, `pinError` state and the `updatePin` mutation.
3. Remove `handleStartPinChange`, `handleFirstPin`, `handleConfirmPin`, `handleCancelPinChange`.
4. Remove the whole `{/* Change PIN Section */}` `<div>` and the `{hairline}` that immediately followed it, so two dividers don't collapse together.
5. Remove the now-unused `CollageEmojiPad` and `useUpdatePin` imports.
6. In `handleLogout`, delete `sessionStorage.removeItem('mk-authenticated')`. It becomes:

```tsx
const handleLogout = () => {
  onLogout();
  onOpenChange(false);
};
```

7. Replace the logout help text (currently "You'll need to enter the PIN again to access the trip planner.") with the honest house-wide warning:

```tsx
Signing out ends your Oak Park house session on this device — the arcade
games will ask for your PIN again too.
```

- [ ] **Step 4: Delete the dead components**

```bash
git rm src/components/MultiUserPinEntry.tsx src/components/PinSetup.tsx
```

- [ ] **Step 5: Verify nothing still references them**

Run: `npx tsc --noEmit`
Expected: exit 0.

Run: `npx vitest run`
Expected: all pass except the pre-existing `TagChips` failure.

Confirm the old paths are gone:

Run: `grep -rn "mk-authenticated\|MultiUserPinEntry\|PinSetup\|verify-user-pin" src/ ; echo "exit=$?"`
Expected: no matches (`exit=1`). Any hit is a leftover reference to fix.

- [ ] **Step 6: Production build**

Run: `npx vite build`
Expected: "built in ..." with no errors. The >500 kB chunk warning is pre-existing.

- [ ] **Step 7: Commit**

```bash
git add -A src/components/SettingsDialog.tsx src/test/components/SettingsDialog.test.tsx
git commit -m "Remove the retired MyKeepsakes-local PIN paths

Deletes MultiUserPinEntry and PinSetup, drops the Change-PIN section from
settings (it edited a credential the app no longer honours - PIN changes
belong to the house), and tells the truth about logout being house-wide.

usePin/useUpdatePin stay in place with no callers; retiring the legacy
app_settings row is separate cleanup."
```

---

## Operator verification (not automatable)

After Task 5 lands and the GitHub Pages deploy completes, the operator confirms on the real iPad. **Never ask them to reveal a PIN.**

1. Unlock the house at the porch, then open `https://thetiniestspoon.github.io/mykeepsakes/` → should open with **no second prompt**.
2. Open MyKeepsakes cold (no house session), enter a house PIN there → should open; then an arcade game should also be unlocked.
3. Nanny's PIN in MyKeepsakes → "not part of your account" notice; then an arcade game **still opens for her**.

Failure of step 1 or 2 most likely means the deployed `VITE_SUPABASE_URL` secret is not Family Core, which would put the session in a different storage key (spec §8 risk 3).

## Follow-ups this plan deliberately does NOT do

Only after the operator confirms the three checks above:

- Delete the `verify-user-pin` edge function and drop `user_emoji_pins` + `pin_attempts` (spec D8) — a named follow-up commit, since it is the break-glass path until then.
- Move rate limiting into the shared `verify-emoji-pin` so every app regains a lockout (spec §7). **MyKeepsakes has no login throttling until this is done.**
- Convert the denylist to an allowlist once Ted's and Brian's account emails are known (spec D7).
- RLS lockdown — until then this gate keeps Nanny out of the interface, not out of the data.
