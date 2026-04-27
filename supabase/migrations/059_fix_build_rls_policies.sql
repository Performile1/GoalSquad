-- Fix RLS policies for build-time data fetching
-- These policies allow public reads for build-time static page generation

-- Enable RLS on tables that might be accessed during build
ALTER TABLE ad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Add policies for public reads (for build-time static generation)
DROP POLICY IF EXISTS "Public read for build" ON ad_placements;
CREATE POLICY "Public read for build" ON ad_placements
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public read for build" ON communities;
CREATE POLICY "Public read for build" ON communities
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public read for build" ON merchants;
CREATE POLICY "Public read for build" ON merchants
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public read for build" ON warehouse_inventory;
CREATE POLICY "Public read for build" ON warehouse_inventory
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public read for build" ON products;
CREATE POLICY "Public read for build" ON products
  FOR SELECT
  TO anon, authenticated
  USING (true);
