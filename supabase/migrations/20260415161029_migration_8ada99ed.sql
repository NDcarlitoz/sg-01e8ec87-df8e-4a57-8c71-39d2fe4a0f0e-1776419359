-- Create users table to track bot users
CREATE TABLE IF NOT EXISTS public.bot_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL UNIQUE,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  is_bot BOOLEAN DEFAULT false,
  language_code TEXT,
  is_active BOOLEAN DEFAULT true,
  last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create groups table to track bot groups
CREATE TABLE IF NOT EXISTS public.bot_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id BIGINT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'group' or 'supergroup'
  username TEXT,
  member_count INTEGER,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.bot_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bot_users
CREATE POLICY "Users can view own bot_users" ON public.bot_users
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own bot_users" ON public.bot_users
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own bot_users" ON public.bot_users
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own bot_users" ON public.bot_users
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for bot_groups
CREATE POLICY "Users can view own bot_groups" ON public.bot_groups
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own bot_groups" ON public.bot_groups
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own bot_groups" ON public.bot_groups
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own bot_groups" ON public.bot_groups
  FOR DELETE USING (auth.uid() = owner_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS bot_users_owner_id_idx ON public.bot_users(owner_id);
CREATE INDEX IF NOT EXISTS bot_users_user_id_idx ON public.bot_users(user_id);
CREATE INDEX IF NOT EXISTS bot_users_is_active_idx ON public.bot_users(is_active);
CREATE INDEX IF NOT EXISTS bot_groups_owner_id_idx ON public.bot_groups(owner_id);
CREATE INDEX IF NOT EXISTS bot_groups_chat_id_idx ON public.bot_groups(chat_id);
CREATE INDEX IF NOT EXISTS bot_groups_is_active_idx ON public.bot_groups(is_active);

-- Add comments
COMMENT ON TABLE public.bot_users IS 'Stores users who have interacted with the bot';
COMMENT ON TABLE public.bot_groups IS 'Stores groups/supergroups where the bot is a member';
COMMENT ON COLUMN public.bot_users.user_id IS 'Telegram user ID';
COMMENT ON COLUMN public.bot_groups.chat_id IS 'Telegram chat ID (negative for groups)';