/**
 * ============================================
 * VERIFICATION QUERIES
 * ============================================
 * 
 * Kör dessa EFTER CLEAN_INSTALL.sql för att verifiera
 * att allt fungerar korrekt.
 * 
 * INSTRUKTIONER:
 * 1. Kör CLEAN_INSTALL.sql först
 * 2. Vänta tills den är klar
 * 3. Kör dessa queries EN I TAGET
 * 4. Kontrollera resultaten
 * 
 * ============================================
 */

-- ============================================
-- 1. KOLLA ALLA TABELLER
-- ============================================

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Förväntat resultat: 20 tabeller
-- broadcast_messages, broadcast_recipients, communities, community_members,
-- consolidation_warehouses, conversation_participants, conversations,
-- merchant_shipment_items, merchant_shipments, merchants, message_reads,
-- messages, order_items, orders, pending_moq_orders, products, profiles,
-- shipments, warehouse_allocations, warehouse_inventory

-- ============================================
-- 2. KOLLA PROFILES TABELL (VIKTIG!)
-- ============================================

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Förväntat: guardian_id ska finnas som UUID

-- ============================================
-- 3. KOLLA GUARDIAN_ID FOREIGN KEY
-- ============================================

SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'profiles'
  AND constraint_name = 'profiles_guardian_id_fkey';

-- Förväntat: profiles_guardian_id_fkey | FOREIGN KEY

-- ============================================
-- 4. KOLLA COMMUNITY_MEMBERS KOLUMNER
-- ============================================

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'community_members'
  AND column_name IN ('status', 'seller_profile_id')
ORDER BY column_name;

-- Förväntat:
-- seller_profile_id | uuid
-- status | character varying

-- ============================================
-- 5. KOLLA SAMPLE DATA
-- ============================================

SELECT 'Merchants' as table_name, COUNT(*) as count FROM merchants
UNION ALL SELECT 'Products', COUNT(*) FROM products
UNION ALL SELECT 'Warehouses', COUNT(*) FROM consolidation_warehouses;

-- Förväntat:
-- Merchants   | 5
-- Products    | 11
-- Warehouses  | 3

-- ============================================
-- 6. KOLLA PRODUCTS MED PROFIT
-- ============================================

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
ORDER BY m.name, p.name
LIMIT 5;

-- Förväntat: 5 produkter med profit calculations

-- ============================================
-- 7. KOLLA RLS POLICIES
-- ============================================

SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Förväntat: Flera tabeller med policies

-- ============================================
-- 8. KOLLA FUNCTIONS
-- ============================================

SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('find_nearest_warehouse', 'get_product_flow', 'get_unread_message_count')
ORDER BY routine_name;

-- Förväntat: 3 functions

-- ============================================
-- 9. KOLLA INDEXES PÅ PROFILES
-- ============================================

SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
ORDER BY indexname;

-- Förväntat: idx_profiles_guardian ska finnas

-- ============================================
-- 10. TEST GUARDIAN RELATIONSHIP
-- ============================================

-- Skapa test guardian (kräver att du har en user i auth.users)
-- OBS: Kör INTE detta om du inte har en test user!
-- 
-- INSERT INTO profiles (id, email, role, full_name)
-- VALUES (
--   'test-uuid-here',  -- Ersätt med faktisk auth.users.id
--   'test@example.com',
--   'guardian',
--   'Test Guardian'
-- );

-- ============================================
-- ✅ VERIFICATION COMPLETE
-- ============================================
-- 
-- Om alla queries ovan ger förväntade resultat:
-- ✅ Databasen är korrekt uppsatt
-- ✅ Alla 20 tabeller finns
-- ✅ guardian_id kolumn finns
-- ✅ status kolumn finns
-- ✅ Sample data finns
-- ✅ RLS policies finns
-- ✅ Functions finns
-- 
-- NÄSTA STEG:
-- 1. Hämta Supabase keys (Settings → API)
--    - NEXT_PUBLIC_SUPABASE_URL
--    - NEXT_PUBLIC_SUPABASE_ANON_KEY
--    - SUPABASE_SERVICE_ROLE_KEY
-- 
-- 2. Sätt i Vercel (Settings → Environment Variables)
--    - NEXT_PUBLIC_SUPABASE_URL
--    - NEXT_PUBLIC_SUPABASE_ANON_KEY
--    - SUPABASE_SERVICE_ROLE_KEY
--    - NEXT_PUBLIC_APP_URL (din Vercel URL)
-- 
-- 3. Redeploy Vercel
-- 
-- 4. Test live site!
-- ============================================
