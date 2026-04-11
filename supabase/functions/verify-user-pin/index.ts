// verify-user-pin — server-side emoji PIN verification with rate limiting.
//
// Reconstructed 2026-04-10 after the original function was found to be missing
// from the Family Core project. The client (`src/components/MultiUserPinEntry.tsx`)
// has been calling /functions/v1/verify-user-pin since commit ded0838 (2026-04-03);
// the function source was never committed to git, so when commit f2790ef moved
// MyKeepsakes from its old Supabase project to Family Core it didn't come along.
//
// Contract (matches existing client expectations):
//   POST { email: string, emojiPin: string }
//   → 200 { success: true, email, display_name }
//   → 401 { success: false, attempts_remaining: number }
//   → 429 { error, lockout_seconds: number }   on rate-limit lockout
//   → 400/500 { error }                          on malformed/internal errors
//
// Requires `user_emoji_pins` and `pin_attempts` tables (RLS locked — service role only)
// from migrations 20260331000000_add_user_emoji_pins.sql + 20260403000000_pin_security.sql.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_SECONDS = 300;   // look back 5 min for rate-limit window
const LOCKOUT_SECONDS = 300;  // 5 min lockout after threshold crossed

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Constant-time string comparison to avoid timing-based hash discovery.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.email !== 'string' || typeof body.emojiPin !== 'string') {
      return jsonResponse({ error: 'email and emojiPin required' }, 400);
    }

    const email = body.email.toLowerCase().trim();
    const emojiPin: string = body.emojiPin;

    if (!email || !emojiPin) {
      return jsonResponse({ error: 'email and emojiPin required' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ── Rate-limit gate ─────────────────────────────────────────────
    const windowStart = new Date(Date.now() - WINDOW_SECONDS * 1000).toISOString();
    const { data: recentFails, error: rateErr } = await supabase
      .from('pin_attempts')
      .select('attempted_at')
      .eq('email', email)
      .eq('success', false)
      .gte('attempted_at', windowStart)
      .order('attempted_at', { ascending: false });

    if (rateErr) {
      console.error('pin_attempts query failed:', rateErr);
      return jsonResponse({ error: 'Service error' }, 500);
    }

    const failedCount = recentFails?.length ?? 0;

    if (failedCount >= MAX_FAILED_ATTEMPTS) {
      // Lockout: compute seconds until oldest in-window failure ages out.
      const oldestInWindow = recentFails![failedCount - 1];
      const elapsed = Math.floor(
        (Date.now() - new Date(oldestInWindow.attempted_at).getTime()) / 1000
      );
      const remaining = Math.max(1, LOCKOUT_SECONDS - elapsed);
      return jsonResponse(
        { error: 'Too many attempts. Please wait before trying again.', lockout_seconds: remaining },
        429
      );
    }

    // ── Verify PIN ──────────────────────────────────────────────────
    const pinHash = await sha256Hex(emojiPin);

    const { data: user, error: userErr } = await supabase
      .from('user_emoji_pins')
      .select('email, display_name, pin_hash')
      .eq('email', email)
      .maybeSingle();

    if (userErr) {
      console.error('user_emoji_pins lookup failed:', userErr);
      return jsonResponse({ error: 'Service error' }, 500);
    }

    const success = !!user && timingSafeEqual(user.pin_hash, pinHash);

    // Log every attempt (success and failure) so the rate limiter has a complete
    // picture. Failing to log shouldn't block a valid login.
    const { error: logErr } = await supabase
      .from('pin_attempts')
      .insert({ email, success });
    if (logErr) {
      console.error('pin_attempts insert failed (non-fatal):', logErr);
    }

    if (success) {
      return jsonResponse({
        success: true,
        email: user!.email,
        display_name: user!.display_name,
      });
    }

    // Failed: return attempts_remaining so the client can show the countdown
    // when the user is close to the threshold.
    const attempts_remaining = Math.max(0, MAX_FAILED_ATTEMPTS - (failedCount + 1));
    return jsonResponse({ success: false, attempts_remaining }, 401);
  } catch (err) {
    console.error('verify-user-pin internal error:', err);
    return jsonResponse({ error: 'Internal error' }, 500);
  }
});
