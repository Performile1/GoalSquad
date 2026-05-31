-- 067_rls_policies_for_frontend_tables.sql
-- RLS policies for tables that are accessed directly from the frontend
-- (not via service-role API routes). The other 32 tables with RLS but no
-- policies are service-role-only and correctly deny-all for direct access.

BEGIN;

-- 1) return_reasons — public read (active reasons only), no insert/update
ALTER TABLE public.return_reasons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "return_reasons_public_read" ON public.return_reasons;
CREATE POLICY "return_reasons_public_read" ON public.return_reasons
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- 2) returns — authenticated users can read their own returns (by order owner),
--    and warehouse/merchant/seller can read returns they manage.
--    Updates allowed for status changes by authorized roles.
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

-- Consumers can read returns for their own orders
DROP POLICY IF EXISTS "returns_read_own_order" ON public.returns;
CREATE POLICY "returns_read_own_order" ON public.returns
  FOR SELECT
  TO authenticated
  USING (
    exists (
      select 1 from public.orders
      where orders.id = returns.order_id
        and orders.user_id = auth.uid()
    )
  );

-- Warehouses can read returns for orders assigned to them
DROP POLICY IF EXISTS "returns_read_warehouse" ON public.returns;
CREATE POLICY "returns_read_warehouse" ON public.returns
  FOR SELECT
  TO authenticated
  USING (
    exists (
      select 1 from public.orders
      where orders.id = returns.order_id
        and orders.warehouse_id in (
          select id from public.warehouse_partners where user_id = auth.uid()
        )
    )
  );

-- Merchants can read returns for their orders (via order_items -> products -> merchant_id)
DROP POLICY IF EXISTS "returns_read_merchant" ON public.returns;
CREATE POLICY "returns_read_merchant" ON public.returns
  FOR SELECT
  TO authenticated
  USING (
    exists (
      select 1 from public.order_items
      join public.products on products.id = order_items.product_id
      where order_items.order_id = returns.order_id
        and products.merchant_id in (
          select id from public.merchants where user_id = auth.uid()
        )
    )
  );

-- Sellers can read returns for orders from their community
DROP POLICY IF EXISTS "returns_read_seller" ON public.returns;
CREATE POLICY "returns_read_seller" ON public.returns
  FOR SELECT
  TO authenticated
  USING (
    exists (
      select 1 from public.orders
      where orders.id = returns.order_id
        and orders.community_id in (
          select id from public.communities where owner_id = auth.uid()
        )
    )
  );

-- Service role full access
DROP POLICY IF EXISTS "returns_service_role_all" ON public.returns;
CREATE POLICY "returns_service_role_all" ON public.returns
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- 3) return_items — authenticated users can update items on returns they manage
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;

-- Warehouses can update return items (via orders.warehouse_id)
DROP POLICY IF EXISTS "return_items_update_warehouse" ON public.return_items;
CREATE POLICY "return_items_update_warehouse" ON public.return_items
  FOR UPDATE
  TO authenticated
  USING (
    exists (
      select 1 from public.returns
      join public.orders on orders.id = returns.order_id
      where returns.id = return_items.return_id
        and orders.warehouse_id in (
          select id from public.warehouse_partners where user_id = auth.uid()
        )
    )
  );

-- Service role full access
DROP POLICY IF EXISTS "return_items_service_role_all" ON public.return_items;
CREATE POLICY "return_items_service_role_all" ON public.return_items
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

COMMIT;

-- Verification (run manually):
--   select c.relname, p.polname, case when p.polroles = '{0}'::oid[] then 'PUBLIC'
--        else array_to_string(array(select rolname from pg_roles where oid = any(p.polroles)),', ') end as roles
--   from pg_policy p join pg_class c on c.oid=p.polrelid
--   join pg_namespace n on n.oid=c.relnamespace and n.nspname='public'
--   where c.relname in ('return_reasons','returns','return_items')
--   order by c.relname, p.polname;
