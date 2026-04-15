-- Create templates table
CREATE TABLE IF NOT EXISTS public.broadcast_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'text' CHECK (media_type IN ('text', 'photo', 'document')),
  media_url TEXT,
  media_filename TEXT,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for templates
ALTER TABLE public.broadcast_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates"
ON public.broadcast_templates FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own templates"
ON public.broadcast_templates FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
ON public.broadcast_templates FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
ON public.broadcast_templates FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER handle_broadcast_templates_updated_at
  BEFORE UPDATE ON public.broadcast_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS broadcast_templates_user_id_idx ON public.broadcast_templates(user_id);
CREATE INDEX IF NOT EXISTS broadcast_templates_created_at_idx ON public.broadcast_templates(created_at DESC);