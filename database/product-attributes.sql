/**
 * Enhanced Product Attributes
 * 
 * Complete product information including:
 * - EAN/GS1 barcodes
 * - Physical attributes (weight, dimensions)
 * - Multiple images
 * - Rich metadata
 * - Contact information for all entities
 */

-- ============================================
-- 1. PRODUCT ATTRIBUTES
-- ============================================

-- Add comprehensive product fields
ALTER TABLE products
ADD COLUMN IF NOT EXISTS ean VARCHAR(13),              -- EAN-13 barcode
ADD COLUMN IF NOT EXISTS gs1_gtin VARCHAR(14),         -- GS1 GTIN-14
ADD COLUMN IF NOT EXISTS sku VARCHAR(100),             -- Merchant SKU
ADD COLUMN IF NOT EXISTS brand VARCHAR(255),           -- Brand name
ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(255),    -- Manufacturer

-- Physical attributes
ADD COLUMN IF NOT EXISTS weight_grams INTEGER,         -- Weight in grams
ADD COLUMN IF NOT EXISTS length_mm INTEGER,            -- Length in mm
ADD COLUMN IF NOT EXISTS width_mm INTEGER,             -- Width in mm
ADD COLUMN IF NOT EXISTS height_mm INTEGER,            -- Height in mm
ADD COLUMN IF NOT EXISTS volume_ml INTEGER,            -- Volume in ml

-- Product details
ADD COLUMN IF NOT EXISTS ingredients TEXT,             -- Ingredients list
ADD COLUMN IF NOT EXISTS allergens TEXT[],             -- Allergen warnings
ADD COLUMN IF NOT EXISTS nutritional_info JSONB,       -- Nutrition facts
ADD COLUMN IF NOT EXISTS country_of_origin VARCHAR(2), -- ISO country code
ADD COLUMN IF NOT EXISTS expiry_date DATE,             -- Best before date
ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100),    -- Batch/lot number

-- Packaging
ADD COLUMN IF NOT EXISTS package_type VARCHAR(100),    -- Box, bag, bottle, etc
ADD COLUMN IF NOT EXISTS units_per_package INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS recyclable BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS eco_friendly BOOLEAN DEFAULT false,

-- Certifications
ADD COLUMN IF NOT EXISTS certifications TEXT[],        -- Organic, Fairtrade, etc
ADD COLUMN IF NOT EXISTS age_restriction INTEGER,      -- Minimum age (18+, etc)

-- Additional metadata
ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}'::jsonb;  -- Flexible attributes

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_ean ON products(ean) WHERE ean IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_gs1 ON products(gs1_gtin) WHERE gs1_gtin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku, merchant_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);

-- ============================================
-- 2. PRODUCT IMAGES (Multiple per product)
-- ============================================

CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  alt_text TEXT,
  image_type VARCHAR(50) DEFAULT 'product', -- 'product', 'lifestyle', 'detail', 'packaging'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(product_id, is_primary);

-- ============================================
-- 3. CONTACT INFORMATION (All entities)
-- ============================================

CREATE TABLE IF NOT EXISTS contact_information (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Entity reference (polymorphic)
  entity_type VARCHAR(50) NOT NULL, -- 'merchant', 'community', 'seller', 'user'
  entity_id UUID NOT NULL,
  
  -- Contact details
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  website TEXT,
  
  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  postal_code VARCHAR(20),
  city VARCHAR(100),
  region VARCHAR(100),
  country VARCHAR(2), -- ISO country code
  
  -- Coordinates
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Social media
  facebook_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  linkedin_url TEXT,
  
  -- Business hours
  business_hours JSONB, -- {"monday": "09:00-17:00", ...}
  
  -- Additional info
  contact_person VARCHAR(255),
  contact_role VARCHAR(100),
  is_public BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT true,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_entity ON contact_information(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_contact_email ON contact_information(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_primary ON contact_information(entity_type, entity_id, is_primary) 
  WHERE is_primary = true;

-- ============================================
-- 4. PRODUCT MATCHING (Deduplication)
-- ============================================

-- Function to find similar products
CREATE OR REPLACE FUNCTION find_similar_products(
  search_name TEXT,
  search_ean VARCHAR(13) DEFAULT NULL,
  search_brand VARCHAR(255) DEFAULT NULL,
  similarity_threshold REAL DEFAULT 0.6
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  ean VARCHAR(13),
  brand VARCHAR(255),
  merchant_name TEXT,
  category_name TEXT,
  similarity_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.ean,
    p.brand,
    m.name as merchant_name,
    c.name as category_name,
    GREATEST(
      similarity(p.name, search_name),
      CASE WHEN p.brand IS NOT NULL AND search_brand IS NOT NULL 
           THEN similarity(p.brand, search_brand) * 0.5 
           ELSE 0 END
    ) as similarity_score
  FROM products p
  LEFT JOIN merchants m ON m.id = p.merchant_id
  LEFT JOIN product_categories c ON c.id = p.category_id
  WHERE 
    p.status = 'active'
    AND (
      -- Exact EAN match (highest priority)
      (search_ean IS NOT NULL AND p.ean = search_ean)
      OR
      -- Name similarity
      similarity(p.name, search_name) > similarity_threshold
      OR
      -- Brand + name combination
      (search_brand IS NOT NULL AND p.brand IS NOT NULL 
       AND similarity(p.brand || ' ' || p.name, search_brand || ' ' || search_name) > similarity_threshold)
    )
  ORDER BY 
    CASE WHEN p.ean = search_ean THEN 1 ELSE 0 END DESC,
    similarity_score DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Enable pg_trgm for similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- 5. CATEGORY SUGGESTIONS
-- ============================================

CREATE OR REPLACE FUNCTION suggest_product_category(
  product_name TEXT,
  product_description TEXT DEFAULT NULL
)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  category_slug TEXT,
  confidence_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.slug,
    GREATEST(
      similarity(c.name, product_name),
      CASE WHEN product_description IS NOT NULL 
           THEN similarity(c.name, product_description) * 0.7
           ELSE 0 END
    ) as confidence_score
  FROM product_categories c
  WHERE c.is_active = true
  ORDER BY confidence_score DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. VALIDATION FUNCTIONS
-- ============================================

-- Validate EAN-13 checksum
CREATE OR REPLACE FUNCTION validate_ean13(ean_code VARCHAR(13))
RETURNS BOOLEAN AS $$
DECLARE
  checksum INTEGER := 0;
  i INTEGER;
BEGIN
  IF LENGTH(ean_code) != 13 THEN
    RETURN FALSE;
  END IF;
  
  IF ean_code !~ '^[0-9]{13}$' THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate checksum
  FOR i IN 1..12 LOOP
    IF i % 2 = 1 THEN
      checksum := checksum + CAST(SUBSTRING(ean_code FROM i FOR 1) AS INTEGER);
    ELSE
      checksum := checksum + CAST(SUBSTRING(ean_code FROM i FOR 1) AS INTEGER) * 3;
    END IF;
  END LOOP;
  
  checksum := (10 - (checksum % 10)) % 10;
  
  RETURN checksum = CAST(SUBSTRING(ean_code FROM 13 FOR 1) AS INTEGER);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. RLS POLICIES
-- ============================================

-- Product images - public read
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read product images"
  ON product_images FOR SELECT
  USING (true);

CREATE POLICY "Merchants manage their product images"
  ON product_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_images.product_id
      AND p.merchant_id IN (
        SELECT merchant_id FROM merchant_users WHERE user_id = auth.uid()
      )
    )
  );

-- Contact information - controlled access
ALTER TABLE contact_information ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read public contacts"
  ON contact_information FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users read own entity contacts"
  ON contact_information FOR SELECT
  USING (
    (entity_type = 'user' AND entity_id = auth.uid())
    OR
    (entity_type = 'seller' AND entity_id = auth.uid())
    OR
    (entity_type = 'community' AND entity_id IN (
      SELECT community_id FROM community_members WHERE user_id = auth.uid()
    ))
    OR
    (entity_type = 'merchant' AND entity_id IN (
      SELECT merchant_id FROM merchant_users WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users manage own entity contacts"
  ON contact_information FOR ALL
  USING (
    (entity_type = 'user' AND entity_id = auth.uid())
    OR
    (entity_type = 'seller' AND entity_id = auth.uid())
    OR
    (entity_type = 'community' AND entity_id IN (
      SELECT community_id FROM community_members 
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    ))
    OR
    (entity_type = 'merchant' AND entity_id IN (
      SELECT merchant_id FROM merchant_users 
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    ))
  );

-- ============================================
-- 8. HELPER VIEWS
-- ============================================

-- Complete product view with all details
CREATE OR REPLACE VIEW products_complete AS
SELECT 
  p.*,
  c.name as category_name,
  c.slug as category_slug,
  m.name as merchant_name,
  m.logo_url as merchant_logo,
  COALESCE(
    (SELECT json_agg(
      json_build_object(
        'id', pi.id,
        'url', pi.image_url,
        'isPrimary', pi.is_primary,
        'type', pi.image_type,
        'order', pi.display_order
      ) ORDER BY pi.display_order
    )
    FROM product_images pi
    WHERE pi.product_id = p.id),
    '[]'::json
  ) as images
FROM products p
LEFT JOIN product_categories c ON c.id = p.category_id
LEFT JOIN merchants m ON m.id = p.merchant_id;

-- Grant permissions
GRANT SELECT ON products_complete TO authenticated, anon;
GRANT EXECUTE ON FUNCTION find_similar_products TO authenticated;
GRANT EXECUTE ON FUNCTION suggest_product_category TO authenticated;
GRANT EXECUTE ON FUNCTION validate_ean13 TO authenticated;

COMMENT ON TABLE product_images IS 'Multiple images per product with ordering';
COMMENT ON TABLE contact_information IS 'Contact details for all entity types';
COMMENT ON FUNCTION find_similar_products IS 'Find duplicate/similar products to prevent duplicates';
COMMENT ON FUNCTION suggest_product_category IS 'AI-assisted category suggestions';
