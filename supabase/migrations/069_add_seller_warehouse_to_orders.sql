-- 069_add_seller_warehouse_to_orders.sql
-- Add seller_id and warehouse_id to orders so escrow can be triggered.
-- Previously, orders only had community_id, which meant the escrow logic
-- couldn't determine which seller/warehouse to hold funds for.

BEGIN;

-- Add seller_id (nullable for existing orders)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.seller_profiles(id) ON DELETE SET NULL;

-- Add warehouse_id (nullable for existing orders)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES public.warehouse_partners(id) ON DELETE SET NULL;

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON public.orders(seller_id) WHERE seller_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_warehouse_id ON public.orders(warehouse_id) WHERE warehouse_id IS NOT NULL;

-- Optional: add comment to document the purpose
COMMENT ON COLUMN public.orders.seller_id IS 'Links order to seller profile for escrow/commission purposes';
COMMENT ON COLUMN public.orders.warehouse_id IS 'Links order to warehouse partner for fulfillment/escrow purposes';

COMMIT;

-- Verification (run manually):
--   select column_name, data_type, is_nullable
--   from information_schema.columns
--   where table_schema='public' and table_name='orders'
--     and column_name in ('seller_id','warehouse_id')
--   order by column_name;
-- Expected: both columns present, nullable, with FKs.
