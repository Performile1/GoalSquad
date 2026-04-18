-- Reset and recreate policies safely
-- Migration: 012_reset_policies.sql

-- Drop all existing policies from both tables
DROP POLICY IF EXISTS "Allow authenticated to view active discount codes" ON discount_codes;
DROP POLICY IF EXISTS "Allow service role full access" ON discount_codes;

-- Recreate discount_codes policies
CREATE POLICY "Allow authenticated to view active discount codes"
  ON discount_codes FOR SELECT
  USING (is_active = true);

CREATE POLICY "Allow service role full access"
  ON discount_codes FOR ALL
  USING (auth.role() = 'service_role');

-- Only handle product_auctions if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_auctions' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Allow sellers to view their auctions" ON product_auctions;
    DROP POLICY IF EXISTS "Allow community members to view community auctions" ON product_auctions;
    DROP POLICY IF EXISTS "Allow service role full access" ON product_auctions;

    CREATE POLICY "Allow sellers to view their auctions"
      ON product_auctions FOR SELECT
      USING (seller_id = auth.uid());

    CREATE POLICY "Allow community members to view community auctions"
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

    CREATE POLICY "Allow service role full access"
      ON product_auctions FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;
