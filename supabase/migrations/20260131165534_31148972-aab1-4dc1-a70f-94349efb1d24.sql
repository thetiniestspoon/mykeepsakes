-- Create lodging_options table for comparing potential accommodations
CREATE TABLE public.lodging_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  price_per_night DECIMAL(10,2),
  total_price DECIMAL(10,2),
  url TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  bedrooms INTEGER,
  bathrooms DECIMAL(3,1),
  max_guests INTEGER,
  amenities TEXT[],
  pros TEXT[],
  cons TEXT[],
  is_selected BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  votes_up INTEGER NOT NULL DEFAULT 0,
  votes_down INTEGER NOT NULL DEFAULT 0,
  photos TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lodging_options ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (family-shared app, no auth)
CREATE POLICY "Allow public read access to lodging_options" 
ON public.lodging_options 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to lodging_options" 
ON public.lodging_options 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to lodging_options" 
ON public.lodging_options 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access to lodging_options" 
ON public.lodging_options 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_lodging_options_updated_at
BEFORE UPDATE ON public.lodging_options
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();