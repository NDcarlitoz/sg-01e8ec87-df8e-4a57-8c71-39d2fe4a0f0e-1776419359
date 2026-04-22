-- Create client_errors table for logging frontend failures
CREATE TABLE IF NOT EXISTS client_errors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  session_id text NULL, -- For tracking anonymous users
  error_message text NOT NULL,
  error_stack text NULL,
  error_type text NOT NULL, -- 'react', 'javascript', 'promise_rejection', 'network', 'api'
  severity text NOT NULL DEFAULT 'error', -- 'error', 'warning', 'fatal'
  page_url text NOT NULL,
  page_path text NOT NULL, -- Pathname only
  user_agent text NULL,
  browser_info jsonb NULL, -- Browser name, version, OS, etc.
  component_stack text NULL, -- For React errors
  additional_data jsonb NULL, -- Custom metadata
  is_resolved boolean DEFAULT false,
  resolved_at timestamp with time zone NULL,
  resolved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  resolution_notes text NULL,
  occurrence_count integer DEFAULT 1, -- Track duplicate errors
  last_occurred_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT client_errors_error_type_check CHECK (error_type IN ('react', 'javascript', 'promise_rejection', 'network', 'api', 'custom')),
  CONSTRAINT client_errors_severity_check CHECK (severity IN ('warning', 'error', 'fatal'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_errors_user_id ON client_errors(user_id);
CREATE INDEX IF NOT EXISTS idx_client_errors_session_id ON client_errors(session_id);
CREATE INDEX IF NOT EXISTS idx_client_errors_error_type ON client_errors(error_type);
CREATE INDEX IF NOT EXISTS idx_client_errors_severity ON client_errors(severity);
CREATE INDEX IF NOT EXISTS idx_client_errors_created_at ON client_errors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_errors_is_resolved ON client_errors(is_resolved);
CREATE INDEX IF NOT EXISTS idx_client_errors_page_path ON client_errors(page_path);

-- Create deduplication index without the date cast
CREATE INDEX IF NOT EXISTS idx_client_errors_dedup ON client_errors(error_message, page_path, error_type);

-- Enable RLS
ALTER TABLE client_errors ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anonymous) to insert errors
DROP POLICY IF EXISTS "anyone_can_insert_errors" ON client_errors;
CREATE POLICY "anyone_can_insert_errors" ON client_errors
  FOR INSERT
  WITH CHECK (true);

-- Only authenticated users can view errors (admin check can be added later)
DROP POLICY IF EXISTS "auth_users_view_errors" ON client_errors;
CREATE POLICY "auth_users_view_errors" ON client_errors
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only authenticated users can update errors (for marking as resolved)
DROP POLICY IF EXISTS "auth_users_update_errors" ON client_errors;
CREATE POLICY "auth_users_update_errors" ON client_errors
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Add comment
COMMENT ON TABLE client_errors IS 'Client-side error logs from frontend applications';