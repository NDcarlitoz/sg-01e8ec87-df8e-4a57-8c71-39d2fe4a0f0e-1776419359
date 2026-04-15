-- Create group_moderation_settings table
CREATE TABLE IF NOT EXISTS public.group_moderation_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.bot_groups(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Auto-action settings
  auto_delete_enabled BOOLEAN DEFAULT false,
  auto_kick_enabled BOOLEAN DEFAULT false,
  auto_ban_enabled BOOLEAN DEFAULT false,
  
  -- Violation thresholds
  kick_after_violations INTEGER DEFAULT 3,
  ban_after_violations INTEGER DEFAULT 5,
  violation_reset_hours INTEGER DEFAULT 24,
  
  -- Message filters
  filter_links BOOLEAN DEFAULT false,
  filter_mentions BOOLEAN DEFAULT false,
  filter_forwards BOOLEAN DEFAULT false,
  filter_media BOOLEAN DEFAULT false,
  
  -- New member restrictions
  restrict_new_members BOOLEAN DEFAULT false,
  new_member_mute_duration INTEGER DEFAULT 0, -- minutes
  delete_join_messages BOOLEAN DEFAULT false,
  
  -- Force join settings
  force_join_enabled BOOLEAN DEFAULT false,
  force_join_message TEXT,
  kick_non_members BOOLEAN DEFAULT false,
  
  -- Spam protection
  max_messages_per_minute INTEGER DEFAULT 10,
  delete_spam_messages BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(group_id)
);

-- Create banned_words table
CREATE TABLE IF NOT EXISTS public.banned_words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.bot_groups(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  word TEXT NOT NULL,
  is_regex BOOLEAN DEFAULT false,
  case_sensitive BOOLEAN DEFAULT false,
  action TEXT NOT NULL DEFAULT 'delete', -- delete, warn, kick, ban
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create moderation_logs table
CREATE TABLE IF NOT EXISTS public.moderation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.bot_groups(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL,
  username TEXT,
  
  action TEXT NOT NULL, -- delete, warn, kick, ban
  reason TEXT NOT NULL,
  triggered_by TEXT, -- banned_word, spam, link, etc
  message_text TEXT,
  
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create force_join_channels table
CREATE TABLE IF NOT EXISTS public.force_join_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.bot_groups(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(group_id, channel_id)
);

-- Create user_violations table to track offenses
CREATE TABLE IF NOT EXISTS public.user_violations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.bot_groups(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL,
  
  violation_count INTEGER DEFAULT 1,
  last_violation_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reset_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(group_id, user_id)
);

-- Enable RLS
ALTER TABLE public.group_moderation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.force_join_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_violations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_moderation_settings
CREATE POLICY "Users can view own moderation settings"
  ON public.group_moderation_settings FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own moderation settings"
  ON public.group_moderation_settings FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own moderation settings"
  ON public.group_moderation_settings FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own moderation settings"
  ON public.group_moderation_settings FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for banned_words
CREATE POLICY "Users can view own banned words"
  ON public.banned_words FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own banned words"
  ON public.banned_words FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own banned words"
  ON public.banned_words FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for moderation_logs
CREATE POLICY "Users can view own moderation logs"
  ON public.moderation_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bot_groups
      WHERE bot_groups.id = moderation_logs.group_id
      AND bot_groups.owner_id = auth.uid()
    )
  );

CREATE POLICY "System can insert moderation logs"
  ON public.moderation_logs FOR INSERT
  WITH CHECK (true);

-- RLS Policies for force_join_channels
CREATE POLICY "Users can view own force join channels"
  ON public.force_join_channels FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own force join channels"
  ON public.force_join_channels FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own force join channels"
  ON public.force_join_channels FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for user_violations
CREATE POLICY "Users can view own user violations"
  ON public.user_violations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bot_groups
      WHERE bot_groups.id = user_violations.group_id
      AND bot_groups.owner_id = auth.uid()
    )
  );

CREATE POLICY "System can manage user violations"
  ON public.user_violations FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_moderation_settings_group ON public.group_moderation_settings(group_id);
CREATE INDEX idx_banned_words_group ON public.banned_words(group_id);
CREATE INDEX idx_moderation_logs_group ON public.moderation_logs(group_id);
CREATE INDEX idx_moderation_logs_performed_at ON public.moderation_logs(performed_at DESC);
CREATE INDEX idx_force_join_channels_group ON public.force_join_channels(group_id);
CREATE INDEX idx_user_violations_group_user ON public.user_violations(group_id, user_id);

-- Comments
COMMENT ON TABLE public.group_moderation_settings IS 'Per-group moderation configuration';
COMMENT ON TABLE public.banned_words IS 'Banned words/phrases per group';
COMMENT ON TABLE public.moderation_logs IS 'Log of all moderation actions taken';
COMMENT ON TABLE public.force_join_channels IS 'Channels users must join before participating';
COMMENT ON TABLE public.user_violations IS 'Track user violations for escalating actions';