-- ============================================
-- CREATE PRODUCT AUCTIONS TABLE
-- ============================================
-- This migration creates the missing product_auctions table
-- as defined in 010_discount_codes.sql

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'product_auctions') THEN
    CREATE TABLE product_auctions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
      
      -- Auction type
      auction_type VARCHAR(20) NOT NULL DEFAULT 'auction' CHECK (auction_type IN ('auction', 'offer', 'fixed')),
      
      -- Pricing
      starting_price DECIMAL(10, 2) NOT NULL CHECK (starting_price >= 0),
      current_bid DECIMAL(10, 2) DEFAULT NULL,
      buy_now_price DECIMAL(10, 2) DEFAULT NULL,
      minimum_bid_increment DECIMAL(10, 2) DEFAULT 1.00 CHECK (minimum_bid_increment > 0),
      
      -- Commission settings
      commission_percent DECIMAL(5, 2) DEFAULT 12.00 CHECK (commission_percent >= 0 AND commission_percent <= 100),
      platform_fee_fixed DECIMAL(10, 2) DEFAULT 0.00 CHECK (platform_fee_fixed >= 0),
      
      -- Auction timeline
      auction_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      auction_end TIMESTAMP WITH TIME ZONE DEFAULT NULL,
      
      -- Status
      status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'cancelled', 'sold')),
      
      -- Metadata
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    RAISE NOTICE 'product_auctions table created';
  ELSE
    RAISE NOTICE 'product_auctions table already exists';
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_auctions_product_id ON product_auctions(product_id);
CREATE INDEX IF NOT EXISTS idx_product_auctions_seller_id ON product_auctions(seller_id);
CREATE INDEX IF NOT EXISTS idx_product_auctions_community_id ON product_auctions(community_id);
CREATE INDEX IF NOT EXISTS idx_product_auctions_status ON product_auctions(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_product_auctions_timeline ON product_auctions(auction_start, auction_end);

-- RLS
ALTER TABLE product_auctions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow sellers to view their auctions" ON product_auctions;
DROP POLICY IF EXISTS "Allow community members to view community auctions" ON product_auctions;
DROP POLICY IF EXISTS "Allow service role full access" ON product_auctions;

-- RLS Policies
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
  TO service_role
  USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_auctions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS product_auctions_updated_at ON product_auctions;

-- Trigger for updated_at
CREATE TRIGGER product_auctions_updated_at
  BEFORE UPDATE ON product_auctions
  FOR EACH ROW
  EXECUTE FUNCTION update_product_auctions_updated_at();
