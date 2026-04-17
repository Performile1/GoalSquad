/**
 * ============================================
 * CHECK MISSING COLUMNS ONLY
 * ============================================
 *
 * This script shows only the expected vs actual columns
 * to identify which columns are missing
 * ============================================
 */

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
