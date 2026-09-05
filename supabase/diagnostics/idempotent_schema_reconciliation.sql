-- GoalSquad idempotent production reconciliation
-- Run manually in the Supabase SQL Editor with a privileged role.
-- This is a read-first repair helper, not a replacement for supabase/migrations/.
-- It never drops tables, policies, columns, or data.

BEGIN;

-- -------------------------------------------------------------------------
-- 1. READ FIRST: capture the state before any repair.
-- -------------------------------------------------------------------------
WITH expected_tables(name) AS (
  VALUES
    ('profiles'), ('notifications'), ('products'), ('product_categories'),
    ('community_products'), ('orders'), ('order_items'), ('communities'),
    ('merchants'), ('seller_profiles'), ('warehouse_partners'), ('warehouse_staff'),
    ('campaigns'), ('seo_settings'), ('platform_settings'),
    ('customer_payment_methods'), ('product_reviews'), ('referrals'),
    ('conversations'), ('conversation_participants'), ('messages')
), expected_columns(table_name, column_name) AS (
  VALUES
    ('merchants', 'settings'), ('seller_profiles', 'metadata'),
    ('warehouse_partners', 'settings'), ('orders', 'payment_status'),
    ('orders', 'stripe_payment_intent_id'),
    ('order_items', 'origin_warehouse_partner_id'),
    ('order_items', 'destination_warehouse_id'),
    ('order_items', 'fulfillment_route_status')
)
SELECT 'table' AS object_type, name AS object_name,
       CASE WHEN to_regclass('public.' || name) IS NULL THEN 'MISSING' ELSE 'OK' END AS status,
       NULL::text AS detail
FROM expected_tables
UNION ALL
SELECT 'column', e.table_name || '.' || e.column_name,
       CASE WHEN c.column_name IS NULL THEN 'MISSING' ELSE 'OK' END,
       NULL::text
FROM expected_columns e
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public' AND c.table_name = e.table_name AND c.column_name = e.column_name
ORDER BY object_type, object_name;

-- -------------------------------------------------------------------------
-- 2. SAFE, IDEMPOTENT REPAIR
-- -------------------------------------------------------------------------

-- Global settings are a known, stable contract used by the shipping engine.
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- These policies are intentionally service-role-only. Admin API routes use
-- service_role after requireAdmin(), so this does not reintroduce metadata RBAC.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'platform_settings'
      AND policyname = 'goalsquad_platform_settings_service_role'
  ) THEN
    CREATE POLICY goalsquad_platform_settings_service_role
      ON public.platform_settings FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;
END $$;

INSERT INTO public.platform_settings (key, value)
VALUES (
  'shipping_policy',
  '{"default_shipping_fee":49,"handling_fee":0,"distribution_fee":0,"free_shipping":{"threshold_sek":1000,"delivery_methods":[],"single_warehouse_only":false,"waive_handling":false}}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- Profile-owned JSON settings used by current merchant/seller/warehouse APIs.
DO $$
BEGIN
  IF to_regclass('public.merchants') IS NOT NULL THEN
    ALTER TABLE public.merchants
      ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;
  IF to_regclass('public.seller_profiles') IS NOT NULL THEN
    ALTER TABLE public.seller_profiles
      ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;
  IF to_regclass('public.warehouse_partners') IS NOT NULL THEN
    ALTER TABLE public.warehouse_partners
      ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Order fulfillment columns are added only when their owning table exists.
DO $$
BEGIN
  IF to_regclass('public.order_items') IS NOT NULL THEN
    ALTER TABLE public.order_items
      ADD COLUMN IF NOT EXISTS origin_warehouse_partner_id UUID,
      ADD COLUMN IF NOT EXISTS destination_warehouse_id UUID,
      ADD COLUMN IF NOT EXISTS fulfillment_route_status TEXT;
  END IF;
END $$;

-- Warehouse staff is safe to create only after warehouse_partners exists.
DO $$
BEGIN
  IF to_regclass('public.warehouse_partners') IS NOT NULL THEN
    CREATE TABLE IF NOT EXISTS public.warehouse_staff (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      warehouse_id UUID NOT NULL REFERENCES public.warehouse_partners(id) ON DELETE CASCADE,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      staff_role VARCHAR(50) NOT NULL DEFAULT 'picker'
        CHECK (staff_role IN ('picker', 'supervisor', 'warehouse_admin', 'driver')),
      pin_code VARCHAR(10),
      is_active BOOLEAN NOT NULL DEFAULT true,
      user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_goalsquad_warehouse_staff_warehouse
      ON public.warehouse_staff(warehouse_id);
    ALTER TABLE public.warehouse_staff ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Restore ACLs only for tables that exist. RLS remains the authorization layer.
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'profiles', 'notifications', 'products', 'product_categories',
    'community_products', 'orders', 'order_items', 'communities',
    'merchants', 'seller_profiles', 'warehouse_partners', 'warehouse_staff',
    'campaigns', 'seo_settings', 'platform_settings',
    'customer_payment_methods', 'product_reviews', 'referrals',
    'conversations', 'conversation_participants', 'messages'
  ] LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', table_name);
      EXECUTE format('GRANT SELECT ON TABLE public.%I TO authenticated', table_name);
    END IF;
  END LOOP;
  GRANT USAGE ON SCHEMA public TO authenticated, service_role;
END $$;

-- -------------------------------------------------------------------------
-- 3. READ AFTER: verify what is now present and what still requires a real
-- migration or production-specific investigation.
-- -------------------------------------------------------------------------
WITH expected_tables(name) AS (
  VALUES
    ('profiles'), ('notifications'), ('products'), ('product_categories'),
    ('community_products'), ('orders'), ('order_items'), ('communities'),
    ('merchants'), ('seller_profiles'), ('warehouse_partners'), ('warehouse_staff'),
    ('campaigns'), ('seo_settings'), ('platform_settings'),
    ('customer_payment_methods'), ('product_reviews'), ('referrals'),
    ('conversations'), ('conversation_participants'), ('messages')
), expected_columns(table_name, column_name) AS (
  VALUES
    ('merchants', 'settings'), ('seller_profiles', 'metadata'),
    ('warehouse_partners', 'settings'), ('orders', 'payment_status'),
    ('orders', 'stripe_payment_intent_id'),
    ('order_items', 'origin_warehouse_partner_id'),
    ('order_items', 'destination_warehouse_id'),
    ('order_items', 'fulfillment_route_status')
)
SELECT 'table' AS object_type, name AS object_name,
       CASE WHEN to_regclass('public.' || name) IS NULL THEN 'MISSING' ELSE 'OK' END AS status,
       CASE WHEN to_regclass('public.' || name) IS NULL
            THEN 'Apply the owning migration; this helper did not guess the table schema.'
            ELSE NULL END AS detail
FROM expected_tables
UNION ALL
SELECT 'column', e.table_name || '.' || e.column_name,
       CASE WHEN c.column_name IS NULL THEN 'MISSING' ELSE 'OK' END,
       CASE WHEN c.column_name IS NULL THEN 'Apply the owning migration or inspect schema drift.' ELSE NULL END
FROM expected_columns e
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public' AND c.table_name = e.table_name AND c.column_name = e.column_name
ORDER BY object_type, object_name;

SELECT c.relname AS table_name,
       c.relrowsecurity AS rls_enabled,
       COUNT(p.policyname)::integer AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policies p ON p.schemaname = n.nspname AND p.tablename = c.relname
WHERE n.nspname = 'public'
  AND c.relname IN (
    'profiles', 'notifications', 'products', 'orders', 'order_items',
    'merchants', 'seller_profiles', 'warehouse_partners', 'warehouse_staff',
    'campaigns', 'seo_settings', 'platform_settings'
  )
GROUP BY c.relname, c.relrowsecurity
ORDER BY c.relname;

COMMIT;
