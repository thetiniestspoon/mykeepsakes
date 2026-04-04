-- Rate limiting table for PIN attempts
CREATE TABLE IF NOT EXISTS public.pin_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false
);

-- Index for fast lookups by email + time window
CREATE INDEX IF NOT EXISTS idx_pin_attempts_email_time ON public.pin_attempts (email, attempted_at DESC);

-- Enable RLS on pin_attempts (service role only — no public policies)
ALTER TABLE public.pin_attempts ENABLE ROW LEVEL SECURITY;

-- Lock down user_emoji_pins: remove all public read/write policies
DROP POLICY IF EXISTS "Allow public read access" ON public.user_emoji_pins;
DROP POLICY IF EXISTS "Allow public update access" ON public.user_emoji_pins;
DROP POLICY IF EXISTS "Allow public update access to user pins" ON public.user_emoji_pins;
-- With no public policies + RLS enabled, only service_role can access
