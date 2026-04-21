-- Migration 031: Multi-role Warehouse Partners
-- Features: Allow associations/classes/clubs/sellers to act as warehouse partners with cost configuration

-- Update profiles entity_type constraint to allow multiple roles
DO $$
BEGIN
  -- Drop old constraint
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_entity_type_check;
  
  -- Add new constraint allowing combinations
  ALTER TABLE profiles ADD CONSTRAINT profiles_entity_type_check 
    CHECK (entity_type IN ('individual', 'parent', 'seller', 'merchant', 'warehouse_partner', 'community_admin', 'super_admin', 'association', 'klass', 'klubb'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add is_warehouse_partner flag to communities table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'is_warehouse_partner') THEN
    ALTER TABLE communities ADD COLUMN is_warehouse_partner BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added is_warehouse_partner to communities';
  END IF;
END $$;

-- Add warehouse partner configuration to communities
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'warehouse_config') THEN
    ALTER TABLE communities ADD COLUMN warehouse_config JSONB DEFAULT '{}';
    RAISE NOTICE 'Added warehouse_config to communities';
  END IF;
END $$;

-- Add warehouse partner configuration to sellers (profiles)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'warehouse_config') THEN
    ALTER TABLE profiles ADD COLUMN warehouse_config JSONB DEFAULT '{}';
    RAISE NOTICE 'Added warehouse_config to profiles';
  END IF;
END $$;

-- Create warehouse_partner_earnings table
CREATE TABLE IF NOT EXISTS warehouse_partner_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('community', 'seller', 'merchant')),
  entity_id UUID NOT NULL,
  
  -- Earnings breakdown
  storage_earnings DECIMAL(10, 2) DEFAULT 0,
  handling_earnings DECIMAL(10, 2) DEFAULT 0,
  shipping_earnings DECIMAL(10, 2) DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  
  -- Period
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  
  -- Payment details
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_warehouse_earnings_entity ON warehouse_partner_earnings(entity_type, entity_id);
CREATE INDEX idx_warehouse_earnings_period ON warehouse_partner_earnings(period_start, period_end);
CREATE INDEX idx_warehouse_earnings_status ON warehouse_partner_earnings(status);

ALTER TABLE warehouse_partner_earnings ENABLE ROW LEVEL SECURITY;

-- RLS policies for warehouse_partner_earnings
CREATE POLICY warehouse_earnings_select_own ON warehouse_partner_earnings
  FOR SELECT TO authenticated
  USING (
    entity_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = entity_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('admin', 'owner')
    ) OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.role = 'admin'
    )
  );

CREATE POLICY warehouse_earnings_insert_service ON warehouse_partner_earnings
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY warehouse_earnings_update_service ON warehouse_partner_earnings
  FOR UPDATE TO service_role
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_warehouse_earnings_updated_at
  BEFORE UPDATE ON warehouse_partner_earnings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate warehouse partner earnings
CREATE OR REPLACE FUNCTION calculate_warehouse_earnings(
  p_entity_type VARCHAR,
  p_entity_id UUID,
  p_period_start TIMESTAMP WITH TIME ZONE,
  p_period_end TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  storage_earnings DECIMAL,
  handling_earnings DECIMAL,
  shipping_earnings DECIMAL,
  total_earnings DECIMAL
) AS $$
DECLARE
  v_config JSONB;
  v_storage_cost_per_unit DECIMAL;
  v_handling_cost_per_unit DECIMAL;
  v_shipping_cost_type VARCHAR;
  v_shipping_cost_per_unit DECIMAL;
BEGIN
  -- Get warehouse configuration
  IF p_entity_type = 'community' THEN
    SELECT warehouse_config INTO v_config FROM communities WHERE id = p_entity_id;
  ELSE
    SELECT warehouse_config INTO v_config FROM profiles WHERE id = p_entity_id;
  END IF;
  
  -- Extract cost configuration
  v_storage_cost_per_unit := (v_config->>'storage_cost_per_unit')::DECIMAL;
  v_handling_cost_per_unit := (v_config->>'handling_cost_per_unit')::DECIMAL;
  v_shipping_cost_type := v_config->>'shipping_cost_type';
  v_shipping_cost_per_unit := (v_config->>'shipping_cost_per_unit')::DECIMAL;
  
  -- Calculate earnings based on shipments in period
  RETURN QUERY
  SELECT
    COALESCE(SUM(msi.quantity_shipped * COALESCE(v_storage_cost_per_unit, 0)), 0) as storage_earnings,
    COALESCE(SUM(msi.quantity_shipped * COALESCE(v_handling_cost_per_unit, 0)), 0) as handling_earnings,
    COALESCE(
      CASE 
        WHEN v_shipping_cost_type = 'goalsquad' THEN 0
        ELSE SUM(msi.quantity_shipped * COALESCE(v_shipping_cost_per_unit, 0))
      END, 
      0
    ) as shipping_earnings,
    COALESCE(
      SUM(msi.quantity_shipped * COALESCE(v_storage_cost_per_unit, 0)) +
      SUM(msi.quantity_shipped * COALESCE(v_handling_cost_per_unit, 0)) +
      CASE 
        WHEN v_shipping_cost_type = 'goalsquad' THEN 0
        ELSE SUM(msi.quantity_shipped * COALESCE(v_shipping_cost_per_unit, 0))
      END,
      0
    ) as total_earnings
  FROM merchant_shipment_items msi
  JOIN merchant_shipments ms ON msi.shipment_id = ms.id
  WHERE ms.actual_ship_date >= p_period_start
    AND ms.actual_ship_date <= p_period_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create monthly earning records
CREATE OR REPLACE FUNCTION create_monthly_warehouse_earnings()
RETURNS VOID AS $$
DECLARE
  v_community RECORD;
  v_seller RECORD;
  v_period_start TIMESTAMP WITH TIME ZONE;
  v_period_end TIMESTAMP WITH TIME ZONE;
  v_earnings RECORD;
BEGIN
  -- Set period (previous month)
  v_period_start := date_trunc('month', NOW() - INTERVAL '1 month');
  v_period_end := date_trunc('month', NOW()) - INTERVAL '1 second';
  
  -- Process communities that are warehouse partners
  FOR v_community IN SELECT id FROM communities WHERE is_warehouse_partner = TRUE LOOP
    SELECT * INTO v_earnings FROM calculate_warehouse_earnings('community', v_community.id, v_period_start, v_period_end);
    
    INSERT INTO warehouse_partner_earnings (
      entity_type,
      entity_id,
      storage_earnings,
      handling_earnings,
      shipping_earnings,
      total_earnings,
      period_start,
      period_end,
      status
    ) VALUES (
      'community',
      v_community.id,
      v_earnings.storage_earnings,
      v_earnings.handling_earnings,
      v_earnings.shipping_earnings,
      v_earnings.total_earnings,
      v_period_start,
      v_period_end,
      'pending'
    ) ON CONFLICT DO NOTHING;
  END LOOP;
  
  -- Process sellers that are warehouse partners
  FOR v_seller IN SELECT id FROM profiles WHERE entity_type = 'seller' AND warehouse_config IS NOT NULL AND warehouse_config != '{}'::JSONB LOOP
    SELECT * INTO v_earnings FROM calculate_warehouse_earnings('seller', v_seller.id, v_period_start, v_period_end);
    
    INSERT INTO warehouse_partner_earnings (
      entity_type,
      entity_id,
      storage_earnings,
      handling_earnings,
      shipping_earnings,
      total_earnings,
      period_start,
      period_end,
      status
    ) VALUES (
      'seller',
      v_seller.id,
      v_earnings.storage_earnings,
      v_earnings.handling_earnings,
      v_earnings.shipping_earnings,
      v_earnings.total_earnings,
      v_period_start,
      v_period_end,
      'pending'
    ) ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add warehouse_config validation function
CREATE OR REPLACE FUNCTION validate_warehouse_config(p_config JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if required fields are present
  IF p_config IS NULL OR p_config = '{}'::JSONB THEN
    RETURN FALSE;
  END IF;
  
  -- Validate cost fields are non-negative
  IF (p_config->>'storage_cost_per_unit')::DECIMAL < 0 THEN
    RETURN FALSE;
  END IF;
  
  IF (p_config->>'handling_cost_per_unit')::DECIMAL < 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Validate shipping cost type
  IF NOT (p_config->>'shipping_cost_type' IN ('goalsquad', 'partner', 'hybrid')) THEN
    RETURN FALSE;
  END IF;
  
  -- If partner or hybrid, shipping cost must be set
  IF (p_config->>'shipping_cost_type') IN ('partner', 'hybrid') AND (p_config->>'shipping_cost_per_unit')::DECIMAL < 0 THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE 'Multi-role warehouse partners migration completed';
END $$;
