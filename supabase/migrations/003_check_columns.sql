/**
 * ============================================
 * CHECK COLUMNS IN DATABASE
 * ============================================
 * 
 * Run this script to see which columns exist in each table
 * This helps identify missing columns causing migration errors
 * ============================================
 */

-- Check columns in seller_profiles
SELECT 'seller_profiles' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'seller_profiles'
ORDER BY ordinal_position;

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
