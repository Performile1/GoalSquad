-- Add badge fields to community_products table
ALTER TABLE community_products
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_discounted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) CHECK (discount_percent >= 0 AND discount_percent <= 100),
ADD COLUMN IF NOT EXISTS sells_fast BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;

-- Create index for featured products
CREATE INDEX IF NOT EXISTS idx_community_products_featured ON community_products(is_featured) WHERE is_featured = TRUE;

-- Create index for discounted products
CREATE INDEX IF NOT EXISTS idx_community_products_discounted ON community_products(is_discounted) WHERE is_discounted = TRUE;

-- Create index for fast-selling products
CREATE INDEX IF NOT EXISTS idx_community_products_sells_fast ON community_products(sells_fast) WHERE sells_fast = TRUE;
