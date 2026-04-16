/**
 * ============================================
 * GOALSQUAD - COMPLETE MASTER DATABASE SETUP
 * ============================================
 * 
 * Kör denna fil i Supabase SQL Editor för att sätta upp HELA databasen
 * 
 * INSTRUKTIONER:
 * 1. Gå till Supabase Dashboard → SQL Editor
 * 2. Klicka "New Query"
 * 3. Kopiera HELA denna fil
 * 4. Klistra in och klicka "Run"
 * 5. Vänta ~30-60 sekunder
 * 6. Verifiera att allt kördes utan errors
 * 
 * ORDNING:
 * 1. Extensions
 * 2. Organizations (new)
 * 3. Core Tables (profiles, merchants, products, communities)
 * 4. Product Attributes & Categories
 * 5. MOQ & Warehouses
 * 6. Product Flow Tracking
 * 7. Community Marketplace Products (new)
 * 8. Community Members & Invitations
 * 9. Messaging System
 * 10. Merchant Branding
 * 11. Community Logos
 * 12. Security (RLS)
 * 13. Functions & Triggers
 * 14. Sample Data
 * 
 * ============================================
 */

-- ============================================
-- 1. EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- För geografiska beräkningar
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- För similarity search

-- ============================================
-- 2. ORGANIZATIONS (NEW)
-- ============================================

-- Create organizations table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'organizations') THEN
    CREATE TABLE organizations (
      id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name                 VARCHAR(255) NOT NULL,
      org_type             VARCHAR(50) NOT NULL DEFAULT 'hub'
                           CHECK (org_type IN ('hub', 'merchant', 'warehouse')),
      country              VARCHAR(2) NOT NULL,
      city                 VARCHAR(255),
      postal_code          VARCHAR(20),
      address              TEXT,
      phone                VARCHAR(50),
      email                VARCHAR(255),
      logo_url             TEXT,
      status               VARCHAR(30) NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active', 'inactive', 'suspended')),
      metadata             JSONB DEFAULT '{}',
      created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- Add columns if they don't exist
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS org_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS country VARCHAR(2),
ADD COLUMN IF NOT EXISTS city VARCHAR(255),
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(30),
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- Add constraints if they don't exist
DO $$
BEGIN
  ALTER TABLE organizations ADD CONSTRAINT organizations_org_type_check CHECK (org_type IN ('hub', 'merchant', 'warehouse'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE organizations ADD CONSTRAINT organizations_status_check CHECK (status IN ('active', 'inactive', 'suspended'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_org_type ON organizations(org_type);
CREATE INDEX IF NOT EXISTS idx_organizations_country   ON organizations(country);
CREATE INDEX IF NOT EXISTS idx_organizations_status    ON organizations(status);

-- RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read active organizations"
    ON organizations FOR SELECT
    USING (status = 'active');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access"
    ON organizations FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 3. CORE TABLES
-- ============================================

-- Users/Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  phone VARCHAR(50),
  date_of_birth DATE,
  
  -- Role
  role VARCHAR(50) DEFAULT 'user', -- 'user', 'seller', 'admin', 'merchant'
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  
  -- Preferences
  language VARCHAR(10) DEFAULT 'sv',
  currency VARCHAR(3) DEFAULT 'SEK',
  timezone VARCHAR(50) DEFAULT 'Europe/Stockholm',
  
  -- Notifications
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(is_active) WHERE is_active = true;

-- Create merchants table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'merchants') THEN
    CREATE TABLE merchants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID,
      user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      merchant_name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      logo_url TEXT,
      banner_url TEXT,
      
      -- Contact
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      
      -- Address
      address_line1 VARCHAR(255),
      address_line2 VARCHAR(255),
      city VARCHAR(100),
      postal_code VARCHAR(20),
      country VARCHAR(2) NOT NULL,
      
      -- Business
      stripe_account_id VARCHAR(255),
      onboarding_completed BOOLEAN DEFAULT FALSE,
      verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
      
      -- Settings
      settings JSONB DEFAULT '{}',
      metadata JSONB DEFAULT '{}',
      
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- Add columns if they don't exist
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS organization_id UUID,
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS merchant_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS slug VARCHAR(255),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255),
ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS country VARCHAR(2),
ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN,
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS settings JSONB,
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- Add unique constraint on slug if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'merchants_slug_key'
    AND conrelid = 'merchants'::regclass
  ) THEN
    ALTER TABLE merchants ADD CONSTRAINT merchants_slug_key UNIQUE (slug);
  END IF;
END $$;

-- Add foreign key constraint if organizations table has id column
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'id') THEN
    ALTER TABLE merchants ADD CONSTRAINT merchants_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_merchants_org ON merchants(organization_id);
CREATE INDEX IF NOT EXISTS idx_merchants_user ON merchants(user_id);
CREATE INDEX IF NOT EXISTS idx_merchants_slug ON merchants(slug);
CREATE INDEX IF NOT EXISTS idx_merchants_stripe ON merchants(stripe_account_id);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  
  -- Identification
  sku VARCHAR(100) NOT NULL,
  ean VARCHAR(13), -- GS1 EAN-13 barcode
  gtin VARCHAR(14), -- GS1 GTIN-14 (for cases/pallets)
  
  -- Basic info
  name VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  brand VARCHAR(255),
  
  -- Pricing
  base_price DECIMAL(10, 2) NOT NULL, -- Merchant's base price
  retail_price DECIMAL(10, 2) NOT NULL, -- Recommended retail price
  currency VARCHAR(3) DEFAULT 'NOK',
  
  -- GS1 Physical Dimensions (for shipping matrix)
  weight_grams INTEGER,
  length_mm INTEGER,
  width_mm INTEGER,
  height_mm INTEGER,
  
  -- Inventory
  stock_quantity INTEGER DEFAULT 0,
  stock_location VARCHAR(255),
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'archived')),
  
  -- Media
  images JSONB DEFAULT '[]',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(merchant_id, sku)
);

-- Create communities table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'communities') THEN
    CREATE TABLE communities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      type TEXT CHECK (type IN ('sports', 'school', 'nonprofit', 'other')),
      logo_url TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      address TEXT,
      city TEXT,
      postal_code TEXT,
      country TEXT DEFAULT 'SE',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- Add columns if they don't exist
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS organization_id UUID,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- Add unique constraint on slug if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'communities_slug_key'
    AND conrelid = 'communities'::regclass
  ) THEN
    ALTER TABLE communities ADD CONSTRAINT communities_slug_key UNIQUE (slug);
  END IF;
END $$;

-- Add foreign key constraint if organizations table has id column
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'id') THEN
    ALTER TABLE communities ADD CONSTRAINT communities_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Community Members
CREATE TABLE IF NOT EXISTS community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'guardian', 'seller', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- Create orders table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'orders') THEN
    CREATE TABLE orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_number VARCHAR(50) UNIQUE NOT NULL,
      
      -- Customer
      customer_id UUID REFERENCES auth.users(id),
      customer_email VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50),
      
      -- Shipping address
      shipping_name VARCHAR(255) NOT NULL,
      shipping_address_line1 VARCHAR(255) NOT NULL,
      shipping_address_line2 VARCHAR(255),
      shipping_city VARCHAR(100) NOT NULL,
      shipping_postal_code VARCHAR(20) NOT NULL,
      shipping_country VARCHAR(2) NOT NULL,
      
      -- Billing address
      billing_name VARCHAR(255),
      billing_address_line1 VARCHAR(255),
      billing_address_line2 VARCHAR(255),
      billing_city VARCHAR(100),
      billing_postal_code VARCHAR(20),
      billing_country VARCHAR(2),
      
      -- Financials
      subtotal DECIMAL(10, 2) NOT NULL,
      shipping_total DECIMAL(10, 2) NOT NULL,
      tax_total DECIMAL(10, 2) NOT NULL,
      total DECIMAL(10, 2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'NOK',
      
      -- Payment
      stripe_payment_intent_id VARCHAR(255),
      payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed', 'refunded')),
      paid_at TIMESTAMP WITH TIME ZONE,
      
      -- Order status
      status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
      
      -- Metadata
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- Add columns if they don't exist
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS customer_id UUID,
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS shipping_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS shipping_address_line1 VARCHAR(255),
ADD COLUMN IF NOT EXISTS shipping_address_line2 VARCHAR(255),
ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS shipping_postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS shipping_country VARCHAR(2),
ADD COLUMN IF NOT EXISTS billing_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS billing_address_line1 VARCHAR(255),
ADD COLUMN IF NOT EXISTS billing_address_line2 VARCHAR(255),
ADD COLUMN IF NOT EXISTS billing_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS billing_postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS billing_country VARCHAR(2),
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS shipping_total DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS tax_total DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS total DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS currency VARCHAR(3),
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status VARCHAR(50),
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- Add unique constraint on order_number if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orders_order_number_key'
    AND conrelid = 'orders'::regclass
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);
  END IF;
END $$;

-- Add foreign key constraint if auth.users table has id column
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'id') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  merchant_id UUID REFERENCES merchants(id),
  
  -- Product snapshot (at time of order)
  sku VARCHAR(100) NOT NULL,
  name VARCHAR(500) NOT NULL,
  
  -- Pricing
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  merchant_base_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  
  -- Margins
  sales_margin DECIMAL(10, 2) DEFAULT 0,
  handling_fee DECIMAL(10, 2) DEFAULT 0,
  
  -- Physical attributes
  weight_grams INTEGER,
  length_mm INTEGER,
  width_mm INTEGER,
  height_mm INTEGER,
  
  -- Fulfillment
  fulfillment_status VARCHAR(50) DEFAULT 'pending' CHECK (fulfillment_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. PRODUCT ATTRIBUTES & CATEGORIES
-- ============================================

-- Add product attributes
ALTER TABLE products
ADD COLUMN IF NOT EXISTS ean VARCHAR(13),
ADD COLUMN IF NOT EXISTS gs1_gtin VARCHAR(14),
ADD COLUMN IF NOT EXISTS brand VARCHAR(255),
ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(255),
ADD COLUMN IF NOT EXISTS weight_grams INTEGER,
ADD COLUMN IF NOT EXISTS length_mm INTEGER,
ADD COLUMN IF NOT EXISTS width_mm INTEGER,
ADD COLUMN IF NOT EXISTS height_mm INTEGER,
ADD COLUMN IF NOT EXISTS volume_ml INTEGER,
ADD COLUMN IF NOT EXISTS ingredients TEXT,
ADD COLUMN IF NOT EXISTS allergens TEXT[],
ADD COLUMN IF NOT EXISTS nutritional_info JSONB,
ADD COLUMN IF NOT EXISTS country_of_origin VARCHAR(2),
ADD COLUMN IF NOT EXISTS expiry_date DATE,
ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS package_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS units_per_package INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS recyclable BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS eco_friendly BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS certifications TEXT[],
ADD COLUMN IF NOT EXISTS age_restriction INTEGER,
ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_ean ON products(ean) WHERE ean IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_gs1 ON products(gs1_gtin) WHERE gs1_gtin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku, merchant_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);

-- Create product_categories table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'product_categories') THEN
    CREATE TABLE product_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      parent_id UUID REFERENCES product_categories(id),
      icon_emoji TEXT,
      display_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- Add columns if they don't exist
ALTER TABLE product_categories
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS parent_id UUID,
ADD COLUMN IF NOT EXISTS icon_emoji TEXT,
ADD COLUMN IF NOT EXISTS display_order INTEGER,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN,
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- Add unique constraint on slug if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'product_categories_slug_key'
    AND conrelid = 'product_categories'::regclass
  ) THEN
    ALTER TABLE product_categories ADD CONSTRAINT product_categories_slug_key UNIQUE (slug);
  END IF;
END $$;

-- Add category to products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS category_id UUID,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Add foreign key constraint if product_categories table has id column
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'product_categories' AND column_name = 'id') THEN
    ALTER TABLE products ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES product_categories(id);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create indexes for search
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON product_categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON product_categories(parent_id);

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

-- Insert default categories
INSERT INTO product_categories (name, slug, icon_emoji, display_order) VALUES
  ('Choklad & Godis', 'choklad-godis', '🍫', 1),
  ('Hälsoprodukter', 'halsa', '💊', 2),
  ('Hushåll', 'hushall', '🏠', 3),
  ('Presenter & Gåvor', 'presenter', '🎁', 4),
  ('Sport & Fritid', 'sport', '⚽', 5),
  ('Skola & Kontor', 'skola', '📚', 6),
  ('Mat & Dryck', 'mat-dryck', '🍽️', 7),
  ('Trädgård', 'tradgard', '🌱', 8),
  ('Övrigt', 'ovrigt', '📦', 99)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 5. MOQ & WAREHOUSES
-- ============================================

-- Add MOQ fields to products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS minimum_order_quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS moq_unit VARCHAR(50) DEFAULT 'pieces',
ADD COLUMN IF NOT EXISTS moq_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS moq_discount_percentage DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS allow_partial_orders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS consolidation_required BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_moq ON products(moq_enabled) WHERE moq_enabled = true;

-- Consolidation Warehouses
CREATE TABLE IF NOT EXISTS consolidation_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Warehouse info
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  warehouse_type VARCHAR(50) DEFAULT 'consolidation',
  
  -- Location
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  postal_code VARCHAR(20) NOT NULL,
  city VARCHAR(100) NOT NULL,
  region VARCHAR(100),
  country VARCHAR(2) DEFAULT 'SE',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Coverage
  postal_code_ranges TEXT[],
  coverage_radius_km INTEGER,
  
  -- Capacity
  max_capacity_m3 DECIMAL(10,2),
  current_utilization_m3 DECIMAL(10,2) DEFAULT 0,
  max_daily_orders INTEGER,
  
  -- Operating hours
  operating_hours JSONB,
  processing_days INTEGER DEFAULT 2,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  accepts_new_orders BOOLEAN DEFAULT true,
  
  -- Contact
  contact_person VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warehouses_postal ON consolidation_warehouses(postal_code);
CREATE INDEX IF NOT EXISTS idx_warehouses_active ON consolidation_warehouses(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_warehouses_country ON consolidation_warehouses(country);

-- Order Aggregations (Pre-orders waiting for MOQ)
CREATE TABLE IF NOT EXISTS order_aggregations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Product & Merchant
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES consolidation_warehouses(id),
  
  -- Aggregation period
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE,
  
  -- Quantities
  target_quantity INTEGER NOT NULL,
  current_quantity INTEGER DEFAULT 0,
  pending_orders INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(50) DEFAULT 'collecting',
  moq_reached_at TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aggregations_product ON order_aggregations(product_id);
CREATE INDEX IF NOT EXISTS idx_aggregations_status ON order_aggregations(status);
CREATE INDEX IF NOT EXISTS idx_aggregations_warehouse ON order_aggregations(warehouse_id);

-- Pending MOQ Orders
CREATE TABLE IF NOT EXISTS pending_moq_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Order reference
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
  aggregation_id UUID REFERENCES order_aggregations(id),
  
  -- Product & quantity
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  
  -- Customer
  user_id UUID REFERENCES profiles(id),
  
  -- Delivery
  delivery_postal_code VARCHAR(20) NOT NULL,
  assigned_warehouse_id UUID REFERENCES consolidation_warehouses(id),
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  estimated_ship_date DATE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_orders_product ON pending_moq_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_pending_orders_user ON pending_moq_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_orders_warehouse ON pending_moq_orders(assigned_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_pending_orders_status ON pending_moq_orders(status);

-- Shipments
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  shipment_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Origin & Destination
  origin_hub_id UUID REFERENCES consolidation_warehouses(id),
  origin_merchant_id UUID REFERENCES merchants(id),
  destination_address JSONB NOT NULL,
  
  -- Routing
  route_type VARCHAR(50),
  consolidation_hub_id UUID REFERENCES consolidation_warehouses(id),
  lastmile_hub_id UUID REFERENCES consolidation_warehouses(id),
  
  -- Carrier
  carrier_name VARCHAR(100),
  carrier_service VARCHAR(100),
  tracking_number VARCHAR(255),
  tracking_url TEXT,
  
  -- Shipping costs
  carrier_cost DECIMAL(10, 2),
  customer_cost DECIMAL(10, 2),
  shipping_spread DECIMAL(10, 2),
  
  -- Physical
  total_weight_grams INTEGER,
  package_count INTEGER DEFAULT 1,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  
  -- Timestamps
  picked_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);

-- ============================================
-- 6. PRODUCT FLOW TRACKING
-- ============================================

-- Warehouse Inventory
CREATE TABLE IF NOT EXISTS warehouse_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID REFERENCES consolidation_warehouses(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
  last_restocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(warehouse_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_warehouse ON warehouse_inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_product ON warehouse_inventory(product_id);

-- Merchant Shipments (från företag till lager)
CREATE TABLE IF NOT EXISTS merchant_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES consolidation_warehouses(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  tracking_number TEXT,
  estimated_arrival DATE,
  actual_arrival DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Merchant Shipment Items
CREATE TABLE IF NOT EXISTS merchant_shipment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID REFERENCES merchant_shipments(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Warehouse Allocations (från lager till kund)
CREATE TABLE IF NOT EXISTS warehouse_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID REFERENCES consolidation_warehouses(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'allocated',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. COMMUNITY MARKETPLACE PRODUCTS (NEW)
-- ============================================

CREATE TABLE IF NOT EXISTS community_products (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                VARCHAR(255) NOT NULL,
  description          TEXT NOT NULL,
  price                NUMERIC(10,2) NOT NULL CHECK (price > 0),
  category             VARCHAR(50) NOT NULL DEFAULT 'other',
  seller_type          VARCHAR(20) NOT NULL DEFAULT 'individual'
                         CHECK (seller_type IN ('community', 'class', 'individual')),
  seller_name          VARCHAR(255) NOT NULL,
  community_name       VARCHAR(255),
  location             VARCHAR(255),
  stock                INTEGER NOT NULL DEFAULT 1 CHECK (stock >= 0),
  shipping_info        TEXT NOT NULL,
  contact_email        VARCHAR(255) NOT NULL,
  image_urls           TEXT[] DEFAULT '{}',
  platform_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 12.00,
  status               VARCHAR(30) NOT NULL DEFAULT 'pending_review'
                         CHECK (status IN ('pending_review', 'approved', 'rejected', 'sold_out', 'removed')),
  rejection_reason     TEXT,
  approved_at          TIMESTAMP WITH TIME ZONE,
  approved_by          UUID REFERENCES auth.users(id),
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_community_products_status   ON community_products(status);
CREATE INDEX IF NOT EXISTS idx_community_products_category ON community_products(category);
CREATE INDEX IF NOT EXISTS idx_community_products_created  ON community_products(created_at DESC);

-- RLS
ALTER TABLE community_products ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read approved"
    ON community_products FOR SELECT
    USING (status = 'approved');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can create"
    ON community_products FOR INSERT
    TO authenticated
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Sellers update own"
    ON community_products FOR UPDATE
    TO authenticated
    USING (contact_email = (SELECT email FROM profiles WHERE id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 8. COMMUNITY MEMBERS & INVITATIONS
-- ============================================

-- Invitations
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who & Where
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Invitee
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  
  -- Invitation details
  role VARCHAR(50) DEFAULT 'member',
  message TEXT,
  token VARCHAR(255) UNIQUE NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID REFERENCES profiles(id),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_community ON invitations(community_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status) WHERE status = 'pending';

-- Seller Profiles
CREATE TABLE IF NOT EXISTS seller_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  
  -- Level system
  current_level INTEGER DEFAULT 1,
  total_sales DECIMAL(10,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  role VARCHAR(50) DEFAULT 'seller',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, community_id)
);

CREATE INDEX IF NOT EXISTS idx_seller_profiles_user ON seller_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_community ON seller_profiles(community_id);

-- ============================================
-- 9. MESSAGING SYSTEM
-- ============================================

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('direct', 'community', 'broadcast')),
  community_id UUID REFERENCES communities(id),
  name TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_conversations_community ON conversations(community_id);
CREATE INDEX idx_conversations_type ON conversations(conversation_type);

-- Conversation Participants
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  muted BOOLEAN DEFAULT FALSE,
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_conv_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_conv_participants_user ON conversation_participants(user_id);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  reply_to_id UUID REFERENCES messages(id),
  edited_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- Message Reads
CREATE TABLE IF NOT EXISTS message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX idx_message_reads_message ON message_reads(message_id);
CREATE INDEX idx_message_reads_user ON message_reads(user_id);

-- Broadcast Messages
CREATE TABLE IF NOT EXISTS broadcast_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('gs_admin', 'merchant', 'community_admin')),
  sender_id UUID REFERENCES profiles(id),
  target_type TEXT NOT NULL CHECK (target_type IN ('all_users', 'community', 'role')),
  target_id UUID,
  target_role TEXT,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  metadata JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_broadcast_sender ON broadcast_messages(sender_id);
CREATE INDEX idx_broadcast_target ON broadcast_messages(target_type, target_id);
CREATE INDEX idx_broadcast_sent ON broadcast_messages(sent_at DESC);

-- Broadcast Recipients
CREATE TABLE IF NOT EXISTS broadcast_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID REFERENCES broadcast_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(broadcast_id, user_id)
);

CREATE INDEX idx_broadcast_recipients_broadcast ON broadcast_recipients(broadcast_id);
CREATE INDEX idx_broadcast_recipients_user ON broadcast_recipients(user_id);

-- Merchant-Community Messages
CREATE TABLE IF NOT EXISTS merchant_community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id),
  community_id UUID REFERENCES communities(id),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'announcement' CHECK (message_type IN ('announcement', 'offer', 'update')),
  metadata JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_merchant_messages_merchant ON merchant_community_messages(merchant_id);
CREATE INDEX idx_merchant_messages_community ON merchant_community_messages(community_id);

-- ============================================
-- 10. MERCHANT BRANDING
-- ============================================

ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS logo_square_url TEXT,
ADD COLUMN IF NOT EXISTS logo_horizontal_url TEXT,
ADD COLUMN IF NOT EXISTS brand_colors JSONB DEFAULT '{"primary": "#0ea5e9", "secondary": "#06b6d4"}',
ADD COLUMN IF NOT EXISTS company_description TEXT,
ADD COLUMN IF NOT EXISTS founded_year INTEGER,
ADD COLUMN IF NOT EXISTS employee_count VARCHAR(50),
ADD COLUMN IF NOT EXISTS annual_revenue VARCHAR(50),
ADD COLUMN IF NOT EXISTS company_registration VARCHAR(100),
ADD COLUMN IF NOT EXISTS vat_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- Merchant Contacts
CREATE TABLE IF NOT EXISTS merchant_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  
  is_primary BOOLEAN DEFAULT false,
  is_billing_contact BOOLEAN DEFAULT false,
  is_technical_contact BOOLEAN DEFAULT false,
  is_sales_contact BOOLEAN DEFAULT false,
  
  photo_url TEXT,
  bio TEXT,
  linkedin_url TEXT,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_contacts_merchant ON merchant_contacts(merchant_id);

-- Merchant Certifications
CREATE TABLE IF NOT EXISTS merchant_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  
  certification_type VARCHAR(100) NOT NULL,
  certification_name TEXT NOT NULL,
  issuing_organization VARCHAR(255),
  certificate_number VARCHAR(100),
  issue_date DATE,
  expiry_date DATE,
  certificate_url TEXT,
  
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_certifications_merchant ON merchant_certifications(merchant_id);

-- ============================================
-- 11. COMMUNITY LOGOS
-- ============================================

ALTER TABLE communities
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS logo_banner_url TEXT,
ADD COLUMN IF NOT EXISTS logo_icon_url TEXT,
ADD COLUMN IF NOT EXISTS brand_colors JSONB DEFAULT '{"primary": "#0ea5e9", "secondary": "#06b6d4"}',
ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_communities_homepage 
ON communities(show_on_homepage) 
WHERE show_on_homepage = true;

-- ============================================
-- 12. INDEXES (Performance)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_merchant ON products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_ean ON products(ean);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_merchant ON order_items(merchant_id);

CREATE INDEX IF NOT EXISTS idx_community_members_community ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_role ON community_members(community_id, role);

-- ============================================
-- 13. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE consolidation_warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_moq_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_certifications ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Merchants
CREATE POLICY "Merchants are viewable by everyone"
  ON merchants FOR SELECT
  USING (true);

CREATE POLICY "Merchants can update own data"
  ON merchants FOR UPDATE
  USING (user_id = auth.uid());

-- Products
CREATE POLICY "Active products are viewable by everyone"
  ON products FOR SELECT
  USING (status = 'active');

CREATE POLICY "Merchants can manage own products"
  ON products FOR ALL
  USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
  );

-- Communities
CREATE POLICY "Communities are viewable by everyone"
  ON communities FOR SELECT
  USING (true);

CREATE POLICY "Community admins can update"
  ON communities FOR UPDATE
  USING (
    id IN (SELECT community_id FROM community_members WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Community Members
CREATE POLICY "Members can view community members"
  ON community_members FOR SELECT
  USING (
    community_id IN (
      SELECT community_id FROM community_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage members"
  ON community_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE user_id = auth.uid()
        AND community_id = community_members.community_id
        AND role IN ('admin', 'moderator')
    )
  );

-- Orders
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- Order Items
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
  );

-- Warehouses
CREATE POLICY "Warehouses are viewable by everyone"
  ON consolidation_warehouses FOR SELECT
  USING (is_active = true);

-- Warehouse Inventory
CREATE POLICY "Warehouse inventory is viewable by everyone"
  ON warehouse_inventory FOR SELECT
  USING (true);

-- Conversations
CREATE POLICY conversations_access ON conversations
  FOR SELECT
  USING (
    id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY participants_access ON conversation_participants
  FOR SELECT
  USING (user_id = auth.uid());

-- Messages
CREATE POLICY messages_access ON messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
    AND deleted_at IS NULL
  );

CREATE POLICY messages_insert ON messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Invitations
CREATE POLICY invitations_access ON invitations
  FOR SELECT
  USING (
    email = (SELECT email FROM profiles WHERE id = auth.uid())
    OR invited_by = auth.uid()
  );

-- Seller Profiles
CREATE POLICY seller_profiles_own ON seller_profiles
  FOR ALL
  USING (user_id = auth.uid());

-- Merchant Contacts
CREATE POLICY "Public read merchant contacts"
  ON merchant_contacts FOR SELECT
  USING (true);

CREATE POLICY "Merchants manage their contacts"
  ON merchant_contacts FOR ALL
  USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
  );

-- Merchant Certifications
CREATE POLICY "Public read merchant certifications"
  ON merchant_certifications FOR SELECT
  USING (is_active = true);

CREATE POLICY "Merchants manage their certifications"
  ON merchant_certifications FOR ALL
  USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
  );

-- ============================================
-- 14. FUNCTIONS & TRIGGERS
-- ============================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_merchants_updated_at ON merchants;
CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_order_items_updated_at ON order_items;
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shipments_updated_at ON shipments;
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_communities_updated_at ON communities;
CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON communities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to find nearest warehouse
CREATE OR REPLACE FUNCTION find_nearest_warehouse(
  p_postal_code VARCHAR(20),
  p_country VARCHAR(2) DEFAULT 'SE'
)
RETURNS UUID AS $$
DECLARE
  v_warehouse_id UUID;
  v_postal_prefix VARCHAR(3);
BEGIN
  v_postal_prefix := SUBSTRING(p_postal_code FROM 1 FOR 3);
  
  SELECT id INTO v_warehouse_id
  FROM consolidation_warehouses
  WHERE is_active = true
    AND accepts_new_orders = true
    AND country = p_country
    AND (
      EXISTS (
        SELECT 1 FROM unnest(postal_code_ranges) AS range
        WHERE p_postal_code ~ ('^' || SPLIT_PART(range, '-', 1))
      )
      OR SUBSTRING(postal_code FROM 1 FOR 3) = v_postal_prefix
    )
  ORDER BY 
    CASE WHEN postal_code = p_postal_code THEN 1 ELSE 2 END,
    (max_capacity_m3 - current_utilization_m3) DESC
  LIMIT 1;
  
  IF v_warehouse_id IS NULL THEN
    SELECT id INTO v_warehouse_id
    FROM consolidation_warehouses
    WHERE is_active = true
      AND accepts_new_orders = true
      AND country = p_country
    ORDER BY 
      ABS(CAST(SUBSTRING(postal_code FROM 1 FOR 3) AS INTEGER) - CAST(v_postal_prefix AS INTEGER))
    LIMIT 1;
  END IF;
  
  RETURN v_warehouse_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get featured communities
CREATE OR REPLACE FUNCTION get_featured_communities()
RETURNS TABLE (
  id UUID,
  name TEXT,
  logo_url TEXT,
  logo_banner_url TEXT,
  city TEXT,
  country TEXT,
  total_members INTEGER,
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
    0 as total_members,
    c.type as community_type
  FROM communities c
  WHERE c.show_on_homepage = true
    AND c.logo_url IS NOT NULL
  ORDER BY c.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_featured_communities() TO authenticated, anon;

-- ============================================
-- 15. SAMPLE DATA
-- ============================================

-- Sample Warehouses
INSERT INTO consolidation_warehouses (name, address, city, postal_code, latitude, longitude, postal_code_ranges) VALUES
  ('Stockholm Lager', 'Logistikvägen 1', 'Stockholm', '12345', 59.3293, 18.0686, ARRAY['10000-19999']),
  ('Göteborg Lager', 'Hamnvägen 5', 'Göteborg', '41101', 57.7089, 11.9746, ARRAY['40000-49999']),
  ('Malmö Lager', 'Industrivägen 10', 'Malmö', '21115', 55.6050, 13.0038, ARRAY['20000-29999'])
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 16. VERIFICATION
-- ============================================

-- Show created tables
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================
-- SETUP COMPLETE! ✅
-- ============================================
