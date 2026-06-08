/**
 * ============================================================
 * MIGRATION 105 — NORMALIZE warehouse_inventory
 * ============================================================
 *
 * Across migration 002, 034, the inventory API and the legacy
 * product-flow-tracking.sql, warehouse_inventory exists with 3-4 different
 * column sets (`quantity` vs `quantity_available/allocated/shipped/received`,
 * plus `reserved_quantity`, `available_quantity`, `location_code`, `status`).
 *
 * This migration converges them to a single superset (idempotent) and
 * backfills the canonical `quantity_available` from whichever legacy
 * quantity column is present. FK target for merchant_id is intentionally
 * left as-is to avoid breaking existing references.
 * ============================================================
 */

ALTER TABLE public.warehouse_inventory
  ADD COLUMN IF NOT EXISTS merchant_id        UUID,
  ADD COLUMN IF NOT EXISTS sku                VARCHAR(100),
  ADD COLUMN IF NOT EXISTS quantity           INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quantity_received  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quantity_available INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quantity_allocated INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quantity_shipped   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reserved_quantity  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS available_quantity INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS location_code      VARCHAR(50),
  ADD COLUMN IF NOT EXISTS status             VARCHAR(50) DEFAULT 'in_stock',
  ADD COLUMN IF NOT EXISTS last_restocked_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMPTZ DEFAULT now();

-- Backfill canonical quantity_available from the legacy `quantity` column
-- when available is still zero (guarded so it is safe to re-run).
UPDATE public.warehouse_inventory
SET quantity_available = quantity
WHERE quantity_available = 0
  AND quantity > 0;

-- Mirror legacy `available_quantity` (inventory API) onto quantity_available.
UPDATE public.warehouse_inventory
SET quantity_available = available_quantity
WHERE quantity_available = 0
  AND available_quantity > 0;

CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_merchant_norm
  ON public.warehouse_inventory(merchant_id);
