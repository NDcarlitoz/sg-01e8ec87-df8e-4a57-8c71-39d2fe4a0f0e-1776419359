-- Remove the duplicate indexes identified by the linter
-- Both bot_groups_chat_id_idx and bot_groups_chat_id_key are identical (both on chat_id)
-- Keep the UNIQUE constraint (bot_groups_chat_id_key) and remove the index
DROP INDEX IF EXISTS bot_groups_chat_id_idx;

-- Both bot_groups_owner_id_idx exists but we need to verify if it's truly duplicate
-- Let's check the actual index definitions
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'bot_groups' 
  AND schemaname = 'public'
  AND indexname LIKE '%owner%';