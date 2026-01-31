-- Create family_contacts table for storing family member information
CREATE TABLE public.family_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  relationship TEXT,
  category TEXT NOT NULL DEFAULT 'family',
  emergency_info TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.family_contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for this family app)
CREATE POLICY "Allow public read access to family_contacts"
ON public.family_contacts
FOR SELECT
USING (true);

CREATE POLICY "Allow public insert access to family_contacts"
ON public.family_contacts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update access to family_contacts"
ON public.family_contacts
FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete access to family_contacts"
ON public.family_contacts
FOR DELETE
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_family_contacts_updated_at
BEFORE UPDATE ON public.family_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();