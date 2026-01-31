-- Create custom_activities table for user-added activities
CREATE TABLE public.custom_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  time TEXT,
  category TEXT NOT NULL DEFAULT 'activity',
  location_name TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  link TEXT,
  link_label TEXT,
  phone TEXT,
  map_link TEXT,
  notes TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activity_order table for tracking reordering of all activities
CREATE TABLE public.activity_order (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id TEXT NOT NULL UNIQUE,
  day_id TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for both tables
ALTER TABLE public.custom_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_order ENABLE ROW LEVEL SECURITY;

-- Create policies for custom_activities
CREATE POLICY "Allow public read access to custom_activities"
ON public.custom_activities FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to custom_activities"
ON public.custom_activities FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to custom_activities"
ON public.custom_activities FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to custom_activities"
ON public.custom_activities FOR DELETE USING (true);

-- Create policies for activity_order
CREATE POLICY "Allow public read access to activity_order"
ON public.activity_order FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to activity_order"
ON public.activity_order FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to activity_order"
ON public.activity_order FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to activity_order"
ON public.activity_order FOR DELETE USING (true);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_custom_activities_updated_at
BEFORE UPDATE ON public.custom_activities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activity_order_updated_at
BEFORE UPDATE ON public.activity_order
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();