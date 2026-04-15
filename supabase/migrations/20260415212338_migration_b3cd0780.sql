-- Add multi-currency support to affiliate system

-- Update affiliate_programs table to have better currency support
ALTER TABLE public.affiliate_programs 
  DROP CONSTRAINT IF EXISTS affiliate_programs_currency_check;

ALTER TABLE public.affiliate_programs 
  ADD CONSTRAINT affiliate_programs_currency_check 
  CHECK (currency IN (
    'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'CHF', 'HKD', 'SGD',
    'MYR', 'IDR', 'THB', 'VND', 'PHP', 'INR', 'KRW', 'BRL', 'MXN', 'AED',
    'SAR', 'ZAR', 'RUB', 'TRY', 'PLN', 'SEK', 'NOK', 'DKK', 'NZD', 'TWD'
  ));

COMMENT ON COLUMN public.affiliate_programs.currency IS 'Program currency (USD, EUR, GBP, MYR, SGD, IDR, THB, etc.)';

-- Add currency preference to affiliates table
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS preferred_currency TEXT DEFAULT 'USD';

ALTER TABLE public.affiliates 
  DROP CONSTRAINT IF EXISTS affiliates_preferred_currency_check;

ALTER TABLE public.affiliates 
  ADD CONSTRAINT affiliates_preferred_currency_check 
  CHECK (preferred_currency IN (
    'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'CHF', 'HKD', 'SGD',
    'MYR', 'IDR', 'THB', 'VND', 'PHP', 'INR', 'KRW', 'BRL', 'MXN', 'AED',
    'SAR', 'ZAR', 'RUB', 'TRY', 'PLN', 'SEK', 'NOK', 'DKK', 'NZD', 'TWD'
  ));

COMMENT ON COLUMN public.affiliates.preferred_currency IS 'Preferred payout currency for this affiliate';

-- Update affiliate_commissions currency constraint
ALTER TABLE public.affiliate_commissions 
  DROP CONSTRAINT IF EXISTS affiliate_commissions_currency_check;

ALTER TABLE public.affiliate_commissions 
  ADD CONSTRAINT affiliate_commissions_currency_check 
  CHECK (currency IN (
    'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'CHF', 'HKD', 'SGD',
    'MYR', 'IDR', 'THB', 'VND', 'PHP', 'INR', 'KRW', 'BRL', 'MXN', 'AED',
    'SAR', 'ZAR', 'RUB', 'TRY', 'PLN', 'SEK', 'NOK', 'DKK', 'NZD', 'TWD'
  ));

-- Update affiliate_payouts currency constraint
ALTER TABLE public.affiliate_payouts 
  DROP CONSTRAINT IF EXISTS affiliate_payouts_currency_check;

ALTER TABLE public.affiliate_payouts 
  ADD CONSTRAINT affiliate_payouts_currency_check 
  CHECK (currency IN (
    'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'CHF', 'HKD', 'SGD',
    'MYR', 'IDR', 'THB', 'VND', 'PHP', 'INR', 'KRW', 'BRL', 'MXN', 'AED',
    'SAR', 'ZAR', 'RUB', 'TRY', 'PLN', 'SEK', 'NOK', 'DKK', 'NZD', 'TWD'
  ));

-- Create currency exchange rates table (for future conversion feature)
CREATE TABLE IF NOT EXISTS public.currency_exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate DECIMAL(12, 6) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_currency, to_currency)
);

COMMENT ON TABLE public.currency_exchange_rates IS 'Currency exchange rates for conversion';

-- Insert some common exchange rates (example data - should be updated via API)
INSERT INTO public.currency_exchange_rates (from_currency, to_currency, rate) VALUES
  ('USD', 'USD', 1.000000),
  ('USD', 'EUR', 0.920000),
  ('USD', 'GBP', 0.790000),
  ('USD', 'MYR', 4.700000),
  ('USD', 'SGD', 1.340000),
  ('USD', 'IDR', 15800.000000),
  ('USD', 'THB', 35.500000),
  ('USD', 'PHP', 56.000000),
  ('USD', 'VND', 24500.000000),
  ('USD', 'INR', 83.000000),
  ('EUR', 'USD', 1.087000),
  ('GBP', 'USD', 1.266000),
  ('MYR', 'USD', 0.213000),
  ('SGD', 'USD', 0.746000),
  ('IDR', 'USD', 0.000063),
  ('THB', 'USD', 0.028000),
  ('PHP', 'USD', 0.018000),
  ('VND', 'USD', 0.000041),
  ('INR', 'USD', 0.012000)
ON CONFLICT (from_currency, to_currency) DO UPDATE SET
  rate = EXCLUDED.rate,
  updated_at = NOW();