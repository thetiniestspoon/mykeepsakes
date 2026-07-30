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
      // supabase-js distinguishes these by error class: a FunctionsHttpError
      // means the function ran and returned non-2xx (a genuinely wrong PIN);
      // a FunctionsFetchError/FunctionsRelayError means the function could
      // not be reached at all (an outage, not a bad PIN). Check `error.name`
      // rather than importing the classes, so this does not depend on those
      // symbols being exported by the installed supabase-js version. Any
      // unrecognised name fails toward "something is broken" rather than
      // accusing the user of a bad PIN.
      if (error.name === 'FunctionsHttpError') {
        throw new HousePinError('Wrong PIN — try again.', 'wrong-pin');
      }
      throw new HousePinError("Can't reach the house right now.", 'unreachable');
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
