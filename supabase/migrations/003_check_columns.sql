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
