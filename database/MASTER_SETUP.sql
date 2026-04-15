/**
 * ============================================
 * GOALSQUAD - MASTER DATABASE SETUP
 * ============================================
 * 
 * Kör denna fil i Supabase SQL Editor för att sätta upp HELA databasen
 * 
 * INSTRUKTIONER:
 * 1. Gå till Supabase Dashboard → SQL Editor
 * 2. Klicka "New Query"
 * 3. Kopiera HELA denna fil
 * 4. Klistra in och klicka "Run"
 * 5. Vänta ~30 sekunder
 * 6. Verifiera att allt kördes utan errors
 * 
 * ORDNING:
 * 1. Extensions & Basic Schema
 * 2. Core Tables (users, merchants, products, etc.)
 * 3. Product Attributes & Categories
 * 4. MOQ & Warehouses
 * 5. Product Flow Tracking
 * 6. Communities & Members
 * 7. Messaging System
 * 8. Security (RLS)
 * 9. Sample Data
 * 
 * ============================================
 */

-- ============================================
-- 1. EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- För geografiska beräkningar

-- ============================================
-- 2. CORE TABLES
-- ============================================

-- Users/Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'merchant', 'admin', 'guardian')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Merchants
CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'SE',
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  category TEXT,
  sku TEXT,
  ean TEXT,
  image_url TEXT,
  images TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 0,
  minimum_order_quantity INTEGER DEFAULT 1,
  moq_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(merchant_id, name)
);

-- Communities
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
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

-- Community Members
CREATE TABLE IF NOT EXISTS community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'guardian', 'seller', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  community_id UUID REFERENCES communities(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'pending_moq', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_address TEXT,
  shipping_city TEXT,
  shipping_postal_code TEXT,
  shipping_country TEXT DEFAULT 'SE',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. PRODUCT ATTRIBUTES
-- ============================================

-- Certifications
ALTER TABLE products ADD COLUMN IF NOT EXISTS certifications TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS allergens JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS nutritional_info JSONB;

-- Shipping restrictions
ALTER TABLE products ADD COLUMN IF NOT EXISTS requires_cold_chain BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS requires_frozen BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_fragile BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS can_consolidate BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_restrictions JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS batch_number TEXT;

-- ============================================
-- 4. MOQ & WAREHOUSES
-- ============================================

-- Consolidation Warehouses
CREATE TABLE IF NOT EXISTS consolidation_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'SE',
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  coverage_radius_km INTEGER DEFAULT 100,
  postal_code_ranges TEXT[],
  capacity_cubic_meters DECIMAL(10,2),
  current_utilization_percent DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pending MOQ Orders
CREATE TABLE IF NOT EXISTS pending_moq_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES consolidation_warehouses(id) ON DELETE SET NULL,
  total_quantity INTEGER DEFAULT 0,
  moq_target INTEGER NOT NULL,
  moq_progress_percent DECIMAL(5,2) DEFAULT 0,
  estimated_fulfillment_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'shipped')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipments
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES consolidation_warehouses(id) ON DELETE SET NULL,
  shipment_type TEXT DEFAULT 'full' CHECK (shipment_type IN ('full', 'partial')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'delivered')),
  tracking_number TEXT,
  shipping_cost DECIMAL(10,2),
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. PRODUCT FLOW TRACKING
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

-- Merchant Shipments (från företag till lager)
CREATE TABLE IF NOT EXISTS merchant_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES consolidation_warehouses(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'received', 'cancelled')),
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
  status TEXT DEFAULT 'allocated' CHECK (status IN ('allocated', 'picked', 'packed', 'shipped')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. MESSAGING SYSTEM
-- ============================================

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('merchant', 'community', 'support')),
  entity_id UUID NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. MERCHANT BRANDING
-- ============================================

ALTER TABLE merchants ADD COLUMN IF NOT EXISTS logo_square_url TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS logo_horizontal_url TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#0ea5e9';
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#06b6d4';
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS company_description TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS founded_year INTEGER;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS employee_count TEXT;

-- ============================================
-- 8. COMMUNITY LOGOS
-- ============================================

ALTER TABLE communities ADD COLUMN IF NOT EXISTS logo_square_url TEXT;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS logo_horizontal_url TEXT;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#10b981';
ALTER TABLE communities ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#059669';

-- ============================================
-- 9. INDEXES (För Performance)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_merchant ON products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active, is_available);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_community ON orders(community_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_community_members_community ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_warehouse ON warehouse_inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_product ON warehouse_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_pending_moq_product ON pending_moq_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_pending_moq_warehouse ON pending_moq_orders(warehouse_id);

-- ============================================
-- 10. ROW LEVEL SECURITY (RLS)
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
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all, update own
CREATE POLICY IF NOT EXISTS "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Merchants: Public read, merchants can update own
CREATE POLICY IF NOT EXISTS "Merchants are viewable by everyone" ON merchants FOR SELECT USING (is_active = true);
CREATE POLICY IF NOT EXISTS "Merchants can update own data" ON merchants FOR UPDATE USING (user_id = auth.uid());

-- Products: Public read active products
CREATE POLICY IF NOT EXISTS "Active products are viewable by everyone" ON products FOR SELECT USING (is_active = true AND is_available = true);
CREATE POLICY IF NOT EXISTS "Merchants can manage own products" ON products FOR ALL USING (
  merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
);

-- Communities: Public read, members can update
CREATE POLICY IF NOT EXISTS "Communities are viewable by everyone" ON communities FOR SELECT USING (is_active = true);
CREATE POLICY IF NOT EXISTS "Community admins can update" ON communities FOR UPDATE USING (
  id IN (SELECT community_id FROM community_members WHERE user_id = auth.uid() AND role = 'admin')
);

-- Orders: Users can see own orders
CREATE POLICY IF NOT EXISTS "Users can view own orders" ON orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Users can create orders" ON orders FOR INSERT WITH CHECK (user_id = auth.uid());

-- Order Items: Users can see items from own orders
CREATE POLICY IF NOT EXISTS "Users can view own order items" ON order_items FOR SELECT USING (
  order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
);

-- Warehouses: Public read
CREATE POLICY IF NOT EXISTS "Warehouses are viewable by everyone" ON consolidation_warehouses FOR SELECT USING (is_active = true);

-- Warehouse Inventory: Public read
CREATE POLICY IF NOT EXISTS "Warehouse inventory is viewable by everyone" ON warehouse_inventory FOR SELECT USING (true);

-- Messages: Users can see own conversations
CREATE POLICY IF NOT EXISTS "Users can view own conversations" ON conversations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Users can view messages in own conversations" ON messages FOR SELECT USING (
  conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid())
);

-- ============================================
-- 11. FUNCTIONS
-- ============================================

-- Function: Find nearest warehouse by postal code
CREATE OR REPLACE FUNCTION find_nearest_warehouse(user_postal_code TEXT)
RETURNS UUID AS $$
DECLARE
  nearest_warehouse_id UUID;
BEGIN
  SELECT id INTO nearest_warehouse_id
  FROM consolidation_warehouses
  WHERE is_active = true
    AND (
      user_postal_code = ANY(postal_code_ranges)
      OR postal_code = user_postal_code
    )
  ORDER BY 
    CASE 
      WHEN postal_code = user_postal_code THEN 0
      ELSE 1
    END
  LIMIT 1;
  
  RETURN nearest_warehouse_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Get product flow
CREATE OR REPLACE FUNCTION get_product_flow(p_product_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'product_id', p_product_id,
    'pending_orders', (
      SELECT COALESCE(SUM(oi.quantity), 0)
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.product_id = p_product_id
        AND o.status IN ('pending', 'pending_moq')
    ),
    'in_transit_to_warehouse', (
      SELECT COALESCE(SUM(msi.quantity), 0)
      FROM merchant_shipment_items msi
      JOIN merchant_shipments ms ON ms.id = msi.shipment_id
      WHERE msi.product_id = p_product_id
        AND ms.status = 'in_transit'
    ),
    'warehouse_inventory', (
      SELECT COALESCE(SUM(wi.quantity), 0)
      FROM warehouse_inventory wi
      WHERE wi.product_id = p_product_id
    ),
    'allocated_to_customers', (
      SELECT COALESCE(SUM(wa.quantity), 0)
      FROM warehouse_allocations wa
      WHERE wa.product_id = p_product_id
        AND wa.status IN ('allocated', 'picked', 'packed')
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 12. SAMPLE DATA
-- ============================================

-- Sample Warehouses
INSERT INTO consolidation_warehouses (name, address, city, postal_code, latitude, longitude, postal_code_ranges) VALUES
  ('Stockholm Lager', 'Logistikvägen 1', 'Stockholm', '12345', 59.3293, 18.0686, ARRAY['10000-19999']),
  ('Göteborg Lager', 'Hamnvägen 5', 'Göteborg', '41101', 57.7089, 11.9746, ARRAY['40000-49999']),
  ('Malmö Lager', 'Industrivägen 10', 'Malmö', '21115', 55.6050, 13.0038, ARRAY['20000-29999'])
ON CONFLICT DO NOTHING;

-- Sample Merchants
INSERT INTO merchants (name, description, contact_email, is_verified) VALUES
  ('Skånska Chips', 'Ekologiska chips från Skåne', 'info@skanska-chips.se', true),
  ('Chokladfabriken', 'Hantverksmässig choklad', 'kontakt@chokladfabriken.se', true),
  ('Ekologiskt Kaffe AB', 'Fairtrade kaffe', 'info@ekokaffe.se', true),
  ('Hälsokost Sverige', 'Proteinbars och hälsokost', 'hej@halsokost.se', true),
  ('Gourmet Nötter', 'Rostade nötter', 'info@gourmetnotter.se', true)
ON CONFLICT (name) DO NOTHING;

-- Sample Products (med merchant_id från inserted merchants)
DO $$
DECLARE
  v_merchant_id UUID;
BEGIN
  -- Skånska Chips
  SELECT id INTO v_merchant_id FROM merchants WHERE name = 'Skånska Chips' LIMIT 1;
  IF v_merchant_id IS NOT NULL THEN
    INSERT INTO products (merchant_id, name, description, price, cost_price, category, minimum_order_quantity, moq_enabled, is_active, is_available)
    VALUES
      (v_merchant_id, 'Chips Original 200g', 'Klassiska chips med havssalt', 45.00, 30.00, 'Snacks', 50, true, true, true),
      (v_merchant_id, 'Chips Sourcream 200g', 'Chips med sourcream & onion', 45.00, 30.00, 'Snacks', 50, true, true, true)
    ON CONFLICT (merchant_id, name) DO NOTHING;
  END IF;

  -- Chokladfabriken
  SELECT id INTO v_merchant_id FROM merchants WHERE name = 'Chokladfabriken' LIMIT 1;
  IF v_merchant_id IS NOT NULL THEN
    INSERT INTO products (merchant_id, name, description, price, cost_price, category, minimum_order_quantity, moq_enabled, is_active, is_available)
    VALUES
      (v_merchant_id, 'Mjölkchoklad 100g', 'Krämig mjölkchoklad 40% kakao', 35.00, 20.00, 'Godis', 100, true, true, true),
      (v_merchant_id, 'Mörk Choklad 100g', 'Mörk choklad 70% kakao', 40.00, 23.00, 'Godis', 100, true, true, true),
      (v_merchant_id, 'Pralinask 250g', 'Lyxig pralinask med 12 smaker', 120.00, 70.00, 'Godis', 30, true, true, true)
    ON CONFLICT (merchant_id, name) DO NOTHING;
  END IF;

  -- Ekologiskt Kaffe AB
  SELECT id INTO v_merchant_id FROM merchants WHERE name = 'Ekologiskt Kaffe AB' LIMIT 1;
  IF v_merchant_id IS NOT NULL THEN
    INSERT INTO products (merchant_id, name, description, price, cost_price, category, minimum_order_quantity, moq_enabled, is_active, is_available)
    VALUES
      (v_merchant_id, 'Mellanrost Kaffe 500g', 'Balanserat mellanrostat kaffe från Colombia', 89.00, 55.00, 'Dryck', 80, true, true, true),
      (v_merchant_id, 'Mörkrost Kaffe 500g', 'Kraftfullt mörkrostat kaffe från Brasilien', 95.00, 58.00, 'Dryck', 80, true, true, true)
    ON CONFLICT (merchant_id, name) DO NOTHING;
  END IF;

  -- Hälsokost Sverige
  SELECT id INTO v_merchant_id FROM merchants WHERE name = 'Hälsokost Sverige' LIMIT 1;
  IF v_merchant_id IS NOT NULL THEN
    INSERT INTO products (merchant_id, name, description, price, cost_price, category, minimum_order_quantity, moq_enabled, is_active, is_available)
    VALUES
      (v_merchant_id, 'Proteinbar 60g', 'Proteinbar med 20g protein', 25.00, 15.00, 'Hälsa', 200, true, true, true),
      (v_merchant_id, 'Energibollar 12-pack', 'Energibollar med dadlar och nötter', 65.00, 38.00, 'Hälsa', 50, true, true, true)
    ON CONFLICT (merchant_id, name) DO NOTHING;
  END IF;

  -- Gourmet Nötter
  SELECT id INTO v_merchant_id FROM merchants WHERE name = 'Gourmet Nötter' LIMIT 1;
  IF v_merchant_id IS NOT NULL THEN
    INSERT INTO products (merchant_id, name, description, price, cost_price, category, minimum_order_quantity, moq_enabled, is_active, is_available)
    VALUES
      (v_merchant_id, 'Blandade Nötter 300g', 'Mix av cashew, mandel, valnöt och hasselnöt', 75.00, 45.00, 'Snacks', 60, true, true, true),
      (v_merchant_id, 'Cashewnötter 250g', 'Premium cashewnötter rostade med havssalt', 85.00, 52.00, 'Snacks', 60, true, true, true)
    ON CONFLICT (merchant_id, name) DO NOTHING;
  END IF;
END $$;

-- ============================================
-- 13. VERIFICATION
-- ============================================

-- Show created tables
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Show sample data counts
SELECT 
  'Merchants' as table_name, COUNT(*) as count FROM merchants
UNION ALL
SELECT 'Products', COUNT(*) FROM products
UNION ALL
SELECT 'Warehouses', COUNT(*) FROM consolidation_warehouses
UNION ALL
SELECT 'Communities', COUNT(*) FROM communities;

-- Show products with profit margins
SELECT 
  m.name as merchant,
  p.name as product,
  p.price,
  p.cost_price,
  (p.price - p.cost_price) as profit,
  ROUND((p.price - p.cost_price) / p.price * 100, 1) as profit_pct,
  p.minimum_order_quantity as moq
FROM products p
JOIN merchants m ON m.id = p.merchant_id
ORDER BY m.name, p.name;

-- ============================================
-- SETUP COMPLETE! ✅
-- ============================================

-- Next steps:
-- 1. Go to Vercel and set environment variables
-- 2. Redeploy your application
-- 3. Test the connection
-- 4. Start using the platform!
