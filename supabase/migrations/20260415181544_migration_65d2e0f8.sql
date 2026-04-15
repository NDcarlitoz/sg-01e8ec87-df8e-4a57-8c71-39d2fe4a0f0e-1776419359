-- Add tags column to bot_users for segmentation
ALTER TABLE public.bot_users
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_bot_users_tags ON public.bot_users USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_bot_users_is_active ON public.bot_users(is_active);
CREATE INDEX IF NOT EXISTS idx_bot_users_last_interaction ON public.bot_users(last_interaction DESC);

-- Create user_segments table
CREATE TABLE IF NOT EXISTS public.user_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  filter_conditions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  member_count INTEGER DEFAULT 0,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for segments
ALTER TABLE public.user_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own segments"
  ON public.user_segments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create segments"
  ON public.user_segments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own segments"
  ON public.user_segments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own segments"
  ON public.user_segments FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for segments
CREATE INDEX IF NOT EXISTS idx_user_segments_user_id ON public.user_segments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_segments_is_active ON public.user_segments(is_active);

-- Add comments
COMMENT ON TABLE public.user_segments IS 'User segmentation rules for targeted messaging';
COMMENT ON COLUMN public.user_segments.filter_conditions IS 'Array of filter conditions for segment membership';
COMMENT ON COLUMN public.bot_users.tags IS 'Array of tags for manual user categorization';