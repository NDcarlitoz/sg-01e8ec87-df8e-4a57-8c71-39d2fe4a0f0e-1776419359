-- Create message_forwards table to track forwarded messages
CREATE TABLE IF NOT EXISTS public.message_forwards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_chat_id TEXT NOT NULL,
  source_message_id INTEGER NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('channels', 'users', 'groups')),
  target_ids TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'forwarding', 'completed', 'failed')),
  forwarded_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  forward_results JSONB,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS message_forwards_user_id_idx ON public.message_forwards(user_id);
CREATE INDEX IF NOT EXISTS message_forwards_status_idx ON public.message_forwards(status);
CREATE INDEX IF NOT EXISTS message_forwards_created_at_idx ON public.message_forwards(created_at DESC);

-- Enable RLS
ALTER TABLE public.message_forwards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own forwards" ON public.message_forwards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own forwards" ON public.message_forwards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own forwards" ON public.message_forwards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own forwards" ON public.message_forwards
  FOR DELETE USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE public.message_forwards IS 'Track message forwarding operations';
COMMENT ON COLUMN public.message_forwards.source_chat_id IS 'Source channel/group chat ID';
COMMENT ON COLUMN public.message_forwards.source_message_id IS 'Message ID to forward';
COMMENT ON COLUMN public.message_forwards.target_type IS 'Type of targets: channels, users, or groups';
COMMENT ON COLUMN public.message_forwards.target_ids IS 'Array of target chat IDs';
COMMENT ON COLUMN public.message_forwards.forward_results IS 'Array of forward results per target';