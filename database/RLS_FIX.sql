/**
 * ============================================
 * RLS POLICIES FIX
 * ============================================
 * 
 * Kör denna fil EFTER MASTER_SETUP.sql
 * 
 * Fixar policies så att:
 * - Public data är tillgänglig för alla (anon key)
 * - Service role kan göra allt (API routes)
 * - Users kan bara se/ändra sin egen data
 * 
 * ============================================
 */

-- ============================================
-- DROP EXISTING POLICIES (för att börja om)
-- ============================================

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Merchants are viewable by everyone" ON merchants;
DROP POLICY IF EXISTS "Merchants can update own data" ON merchants;
DROP POLICY IF EXISTS "Active products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Merchants can manage own products" ON products;
DROP POLICY IF EXISTS "Communities are viewable by everyone" ON communities;
DROP POLICY IF EXISTS "Community admins can update" ON communities;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Warehouses are viewable by everyone" ON consolidation_warehouses;
DROP POLICY IF EXISTS "Warehouse inventory is viewable by everyone" ON warehouse_inventory;
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;

-- ============================================
-- PROFILES
-- ============================================

-- Everyone can read profiles (för att visa säljare, etc.)
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT
  USING (true);

-- Users can insert own profile (vid registrering)
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- MERCHANTS
-- ============================================

-- Everyone can read active merchants
CREATE POLICY "merchants_select_active" ON merchants
  FOR SELECT
  USING (is_active = true);

-- Service role can do everything (för API routes)
CREATE POLICY "merchants_service_role_all" ON merchants
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Merchant users can update own merchant
CREATE POLICY "merchants_update_own" ON merchants
  FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- PRODUCTS
-- ============================================

-- Everyone can read active products
CREATE POLICY "products_select_active" ON products
  FOR SELECT
  USING (is_active = true AND is_available = true);

-- Service role can do everything
CREATE POLICY "products_service_role_all" ON products
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Merchants can manage own products
CREATE POLICY "products_merchant_manage" ON products
  FOR ALL
  USING (
    merchant_id IN (
      SELECT id FROM merchants WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- COMMUNITIES
-- ============================================

-- Everyone can read active communities
CREATE POLICY "communities_select_active" ON communities
  FOR SELECT
  USING (is_active = true);

-- Service role can do everything
CREATE POLICY "communities_service_role_all" ON communities
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Community admins can update
CREATE POLICY "communities_admin_update" ON communities
  FOR UPDATE
  USING (
    id IN (
      SELECT community_id FROM community_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- COMMUNITY MEMBERS
-- ============================================

-- Everyone can read community members (för leaderboards)
CREATE POLICY "community_members_select_all" ON community_members
  FOR SELECT
  USING (true);

-- Service role can do everything
CREATE POLICY "community_members_service_role_all" ON community_members
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can join communities
CREATE POLICY "community_members_insert_self" ON community_members
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- ORDERS
-- ============================================

-- Users can view own orders
CREATE POLICY "orders_select_own" ON orders
  FOR SELECT
  USING (user_id = auth.uid());

-- Service role can view all
CREATE POLICY "orders_service_role_all" ON orders
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can create orders
CREATE POLICY "orders_insert_own" ON orders
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update own pending orders
CREATE POLICY "orders_update_own" ON orders
  FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending');

-- ============================================
-- ORDER ITEMS
-- ============================================

-- Users can view items from own orders
CREATE POLICY "order_items_select_own" ON order_items
  FOR SELECT
  USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );

-- Service role can do everything
CREATE POLICY "order_items_service_role_all" ON order_items
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can add items to own orders
CREATE POLICY "order_items_insert_own" ON order_items
  FOR INSERT
  WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );

-- ============================================
-- WAREHOUSES
-- ============================================

-- Everyone can read active warehouses
CREATE POLICY "warehouses_select_active" ON consolidation_warehouses
  FOR SELECT
  USING (is_active = true);

-- Service role can do everything
CREATE POLICY "warehouses_service_role_all" ON consolidation_warehouses
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- WAREHOUSE INVENTORY
-- ============================================

-- Everyone can read warehouse inventory (för att se tillgänglighet)
CREATE POLICY "warehouse_inventory_select_all" ON warehouse_inventory
  FOR SELECT
  USING (true);

-- Service role can do everything
CREATE POLICY "warehouse_inventory_service_role_all" ON warehouse_inventory
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- MERCHANT SHIPMENTS
-- ============================================

-- Merchants can view own shipments
CREATE POLICY "merchant_shipments_select_own" ON merchant_shipments
  FOR SELECT
  USING (
    merchant_id IN (
      SELECT id FROM merchants WHERE user_id = auth.uid()
    )
  );

-- Service role can do everything
CREATE POLICY "merchant_shipments_service_role_all" ON merchant_shipments
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- MERCHANT SHIPMENT ITEMS
-- ============================================

-- Merchants can view own shipment items
CREATE POLICY "merchant_shipment_items_select_own" ON merchant_shipment_items
  FOR SELECT
  USING (
    shipment_id IN (
      SELECT id FROM merchant_shipments 
      WHERE merchant_id IN (
        SELECT id FROM merchants WHERE user_id = auth.uid()
      )
    )
  );

-- Service role can do everything
CREATE POLICY "merchant_shipment_items_service_role_all" ON merchant_shipment_items
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- WAREHOUSE ALLOCATIONS
-- ============================================

-- Users can view allocations for own orders
CREATE POLICY "warehouse_allocations_select_own" ON warehouse_allocations
  FOR SELECT
  USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );

-- Service role can do everything
CREATE POLICY "warehouse_allocations_service_role_all" ON warehouse_allocations
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- PENDING MOQ ORDERS
-- ============================================

-- Everyone can read MOQ status (för transparency)
CREATE POLICY "pending_moq_select_all" ON pending_moq_orders
  FOR SELECT
  USING (true);

-- Service role can do everything
CREATE POLICY "pending_moq_service_role_all" ON pending_moq_orders
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- SHIPMENTS
-- ============================================

-- Users can view shipments for own orders
CREATE POLICY "shipments_select_own" ON shipments
  FOR SELECT
  USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );

-- Service role can do everything
CREATE POLICY "shipments_service_role_all" ON shipments
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- CONVERSATIONS
-- ============================================

-- Users can view own conversations
CREATE POLICY "conversations_select_own" ON conversations
  FOR SELECT
  USING (user_id = auth.uid());

-- Service role can do everything
CREATE POLICY "conversations_service_role_all" ON conversations
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can create conversations
CREATE POLICY "conversations_insert_own" ON conversations
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- MESSAGES
-- ============================================

-- Users can view messages in own conversations
CREATE POLICY "messages_select_own" ON messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

-- Service role can do everything
CREATE POLICY "messages_service_role_all" ON messages
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can send messages in own conversations
CREATE POLICY "messages_insert_own" ON messages
  FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- VERIFICATION
-- ============================================

-- Show all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test queries (ska fungera utan auth)
SELECT COUNT(*) as merchants FROM merchants WHERE is_active = true;
SELECT COUNT(*) as products FROM products WHERE is_active = true;
SELECT COUNT(*) as warehouses FROM consolidation_warehouses WHERE is_active = true;

-- ============================================
-- RLS POLICIES UPDATED! ✅
-- ============================================

-- Key points:
-- 1. Public data (products, merchants, warehouses) är läsbar av alla
-- 2. Service role (API routes) kan göra allt
-- 3. Users kan bara se/ändra sin egen data
-- 4. RLS är ENABLED - säkerhet bibehållen!
