-- Migration 028: Ad System Enhancements
-- Features: Rotation, daily/total limits, internal/external links, buttons

-- Add new columns to ads table
ALTER TABLE ads
  ADD COLUMN IF NOT EXISTS placement_type TEXT DEFAULT 'rotating' CHECK (placement_type IN ('fixed', 'rotating')),
  ADD COLUMN IF NOT EXISTS daily_view_limit INTEGER DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS daily_views_today INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_views_reset_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS is_daily_limit_reached BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS link_type TEXT DEFAULT 'external' CHECK (link_type IN ('internal', 'external')),
  ADD COLUMN IF NOT EXISTS internal_link_path TEXT,
  ADD COLUMN IF NOT EXISTS button_config JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS auto_restart_next_day BOOLEAN DEFAULT TRUE;

-- Add new columns to ad_placements table
ALTER TABLE ad_placements
  ADD COLUMN IF NOT EXISTS rotation_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create function to reset daily views
CREATE OR REPLACE FUNCTION reset_daily_ad_views()
RETURNS VOID AS $$
BEGIN
  UPDATE ads
  SET 
    daily_views_today = 0,
    daily_views_reset_date = CURRENT_DATE,
    is_daily_limit_reached = FALSE
  WHERE 
    daily_views_reset_date < CURRENT_DATE
    AND auto_restart_next_day = TRUE
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Create function to check and enforce daily limits
CREATE OR REPLACE FUNCTION check_daily_ad_limits()
RETURNS VOID AS $$
BEGIN
  UPDATE ads
  SET 
    is_daily_limit_reached = TRUE,
    status = 'paused'
  WHERE 
    daily_views_today >= daily_view_limit
    AND status = 'active'
    AND is_daily_limit_reached = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create function to check and enforce total limits
CREATE OR REPLACE FUNCTION check_total_ad_limits()
RETURNS VOID AS $$
BEGIN
  UPDATE ads
  SET status = 'completed'
  WHERE 
    (total_views > 0 AND total_views <= views)
    OR (total_days > 0 AND CURRENT_DATE > (created_at + (total_days || ' days')::INTERVAL))
    AND status IN ('active', 'paused');
END;
$$ LANGUAGE plpgsql;

-- Create function to get active ads for a placement (handles rotation)
CREATE OR REPLACE FUNCTION get_active_ads_for_placement(p_placement_id UUID)
RETURNS TABLE (
  ad_id UUID,
  image_url TEXT,
  link_url TEXT,
  link_type TEXT,
  internal_link_path TEXT,
  button_config JSONB
) AS $$
BEGIN
  -- First reset daily views if needed
  PERFORM reset_daily_ad_views();
  
  -- Check limits
  PERFORM check_daily_ad_limits();
  PERFORM check_total_ad_limits();
  
  -- Return ads based on placement type
  RETURN QUERY
  SELECT 
    a.id,
    a.image_url,
    a.link_url,
    a.link_type,
    a.internal_link_path,
    a.button_config
  FROM ads a
  JOIN ad_placements ap ON a.id = ap.ad_id
  WHERE 
    ap.placement_id = p_placement_id
    AND ap.is_active = TRUE
    AND a.status = 'active'
    AND a.is_daily_limit_reached = FALSE
  ORDER BY 
    CASE 
      WHEN a.placement_type = 'fixed' THEN 0
      ELSE ap.rotation_order
    END;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies for new columns
DROP POLICY IF EXISTS ads_update_policy ON ads;
CREATE POLICY ads_update_policy ON ads
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = merchant_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    auth.uid() = merchant_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create index for rotation queries
CREATE INDEX IF NOT EXISTS idx_ads_placement_type ON ads(placement_type);
CREATE INDEX IF NOT EXISTS idx_ads_daily_limit ON ads(daily_view_limit, daily_views_today);
CREATE INDEX IF NOT EXISTS idx_ad_placements_rotation ON ad_placements(placement_id, rotation_order, is_active);

DO $$
BEGIN
  RAISE NOTICE 'Ad system enhancements created successfully';
END $$;
