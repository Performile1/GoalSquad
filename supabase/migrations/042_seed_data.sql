/**
 * ============================================================
 * MIGRATION 042 — SEED DATA (Development/Testing)
 * ============================================================
 * Creates minimal seed data to make the app functional:
 *   - gs_admin user (password: admin123 - CHANGE IN PRODUCTION)
 *   - Test communities
 *   - Test products
 *   - Default split configuration
 * ============================================================
 */

-- ============================================================
-- 1. GS_ADMIN USER
-- ============================================================
-- NOTE: Create the gs_admin user via Supabase Dashboard or CLI:
--   Email: admin@goalsquad.se
--   Password: (set your own)
--   Then manually update the profile role to 'gs_admin'
--
-- The profile will be automatically created by Supabase auth trigger,
-- or you can update it after creating the auth user:
--
-- UPDATE public.profiles SET role = 'gs_admin' WHERE email = 'admin@goalsquad.se';
--
-- ============================================================
-- 2. DEFAULT SPLIT CONFIGURATION
-- ============================================================
INSERT INTO public.split_configurations (
  name,
  merchant_id,
  product_category,
  platform_percent,
  community_percent,
  seller_percent,
  warehouse_percent,
  handling_fee,
  shipping_spread_percent,
  active,
  created_at
)
VALUES (
  'Platform Default',
  NULL,  -- Applies to all merchants
  NULL,  -- Applies to all categories
  12.0,  -- 12% platform
  60.0,  -- 60% community
  20.0,  -- 20% seller
  8.0,   -- 8% warehouse
  25.0,  -- 25 SEK handling fee
  20.0,  -- 20% shipping spread
  true,
  NOW()
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. TEST COMMUNITIES
-- ============================================================
INSERT INTO public.communities (
  id,
  name,
  slug,
  description,
  community_type,
  status,
  created_at
)
VALUES
  (
    '10000000-0000-0000-0000-000000000001'::UUID,
    'AIK Fotboll',
    'aik-fotboll',
    'Allmänna Idrottsklubben - Stockholms stolthet sedan 1891',
    'club',
    'active',
    NOW()
  ),
  (
    '10000000-0000-0000-0000-000000000002'::UUID,
    'Djurgårdens IF',
    'dif',
    'Djurgårdens Idrottsförening - Stockholms blårandiga',
    'club',
    'active',
    NOW()
  ),
  (
    '10000000-0000-0000-0000-000000000003'::UUID,
    'Hammarby IF',
    'hammarby',
    'Bajen - Grönvitt för alltid',
    'club',
    'active',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. TEST MERCHANTS
-- ============================================================
-- Add missing columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'email') THEN
    ALTER TABLE public.merchants ADD COLUMN email VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'phone') THEN
    ALTER TABLE public.merchants ADD COLUMN phone VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'verification_status') THEN
    ALTER TABLE public.merchants ADD COLUMN verification_status VARCHAR(50) DEFAULT 'pending';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'commission_percent') THEN
    ALTER TABLE public.merchants ADD COLUMN commission_percent DECIMAL(5,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'name') THEN
    ALTER TABLE public.merchants ADD COLUMN name VARCHAR(255);
  END IF;
END $$;

INSERT INTO public.merchants (
  id,
  name,
  business_name,
  organization_id,
  email,
  phone,
  verification_status,
  commission_percent,
  created_at,
  updated_at
)
VALUES
  (
    '20000000-0000-0000-0000-000000000001'::UUID,
    'Lays',
    'Lays Sverige',
    NULL,
    'info@lays.se',
    '+46812345678',
    'verified',
    10.0,
    NOW(),
    NOW()
  ),
  (
    '20000000-0000-0000-0000-000000000002'::UUID,
    'Estrella',
    'Estrella',
    NULL,
    'info@estrella.se',
    '+46887654321',
    'verified',
    12.0,
    NOW(),
    NOW()
  ),
  (
    '20000000-0000-0000-0000-000000000003'::UUID,
    'OLW',
    'OLW',
    NULL,
    'info@olw.se',
    '+46811223344',
    'verified',
    8.0,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. TEST PRODUCTS
-- ============================================================
-- Add missing columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'title') THEN
    ALTER TABLE public.products ADD COLUMN title VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'name') THEN
    ALTER TABLE public.products ADD COLUMN name VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'currency') THEN
    ALTER TABLE public.products ADD COLUMN currency VARCHAR(3) DEFAULT 'SEK';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'moq') THEN
    ALTER TABLE public.products ADD COLUMN moq INTEGER DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'status') THEN
    ALTER TABLE public.products ADD COLUMN status VARCHAR(50) DEFAULT 'active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'category') THEN
    ALTER TABLE public.products ADD COLUMN category VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stock_quantity') THEN
    ALTER TABLE public.products ADD COLUMN stock_quantity INTEGER DEFAULT 0;
  END IF;
END $$;

INSERT INTO public.products (
  id,
  merchant_id,
  title,
  name,
  description,
  price,
  currency,
  sku,
  stock_quantity,
  moq,
  status,
  category,
  created_at,
  updated_at
)
VALUES
  (
    '30000000-0000-0000-0000-000000000001'::UUID,
    '20000000-0000-0000-0000-000000000001'::UUID,
    'Lays Classic Salted',
    'Lays Classic Salted',
    'Den klassiska saltade chipsen. Perfekt för matchen!',
    29.90,
    'SEK',
    'LAYS-001',
    1000,
    10,
    'active',
    'chips',
    NOW(),
    NOW()
  ),
  (
    '30000000-0000-0000-0000-000000000002'::UUID,
    '20000000-0000-0000-0000-000000000001'::UUID,
    'Lays Sour Cream & Onion',
    'Lays Sour Cream & Onion',
    'Gräddfil och lök - en svensk favorit',
    32.90,
    'SEK',
    'LAYS-002',
    800,
    10,
    'active',
    'chips',
    NOW(),
    NOW()
  ),
  (
    '30000000-0000-0000-0000-000000000003'::UUID,
    '20000000-0000-0000-0000-000000000002'::UUID,
    'Estrella Original',
    'Estrella Original',
    'Svensk chips i världsklass',
    27.90,
    'SEK',
    'EST-001',
    1200,
    10,
    'active',
    'chips',
    NOW(),
    NOW()
  ),
  (
    '30000000-0000-0000-0000-000000000004'::UUID,
    '20000000-0000-0000-0000-000000000002'::UUID,
    'Estrella Dill',
    'Estrella Dill',
    'Dillchips för den som gillar det klassiska',
    28.90,
    'SEK',
    'EST-002',
    600,
    10,
    'active',
    'chips',
    NOW(),
    NOW()
  ),
  (
    '30000000-0000-0000-0000-000000000005'::UUID,
    '20000000-0000-0000-0000-000000000003'::UUID,
    'OLW Grillchips',
    'OLW Grillchips',
    'Gräddade chips med rökig smak',
    25.90,
    'SEK',
    'OLW-001',
    900,
    10,
    'active',
    'chips',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. DEFAULT ACHIEVEMENTS
-- ============================================================
INSERT INTO public.achievements (
  id,
  name,
  description,
  icon_url,
  xp_reward,
  requirement_type,
  requirement_value,
  is_active,
  created_at
)
VALUES
  ('50000000-0000-0000-0000-000000000001'::UUID, 'Första Försäljningen', 'Gör din första försäljning', '🏆', 100, 'first_sale', 1, true, NOW()),
  ('50000000-0000-0000-0000-000000000002'::UUID, 'Säljare', 'Sälj 10 produkter', '🎯', 200, 'total_sales', 10, true, NOW()),
  ('50000000-0000-0000-0000-000000000003'::UUID, 'Mästare', 'Sälj 100 produkter', '👑', 500, 'total_sales', 100, true, NOW()),
  ('50000000-0000-0000-0000-000000000004'::UUID, 'Community Hero', 'Sälj för 1000 SEK', '🌟', 300, 'revenue', 1000, true, NOW())
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN RAISE NOTICE 'Migration 042: seed data inserted'; END $$;
