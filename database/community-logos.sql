/**
 * Community Logos & Branding
 * 
 * Adds logo upload functionality for communities
 * Supports multiple logo variants (primary, banner, icon)
 */

-- Add logo fields to communities table
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS logo_banner_url TEXT,
ADD COLUMN IF NOT EXISTS logo_icon_url TEXT,
ADD COLUMN IF NOT EXISTS brand_colors JSONB DEFAULT '{"primary": "#0ea5e9", "secondary": "#06b6d4"}'::jsonb,
ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN DEFAULT false;

-- Create index for homepage featured communities
CREATE INDEX IF NOT EXISTS idx_communities_homepage 
ON communities(show_on_homepage) 
WHERE show_on_homepage = true;

-- RLS: Community admins can update logos
CREATE POLICY community_admins_update_logos ON communities
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM seller_profiles sp
      WHERE sp.community_id = communities.id
        AND sp.user_id = auth.uid()
        AND sp.role IN ('community_admin', 'community_owner')
    )
  );

-- Function to get featured communities for homepage
CREATE OR REPLACE FUNCTION get_featured_communities()
RETURNS TABLE (
  id UUID,
  name TEXT,
  logo_url TEXT,
  logo_banner_url TEXT,
  city TEXT,
  country TEXT,
  total_members INTEGER,
  total_sales DECIMAL,
  community_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.logo_url,
    c.logo_banner_url,
    c.city,
    c.country,
    c.total_members,
    c.total_sales,
    c.community_type
  FROM communities c
  WHERE c.show_on_homepage = true
    AND c.logo_url IS NOT NULL
  ORDER BY c.total_sales DESC, c.total_members DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_featured_communities() TO authenticated, anon;

COMMENT ON COLUMN communities.logo_url IS 'Primary logo (square, 500x500px recommended)';
COMMENT ON COLUMN communities.logo_banner_url IS 'Banner logo (wide, 1200x300px recommended)';
COMMENT ON COLUMN communities.logo_icon_url IS 'Icon logo (square, 128x128px recommended)';
COMMENT ON COLUMN communities.brand_colors IS 'Brand color palette (primary, secondary)';
COMMENT ON COLUMN communities.show_on_homepage IS 'Display in homepage banner carousel';
