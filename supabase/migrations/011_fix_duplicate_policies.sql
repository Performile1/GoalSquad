-- Fix duplicate policies error
-- Migration: 011_fix_duplicate_policies.sql

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated to view active discount codes" ON discount_codes;
DROP POLICY IF EXISTS "Allow service role full access" ON discount_codes;
DROP POLICY IF EXISTS "Allow sellers to view their auctions" ON product_auctions;
DROP POLICY IF EXISTS "Allow community members to view community auctions" ON product_auctions;
DROP POLICY IF EXISTS "Allow service role full access" ON product_auctions;

-- Recreate policies with IF NOT EXISTS
CREATE POLICY IF NOT EXISTS "Allow authenticated to view active discount codes"
  ON discount_codes FOR SELECT
  USING (is_active = true);

CREATE POLICY IF NOT EXISTS "Allow service role full access"
  ON discount_codes FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Allow sellers to view their auctions"
  ON product_auctions FOR SELECT
  USING (seller_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Allow community members to view community auctions"
  ON product_auctions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM communities c
      WHERE c.id = product_auctions.community_id
      AND c.id IN (
        SELECT community_id FROM community_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY IF NOT EXISTS "Allow service role full access"
  ON product_auctions FOR ALL
  USING (auth.role() = 'service_role');
