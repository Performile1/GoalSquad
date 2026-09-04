-- Read-only production audit. Run manually in Supabase SQL Editor.
-- Returns one row per expected object and its current production status.
WITH expected_tables(name) AS (
  VALUES
    ('profiles'), ('notifications'), ('products'), ('product_categories'),
    ('community_products'), ('orders'), ('order_items'), ('communities'),
    ('merchants'), ('seller_profiles'), ('warehouse_partners'),
    ('conversations'), ('conversation_participants'), ('messages'),
    ('customer_payment_methods'), ('product_reviews'), ('referrals'),
    ('customer_support_stats'), ('warehouse_picking_tasks'), ('bulk_shipments')
), expected_functions(name) AS (
  VALUES ('get_warehouse_flow'), ('get_aggregated_campaign_picklist')
), expected_columns(table_name, column_name) AS (
  VALUES
    ('orders', 'stripe_payment_intent_id'), ('orders', 'payment_status'),
    ('profiles', 'role'), ('notifications', 'recipient_id'),
    ('warehouse_partners', 'user_id'), ('warehouse_staff', 'warehouse_id'),
    ('products', 'certifications'), ('products', 'images')
)
SELECT 'table' AS object_type, e.name AS object_name,
       CASE WHEN t.table_name IS NULL THEN 'MISSING' ELSE 'OK' END AS status,
       NULL::text AS detail
FROM expected_tables e
LEFT JOIN information_schema.tables t ON t.table_schema = 'public' AND t.table_name = e.name
UNION ALL
SELECT 'function', e.name,
       CASE WHEN p.proname IS NULL THEN 'MISSING' ELSE 'OK' END,
       'public.' || e.name
FROM expected_functions e
LEFT JOIN pg_proc p ON p.pronamespace = 'public'::regnamespace AND p.proname = e.name
UNION ALL
SELECT 'column', e.table_name || '.' || e.column_name,
       CASE WHEN c.column_name IS NULL THEN 'MISSING' ELSE 'OK' END,
       NULL::text
FROM expected_columns e
LEFT JOIN information_schema.columns c ON c.table_schema = 'public' AND c.table_name = e.table_name AND c.column_name = e.column_name
ORDER BY object_type, object_name;

SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('service_role', 'authenticated')
  AND table_name IN ('profiles', 'notifications', 'products', 'orders', 'order_items', 'communities', 'merchants', 'seller_profiles', 'warehouse_partners', 'conversations', 'conversation_participants', 'messages', 'customer_payment_methods', 'product_reviews', 'referrals')
ORDER BY table_name, grantee, privilege_type;

SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled, COUNT(p.policyname)::integer AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policies p ON p.schemaname = n.nspname AND p.tablename = c.relname
WHERE n.nspname = 'public'
  AND c.relname IN ('profiles', 'notifications', 'products', 'orders', 'order_items', 'communities', 'merchants', 'seller_profiles', 'warehouse_partners', 'conversations', 'conversation_participants', 'messages', 'customer_payment_methods', 'product_reviews', 'referrals')
GROUP BY c.relname, c.relrowsecurity
ORDER BY c.relname;