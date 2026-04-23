/**
 * ============================================================
 * MIGRATION 039 — DATABASE SNAPSHOT QUERIES
 * ============================================================
 * Klistra in valfritt block i Supabase SQL Editor och kör.
 * Dessa är READ-ONLY queries — de ändrar ingenting.
 * ============================================================
 */

-- ============================================================
-- QUERY 1: Alla tabeller (status ✅ FINNS / ❌ SAKNAS)
-- ============================================================
SELECT 
  t.expected_table                                              AS "Tabell",
  CASE WHEN pt.tablename IS NOT NULL THEN '✅ FINNS' 
       ELSE '❌ SAKNAS' END                                    AS "Status",
  COALESCE(
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = t.expected_table AND table_schema = 'public')::TEXT,
    '0'
  )                                                            AS "Antal kolumner"
FROM (VALUES
  -- Kärn
  ('organizations'), ('profiles'), ('communities'), ('community_members'),
  ('merchants'), ('products'), ('community_products'), ('blog_posts'),
  -- Orders & Warehouse
  ('orders'), ('order_items'), ('shipments'),
  ('warehouse_partners'), ('consolidation_warehouses'),
  ('warehouse_inventory'), ('product_flow_summary'),
  ('asn_notices'), ('warehouse_events'),
  ('pick_sessions'), ('pick_session_items'), ('product_barcodes'),
  -- Ekonomi
  ('wallets'), ('ledger_entries'), ('split_configurations'),
  ('treasury_holds'), ('ad_payments'), ('ad_payment_transactions'),
  -- Messaging
  ('conversations'), ('conversation_participants'), ('messages'),
  ('merchant_community_messages'), ('broadcast_messages'), ('broadcast_recipients'),
  ('notifications'), ('invitations'), ('coordination_messages'),
  -- Gamification
  ('seller_profiles'), ('seller_xp'), ('seller_avatar_equipment'), ('avatar_items'),
  ('seller_quests'), ('seller_quest_progress'),
  ('loot_boxes'), ('seller_loot_boxes'),
  ('achievements'), ('user_achievements'),
  ('community_milestones'), ('squad_tiers'), ('community_badges'),
  ('customer_support_stats'), ('collector_badges'),
  ('referral_bonuses'), ('cheer_messages'),
  ('leaderboards'),
  -- Ads
  ('ad_placements'), ('ads'), ('ad_stats'),
  ('campaigns'), ('seo_settings'),
  -- Övrigt
  ('entity_goals'), ('merchant_shipping_preferences'),
  ('discount_codes'), ('guardians')
) AS t(expected_table)
LEFT JOIN pg_tables pt 
  ON pt.tablename = t.expected_table AND pt.schemaname = 'public'
ORDER BY 
  CASE WHEN pt.tablename IS NOT NULL THEN 0 ELSE 1 END,
  t.expected_table;


-- ============================================================
-- QUERY 2: Alla kolumner på profiles
-- ============================================================
SELECT 
  ordinal_position AS "#",
  column_name,
  data_type,
  character_maximum_length AS max_len,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;


-- ============================================================
-- QUERY 3: Alla kolumner på communities
-- ============================================================
SELECT 
  ordinal_position AS "#",
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'communities'
ORDER BY ordinal_position;


-- ============================================================
-- QUERY 4: Alla kolumner på merchants + products
-- ============================================================
SELECT 
  table_name,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN ('merchants', 'products', 'orders', 'wallets', 'organizations')
ORDER BY table_name, ordinal_position;


-- ============================================================
-- QUERY 5: RLS policies (alla tabeller)
-- ============================================================
SELECT
  tablename        AS "Tabell",
  policyname       AS "Policy",
  cmd              AS "Operation",
  roles            AS "Roll",
  qual             AS "USING",
  with_check       AS "WITH CHECK"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;


-- ============================================================
-- QUERY 6: Tabeller SOM SAKNAR RLS
-- ============================================================
SELECT 
  c.relname AS "Tabell utan RLS"
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = false
ORDER BY c.relname;


-- ============================================================
-- QUERY 7: Antal rader per tabell (snapshot av data)
-- ============================================================
SELECT
  schemaname,
  tablename,
  n_live_tup AS "Antal rader (approx)"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;


-- ============================================================
-- QUERY 8: Alla index
-- ============================================================
SELECT
  tablename    AS "Tabell",
  indexname    AS "Index",
  indexdef     AS "Definition"
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;


-- ============================================================
-- QUERY 9: CHECK constraints (viktigt för enums)
-- ============================================================
SELECT
  tc.table_name                     AS "Tabell",
  tc.constraint_name                AS "Constraint",
  cc.check_clause                   AS "Check"
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  USING (constraint_schema, constraint_name)
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name, tc.constraint_name;


-- ============================================================
-- QUERY 10: FK-relationer (referential integrity)
-- ============================================================
SELECT
  kcu.table_name                    AS "Från tabell",
  kcu.column_name                   AS "Kolumn",
  ccu.table_name                    AS "Till tabell",
  ccu.column_name                   AS "FK kolumn",
  rc.delete_rule                    AS "ON DELETE"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY kcu.table_name, kcu.column_name;
