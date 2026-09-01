-- ====================================================================
-- 092_ecosystem_additions.sql
-- Connects Merchant <-> Warehouse <-> Gamification (campaign) flow.
-- Adds: merchant certifications, ERP integration configs,
--        warehouse zones, and campaign-linked idempotent picking tasks.
-- ====================================================================

-- ====================================================================
-- MERCHANT ADDITIONS
-- ====================================================================

-- Merchant certifications (e.g. Ekologiskt, Fairtrade, KRAV)
CREATE TABLE IF NOT EXISTS merchant_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    certification_name VARCHAR(150) NOT NULL,
    issuer VARCHAR(150) NOT NULL,
    expires_at DATE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_merchant_certifications_merchant
    ON merchant_certifications(merchant_id);

-- Merchant ERP / integration configs (Fortnox, Visma, Zapier, ...)
CREATE TABLE IF NOT EXISTS merchant_integration_configs (
    merchant_id UUID PRIMARY KEY REFERENCES merchants(id) ON DELETE CASCADE,
    erp_system VARCHAR(50) NOT NULL,
    api_encrypted_key TEXT NOT NULL,
    sync_orders_enabled BOOLEAN DEFAULT FALSE,
    sync_inventory_enabled BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- WAREHOUSE ADDITIONS
-- ====================================================================

-- Warehouse zones (Aisle-A, Cold-Storage, Bulk-Pallets, ...)
CREATE TABLE IF NOT EXISTS warehouse_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES consolidation_warehouses(id) ON DELETE CASCADE,
    zone_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (warehouse_id, zone_name)
);
CREATE INDEX IF NOT EXISTS idx_warehouse_zones_warehouse
    ON warehouse_zones(warehouse_id);

-- Campaign-linked picking tasks with idempotency lock.
-- Complements the order-level pick_sessions/pick_session_items by
-- supporting campaign (class sale) bulk pre-picking.
CREATE TABLE IF NOT EXISTS warehouse_picking_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES consolidation_warehouses(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    quantity_to_pick INT NOT NULL,
    quantity_picked INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    assigned_staff_id UUID,

    -- IDEMPOTENCY LOCK: ensures a picking task for a specific
    -- warehouse/campaign/SKU cannot be generated twice.
    picking_lock VARCHAR(255) NOT NULL UNIQUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_picking_tasks_campaign
    ON warehouse_picking_tasks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_picking_tasks_warehouse
    ON warehouse_picking_tasks(warehouse_id);

-- ====================================================================
-- PRODUCTS: support idempotent bulk upsert on (merchant_id, sku)
-- ====================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'products_merchant_sku_unique'
    ) THEN
        ALTER TABLE products
            ADD CONSTRAINT products_merchant_sku_unique UNIQUE (merchant_id, sku);
    END IF;
END $$;

-- ====================================================================
-- ROW LEVEL SECURITY
-- (API routes use the service-role key which bypasses RLS.)
-- ====================================================================
ALTER TABLE merchant_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_integration_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_picking_tasks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'merchant_certifications' AND policyname = 'merchant_owns_certifications'
  ) THEN
    CREATE POLICY "merchant_owns_certifications" ON public.merchant_certifications
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.merchants m
          WHERE m.id = public.merchant_certifications.merchant_id
            AND m.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'merchant_integration_configs' AND policyname = 'merchant_owns_integration_config'
  ) THEN
    CREATE POLICY "merchant_owns_integration_config" ON public.merchant_integration_configs
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.merchants m
          WHERE m.id = public.merchant_integration_configs.merchant_id
            AND m.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'warehouse_zones' AND policyname = 'authenticated_read_warehouse_zones'
  ) THEN
    CREATE POLICY "authenticated_read_warehouse_zones" ON public.warehouse_zones
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'warehouse_picking_tasks' AND policyname = 'authenticated_read_picking_tasks'
  ) THEN
    CREATE POLICY "authenticated_read_picking_tasks" ON public.warehouse_picking_tasks
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;
