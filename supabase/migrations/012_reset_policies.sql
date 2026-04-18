-- Reset and recreate policies safely
-- Migration: 012_reset_policies.sql

-- Only create discount_codes policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'discount_codes'
    AND policyname = 'Allow authenticated to view active discount codes'
  ) THEN
    CREATE POLICY "Allow authenticated to view active discount codes"
      ON discount_codes FOR SELECT
      USING (is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'discount_codes'
    AND policyname = 'Allow service role full access'
  ) THEN
    CREATE POLICY "Allow service role full access"
      ON discount_codes FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Only handle product_auctions if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_auctions' AND table_schema = 'public') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'product_auctions'
      AND policyname = 'Allow sellers to view their auctions'
    ) THEN
      CREATE POLICY "Allow sellers to view their auctions"
        ON product_auctions FOR SELECT
        USING (seller_id = auth.uid());
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'product_auctions'
      AND policyname = 'Allow community members to view community auctions'
    ) THEN
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
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'product_auctions'
      AND policyname = 'Allow service role full access'
    ) THEN
      CREATE POLICY "Allow service role full access"
        ON product_auctions FOR ALL
        USING (auth.role() = 'service_role');
    END IF;
  END IF;
END $$;
