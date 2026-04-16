-- Create RLS policy that allows reading bot tokens for webhook setup
-- This allows API routes to read bot tokens without authentication
CREATE POLICY "allow_webhook_bot_lookup" ON bot_tokens
FOR SELECT
USING (true);