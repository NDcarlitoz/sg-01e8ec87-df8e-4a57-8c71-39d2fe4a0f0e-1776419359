-- Create group_boost_settings table
CREATE TABLE IF NOT EXISTS public.group_boost_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.bot_groups(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  required_invites INTEGER DEFAULT 5 CHECK (required_invites >= 1 AND required_invites <= 30),
  welcome_message TEXT DEFAULT 'Welcome! To chat in this group, please invite {required} members first. Your progress: {current}/{required}',
  unlock_message TEXT DEFAULT '🎉 Congratulations! You can now chat freely in the group. Thank you for inviting {count} members!',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id)
);

-- Create user_invite_tracking table
CREATE TABLE IF NOT EXISTS public.user_invite_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.bot_groups(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL,
  username TEXT,
  invites_count INTEGER DEFAULT 0,
  is_unlocked BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_invite_tracking_lookup 
ON public.user_invite_tracking(group_id, user_id);

CREATE INDEX IF NOT EXISTS idx_user_invite_tracking_unlocked 
ON public.user_invite_tracking(group_id, is_unlocked);

-- Enable RLS
ALTER TABLE public.group_boost_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invite_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "public_read_boost_settings" ON public.group_boost_settings
  FOR SELECT USING (true);

CREATE POLICY "auth_manage_boost_settings" ON public.group_boost_settings
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "public_read_invite_tracking" ON public.user_invite_tracking
  FOR SELECT USING (true);

CREATE POLICY "auth_manage_invite_tracking" ON public.user_invite_tracking
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Comments
COMMENT ON TABLE public.group_boost_settings IS 'Group booster settings - require invites before chatting';
COMMENT ON TABLE public.user_invite_tracking IS 'Track user invite counts and unlock status';
COMMENT ON COLUMN public.group_boost_settings.required_invites IS 'Number of members user must invite (1-30)';
COMMENT ON COLUMN public.user_invite_tracking.invites_count IS 'Number of members this user has invited';
COMMENT ON COLUMN public.user_invite_tracking.is_unlocked IS 'Whether user can chat freely now';