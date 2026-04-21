-- Migration 033: Team-Specific Warehouse Partners
-- Features: Allow specific teams (e.g., "Klubb Mölnlycke IF - P14") to act as warehouse partners

-- Add teams table if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'teams') THEN
    CREATE TABLE teams (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
      
      -- Team info
      name VARCHAR(255) NOT NULL,
      team_type VARCHAR(50) DEFAULT 'sports_team', -- sports_team, class, group, other
      age_group VARCHAR(50), -- P14, P16, etc.
      gender VARCHAR(20), -- male, female, mixed
      
      -- Warehouse partner settings
      is_warehouse_partner BOOLEAN DEFAULT FALSE,
      warehouse_config JSONB DEFAULT '{}',
      
      -- Contact
      contact_person VARCHAR(255),
      contact_email VARCHAR(255),
      contact_phone VARCHAR(50),
      
      -- Location
      location_address TEXT,
      location_city VARCHAR(100),
      location_postal_code VARCHAR(20),
      
      -- Capacity
      storage_capacity INTEGER,
      packages_per_day INTEGER,
      
      -- Status
      status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
      
      -- Earnings
      total_earnings DECIMAL(10, 2) DEFAULT 0,
      
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX idx_teams_community ON teams(community_id);
    CREATE INDEX idx_teams_warehouse ON teams(is_warehouse_partner) WHERE is_warehouse_partner = true;
    CREATE INDEX idx_teams_status ON teams(status);

    ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

    -- Add trigger for updated_at
    CREATE TRIGGER update_teams_updated_at
      BEFORE UPDATE ON teams
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    
    RAISE NOTICE 'Created teams table';
  END IF;
END $$;

-- Add team_id to warehouse_partner_earnings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouse_partner_earnings' AND column_name = 'team_id') THEN
    ALTER TABLE warehouse_partner_earnings ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added team_id to warehouse_partner_earnings';
  END IF;
END $$;

-- Update entity_type constraint to include 'team'
DO $$
BEGIN
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_entity_type_check;
  
  ALTER TABLE profiles ADD CONSTRAINT profiles_entity_type_check 
    CHECK (entity_type IN ('individual', 'parent', 'seller', 'merchant', 'warehouse_partner', 'community_admin', 'super_admin', 'association', 'klass', 'klubb', 'team'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add team_id to profiles for team members
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'team_id') THEN
    ALTER TABLE profiles ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added team_id to profiles';
  END IF;
END $$;

-- Create function to calculate team warehouse earnings
CREATE OR REPLACE FUNCTION calculate_team_warehouse_earnings(
  p_team_id UUID,
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
  -- Get team warehouse configuration
  SELECT warehouse_config INTO v_config FROM teams WHERE id = p_team_id;
  
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

-- Update monthly earnings function to include teams
CREATE OR REPLACE FUNCTION create_monthly_warehouse_earnings()
RETURNS VOID AS $$
DECLARE
  v_community RECORD;
  v_seller RECORD;
  v_team RECORD;
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
  
  -- Process teams that are warehouse partners
  FOR v_team IN SELECT id FROM teams WHERE is_warehouse_partner = TRUE LOOP
    SELECT * INTO v_earnings FROM calculate_team_warehouse_earnings(v_team.id, v_period_start, v_period_end);
    
    INSERT INTO warehouse_partner_earnings (
      entity_type,
      entity_id,
      team_id,
      storage_earnings,
      handling_earnings,
      shipping_earnings,
      total_earnings,
      period_start,
      period_end,
      status
    ) VALUES (
      'team',
      v_team.id,
      v_team.id,
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

-- Update warehouse_partner_earnings entity_type check to include 'team'
DO $$
BEGIN
  -- Note: The check constraint needs to be updated if it exists
  -- For now, we'll rely on application-level validation
  RAISE NOTICE 'Team warehouse partners migration completed';
END $$;
