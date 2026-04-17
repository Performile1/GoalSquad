/**
 * ============================================
 * CHECK COLUMNS IN DATABASE
 * ============================================
 *
 * Run this script to see which columns exist in each table
 * This helps identify missing columns causing migration errors
 * ============================================
 */

-- ============================================
-- EXPECTED COLUMNS vs ACTUAL COLUMNS
-- ============================================

-- seller_profiles expected columns
WITH expected_seller_profiles AS (
  SELECT unnest(ARRAY[
    'id', 'user_id', 'community_id', 'avatar_data', 'xp_total', 'current_level',
    'streak_days', 'last_sale_date', 'total_sales', 'total_orders', 'total_commission',
    'shop_url', 'shop_bio', 'shop_video_url', 'onboarding_completed', 'onboarding_step',
    'bank_account_verified', 'metadata', 'created_at', 'updated_at'
  ]) as expected_column
)
SELECT 'seller_profiles' as table_name, expected_column as column_name,
       CASE WHEN c.column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM expected_seller_profiles esp
LEFT JOIN information_schema.columns c ON c.table_name = 'seller_profiles' AND c.column_name = esp.expected_column
ORDER BY esp.expected_column;

-- warehouse_partners expected columns
WITH expected_warehouse_partners AS (
  SELECT unnest(ARRAY[
    'id', 'organization_id', 'partner_name', 'partner_code', 'hub_type', 'territory',
    'contact_email', 'contact_phone', 'api_key', 'webhook_url', 'webhook_secret',
    'sla_throughput_hours', 'sla_accuracy_percent', 'price_per_inbound', 'price_per_pallet',
    'price_per_split', 'status', 'partner_tier', 'total_processed', 'accuracy_rate',
    'metadata', 'created_at', 'updated_at'
  ]) as expected_column
)
SELECT 'warehouse_partners' as table_name, expected_column as column_name,
       CASE WHEN c.column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM expected_warehouse_partners ewp
LEFT JOIN information_schema.columns c ON c.table_name = 'warehouse_partners' AND c.column_name = ewp.expected_column
ORDER BY ewp.expected_column;

-- consolidation_warehouses expected columns
WITH expected_consolidation_warehouses AS (
  SELECT unnest(ARRAY[
    'id', 'name', 'code', 'warehouse_type', 'address_line1', 'address_line2', 'postal_code',
    'city', 'region', 'country', 'latitude', 'longitude', 'postal_code_ranges',
    'coverage_radius_km', 'max_capacity_m3', 'current_utilization_m3', 'max_daily_orders',
    'operating_hours', 'processing_days', 'is_active', 'accepts_new_orders', 'contact_person',
    'contact_email', 'contact_phone', 'metadata', 'created_at', 'updated_at'
  ]) as expected_column
)
SELECT 'consolidation_warehouses' as table_name, expected_column as column_name,
       CASE WHEN c.column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM expected_consolidation_warehouses ecw
LEFT JOIN information_schema.columns c ON c.table_name = 'consolidation_warehouses' AND c.column_name = ecw.expected_column
ORDER BY ecw.expected_column;

-- warehouse_inventory expected columns
WITH expected_warehouse_inventory AS (
  SELECT unnest(ARRAY[
    'id', 'warehouse_id', 'product_id', 'merchant_id', 'quantity_received',
    'quantity_allocated', 'quantity_available', 'quantity_shipped',
    'received_from_merchant_at', 'batch_number', 'status', 'metadata', 'created_at', 'updated_at'
  ]) as expected_column
)
SELECT 'warehouse_inventory' as table_name, expected_column as column_name,
       CASE WHEN c.column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM expected_warehouse_inventory ewi
LEFT JOIN information_schema.columns c ON c.table_name = 'warehouse_inventory' AND c.column_name = ewi.expected_column
ORDER BY ewi.expected_column;

-- product_flow_summary expected columns
WITH expected_product_flow_summary AS (
  SELECT unnest(ARRAY[
    'id', 'product_id', 'pending_order_quantity', 'in_transit_quantity',
    'warehouse_available', 'warehouse_allocated', 'allocated_to_customers',
    'metadata', 'updated_at'
  ]) as expected_column
)
SELECT 'product_flow_summary' as table_name, expected_column as column_name,
       CASE WHEN c.column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM expected_product_flow_summary epfs
LEFT JOIN information_schema.columns c ON c.table_name = 'product_flow_summary' AND c.column_name = epfs.expected_column
ORDER BY epfs.expected_column;

-- orders expected columns
WITH expected_orders AS (
  SELECT unnest(ARRAY[
    'id', 'order_number', 'customer_id', 'customer_email', 'customer_phone',
    'shipping_name', 'shipping_address_line1', 'shipping_address_line2',
    'shipping_city', 'shipping_postal_code', 'shipping_country',
    'billing_name', 'billing_address_line1', 'billing_address_line2',
    'billing_city', 'billing_postal_code', 'billing_country',
    'subtotal', 'shipping_total', 'tax_total', 'total', 'currency',
    'stripe_payment_intent_id', 'payment_status', 'paid_at', 'status',
    'metadata', 'created_at', 'updated_at'
  ]) as expected_column
)
SELECT 'orders' as table_name, expected_column as column_name,
       CASE WHEN c.column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM expected_orders eo
LEFT JOIN information_schema.columns c ON c.table_name = 'orders' AND c.column_name = eo.expected_column
ORDER BY eo.expected_column;

-- order_items expected columns
WITH expected_order_items AS (
  SELECT unnest(ARRAY[
    'id', 'order_id', 'product_id', 'merchant_id', 'sku', 'name', 'quantity',
    'unit_price', 'merchant_base_price', 'subtotal', 'sales_margin', 'handling_fee',
    'weight_grams', 'length_mm', 'width_mm', 'height_mm', 'fulfillment_status',
    'created_at', 'updated_at'
  ]) as expected_column
)
SELECT 'order_items' as table_name, expected_column as column_name,
       CASE WHEN c.column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM expected_order_items eoi
LEFT JOIN information_schema.columns c ON c.table_name = 'order_items' AND c.column_name = eoi.expected_column
ORDER BY eoi.expected_column;

-- conversations expected columns
WITH expected_conversations AS (
  SELECT unnest(ARRAY[
    'id', 'conversation_type', 'community_id', 'name', 'created_by', 'created_at', 'updated_at'
  ]) as expected_column
)
SELECT 'conversations' as table_name, expected_column as column_name,
       CASE WHEN c.column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM expected_conversations ec
LEFT JOIN information_schema.columns c ON c.table_name = 'conversations' AND c.column_name = ec.expected_column
ORDER BY ec.expected_column;

-- merchant_community_messages expected columns
WITH expected_merchant_community_messages AS (
  SELECT unnest(ARRAY[
    'id', 'merchant_id', 'community_id', 'subject', 'content', 'message_type',
    'metadata', 'sent_at', 'expires_at'
  ]) as expected_column
)
SELECT 'merchant_community_messages' as table_name, expected_column as column_name,
       CASE WHEN c.column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM expected_merchant_community_messages emcm
LEFT JOIN information_schema.columns c ON c.table_name = 'merchant_community_messages' AND c.column_name = emcm.expected_column
ORDER BY emcm.expected_column;

-- invitations expected columns
WITH expected_invitations AS (
  SELECT unnest(ARRAY[
    'id', 'community_id', 'invited_by', 'email', 'full_name', 'phone', 'role',
    'message', 'token', 'status', 'expires_at', 'accepted_at', 'accepted_by',
    'metadata', 'created_at', 'updated_at'
  ]) as expected_column
)
SELECT 'invitations' as table_name, expected_column as column_name,
       CASE WHEN c.column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM expected_invitations ei
LEFT JOIN information_schema.columns c ON c.table_name = 'invitations' AND c.column_name = ei.expected_column
ORDER BY ei.expected_column;

-- Check columns in warehouse_partners
SELECT 'warehouse_partners' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'warehouse_partners'
ORDER BY ordinal_position;

-- Check columns in consolidation_warehouses
SELECT 'consolidation_warehouses' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'consolidation_warehouses'
ORDER BY ordinal_position;

-- Check columns in warehouse_inventory
SELECT 'warehouse_inventory' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'warehouse_inventory'
ORDER BY ordinal_position;

-- Check columns in product_flow_summary
SELECT 'product_flow_summary' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'product_flow_summary'
ORDER BY ordinal_position;

-- Check columns in orders
SELECT 'orders' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Check columns in order_items
SELECT 'order_items' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;

-- Check columns in conversations
SELECT 'conversations' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'conversations'
ORDER BY ordinal_position;

-- Check columns in merchant_community_messages
SELECT 'merchant_community_messages' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'merchant_community_messages'
ORDER BY ordinal_position;

-- Check columns in invitations
SELECT 'invitations' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'invitations'
ORDER BY ordinal_position;

-- ============================================
-- CHECK STATUS COLUMNS
-- ============================================

-- Check if status column exists in each table
SELECT 'warehouse_partners' as table_name, 
       CASE WHEN column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status_column_status
FROM information_schema.columns
WHERE table_name = 'warehouse_partners' AND column_name = 'status'
UNION ALL
SELECT 'warehouse_inventory' as table_name, 
       CASE WHEN column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status_column_status
FROM information_schema.columns
WHERE table_name = 'warehouse_inventory' AND column_name = 'status'
UNION ALL
SELECT 'consolidation_warehouses' as table_name, 
       CASE WHEN column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status_column_status
FROM information_schema.columns
WHERE table_name = 'consolidation_warehouses' AND column_name = 'status'
UNION ALL
SELECT 'orders' as table_name, 
       CASE WHEN column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status_column_status
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'status'
UNION ALL
SELECT 'order_items' as table_name, 
       CASE WHEN column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status_column_status
FROM information_schema.columns
WHERE table_name = 'order_items' AND column_name = 'status';

-- ============================================
-- CHECK INDEXES
-- ============================================

-- Check indexes on seller_profiles
SELECT 'seller_profiles' as table_name, indexname as index_name, indexdef as index_def
FROM pg_indexes
WHERE tablename = 'seller_profiles';

-- Check indexes on warehouse_partners
SELECT 'warehouse_partners' as table_name, indexname as index_name, indexdef as index_def
FROM pg_indexes
WHERE tablename = 'warehouse_partners';

-- Check indexes on consolidation_warehouses
SELECT 'consolidation_warehouses' as table_name, indexname as index_name, indexdef as index_def
FROM pg_indexes
WHERE tablename = 'consolidation_warehouses';

-- Check indexes on warehouse_inventory
SELECT 'warehouse_inventory' as table_name, indexname as index_name, indexdef as index_def
FROM pg_indexes
WHERE tablename = 'warehouse_inventory';

-- Check indexes on product_flow_summary
SELECT 'product_flow_summary' as table_name, indexname as index_name, indexdef as index_def
FROM pg_indexes
WHERE tablename = 'product_flow_summary';

-- Check indexes on orders
SELECT 'orders' as table_name, indexname as index_name, indexdef as index_def
FROM pg_indexes
WHERE tablename = 'orders';

-- Check indexes on order_items
SELECT 'order_items' as table_name, indexname as index_name, indexdef as index_def
FROM pg_indexes
WHERE tablename = 'order_items';

-- Check indexes on conversations
SELECT 'conversations' as table_name, indexname as index_name, indexdef as index_def
FROM pg_indexes
WHERE tablename = 'conversations';

-- Check indexes on merchant_community_messages
SELECT 'merchant_community_messages' as table_name, indexname as index_name, indexdef as index_def
FROM pg_indexes
WHERE tablename = 'merchant_community_messages';

-- Check indexes on invitations
SELECT 'invitations' as table_name, indexname as index_name, indexdef as index_def
FROM pg_indexes
WHERE tablename = 'invitations';

-- ============================================
-- CHECK RLS POLICIES
-- ============================================

-- Check RLS policies on seller_profiles
SELECT 'seller_profiles' as table_name, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'seller_profiles';

-- Check RLS policies on warehouse_partners
SELECT 'warehouse_partners' as table_name, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'warehouse_partners';

-- Check RLS policies on consolidation_warehouses
SELECT 'consolidation_warehouses' as table_name, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'consolidation_warehouses';

-- Check RLS policies on warehouse_inventory
SELECT 'warehouse_inventory' as table_name, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'warehouse_inventory';

-- Check RLS policies on product_flow_summary
SELECT 'product_flow_summary' as table_name, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'product_flow_summary';

-- Check RLS policies on orders
SELECT 'orders' as table_name, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'orders';

-- Check RLS policies on order_items
SELECT 'order_items' as table_name, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'order_items';

-- Check RLS policies on conversations
SELECT 'conversations' as table_name, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'conversations';

-- Check RLS policies on merchant_community_messages
SELECT 'merchant_community_messages' as table_name, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'merchant_community_messages';

-- Check RLS policies on invitations
SELECT 'invitations' as table_name, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'invitations';

-- ============================================
-- CHECK FOREIGN KEYS
-- ============================================

SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN (
    'seller_profiles',
    'warehouse_partners',
    'consolidation_warehouses',
    'warehouse_inventory',
    'product_flow_summary',
    'orders',
    'order_items',
    'conversations',
    'merchant_community_messages',
    'invitations'
  )
ORDER BY tc.table_name, kcu.column_name;
