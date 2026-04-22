-- 1. CRITICAL FIX: Enable RLS on currency_exchange_rates
ALTER TABLE currency_exchange_rates ENABLE ROW LEVEL SECURITY;

-- Add appropriate policies (read-only public access since this is reference data)
CREATE POLICY "public_read_rates" ON currency_exchange_rates 
  FOR SELECT USING (true);

-- Only authenticated users can manage rates (if needed)
CREATE POLICY "auth_manage_rates" ON currency_exchange_rates 
  FOR ALL 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);