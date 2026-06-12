/**
 * ============================================================
 * MIGRATION 109 — COMPREHENSIVE TEST DATA SEED
 * ============================================================
 *
 * Seeds the entire GoalSquad test ecosystem:
 *   Auth users, profiles, merchants, warehouse partners,
 *   communities (clubs), seller profiles, product categories,
 *   products, community products, campaigns, campaign products,
 *   campaign sellers, community members, orders, order items,
 *   seller XP, treasury holds.
 *
 * All test users use password: Test123!
 * Run in Supabase SQL Editor. Safe to re-run (ON CONFLICT).
 * ============================================================
 */

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. DEFENSIVE COLUMN CHECKS
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'name') THEN
    ALTER TABLE public.merchants ADD COLUMN name VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'business_name') THEN
    ALTER TABLE public.merchants ADD COLUMN business_name VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'user_id') THEN
    ALTER TABLE public.merchants ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'name') THEN
    ALTER TABLE public.products ADD COLUMN name VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'title') THEN
    ALTER TABLE public.products ADD COLUMN title VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stock_quantity') THEN
    ALTER TABLE public.products ADD COLUMN stock_quantity INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'image_url') THEN
    ALTER TABLE public.products ADD COLUMN image_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'tags') THEN
    ALTER TABLE public.products ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'ean') THEN
    ALTER TABLE public.products ADD COLUMN ean VARCHAR(13);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'brand') THEN
    ALTER TABLE public.products ADD COLUMN brand VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'base_price') THEN
    ALTER TABLE public.products ADD COLUMN base_price NUMERIC(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'retail_price') THEN
    ALTER TABLE public.products ADD COLUMN retail_price NUMERIC(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'currency') THEN
    ALTER TABLE public.products ADD COLUMN currency VARCHAR(3) DEFAULT 'SEK';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'weight_grams') THEN
    ALTER TABLE public.products ADD COLUMN weight_grams INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'length_mm') THEN
    ALTER TABLE public.products ADD COLUMN length_mm INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'width_mm') THEN
    ALTER TABLE public.products ADD COLUMN width_mm INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'height_mm') THEN
    ALTER TABLE public.products ADD COLUMN height_mm INTEGER;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouse_partners' AND column_name = 'user_id') THEN
    ALTER TABLE public.warehouse_partners ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouse_partners' AND column_name = 'name') THEN
    ALTER TABLE public.warehouse_partners ADD COLUMN name VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouse_partners' AND column_name = 'city') THEN
    ALTER TABLE public.warehouse_partners ADD COLUMN city VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouse_partners' AND column_name = 'country') THEN
    ALTER TABLE public.warehouse_partners ADD COLUMN country VARCHAR(2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouse_partners' AND column_name = 'capacity_m3') THEN
    ALTER TABLE public.warehouse_partners ADD COLUMN capacity_m3 INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouse_partners' AND column_name = 'is_active') THEN
    ALTER TABLE public.warehouse_partners ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'community_id') THEN
    ALTER TABLE public.campaigns ADD COLUMN community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'name') THEN
    ALTER TABLE public.campaigns ADD COLUMN name VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'start_date') THEN
    ALTER TABLE public.campaigns ADD COLUMN start_date TIMESTAMP WITH TIME ZONE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'end_date') THEN
    ALTER TABLE public.campaigns ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'target_amount') THEN
    ALTER TABLE public.campaigns ADD COLUMN target_amount DECIMAL(12,2);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'owner_id') THEN
    ALTER TABLE public.communities ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'slug') THEN
    ALTER TABLE public.communities ADD COLUMN slug VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'logo_url') THEN
    ALTER TABLE public.communities ADD COLUMN logo_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'banner_url') THEN
    ALTER TABLE public.communities ADD COLUMN banner_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'sport_type') THEN
    ALTER TABLE public.communities ADD COLUMN sport_type VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'member_count') THEN
    ALTER TABLE public.communities ADD COLUMN member_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================================
-- 2. AUTH USERS
-- ============================================================
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111'::UUID, 'merchant1@test.goalsquad.shop', crypt('Test123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222'::UUID, 'merchant2@test.goalsquad.shop', crypt('Test123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333'::UUID, 'warehouse1@test.goalsquad.shop', crypt('Test123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444'::UUID, 'warehouse2@test.goalsquad.shop', crypt('Test123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555555'::UUID, 'seller1@test.goalsquad.shop', crypt('Test123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('66666666-6666-6666-6666-666666666666'::UUID, 'seller2@test.goalsquad.shop', crypt('Test123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('77777777-7777-7777-7777-777777777777'::UUID, 'seller3@test.goalsquad.shop', crypt('Test123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('88888888-8888-8888-8888-888888888888'::UUID, 'seller4@test.goalsquad.shop', crypt('Test123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID, 'clubadmin1@test.goalsquad.shop', crypt('Test123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID, 'clubadmin2@test.goalsquad.shop', crypt('Test123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc'::UUID, 'consumer1@test.goalsquad.shop', crypt('Test123!', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd'::UUID, 'consumer2@test.goalsquad.shop', crypt('Test123!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

UPDATE auth.users SET email_confirmed_at = NOW(), updated_at = NOW()
WHERE email IN (
  'merchant1@test.goalsquad.shop', 'merchant2@test.goalsquad.shop',
  'warehouse1@test.goalsquad.shop', 'warehouse2@test.goalsquad.shop',
  'seller1@test.goalsquad.shop', 'seller2@test.goalsquad.shop',
  'seller3@test.goalsquad.shop', 'seller4@test.goalsquad.shop',
  'clubadmin1@test.goalsquad.shop', 'clubadmin2@test.goalsquad.shop',
  'consumer1@test.goalsquad.shop', 'consumer2@test.goalsquad.shop'
);

-- ============================================================
-- 3. PROFILES
-- ============================================================
INSERT INTO public.profiles (id, email, full_name, role, is_active, is_verified, phone, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111'::UUID, 'merchant1@test.goalsquad.shop', 'GoalSquad Sports AB', 'merchant', true, true, '0701111111', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222'::UUID, 'merchant2@test.goalsquad.shop', 'Nordic Gear Oy', 'merchant', true, true, '0702222222', NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333'::UUID, 'warehouse1@test.goalsquad.shop', 'LogiCenter Stockholm', 'warehouse', true, true, '0703333333', NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444'::UUID, 'warehouse2@test.goalsquad.shop', 'Fria Lager Malmö', 'warehouse', true, true, '0704444444', NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555555'::UUID, 'seller1@test.goalsquad.shop', 'Anna Svensson', 'seller', true, true, NULL, NOW(), NOW()),
  ('66666666-6666-6666-6666-666666666666'::UUID, 'seller2@test.goalsquad.shop', 'Erik Johansson', 'seller', true, true, NULL, NOW(), NOW()),
  ('77777777-7777-7777-7777-777777777777'::UUID, 'seller3@test.goalsquad.shop', 'Lisa Karlsson', 'seller', true, true, NULL, NOW(), NOW()),
  ('88888888-8888-8888-8888-888888888888'::UUID, 'seller4@test.goalsquad.shop', 'Jonas Nilsson', 'seller', true, true, NULL, NOW(), NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID, 'clubadmin1@test.goalsquad.shop', 'IFK Göteborg Admin', 'community', true, true, NULL, NOW(), NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID, 'clubadmin2@test.goalsquad.shop', 'Malmö FF Admin', 'community', true, true, NULL, NOW(), NOW()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc'::UUID, 'consumer1@test.goalsquad.shop', 'Test Kund', 'user', true, true, NULL, NOW(), NOW()),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd'::UUID, 'consumer2@test.goalsquad.shop', 'Maria Berg', 'user', true, true, NULL, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  is_verified = EXCLUDED.is_verified,
  updated_at = NOW();

-- ============================================================
-- 4. MERCHANTS
-- ============================================================
INSERT INTO public.merchants (id, user_id, name, business_name, email, phone, verification_status, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001'::UUID, '11111111-1111-1111-1111-111111111111'::UUID, 'GoalSquad Sports AB', 'GoalSquad Sports AB', 'info@goalsquad.shop', '+46701111111', 'verified', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002'::UUID, '22222222-2222-2222-2222-222222222222'::UUID, 'Nordic Gear Oy', 'Nordic Gear Oy', 'info@nordicgear.fi', '+46702222222', 'verified', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  business_name = EXCLUDED.business_name,
  user_id = EXCLUDED.user_id,
  verification_status = EXCLUDED.verification_status,
  updated_at = NOW();

-- ============================================================
-- 5. WAREHOUSE PARTNERS
-- ============================================================
INSERT INTO public.warehouse_partners (id, user_id, name, partner_name, partner_code, hub_type, territory, city, country, capacity_m3, contact_email, contact_phone, status, is_active, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000003'::UUID, '33333333-3333-3333-3333-333333333333'::UUID, 'LogiCenter Stockholm', 'LogiCenter Stockholm', 'LC-SE-01', 'both', 'SE', 'Stockholm', 'SE', 5000, 'contact@logicenter.se', '0703333333', 'active', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000004'::UUID, '44444444-4444-4444-4444-444444444444'::UUID, 'Fria Lager Malmö', 'Fria Lager Malmö', 'FL-SE-02', 'consolidation', 'SE', 'Malmö', 'SE', 3000, 'contact@frialager.se', '0704444444', 'active', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. COMMUNITIES (Clubs)
-- ============================================================
INSERT INTO public.communities (id, owner_id, name, slug, description, logo_url, banner_url, community_type, sport_type, member_count, status, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000005'::UUID, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID, 'IFK Göteborg', 'ifk-goteborg', 'En av Sveriges största fotbollsklubbar.', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200&q=80', 'https://images.unsplash.com/photo-1522778119026-d647f0565c6a?w=800&q=80', 'club', 'Fotboll', 120, 'active', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000006'::UUID, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID, 'Malmö FF', 'malmo-ff', 'Skånes stoltaste fotbollsklubb.', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200&q=80', 'https://images.unsplash.com/photo-1522778119026-d647f0565c6a?w=800&q=80', 'club', 'Fotboll', 85, 'active', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  status = EXCLUDED.status,
  member_count = EXCLUDED.member_count,
  updated_at = NOW();

-- ============================================================
-- 7. SELLER PROFILES
-- ============================================================
INSERT INTO public.seller_profiles (id, user_id, community_id, xp_total, current_level, streak_days, total_sales, total_orders, total_commission, shop_url, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000051'::UUID, '55555555-5555-5555-5555-555555555555'::UUID, '00000000-0000-0000-0000-000000000005'::UUID, 450, 3, 5, 15000, 12, 750, 'anna-shop', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000052'::UUID, '66666666-6666-6666-6666-666666666666'::UUID, '00000000-0000-0000-0000-000000000005'::UUID, 280, 2, 3, 8200, 8, 410, 'erik-shop', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000053'::UUID, '77777777-7777-7777-7777-777777777777'::UUID, '00000000-0000-0000-0000-000000000006'::UUID, 620, 4, 7, 22500, 18, 1125, 'lisa-shop', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000054'::UUID, '88888888-8888-8888-8888-888888888888'::UUID, '00000000-0000-0000-0000-000000000006'::UUID, 120, 1, 1, 5400, 5, 270, 'jonas-shop', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. PRODUCT CATEGORIES
-- ============================================================
INSERT INTO public.product_categories (id, name, slug, description, icon, color, sort_order, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000101'::UUID, 'Sportkläder', 'sportklader', 'Träningskläder för alla sporter', '👕', '#003B3D', 1, true),
  ('00000000-0000-0000-0000-000000000102'::UUID, 'Fotboll', 'fotboll', 'Fotbollar och fotbollsutrustning', '⚽', '#003B3D', 2, true),
  ('00000000-0000-0000-0000-000000000103'::UUID, 'Utrustning', 'utrustning', 'Sportutrustning och tillbehör', '🎒', '#003B3D', 3, true),
  ('00000000-0000-0000-0000-000000000104'::UUID, 'Tillbehör', 'tillbehor', 'Sporttillbehör och småprylar', '🧤', '#003B3D', 4, true),
  ('00000000-0000-0000-0000-000000000105'::UUID, 'Mat & Dryck', 'mat-dryck', 'Energi och dryck för träning', '🥤', '#003B3D', 5, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  is_active = EXCLUDED.is_active;

-- ============================================================
-- 9. PRODUCTS (10 produkter)
-- ============================================================
INSERT INTO public.products (
  id, merchant_id, sku, title, name, description,
  price, base_price, retail_price, currency,
  category_id, stock_quantity, status,
  image_url, tags, ean, brand,
  weight_grams, length_mm, width_mm, height_mm,
  created_at, updated_at
)
VALUES
  ('00000000-0000-0000-0000-000000000701'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'GS-JACKA-001', 'GoalSquad Träningsjacka', 'GoalSquad Träningsjacka', 'Vind- och vattenavvisande jacka perfekt för träning i alla väder.', 699.00, 450.00, 699.00, 'SEK', '00000000-0000-0000-0000-000000000101'::UUID, 200, 'active', 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&q=80', ARRAY['jacka','träning','sportkläder','vindtät'], '7312345678901', 'GoalSquad', 420, 350, 280, 80, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000702'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'GS-BOLL-001', 'GoalSquad Fotboll', 'GoalSquad Fotboll', 'FIFA-godkänd fotboll i premiumkvalitet.', 299.00, 180.00, 299.00, 'SEK', '00000000-0000-0000-0000-000000000102'::UUID, 150, 'active', 'https://images.unsplash.com/photo-1486286701208-11713a29d79c?w=600&q=80', ARRAY['fotboll','matchboll','fifa'], '7312345678902', 'GoalSquad', 450, 220, 220, 220, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000703'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'GS-BYXA-001', 'GoalSquad Träningsbyxor', 'GoalSquad Träningsbyxor', 'Löparbyxor med reflexdetaljer för säker träning i mörkret.', 449.00, 280.00, 449.00, 'SEK', '00000000-0000-0000-0000-000000000101'::UUID, 180, 'active', 'https://images.unsplash.com/photo-1518600506278-4e8ef466b810?w=600&q=80', ARRAY['byxor','löpning','reflex','sportkläder'], '7312345678903', 'GoalSquad', 320, 300, 250, 50, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000704'::UUID, '00000000-0000-0000-0000-000000000002'::UUID, 'NG-HAND-001', 'Nordic Vinterhandske', 'Nordic Vinterhandske', 'Värmeisolerade handskar för vinterträning.', 199.00, 120.00, 199.00, 'SEK', '00000000-0000-0000-0000-000000000104'::UUID, 300, 'active', 'https://images.unsplash.com/photo-1583416750470-965b6387ece4?w=600&q=80', ARRAY['handskar','vinter','isolering','tillbehör'], '7312345678904', 'Nordic Gear', 180, 250, 150, 40, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000705'::UUID, '00000000-0000-0000-0000-000000000002'::UUID, 'NG-PANN-001', 'Nordic Pannband', 'Nordic Pannband', 'Svettavvisande pannband i merinoull.', 149.00, 80.00, 149.00, 'SEK', '00000000-0000-0000-0000-000000000104'::UUID, 250, 'active', 'https://images.unsplash.com/photo-1576872381149-7847515ce5d8?w=600&q=80', ARRAY['pannband','merino','ull','tillbehör'], '7312345678905', 'Nordic Gear', 45, 200, 80, 20, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000706'::UUID, '00000000-0000-0000-0000-000000000002'::UUID, 'NG-FLAS-001', 'Nordic Vattenflaska', 'Nordic Vattenflaska', 'BPA-fri flaska med dubbelväggsisolering.', 99.00, 55.00, 99.00, 'SEK', '00000000-0000-0000-0000-000000000103'::UUID, 400, 'active', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80', ARRAY['flaska','vatten','isolering','träning'], '7312345678906', 'Nordic Gear', 300, 250, 80, 80, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000707'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'GS-SKOR-001', 'GoalSquad Löparskor', 'GoalSquad Löparskor', 'Lätta löparskor med dämpning för alla underlag.', 899.00, 550.00, 899.00, 'SEK', '00000000-0000-0000-0000-000000000101'::UUID, 120, 'active', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80', ARRAY['skor','löpning','dämpning','sportkläder'], '7312345678907', 'GoalSquad', 280, 310, 120, 110, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000708'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'GS-TRÖJA-001', 'GoalSquad Matchtröja', 'GoalSquad Matchtröja', 'Andningsbar matchtröja med fukttransport.', 349.00, 220.00, 349.00, 'SEK', '00000000-0000-0000-0000-000000000101'::UUID, 95, 'active', 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80', ARRAY['tröja','match','fotboll','andningsbar'], '7312345678908', 'GoalSquad', 180, 280, 200, 20, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000709'::UUID, '00000000-0000-0000-0000-000000000002'::UUID, 'NG-RYGG-001', 'Nordic Träningsryggsäck', 'Nordic Träningsryggsäck', 'Vattentät ryggsäck med skofack och datorfack.', 549.00, 320.00, 549.00, 'SEK', '00000000-0000-0000-0000-000000000103'::UUID, 80, 'active', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80', ARRAY['ryggsäck','väska','vattentät','träning'], '7312345678909', 'Nordic Gear', 650, 450, 300, 220, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000710'::UUID, '00000000-0000-0000-0000-000000000002'::UUID, 'NG-GEL-001', 'Nordic Energigel (10-pack)', 'Nordic Energigel (10-pack)', 'Sportgel med koffein och kolhydrater för långa pass.', 129.00, 70.00, 129.00, 'SEK', '00000000-0000-0000-0000-000000000105'::UUID, 350, 'active', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80', ARRAY['energi','gel','koffein','mat-dryck'], '7312345678910', 'Nordic Gear', 120, 150, 100, 50, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  base_price = EXCLUDED.base_price,
  retail_price = EXCLUDED.retail_price,
  stock_quantity = EXCLUDED.stock_quantity,
  status = EXCLUDED.status,
  image_url = EXCLUDED.image_url,
  tags = EXCLUDED.tags,
  updated_at = NOW();

-- ============================================================
-- 10. COMMUNITY PRODUCTS
-- ============================================================
INSERT INTO public.community_products (
  id, title, description, price, category, seller_type, seller_name, community_name, location, stock, shipping_info, contact_email, image_urls, status, approved_at, created_at, updated_at
)
VALUES
  ('00000000-0000-0000-0000-000000000801'::UUID, 'IFK Göteborg Matchkläder', 'Officiella supporterkläder med klubbemblem.', 499.00, 'Sportkläder', 'community', 'IFK Göteborg Supporters', 'IFK Göteborg', 'Göteborg', 50, 'Fri frakt vid beställning över 500 kr.', 'shop@ifkgoteborg.sup', ARRAY['https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80'], 'active', NOW(), NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000802'::UUID, 'Malmö FF Träningspaket', 'Komplett träningspaket med klubbens färger.', 799.00, 'Utrustning', 'community', 'Malmö FF Support', 'Malmö FF', 'Malmö', 30, 'Hämtas på stadion eller skickas.', 'shop@malmo.ff', ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80'], 'active', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 11. CAMPAIGNS
-- ============================================================
INSERT INTO public.campaigns (id, community_id, title, name, slug, description, status, start_date, end_date, target_amount, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000901'::UUID, '00000000-0000-0000-0000-000000000005'::UUID, 'Vårkampanj 2025 — IFK Göteborg', 'Vårkampanj 2025', 'varkampanj-ifk-goteborg-2025', 'Säsongens första föreningskampanj med rabatterade priser.', 'active', NOW() - INTERVAL '30 days', NOW() + INTERVAL '60 days', 50000.00, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000902'::UUID, '00000000-0000-0000-0000-000000000006'::UUID, 'Sommarträningskampanj — Malmö FF', 'Sommarträningskampanj', 'sommartraning-malmo-ff-2025', 'Kampanj för sommarens träningskläder och utrustning.', 'active', NOW() - INTERVAL '15 days', NOW() + INTERVAL '45 days', 35000.00, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 12. CAMPAIGN PRODUCTS
-- ============================================================
INSERT INTO public.campaign_products (id, campaign_id, product_id, campaign_price, moq_per_seller, is_active, sort_order, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000a01'::UUID, '00000000-0000-0000-0000-000000000901'::UUID, '00000000-0000-0000-0000-000000000701'::UUID, 599.00, 5, true, 1, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000a02'::UUID, '00000000-0000-0000-0000-000000000901'::UUID, '00000000-0000-0000-0000-000000000702'::UUID, 249.00, 10, true, 2, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000a03'::UUID, '00000000-0000-0000-0000-000000000901'::UUID, '00000000-0000-0000-0000-000000000703'::UUID, 349.00, 5, true, 3, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000a04'::UUID, '00000000-0000-0000-0000-000000000902'::UUID, '00000000-0000-0000-0000-000000000706'::UUID, 79.00, 15, true, 1, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000a05'::UUID, '00000000-0000-0000-0000-000000000902'::UUID, '00000000-0000-0000-0000-000000000707'::UUID, 749.00, 3, true, 2, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000a06'::UUID, '00000000-0000-0000-0000-000000000902'::UUID, '00000000-0000-0000-0000-000000000710'::UUID, 99.00, 20, true, 3, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 13. CAMPAIGN SELLERS
-- ============================================================
INSERT INTO public.campaign_sellers (id, campaign_id, seller_id, joined_at, status, campaign_sales, campaign_orders, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000b01'::UUID, '00000000-0000-0000-0000-000000000901'::UUID, '00000000-0000-0000-0000-000000000051'::UUID, NOW(), 'active', 4250.00, 8, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000b02'::UUID, '00000000-0000-0000-0000-000000000901'::UUID, '00000000-0000-0000-0000-000000000052'::UUID, NOW(), 'active', 2100.00, 4, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000b03'::UUID, '00000000-0000-0000-0000-000000000902'::UUID, '00000000-0000-0000-0000-000000000053'::UUID, NOW(), 'active', 6800.00, 12, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000b04'::UUID, '00000000-0000-0000-0000-000000000902'::UUID, '00000000-0000-0000-0000-000000000054'::UUID, NOW(), 'active', 1500.00, 3, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 14. COMMUNITY MEMBERS
-- ============================================================
INSERT INTO public.community_members (id, community_id, user_id, role, status, can_sell, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000c01'::UUID, '00000000-0000-0000-0000-000000000005'::UUID, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID, 'admin', 'active', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000c02'::UUID, '00000000-0000-0000-0000-000000000005'::UUID, '55555555-5555-5555-5555-555555555555'::UUID, 'seller', 'active', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000c03'::UUID, '00000000-0000-0000-0000-000000000005'::UUID, '66666666-6666-6666-6666-666666666666'::UUID, 'seller', 'active', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000c04'::UUID, '00000000-0000-0000-0000-000000000005'::UUID, 'cccccccc-cccc-cccc-cccc-cccccccccccc'::UUID, 'member', 'active', false, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000c05'::UUID, '00000000-0000-0000-0000-000000000006'::UUID, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID, 'admin', 'active', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000c06'::UUID, '00000000-0000-0000-0000-000000000006'::UUID, '77777777-7777-7777-7777-777777777777'::UUID, 'seller', 'active', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 15. ORDERS
-- ============================================================
INSERT INTO public.orders (
  id, order_number, customer_id, customer_email,
  shipping_name, shipping_address_line1, shipping_city, shipping_postal_code, shipping_country,
  subtotal, shipping_total, tax_total, total, currency,
  payment_status, status, created_at, updated_at
)
VALUES
  ('00000000-0000-0000-0000-000000000d01'::UUID, 'GS-2025-0001', 'cccccccc-cccc-cccc-cccc-cccccccccccc'::UUID, 'consumer1@test.goalsquad.shop', 'Test Kund', 'Storgatan 1', 'Stockholm', '11122', 'SE', 898.00, 49.00, 224.50, 1171.50, 'SEK', 'paid', 'delivered', NOW() - INTERVAL '10 days', NOW()),
  ('00000000-0000-0000-0000-000000000d02'::UUID, 'GS-2025-0002', 'dddddddd-dddd-dddd-dddd-dddddddddddd'::UUID, 'consumer2@test.goalsquad.shop', 'Maria Berg', 'Lilla Vägen 5', 'Malmö', '21133', 'SE', 548.00, 49.00, 137.00, 734.00, 'SEK', 'paid', 'shipped', NOW() - INTERVAL '5 days', NOW()),
  ('00000000-0000-0000-0000-000000000d03'::UUID, 'GS-2025-0003', 'cccccccc-cccc-cccc-cccc-cccccccccccc'::UUID, 'consumer1@test.goalsquad.shop', 'Test Kund', 'Storgatan 1', 'Stockholm', '11122', 'SE', 299.00, 29.00, 74.75, 402.75, 'SEK', 'paid', 'processing', NOW() - INTERVAL '2 days', NOW()),
  ('00000000-0000-0000-0000-000000000d04'::UUID, 'GS-2025-0004', 'dddddddd-dddd-dddd-dddd-dddddddddddd'::UUID, 'consumer2@test.goalsquad.shop', 'Maria Berg', 'Lilla Vägen 5', 'Malmö', '21133', 'SE', 1048.00, 0.00, 262.00, 1310.00, 'SEK', 'paid', 'pending', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 16. ORDER ITEMS
-- ============================================================
INSERT INTO public.order_items (
  id, order_id, product_id, merchant_id, sku, name, quantity, unit_price, merchant_base_price, subtotal, created_at, updated_at
)
VALUES
  ('00000000-0000-0000-0000-000000000e01'::UUID, '00000000-0000-0000-0000-000000000d01'::UUID, '00000000-0000-0000-0000-000000000701'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'GS-JACKA-001', 'GoalSquad Träningsjacka', 1, 699.00, 450.00, 699.00, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000e02'::UUID, '00000000-0000-0000-0000-000000000d01'::UUID, '00000000-0000-0000-0000-000000000702'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'GS-BOLL-001', 'GoalSquad Fotboll', 1, 199.00, 180.00, 199.00, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000e03'::UUID, '00000000-0000-0000-0000-000000000d02'::UUID, '00000000-0000-0000-0000-000000000704'::UUID, '00000000-0000-0000-0000-000000000002'::UUID, 'NG-HAND-001', 'Nordic Vinterhandske', 2, 199.00, 120.00, 398.00, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000e04'::UUID, '00000000-0000-0000-0000-000000000d02'::UUID, '00000000-0000-0000-0000-000000000705'::UUID, '00000000-0000-0000-0000-000000000002'::UUID, 'NG-PANN-001', 'Nordic Pannband', 1, 149.00, 80.00, 149.00, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000e05'::UUID, '00000000-0000-0000-0000-000000000d03'::UUID, '00000000-0000-0000-0000-000000000702'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'GS-BOLL-001', 'GoalSquad Fotboll', 1, 299.00, 180.00, 299.00, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000e06'::UUID, '00000000-0000-0000-0000-000000000d04'::UUID, '00000000-0000-0000-0000-000000000707'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'GS-SKOR-001', 'GoalSquad Löparskor', 1, 899.00, 550.00, 899.00, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000e07'::UUID, '00000000-0000-0000-0000-000000000d04'::UUID, '00000000-0000-0000-0000-000000000709'::UUID, '00000000-0000-0000-0000-000000000002'::UUID, 'NG-RYGG-001', 'Nordic Träningsryggsäck', 1, 549.00, 320.00, 549.00, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000e08'::UUID, '00000000-0000-0000-0000-000000000d04'::UUID, '00000000-0000-0000-0000-000000000706'::UUID, '00000000-0000-0000-0000-000000000002'::UUID, 'NG-FLAS-001', 'Nordic Vattenflaska', 2, 99.00, 55.00, 198.00, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 17. SELLER XP
-- ============================================================
INSERT INTO public.seller_xp (id, seller_profile_id, current_xp, current_level, total_xp_earned, multiplier_active, multiplier_value, multiplier_expires_at, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000f01'::UUID, '00000000-0000-0000-0000-000000000051'::UUID, 450, 3, 850, true, 1.25, NOW() + INTERVAL '7 days', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000f02'::UUID, '00000000-0000-0000-0000-000000000052'::UUID, 280, 2, 480, false, 1.00, NULL, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000f03'::UUID, '00000000-0000-0000-0000-000000000053'::UUID, 620, 4, 1200, true, 1.50, NOW() + INTERVAL '3 days', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000f04'::UUID, '00000000-0000-0000-0000-000000000054'::UUID, 120, 1, 120, false, 1.00, NULL, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 18. TREASURY HOLDS
-- ============================================================
INSERT INTO public.treasury_holds (id, order_id, holder_type, holder_id, amount, currency, hold_days, hold_until, status, reason, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000001001'::UUID, '00000000-0000-0000-0000-000000000d01'::UUID, 'merchant', '00000000-0000-0000-0000-000000000001'::UUID, 649.00, 'SEK', 14, NOW() + INTERVAL '14 days', 'held', 'Order GS-2025-0001 merchant revenue hold', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000001002'::UUID, '00000000-0000-0000-0000-000000000d01'::UUID, 'community', '00000000-0000-0000-0000-000000000005'::UUID, 175.00, 'SEK', 14, NOW() + INTERVAL '14 days', 'held', 'Order GS-2025-0001 community commission hold', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000001003'::UUID, '00000000-0000-0000-0000-000000000d02'::UUID, 'merchant', '00000000-0000-0000-0000-000000000002'::UUID, 547.00, 'SEK', 14, NOW() + INTERVAL '14 days', 'held', 'Order GS-2025-0002 merchant revenue hold', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 19. ADMIN ROLE FIX
-- ============================================================
UPDATE public.profiles
SET role = 'gs_admin', updated_at = NOW()
WHERE email = 'admin@goalsquad.se' OR role = 'admin';

-- ============================================================
-- 20. VERIFICATION
-- ============================================================
SELECT
  'products' AS table_name, COUNT(*) AS count FROM public.products
UNION ALL
SELECT 'merchants', COUNT(*) FROM public.merchants
UNION ALL
SELECT 'product_categories', COUNT(*) FROM public.product_categories
UNION ALL
SELECT 'communities', COUNT(*) FROM public.communities
UNION ALL
SELECT 'profiles', COUNT(*) FROM public.profiles
UNION ALL
SELECT 'seller_profiles', COUNT(*) FROM public.seller_profiles
UNION ALL
SELECT 'campaigns', COUNT(*) FROM public.campaigns
UNION ALL
SELECT 'orders', COUNT(*) FROM public.orders
UNION ALL
SELECT 'community_products', COUNT(*) FROM public.community_products
UNION ALL
SELECT 'auth_users', COUNT(*) FROM auth.users
WHERE email LIKE '%@test.goalsquad.shop';
