/**
 * Product Flow Tracking
 * 
 * Track real product movements:
 * 1. Merchant → Consolidation Warehouse
 * 2. Consolidation Warehouse → Customer/Community
 * 
 * NO MOCK DATA - All based on actual orders
 */

-- ============================================
-- 1. WAREHOUSE INVENTORY
-- ============================================

CREATE TABLE IF NOT EXISTS warehouse_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What & Where
  warehouse_id UUID NOT NULL REFERENCES consolidation_warehouses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  
  -- Quantities
  quantity_received INTEGER NOT NULL DEFAULT 0,
  quantity_allocated INTEGER NOT NULL DEFAULT 0, -- Reserved for orders
  quantity_available INTEGER NOT NULL DEFAULT 0, -- Available to allocate
  quantity_shipped INTEGER NOT NULL DEFAULT 0,   -- Already sent to customers
  
  -- Tracking
  received_from_merchant_at TIMESTAMP WITH TIME ZONE,
  batch_number VARCHAR(100),
  
  -- Status
  status VARCHAR(50) DEFAULT 'in_transit', -- 'in_transit', 'received', 'processing', 'depleted'
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(warehouse_id, product_id, batch_number)
);

CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_warehouse ON warehouse_inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_product ON warehouse_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_merchant ON warehouse_inventory(merchant_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_status ON warehouse_inventory(status);

-- ============================================
-- 2. PRODUCT SHIPMENTS (Merchant → Warehouse)
-- ============================================

CREATE TABLE IF NOT EXISTS merchant_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- From & To
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES consolidation_warehouses(id) ON DELETE CASCADE,
  
  -- Aggregation reference (if triggered by MOQ)
  aggregation_id UUID REFERENCES order_aggregations(id),
  
  -- Shipment info
  shipment_number VARCHAR(100) UNIQUE NOT NULL,
  tracking_number VARCHAR(255),
  carrier VARCHAR(100),
  
  -- Status
  status VARCHAR(50) DEFAULT 'preparing', 
    -- 'preparing', 'shipped', 'in_transit', 'arrived', 'received'
  
  -- Dates
  shipped_at TIMESTAMP WITH TIME ZONE,
  estimated_arrival DATE,
  arrived_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_shipments_merchant ON merchant_shipments(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_shipments_warehouse ON merchant_shipments(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_merchant_shipments_status ON merchant_shipments(status);

-- ============================================
-- 3. SHIPMENT ITEMS
-- ============================================

CREATE TABLE IF NOT EXISTS merchant_shipment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  shipment_id UUID NOT NULL REFERENCES merchant_shipments(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  quantity INTEGER NOT NULL,
  batch_number VARCHAR(100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipment_items_shipment ON merchant_shipment_items(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_items_product ON merchant_shipment_items(product_id);

-- ============================================
-- 4. CUSTOMER ALLOCATIONS (Warehouse → Customer)
-- ============================================

CREATE TABLE IF NOT EXISTS warehouse_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What & Where
  warehouse_inventory_id UUID NOT NULL REFERENCES warehouse_inventory(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  
  -- Allocation
  quantity_allocated INTEGER NOT NULL,
  allocated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Fulfillment
  picked_at TIMESTAMP WITH TIME ZONE,
  packed_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'allocated',
    -- 'allocated', 'picked', 'packed', 'shipped'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warehouse_allocations_inventory ON warehouse_allocations(warehouse_inventory_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_allocations_order_item ON warehouse_allocations(order_item_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_allocations_status ON warehouse_allocations(status);

-- ============================================
-- 5. FUNCTIONS - REAL DATA ONLY
-- ============================================

-- Get product flow for a specific product
CREATE OR REPLACE FUNCTION get_product_flow(p_product_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'product_id', p_product_id,
    
    -- Orders waiting for this product
    'pending_orders', (
      SELECT jsonb_build_object(
        'total_quantity', COALESCE(SUM(quantity), 0),
        'order_count', COUNT(*),
        'by_warehouse', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'warehouse_id', w.id,
              'warehouse_name', w.name,
              'city', w.city,
              'quantity', COALESCE(SUM(p.quantity), 0),
              'order_count', COUNT(DISTINCT p.order_id)
            )
          )
          FROM pending_moq_orders p
          JOIN consolidation_warehouses w ON w.id = p.assigned_warehouse_id
          WHERE p.product_id = p_product_id
            AND p.status = 'pending'
          GROUP BY w.id, w.name, w.city
        )
      )
      FROM pending_moq_orders
      WHERE product_id = p_product_id
        AND status = 'pending'
    ),
    
    -- In transit from merchant to warehouses
    'in_transit_to_warehouse', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'shipment_id', ms.id,
          'warehouse_id', ms.warehouse_id,
          'warehouse_name', w.name,
          'quantity', msi.quantity,
          'status', ms.status,
          'estimated_arrival', ms.estimated_arrival
        )
      )
      FROM merchant_shipments ms
      JOIN merchant_shipment_items msi ON msi.shipment_id = ms.id
      JOIN consolidation_warehouses w ON w.id = ms.warehouse_id
      WHERE msi.product_id = p_product_id
        AND ms.status IN ('shipped', 'in_transit')
    ),
    
    -- At warehouses (inventory)
    'at_warehouses', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'warehouse_id', w.id,
          'warehouse_name', w.name,
          'city', w.city,
          'quantity_available', wi.quantity_available,
          'quantity_allocated', wi.quantity_allocated,
          'quantity_shipped', wi.quantity_shipped,
          'status', wi.status
        )
      )
      FROM warehouse_inventory wi
      JOIN consolidation_warehouses w ON w.id = wi.warehouse_id
      WHERE wi.product_id = p_product_id
        AND wi.quantity_available > 0
    ),
    
    -- Allocated to customers (ready to ship)
    'allocated_to_customers', (
      SELECT jsonb_build_object(
        'total_quantity', COALESCE(SUM(wa.quantity_allocated), 0),
        'allocation_count', COUNT(*),
        'by_warehouse', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'warehouse_id', w.id,
              'warehouse_name', w.name,
              'quantity', COALESCE(SUM(wa.quantity_allocated), 0),
              'status_breakdown', (
                SELECT jsonb_object_agg(status, count)
                FROM (
                  SELECT status, COUNT(*) as count
                  FROM warehouse_allocations wa2
                  JOIN warehouse_inventory wi2 ON wi2.id = wa2.warehouse_inventory_id
                  WHERE wi2.warehouse_id = w.id
                    AND wi2.product_id = p_product_id
                  GROUP BY status
                ) s
              )
            )
          )
          FROM warehouse_allocations wa
          JOIN warehouse_inventory wi ON wi.id = wa.warehouse_inventory_id
          JOIN consolidation_warehouses w ON w.id = wi.warehouse_id
          WHERE wi.product_id = p_product_id
          GROUP BY w.id, w.name
        )
      )
      FROM warehouse_allocations wa
      JOIN warehouse_inventory wi ON wi.id = wa.warehouse_inventory_id
      WHERE wi.product_id = p_product_id
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Get warehouse flow summary
CREATE OR REPLACE FUNCTION get_warehouse_flow(p_warehouse_id UUID)
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
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. VIEWS - REAL DATA ONLY
-- ============================================

-- Product flow summary (real-time)
CREATE OR REPLACE VIEW product_flow_summary AS
SELECT 
  p.id as product_id,
  p.name as product_name,
  m.id as merchant_id,
  m.name as merchant_name,
  
  -- Pending orders
  COALESCE(pending.total_quantity, 0) as pending_order_quantity,
  COALESCE(pending.order_count, 0) as pending_order_count,
  
  -- In transit
  COALESCE(transit.total_quantity, 0) as in_transit_quantity,
  COALESCE(transit.shipment_count, 0) as in_transit_shipments,
  
  -- At warehouses
  COALESCE(inventory.total_available, 0) as warehouse_available,
  COALESCE(inventory.total_allocated, 0) as warehouse_allocated,
  COALESCE(inventory.warehouse_count, 0) as warehouses_with_stock,
  
  -- Allocated to customers
  COALESCE(allocated.total_quantity, 0) as allocated_to_customers
  
FROM products p
JOIN merchants m ON m.id = p.merchant_id

LEFT JOIN (
  SELECT 
    product_id,
    SUM(quantity) as total_quantity,
    COUNT(DISTINCT order_id) as order_count
  FROM pending_moq_orders
  WHERE status = 'pending'
  GROUP BY product_id
) pending ON pending.product_id = p.id

LEFT JOIN (
  SELECT 
    msi.product_id,
    SUM(msi.quantity) as total_quantity,
    COUNT(DISTINCT ms.id) as shipment_count
  FROM merchant_shipment_items msi
  JOIN merchant_shipments ms ON ms.id = msi.shipment_id
  WHERE ms.status IN ('shipped', 'in_transit')
  GROUP BY msi.product_id
) transit ON transit.product_id = p.id

LEFT JOIN (
  SELECT 
    product_id,
    SUM(quantity_available) as total_available,
    SUM(quantity_allocated) as total_allocated,
    COUNT(DISTINCT warehouse_id) as warehouse_count
  FROM warehouse_inventory
  WHERE quantity_available > 0 OR quantity_allocated > 0
  GROUP BY product_id
) inventory ON inventory.product_id = p.id

LEFT JOIN (
  SELECT 
    wi.product_id,
    SUM(wa.quantity_allocated) as total_quantity
  FROM warehouse_allocations wa
  JOIN warehouse_inventory wi ON wi.id = wa.warehouse_inventory_id
  WHERE wa.status IN ('allocated', 'picked', 'packed')
  GROUP BY wi.product_id
) allocated ON allocated.product_id = p.id;

-- Grant permissions
GRANT SELECT ON product_flow_summary TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_product_flow TO authenticated;
GRANT EXECUTE ON FUNCTION get_warehouse_flow TO authenticated;

COMMENT ON TABLE warehouse_inventory IS 'Real inventory at consolidation warehouses - NO MOCK DATA';
COMMENT ON TABLE merchant_shipments IS 'Actual shipments from merchants to warehouses';
COMMENT ON FUNCTION get_product_flow IS 'Get complete product flow based on real orders and shipments';
COMMENT ON VIEW product_flow_summary IS 'Real-time summary of product movements - all data from actual transactions';
