/**
 * Shipping Restrictions & Consolidation Rules
 * 
 * Handle products that cannot be shipped together
 * (e.g., cheese, frozen items, hazardous materials)
 */

-- Add shipping restriction fields to products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS can_consolidate BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS shipping_restrictions TEXT[],
ADD COLUMN IF NOT EXISTS requires_cold_chain BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_frozen BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_fragile BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_hazardous BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_stack_weight INTEGER,           -- Max weight that can be stacked on top (grams)
ADD COLUMN IF NOT EXISTS shipping_notes TEXT,
ADD COLUMN IF NOT EXISTS separate_packaging_required BOOLEAN DEFAULT false;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_can_consolidate ON products(can_consolidate);
CREATE INDEX IF NOT EXISTS idx_products_cold_chain ON products(requires_cold_chain) WHERE requires_cold_chain = true;
CREATE INDEX IF NOT EXISTS idx_products_frozen ON products(requires_frozen) WHERE requires_frozen = true;

-- Shipping restriction categories
CREATE TABLE IF NOT EXISTS shipping_restriction_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon_emoji TEXT,
  cannot_ship_with TEXT[],                    -- Array of other restriction codes
  requires_special_handling BOOLEAN DEFAULT false,
  additional_cost_percentage DECIMAL(5,2),    -- Extra shipping cost %
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert common restriction categories
INSERT INTO shipping_restriction_categories (code, name, description, icon_emoji, cannot_ship_with, requires_special_handling, additional_cost_percentage) VALUES
  ('CHEESE', 'Ost & Mejeri', 'Kräver kylning, stark lukt', '🧀', ARRAY['FROZEN', 'CHEMICALS'], true, 15.00),
  ('FROZEN', 'Fryst', 'Måste hållas fryst', '❄️', ARRAY['CHEESE', 'AMBIENT', 'FRAGILE'], true, 25.00),
  ('COLD_CHAIN', 'Kylvara', 'Kräver kylkedja', '🧊', ARRAY['FROZEN', 'AMBIENT'], true, 20.00),
  ('FRAGILE', 'Ömtålig', 'Kräver extra skydd', '📦', ARRAY['HEAVY'], true, 10.00),
  ('HEAVY', 'Tung', 'Över 10kg', '⚖️', ARRAY['FRAGILE'], false, 5.00),
  ('CHEMICALS', 'Kemikalier', 'Farligt gods', '⚠️', ARRAY['FOOD', 'CHEESE'], true, 30.00),
  ('LIQUIDS', 'Vätskor', 'Risk för läckage', '💧', ARRAY['ELECTRONICS'], true, 10.00),
  ('PERISHABLE', 'Färskvara', 'Kort hållbarhet', '🍎', ARRAY['FROZEN'], true, 15.00),
  ('AMBIENT', 'Rumstemperatur', 'Normal frakt', '📦', ARRAY['FROZEN', 'COLD_CHAIN'], false, 0.00)
ON CONFLICT (code) DO NOTHING;

-- Function to check if products can be shipped together
CREATE OR REPLACE FUNCTION can_ship_together(
  product_ids UUID[]
)
RETURNS TABLE (
  can_ship BOOLEAN,
  reason TEXT,
  suggested_shipments JSONB
) AS $$
DECLARE
  restrictions TEXT[];
  incompatible_found BOOLEAN := false;
  reason_text TEXT := '';
BEGIN
  -- Get all restrictions from products
  SELECT array_agg(DISTINCT unnest(shipping_restrictions))
  INTO restrictions
  FROM products
  WHERE id = ANY(product_ids);

  -- Check for incompatibilities
  FOR i IN 1..array_length(restrictions, 1) LOOP
    FOR j IN (i+1)..array_length(restrictions, 1) LOOP
      IF EXISTS (
        SELECT 1 FROM shipping_restriction_categories
        WHERE code = restrictions[i]
        AND restrictions[j] = ANY(cannot_ship_with)
      ) THEN
        incompatible_found := true;
        SELECT name INTO reason_text
        FROM shipping_restriction_categories
        WHERE code = restrictions[i];
        reason_text := format('Cannot ship %s with %s', reason_text, restrictions[j]);
        EXIT;
      END IF;
    END LOOP;
    EXIT WHEN incompatible_found;
  END LOOP;

  -- If incompatible, suggest split shipments
  IF incompatible_found THEN
    RETURN QUERY SELECT 
      false as can_ship,
      reason_text as reason,
      jsonb_build_object(
        'shipment1', (SELECT array_agg(id) FROM products WHERE id = ANY(product_ids) AND requires_frozen),
        'shipment2', (SELECT array_agg(id) FROM products WHERE id = ANY(product_ids) AND NOT requires_frozen)
      ) as suggested_shipments;
  ELSE
    RETURN QUERY SELECT 
      true as can_ship,
      'All products can be shipped together' as reason,
      NULL::jsonb as suggested_shipments;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate shipping cost multiplier
CREATE OR REPLACE FUNCTION calculate_shipping_multiplier(
  product_ids UUID[]
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  max_multiplier DECIMAL(5,2) := 1.00;
  current_multiplier DECIMAL(5,2);
BEGIN
  -- Get highest additional cost from restrictions
  SELECT MAX(1.00 + (additional_cost_percentage / 100.0))
  INTO current_multiplier
  FROM shipping_restriction_categories src
  WHERE EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = ANY(product_ids)
    AND src.code = ANY(p.shipping_restrictions)
  );

  RETURN COALESCE(current_multiplier, 1.00);
END;
$$ LANGUAGE plpgsql;

-- View for products with shipping restrictions
CREATE OR REPLACE VIEW products_with_restrictions AS
SELECT 
  p.id,
  p.name,
  p.can_consolidate,
  p.shipping_restrictions,
  p.requires_cold_chain,
  p.requires_frozen,
  p.is_fragile,
  p.is_hazardous,
  p.separate_packaging_required,
  COALESCE(
    (SELECT json_agg(
      json_build_object(
        'code', src.code,
        'name', src.name,
        'icon', src.icon_emoji,
        'additionalCost', src.additional_cost_percentage
      )
    )
    FROM shipping_restriction_categories src
    WHERE src.code = ANY(p.shipping_restrictions)),
    '[]'::json
  ) as restriction_details
FROM products p
WHERE p.can_consolidate = false
   OR array_length(p.shipping_restrictions, 1) > 0;

-- Grant permissions
GRANT SELECT ON products_with_restrictions TO authenticated, anon;
GRANT EXECUTE ON FUNCTION can_ship_together TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_shipping_multiplier TO authenticated;

COMMENT ON TABLE shipping_restriction_categories IS 'Categories of shipping restrictions and incompatibilities';
COMMENT ON FUNCTION can_ship_together IS 'Check if products can be shipped together';
COMMENT ON FUNCTION calculate_shipping_multiplier IS 'Calculate shipping cost multiplier based on restrictions';
