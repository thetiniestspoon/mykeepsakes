-- App settings table (for PIN configuration)
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow public access (PIN-protected app, not user auth)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to settings" 
ON public.app_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public update access to settings" 
ON public.app_settings 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public insert access to settings" 
ON public.app_settings 
FOR INSERT 
WITH CHECK (true);

-- Insert default PIN
INSERT INTO public.app_settings (setting_key, setting_value) 
VALUES ('pin', '1475963');

-- Checklist items table (for activity completion and packing list)
CREATE TABLE public.checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id TEXT NOT NULL UNIQUE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to checklist items" 
ON public.checklist_items 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Favorites table
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id TEXT NOT NULL UNIQUE,
  item_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to favorites" 
ON public.favorites 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Notes table
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to notes" 
ON public.notes 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Photos table (metadata, actual files go to storage)
CREATE TABLE public.photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to photos" 
ON public.photos 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Collapsed sections table
CREATE TABLE public.collapsed_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id TEXT NOT NULL UNIQUE,
  is_collapsed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.collapsed_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to collapsed sections" 
ON public.collapsed_sections 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create storage bucket for trip photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('trip-photos', 'trip-photos', true);

-- Storage policies for photos bucket
CREATE POLICY "Allow public read access to trip photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'trip-photos');

CREATE POLICY "Allow public upload to trip photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'trip-photos');

CREATE POLICY "Allow public delete from trip photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'trip-photos');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for timestamp updates
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checklist_items_updated_at
BEFORE UPDATE ON public.checklist_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();