-- Add media columns to broadcasts table
ALTER TABLE public.broadcasts
ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('text', 'photo', 'document')),
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_filename TEXT,
ADD COLUMN IF NOT EXISTS caption TEXT;

-- Update existing records to have text type
UPDATE public.broadcasts SET media_type = 'text' WHERE media_type IS NULL;

-- Create storage bucket for broadcast media
INSERT INTO storage.buckets (id, name, public)
VALUES ('broadcast-media', 'broadcast-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for broadcast media
CREATE POLICY "Users can upload broadcast media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'broadcast-media');

CREATE POLICY "Users can view broadcast media"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'broadcast-media');

CREATE POLICY "Users can delete own broadcast media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'broadcast-media' AND owner = auth.uid());