-- Create broadcasts table
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('all_channels', 'selected_channels', 'all_groups', 'selected_groups', 'custom')),
  target_ids TEXT[], -- Array of channel/group IDs
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own broadcasts"
  ON public.broadcasts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own broadcasts"
  ON public.broadcasts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own broadcasts"
  ON public.broadcasts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own broadcasts"
  ON public.broadcasts FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER set_broadcasts_updated_at
  BEFORE UPDATE ON public.broadcasts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS broadcasts_user_id_idx ON public.broadcasts(user_id);
CREATE INDEX IF NOT EXISTS broadcasts_status_idx ON public.broadcasts(status);
CREATE INDEX IF NOT EXISTS broadcasts_created_at_idx ON public.broadcasts(created_at DESC);