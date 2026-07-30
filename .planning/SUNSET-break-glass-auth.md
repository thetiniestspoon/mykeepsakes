# Break-glass auth — earmarked for sunset

**Opened:** 2026-07-30
**Owner:** Shawn
**Trigger to close:** the three device checks in §2 all pass on the real iPad.
**Status:** OPEN — the old door is still live.

Branch `keepsakes-house-auth` moves MyKeepsakes onto the Oak Park house's shared
Supabase session. The *old* private PIN door was deliberately left deployed as
break-glass, so that a failure in the new flow can't lock the family out of the
trip album two weeks before Charleston.

That is a temporary state with a real cost, and this file exists so it does not
become permanent by forgetting. **Until §3 is executed, MyKeepsakes has two
front doors and one of them authenticates against credentials the app no longer
uses anywhere.**

---

## 1. What is still live and why

| Thing | Where | Why it's still there | Risk while it stays |
|---|---|---|---|
| `verify-user-pin` edge function | Family Core `ckjcieeccopqowlfljja`, deployed, **live** (`OPTIONS` → 200) | The only way back in if `verify-emoji-pin` or `verifyOtp` misbehaves on a real device | A reachable endpoint that grants MyKeepsakes identity from a stale credential store. Nothing in the app calls it any more, so a caller would be someone who knows the URL. |
| `user_emoji_pins` table | Family Core | Holds the SHA-256 hashes `verify-user-pin` checks | Dead credentials for exactly 2 people (Shawn, Dan). Not the family's house PINs. |
| `pin_attempts` table | Family Core | Rate-limit ledger for the above | Harmless; drop with its function. |
| `usePin` / `useCreatePin` / `useUpdatePin` | `src/hooks/use-trip-data.ts` | Zero callers; kept so retiring the legacy `app_settings` PIN row stays a separate, reviewable change | Dead code only. |
| `isHashedPin` | `src/lib/emoji-pin.ts` | Zero callers | Dead code only. |

Note what is **not** on this list: `hashPin` is still used by `emoji-palette.test.ts`
as the drift guard's known-vector check. It stays.

---

## 2. The checks that close this out

All three must pass on the **real iPad**, on the deployed site, not localhost.
Nothing here requires anyone to reveal a PIN to anyone else.

1. **Session is genuinely shared.** Unlock at the house porch, then open
   `https://thetiniestspoon.github.io/mykeepsakes/` → it should open with **no
   second prompt**.
2. **The pad works cold.** In a fresh browser (or after signing out), open
   MyKeepsakes and enter a house PIN → it should let you in, and an arcade game
   should then also be unlocked without asking again.
3. **The exclusion and the escape hatch both work.** Nanny's PIN → the
   "isn't part of your account" notice → tap **"This isn't me — use a different
   PIN"** → the PIN pad returns and another family PIN gets in. Separately
   confirm an arcade game still opens for her.

If check 1 or 2 fails, the most likely cause is that the deployed
`VITE_SUPABASE_URL` secret is not Family Core — which would put the session in a
different storage key and silently break sharing. That is a GitHub Actions
secret and was never read during development.

---

## 3. The sunset, once §2 passes

Run in the SQL editor for `ckjcieeccopqowlfljja`:
https://supabase.com/dashboard/project/ckjcieeccopqowlfljja/sql/new

```sql
BEGIN;

-- Proof this only touches the retired credential store.
CREATE TEMP TABLE before_sunset AS
SELECT 'user_emoji_pins' AS tbl, count(*) AS n FROM user_emoji_pins
UNION ALL SELECT 'pin_attempts', count(*) FROM pin_attempts
UNION ALL SELECT 'trips',            count(*) FROM trips
UNION ALL SELECT 'itinerary_items',  count(*) FROM itinerary_items
UNION ALL SELECT 'memories',         count(*) FROM memories;

DROP TABLE IF EXISTS public.pin_attempts;
DROP TABLE IF EXISTS public.user_emoji_pins;

SELECT b.tbl,
       b.n AS before_n,
       CASE b.tbl
         WHEN 'trips'           THEN (SELECT count(*) FROM trips)
         WHEN 'itinerary_items' THEN (SELECT count(*) FROM itinerary_items)
         WHEN 'memories'        THEN (SELECT count(*) FROM memories)
         ELSE 0
       END AS after_n
FROM before_sunset b ORDER BY b.tbl;

-- trips / itinerary_items / memories must be UNCHANGED. If not: ROLLBACK;
COMMIT;
```

Then delete the function itself (Dashboard → Edge Functions → `verify-user-pin`
→ Delete):
https://supabase.com/dashboard/project/ckjcieeccopqowlfljja/functions

Confirm it is gone — this should NOT return 200:

```
curl -s -o /dev/null -w "%{http_code}\n" -X OPTIONS https://ckjcieeccopqowlfljja.supabase.co/functions/v1/verify-user-pin
```

Finally, in this repo: delete the `[functions.verify-user-pin]` block from
`supabase/config.toml` and `supabase/functions/verify-user-pin/`, and mark this
file **CLOSED** with the date.

---

## 4. Do NOT sunset these at the same time

- **`usePin` / `useUpdatePin` and the `app_settings` PIN row** — separate change,
  separate review. The row is untouched data.
- **RLS** — every MyKeepsakes table is still `USING (true)`. Removing the old
  door does not make the new one a data boundary; only the deferred RLS work
  does. Tracked in the design doc §7, not here.
