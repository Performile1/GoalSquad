-- Discount Codes System
-- Migration: 010_discount_codes.sql

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- discount_codes table
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  
  -- Discount type and value
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
  
  -- Purchase requirements
  min_purchase_amount DECIMAL(12, 2) DEFAULT NULL,
  max_discount_amount DECIMAL(12, 2) DEFAULT NULL,
  
  -- Validity period
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  
  -- Usage limits
  usage_limit INTEGER DEFAULT NULL CHECK (usage_limit > 0 OR usage_limit IS NULL),
  times_used INTEGER DEFAULT 0,
  
  -- Customer targeting
  customer_id UUID DEFAULT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID DEFAULT NULL REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_customer_id ON discount_codes(customer_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_discount_codes_validity ON discount_codes(valid_from, valid_until);

-- RLS
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY IF NOT EXISTS "Allow authenticated to view active discount codes"
  ON discount_codes FOR SELECT
  USING (is_active = true);

CREATE POLICY IF NOT EXISTS "Allow service role full access"
  ON discount_codes FOR ALL
  USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_discount_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER discount_codes_updated_at
  BEFORE UPDATE ON discount_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_discount_codes_updated_at();

-- Auction/Pricing Model Table
CREATE TABLE IF NOT EXISTS product_auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  
  -- Pricing model
  pricing_model VARCHAR(20) NOT NULL CHECK (pricing_model IN ('fixed', 'auction', 'offer')),
  
  -- Fixed price (for fixed model)
  fixed_price DECIMAL(12, 2) DEFAULT NULL,
  
  -- Auction settings
  starting_bid DECIMAL(12, 2) DEFAULT NULL,
  reserve_price DECIMAL(12, 2) DEFAULT NULL,
  current_bid DECIMAL(12, 2) DEFAULT NULL,
  current_bidder_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Offer settings (for offer model - customer suggests price)
  min_offer_price DECIMAL(12, 2) DEFAULT NULL,
  
  -- Commission settings (seller can adjust what association/seller gets)
  seller_commission_percentage DECIMAL(5, 2) DEFAULT NULL, -- Percentage seller keeps
  community_commission_percentage DECIMAL(5, 2) DEFAULT NULL, -- Percentage community gets
  
  -- Auction timeline
  auction_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  auction_end TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'cancelled', 'sold')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_auctions_product_id ON product_auctions(product_id);
CREATE INDEX IF NOT EXISTS idx_product_auctions_seller_id ON product_auctions(seller_id);
CREATE INDEX IF NOT EXISTS idx_product_auctions_community_id ON product_auctions(community_id);
CREATE INDEX IF NOT EXISTS idx_product_auctions_status ON product_auctions(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_product_auctions_timeline ON product_auctions(auction_start, auction_end);

-- RLS
ALTER TABLE product_auctions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_auctions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER product_auctions_updated_at
  BEFORE UPDATE ON product_auctions
  FOR EACH ROW
  EXECUTE FUNCTION update_product_auctions_updated_at();

-- Function to validate and use discount code
CREATE OR REPLACE FUNCTION use_discount_code(
  p_code VARCHAR,
  p_customer_id UUID,
  p_purchase_amount DECIMAL
)
RETURNS TABLE(
  success BOOLEAN,
  discount_type VARCHAR,
  discount_value DECIMAL,
  discount_amount DECIMAL,
  message TEXT
) AS $$
DECLARE
  v_discount RECORD;
  v_discount_amount DECIMAL(12, 2);
  v_final_discount_amount DECIMAL(12, 2);
BEGIN
  -- Find valid discount code
  SELECT * INTO v_discount
  FROM discount_codes
  WHERE code = p_code
    AND is_active = TRUE
    AND (valid_from <= NOW() OR valid_from IS NULL)
    AND (valid_until >= NOW() OR valid_until IS NULL)
    AND (customer_id = p_customer_id OR customer_id IS NULL)
    AND (usage_limit IS NULL OR times_used < usage_limit);
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::VARCHAR, NULL::DECIMAL, NULL::DECIMAL, 'Ogiltig rabattkod'::TEXT;
    RETURN;
  END IF;
  
  -- Check minimum purchase amount
  IF v_discount.min_purchase_amount IS NOT NULL AND p_purchase_amount < v_discount.min_purchase_amount THEN
    RETURN QUERY SELECT FALSE, v_discount.discount_type, v_discount.discount_value, NULL::DECIMAL, 
      ('Minimiköp: ' || v_discount.min_purchase_amount || ' kr')::TEXT;
    RETURN;
  END IF;
  
  -- Calculate discount amount
  IF v_discount.discount_type = 'percentage' THEN
    v_discount_amount := p_purchase_amount * (v_discount.discount_value / 100);
  ELSE
    v_discount_amount := v_discount.discount_value;
  END IF;
  
  -- Apply max discount limit
  IF v_discount.max_discount_amount IS NOT NULL AND v_discount_amount > v_discount.max_discount_amount THEN
    v_final_discount_amount := v_discount.max_discount_amount;
  ELSE
    v_final_discount_amount := v_discount_amount;
  END IF;
  
  -- Increment usage count
  UPDATE discount_codes
  SET times_used = times_used + 1
  WHERE id = v_discount.id;
  
  RETURN QUERY SELECT TRUE, v_discount.discount_type, v_discount.discount_value, v_final_discount_amount, 'Rabattkod applicerad'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
