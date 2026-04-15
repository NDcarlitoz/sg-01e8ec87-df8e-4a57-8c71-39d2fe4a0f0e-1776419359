-- Add pin_message column to broadcasts table
ALTER TABLE public.broadcasts
ADD COLUMN IF NOT EXISTS pin_message BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.broadcasts.pin_message IS 'Whether to pin the message after sending';

-- Add pin_status column to track pin results
ALTER TABLE public.broadcasts
ADD COLUMN IF NOT EXISTS pin_status JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.broadcasts.pin_status IS 'Array of pin results per target {target_id, pinned, error}';