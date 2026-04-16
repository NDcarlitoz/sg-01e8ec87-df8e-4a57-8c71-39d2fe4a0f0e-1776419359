-- Create livegram forwarding rules table
CREATE TABLE IF NOT EXISTS livegram_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  source_chat_id BIGINT NOT NULL,
  source_chat_title TEXT,
  source_chat_type TEXT, -- 'group', 'channel', 'supergroup'
  is_active BOOLEAN DEFAULT true,
  
  -- Filter settings
  filter_keywords JSONB, -- Array of keywords to match
  filter_user_types JSONB, -- ['all', 'admin', 'member', 'premium']
  filter_message_types JSONB, -- ['text', 'photo', 'video', 'document', 'audio', 'voice']
  exclude_keywords JSONB, -- Keywords to exclude
  
  -- Forward settings
  destinations JSONB NOT NULL, -- Array of {chat_id, chat_title, chat_type}
  forward_mode TEXT DEFAULT 'copy', -- 'copy', 'forward', 'quote'
  remove_caption BOOLEAN DEFAULT false,
  add_watermark BOOLEAN DEFAULT false,
  watermark_text TEXT,
  delay_seconds INTEGER DEFAULT 0,
  
  -- Advanced settings
  edit_message BOOLEAN DEFAULT false,
  message_template TEXT, -- Template for edited messages
  send_as_admin BOOLEAN DEFAULT false,
  preserve_formatting BOOLEAN DEFAULT true,
  
  -- Stats
  total_forwarded INTEGER DEFAULT 0,
  last_forwarded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_livegram_rules_owner ON livegram_rules(owner_id);
CREATE INDEX idx_livegram_rules_source ON livegram_rules(source_chat_id);
CREATE INDEX idx_livegram_rules_active ON livegram_rules(is_active);

-- RLS policies
ALTER TABLE livegram_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own livegram rules"
  ON livegram_rules FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create own livegram rules"
  ON livegram_rules FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own livegram rules"
  ON livegram_rules FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own livegram rules"
  ON livegram_rules FOR DELETE
  USING (auth.uid() = owner_id);

-- Create livegram logs table for tracking
CREATE TABLE IF NOT EXISTS livegram_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID REFERENCES livegram_rules(id) ON DELETE CASCADE,
  source_chat_id BIGINT NOT NULL,
  source_message_id INTEGER NOT NULL,
  destination_chat_id BIGINT NOT NULL,
  destination_message_id INTEGER,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  error_message TEXT,
  forwarded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_livegram_logs_rule ON livegram_logs(rule_id);
CREATE INDEX idx_livegram_logs_status ON livegram_logs(status);

-- RLS for logs (public read for debugging)
ALTER TABLE livegram_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view livegram logs"
  ON livegram_logs FOR SELECT
  USING (true);

CREATE POLICY "System can insert livegram logs"
  ON livegram_logs FOR INSERT
  WITH CHECK (true);