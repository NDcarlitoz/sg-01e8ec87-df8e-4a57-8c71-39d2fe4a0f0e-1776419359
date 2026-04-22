-- Remove duplicate policies on bot_users table
-- Keep the ones with underscores in table name (more consistent with schema)
DROP POLICY IF EXISTS "Users can delete own bot users" ON bot_users;
DROP POLICY IF EXISTS "Users can insert own bot users" ON bot_users;
DROP POLICY IF EXISTS "Users can update own bot users" ON bot_users;
DROP POLICY IF EXISTS "Users can view own bot users" ON bot_users;

-- The remaining policies are:
-- "Users can delete own bot_users"
-- "Users can insert own bot_users"
-- "Users can update own bot_users"
-- "Users can view own bot_users"
-- These are the correct ones and should remain