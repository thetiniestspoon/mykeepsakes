-- Create storage bucket for trip photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('trip-photos', 'trip-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to all photos
CREATE POLICY "Public read access for trip photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'trip-photos');

-- Allow public upload (for now - no auth)
CREATE POLICY "Public upload access for trip photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'trip-photos');

-- Allow public delete
CREATE POLICY "Public delete access for trip photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'trip-photos');