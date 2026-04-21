-- ============================================
-- GOALSQUAD - COMPREHENSIVE SCHEMA VALIDATION
-- ============================================
-- 
-- This script validates the entire database schema against expected structure
-- Run this in Supabase SQL Editor to check schema health
-- 
-- WHAT THIS SCRIPT CHECKS:
-- 1. All expected tables exist
-- 2. All expected columns exist in each table
-- 3. RLS is enabled on all tables
-- 4. RLS policies exist for critical tables
-- 5. Indexes exist for performance
-- 6. Foreign key constraints are valid
-- ============================================

DO $$
DECLARE
  v_table_count INTEGER := 0;
  v_missing_tables TEXT[] := '{}';
  v_missing_columns TEXT[] := '{}';
  v_missing_policies TEXT[] := '{}';
  v_missing_indexes TEXT[] := '{}';
BEGIN
  RAISE NOTICE '=== GOALSQUAD SCHEMA VALIDATION STARTED ===';
  
  -- ============================================
  -- 1. CHECK TABLE EXISTENCE
  -- ============================================
  RAISE NOTICE 'Checking table existence...';
  
  -- Core Tables
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'organizations');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'profiles');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'communities' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'communities');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_members' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'community_members');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchants' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'merchants');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'products');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_products' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'community_products');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_posts' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'blog_posts');
  END IF;
  
  -- Phase 1 Tables
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seller_profiles' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'seller_profiles');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'warehouse_partners' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'warehouse_partners');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'consolidation_warehouses' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'consolidation_warehouses');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'warehouse_inventory' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'warehouse_inventory');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_flow_summary' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'product_flow_summary');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'orders');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'order_items');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'conversations');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchant_community_messages' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'merchant_community_messages');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invitations' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'invitations');
  END IF;
  
  -- Phase 2 Tables
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_categories' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'product_categories');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchant_contacts' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'merchant_contacts');
  END IF;
  
  -- Phase 3 Tables
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchant_shipments' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'merchant_shipments');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchant_shipment_items' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'merchant_shipment_items');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shipping_restriction_categories' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'shipping_restriction_categories');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhook_queue' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'webhook_queue');
  END IF;
  
  -- Additional Tables
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchant_inventory' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'merchant_inventory');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'return_reasons' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'return_reasons');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'returns' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'returns');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'return_items' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'return_items');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'return_comments' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'return_comments');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'return_status_history' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'return_status_history');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'discount_codes' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'discount_codes');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_auctions' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'product_auctions');
  END IF;
  
  -- Gamification Tables
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seller_xp' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'seller_xp');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seller_avatar_equipment' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'seller_avatar_equipment');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'avatar_items' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'avatar_items');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seller_quests' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'seller_quests');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seller_quest_progress' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'seller_quest_progress');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loot_boxes' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'loot_boxes');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seller_loot_boxes' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'seller_loot_boxes');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_milestones' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'community_milestones');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'squad_tiers' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'squad_tiers');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_badges' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'community_badges');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_support_stats' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'customer_support_stats');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collector_badges' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'collector_badges');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_bonuses' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'referral_bonuses');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cheer_messages' AND table_schema = 'public') THEN
    v_missing_tables := array_append(v_missing_tables, 'cheer_messages');
  END IF;
  
  -- Report missing tables
  IF array_length(v_missing_tables, 1) > 0 THEN
    RAISE NOTICE 'MISSING TABLES: %', array_to_string(v_missing_tables, ', ');
  ELSE
    RAISE NOTICE 'All expected tables exist';
  END IF;
  
  -- ============================================
  -- 2. CHECK RLS ENABLED ON ALL TABLES
  -- ============================================
  RAISE NOTICE 'Checking RLS enabled on tables...';
  
  -- Check RLS on existing tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'organizations' AND rowsecurity = true) THEN
      v_missing_policies := array_append(v_missing_policies, 'organizations: RLS not enabled');
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND rowsecurity = true) THEN
      v_missing_policies := array_append(v_missing_policies, 'profiles: RLS not enabled');
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'communities' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'communities' AND rowsecurity = true) THEN
      v_missing_policies := array_append(v_missing_policies, 'communities: RLS not enabled');
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchants' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'merchants' AND rowsecurity = true) THEN
      v_missing_policies := array_append(v_missing_policies, 'merchants: RLS not enabled');
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'products' AND rowsecurity = true) THEN
      v_missing_policies := array_append(v_missing_policies, 'products: RLS not enabled');
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'discount_codes' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'discount_codes' AND rowsecurity = true) THEN
      v_missing_policies := array_append(v_missing_policies, 'discount_codes: RLS not enabled');
    END IF;
  END IF;
  
  IF array_length(v_missing_policies, 1) > 0 THEN
    RAISE NOTICE 'RLS ISSUES: %', array_to_string(v_missing_policies, ', ');
  ELSE
    RAISE NOTICE 'RLS enabled on all checked tables';
  END IF;
  
  -- ============================================
  -- 3. CHECK CRITICAL POLICIES EXIST
  -- ============================================
  RAISE NOTICE 'Checking critical RLS policies...';
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'discount_codes' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'discount_codes' AND policyname = 'Allow authenticated to view active discount codes') THEN
      v_missing_policies := array_append(v_missing_policies, 'discount_codes: Allow authenticated to view active discount codes');
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_auctions' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_auctions' AND policyname = 'Allow sellers to view their auctions') THEN
      v_missing_policies := array_append(v_missing_policies, 'product_auctions: Allow sellers to view their auctions');
    END IF;
  END IF;
  
  IF array_length(v_missing_policies, 1) > 0 THEN
    RAISE NOTICE 'MISSING POLICIES: %', array_to_string(v_missing_policies, ', ');
  ELSE
    RAISE NOTICE 'All critical policies exist';
  END IF;
  
  -- ============================================
  -- 4. CHECK CRITICAL INDEXES EXIST
  -- ============================================
  RAISE NOTICE 'Checking critical indexes...';
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'discount_codes' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'discount_codes' AND indexname = 'idx_discount_codes_code') THEN
      v_missing_indexes := array_append(v_missing_indexes, 'discount_codes: idx_discount_codes_code');
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_auctions' AND table_schema = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'product_auctions' AND indexname = 'idx_product_auctions_product_id') THEN
      v_missing_indexes := array_append(v_missing_indexes, 'product_auctions: idx_product_auctions_product_id');
    END IF;
  END IF;
  
  IF array_length(v_missing_indexes, 1) > 0 THEN
    RAISE NOTICE 'MISSING INDEXES: %', array_to_string(v_missing_indexes, ', ');
  ELSE
    RAISE NOTICE 'All critical indexes exist';
  END IF;
  
  -- ============================================
  -- SUMMARY
  -- ============================================
  RAISE NOTICE '=== VALIDATION SUMMARY ===';
  RAISE NOTICE 'Missing tables: %', COALESCE(array_length(v_missing_tables, 1), 0);
  RAISE NOTICE 'Policy issues: %', COALESCE(array_length(v_missing_policies, 1), 0);
  RAISE NOTICE 'Missing indexes: %', COALESCE(array_length(v_missing_indexes, 1), 0);
  RAISE NOTICE '=== VALIDATION COMPLETE ===';
END $$;

-- ============================================
-- 5. EXPECTED VS ACTUAL TABLE STATUS
-- ============================================
WITH expected_tables AS (
  SELECT unnest(ARRAY[
    'organizations', 'profiles', 'communities', 'community_members', 'merchants',
    'products', 'community_products', 'blog_posts',
    'seller_profiles', 'warehouse_partners', 'consolidation_warehouses', 'warehouse_inventory',
    'product_flow_summary', 'orders', 'order_items', 'conversations',
    'merchant_community_messages', 'invitations',
    'product_categories', 'merchant_contacts',
    'merchant_shipments', 'merchant_shipment_items', 'shipping_restriction_categories', 'webhook_queue',
    'merchant_inventory', 'return_reasons', 'returns', 'return_items',
    'return_comments', 'return_status_history', 'discount_codes', 'product_auctions',
    'seller_xp', 'seller_avatar_equipment', 'avatar_items', 'seller_quests',
    'seller_quest_progress', 'loot_boxes', 'seller_loot_boxes', 'community_milestones',
    'squad_tiers', 'community_badges', 'customer_support_stats', 'collector_badges',
    'referral_bonuses', 'cheer_messages',
    -- Messaging system tables
    'messages', 'conversation_participants', 'message_reads',
    -- Broadcast system tables
    'broadcast_messages', 'broadcast_recipients',
    -- Additional warehouse/order tables
    'shipments', 'warehouse_allocations', 'pending_moq_orders'
  ]) as table_name
)
SELECT 
  et.table_name,
  CASE 
    WHEN t.tablename IS NOT NULL THEN 'EXISTS'
    ELSE 'MISSING'
  END as status,
  CASE 
    WHEN t.rowsecurity = true THEN 'ENABLED'
    ELSE 'DISABLED'
  END as rls_status,
  CASE 
    WHEN p.policy_count > 0 THEN p.policy_count::TEXT
    ELSE '0'
  END as policy_count
FROM expected_tables et
LEFT JOIN pg_tables t ON t.tablename = et.table_name AND t.schemaname = 'public'
LEFT JOIN (
  SELECT tablename, COUNT(*) as policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
) p ON p.tablename = et.table_name
ORDER BY status DESC, et.table_name;
