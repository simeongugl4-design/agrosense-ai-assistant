
-- Create storage bucket for marketplace listing images
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Listing images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-images');

-- Allow anyone to upload listing images
CREATE POLICY "Anyone can upload listing images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'listing-images');

-- Allow anyone to update their listing images
CREATE POLICY "Anyone can update listing images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'listing-images');

-- Allow anyone to delete listing images
CREATE POLICY "Anyone can delete listing images"
ON storage.objects FOR DELETE
USING (bucket_id = 'listing-images');
