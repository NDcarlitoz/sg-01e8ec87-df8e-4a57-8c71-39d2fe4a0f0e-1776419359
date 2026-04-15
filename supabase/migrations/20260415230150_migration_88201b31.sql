-- Enhance bot_users table for complete user management

-- Add missing columns for user management
ALTER TABLE bot_users 
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP,
  ADD COLUMN IF NOT EXISTS total_messages INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_bot_users_user_id ON bot_users(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_users_username ON bot_users(username);
CREATE INDEX IF NOT EXISTS idx_bot_users_is_active ON bot_users(is_active);
CREATE INDEX IF NOT EXISTS idx_bot_users_created_at ON bot_users(created_at);
CREATE INDEX IF NOT EXISTS idx_bot_users_last_interaction ON bot_users(last_interaction);

-- Update RLS policies for bot_users
DROP POLICY IF EXISTS "Users can view own bot users" ON bot_users;
DROP POLICY IF EXISTS "Users can insert own bot users" ON bot_users;
DROP POLICY IF EXISTS "Users can update own bot users" ON bot_users;
DROP POLICY IF EXISTS "Users can delete own bot users" ON bot_users;

CREATE POLICY "Users can view own bot users" ON bot_users
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own bot users" ON bot_users
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own bot users" ON bot_users
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own bot users" ON bot_users
  FOR DELETE USING (auth.uid() = owner_id);

-- Create user_interactions table for activity tracking
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_user_id UUID REFERENCES bot_users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_interactions
CREATE POLICY "Users can view own user interactions" ON user_interactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bot_users 
      WHERE bot_users.id = user_interactions.bot_user_id 
      AND bot_users.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own user interactions" ON user_interactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bot_users 
      WHERE bot_users.id = user_interactions.bot_user_id 
      AND bot_users.owner_id = auth.uid()
    )
  );

-- Add indexes for user_interactions
CREATE INDEX IF NOT EXISTS idx_user_interactions_bot_user ON user_interactions(bot_user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_created ON user_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_interactions(interaction_type);