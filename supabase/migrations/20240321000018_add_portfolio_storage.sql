-- Create portfolio bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio', 'portfolio', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to portfolio items
CREATE POLICY "Portfolio items are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio');

-- Allow authenticated users to upload their own portfolio items
CREATE POLICY "Users can upload their own portfolio items"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'portfolio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own portfolio items
CREATE POLICY "Users can update their own portfolio items"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'portfolio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own portfolio items
CREATE POLICY "Users can delete their own portfolio items"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'portfolio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
); 