-- Schema Validation Script
-- Migration: 014_validate_schema.sql
-- This script validates the database schema against expected structure

-- Create a temporary table to store validation results
CREATE TEMPORARY TABLE IF NOT EXISTS validation_results (
  category VARCHAR(50),
  item_name VARCHAR(100),
  item_type VARCHAR(50),
  status VARCHAR(20),
  details TEXT
);

-- ============================================
-- EXPECTED TABLES
-- ============================================
DO $$
DECLARE
  v_expected_tables TEXT[] := ARRAY[
    'profiles',
    'communities',
    'community_members',
    'seller_profiles',
    'merchants',
    'merchant_inventory',
    'products',
    'orders',
    'order_items',
    'discount_codes',
    'product_auctions',
    'gamification_xp',
    'gamification_badges',
    'gamification_quests',
    'gamification_daily_streaks',
    'returns',
    'messages'
  ];
  v_table_name TEXT;
  v_exists BOOLEAN;
BEGIN
  FOREACH v_table_name IN ARRAY v_expected_tables
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = v_table_name AND table_schema = 'public'
    ) INTO v_exists;
    
    INSERT INTO validation_results (category, item_name, item_type, status, details)
    VALUES (
      'tables',
      v_table_name,
      'table',
      CASE WHEN v_exists THEN 'EXISTS' ELSE 'MISSING' END,
      CASE WHEN v_exists THEN 'Table exists in database' ELSE 'Table is missing from database' END
    );
  END LOOP;
END $$;

-- ============================================
-- DISCOUNT CODES TABLE COLUMNS
-- ============================================
DO $$
DECLARE
  v_expected_columns JSONB := '{
    "id": "uuid",
    "code": "character varying",
    "description": "text",
    "discount_type": "character varying",
    "discount_value": "numeric",
    "min_purchase_amount": "numeric",
    "max_discount_amount": "numeric",
    "valid_from": "timestamp with time zone",
    "valid_until": "timestamp with time zone",
    "usage_limit": "integer",
    "times_used": "integer",
    "customer_id": "uuid",
    "is_active": "boolean",
    "created_at": "timestamp with time zone",
    "updated_at": "timestamp with time zone",
    "created_by": "uuid"
  }'::jsonb;
  v_column_name TEXT;
  v_expected_type TEXT;
  v_actual_type TEXT;
  v_exists BOOLEAN;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'discount_codes' AND table_schema = 'public') THEN
    FOR v_column_name, v_expected_type IN SELECT key, value FROM jsonb_each_text(v_expected_columns)
    LOOP
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'discount_codes'
        AND column_name = v_column_name
        AND table_schema = 'public'
      ) INTO v_exists;
      
      IF v_exists THEN
        SELECT data_type INTO v_actual_type
        FROM information_schema.columns
        WHERE table_name = 'discount_codes'
        AND column_name = v_column_name
        AND table_schema = 'public';
        
        INSERT INTO validation_results (category, item_name, item_type, status, details)
        VALUES (
          'discount_codes_columns',
          v_column_name,
          'column',
          CASE WHEN v_actual_type LIKE v_expected_type THEN 'OK' ELSE 'TYPE_MISMATCH' END,
          'Expected: ' || v_expected_type || ', Actual: ' || v_actual_type
        );
      ELSE
        INSERT INTO validation_results (category, item_name, item_type, status, details)
        VALUES (
          'discount_codes_columns',
          v_column_name,
          'column',
          'MISSING',
          'Column is missing from discount_codes table'
        );
      END IF;
    END LOOP;
  END IF;
END $$;

-- ============================================
-- PRODUCT AUCTIONS TABLE COLUMNS
-- ============================================
DO $$
DECLARE
  v_expected_columns JSONB := '{
    "id": "uuid",
    "product_id": "uuid",
    "seller_id": "uuid",
    "community_id": "uuid",
    "pricing_model": "character varying",
    "fixed_price": "numeric",
    "starting_bid": "numeric",
    "reserve_price": "numeric",
    "current_bid": "numeric",
    "current_bidder_id": "uuid",
    "min_offer_price": "numeric",
    "seller_commission_percentage": "numeric",
    "community_commission_percentage": "numeric",
    "auction_start": "timestamp with time zone",
    "auction_end": "timestamp with time zone",
    "status": "character varying",
    "created_at": "timestamp with time zone",
    "updated_at": "timestamp with time zone"
  }'::jsonb;
  v_column_name TEXT;
  v_expected_type TEXT;
  v_actual_type TEXT;
  v_exists BOOLEAN;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_auctions' AND table_schema = 'public') THEN
    FOR v_column_name, v_expected_type IN SELECT key, value FROM jsonb_each_text(v_expected_columns)
    LOOP
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'product_auctions'
        AND column_name = v_column_name
        AND table_schema = 'public'
      ) INTO v_exists;
      
      IF v_exists THEN
        SELECT data_type INTO v_actual_type
        FROM information_schema.columns
        WHERE table_name = 'product_auctions'
        AND column_name = v_column_name
        AND table_schema = 'public';
        
        INSERT INTO validation_results (category, item_name, item_type, status, details)
        VALUES (
          'product_auctions_columns',
          v_column_name,
          'column',
          CASE WHEN v_actual_type LIKE v_expected_type THEN 'OK' ELSE 'TYPE_MISMATCH' END,
          'Expected: ' || v_expected_type || ', Actual: ' || v_actual_type
        );
      ELSE
        INSERT INTO validation_results (category, item_name, item_type, status, details)
        VALUES (
          'product_auctions_columns',
          v_column_name,
          'column',
          'MISSING',
          'Column is missing from product_auctions table'
        );
      END IF;
    END LOOP;
  END IF;
END $$;

-- ============================================
-- CHECK RLS POLICIES
-- ============================================
DO $$
DECLARE
  v_table_name TEXT;
BEGIN
  -- Check discount_codes policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'discount_codes' AND table_schema = 'public') THEN
    FOREACH v_table_name IN ARRAY ARRAY['Allow authenticated to view active discount codes', 'Allow service role full access']
    LOOP
      INSERT INTO validation_results (category, item_name, item_type, status, details)
      SELECT
        'discount_codes_policies',
        policyname,
        'policy',
        'EXISTS',
        'Policy exists on discount_codes table'
      FROM pg_policies
      WHERE tablename = 'discount_codes'
      AND policyname = v_table_name
      UNION ALL
      SELECT
        'discount_codes_policies',
        v_table_name,
        'policy',
        'MISSING',
        'Policy is missing from discount_codes table'
      WHERE NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'discount_codes'
        AND policyname = v_table_name
      );
    END LOOP;
  END IF;
  
  -- Check product_auctions policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_auctions' AND table_schema = 'public') THEN
    FOREACH v_table_name IN ARRAY ARRAY['Allow sellers to view their auctions', 'Allow community members to view community auctions', 'Allow service role full access']
    LOOP
      INSERT INTO validation_results (category, item_name, item_type, status, details)
      SELECT
        'product_auctions_policies',
        policyname,
        'policy',
        'EXISTS',
        'Policy exists on product_auctions table'
      FROM pg_policies
      WHERE tablename = 'product_auctions'
      AND policyname = v_table_name
      UNION ALL
      SELECT
        'product_auctions_policies',
        v_table_name,
        'policy',
        'MISSING',
        'Policy is missing from product_auctions table'
      WHERE NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'product_auctions'
        AND policyname = v_table_name
      );
    END LOOP;
  END IF;
END $$;

-- ============================================
-- DISPLAY VALIDATION RESULTS
-- ============================================
SELECT 
  category,
  item_name,
  item_type,
  status,
  details
FROM validation_results
ORDER BY 
  category, 
  CASE 
    WHEN status = 'MISSING' THEN 1 
    WHEN status = 'TYPE_MISMATCH' THEN 2 
    ELSE 3 
  END,
  item_name;

-- Summary
SELECT 
  status,
  COUNT(*) as count
FROM validation_results
GROUP BY status
ORDER BY 
  CASE 
    WHEN status = 'MISSING' THEN 1 
    WHEN status = 'TYPE_MISMATCH' THEN 2 
    ELSE 3 
  END;
