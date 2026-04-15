-- Create auto_reply_rules table
CREATE TABLE IF NOT EXISTS public.auto_reply_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('keyword', 'regex', 'command', 'exact')),
  trigger_value TEXT NOT NULL,
  response_type TEXT NOT NULL DEFAULT 'text' CHECK (response_type IN ('text', 'photo', 'document')),
  response_message TEXT,
  response_media_url TEXT,
  response_caption TEXT,
  response_buttons JSONB,
  match_case_sensitive BOOLEAN DEFAULT false,
  match_whole_word BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  delay_seconds INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.auto_reply_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own auto-reply rules"
  ON public.auto_reply_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create auto-reply rules"
  ON public.auto_reply_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own auto-reply rules"
  ON public.auto_reply_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own auto-reply rules"
  ON public.auto_reply_rules FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_auto_reply_rules_user_id ON public.auto_reply_rules(user_id);
CREATE INDEX idx_auto_reply_rules_is_active ON public.auto_reply_rules(is_active);
CREATE INDEX idx_auto_reply_rules_trigger_type ON public.auto_reply_rules(trigger_type);
CREATE INDEX idx_auto_reply_rules_priority ON public.auto_reply_rules(priority DESC);

-- Add comments
COMMENT ON TABLE public.auto_reply_rules IS 'Auto-reply rules for bot automation';
COMMENT ON COLUMN public.auto_reply_rules.trigger_type IS 'Type of trigger: keyword, regex, command, exact';
COMMENT ON COLUMN public.auto_reply_rules.trigger_value IS 'The trigger text/pattern to match';
COMMENT ON COLUMN public.auto_reply_rules.priority IS 'Higher priority rules are checked first';
COMMENT ON COLUMN public.auto_reply_rules.delay_seconds IS 'Delay before sending auto-reply';