# MyKeepsakes ↔ Oak Park house auth — design

**Date:** 2026-07-29
**Scope decision:** login parity only (attribution and RLS explicitly deferred)
**Goal:** the same emoji PIN that opens the Oak Park house and the arcade games opens MyKeepsakes — except Nanny, who is authenticated by the house but not admitted here.

---

## 1. Findings — what is actually wrong

The plumbing is already correct. Only the app's behaviour is wrong.

| Fact | Evidence |
|---|---|
| MyKeepsakes targets Family Core | `supabase/config.toml` → `project_id = "ckjcieeccopqowlfljja"` |
| The house deliberately shares one session slot across the origin | `command-center/house-auth.js:30` → `storageKey: 'sb-ckjcieeccopqowlfljja-auth-token'`, commented "guarantees all Family Arcade apps on the same origin" |
| MyKeepsakes already reads that exact slot | its client omits `storageKey`, and supabase-js defaults to `sb-<projectRef>-auth-token` for the same ref |
| …but never uses it | `src/pages/Index.tsx` gates on `sessionStorage['mk-authenticated']`, set by its own private PIN check |
| MyKeepsakes' palette is a version behind | `src/lib/emoji-pin.ts` has the **25**-glyph v2 set; `house-pin.js` has **30** (v3 added row `🐿️🦔🦒🐉✈️` on 2026-04-17) |
| Both edge functions are live | `OPTIONS` probe → `200`, `Access-Control-Allow-Origin: *` on `verify-emoji-pin` and `verify-user-pin` |

**Consequence of the palette gap:** any family member whose v3 PIN uses one of the five new glyphs cannot physically type their PIN in MyKeepsakes today. The file's own comment claims "Unified family palette (shared across all Foundry sites)", which is false — a two-sources-of-truth drift.

### The two identity models

| | House / arcade | MyKeepsakes (today) |
|---|---|---|
| Function | `verify-emoji-pin` (shared) | `verify-user-pin` (private) |
| Credential table | `emoji_pins` (7 personas) | `user_emoji_pins` (**2**: Shawn, Dan) |
| Keyed by | `pin_hash` → `user_id` | `email` (UNIQUE) |
| Input | PIN only | email **+** PIN |
| Result | real Supabase session via `generateLink` + `verifyOtp` | `sessionStorage` boolean, **no session** |
| Throttling | none | 5 attempts / 5 min, `pin_attempts` log, timing-safe compare |

`user_emoji_pins` cannot be salvaged by backfilling: its `email` is `UNIQUE` and it logs in *by* email, but Miles and Brennon both use `runx31021@gmail.com`. The house model avoids this by never looking up by email.

---

## 2. Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | Use the **shared** `verify-emoji-pin`; retire MyKeepsakes' private verifier | One door. Operator's explicit choice. |
| D2 | Accept the loss of rate limiting | Follows from D1. The shared function has none. Recovery path in §7. |
| D3 | Gate on the **shared Supabase session**, not `sessionStorage` | This is what makes it behave like the arcade: unlock the house once, Keepsakes is already open. |
| D4 | Bring the palette to v3, byte-exact | Without it the same PIN cannot be typed. |
| D5 | **Nanny (Cindy) is authenticated but not admitted** | Operator requirement, 2026-07-29. |
| D6 | On denial, **never call `signOut()`** | The session is shared. Signing her out would evict her from the arcade games she *is* entitled to. |
| D7 | Denylist, not allowlist | An allowlist would need Ted's and Brian's account emails, which are not in this repo. Fails open for future personas — named in code, upgrade tracked in §7. |
| D8 | Keep `verify-user-pin` deployed but unreferenced until iPad confirmation | Break-glass. Deleted in a named follow-up commit. |

---

## 3. Architecture

```
family member opens /mykeepsakes/
        │
        ├─ supabase.auth.getSession() ── session? ──► admitted?  ──► app
        │                                    │            │
        │                                    │            └─ denied ──► "not available on this account"
        │                                    │                          (session left intact — D6)
        │                                    no
        │                                    ▼
        └───────────────────────── HousePinEntry (PIN only, 30-glyph v3 pad)
                                             │
                                   POST verify-emoji-pin  { emojiPin }
                                             │
                                   { token_hash, email, display_name }
                                             │
                                   supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })
                                             │
                                   session written to the SHARED storage key
                                             │
                                        admitted? ──► app  |  denied ──► notice
```

Because the session lands in the shared slot, authenticating here also unlocks the arcade, and vice versa. That is the feature.

---

## 4. Components

### 4.1 `src/lib/emoji-pin.ts` (modified)
`EMOJI_PALETTE` becomes the v3 30-glyph set in house order, written as explicit escapes so the variation selectors survive review and copy-paste:

```
row 1  1F99D 1F98A 1F428 1F989 1F419          🦝🦊🐨🦉🐙
row 2  1F99B 1F40B 1F9A9 1F99A 1F9AB          🦛🐋🦩🦚🦫
row 3  1F43F+FE0F 1F994 1F992 1F409 2708+FE0F 🐿️🦔🦒🐉✈️   ← v3 addition
row 4  1F335 1F33B 1F344 1F30A 1F525          🌵🌻🍄🌊🔥
row 5  2B50 1F319 1F3B8 1F3B2 1F52E           ⭐🌙🎸🎲🔮
row 6  1F3E0 1F511 1F48E 1F680 1F3AF          🏠🔑💎🚀🎯
```

`PIN_LENGTH = 4` (unchanged; matches `house-pin.js:280`). `hashPin` is unchanged (`emojis.join('')` then SHA-256) and stays exported — it is retained for the parity test and any local hashing, but is **no longer on the login path**, since the shared function hashes server-side.

The misleading "Unified family palette" comment is replaced with a pointer to `command-center/house-pin.js` as the source of truth, and a warning that the two must not drift.

### 4.2 `src/lib/house-auth.ts` (new)
Single purpose: turn an emoji PIN into a session.

- `verifyHousePin(emojiPin: string): Promise<{ email: string; display_name: string }>`
  POSTs `{ emojiPin }` to `${VITE_SUPABASE_URL}/functions/v1/verify-emoji-pin`, then calls `supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })`. Throws a typed error on 401 / network failure / `verifyOtp` failure.
- `isAdmitted(email: string | null | undefined): boolean`
  The D5/D7 gate. `KEEPSAKES_DENIED_EMAILS = ['cindy-nanny@family.internal']`, compared lowercased and trimmed. Checks **email**, not `display_name` — display names are mutable labels, the synthetic email is a stable identifier.

Depends on: the shared supabase client, `VITE_SUPABASE_URL`. Nothing else. No React.

### 4.3 `src/components/auth/HousePinEntry.tsx` (new)
PIN-only pad: 30 glyphs in 6×5, 4 taps, auto-submits on the fourth (mirrors house UX). No email field, **no user picker, no roster of family names** — it must not enumerate who exists. Reuses the existing `CollageEmojiPad` styling so it looks like the rest of the app. States: entering → verifying → error (shake + "Wrong PIN — try again") → denied notice.

### 4.4 `src/pages/Index.tsx` (modified)
Replaces the `sessionStorage` + `usePin` + `PinSetup` + `MultiUserPinEntry` gate with:
`getSession()` on mount, an `onAuthStateChange` subscription (unsubscribed on unmount), a loading state while the session resolves, then one of: app / `HousePinEntry` / denied notice.

### 4.5 Removals
`MultiUserPinEntry` and `PinSetup` usage, the `usePin` first-run branch, `sessionStorage['mk-authenticated']`, and `SettingsDialog`'s PIN-change UI — it would edit a credential the app no longer honours. PIN changes belong to the house. `SettingsDialog` keeps its other settings and its logout, which becomes a real `supabase.auth.signOut()`.

**Logout caveat, stated deliberately:** because the session is shared, logging out of MyKeepsakes logs the device out of the house and the arcade too. That is honest and correct for a shared credential, and the button will say so.

---

## 5. Error handling

| Case | Behaviour |
|---|---|
| Wrong PIN | 401 → shake, "Wrong PIN — try again". No hint about which personas exist. |
| `verifyOtp` fails after a valid PIN | Explicit error, **no access granted**. Never fall through to the app. |
| Function unreachable / offline | "Can't reach the house right now." No access. No silent bypass. |
| Session expires mid-use | `onAuthStateChange` fires → back to `HousePinEntry`. No stale-session illusion. |
| Nanny authenticates | Session created and **left intact** (D6); denied notice shown. |
| Repeated wrong PINs | **Not throttled** (D2). Accepted risk on landing. |

---

## 6. Testing

Automated (`src/test/house-auth.test.ts`):
1. **Palette parity** — all 30 codepoints, in order, equal the expected escape list, including both `FE0F` selectors. Guards D4 against silent drift.
2. **`hashPin` known vector** — a fixed 4-glyph sequence hashes to a pinned hex string, so an encoding change can't pass unnoticed.
3. **`isAdmitted`** — Nanny's email denied; case and whitespace variants of it still denied; the two emails this repo actually knows (`runx31021@gmail.com`, `danllanes22@gmail.com`) admitted; `null`/`undefined` denied.
   Note the two failure directions are deliberately different, and are not a contradiction: an **unknown persona is admitted** (D7's fail-open, the cost of a denylist), but a **missing/absent email is denied** (fail-closed, since a session with no email identifies nobody). All seven personas have emails, so the latter is unreachable in practice.
4. **Gate behaviour** — session + admitted → children render; no session → `HousePinEntry`; session + denied → notice **and `signOut` was not called** (asserts D6 directly).

Manual, by the operator on the real iPad — the only honest final check:
- house PIN typed at the porch, then open Keepsakes → already in, no second prompt;
- Keepsakes opened cold, house PIN typed there → in, and the arcade is then also unlocked;
- Nanny's PIN → denied notice, and an arcade game still opens for her.

**A PIN will never be requested from the operator in chat, in a command, or in a tool call.** Verification is on-device by the person who owns the PIN.

---

## 7. Out of scope — tracked, not done

| Item | Why deferred |
|---|---|
| Rate limiting on the shared function | Follows from D1/D2. Moving MyKeepsakes' lockout into `verify-emoji-pin` fixes it for every app at once, but changes the front door for picopets, tales, waypost and bento — not 16 days before Charleston. |
| Denylist → allowlist (D7) | Needs Ted's and Brian's account emails. Should come from a query, not a guess. |
| RLS lockdown | Every MyKeepsakes table is `USING (true)`. Until that changes, **this gate keeps Nanny out of the interface, not out of the data.** |
| Per-user attribution | Operator chose login parity only. Note that Miles and Brennon resolve to Shawn's auth user, so attribution would be wrong for them until bento-gating lands. |
| Delete `verify-user-pin`, drop `user_emoji_pins` | D8 — after iPad confirmation, as a named follow-up commit. |

---

## 8. Risks

1. **No throttling on landing** (D2) — an unthrottled 4-of-30 PIN endpoint. Mitigation: §7 row 1, and the endpoint is already exposed for the arcade regardless.
2. **Shared-session blast radius** — logout here logs out everywhere; a denial must therefore not sign out (D6, asserted by test 4).
3. **Deployed env assumption** — `VITE_SUPABASE_URL` is a GitHub Actions secret and was not read. If the deployed value were ever not Family Core, the storage keys would diverge and session sharing would silently fail. Detectable in one step: the first manual check (house PIN, then open Keepsakes) fails closed and visibly.
4. **Palette re-drift** — mitigated by test 1, but the real fix is one shared module; the two repos deploy independently, so a test is the pragmatic guard.
