-- Bot Menu Customization System Tables

-- Table for menu items/buttons
CREATE TABLE IF NOT EXISTS bot_menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Menu structure
  parent_id UUID REFERENCES bot_menu_items(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  icon TEXT, -- emoji or icon name
  
  -- Button configuration
  button_type TEXT NOT NULL, -- 'text', 'link', 'callback', 'submenu', 'command', 'page'
  action_type TEXT, -- 'show_text', 'open_url', 'run_command', 'show_page'
  action_value TEXT, -- URL, command, page_id, callback_data
  
  -- Behavior
  is_active BOOLEAN DEFAULT true,
  show_in_main_menu BOOLEAN DEFAULT true,
  requires_subscription BOOLEAN DEFAULT false,
  
  -- Metadata
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for custom bot pages
CREATE TABLE IF NOT EXISTS bot_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- Markdown supported
  page_type TEXT DEFAULT 'text', -- 'text', 'image', 'video', 'file', 'interactive'
  
  -- Media attachments
  image_url TEXT,
  video_url TEXT,
  file_url TEXT,
  
  -- Interactive elements
  buttons JSONB, -- Array of inline buttons
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  show_back_button BOOLEAN DEFAULT true,
  
  -- Metadata
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_parent ON bot_menu_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_position ON bot_menu_items(position);
CREATE INDEX IF NOT EXISTS idx_menu_items_active ON bot_menu_items(is_active);
CREATE INDEX IF NOT EXISTS idx_pages_active ON bot_pages(is_active);

-- RLS Policies (T2: Public read, authenticated write)
ALTER TABLE bot_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_menu_items" ON bot_menu_items FOR SELECT USING (true);
CREATE POLICY "auth_insert_menu_items" ON bot_menu_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_menu_items" ON bot_menu_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_menu_items" ON bot_menu_items FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "public_read_pages" ON bot_pages FOR SELECT USING (true);
CREATE POLICY "auth_insert_pages" ON bot_pages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_pages" ON bot_pages FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_pages" ON bot_pages FOR DELETE USING (auth.uid() IS NOT NULL);

-- Insert default menu structure
INSERT INTO bot_menu_items (title, description, button_type, action_type, position, icon, show_in_main_menu) VALUES
  ('🏠 Home', 'Main menu', 'command', 'run_command', 1, '🏠', true),
  ('ℹ️ About', 'About this bot', 'page', 'show_page', 2, 'ℹ️', true),
  ('❓ Help', 'Get help and support', 'page', 'show_page', 3, '❓', true),
  ('⚙️ Settings', 'Bot settings', 'submenu', null, 4, '⚙️', true)
ON CONFLICT DO NOTHING;

-- Insert default pages
INSERT INTO bot_pages (title, content, page_type, show_back_button) VALUES
  ('About', 'Welcome to our Telegram bot! 🤖

This bot helps you stay connected and get the latest updates.

**Features:**
• Real-time notifications
• Easy management
• Customizable settings

Need help? Use /help command!', 'text', true),
  
  ('Help', '**Available Commands:**

/start - Start the bot
/help - Show this help message
/settings - Configure your preferences
/about - Learn more about the bot

**Need Support?**
Contact us at support@example.com', 'text', true)
ON CONFLICT DO NOTHING;