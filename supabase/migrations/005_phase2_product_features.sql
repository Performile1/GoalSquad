/**
 * ============================================
 * GOALSQUAD - PHASE 2 PRODUCT FEATURES
 * ============================================
 * 
 * This migration adds product-related features:
 * 1. product_categories search features (search_vector, tags)
 * 2. product_attributes to products table
 * 3. MOQ features to products table
 * 4. merchant_contacts table
 * 5. merchant_branding fields to merchants table
 * 6. community_logo fields to communities table
 * 
 * This migration uses defensive SQL to handle existing tables gracefully.
 * ============================================
 */

-- ============================================
-- 1. PRODUCT CATEGORIES TABLE
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'product_categories') THEN
    CREATE TABLE product_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      parent_id UUID REFERENCES product_categories(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      icon VARCHAR(100),
      color VARCHAR(7),
      sort_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX idx_product_categories_parent ON product_categories(parent_id);
    CREATE INDEX idx_product_categories_slug ON product_categories(slug);
    CREATE INDEX idx_product_categories_active ON product_categories(is_active) WHERE is_active = true;

    ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

    -- Add trigger for updated_at
    CREATE TRIGGER update_product_categories_updated_at
      BEFORE UPDATE ON product_categories
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- 2. PRODUCT CATEGORIES SEARCH FEATURES
-- ============================================

-- Add category_id, tags, search_vector to products if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'category_id') THEN
    ALTER TABLE products ADD COLUMN category_id UUID REFERENCES product_categories(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'tags') THEN
    ALTER TABLE products ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'search_vector') THEN
    ALTER TABLE products ADD COLUMN search_vector tsvector;
  END IF;
END $$;

-- Create indexes for search
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING GIN(search_vector);

-- Full-text search trigger
CREATE OR REPLACE FUNCTION products_search_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('swedish', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('swedish', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('swedish', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_search_update ON products;
CREATE TRIGGER products_search_update
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION products_search_trigger();

-- ============================================
-- 2. PRODUCT ATTRIBUTES
-- ============================================

-- Add product attribute columns to products table
DO $$
BEGIN
  -- EAN/GS1 barcodes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'ean') THEN
    ALTER TABLE products ADD COLUMN ean VARCHAR(13);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'gs1_gtin') THEN
    ALTER TABLE products ADD COLUMN gs1_gtin VARCHAR(14);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sku') THEN
    ALTER TABLE products ADD COLUMN sku VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'brand') THEN
    ALTER TABLE products ADD COLUMN brand VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'manufacturer') THEN
    ALTER TABLE products ADD COLUMN manufacturer VARCHAR(255);
  END IF;

  -- Physical attributes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'weight_grams') THEN
    ALTER TABLE products ADD COLUMN weight_grams INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'length_mm') THEN
    ALTER TABLE products ADD COLUMN length_mm INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'width_mm') THEN
    ALTER TABLE products ADD COLUMN width_mm INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'height_mm') THEN
    ALTER TABLE products ADD COLUMN height_mm INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'volume_ml') THEN
    ALTER TABLE products ADD COLUMN volume_ml INTEGER;
  END IF;

  -- Product details
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'ingredients') THEN
    ALTER TABLE products ADD COLUMN ingredients TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'allergens') THEN
    ALTER TABLE products ADD COLUMN allergens TEXT[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'nutritional_info') THEN
    ALTER TABLE products ADD COLUMN nutritional_info JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'country_of_origin') THEN
    ALTER TABLE products ADD COLUMN country_of_origin VARCHAR(2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'expiry_date') THEN
    ALTER TABLE products ADD COLUMN expiry_date DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'batch_number') THEN
    ALTER TABLE products ADD COLUMN batch_number VARCHAR(100);
  END IF;

  -- Packaging
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'package_type') THEN
    ALTER TABLE products ADD COLUMN package_type VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'units_per_package') THEN
    ALTER TABLE products ADD COLUMN units_per_package INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'recyclable') THEN
    ALTER TABLE products ADD COLUMN recyclable BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'eco_friendly') THEN
    ALTER TABLE products ADD COLUMN eco_friendly BOOLEAN DEFAULT false;
  END IF;

  -- Certifications
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'certifications') THEN
    ALTER TABLE products ADD COLUMN certifications TEXT[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'age_restriction') THEN
    ALTER TABLE products ADD COLUMN age_restriction INTEGER;
  END IF;

  -- Additional metadata
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'attributes') THEN
    ALTER TABLE products ADD COLUMN attributes JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- ============================================
-- 3. MOQ FEATURES
-- ============================================

-- Add MOQ columns to products table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'minimum_order_quantity') THEN
    ALTER TABLE products ADD COLUMN minimum_order_quantity INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'moq_unit') THEN
    ALTER TABLE products ADD COLUMN moq_unit VARCHAR(50) DEFAULT 'pieces';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'moq_enabled') THEN
    ALTER TABLE products ADD COLUMN moq_enabled BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'moq_discount_percentage') THEN
    ALTER TABLE products ADD COLUMN moq_discount_percentage DECIMAL(5,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'allow_partial_orders') THEN
    ALTER TABLE products ADD COLUMN allow_partial_orders BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'consolidation_required') THEN
    ALTER TABLE products ADD COLUMN consolidation_required BOOLEAN DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_moq ON products(moq_enabled) WHERE moq_enabled = true;

-- ============================================
-- 4. MERCHANT CONTACTS TABLE
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'merchant_contacts') THEN
    CREATE TABLE merchant_contacts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
      
      -- Person info
      full_name VARCHAR(255) NOT NULL,
      role VARCHAR(100),
      email VARCHAR(255),
      phone VARCHAR(50),
      mobile VARCHAR(50),
      
      -- Responsibilities
      is_primary BOOLEAN DEFAULT false,
      is_billing_contact BOOLEAN DEFAULT false,
      is_technical_contact BOOLEAN DEFAULT false,
      is_sales_contact BOOLEAN DEFAULT false,
      
      -- Additional
      photo_url TEXT,
      bio TEXT,
      linkedin_url TEXT,
      
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_merchant_contacts_merchant ON merchant_contacts(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_contacts_primary ON merchant_contacts(is_primary) WHERE is_primary = true;

ALTER TABLE merchant_contacts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. MERCHANT BRANDING FIELDS
-- ============================================

-- Add branding fields to merchants table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'logo_url') THEN
    ALTER TABLE merchants ADD COLUMN logo_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'logo_square_url') THEN
    ALTER TABLE merchants ADD COLUMN logo_square_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'logo_horizontal_url') THEN
    ALTER TABLE merchants ADD COLUMN logo_horizontal_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'brand_colors') THEN
    ALTER TABLE merchants ADD COLUMN brand_colors JSONB DEFAULT '{"primary": "#0ea5e9", "secondary": "#06b6d4"}'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'company_description') THEN
    ALTER TABLE merchants ADD COLUMN company_description TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'founded_year') THEN
    ALTER TABLE merchants ADD COLUMN founded_year INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'employee_count') THEN
    ALTER TABLE merchants ADD COLUMN employee_count VARCHAR(50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'annual_revenue') THEN
    ALTER TABLE merchants ADD COLUMN annual_revenue VARCHAR(50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'company_registration') THEN
    ALTER TABLE merchants ADD COLUMN company_registration VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'vat_number') THEN
    ALTER TABLE merchants ADD COLUMN vat_number VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'website_url') THEN
    ALTER TABLE merchants ADD COLUMN website_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'linkedin_url') THEN
    ALTER TABLE merchants ADD COLUMN linkedin_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'facebook_url') THEN
    ALTER TABLE merchants ADD COLUMN facebook_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'instagram_url') THEN
    ALTER TABLE merchants ADD COLUMN instagram_url TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_merchants_logo ON merchants(logo_url) WHERE logo_url IS NOT NULL;

-- ============================================
-- 6. COMMUNITY LOGO FIELDS
-- ============================================

-- Add logo fields to communities table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'logo_url') THEN
    ALTER TABLE communities ADD COLUMN logo_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'logo_banner_url') THEN
    ALTER TABLE communities ADD COLUMN logo_banner_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'logo_icon_url') THEN
    ALTER TABLE communities ADD COLUMN logo_icon_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'brand_colors') THEN
    ALTER TABLE communities ADD COLUMN brand_colors JSONB DEFAULT '{"primary": "#0ea5e9", "secondary": "#06b6d4"}'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'show_on_homepage') THEN
    ALTER TABLE communities ADD COLUMN show_on_homepage BOOLEAN DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_communities_homepage 
ON communities(show_on_homepage) 
WHERE show_on_homepage = true;

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================

-- Add updated_at trigger for merchant_contacts
DROP TRIGGER IF EXISTS update_merchant_contacts_updated_at ON merchant_contacts;
CREATE TRIGGER update_merchant_contacts_updated_at
  BEFORE UPDATE ON merchant_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
