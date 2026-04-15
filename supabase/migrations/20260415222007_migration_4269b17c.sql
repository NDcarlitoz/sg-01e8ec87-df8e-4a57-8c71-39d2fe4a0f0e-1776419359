-- Enhance lead management system with complete tracking

-- Add lead assignment and metadata to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

-- Create lead activities table for timeline tracking
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'created', 'status_changed', 'stage_changed', 'note_added', 
    'email_sent', 'call_made', 'meeting_scheduled', 'task_created',
    'assigned', 'tag_added', 'tag_removed', 'contacted'
  )),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON lead_activities(created_at DESC);

-- Create lead tasks/reminders table
CREATE TABLE IF NOT EXISTS lead_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_tasks_lead_id ON lead_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_assigned_to ON lead_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_due_date ON lead_tasks(due_date);

-- Enhance lead_sources with tracking
ALTER TABLE lead_sources ADD COLUMN IF NOT EXISTS total_leads INTEGER DEFAULT 0;
ALTER TABLE lead_sources ADD COLUMN IF NOT EXISTS converted_leads INTEGER DEFAULT 0;
ALTER TABLE lead_sources ADD COLUMN IF NOT EXISTS conversion_rate DECIMAL(5,2) DEFAULT 0;

-- Create trigger to update source stats
CREATE OR REPLACE FUNCTION update_lead_source_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE lead_sources 
    SET total_leads = total_leads + 1,
        updated_at = NOW()
    WHERE id = NEW.source_id;
    
    IF NEW.status = 'won' THEN
      UPDATE lead_sources 
      SET converted_leads = converted_leads + 1,
          conversion_rate = (converted_leads::decimal / NULLIF(total_leads, 0)) * 100,
          updated_at = NOW()
      WHERE id = NEW.source_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'won' AND NEW.status = 'won' THEN
      UPDATE lead_sources 
      SET converted_leads = converted_leads + 1,
          conversion_rate = (converted_leads::decimal / NULLIF(total_leads, 0)) * 100,
          updated_at = NOW()
      WHERE id = NEW.source_id;
    ELSIF OLD.status = 'won' AND NEW.status != 'won' THEN
      UPDATE lead_sources 
      SET converted_leads = converted_leads - 1,
          conversion_rate = (converted_leads::decimal / NULLIF(total_leads, 0)) * 100,
          updated_at = NOW()
      WHERE id = NEW.source_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lead_source_stats_trigger ON leads;
CREATE TRIGGER lead_source_stats_trigger
AFTER INSERT OR UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION update_lead_source_stats();

-- Add RLS policies for new tables
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tasks ENABLE ROW LEVEL SECURITY;

-- Lead activities policies
CREATE POLICY "select_lead_activities" ON lead_activities FOR SELECT USING (true);
CREATE POLICY "insert_lead_activities" ON lead_activities FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "update_lead_activities" ON lead_activities FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "delete_lead_activities" ON lead_activities FOR DELETE USING (auth.uid() IS NOT NULL);

-- Lead tasks policies
CREATE POLICY "select_lead_tasks" ON lead_tasks FOR SELECT USING (true);
CREATE POLICY "insert_lead_tasks" ON lead_tasks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "update_lead_tasks" ON lead_tasks FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "delete_lead_tasks" ON lead_tasks FOR DELETE USING (auth.uid() IS NOT NULL);

-- Insert default lead sources if not exist
INSERT INTO lead_sources (name, description, is_active) VALUES
  ('Telegram Bot', 'Direct interaction with Telegram bot', true),
  ('Website Form', 'Contact form on website', true),
  ('Manual Entry', 'Manually added by team', true),
  ('Referral', 'Referred by existing customer', true),
  ('Social Media', 'From social media channels', true),
  ('Email Campaign', 'From email marketing', true),
  ('Advertisement', 'From paid advertising', true)
ON CONFLICT DO NOTHING;