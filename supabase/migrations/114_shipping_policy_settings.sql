-- Global shipping policy consumed by lib/shipping-calculator.ts.
-- Per-merchant and per-warehouse overrides live in their settings JSONB.
INSERT INTO public.platform_settings (key, value)
VALUES ('shipping_policy', '{"default_shipping_fee":49,"handling_fee":0,"distribution_fee":0,"free_shipping":{"threshold_sek":1000,"delivery_methods":[],"single_warehouse_only":false,"waive_handling":false}}'::jsonb)
ON CONFLICT (key) DO NOTHING;

GRANT ALL ON TABLE public.platform_settings TO service_role;
GRANT SELECT ON TABLE public.platform_settings TO authenticated;