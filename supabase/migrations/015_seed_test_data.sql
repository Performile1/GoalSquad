-- Seed Test Data Script
-- Migration: 015_seed_test_data.sql
-- This script creates test data for development and testing
-- Note: Users should be created via Supabase Auth API or Dashboard
-- Test user emails for manual creation:
-- admin@test.com / admin123
-- customer@test.com / customer123
-- seller@test.com / seller123
-- merchant@test.com / merchant123
-- community@test.com / community123

-- ============================================
-- INSERT PRODUCT CATEGORIES
-- ============================================
DO $$
BEGIN
  INSERT INTO product_categories (name, description, slug)
  VALUES 
    ('Sport', 'Sports equipment and accessories', 'sport'),
    ('Kläder', 'Clothing and apparel', 'klader'),
    ('Elektronik', 'Electronics and gadgets', 'elektronik'),
    ('Hem & Hushåll', 'Home and household items', 'hem-hushall'),
    ('Leksaker', 'Toys and games', 'leksaker')
  ON CONFLICT (slug) DO NOTHING;
  
  RAISE NOTICE 'Product categories created';
END $$;

-- ============================================
-- INSERT DISCOUNT CODES
-- ============================================
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
  is_active
)
VALUES 
  ('TEST10', 'Testrabatt 10%', 'percentage', 10.00, NOW(), NOW() + INTERVAL '30 days', 100, 0, NULL, true),
  ('TEST50', 'Testrabatt 50 kr', 'fixed_amount', 50.00, NOW(), NOW() + INTERVAL '30 days', 50, 0, NULL, true)
ON CONFLICT (code) DO NOTHING;
