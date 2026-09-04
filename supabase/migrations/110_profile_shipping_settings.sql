-- Profile-owned shipping configuration. Secrets remain outside the database.
ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.seller_profiles
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.warehouse_partners
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.merchants.settings IS 'Merchant shipping, carrier and return preferences; no secrets.';
COMMENT ON COLUMN public.seller_profiles.metadata IS 'Seller delivery and payout preferences; no secrets.';
COMMENT ON COLUMN public.warehouse_partners.settings IS 'Warehouse carrier, rate card and capacity preferences; no secrets.';

GRANT ALL ON TABLE public.merchants, public.seller_profiles, public.warehouse_partners TO service_role;
GRANT SELECT ON TABLE public.merchants, public.seller_profiles, public.warehouse_partners TO authenticated;
