-- Add buttons column to broadcasts table
ALTER TABLE public.broadcasts
ADD COLUMN IF NOT EXISTS buttons JSONB;

-- Add buttons column to broadcast_templates table
ALTER TABLE public.broadcast_templates
ADD COLUMN IF NOT EXISTS buttons JSONB;

COMMENT ON COLUMN public.broadcasts.buttons IS 'Array of button rows with text and url/callback_data';
COMMENT ON COLUMN public.broadcast_templates.buttons IS 'Array of button rows with text and url/callback_data';