/**
 * ============================================================
 * MIGRATION 101 — get_warehouse_flow RPC (idempotent)
 * ============================================================
 *
 * The flow endpoint (/api/warehouses/[id]/flow) calls the RPC
 * get_warehouse_flow, which previously only existed in the legacy
 * database/product-flow-tracking.sql. That file could not be run as-is
 * because it does `CREATE TABLE IF NOT EXISTS warehouse_inventory (...)`
 * — a no-op on the already-existing table — and then a
 * `CREATE INDEX ... (merchant_id)` that fails when the live table lacks
 * the column (schema drift between migration 002/034 variants).
 *
 * This migration instead:
 *   1. Defensively ensures warehouse_inventory has the columns the RPC
 *      needs (no-op where they already exist). No FK is added on
 *      merchant_id to avoid the merchants-vs-profiles target conflict.
 *   2. (Re)creates the get_warehouse_flow function.
 * ============================================================
 */

-- 1. Ensure required columns exist (idempotent, drift-safe).
ALTER TABLE public.warehouse_inventory
  ADD COLUMN IF NOT EXISTS merchant_id        UUID,
  ADD COLUMN IF NOT EXISTS quantity_available INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quantity_allocated INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_merchant
  ON public.warehouse_inventory(merchant_id);

-- 2. (Re)create the RPC used by the flow endpoint.
CREATE OR REPLACE FUNCTION public.get_warehouse_flow(p_warehouse_id UUID)
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'warehouse_id', p_warehouse_id,

    -- Incoming from merchants
    'incoming_shipments', (
      SELECT jsonb_build_object(
        'shipment_count', COUNT(*),
        'total_items', COALESCE(SUM(
          (SELECT SUM(quantity) FROM merchant_shipment_items WHERE shipment_id = ms.id)
        ), 0),
        'by_status', (
          SELECT jsonb_object_agg(status, count)
          FROM (
            SELECT status, COUNT(*) as count
            FROM merchant_shipments
            WHERE warehouse_id = p_warehouse_id
              AND status IN ('shipped', 'in_transit')
            GROUP BY status
          ) s
        )
      )
      FROM merchant_shipments ms
      WHERE warehouse_id = p_warehouse_id
        AND status IN ('shipped', 'in_transit')
    ),

    -- Current inventory
    'current_inventory', (
      SELECT jsonb_build_object(
        'product_count', COUNT(DISTINCT product_id),
        'total_available', COALESCE(SUM(quantity_available), 0),
        'total_allocated', COALESCE(SUM(quantity_allocated), 0),
        'by_merchant', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'merchant_id', m.id,
              'merchant_name', m.name,
              'product_count', COUNT(DISTINCT wi2.product_id),
              'quantity_available', COALESCE(SUM(wi2.quantity_available), 0)
            )
          )
          FROM warehouse_inventory wi2
          JOIN merchants m ON m.id = wi2.merchant_id
          WHERE wi2.warehouse_id = p_warehouse_id
            AND wi2.quantity_available > 0
          GROUP BY m.id, m.name
        )
      )
      FROM warehouse_inventory
      WHERE warehouse_id = p_warehouse_id
    ),

    -- Pending customer orders
    'pending_customer_orders', (
      SELECT jsonb_build_object(
        'order_count', COUNT(DISTINCT order_id),
        'total_quantity', COALESCE(SUM(quantity), 0),
        'by_status', (
          SELECT jsonb_object_agg(status, count)
          FROM (
            SELECT status, COUNT(*) as count
            FROM pending_moq_orders
            WHERE assigned_warehouse_id = p_warehouse_id
            GROUP BY status
          ) s
        )
      )
      FROM pending_moq_orders
      WHERE assigned_warehouse_id = p_warehouse_id
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_warehouse_flow(UUID) TO authenticated, service_role;
