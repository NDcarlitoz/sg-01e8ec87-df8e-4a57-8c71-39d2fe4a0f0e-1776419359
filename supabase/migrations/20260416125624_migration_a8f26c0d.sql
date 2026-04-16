-- Add welcome_message column to bot_tokens table
ALTER TABLE bot_tokens 
ADD COLUMN IF NOT EXISTS welcome_message TEXT DEFAULT 'Welcome {name}! 👋

I''m your Telegram automation assistant.

Available commands:
/start - Show this welcome message
/help - Get help and support
/menu - Show main menu

Feel free to explore!';

-- Add updated_at trigger if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_bot_tokens_updated_at ON bot_tokens;
CREATE TRIGGER update_bot_tokens_updated_at
    BEFORE UPDATE ON bot_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();