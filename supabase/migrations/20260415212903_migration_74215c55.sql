-- Create affiliate system settings table
CREATE TABLE IF NOT EXISTS public.affiliate_system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enabled BOOLEAN DEFAULT false,
  auto_approve_referrals BOOLEAN DEFAULT false,
  auto_approve_payouts BOOLEAN DEFAULT false,
  minimum_payout_amount DECIMAL(10,2) DEFAULT 50.00,
  default_currency TEXT DEFAULT 'USD',
  terms_and_conditions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.affiliate_system_settings (enabled) 
VALUES (false)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.affiliate_system_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read affiliate settings"
  ON public.affiliate_system_settings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can update affiliate settings"
  ON public.affiliate_system_settings FOR UPDATE
  USING (auth.uid() IS NOT NULL);

COMMENT ON TABLE public.affiliate_system_settings IS 'Global affiliate system configuration';