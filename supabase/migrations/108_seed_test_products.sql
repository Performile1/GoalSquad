/**
 * ============================================================
 * MIGRATION 108 — SEED TEST PRODUCTS & CATEGORIES
 * ============================================================
 * 
 * Inserts test product categories, merchants, and products
 * so that /products and the shop catalog display data.
 * 
 * Run in Supabase SQL Editor or via supabase CLI.
 * Uses ON CONFLICT so it can be re-run safely.
 * ============================================================
 */

-- ============================================================
-- 1. PRODUCT CATEGORIES
-- ============================================================
INSERT INTO public.product_categories (id, name, slug, description, icon, color, sort_order, is_active)
VALUES
  ('c1111111-1111-1111-1111-111111111111'::UUID, 'Sportkläder',       'sportklader',       'Träningskläder för alla sporter',        '👕', '#003B3D', 1, true),
  ('c1111111-1111-1111-1111-111111111112'::UUID, 'Fotboll',           'fotboll',           'Fotbollar och fotbollsutrustning',         '⚽', '#003B3D', 2, true),
  ('c1111111-1111-1111-1111-111111111113'::UUID, 'Utrustning',        'utrustning',        'Sportutrustning och tillbehör',            '🎒', '#003B3D', 3, true),
  ('c1111111-1111-1111-1111-111111111114'::UUID, 'Tillbehör',         'tillbehor',         'Sporttillbehör och småprylar',             '🧤', '#003B3D', 4, true),
  ('c1111111-1111-1111-1111-111111111115'::UUID, 'Mat & Dryck',       'mat-dryck',         'Energi och dryck för träning',             '🥤', '#003B3D', 5, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  is_active = EXCLUDED.is_active;

-- ============================================================
-- 2. ENSURE COLUMNS EXIST (safe for any schema state)
-- ============================================================
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

-- ============================================================
-- 3. TEST MERCHANTS (if not already present)
-- ============================================================
-- Ensure columns exist on merchants
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'name') THEN
    ALTER TABLE public.merchants ADD COLUMN name VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'verification_status') THEN
    ALTER TABLE public.merchants ADD COLUMN verification_status VARCHAR(50) DEFAULT 'pending';
  END IF;
END $$;

INSERT INTO public.merchants (id, name, business_name, email, phone, verification_status, created_at, updated_at)
VALUES
  ('m1111111-1111-1111-1111-111111111111'::UUID, 'GoalSquad Sports AB', 'GoalSquad Sports AB', 'info@goalsquad.shop', '+46701111111', 'verified', NOW(), NOW()),
  ('m1111111-1111-1111-1111-111111111112'::UUID, 'Nordic Gear Oy',      'Nordic Gear Oy',      'info@nordicgear.fi', '+46702222222', 'verified', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  verification_status = EXCLUDED.verification_status;

-- ============================================================
-- 4. TEST PRODUCTS (6 products with full data)
-- ============================================================
-- NOTE: we set BOTH price (for listing API) and retail_price/base_price (for detail/create)
INSERT INTO public.products (
  id, merchant_id, sku, title, name, description,
  price, base_price, retail_price, currency,
  category_id, stock_quantity, status,
  image_url, tags, ean, brand,
  weight_grams, length_mm, width_mm, height_mm,
  created_at, updated_at
)
VALUES
  (
    'p1111111-1111-1111-1111-111111111111'::UUID,
    'm1111111-1111-1111-1111-111111111111'::UUID,
    'GS-JACKA-001',
    'GoalSquad Träningsjacka',
    'GoalSquad Träningsjacka',
    'Vind- och vattenavvisande jacka perfekt för träning i alla väder.',
    699.00, 450.00, 699.00, 'SEK',
    'c1111111-1111-1111-1111-111111111111'::UUID, 200, 'active',
    'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&q=80',
    ARRAY['jacka','träning','sportkläder','vindtät'],
    '7312345678901', 'GoalSquad',
    420, 350, 280, 80,
    NOW(), NOW()
  ),
  (
    'p1111111-1111-1111-1111-111111111112'::UUID,
    'm1111111-1111-1111-1111-111111111111'::UUID,
    'GS-BOLL-001',
    'GoalSquad Fotboll',
    'GoalSquad Fotboll',
    'FIFA-godkänd fotboll i premiumkvalitet för alla underlag.',
    299.00, 180.00, 299.00, 'SEK',
    'c1111111-1111-1111-1111-111111111112'::UUID, 150, 'active',
    'https://images.unsplash.com/photo-1486286701208-11713a29d79c?w=600&q=80',
    ARRAY['fotboll','matchboll','fifa'],
    '7312345678902', 'GoalSquad',
    450, 220, 220, 220,
    NOW(), NOW()
  ),
  (
    'p1111111-1111-1111-1111-111111111113'::UUID,
    'm1111111-1111-1111-1111-111111111111'::UUID,
    'GS-BYXA-001',
    'GoalSquad Träningsbyxor',
    'GoalSquad Träningsbyxor',
    'Löparbyxor med reflexdetaljer för säker träning i mörkret.',
    449.00, 280.00, 449.00, 'SEK',
    'c1111111-1111-1111-1111-111111111111'::UUID, 180, 'active',
    'https://images.unsplash.com/photo-1518600506278-4e8ef466b810?w=600&q=80',
    ARRAY['byxor','löpning','reflex','sportkläder'],
    '7312345678903', 'GoalSquad',
    320, 300, 250, 50,
    NOW(), NOW()
  ),
  (
    'p1111111-1111-1111-1111-111111111114'::UUID,
    'm1111111-1111-1111-1111-111111111112'::UUID,
    'NG-HAND-001',
    'Nordic Vinterhandske',
    'Nordic Vinterhandske',
    'Värmeisolerade handskar för vinterträning i kalla temperaturer.',
    199.00, 120.00, 199.00, 'SEK',
    'c1111111-1111-1111-1111-111111111114'::UUID, 300, 'active',
    'https://images.unsplash.com/photo-1583416750470-965b6387ece4?w=600&q=80',
    ARRAY['handskar','vinter','isolering','tillbehör'],
    '7312345678904', 'Nordic Gear',
    180, 250, 150, 40,
    NOW(), NOW()
  ),
  (
    'p1111111-1111-1111-1111-111111111115'::UUID,
    'm1111111-1111-1111-1111-111111111112'::UUID,
    'NG-PANN-001',
    'Nordic Pannband',
    'Nordic Pannband',
    'Svettavvisande pannband i merinoull för intensiv träning.',
    149.00, 80.00, 149.00, 'SEK',
    'c1111111-1111-1111-1111-111111111114'::UUID, 250, 'active',
    'https://images.unsplash.com/photo-1576872381149-7847515ce5d8?w=600&q=80',
    ARRAY['pannband','merino','ull','tillbehör'],
    '7312345678905', 'Nordic Gear',
    45, 200, 80, 20,
    NOW(), NOW()
  ),
  (
    'p1111111-1111-1111-1111-111111111116'::UUID,
    'm1111111-1111-1111-1111-111111111112'::UUID,
    'NG-FLAS-001',
    'Nordic Vattenflaska',
    'Nordic Vattenflaska',
    'BPA-fri flaska med dubbelväggsisolering för kalla drycker.',
    99.00, 55.00, 99.00, 'SEK',
    'c1111111-1111-1111-1111-111111111113'::UUID, 400, 'active',
    'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80',
    ARRAY['flaska','vatten','isolering','träning'],
    '7312345678906', 'Nordic Gear',
    300, 250, 80, 80,
    NOW(), NOW()
  )
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
-- 5. COMMUNITY PRODUCTS (2 products for marketplace variety)
-- ============================================================
INSERT INTO public.community_products (
  id, title, description, price, category,
  seller_type, seller_name, community_name, location,
  stock, shipping_info, contact_email,
  image_urls, status, approved_at, created_at, updated_at
)
VALUES
  (
    'cp111111-1111-1111-1111-111111111111'::UUID,
    'Handgjord Supporter-scarf',
    'Virad scarf i klubbens färger, perfekt för kalla matcher.',
    179.00, 'handmade',
    'individual', 'Anna Svensson', 'IFK Göteborg', 'Göteborg',
    25, 'PostNord 59 kr', 'anna@test.goalsquad.shop',
    ARRAY['https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600&q=80'],
    'approved', NOW(), NOW(), NOW()
  ),
  (
    'cp111111-1111-1111-1111-111111111112'::UUID,
    'Egen Designad T-shirt',
    'Unik t-shirt med eget tryck, stödjer föreningen vid köp.',
    249.00, 'jersey',
    'individual', 'Erik Johansson', 'Malmö FF', 'Malmö',
    15, 'PostNord 59 kr', 'erik@test.goalsquad.shop',
    ARRAY['https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80'],
    'approved', NOW(), NOW(), NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  status = EXCLUDED.status,
  updated_at = NOW();

-- ============================================================
-- 6. VERIFY
-- ============================================================
SELECT 'Products seeded:' as status, COUNT(*) as count FROM public.products WHERE status = 'active'
UNION ALL
SELECT 'Community products seeded:', COUNT(*) FROM public.community_products WHERE status = 'approved'
UNION ALL
SELECT 'Categories seeded:', COUNT(*) FROM public.product_categories WHERE is_active = true;
