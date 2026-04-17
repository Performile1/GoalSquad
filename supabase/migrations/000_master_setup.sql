/**
 * ============================================
 * GOALSQUAD - COMPLETE MASTER MIGRATION
 * ============================================
 * 
 * This migration sets up the entire database in the correct order.
 * Run this in Supabase SQL Editor or via supabase db push.
 * 
 * ORDER:
 * 1. Extensions
 * 2. Organizations
 * 3. Profiles (extends auth.users)
 * 4. Communities
 * 5. Community Members & Invitations
 * 6. Merchants
 * 7. Products
 * 8. Product Categories
 * 9. Community Marketplace Products
 * 10. Seller Profiles & Achievements
 * 11. Warehouses & Inventory
 * 12. Orders & Shipments
 * 13. Messaging System
 * 14. Blog Posts
 * 15. Product Badges
 * 16. RLS Policies
 * ============================================
 */

-- ============================================
-- 1. EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- 2. ORGANIZATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS organizations (
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

CREATE INDEX IF NOT EXISTS idx_organizations_org_type ON organizations(org_type);
CREATE INDEX IF NOT EXISTS idx_organizations_country   ON organizations(country);
CREATE INDEX IF NOT EXISTS idx_organizations_status    ON organizations(status);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active" ON organizations;
DROP POLICY IF EXISTS "Service role full access" ON organizations;

CREATE POLICY "Public read active"
  ON organizations FOR SELECT
  USING (status = 'active');

CREATE POLICY "Service role full access"
  ON organizations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 3. PROFILES (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  phone VARCHAR(50),
  date_of_birth DATE,
  
  role VARCHAR(50) DEFAULT 'user',
  
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  
  language VARCHAR(10) DEFAULT 'sv',
  currency VARCHAR(3) DEFAULT 'SEK',
  timezone VARCHAR(50) DEFAULT 'Europe/Stockholm',
  
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(is_active) WHERE is_active = true;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. COMMUNITIES
-- ============================================
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  
  community_type VARCHAR(50) DEFAULT 'club',
  
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  status VARCHAR(50) DEFAULT 'active',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if they don't exist (for existing tables)
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS slug VARCHAR(255),
ADD COLUMN IF NOT EXISTS community_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS settings JSONB,
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS status VARCHAR(50);

-- Add constraints if they don't exist
DO $$
BEGIN
  ALTER TABLE communities ADD CONSTRAINT communities_slug_unique UNIQUE (slug);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE communities ADD CONSTRAINT communities_community_type_check CHECK (community_type IN ('club', 'class', 'association', 'school'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE communities ADD CONSTRAINT communities_status_check CHECK (status IN ('active', 'inactive', 'suspended'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_communities_slug ON communities(slug);
CREATE INDEX IF NOT EXISTS idx_communities_type ON communities(community_type);
CREATE INDEX IF NOT EXISTS idx_communities_org ON communities(organization_id);

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. COMMUNITY MEMBERS & INVITATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  role VARCHAR(50) DEFAULT 'member',
  status VARCHAR(50) DEFAULT 'active',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  seller_profile_id UUID,
  can_invite BOOLEAN DEFAULT false,
  can_post BOOLEAN DEFAULT true,
  can_sell BOOLEAN DEFAULT false,
  
  invited_by UUID REFERENCES profiles(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(community_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_members_community ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_role ON community_members(community_id, role);

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  invite_code VARCHAR(50) UNIQUE NOT NULL,
  
  role VARCHAR(50) DEFAULT 'member',
  status VARCHAR(50) DEFAULT 'pending',
          CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  
  invited_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);

ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. MERCHANTS
-- ============================================
CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  merchant_name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(2) NOT NULL,
  
  stripe_account_id VARCHAR(255),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  verification_status VARCHAR(50) DEFAULT 'pending',
  
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if they don't exist (for existing tables)
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS slug VARCHAR(255),
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255),
ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS country VARCHAR(2),
ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN,
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS settings JSONB,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add constraint if it doesn't exist
DO $$
BEGIN
  ALTER TABLE merchants ADD CONSTRAINT merchants_slug_unique UNIQUE (slug);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_merchants_slug ON merchants(slug);
CREATE INDEX IF NOT EXISTS idx_merchants_org ON merchants(organization_id);

ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. PRODUCTS
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  
  sku VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  price NUMERIC(10,2) NOT NULL CHECK (price > 0),
  compare_at_price NUMERIC(10,2),
  
  category_id UUID,
  
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  low_stock_threshold INTEGER DEFAULT 5,
  
  status VARCHAR(50) DEFAULT 'active'
          CHECK (status IN ('active', 'draft', 'archived')),
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_merchant ON products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. PRODUCT CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_categories_slug ON product_categories(slug);
CREATE INDEX IF NOT EXISTS idx_product_categories_parent ON product_categories(parent_id);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. COMMUNITY MARKETPLACE PRODUCTS
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
  updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Badge fields
  is_featured          BOOLEAN DEFAULT FALSE,
  is_discounted        BOOLEAN DEFAULT FALSE,
  discount_percent     NUMERIC(5,2) CHECK (discount_percent >= 0 AND discount_percent <= 100),
  sells_fast           BOOLEAN DEFAULT FALSE,
  low_stock_threshold  INTEGER DEFAULT 5
);

CREATE INDEX IF NOT EXISTS idx_community_products_status   ON community_products(status);
CREATE INDEX IF NOT EXISTS idx_community_products_category ON community_products(category);
CREATE INDEX IF NOT EXISTS idx_community_products_created  ON community_products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_products_featured ON community_products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_community_products_discounted ON community_products(is_discounted) WHERE is_discounted = TRUE;
CREATE INDEX IF NOT EXISTS idx_community_products_sells_fast ON community_products(sells_fast) WHERE sells_fast = TRUE;

ALTER TABLE community_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read approved"        ON community_products;
DROP POLICY IF EXISTS "Authenticated users can create" ON community_products;
DROP POLICY IF EXISTS "Sellers update own"          ON community_products;

CREATE POLICY "Public read approved"
  ON community_products FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Authenticated users can create"
  ON community_products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Sellers update own"
  ON community_products FOR UPDATE
  TO authenticated
  USING (contact_email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
  ));

-- ============================================
-- 10. SELLER PROFILES & ACHIEVEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS seller_profiles (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  bio TEXT,
  avatar_url TEXT,
  
  total_sales NUMERIC(10,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  
  commission_share_percent NUMERIC(5,2) DEFAULT 0,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seller_profiles_sales ON seller_profiles(total_sales DESC);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type VARCHAR(100) NOT NULL,
  achievement_data JSONB DEFAULT '{}',
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_type)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

CREATE TABLE IF NOT EXISTS avatar_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  item_type VARCHAR(50) NOT NULL,
  image_url TEXT,
  price NUMERIC(10,2) DEFAULT 0,
  
  requirements JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 11. WAREHOUSES & INVENTORY
-- ============================================
CREATE TABLE IF NOT EXISTS warehouse_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  partner_code VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  
  status VARCHAR(50) DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS warehouse_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouse_partners(id) ON DELETE CASCADE,
  
  quantity INTEGER DEFAULT 0 CHECK (quantity >= 0),
  reserved_quantity INTEGER DEFAULT 0 CHECK (reserved_quantity >= 0),
  
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(product_id, warehouse_id)
);

CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_product ON warehouse_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_warehouse ON warehouse_inventory(warehouse_id);

ALTER TABLE warehouse_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_inventory ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 12. ORDERS & SHIPMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  
  total_amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouse_partners(id),
  
  tracking_number VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_merchant ON orders(merchant_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 13. MESSAGING SYSTEM
-- ============================================
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conv ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 14. BLOG POSTS
-- ============================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  image_url TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can view all posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can insert posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can update posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can delete posts" ON blog_posts;

CREATE POLICY "Anyone can view published posts"
  ON blog_posts FOR SELECT
  USING (published = true);

CREATE POLICY "Admins can view all posts"
  ON blog_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert posts"
  ON blog_posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update posts"
  ON blog_posts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete posts"
  ON blog_posts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 15. ADDITIONAL TABLES (from codebase references)
-- ============================================

-- Product Flow Summary
CREATE TABLE IF NOT EXISTS product_flow_summary (
  product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  total_views INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_adds_to_cart INTEGER DEFAULT 0,
  total_purchases INTEGER DEFAULT 0,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  merchant_id UUID REFERENCES merchants(id),
  
  status VARCHAR(50) DEFAULT 'active',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Merchant Community Messages
CREATE TABLE IF NOT EXISTS merchant_community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  community_id UUID NOT NULL REFERENCES communities(id),
  
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_merchant_community_messages_merchant ON merchant_community_messages(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_community_messages_community ON merchant_community_messages(community_id);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(10,2) NOT NULL,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

ALTER TABLE product_flow_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 16. TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language plpgsql;

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_communities_updated_at ON communities;
CREATE TRIGGER update_communities_updated_at
  BEFORE UPDATE ON communities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_merchants_updated_at ON merchants;
CREATE TRIGGER update_merchants_updated_at
  BEFORE UPDATE ON merchants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_products_updated_at ON community_products;
CREATE TRIGGER update_community_products_updated_at
  BEFORE UPDATE ON community_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
