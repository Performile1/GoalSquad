-- Seed Test Data Script
-- Migration: 015_seed_test_data.sql
-- This script creates test data for development and testing

-- ============================================
-- INSERT TEST USERS (via auth.users)
-- ============================================
-- Note: This requires service role access to auth.users
-- These users will be created with known passwords for testing

DO $$
DECLARE
  v_admin_id UUID := gen_random_uuid();
  v_customer_id UUID := gen_random_uuid();
  v_seller_id UUID := gen_random_uuid();
  v_merchant_id UUID := gen_random_uuid();
  v_community_id UUID := gen_random_uuid();
BEGIN
  -- Insert into auth.users (requires service role)
  -- Admin user
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES (
    v_admin_id,
    'admin@test.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    '{"role": "admin", "full_name": "Admin User"}'::jsonb
  )
  ON CONFLICT (email) DO NOTHING;
  
  -- Customer user
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES (
    v_customer_id,
    'customer@test.com',
    crypt('customer123', gen_salt('bf')),
    NOW(),
    '{"role": "customer", "full_name": "Customer User"}'::jsonb
  )
  ON CONFLICT (email) DO NOTHING;
  
  -- Seller user
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES (
    v_seller_id,
    'seller@test.com',
    crypt('seller123', gen_salt('bf')),
    NOW(),
    '{"role": "seller", "full_name": "Seller User"}'::jsonb
  )
  ON CONFLICT (email) DO NOTHING;
  
  -- Merchant user
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES (
    v_merchant_id,
    'merchant@test.com',
    crypt('merchant123', gen_salt('bf')),
    NOW(),
    '{"role": "merchant", "full_name": "Merchant User"}'::jsonb
  )
  ON CONFLICT (email) DO NOTHING;
  
  -- Community user
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES (
    v_community_id,
    'community@test.com',
    crypt('community123', gen_salt('bf')),
    NOW(),
    '{"role": "community", "full_name": "Community User"}'::jsonb
  )
  ON CONFLICT (email) DO NOTHING;
  
  RAISE NOTICE 'Test users created';
END $$;

-- ============================================
-- INSERT PROFILES
-- ============================================
DO $$
DECLARE
  v_admin_id UUID;
  v_customer_id UUID;
  v_seller_id UUID;
  v_merchant_id UUID;
  v_community_id UUID;
BEGIN
  -- Get user IDs
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@test.com' LIMIT 1;
  SELECT id INTO v_customer_id FROM auth.users WHERE email = 'customer@test.com' LIMIT 1;
  SELECT id INTO v_seller_id FROM auth.users WHERE email = 'seller@test.com' LIMIT 1;
  SELECT id INTO v_merchant_id FROM auth.users WHERE email = 'merchant@test.com' LIMIT 1;
  SELECT id INTO v_community_id FROM auth.users WHERE email = 'community@test.com' LIMIT 1;
  
  -- Admin profile
  INSERT INTO profiles (user_id, full_name, avatar_url)
  VALUES (v_admin_id, 'Admin User', 'https://i.pravatar.cc/150?u=admin')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Customer profile
  INSERT INTO profiles (user_id, full_name, avatar_url, phone)
  VALUES (v_customer_id, 'Customer User', 'https://i.pravatar.cc/150?u=customer', '070-123-4567')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Seller profile
  INSERT INTO profiles (user_id, full_name, avatar_url, phone)
  VALUES (v_seller_id, 'Seller User', 'https://i.pravatar.cc/150?u=seller', '070-234-5678')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Merchant profile
  INSERT INTO profiles (user_id, full_name, avatar_url, phone)
  VALUES (v_merchant_id, 'Merchant User', 'https://i.pravatar.cc/150?u=merchant', '070-345-6789')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Community profile
  INSERT INTO profiles (user_id, full_name, avatar_url, phone)
  VALUES (v_community_id, 'Community User', 'https://i.pravatar.cc/150?u=community', '070-456-7890')
  ON CONFLICT (user_id) DO NOTHING;
  
  RAISE NOTICE 'Profiles created';
END $$;

-- ============================================
-- INSERT COMMUNITIES
-- ============================================
DO $$
DECLARE
  v_test_community_id UUID := gen_random_uuid();
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'community@test.com' LIMIT 1;
  
  INSERT INTO communities (
    id,
    name,
    description,
    logo_url,
    city,
    country,
    contact_email,
    contact_phone,
    total_sales,
    total_orders,
    created_by
  )
  VALUES (
    v_test_community_id,
    'Test Förening',
    'En testförening för utveckling och testing',
    'https://via.placeholder.com/150',
    'Stockholm',
    'SE',
    'test@example.com',
    '070-123-4567',
    0,
    0,
    v_user_id
  )
  ON CONFLICT (name) DO NOTHING;
  
  -- Add community member
  INSERT INTO community_members (community_id, user_id, role, joined_at)
  VALUES (v_test_community_id, v_user_id, 'admin', NOW())
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Community created';
END $$;

-- ============================================
-- INSERT SELLER PROFILES
-- ============================================
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'seller@test.com' LIMIT 1;
  
  INSERT INTO seller_profiles (
    user_id,
    total_sales,
    total_orders,
    current_level,
    current_xp,
    referral_code
  )
  VALUES (
    v_user_id,
    0,
    0,
    1,
    0,
    'SELLER123'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RAISE NOTICE 'Seller profile created';
END $$;

-- ============================================
-- INSERT MERCHANTS
-- ============================================
DO $$
DECLARE
  v_merchant_id UUID := gen_random_uuid();
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'merchant@test.com' LIMIT 1;
  
  INSERT INTO merchants (
    id,
    user_id,
    business_name,
    business_type,
    description,
    logo_url,
    city,
    country,
    contact_email,
    contact_phone,
    total_sales,
    total_orders,
    is_verified
  )
  VALUES (
    v_merchant_id,
    v_user_id,
    'Test Företag AB',
    'retail',
    'Ett testföretag för utveckling och testing',
    'https://via.placeholder.com/150',
    'Stockholm',
    'SE',
    'merchant@example.com',
    '070-345-6789',
    0,
    0,
    true
  )
  ON CONFLICT (business_name) DO NOTHING;
  
  RAISE NOTICE 'Merchant created';
END $$;

-- ============================================
-- INSERT CATEGORIES
-- ============================================
INSERT INTO categories (name, slug, description, image_url)
VALUES 
  ('Sport', 'sport', 'Sport- och träningsutrustning', 'https://via.placeholder.com/150'),
  ('Kläder', 'klader', 'Kläder och mode', 'https://via.placeholder.com/150'),
  ('Elektronik', 'elektronik', 'Elektronik och teknik', 'https://via.placeholder.com/150'),
  ('Hem & Hushåll', 'hem-hushall', 'Artiklar för hemmet', 'https://via.placeholder.com/150'),
  ('Leksaker', 'leksaker', 'Leksaker och spel', 'https://via.placeholder.com/150')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- INSERT PRODUCTS
-- ============================================
DO $$
DECLARE
  v_merchant_id UUID;
  v_seller_id UUID;
  v_category_id UUID;
BEGIN
  SELECT id INTO v_merchant_id FROM merchants WHERE business_name = 'Test Företag AB' LIMIT 1;
  SELECT id INTO v_seller_id FROM auth.users WHERE email = 'seller@test.com' LIMIT 1;
  SELECT id INTO v_category_id FROM categories WHERE slug = 'sport' LIMIT 1;
  
  -- Test products
  INSERT INTO products (
    name,
    description,
    price,
    category_id,
    merchant_id,
    seller_id,
    image_url,
    stock,
    is_active,
    featured
  )
  VALUES 
  ('Test Fotboll', 'En testfotboll för utveckling', 199.00, v_category_id, v_merchant_id, v_seller_id, 'https://via.placeholder.com/300', 50, true, true),
  ('Test Löparskor', 'Testlöparskor för utveckling', 599.00, v_category_id, v_merchant_id, v_seller_id, 'https://via.placeholder.com/300', 30, true, false),
  ('Test Träningsjacka', 'En testjacka för utveckling', 399.00, v_category_id, v_merchant_id, v_seller_id, 'https://via.placeholder.com/300', 20, true, false)
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Products created';
END $$;

-- ============================================
-- INSERT DISCOUNT CODES
-- ============================================
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'customer@test.com' LIMIT 1;
  
  INSERT INTO discount_codes (
    code,
    description,
    discount_type,
    discount_value,
    valid_from,
    valid_until,
    usage_limit,
    times_used,
    customer_id,
    is_active,
    created_by
  )
  VALUES 
  ('TEST10', 'Testrabatt 10%', 'percentage', 10.00, NOW(), NOW() + INTERVAL '30 days', 100, 0, v_user_id, true, v_user_id),
  ('TEST50', 'Testrabatt 50 kr', 'fixed_amount', 50.00, NOW(), NOW() + INTERVAL '30 days', 50, 0, NULL, true, v_user_id)
  ON CONFLICT (code) DO NOTHING;
  
  RAISE NOTICE 'Discount codes created';
END $$;

-- ============================================
-- INSERT GAMIFICATION DATA
-- ============================================
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'customer@test.com' LIMIT 1;
  
  -- XP
  INSERT INTO gamification_xp (user_id, total_xp, level)
  VALUES (v_user_id, 100, 2)
  ON CONFLICT (user_id) DO UPDATE SET total_xp = 100, level = 2;
  
  -- Daily streak
  INSERT INTO gamification_daily_streaks (user_id, current_streak, longest_streak, last_activity_date)
  VALUES (v_user_id, 5, 10, NOW())
  ON CONFLICT (user_id) DO UPDATE SET current_streak = 5, longest_streak = 10, last_activity_date = NOW();
  
  RAISE NOTICE 'Gamification data created';
END $$;

RAISE NOTICE '=== SEED DATA COMPLETED ===';
RAISE NOTICE 'Test Users:';
RAISE NOTICE '  Admin: admin@test.com / admin123';
RAISE NOTICE '  Customer: customer@test.com / customer123';
RAISE NOTICE '  Seller: seller@test.com / seller123';
RAISE NOTICE '  Merchant: merchant@test.com / merchant123';
RAISE NOTICE '  Community: community@test.com / community123';
