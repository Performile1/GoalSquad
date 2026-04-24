-- Add regional MOQ rules and product-warehouse assignments

-- 1. Regional MOQ Rules Table
CREATE TABLE IF NOT EXISTS public.regional_moq_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  postal_code_from VARCHAR(10) NOT NULL,
  postal_code_to VARCHAR(10) NOT NULL,
  moq INTEGER NOT NULL CHECK (moq > 0),
  moq_unit VARCHAR(50) DEFAULT 'pieces',
  moq_discount_percentage DECIMAL(5,2),
  warehouse_id UUID REFERENCES public.warehouse_partners(id) ON DELETE SET NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT regional_moq_rules_valid_range CHECK (postal_code_from <= postal_code_to)
);

CREATE INDEX IF NOT EXISTS idx_regional_moq_rules_product ON public.regional_moq_rules(product_id);
CREATE INDEX IF NOT EXISTS idx_regional_moq_rules_postal ON public.regional_moq_rules(postal_code_from, postal_code_to);
CREATE INDEX IF NOT EXISTS idx_regional_moq_rules_warehouse ON public.regional_moq_rules(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_regional_moq_rules_active ON public.regional_moq_rules(is_active) WHERE is_active = TRUE;

ALTER TABLE public.regional_moq_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "regional_moq_rules_service_role" ON public.regional_moq_rules;
DROP POLICY IF EXISTS "regional_moq_rules_merchant_read" ON public.regional_moq_rules;
DROP POLICY IF EXISTS "regional_moq_rules_merchant_write" ON public.regional_moq_rules;

CREATE POLICY "regional_moq_rules_service_role" ON public.regional_moq_rules
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "regional_moq_rules_merchant_read" ON public.regional_moq_rules
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = regional_moq_rules.product_id
      AND p.merchant_id = auth.uid()
    )
  );

CREATE POLICY "regional_moq_rules_merchant_write" ON public.regional_moq_rules
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = regional_moq_rules.product_id
      AND p.merchant_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = regional_moq_rules.product_id
      AND p.merchant_id = auth.uid()
    )
  );

-- 2. Product-Warehouse Assignment Table
CREATE TABLE IF NOT EXISTS public.product_warehouse_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouse_partners(id) ON DELETE CASCADE,
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT product_warehouse_assignments_unique UNIQUE (product_id, warehouse_id)
);

CREATE INDEX IF NOT EXISTS idx_product_warehouse_assignments_product ON public.product_warehouse_assignments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_warehouse_assignments_warehouse ON public.product_warehouse_assignments(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_product_warehouse_assignments_primary ON public.product_warehouse_assignments(is_primary) WHERE is_primary = TRUE;
CREATE INDEX IF NOT EXISTS idx_product_warehouse_assignments_active ON public.product_warehouse_assignments(is_active) WHERE is_active = TRUE;

ALTER TABLE public.product_warehouse_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_warehouse_assignments_service_role" ON public.product_warehouse_assignments;
DROP POLICY IF EXISTS "product_warehouse_assignments_merchant_read" ON public.product_warehouse_assignments;
DROP POLICY IF EXISTS "product_warehouse_assignments_merchant_write" ON public.product_warehouse_assignments;

CREATE POLICY "product_warehouse_assignments_service_role" ON public.product_warehouse_assignments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "product_warehouse_assignments_merchant_read" ON public.product_warehouse_assignments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_warehouse_assignments.product_id
      AND p.merchant_id = auth.uid()
    )
  );

CREATE POLICY "product_warehouse_assignments_merchant_write" ON public.product_warehouse_assignments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_warehouse_assignments.product_id
      AND p.merchant_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_warehouse_assignments.product_id
      AND p.merchant_id = auth.uid()
    )
  );

-- 3. Function to get MOQ for a product and postal code
CREATE OR REPLACE FUNCTION get_product_moq_for_postal_code(
  p_product_id UUID,
  p_postal_code VARCHAR
) RETURNS INTEGER AS $$
DECLARE
  v_moq INTEGER;
BEGIN
  -- Try to find regional MOQ rule first
  SELECT moq INTO v_moq
  FROM regional_moq_rules
  WHERE product_id = p_product_id
    AND is_active = true
    AND p_postal_code >= postal_code_from
    AND p_postal_code <= postal_code_to
  ORDER BY priority DESC
  LIMIT 1;
  
  -- If no regional rule, fall back to product default
  IF v_moq IS NULL THEN
    SELECT moq INTO v_moq
    FROM products
    WHERE id = p_product_id;
  END IF;
  
  RETURN COALESCE(v_moq, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to get warehouse for a product and postal code
CREATE OR REPLACE FUNCTION get_product_warehouse_for_postal_code(
  p_product_id UUID,
  p_postal_code VARCHAR
) RETURNS UUID AS $$
DECLARE
  v_warehouse_id UUID;
BEGIN
  -- Try to find regional MOQ rule with warehouse assignment first
  SELECT warehouse_id INTO v_warehouse_id
  FROM regional_moq_rules
  WHERE product_id = p_product_id
    AND is_active = true
    AND p_postal_code >= postal_code_from
    AND p_postal_code <= postal_code_to
    AND warehouse_id IS NOT NULL
  ORDER BY priority DESC
  LIMIT 1;
  
  -- If no regional rule, try to find primary warehouse assignment
  IF v_warehouse_id IS NULL THEN
    SELECT warehouse_id INTO v_warehouse_id
    FROM product_warehouse_assignments
    WHERE product_id = p_product_id
      AND is_active = true
      AND is_primary = true
    LIMIT 1;
  END IF;
  
  -- If still no warehouse, try any active warehouse assignment
  IF v_warehouse_id IS NULL THEN
    SELECT warehouse_id INTO v_warehouse_id
    FROM product_warehouse_assignments
    WHERE product_id = p_product_id
      AND is_active = true
    ORDER BY priority DESC
    LIMIT 1;
  END IF;
  
  RETURN v_warehouse_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_regional_moq_rules_updated_at ON public.regional_moq_rules;
CREATE TRIGGER update_regional_moq_rules_updated_at
  BEFORE UPDATE ON public.regional_moq_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_warehouse_assignments_updated_at ON public.product_warehouse_assignments;
CREATE TRIGGER update_product_warehouse_assignments_updated_at
  BEFORE UPDATE ON public.product_warehouse_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Add view for regional MOQ with details
CREATE OR REPLACE VIEW public.regional_moq_view AS
SELECT 
  rmr.id,
  rmr.product_id,
  p.name as product_name,
  p.title as product_title,
  rmr.postal_code_from,
  rmr.postal_code_to,
  rmr.moq,
  rmr.moq_unit,
  rmr.moq_discount_percentage,
  rmr.warehouse_id,
  wp.name as warehouse_name,
  wp.location_postal_code,
  rmr.priority,
  rmr.is_active,
  rmr.description,
  rmr.created_at,
  rmr.updated_at
FROM regional_moq_rules rmr
LEFT JOIN products p ON rmr.product_id = p.id
LEFT JOIN warehouse_partners wp ON rmr.warehouse_id = wp.id;

-- 7. Add view for product-warehouse assignments with details
CREATE OR REPLACE VIEW public.product_warehouse_view AS
SELECT 
  pwa.id,
  pwa.product_id,
  p.name as product_name,
  p.title as product_title,
  pwa.warehouse_id,
  wp.name as warehouse_name,
  wp.location_postal_code,
  wp.postal_code_ranges,
  pwa.stock_quantity,
  pwa.is_primary,
  pwa.is_active,
  pwa.priority,
  pwa.notes,
  pwa.metadata,
  pwa.created_at,
  pwa.updated_at
FROM product_warehouse_assignments pwa
LEFT JOIN products p ON pwa.product_id = p.id
LEFT JOIN warehouse_partners wp ON pwa.warehouse_id = wp.id;

-- Verify the new tables
SELECT 
  'regional_moq_rules' as table_name,
  COUNT(*) as row_count
FROM regional_moq_rules
UNION ALL
SELECT 
  'product_warehouse_assignments' as table_name,
  COUNT(*) as row_count
FROM product_warehouse_assignments;
