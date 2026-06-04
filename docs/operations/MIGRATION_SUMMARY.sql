-- =====================================================================
-- GOALSQUAD MIGRATION SUMMARY
-- =====================================================================
-- Denna fil visar alla migrationer som ska köras i ordning
-- För att köra dessa, kopiera innehållet i varje fil till Supabase SQL Editor

-- =====================================================================
-- MIGRATION 088: MOQ Campaign Rules
-- =====================================================================
-- Fil: supabase/migrations/088_moq_campaign_rules.sql
-- Syfte: Lägg till MOQ-statusar och affärsregelfält till campaigns-tabellen
-- Status: ✅ KLAR (fixat tabellnamn community_campaigns -> campaigns)

-- =====================================================================
-- MIGRATION 089: Logistics Bulk Shipments
-- =====================================================================
-- Fil: supabase/migrations/089_logistics_bulk_shipments.sql
-- Syfte: Skapa bulk_shipments tabell och RPC för picklist
-- Status: ✅ KLAR (fixat tabellnamn community_campaigns -> campaigns)

-- =====================================================================
-- MIGRATION 090: Multi-Echelon Logistics
-- =====================================================================
-- Fil: supabase/migrations/090_multi_echelon_logistics.sql
-- Syfte: Skapa warehouse_network, shipment_segments, warehouse_cross_dock_queue, warehouse_discrepancies
-- Status: ✅ KLAR (fixat tabellnamn warehouses -> consolidation_warehouses, RLS policies)

-- =====================================================================
-- MIGRATION 091: New Plan Tables (Fas 1-4)
-- =====================================================================
-- Fil: supabase/migrations/091_new_plan_tables.sql
-- Syfte: Skapa tabeller för logistik, analytics, UX och gamification med idempotency
-- Status: ✅ NY - KLAR

-- Tabeller som skapas i 091:
-- 1. customer_payment_methods - Sparade betalmetoder
-- 2. system_worker_logs - CRON-jobb logs
-- 3. supporter_orders - Supporter orders med idempotency
-- 4. campaign_notifications - Aviseringslogg med idempotency
-- 5. hub_payouts_receipts - Utlämningslås
-- 6. seller_leaderboard_stats - Cachad säljarstatistik
-- 7. seller_badges - Badge-liggare med idempotency
-- 8. financial_settlements - Ekonomisk slutavräkning

-- Index som skapas i 091:
-- - idx_payment_methods_user
-- - idx_payment_methods_default
-- - idx_worker_logs_name_date
-- - idx_worker_logs_status
-- - idx_supporter_orders_campaign
-- - idx_supporter_orders_seller
-- - idx_supporter_orders_idempotency
-- - idx_campaign_notifications_campaign
-- - idx_campaign_notifications_recipient
-- - idx_campaign_notifications_lock
-- - idx_hub_payouts_campaign
-- - idx_hub_payouts_seller
-- - idx_hub_payouts_lock
-- - idx_leaderboard_campaign
-- - idx_leaderboard_units
-- - idx_seller_badges_campaign
-- - idx_seller_badges_seller
-- - idx_seller_badges_lock
-- - idx_financial_settlements_campaign
-- - idx_financial_settlements_status
-- - idx_discrepancies_sku_type

-- =====================================================================
-- EXECUTION ORDER
-- =====================================================================
-- 1. Kör migration 088 (om inte redan körd)
-- 2. Kör migration 089 (om inte redan körd)
-- 3. Kör migration 090 (om inte redan körd)
-- 4. Kör migration 091 (NY)

-- =====================================================================
-- VERIFICATION STEPS
-- =====================================================================
-- Efter att ha kört alla migrationer, verifiera följande:

-- 1. Kontrollera att campaigns-tabellen har MOQ-fälten:
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'campaigns' AND column_name IN ('moq_target', 'grace_period_hours');

-- 2. Kontrollera att bulk_shipments-tabellen finns:
-- SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bulk_shipments');

-- 3. Kontrollera att warehouse_network-tabellen finns:
-- SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'warehouse_network');

-- 4. Kontrollera att nya tabeller från 091 finns:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_name IN ('customer_payment_methods', 'system_worker_logs', 'supporter_orders', 
-- 'campaign_notifications', 'hub_payouts_receipts', 'seller_leaderboard_stats', 'seller_badges', 'financial_settlements');

-- 5. Kontrollera att RLS policies är aktiverade:
-- SELECT tablename, policyname FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename IN ('customer_payment_methods', 'supporter_orders', 'campaign_notifications');

-- =====================================================================
-- NOTES
-- =====================================================================
-- - Alla tabeller har RLS policies aktiverade
-- - Idempotency guards är implementerade via UNIQUE constraints
-- - Index är skapade för prestandaoptimering
-- - Migrationer 088-090 har redan körts och verifierats
-- - Migration 091 är ny och ska köras härnäst
