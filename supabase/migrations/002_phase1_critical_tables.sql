/**
 * ============================================
 * GOALSQUAD - PHASE 1 CRITICAL TABLES
 * ============================================
 * 
 * This migration adds critical tables that are referenced in the codebase
 * but missing from the current database.
 * 
 * Tables added:
 * 1. seller_profiles - Seller gamification & shop data
 * 2. warehouse_partners - 3PL warehouse partners
 * 3. warehouse_inventory - Warehouse inventory tracking
 * 4. consolidation_warehouses - Consolidation warehouses
 * 5. product_flow_summary - Product flow tracking summary
 * 6. orders - Customer orders
 * 7. order_items - Order line items
 * 8. conversations - Messaging conversations
 * 9. merchant_community_messages - Merchant to community messages
 * 10. invitations - Community invitations
 * 
 * This migration uses defensive SQL to handle existing tables gracefully.
 * ============================================
 */

-- ============================================
-- 1. SELLER PROFILES
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'seller_profiles') THEN
    CREATE TABLE seller_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
      community_id UUID REFERENCES communities(id),
      
      -- Avatar system
      avatar_data JSONB DEFAULT '{
        "base": "default",
        "gear": [],
        "background": "blue",
        "unlocked_items": []
      }',
      
      -- Progression
      xp_total INTEGER DEFAULT 0,
      current_level INTEGER DEFAULT 1,
      
      -- Streaks
      streak_days INTEGER DEFAULT 0,
      last_sale_date DATE,
      
      -- Stats
      total_sales DECIMAL(12, 2) DEFAULT 0,
      total_orders INTEGER DEFAULT 0,
      total_commission DECIMAL(12, 2) DEFAULT 0,
      
      -- Personal shop
      shop_url VARCHAR(255) UNIQUE,
      shop_bio TEXT,
      shop_video_url TEXT,
      
      -- Onboarding
      onboarding_completed BOOLEAN DEFAULT false,
      onboarding_step INTEGER DEFAULT 0,
      bank_account_verified BOOLEAN DEFAULT false,
      
      -- Metadata
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- Add columns to seller_profiles if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'avatar_data') THEN
    ALTER TABLE seller_profiles ADD COLUMN avatar_data JSONB DEFAULT '{"base": "default", "gear": [], "background": "blue", "unlocked_items": []}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'xp_total') THEN
    ALTER TABLE seller_profiles ADD COLUMN xp_total INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'current_level') THEN
    ALTER TABLE seller_profiles ADD COLUMN current_level INTEGER DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'streak_days') THEN
    ALTER TABLE seller_profiles ADD COLUMN streak_days INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'last_sale_date') THEN
    ALTER TABLE seller_profiles ADD COLUMN last_sale_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'total_sales') THEN
    ALTER TABLE seller_profiles ADD COLUMN total_sales DECIMAL(12, 2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'total_orders') THEN
    ALTER TABLE seller_profiles ADD COLUMN total_orders INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'total_commission') THEN
    ALTER TABLE seller_profiles ADD COLUMN total_commission DECIMAL(12, 2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'shop_url') THEN
    ALTER TABLE seller_profiles ADD COLUMN shop_url VARCHAR(255) UNIQUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'shop_bio') THEN
    ALTER TABLE seller_profiles ADD COLUMN shop_bio TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'shop_video_url') THEN
    ALTER TABLE seller_profiles ADD COLUMN shop_video_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'onboarding_completed') THEN
    ALTER TABLE seller_profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'onboarding_step') THEN
    ALTER TABLE seller_profiles ADD COLUMN onboarding_step INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'bank_account_verified') THEN
    ALTER TABLE seller_profiles ADD COLUMN bank_account_verified BOOLEAN DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_seller_profiles_user ON seller_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_community ON seller_profiles(community_id);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_shop_url ON seller_profiles(shop_url) WHERE shop_url IS NOT NULL;

-- Add foreign key constraint only if columns exist and constraint doesn't exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'user_id')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                    WHERE table_name = 'seller_profiles' AND constraint_name = 'seller_profiles_user_id_fkey') THEN
    ALTER TABLE seller_profiles ADD CONSTRAINT seller_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'community_id')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'communities')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                    WHERE table_name = 'seller_profiles' AND constraint_name = 'seller_profiles_community_id_fkey') THEN
    ALTER TABLE seller_profiles ADD CONSTRAINT seller_profiles_community_id_fkey FOREIGN KEY (community_id) REFERENCES communities(id);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. WAREHOUSE PARTNERS
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'warehouse_partners') THEN
    CREATE TABLE warehouse_partners (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID REFERENCES organizations(id),
      
      -- Partner info
      partner_name VARCHAR(255) NOT NULL,
      partner_code VARCHAR(50) UNIQUE NOT NULL,
      
      -- Type
      hub_type VARCHAR(50) CHECK (hub_type IN ('consolidation', 'split', 'both')),
      
      -- Territory
      territory VARCHAR(2) NOT NULL,
      
      -- Contact
      contact_email VARCHAR(255),
      contact_phone VARCHAR(50),
      
      -- API credentials
      api_key VARCHAR(255),
      webhook_url TEXT,
      webhook_secret VARCHAR(255),
      
      -- SLA
      sla_throughput_hours INTEGER DEFAULT 24,
      sla_accuracy_percent DECIMAL(5, 2) DEFAULT 99.8,
      
      -- Pricing
      price_per_inbound DECIMAL(10, 2),
      price_per_pallet DECIMAL(10, 2),
      price_per_split DECIMAL(10, 2),
      
      -- Status
      status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
      partner_tier VARCHAR(50) DEFAULT 'standard' CHECK (partner_tier IN ('standard', 'gold', 'platinum')),
      
      -- Stats
      total_processed INTEGER DEFAULT 0,
      accuracy_rate DECIMAL(5, 2),
      
      -- Metadata
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_warehouse_partners_org ON warehouse_partners(organization_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_partners_code ON warehouse_partners(partner_code);

-- Create index on status only if column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouse_partners' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_warehouse_partners_status ON warehouse_partners(status);
  END IF;
END $$;

-- Add foreign key constraint only if columns exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouse_partners' AND column_name = 'organization_id')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                    WHERE table_name = 'warehouse_partners' AND constraint_name = 'warehouse_partners_organization_id_fkey') THEN
    ALTER TABLE warehouse_partners ADD CONSTRAINT warehouse_partners_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE warehouse_partners ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CONSOLIDATION WAREHOUSES
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'consolidation_warehouses') THEN
    CREATE TABLE consolidation_warehouses (
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
      max_capacity_m3 DECIMAL(10, 2),
      current_utilization_m3 DECIMAL(10, 2) DEFAULT 0,
      max_daily_orders INTEGER,
      
      -- Operating
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
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_warehouses_postal ON consolidation_warehouses(postal_code);
CREATE INDEX IF NOT EXISTS idx_warehouses_active ON consolidation_warehouses(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_warehouses_country ON consolidation_warehouses(country);

ALTER TABLE consolidation_warehouses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. WAREHOUSE INVENTORY
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'warehouse_inventory') THEN
    CREATE TABLE warehouse_inventory (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      
      -- What & Where
      warehouse_id UUID NOT NULL REFERENCES consolidation_warehouses(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
      
      -- Quantities
      quantity_received INTEGER NOT NULL DEFAULT 0,
      quantity_allocated INTEGER NOT NULL DEFAULT 0,
      quantity_available INTEGER NOT NULL DEFAULT 0,
      quantity_shipped INTEGER NOT NULL DEFAULT 0,
      
      -- Tracking
      received_from_merchant_at TIMESTAMP WITH TIME ZONE,
      batch_number VARCHAR(100),
      
      -- Status
      status VARCHAR(50) DEFAULT 'in_transit',
      
      -- Metadata
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      UNIQUE(warehouse_id, product_id, batch_number)
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_warehouse ON warehouse_inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_product ON warehouse_inventory(product_id);

-- Create index on status only if column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouse_inventory' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_status ON warehouse_inventory(status);
  END IF;
END $$;

-- Add foreign key constraints only if columns exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouse_inventory' AND column_name = 'warehouse_id')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'consolidation_warehouses')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                    WHERE table_name = 'warehouse_inventory' AND constraint_name = 'warehouse_inventory_warehouse_id_fkey') THEN
    ALTER TABLE warehouse_inventory ADD CONSTRAINT warehouse_inventory_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES consolidation_warehouses(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouse_inventory' AND column_name = 'product_id')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                    WHERE table_name = 'warehouse_inventory' AND constraint_name = 'warehouse_inventory_product_id_fkey') THEN
    ALTER TABLE warehouse_inventory ADD CONSTRAINT warehouse_inventory_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouse_inventory' AND column_name = 'merchant_id')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchants')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                    WHERE table_name = 'warehouse_inventory' AND constraint_name = 'warehouse_inventory_merchant_id_fkey') THEN
    ALTER TABLE warehouse_inventory ADD CONSTRAINT warehouse_inventory_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE warehouse_inventory ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. PRODUCT FLOW SUMMARY
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'product_flow_summary') THEN
    CREATE TABLE product_flow_summary (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE UNIQUE,
      
      -- Quantities
      pending_order_quantity INTEGER DEFAULT 0,
      in_transit_quantity INTEGER DEFAULT 0,
      warehouse_available INTEGER DEFAULT 0,
      warehouse_allocated INTEGER DEFAULT 0,
      allocated_to_customers INTEGER DEFAULT 0,
      
      -- Metadata
      metadata JSONB DEFAULT '{}',
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_product_flow_summary_product ON product_flow_summary(product_id);

ALTER TABLE product_flow_summary ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. ORDERS
-- ============================================
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
      currency VARCHAR(3) DEFAULT 'SEK',

      -- Payment
      stripe_payment_intent_id VARCHAR(255),
      payment_status VARCHAR(50) DEFAULT 'pending',
      paid_at TIMESTAMP WITH TIME ZONE,

      -- Order status
      status VARCHAR(50) DEFAULT 'pending',

      -- Metadata
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- Add missing columns to existing orders table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_id') THEN
    ALTER TABLE orders ADD COLUMN customer_id UUID REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_email') THEN
    ALTER TABLE orders ADD COLUMN customer_email VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_phone') THEN
    ALTER TABLE orders ADD COLUMN customer_phone VARCHAR(50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_name') THEN
    ALTER TABLE orders ADD COLUMN shipping_name VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_address_line1') THEN
    ALTER TABLE orders ADD COLUMN shipping_address_line1 VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_address_line2') THEN
    ALTER TABLE orders ADD COLUMN shipping_address_line2 VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_city') THEN
    ALTER TABLE orders ADD COLUMN shipping_city VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_postal_code') THEN
    ALTER TABLE orders ADD COLUMN shipping_postal_code VARCHAR(20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_country') THEN
    ALTER TABLE orders ADD COLUMN shipping_country VARCHAR(2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'billing_name') THEN
    ALTER TABLE orders ADD COLUMN billing_name VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'billing_address_line1') THEN
    ALTER TABLE orders ADD COLUMN billing_address_line1 VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'billing_address_line2') THEN
    ALTER TABLE orders ADD COLUMN billing_address_line2 VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'billing_city') THEN
    ALTER TABLE orders ADD COLUMN billing_city VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'billing_postal_code') THEN
    ALTER TABLE orders ADD COLUMN billing_postal_code VARCHAR(20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'billing_country') THEN
    ALTER TABLE orders ADD COLUMN billing_country VARCHAR(2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'subtotal') THEN
    ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10, 2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_total') THEN
    ALTER TABLE orders ADD COLUMN shipping_total DECIMAL(10, 2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'tax_total') THEN
    ALTER TABLE orders ADD COLUMN tax_total DECIMAL(10, 2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total') THEN
    ALTER TABLE orders ADD COLUMN total DECIMAL(10, 2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'currency') THEN
    ALTER TABLE orders ADD COLUMN currency VARCHAR(3) DEFAULT 'SEK';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'stripe_payment_intent_id') THEN
    ALTER TABLE orders ADD COLUMN stripe_payment_intent_id VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_status') THEN
    ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'paid_at') THEN
    ALTER TABLE orders ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'status') THEN
    ALTER TABLE orders ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'metadata') THEN
    ALTER TABLE orders ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'created_at') THEN
    ALTER TABLE orders ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'updated_at') THEN
    ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);

-- Create index on status only if column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. ORDER ITEMS
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'order_items') THEN
    CREATE TABLE order_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id),
      merchant_id UUID NOT NULL REFERENCES merchants(id),
      
      -- Product snapshot
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
      fulfillment_status VARCHAR(50) DEFAULT 'pending',
      
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Create index on fulfillment_status only if column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'fulfillment_status') THEN
    CREATE INDEX IF NOT EXISTS idx_order_items_fulfillment_status ON order_items(fulfillment_status);
  END IF;
END $$;

-- Add foreign key constraints only if columns exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'order_id')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                    WHERE table_name = 'order_items' AND constraint_name = 'order_items_order_id_fkey') THEN
    ALTER TABLE order_items ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'product_id')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                    WHERE table_name = 'order_items' AND constraint_name = 'order_items_product_id_fkey') THEN
    ALTER TABLE order_items ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'merchant_id')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchants')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                    WHERE table_name = 'order_items' AND constraint_name = 'order_items_merchant_id_fkey') THEN
    ALTER TABLE order_items ADD CONSTRAINT order_items_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES merchants(id);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. CONVERSATIONS
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'conversations') THEN
    CREATE TABLE conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_type TEXT NOT NULL CHECK (conversation_type IN ('direct', 'community', 'broadcast')),
      community_id UUID REFERENCES communities(id),
      name TEXT,
      created_by UUID NOT NULL REFERENCES profiles(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_conversations_community ON conversations(community_id);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(conversation_type);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. MERCHANT COMMUNITY MESSAGES
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'merchant_community_messages') THEN
    CREATE TABLE merchant_community_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      merchant_id UUID NOT NULL REFERENCES merchants(id),
      community_id UUID NOT NULL REFERENCES communities(id),
      subject TEXT NOT NULL,
      content TEXT NOT NULL,
      message_type TEXT DEFAULT 'announcement' CHECK (message_type IN ('announcement', 'offer', 'update')),
      metadata JSONB,
      sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      expires_at TIMESTAMP WITH TIME ZONE
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_merchant_messages_merchant ON merchant_community_messages(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_messages_community ON merchant_community_messages(community_id);

-- Add foreign key constraints only if columns exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchant_community_messages' AND column_name = 'merchant_id')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchants')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                    WHERE table_name = 'merchant_community_messages' AND constraint_name = 'merchant_community_messages_merchant_id_fkey') THEN
    ALTER TABLE merchant_community_messages ADD CONSTRAINT merchant_community_messages_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES merchants(id);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchant_community_messages' AND column_name = 'community_id')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'communities')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                    WHERE table_name = 'merchant_community_messages' AND constraint_name = 'merchant_community_messages_community_id_fkey') THEN
    ALTER TABLE merchant_community_messages ADD CONSTRAINT merchant_community_messages_community_id_fkey FOREIGN KEY (community_id) REFERENCES communities(id);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE merchant_community_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 10. INVITATIONS
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'invitations') THEN
    CREATE TABLE invitations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      
      -- Who & Where
      community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
      invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      
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
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_invitations_community ON invitations(community_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status) WHERE status = 'pending';

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language plpgsql;

DROP TRIGGER IF EXISTS update_seller_profiles_updated_at ON seller_profiles;
CREATE TRIGGER update_seller_profiles_updated_at
  BEFORE UPDATE ON seller_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_warehouse_partners_updated_at ON warehouse_partners;
CREATE TRIGGER update_warehouse_partners_updated_at
  BEFORE UPDATE ON warehouse_partners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_consolidation_warehouses_updated_at ON consolidation_warehouses;
CREATE TRIGGER update_consolidation_warehouses_updated_at
  BEFORE UPDATE ON consolidation_warehouses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_warehouse_inventory_updated_at ON warehouse_inventory;
CREATE TRIGGER update_warehouse_inventory_updated_at
  BEFORE UPDATE ON warehouse_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_order_items_updated_at ON order_items;
CREATE TRIGGER update_order_items_updated_at
  BEFORE UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invitations_updated_at ON invitations;
CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
