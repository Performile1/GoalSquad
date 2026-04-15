/**
 * MOQ Enhancements
 * 
 * - Global vs Per-Warehouse MOQ tracking
 * - Split shipment support
 * - Order blocking by MOQ dependencies
 */

-- ============================================
-- 1. ENHANCED PRODUCT MOQ SETTINGS
-- ============================================

ALTER TABLE products
ADD COLUMN IF NOT EXISTS moq_tracking_scope VARCHAR(50) DEFAULT 'global';
  -- 'global' = count all orders regardless of warehouse
  -- 'per_warehouse' = each warehouse must reach MOQ separately

COMMENT ON COLUMN products.moq_tracking_scope IS 'How to track MOQ: global (all warehouses) or per_warehouse';

-- ============================================
-- 2. ORDER SHIPMENT STRATEGY
-- ============================================

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shipment_strategy VARCHAR(50) DEFAULT 'wait_for_all',
  -- 'wait_for_all' = wait until all items ready
  -- 'split_shipment' = allow multiple shipments
  -- 'partial_ok' = ship ready items immediately
ADD COLUMN IF NOT EXISTS estimated_shipments INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS additional_shipping_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_moq_items BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS moq_blocking BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_orders_moq_blocking ON orders(moq_blocking) WHERE moq_blocking = true;

-- ============================================
-- 3. SHIPMENTS (Multiple per order)
-- ============================================

CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Shipment info
  shipment_number INTEGER NOT NULL, -- 1, 2, 3...
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'ready', 'shipped', 'delivered'
  
  -- Items in this shipment
  order_item_ids UUID[], -- Array of order_item IDs
  
  -- Tracking
  tracking_number VARCHAR(255),
  carrier VARCHAR(100),
  
  -- Costs
  shipping_cost DECIMAL(10,2),
  
  -- Dates
  estimated_ship_date DATE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  estimated_delivery_date DATE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Warehouse
  warehouse_id UUID REFERENCES consolidation_warehouses(id),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);

-- ============================================
-- 4. ENHANCED MOQ CHECK FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION check_moq_status_v2(
  p_product_id UUID,
  p_postal_code VARCHAR(20)
)
RETURNS JSONB AS $$
DECLARE
  v_product products%ROWTYPE;
  v_warehouse_id UUID;
  v_total_quantity INTEGER;
  v_warehouse_quantity INTEGER;
  v_other_warehouses JSONB;
BEGIN
  -- Get product
  SELECT * INTO v_product FROM products WHERE id = p_product_id;
  
  IF NOT FOUND OR NOT v_product.moq_enabled THEN
    RETURN jsonb_build_object('moq_enabled', false);
  END IF;
  
  -- Find warehouse
  v_warehouse_id := find_nearest_warehouse(p_postal_code);
  
  IF v_warehouse_id IS NULL THEN
    RETURN jsonb_build_object('moq_enabled', true, 'error', 'No warehouse found');
  END IF;
  
  -- Check tracking scope
  IF v_product.moq_tracking_scope = 'global' THEN
    -- Count ALL pending orders globally
    SELECT COALESCE(SUM(quantity), 0) INTO v_total_quantity
    FROM pending_moq_orders
    WHERE product_id = p_product_id
      AND status = 'pending';
    
    -- Get breakdown by warehouse for transparency
    SELECT jsonb_agg(
      jsonb_build_object(
        'warehouse_id', w.id,
        'warehouse_name', w.name,
        'city', w.city,
        'quantity', COALESCE(SUM(p.quantity), 0)
      )
    ) INTO v_other_warehouses
    FROM consolidation_warehouses w
    LEFT JOIN pending_moq_orders p ON p.assigned_warehouse_id = w.id 
      AND p.product_id = p_product_id 
      AND p.status = 'pending'
    WHERE w.is_active = true
    GROUP BY w.id, w.name, w.city;
    
    RETURN jsonb_build_object(
      'moq_enabled', true,
      'tracking_scope', 'global',
      'target_quantity', v_product.minimum_order_quantity,
      'current_quantity', v_total_quantity,
      'moq_reached', v_total_quantity >= v_product.minimum_order_quantity,
      'percentage', ROUND((v_total_quantity::DECIMAL / v_product.minimum_order_quantity) * 100, 2),
      'warehouse_id', v_warehouse_id,
      'warehouse_breakdown', v_other_warehouses,
      'discount_percentage', v_product.moq_discount_percentage
    );
  ELSE
    -- Count only for this warehouse
    SELECT COALESCE(SUM(quantity), 0) INTO v_warehouse_quantity
    FROM pending_moq_orders
    WHERE product_id = p_product_id
      AND assigned_warehouse_id = v_warehouse_id
      AND status = 'pending';
    
    RETURN jsonb_build_object(
      'moq_enabled', true,
      'tracking_scope', 'per_warehouse',
      'target_quantity', v_product.minimum_order_quantity,
      'current_quantity', v_warehouse_quantity,
      'moq_reached', v_warehouse_quantity >= v_product.minimum_order_quantity,
      'percentage', ROUND((v_warehouse_quantity::DECIMAL / v_product.minimum_order_quantity) * 100, 2),
      'warehouse_id', v_warehouse_id,
      'discount_percentage', v_product.moq_discount_percentage
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. CHECK ORDER MOQ BLOCKING
-- ============================================

CREATE OR REPLACE FUNCTION check_order_moq_blocking(p_order_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_blocking_items JSONB;
  v_ready_items JSONB;
  v_has_blocking BOOLEAN;
BEGIN
  -- Get items that are blocking (MOQ not reached)
  SELECT jsonb_agg(
    jsonb_build_object(
      'item_id', oi.id,
      'product_id', oi.product_id,
      'product_name', p.name,
      'quantity', oi.quantity,
      'moq_status', (
        SELECT check_moq_status_v2(p.id, o.shipping_postal_code)
      )
    )
  ) INTO v_blocking_items
  FROM order_items oi
  JOIN products p ON p.id = oi.product_id
  JOIN orders o ON o.id = oi.order_id
  WHERE oi.order_id = p_order_id
    AND p.moq_enabled = true
    AND NOT (
      SELECT (check_moq_status_v2(p.id, o.shipping_postal_code)->>'moq_reached')::boolean
    );
  
  -- Get items that are ready
  SELECT jsonb_agg(
    jsonb_build_object(
      'item_id', oi.id,
      'product_id', oi.product_id,
      'product_name', p.name,
      'quantity', oi.quantity
    )
  ) INTO v_ready_items
  FROM order_items oi
  JOIN products p ON p.id = oi.product_id
  JOIN orders o ON o.id = oi.order_id
  WHERE oi.order_id = p_order_id
    AND (
      p.moq_enabled = false
      OR (
        SELECT (check_moq_status_v2(p.id, o.shipping_postal_code)->>'moq_reached')::boolean
      )
    );
  
  v_has_blocking := v_blocking_items IS NOT NULL;
  
  RETURN jsonb_build_object(
    'has_blocking', v_has_blocking,
    'blocking_items', COALESCE(v_blocking_items, '[]'::jsonb),
    'ready_items', COALESCE(v_ready_items, '[]'::jsonb),
    'can_split', v_has_blocking AND v_ready_items IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. CREATE SPLIT SHIPMENTS
-- ============================================

CREATE OR REPLACE FUNCTION create_split_shipments(
  p_order_id UUID,
  p_strategy VARCHAR(50) DEFAULT 'split_shipment'
)
RETURNS JSONB AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_blocking_check JSONB;
  v_shipment1_id UUID;
  v_shipment2_id UUID;
  v_ready_item_ids UUID[];
  v_blocking_item_ids UUID[];
  v_base_shipping DECIMAL(10,2);
  v_additional_shipping DECIMAL(10,2);
BEGIN
  -- Get order
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;
  
  -- Check blocking status
  v_blocking_check := check_order_moq_blocking(p_order_id);
  
  IF NOT (v_blocking_check->>'has_blocking')::boolean THEN
    RETURN jsonb_build_object('success', false, 'error', 'No blocking items');
  END IF;
  
  IF NOT (v_blocking_check->>'can_split')::boolean THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot split - no ready items');
  END IF;
  
  -- Extract item IDs
  SELECT array_agg((item->>'item_id')::UUID)
  INTO v_ready_item_ids
  FROM jsonb_array_elements(v_blocking_check->'ready_items') AS item;
  
  SELECT array_agg((item->>'item_id')::UUID)
  INTO v_blocking_item_ids
  FROM jsonb_array_elements(v_blocking_check->'blocking_items') AS item;
  
  -- Calculate shipping costs
  v_base_shipping := 89.00; -- Base shipping
  v_additional_shipping := 49.00; -- Additional shipment
  
  -- Create shipment 1 (ready items)
  INSERT INTO shipments (
    order_id,
    shipment_number,
    status,
    order_item_ids,
    shipping_cost,
    estimated_ship_date
  ) VALUES (
    p_order_id,
    1,
    'ready',
    v_ready_item_ids,
    v_base_shipping,
    CURRENT_DATE + INTERVAL '2 days'
  ) RETURNING id INTO v_shipment1_id;
  
  -- Create shipment 2 (MOQ pending items)
  INSERT INTO shipments (
    order_id,
    shipment_number,
    status,
    order_item_ids,
    shipping_cost,
    estimated_ship_date
  ) VALUES (
    p_order_id,
    2,
    'pending',
    v_blocking_item_ids,
    v_additional_shipping,
    CURRENT_DATE + INTERVAL '7 days'
  ) RETURNING id INTO v_shipment2_id;
  
  -- Update order
  UPDATE orders
  SET shipment_strategy = p_strategy,
      estimated_shipments = 2,
      additional_shipping_cost = v_additional_shipping,
      updated_at = NOW()
  WHERE id = p_order_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'shipment1_id', v_shipment1_id,
    'shipment2_id', v_shipment2_id,
    'additional_cost', v_additional_shipping,
    'ready_items', jsonb_array_length(v_blocking_check->'ready_items'),
    'pending_items', jsonb_array_length(v_blocking_check->'blocking_items')
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. VIEWS
-- ============================================

-- Orders with MOQ blocking
CREATE OR REPLACE VIEW orders_moq_blocked AS
SELECT 
  o.*,
  (SELECT check_order_moq_blocking(o.id)) as moq_status
FROM orders o
WHERE EXISTS (
  SELECT 1 FROM order_items oi
  JOIN products p ON p.id = oi.product_id
  WHERE oi.order_id = o.id
    AND p.moq_enabled = true
);

-- Grant permissions
GRANT SELECT ON orders_moq_blocked TO authenticated;
GRANT EXECUTE ON FUNCTION check_moq_status_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION check_order_moq_blocking TO authenticated;
GRANT EXECUTE ON FUNCTION create_split_shipments TO authenticated;

COMMENT ON FUNCTION check_moq_status_v2 IS 'Enhanced MOQ check with global/per-warehouse support';
COMMENT ON FUNCTION check_order_moq_blocking IS 'Check if order has items blocked by MOQ';
COMMENT ON FUNCTION create_split_shipments IS 'Create multiple shipments for split delivery';
