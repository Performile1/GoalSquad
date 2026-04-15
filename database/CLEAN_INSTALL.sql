/**
 * ============================================
 * GOALSQUAD - CLEAN INSTALL
 * ============================================
 * 
 * VARNING: Detta DROPPAR alla befintliga tabeller!
 * Använd endast för fresh install eller reset.
 * 
 * INSTRUKTIONER:
 * 1. Supabase Dashboard → SQL Editor
 * 2. New Query
 * 3. Kopiera HELA filen
 * 4. Run
 * 5. Vänta ~2 minuter
 * 
 * VERSION: CLEAN 1.0
 * UPDATED: 2026-04-15 22:47
 * 
 * ============================================
 */

-- ============================================
-- DROP EXISTING TABLES (i rätt ordning)
-- ============================================

DROP TABLE IF EXISTS broadcast_recipients CASCADE;
DROP TABLE IF EXISTS broadcast_messages CASCADE;
DROP TABLE IF EXISTS message_reads CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS shipments CASCADE;
DROP TABLE IF EXISTS pending_moq_orders CASCADE;
DROP TABLE IF EXISTS warehouse_allocations CASCADE;
DROP TABLE IF EXISTS merchant_shipment_items CASCADE;
DROP TABLE IF EXISTS merchant_shipments CASCADE;
DROP TABLE IF EXISTS warehouse_inventory CASCADE;
DROP TABLE IF EXISTS consolidation_warehouses CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS community_members CASCADE;
DROP TABLE IF EXISTS communities CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS merchants CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================
-- EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. PROFILES
-- ============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  phone VARCHAR(50),
  date_of_birth DATE,
  
  -- Role
  role VARCHAR(50) DEFAULT 'user',
  
  -- Guardian relationship (self-referencing, added after)
  guardian_id UUID,
  
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
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_active ON profiles(is_active) WHERE is_active = true;
CREATE INDEX idx_profiles_guardian ON profiles(guardian_id);

-- Add self-referencing FK
ALTER TABLE profiles 
ADD CONSTRAINT profiles_guardian_id_fkey 
FOREIGN KEY (guardian_id) REFERENCES profiles(id);

-- ============================================
-- 2. MERCHANTS
-- ============================================

CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  
  -- Logos
  logo_url TEXT,
  logo_square_url TEXT,
  logo_horizontal_url TEXT,
  
  -- Branding
  primary_color TEXT DEFAULT '#0ea5e9',
  secondary_color TEXT DEFAULT '#06b6d4',
  
  -- Company info
  company_description TEXT,
  founded_year INTEGER,
  employee_count TEXT,
  
  -- Contact
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  
  -- Address
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'SE',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_merchants_user ON merchants(user_id);
CREATE INDEX idx_merchants_active ON merchants(is_active) WHERE is_active = true;

-- ============================================
-- 3. PRODUCTS
-- ============================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  
  -- Categorization
  category TEXT,
  sku TEXT,
  ean TEXT,
  
  -- Images
  image_url TEXT,
  images TEXT[],
  
  -- Inventory
  stock_quantity INTEGER DEFAULT 0,
  
  -- MOQ
  minimum_order_quantity INTEGER DEFAULT 1,
  moq_enabled BOOLEAN DEFAULT false,
  
  -- Product attributes
  certifications TEXT[] DEFAULT '{}',
  allergens JSONB DEFAULT '[]',
  nutritional_info JSONB,
  
  -- Shipping
  requires_cold_chain BOOLEAN DEFAULT false,
  requires_frozen BOOLEAN DEFAULT false,
  is_fragile BOOLEAN DEFAULT false,
  can_consolidate BOOLEAN DEFAULT true,
  shipping_restrictions JSONB DEFAULT '[]',
  
  -- Batch tracking
  expiry_date DATE,
  batch_number TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(merchant_id, name)
);

CREATE INDEX idx_products_merchant ON products(merchant_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active, is_available);
CREATE INDEX idx_products_ean ON products(ean);

-- ============================================
-- 4. COMMUNITIES
-- ============================================

CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('sports', 'school', 'nonprofit', 'other')),
  
  -- Logos
  logo_url TEXT,
  logo_square_url TEXT,
  logo_horizontal_url TEXT,
  
  -- Branding
  primary_color TEXT DEFAULT '#10b981',
  secondary_color TEXT DEFAULT '#059669',
  
  -- Contact
  contact_email TEXT,
  contact_phone TEXT,
  
  -- Address
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'SE',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_communities_type ON communities(type);
CREATE INDEX idx_communities_active ON communities(is_active) WHERE is_active = true;

-- ============================================
-- 5. COMMUNITY MEMBERS
-- ============================================

CREATE TABLE community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Role in community
  role VARCHAR(50) DEFAULT 'member',
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Seller info
  seller_profile_id UUID,
  
  -- Permissions
  can_invite BOOLEAN DEFAULT false,
  can_post BOOLEAN DEFAULT true,
  can_sell BOOLEAN DEFAULT false,
  
  -- Metadata
  invited_by UUID REFERENCES profiles(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(community_id, user_id)
);

CREATE INDEX idx_community_members_community ON community_members(community_id);
CREATE INDEX idx_community_members_user ON community_members(user_id);
CREATE INDEX idx_community_members_role ON community_members(community_id, role);
CREATE INDEX idx_community_members_status ON community_members(status) WHERE status = 'active';

-- ============================================
-- 6. ORDERS
-- ============================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  community_id UUID REFERENCES communities(id) ON DELETE SET NULL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'pending_moq', 'processing', 'shipped', 'delivered', 'cancelled')),
  
  -- Amounts
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Shipping
  shipping_address TEXT,
  shipping_city TEXT,
  shipping_postal_code TEXT,
  shipping_country TEXT DEFAULT 'SE',
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_community ON orders(community_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- ============================================
-- 7. ORDER ITEMS
-- ============================================

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ============================================
-- 8. CONSOLIDATION WAREHOUSES
-- ============================================

CREATE TABLE consolidation_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  
  -- Address
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'SE',
  
  -- Location
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  
  -- Coverage
  coverage_radius_km INTEGER DEFAULT 100,
  postal_code_ranges TEXT[],
  
  -- Capacity
  capacity_cubic_meters DECIMAL(10,2),
  current_utilization_percent DECIMAL(5,2) DEFAULT 0,
  
  -- Contact
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_warehouses_postal ON consolidation_warehouses(postal_code);
CREATE INDEX idx_warehouses_active ON consolidation_warehouses(is_active) WHERE is_active = true;

-- ============================================
-- 9. WAREHOUSE INVENTORY
-- ============================================

CREATE TABLE warehouse_inventory (
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

CREATE INDEX idx_warehouse_inventory_warehouse ON warehouse_inventory(warehouse_id);
CREATE INDEX idx_warehouse_inventory_product ON warehouse_inventory(product_id);

-- ============================================
-- 10. MERCHANT SHIPMENTS
-- ============================================

CREATE TABLE merchant_shipments (
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

CREATE INDEX idx_merchant_shipments_merchant ON merchant_shipments(merchant_id);
CREATE INDEX idx_merchant_shipments_warehouse ON merchant_shipments(warehouse_id);
CREATE INDEX idx_merchant_shipments_status ON merchant_shipments(status);

-- ============================================
-- 11. MERCHANT SHIPMENT ITEMS
-- ============================================

CREATE TABLE merchant_shipment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID REFERENCES merchant_shipments(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_merchant_shipment_items_shipment ON merchant_shipment_items(shipment_id);
CREATE INDEX idx_merchant_shipment_items_product ON merchant_shipment_items(product_id);

-- ============================================
-- 12. WAREHOUSE ALLOCATIONS
-- ============================================

CREATE TABLE warehouse_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID REFERENCES consolidation_warehouses(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  status TEXT DEFAULT 'allocated' CHECK (status IN ('allocated', 'picked', 'packed', 'shipped')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_warehouse_allocations_warehouse ON warehouse_allocations(warehouse_id);
CREATE INDEX idx_warehouse_allocations_order ON warehouse_allocations(order_id);
CREATE INDEX idx_warehouse_allocations_product ON warehouse_allocations(product_id);

-- ============================================
-- 13. PENDING MOQ ORDERS
-- ============================================

CREATE TABLE pending_moq_orders (
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

CREATE INDEX idx_pending_moq_product ON pending_moq_orders(product_id);
CREATE INDEX idx_pending_moq_warehouse ON pending_moq_orders(warehouse_id);
CREATE INDEX idx_pending_moq_status ON pending_moq_orders(status);

-- ============================================
-- 14. SHIPMENTS
-- ============================================

CREATE TABLE shipments (
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

CREATE INDEX idx_shipments_order ON shipments(order_id);
CREATE INDEX idx_shipments_warehouse ON shipments(warehouse_id);
CREATE INDEX idx_shipments_status ON shipments(status);

-- ============================================
-- 15. CONVERSATIONS
-- ============================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('direct', 'community', 'broadcast')),
  community_id UUID REFERENCES communities(id),
  name TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_conversations_community ON conversations(community_id);
CREATE INDEX idx_conversations_type ON conversations(conversation_type);

-- ============================================
-- 16. CONVERSATION PARTICIPANTS
-- ============================================

CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  muted BOOLEAN DEFAULT FALSE,
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_conv_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_conv_participants_user ON conversation_participants(user_id);

-- ============================================
-- 17. MESSAGES
-- ============================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
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

-- ============================================
-- 18. MESSAGE READS
-- ============================================

CREATE TABLE message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX idx_message_reads_message ON message_reads(message_id);
CREATE INDEX idx_message_reads_user ON message_reads(user_id);

-- ============================================
-- 19. BROADCAST MESSAGES
-- ============================================

CREATE TABLE broadcast_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('gs_admin', 'merchant', 'community_admin')),
  sender_id UUID NOT NULL REFERENCES profiles(id),
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

-- ============================================
-- 20. BROADCAST RECIPIENTS
-- ============================================

CREATE TABLE broadcast_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES broadcast_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  read_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(broadcast_id, user_id)
);

CREATE INDEX idx_broadcast_recipients_broadcast ON broadcast_recipients(broadcast_id);
CREATE INDEX idx_broadcast_recipients_user ON broadcast_recipients(user_id);
CREATE INDEX idx_broadcast_recipients_unread ON broadcast_recipients(user_id) WHERE read_at IS NULL;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

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

-- ============================================
-- RLS POLICIES
-- ============================================

-- Profiles
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Merchants
CREATE POLICY "merchants_select_active" ON merchants FOR SELECT USING (is_active = true);
CREATE POLICY "merchants_service_role_all" ON merchants FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Products
CREATE POLICY "products_select_active" ON products FOR SELECT USING (is_active = true AND is_available = true);
CREATE POLICY "products_service_role_all" ON products FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Communities
CREATE POLICY "communities_select_active" ON communities FOR SELECT USING (is_active = true);
CREATE POLICY "communities_service_role_all" ON communities FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Community Members
CREATE POLICY "community_members_select_all" ON community_members FOR SELECT USING (true);
CREATE POLICY "community_members_service_role_all" ON community_members FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Orders
CREATE POLICY "orders_select_own" ON orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "orders_service_role_all" ON orders FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Order Items
CREATE POLICY "order_items_select_own" ON order_items FOR SELECT USING (
  order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
);
CREATE POLICY "order_items_service_role_all" ON order_items FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Warehouses
CREATE POLICY "warehouses_select_active" ON consolidation_warehouses FOR SELECT USING (is_active = true);
CREATE POLICY "warehouses_service_role_all" ON consolidation_warehouses FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Warehouse Inventory
CREATE POLICY "warehouse_inventory_select_all" ON warehouse_inventory FOR SELECT USING (true);
CREATE POLICY "warehouse_inventory_service_role_all" ON warehouse_inventory FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Conversations
CREATE POLICY "conversations_select_participant" ON conversations FOR SELECT USING (
  id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
);
CREATE POLICY "conversations_service_role_all" ON conversations FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Messages
CREATE POLICY "messages_select_participant" ON messages FOR SELECT USING (
  conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
);
CREATE POLICY "messages_service_role_all" ON messages FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Broadcast Recipients
CREATE POLICY "broadcast_recipients_select_own" ON broadcast_recipients FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "broadcast_recipients_service_role_all" ON broadcast_recipients FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Find nearest warehouse
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

-- Get product flow
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

-- Get unread message count
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unread_count
  FROM messages m
  JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
  WHERE cp.user_id = p_user_id
    AND m.created_at > cp.last_read_at
    AND m.sender_id != p_user_id;
  
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Warehouses
INSERT INTO consolidation_warehouses (name, address, city, postal_code, latitude, longitude, postal_code_ranges) VALUES
  ('Stockholm Lager', 'Logistikvägen 1', 'Stockholm', '12345', 59.3293, 18.0686, ARRAY['10000-19999']),
  ('Göteborg Lager', 'Hamnvägen 5', 'Göteborg', '41101', 57.7089, 11.9746, ARRAY['40000-49999']),
  ('Malmö Lager', 'Industrivägen 10', 'Malmö', '21115', 55.6050, 13.0038, ARRAY['20000-29999']);

-- Merchants
INSERT INTO merchants (name, description, contact_email, is_verified) VALUES
  ('Skånska Chips', 'Ekologiska chips från Skåne', 'info@skanska-chips.se', true),
  ('Chokladfabriken', 'Hantverksmässig choklad', 'kontakt@chokladfabriken.se', true),
  ('Ekologiskt Kaffe AB', 'Fairtrade kaffe', 'info@ekokaffe.se', true),
  ('Hälsokost Sverige', 'Proteinbars och hälsokost', 'hej@halsokost.se', true),
  ('Gourmet Nötter', 'Rostade nötter', 'info@gourmetnotter.se', true);

-- Products
DO $$
DECLARE
  v_merchant_id UUID;
BEGIN
  SELECT id INTO v_merchant_id FROM merchants WHERE name = 'Skånska Chips' LIMIT 1;
  IF v_merchant_id IS NOT NULL THEN
    INSERT INTO products (merchant_id, name, description, price, cost_price, category, minimum_order_quantity, moq_enabled, is_active, is_available)
    VALUES
      (v_merchant_id, 'Chips Original 200g', 'Klassiska chips med havssalt', 45.00, 30.00, 'Snacks', 50, true, true, true),
      (v_merchant_id, 'Chips Sourcream 200g', 'Chips med sourcream & onion', 45.00, 30.00, 'Snacks', 50, true, true, true);
  END IF;

  SELECT id INTO v_merchant_id FROM merchants WHERE name = 'Chokladfabriken' LIMIT 1;
  IF v_merchant_id IS NOT NULL THEN
    INSERT INTO products (merchant_id, name, description, price, cost_price, category, minimum_order_quantity, moq_enabled, is_active, is_available)
    VALUES
      (v_merchant_id, 'Mjölkchoklad 100g', 'Krämig mjölkchoklad 40% kakao', 35.00, 20.00, 'Godis', 100, true, true, true),
      (v_merchant_id, 'Mörk Choklad 100g', 'Mörk choklad 70% kakao', 40.00, 23.00, 'Godis', 100, true, true, true),
      (v_merchant_id, 'Pralinask 250g', 'Lyxig pralinask med 12 smaker', 120.00, 70.00, 'Godis', 30, true, true, true);
  END IF;

  SELECT id INTO v_merchant_id FROM merchants WHERE name = 'Ekologiskt Kaffe AB' LIMIT 1;
  IF v_merchant_id IS NOT NULL THEN
    INSERT INTO products (merchant_id, name, description, price, cost_price, category, minimum_order_quantity, moq_enabled, is_active, is_available)
    VALUES
      (v_merchant_id, 'Mellanrost Kaffe 500g', 'Balanserat mellanrostat kaffe från Colombia', 89.00, 55.00, 'Dryck', 80, true, true, true),
      (v_merchant_id, 'Mörkrost Kaffe 500g', 'Kraftfullt mörkrostat kaffe från Brasilien', 95.00, 58.00, 'Dryck', 80, true, true, true);
  END IF;

  SELECT id INTO v_merchant_id FROM merchants WHERE name = 'Hälsokost Sverige' LIMIT 1;
  IF v_merchant_id IS NOT NULL THEN
    INSERT INTO products (merchant_id, name, description, price, cost_price, category, minimum_order_quantity, moq_enabled, is_active, is_available)
    VALUES
      (v_merchant_id, 'Proteinbar 60g', 'Proteinbar med 20g protein', 25.00, 15.00, 'Hälsa', 200, true, true, true),
      (v_merchant_id, 'Energibollar 12-pack', 'Energibollar med dadlar och nötter', 65.00, 38.00, 'Hälsa', 50, true, true, true);
  END IF;

  SELECT id INTO v_merchant_id FROM merchants WHERE name = 'Gourmet Nötter' LIMIT 1;
  IF v_merchant_id IS NOT NULL THEN
    INSERT INTO products (merchant_id, name, description, price, cost_price, category, minimum_order_quantity, moq_enabled, is_active, is_available)
    VALUES
      (v_merchant_id, 'Blandade Nötter 300g', 'Mix av cashew, mandel, valnöt och hasselnöt', 75.00, 45.00, 'Snacks', 60, true, true, true),
      (v_merchant_id, 'Cashewnötter 250g', 'Premium cashewnötter rostade med havssalt', 85.00, 52.00, 'Snacks', 60, true, true, true);
  END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

SELECT 'Merchants' as table_name, COUNT(*) as count FROM merchants
UNION ALL SELECT 'Products', COUNT(*) FROM products
UNION ALL SELECT 'Warehouses', COUNT(*) FROM consolidation_warehouses;

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
