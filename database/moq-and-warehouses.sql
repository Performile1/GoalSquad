/**
 * Minimum Order Quantities (MOQ) & Consolidation Warehouses
 * 
 * Features:
 * - Merchants can set minimum order quantity per product
 * - Consolidation warehouses based on postal codes
 * - Automatic order aggregation and split-up
 * - Warehouse assignment by proximity
 */

-- ============================================
-- 1. PRODUCT MOQ (Minimum Order Quantity)
-- ============================================

ALTER TABLE products
ADD COLUMN IF NOT EXISTS minimum_order_quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS moq_unit VARCHAR(50) DEFAULT 'pieces', -- 'pieces', 'boxes', 'pallets'
ADD COLUMN IF NOT EXISTS moq_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS moq_discount_percentage DECIMAL(5,2), -- Discount if MOQ met
ADD COLUMN IF NOT EXISTS allow_partial_orders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS consolidation_required BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_moq ON products(moq_enabled) WHERE moq_enabled = true;

-- ============================================
-- 2. CONSOLIDATION WAREHOUSES
-- ============================================

CREATE TABLE IF NOT EXISTS consolidation_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Warehouse info
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  warehouse_type VARCHAR(50) DEFAULT 'consolidation', -- 'consolidation', 'distribution', 'fulfillment'
  
  -- Location
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  postal_code VARCHAR(20) NOT NULL,
  city VARCHAR(100) NOT NULL,
  region VARCHAR(100),
  country VARCHAR(2) DEFAULT 'SE',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Coverage (postal code ranges)
  postal_code_ranges TEXT[], -- Array of ranges like '100-199', '200-299'
  coverage_radius_km INTEGER, -- Radius in kilometers
  
  -- Capacity
  max_capacity_m3 DECIMAL(10,2),
  current_utilization_m3 DECIMAL(10,2) DEFAULT 0,
  max_daily_orders INTEGER,
  
  -- Operating hours
  operating_hours JSONB, -- {"monday": "08:00-17:00", ...}
  processing_days INTEGER DEFAULT 2, -- Days to process orders
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  accepts_new_orders BOOLEAN DEFAULT true,
  
  -- Contact
  contact_person VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warehouses_postal ON consolidation_warehouses(postal_code);
CREATE INDEX IF NOT EXISTS idx_warehouses_active ON consolidation_warehouses(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_warehouses_country ON consolidation_warehouses(country);

-- ============================================
-- 3. ORDER AGGREGATION (Pre-orders waiting for MOQ)
-- ============================================

CREATE TABLE IF NOT EXISTS order_aggregations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Product & Merchant
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES consolidation_warehouses(id),
  
  -- Aggregation period
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE,
  
  -- Quantities
  target_quantity INTEGER NOT NULL, -- MOQ target
  current_quantity INTEGER DEFAULT 0,
  pending_orders INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(50) DEFAULT 'collecting', -- 'collecting', 'ready', 'processing', 'completed', 'cancelled'
  moq_reached_at TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aggregations_product ON order_aggregations(product_id);
CREATE INDEX IF NOT EXISTS idx_aggregations_status ON order_aggregations(status);
CREATE INDEX IF NOT EXISTS idx_aggregations_warehouse ON order_aggregations(warehouse_id);

-- ============================================
-- 4. PENDING ORDERS (Waiting for MOQ)
-- ============================================

CREATE TABLE IF NOT EXISTS pending_moq_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Order reference
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
  aggregation_id UUID REFERENCES order_aggregations(id),
  
  -- Product & quantity
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  
  -- Customer
  user_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Delivery
  delivery_postal_code VARCHAR(20) NOT NULL,
  assigned_warehouse_id UUID REFERENCES consolidation_warehouses(id),
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'aggregated', 'ready', 'shipped'
  estimated_ship_date DATE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_orders_product ON pending_moq_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_pending_orders_user ON pending_moq_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_orders_warehouse ON pending_moq_orders(assigned_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_pending_orders_status ON pending_moq_orders(status);

-- ============================================
-- 5. FUNCTIONS
-- ============================================

-- Function to find nearest warehouse by postal code
CREATE OR REPLACE FUNCTION find_nearest_warehouse(
  p_postal_code VARCHAR(20),
  p_country VARCHAR(2) DEFAULT 'SE'
)
RETURNS UUID AS $$
DECLARE
  v_warehouse_id UUID;
  v_postal_prefix VARCHAR(3);
BEGIN
  -- Extract postal code prefix (first 3 digits)
  v_postal_prefix := SUBSTRING(p_postal_code FROM 1 FOR 3);
  
  -- Try to find warehouse covering this postal code
  SELECT id INTO v_warehouse_id
  FROM consolidation_warehouses
  WHERE is_active = true
    AND accepts_new_orders = true
    AND country = p_country
    AND (
      -- Check if postal code is in range
      EXISTS (
        SELECT 1 FROM unnest(postal_code_ranges) AS range
        WHERE p_postal_code ~ ('^' || SPLIT_PART(range, '-', 1))
      )
      OR
      -- Check by prefix match
      SUBSTRING(postal_code FROM 1 FOR 3) = v_postal_prefix
    )
  ORDER BY 
    -- Prefer exact postal code match
    CASE WHEN postal_code = p_postal_code THEN 1 ELSE 2 END,
    -- Then by capacity
    (max_capacity_m3 - current_utilization_m3) DESC
  LIMIT 1;
  
  -- If no match, find closest by prefix
  IF v_warehouse_id IS NULL THEN
    SELECT id INTO v_warehouse_id
    FROM consolidation_warehouses
    WHERE is_active = true
      AND accepts_new_orders = true
      AND country = p_country
    ORDER BY 
      ABS(CAST(SUBSTRING(postal_code FROM 1 FOR 3) AS INTEGER) - CAST(v_postal_prefix AS INTEGER))
    LIMIT 1;
  END IF;
  
  RETURN v_warehouse_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if MOQ is reached
CREATE OR REPLACE FUNCTION check_moq_status(
  p_product_id UUID,
  p_warehouse_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_product products%ROWTYPE;
  v_aggregation order_aggregations%ROWTYPE;
  v_pending_count INTEGER;
BEGIN
  -- Get product
  SELECT * INTO v_product FROM products WHERE id = p_product_id;
  
  IF NOT FOUND OR NOT v_product.moq_enabled THEN
    RETURN jsonb_build_object('moq_enabled', false);
  END IF;
  
  -- Get or create aggregation
  SELECT * INTO v_aggregation
  FROM order_aggregations
  WHERE product_id = p_product_id
    AND warehouse_id = p_warehouse_id
    AND status = 'collecting'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    -- Create new aggregation
    INSERT INTO order_aggregations (
      product_id,
      merchant_id,
      warehouse_id,
      target_quantity,
      period_start
    ) VALUES (
      p_product_id,
      v_product.merchant_id,
      p_warehouse_id,
      v_product.minimum_order_quantity,
      NOW()
    ) RETURNING * INTO v_aggregation;
  END IF;
  
  -- Count pending orders
  SELECT COALESCE(SUM(quantity), 0) INTO v_pending_count
  FROM pending_moq_orders
  WHERE product_id = p_product_id
    AND assigned_warehouse_id = p_warehouse_id
    AND status = 'pending';
  
  -- Update aggregation
  UPDATE order_aggregations
  SET current_quantity = v_pending_count,
      moq_reached_at = CASE 
        WHEN v_pending_count >= target_quantity AND moq_reached_at IS NULL 
        THEN NOW() 
        ELSE moq_reached_at 
      END,
      status = CASE 
        WHEN v_pending_count >= target_quantity THEN 'ready'
        ELSE 'collecting'
      END,
      updated_at = NOW()
  WHERE id = v_aggregation.id;
  
  RETURN jsonb_build_object(
    'moq_enabled', true,
    'target_quantity', v_product.minimum_order_quantity,
    'current_quantity', v_pending_count,
    'moq_reached', v_pending_count >= v_product.minimum_order_quantity,
    'percentage', ROUND((v_pending_count::DECIMAL / v_product.minimum_order_quantity) * 100, 2),
    'aggregation_id', v_aggregation.id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to process ready aggregations
CREATE OR REPLACE FUNCTION process_ready_aggregations()
RETURNS TABLE (
  aggregation_id UUID,
  product_id UUID,
  warehouse_id UUID,
  orders_processed INTEGER
) AS $$
DECLARE
  v_aggregation order_aggregations%ROWTYPE;
  v_orders_count INTEGER;
BEGIN
  -- Find all ready aggregations
  FOR v_aggregation IN
    SELECT * FROM order_aggregations
    WHERE status = 'ready'
      AND processed_at IS NULL
  LOOP
    -- Update pending orders to ready
    UPDATE pending_moq_orders
    SET status = 'ready',
        estimated_ship_date = CURRENT_DATE + (
          SELECT processing_days FROM consolidation_warehouses WHERE id = v_aggregation.warehouse_id
        ),
        updated_at = NOW()
    WHERE product_id = v_aggregation.product_id
      AND assigned_warehouse_id = v_aggregation.warehouse_id
      AND status = 'pending';
    
    GET DIAGNOSTICS v_orders_count = ROW_COUNT;
    
    -- Mark aggregation as processed
    UPDATE order_aggregations
    SET status = 'processing',
        processed_at = NOW(),
        updated_at = NOW()
    WHERE id = v_aggregation.id;
    
    RETURN QUERY SELECT 
      v_aggregation.id,
      v_aggregation.product_id,
      v_aggregation.warehouse_id,
      v_orders_count;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get warehouse statistics
CREATE OR REPLACE FUNCTION get_warehouse_stats(p_warehouse_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_pending_orders', COUNT(*),
    'total_quantity', SUM(quantity),
    'unique_products', COUNT(DISTINCT product_id),
    'unique_customers', COUNT(DISTINCT user_id),
    'ready_to_ship', COUNT(*) FILTER (WHERE status = 'ready')
  ) INTO v_stats
  FROM pending_moq_orders
  WHERE assigned_warehouse_id = p_warehouse_id;
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. VIEWS
-- ============================================

-- Active aggregations with progress
CREATE OR REPLACE VIEW aggregations_active AS
SELECT 
  a.*,
  p.name as product_name,
  p.image_url as product_image,
  m.name as merchant_name,
  w.name as warehouse_name,
  w.city as warehouse_city,
  ROUND((a.current_quantity::DECIMAL / a.target_quantity) * 100, 2) as progress_percentage,
  (a.target_quantity - a.current_quantity) as remaining_quantity
FROM order_aggregations a
JOIN products p ON p.id = a.product_id
JOIN merchants m ON m.id = a.merchant_id
LEFT JOIN consolidation_warehouses w ON w.id = a.warehouse_id
WHERE a.status IN ('collecting', 'ready');

-- Warehouse capacity overview
CREATE OR REPLACE VIEW warehouse_capacity AS
SELECT 
  w.*,
  COALESCE(stats.total_pending_orders, 0) as pending_orders,
  COALESCE(stats.total_quantity, 0) as pending_quantity,
  ROUND((w.current_utilization_m3 / NULLIF(w.max_capacity_m3, 0)) * 100, 2) as utilization_percentage
FROM consolidation_warehouses w
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as total_pending_orders,
    SUM(quantity) as total_quantity
  FROM pending_moq_orders
  WHERE assigned_warehouse_id = w.id
    AND status = 'pending'
) stats ON true;

-- Grant permissions
GRANT SELECT ON aggregations_active TO authenticated, anon;
GRANT SELECT ON warehouse_capacity TO authenticated;
GRANT EXECUTE ON FUNCTION find_nearest_warehouse TO authenticated;
GRANT EXECUTE ON FUNCTION check_moq_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_warehouse_stats TO authenticated;

COMMENT ON TABLE consolidation_warehouses IS 'Consolidation warehouses for order aggregation by postal code';
COMMENT ON TABLE order_aggregations IS 'Aggregation of orders waiting to reach MOQ';
COMMENT ON TABLE pending_moq_orders IS 'Individual orders pending MOQ fulfillment';
COMMENT ON FUNCTION find_nearest_warehouse IS 'Find nearest warehouse by postal code';
COMMENT ON FUNCTION check_moq_status IS 'Check if product MOQ is reached at warehouse';
