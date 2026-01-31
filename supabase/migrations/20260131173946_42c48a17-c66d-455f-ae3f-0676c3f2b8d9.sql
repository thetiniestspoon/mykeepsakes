-- Create activity_overrides table for storing edits to base activities
CREATE TABLE public.activity_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id TEXT UNIQUE NOT NULL,
  title TEXT,
  description TEXT,
  time TEXT,
  category TEXT,
  location_name TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  link TEXT,
  link_label TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_overrides ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (matching existing patterns)
CREATE POLICY "Allow public read access to activity_overrides"
ON public.activity_overrides
FOR SELECT
USING (true);

CREATE POLICY "Allow public insert access to activity_overrides"
ON public.activity_overrides
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update access to activity_overrides"
ON public.activity_overrides
FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete access to activity_overrides"
ON public.activity_overrides
FOR DELETE
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_activity_overrides_updated_at
BEFORE UPDATE ON public.activity_overrides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();