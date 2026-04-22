-- 8. ADD INDEXES ON UNINDEXED FOREIGN KEYS FOR PERFORMANCE
-- From the linter results, add indexes on foreign keys that don't have them

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_referral_id 
ON affiliate_commissions(referral_id);

CREATE INDEX IF NOT EXISTS idx_affiliates_program_id 
ON affiliates(program_id);

CREATE INDEX IF NOT EXISTS idx_banned_words_owner_id 
ON banned_words(owner_id);

CREATE INDEX IF NOT EXISTS idx_force_join_channels_owner_id 
ON force_join_channels(owner_id);

CREATE INDEX IF NOT EXISTS idx_group_moderation_settings_owner_id 
ON group_moderation_settings(owner_id);

CREATE INDEX IF NOT EXISTS idx_lead_activities_created_by 
ON lead_activities(created_by);

CREATE INDEX IF NOT EXISTS idx_lead_notes_created_by 
ON lead_notes(created_by);

CREATE INDEX IF NOT EXISTS idx_lead_tasks_created_by 
ON lead_tasks(created_by);