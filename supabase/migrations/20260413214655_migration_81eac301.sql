-- Create bot_tokens table
CREATE TABLE IF NOT EXISTS public.bot_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bot_name TEXT NOT NULL,
  bot_token TEXT NOT NULL,
  bot_username TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.bot_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only manage their own bots
CREATE POLICY "Users can view own bot tokens"
  ON public.bot_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bot tokens"
  ON public.bot_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bot tokens"
  ON public.bot_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bot tokens"
  ON public.bot_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS bot_tokens_user_id_idx ON public.bot_tokens(user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bot_tokens_updated_at
  BEFORE UPDATE ON public.bot_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();