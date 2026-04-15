-- ============================================
-- AFFILIATE TRACKING SYSTEM
-- ============================================

-- Affiliate programs (different commission structures)
CREATE TABLE IF NOT EXISTS public.affiliate_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  commission_type TEXT NOT NULL CHECK (commission_type IN ('percentage', 'fixed', 'tiered')),
  commission_value DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  min_payout_amount DECIMAL(10,2) DEFAULT 50.00,
  cookie_duration_days INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Affiliate users (users enrolled in affiliate program)
CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.affiliate_programs(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  total_referrals INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0.00,
  pending_payout DECIMAL(10,2) DEFAULT 0.00,
  lifetime_payouts DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral tracking (who referred who)
CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referred_user_id BIGINT NOT NULL,
  referred_username TEXT,
  referral_code TEXT NOT NULL,
  source TEXT, -- telegram, website, etc
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commission records
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES public.affiliate_referrals(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  description TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payout requests
CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT NOT NULL, -- paypal, bank_transfer, crypto, etc
  payment_details JSONB, -- account info, wallet address, etc
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- LEADS MANAGEMENT SYSTEM
-- ============================================

-- Lead sources (where leads come from)
CREATE TABLE IF NOT EXISTS public.lead_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead stages (sales pipeline)
CREATE TABLE IF NOT EXISTS public.lead_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  position INTEGER NOT NULL,
  color TEXT, -- for UI display
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_user_id BIGINT,
  telegram_username TEXT,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  source_id UUID REFERENCES public.lead_sources(id),
  stage_id UUID REFERENCES public.lead_stages(id),
  assigned_to UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  estimated_value DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  tags TEXT[],
  custom_fields JSONB,
  last_contact_at TIMESTAMP WITH TIME ZONE,
  next_followup_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead notes/activities
CREATE TABLE IF NOT EXISTS public.lead_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id),
  note_type TEXT DEFAULT 'note' CHECK (note_type IN ('note', 'call', 'email', 'meeting', 'task')),
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default affiliate program
INSERT INTO public.affiliate_programs (name, description, commission_type, commission_value, currency, min_payout_amount)
VALUES (
  'Standard Affiliate Program',
  'Earn 20% commission for every referral',
  'percentage',
  20.00,
  'USD',
  50.00
) ON CONFLICT DO NOTHING;

-- Insert default lead sources
INSERT INTO public.lead_sources (name, description) VALUES
  ('Telegram Bot', 'Leads from Telegram bot interactions'),
  ('Website Form', 'Contact form submissions'),
  ('Social Media', 'Facebook, Instagram, Twitter'),
  ('Referral', 'Word of mouth referrals'),
  ('Direct Message', 'Direct inquiries'),
  ('Advertisement', 'Paid ads campaigns')
ON CONFLICT (name) DO NOTHING;

-- Insert default lead stages
INSERT INTO public.lead_stages (name, description, position, color) VALUES
  ('New Lead', 'Freshly captured lead', 1, '#3b82f6'),
  ('Contacted', 'Initial contact made', 2, '#8b5cf6'),
  ('Qualified', 'Lead is qualified and interested', 3, '#10b981'),
  ('Proposal', 'Proposal sent to lead', 4, '#f59e0b'),
  ('Negotiation', 'In negotiation phase', 5, '#ef4444'),
  ('Won', 'Successfully converted to customer', 6, '#22c55e'),
  ('Lost', 'Lead did not convert', 7, '#6b7280')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_affiliates_user ON public.affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_code ON public.affiliates(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_affiliate ON public.affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.affiliate_referrals(status);
CREATE INDEX IF NOT EXISTS idx_commissions_affiliate ON public.affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS idx_payouts_affiliate ON public.affiliate_payouts(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.affiliate_payouts(status);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads(stage_id);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead ON public.lead_notes(lead_id);

-- Enable RLS
ALTER TABLE public.affiliate_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies (authenticated users can read/write)
CREATE POLICY "allow_all" ON public.affiliate_programs FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_all" ON public.affiliates FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_all" ON public.affiliate_referrals FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_all" ON public.affiliate_commissions FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_all" ON public.affiliate_payouts FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_all" ON public.lead_sources FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_all" ON public.lead_stages FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_all" ON public.leads FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_all" ON public.lead_notes FOR ALL USING (auth.uid() IS NOT NULL);

COMMENT ON TABLE public.affiliate_programs IS 'Affiliate program configurations';
COMMENT ON TABLE public.affiliates IS 'Users enrolled as affiliates';
COMMENT ON TABLE public.affiliate_referrals IS 'Track who referred who';
COMMENT ON TABLE public.affiliate_commissions IS 'Commission earnings records';
COMMENT ON TABLE public.affiliate_payouts IS 'Payout requests and history';
COMMENT ON TABLE public.lead_sources IS 'Sources where leads come from';
COMMENT ON TABLE public.lead_stages IS 'Sales pipeline stages';
COMMENT ON TABLE public.leads IS 'Lead/prospect contact information';
COMMENT ON TABLE public.lead_notes IS 'Notes and activities on leads';