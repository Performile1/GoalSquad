-- Fix RLS policies for build-time data fetching
-- Public builds must not rely on blanket anon reads against sensitive base tables.
-- Prefer service-role API routes or dedicated safe public views for any truly public data.

ALTER TABLE ad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ad_placements' AND policyname = 'ad_placements_service_role_all'
  ) THEN
    CREATE POLICY "ad_placements_service_role_all"
      ON ad_placements FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'communities' AND policyname = 'communities_service_role_all'
  ) THEN
    CREATE POLICY "communities_service_role_all"
      ON communities FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'merchants' AND policyname = 'merchants_service_role_all'
  ) THEN
    CREATE POLICY "merchants_service_role_all"
      ON merchants FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'warehouse_inventory' AND policyname = 'warehouse_inventory_service_role_all'
  ) THEN
    CREATE POLICY "warehouse_inventory_service_role_all"
      ON warehouse_inventory FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'products_service_role_all'
  ) THEN
    CREATE POLICY "products_service_role_all"
      ON products FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
