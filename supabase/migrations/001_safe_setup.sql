/**
 * ============================================
 * GOALSQUAD - SAFE DATABASE SETUP
 * ============================================
 * 
 * This migration safely sets up the database by checking if tables/columns exist first.
 * Run this in Supabase SQL Editor.
 * 
 * This approach:
 * 1. Checks if tables exist before creating
 * 2. Checks if columns exist before adding
 * 3. Handles all error cases gracefully
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
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'organizations') THEN
    CREATE TABLE organizations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      org_type VARCHAR(50) NOT NULL DEFAULT 'hub',
      country VARCHAR(2) NOT NULL,
      city VARCHAR(255),
      postal_code VARCHAR(20),
      address TEXT,
      phone VARCHAR(50),
      email VARCHAR(255),
      logo_url TEXT,
      status VARCHAR(30) NOT NULL DEFAULT 'active',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- Add columns to organizations if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'org_type') THEN
    ALTER TABLE organizations ADD COLUMN org_type VARCHAR(50) DEFAULT 'hub';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'status') THEN
    ALTER TABLE organizations ADD COLUMN status VARCHAR(30) DEFAULT 'active';
  END IF;
END $$;

-- Add constraints
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

CREATE INDEX IF NOT EXISTS idx_organizations_org_type ON organizations(org_type);
CREATE INDEX IF NOT EXISTS idx_organizations_country ON organizations(country);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);

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
-- 3. PROFILES
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'profiles') THEN
    CREATE TABLE profiles (
      id UUID PRIMARY KEY,
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
    
    -- Add foreign key constraint
    ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add columns to profiles if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE profiles ADD COLUMN role VARCHAR(50) DEFAULT 'user';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') THEN
    ALTER TABLE profiles ADD COLUMN status VARCHAR(50);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(is_active) WHERE is_active = true;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. COMMUNITIES
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'communities') THEN
    CREATE TABLE communities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      logo_url TEXT,
      banner_url TEXT,
      community_type VARCHAR(50) DEFAULT 'club',
      organization_id UUID,
      settings JSONB DEFAULT '{}',
      metadata JSONB DEFAULT '{}',
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- Add columns to communities if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'slug') THEN
    ALTER TABLE communities ADD COLUMN slug VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'community_type') THEN
    ALTER TABLE communities ADD COLUMN community_type VARCHAR(50) DEFAULT 'club';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'status') THEN
    ALTER TABLE communities ADD COLUMN status VARCHAR(50) DEFAULT 'active';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'organization_id') THEN
    ALTER TABLE communities ADD COLUMN organization_id UUID;
  END IF;
END $$;

-- Add foreign key constraint
DO $$
BEGIN
  ALTER TABLE communities ADD CONSTRAINT communities_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add constraints
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
-- 5. COMMUNITY MEMBERS
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'community_members') THEN
    CREATE TABLE community_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      community_id UUID NOT NULL,
      user_id UUID NOT NULL,
      role VARCHAR(50) DEFAULT 'member',
      status VARCHAR(50) DEFAULT 'active',
      joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      seller_profile_id UUID,
      can_invite BOOLEAN DEFAULT false,
      can_post BOOLEAN DEFAULT true,
      can_sell BOOLEAN DEFAULT false,
      invited_by UUID,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(community_id, user_id)
    );
  END IF;
END $$;

-- Add foreign keys
DO $$
BEGIN
  ALTER TABLE community_members ADD CONSTRAINT community_members_community_id_fkey FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE community_members ADD CONSTRAINT community_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE community_members ADD CONSTRAINT community_members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES profiles(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_community_members_community ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_role ON community_members(community_id, role);

ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. MERCHANTS
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'merchants') THEN
    CREATE TABLE merchants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID,
      user_id UUID,
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
  END IF;
END $$;

-- Add columns to merchants if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'slug') THEN
    ALTER TABLE merchants ADD COLUMN slug VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'organization_id') THEN
    ALTER TABLE merchants ADD COLUMN organization_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'user_id') THEN
    ALTER TABLE merchants ADD COLUMN user_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'country') THEN
    ALTER TABLE merchants ADD COLUMN country VARCHAR(2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'stripe_account_id') THEN
    ALTER TABLE merchants ADD COLUMN stripe_account_id VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'onboarding_completed') THEN
    ALTER TABLE merchants ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'verification_status') THEN
    ALTER TABLE merchants ADD COLUMN verification_status VARCHAR(50) DEFAULT 'pending';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'settings') THEN
    ALTER TABLE merchants ADD COLUMN settings JSONB DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'metadata') THEN
    ALTER TABLE merchants ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;

-- Add foreign keys
DO $$
BEGIN
  ALTER TABLE merchants ADD CONSTRAINT merchants_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE merchants ADD CONSTRAINT merchants_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add constraint
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
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'products') THEN
    CREATE TABLE products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      merchant_id UUID NOT NULL,
      sku VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      price NUMERIC(10,2) NOT NULL CHECK (price > 0),
      compare_at_price NUMERIC(10,2),
      category_id UUID,
      stock INTEGER DEFAULT 0 CHECK (stock >= 0),
      low_stock_threshold INTEGER DEFAULT 5,
      status VARCHAR(50) DEFAULT 'active',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- Add foreign key
DO $$
BEGIN
  ALTER TABLE products ADD CONSTRAINT products_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_merchant ON products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. COMMUNITY PRODUCTS
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'community_products') THEN
    CREATE TABLE community_products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      price NUMERIC(10,2) NOT NULL CHECK (price > 0),
      category VARCHAR(50) NOT NULL DEFAULT 'other',
      seller_type VARCHAR(20) NOT NULL DEFAULT 'individual',
      seller_name VARCHAR(255) NOT NULL,
      community_name VARCHAR(255),
      location VARCHAR(255),
      stock INTEGER NOT NULL DEFAULT 1 CHECK (stock >= 0),
      shipping_info TEXT NOT NULL,
      contact_email VARCHAR(255) NOT NULL,
      image_urls TEXT[] DEFAULT '{}',
      platform_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 12.00,
      status VARCHAR(30) NOT NULL DEFAULT 'pending_review',
      rejection_reason TEXT,
      approved_at TIMESTAMP WITH TIME ZONE,
      approved_by UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- Add badge columns to community_products if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_products' AND column_name = 'is_featured') THEN
    ALTER TABLE community_products ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_products' AND column_name = 'is_discounted') THEN
    ALTER TABLE community_products ADD COLUMN is_discounted BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_products' AND column_name = 'discount_percent') THEN
    ALTER TABLE community_products ADD COLUMN discount_percent NUMERIC(5,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_products' AND column_name = 'sells_fast') THEN
    ALTER TABLE community_products ADD COLUMN sells_fast BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_products' AND column_name = 'low_stock_threshold') THEN
    ALTER TABLE community_products ADD COLUMN low_stock_threshold INTEGER DEFAULT 5;
  END IF;
END $$;

-- Add foreign key
DO $$
BEGIN
  ALTER TABLE community_products ADD CONSTRAINT community_products_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add constraints
DO $$
BEGIN
  ALTER TABLE community_products ADD CONSTRAINT community_products_seller_type_check CHECK (seller_type IN ('community', 'class', 'individual'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE community_products ADD CONSTRAINT community_products_status_check CHECK (status IN ('pending_review', 'approved', 'rejected', 'sold_out', 'removed'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE community_products ADD CONSTRAINT community_products_discount_percent_check CHECK (discount_percent >= 0 AND discount_percent <= 100);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_community_products_status ON community_products(status);
CREATE INDEX IF NOT EXISTS idx_community_products_category ON community_products(category);
CREATE INDEX IF NOT EXISTS idx_community_products_created ON community_products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_products_featured ON community_products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_community_products_discounted ON community_products(is_discounted) WHERE is_discounted = TRUE;
CREATE INDEX IF NOT EXISTS idx_community_products_sells_fast ON community_products(sells_fast) WHERE sells_fast = TRUE;

ALTER TABLE community_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read approved" ON community_products;
DROP POLICY IF EXISTS "Authenticated users can create" ON community_products;
DROP POLICY IF EXISTS "Sellers update own" ON community_products;

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
-- 9. BLOG POSTS
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'blog_posts') THEN
    CREATE TABLE blog_posts (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      excerpt TEXT,
      image_url TEXT,
      published BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      author_id UUID
    );
  END IF;
END $$;

-- Add foreign key
DO $$
BEGIN
  ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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
-- 10. TRIGGER FOR UPDATED_AT
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
