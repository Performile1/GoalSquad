-- 070_ad_daily_charges_idempotency.sql
-- Idempotency ledger for daily ad charging to prevent double-debiting
-- Fixes finding 3b.3: daily-charge route lacks idempotency

BEGIN;

-- Create table for tracking daily charges
CREATE TABLE IF NOT EXISTS public.ad_daily_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  charge_date DATE NOT NULL,
  amount_cents BIGINT NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint to prevent duplicate charges for same ad on same day
-- This is our database guard against double-charging
CREATE UNIQUE INDEX IF NOT EXISTS idx_ad_daily_charges_unique ON public.ad_daily_charges(ad_id, charge_date);

-- Index for querying pending charges
CREATE INDEX IF NOT EXISTS idx_ad_daily_charges_ad_id ON public.ad_daily_charges(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_daily_charges_charge_date ON public.ad_daily_charges(charge_date);

-- Add comment to document purpose
COMMENT ON TABLE public.ad_daily_charges IS 'Idempotency ledger for daily ad charges - prevents double-debiting via unique constraint on (ad_id, charge_date)';
COMMENT ON COLUMN public.ad_daily_charges.stripe_payment_intent_id IS 'Stripe payment intent ID - unique to track actual charge';

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ad_daily_charges_updated_at
  BEFORE UPDATE ON public.ad_daily_charges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;

-- Verification (run manually):
--   select column_name, data_type, is_nullable
--   from information_schema.columns
--   where table_schema='public' and table_name='ad_daily_charges'
--   order by ordinal_position;
-- Expected: id, ad_id, charge_date, amount_cents, stripe_payment_intent_id, created_at, updated_at
--
--   select indexname, indexdef
--   from pg_indexes
--   where tablename='ad_daily_charges' and schemaname='public';
-- Expected: idx_ad_daily_charges_unique (UNIQUE on ad_id, charge_date)
