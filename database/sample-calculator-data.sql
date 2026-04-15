/**
 * Sample Calculator Data
 * 
 * Real companies and products for calculator demo
 * Based on actual Swedish food/product companies
 * 
 * NOTE: This is SAMPLE data for demonstration
 * Replace with real merchant/product data when available
 */

-- ============================================
-- 1. SAMPLE MERCHANTS
-- ============================================

-- Insert sample merchants (IF NOT EXISTS)
INSERT INTO merchants (
  name,
  description,
  contact_email,
  contact_phone,
  website,
  is_active,
  is_verified
) VALUES
  (
    'Skånska Chips',
    'Ekologiska chips tillverkade i Skåne med lokala potatisar',
    'info@skanska-chips.se',
    '+46 40 123 456',
    'https://skanska-chips.se',
    true,
    true
  ),
  (
    'Chokladfabriken',
    'Hantverksmässig choklad med fairtrade-certifiering',
    'kontakt@chokladfabriken.se',
    '+46 8 234 567',
    'https://chokladfabriken.se',
    true,
    true
  ),
  (
    'Ekologiskt Kaffe AB',
    'Ekologiskt och rättvisemärkt kaffe från Sydamerika',
    'info@ekokaffe.se',
    '+46 31 345 678',
    'https://ekokaffe.se',
    true,
    true
  ),
  (
    'Hälsokost Sverige',
    'Proteinbars och hälsosamma snacks utan tillsatser',
    'hej@halsokost.se',
    '+46 18 456 789',
    'https://halsokost.se',
    true,
    true
  ),
  (
    'Gourmet Nötter',
    'Rostade och smaksatta nötter av högsta kvalitet',
    'info@gourmetnotter.se',
    '+46 13 567 890',
    'https://gourmetnotter.se',
    true,
    true
  )
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. SAMPLE PRODUCTS
-- ============================================

-- Get merchant IDs
DO $$
DECLARE
  v_skanska_chips_id UUID;
  v_choklad_id UUID;
  v_kaffe_id UUID;
  v_halsokost_id UUID;
  v_notter_id UUID;
BEGIN
  -- Get merchant IDs
  SELECT id INTO v_skanska_chips_id FROM merchants WHERE name = 'Skånska Chips';
  SELECT id INTO v_choklad_id FROM merchants WHERE name = 'Chokladfabriken';
  SELECT id INTO v_kaffe_id FROM merchants WHERE name = 'Ekologiskt Kaffe AB';
  SELECT id INTO v_halsokost_id FROM merchants WHERE name = 'Hälsokost Sverige';
  SELECT id INTO v_notter_id FROM merchants WHERE name = 'Gourmet Nötter';

  -- Skånska Chips products
  IF v_skanska_chips_id IS NOT NULL THEN
    INSERT INTO products (
      merchant_id, name, description, price, cost_price,
      category, minimum_order_quantity, moq_enabled,
      is_active, is_available
    ) VALUES
      (
        v_skanska_chips_id,
        'Chips Original 200g',
        'Klassiska chips med havssalt. Ekologiska potatisar från Skåne.',
        45.00,
        30.00,
        'Snacks',
        50,
        true,
        true,
        true
      ),
      (
        v_skanska_chips_id,
        'Chips Sourcream 200g',
        'Chips med sourcream & onion. Ekologiska potatisar från Skåne.',
        45.00,
        30.00,
        'Snacks',
        50,
        true,
        true,
        true
      )
    ON CONFLICT (merchant_id, name) DO NOTHING;
  END IF;

  -- Chokladfabriken products
  IF v_choklad_id IS NOT NULL THEN
    INSERT INTO products (
      merchant_id, name, description, price, cost_price,
      category, minimum_order_quantity, moq_enabled,
      is_active, is_available
    ) VALUES
      (
        v_choklad_id,
        'Mjölkchoklad 100g',
        'Krämig mjölkchoklad med 40% kakao. Fairtrade-certifierad.',
        35.00,
        20.00,
        'Godis',
        100,
        true,
        true,
        true
      ),
      (
        v_choklad_id,
        'Mörk Choklad 100g',
        'Mörk choklad med 70% kakao. Fairtrade-certifierad.',
        40.00,
        23.00,
        'Godis',
        100,
        true,
        true,
        true
      ),
      (
        v_choklad_id,
        'Pralinask 250g',
        'Lyxig pralinask med 12 olika smaker. Perfekt som present.',
        120.00,
        70.00,
        'Godis',
        30,
        true,
        true,
        true
      )
    ON CONFLICT (merchant_id, name) DO NOTHING;
  END IF;

  -- Ekologiskt Kaffe products
  IF v_kaffe_id IS NOT NULL THEN
    INSERT INTO products (
      merchant_id, name, description, price, cost_price,
      category, minimum_order_quantity, moq_enabled,
      is_active, is_available
    ) VALUES
      (
        v_kaffe_id,
        'Mellanrost Kaffe 500g',
        'Balanserat mellanrostat kaffe från Colombia. Ekologiskt och rättvisemärkt.',
        89.00,
        55.00,
        'Dryck',
        80,
        true,
        true,
        true
      ),
      (
        v_kaffe_id,
        'Mörkrost Kaffe 500g',
        'Kraftfullt mörkrostat kaffe från Brasilien. Ekologiskt och rättvisemärkt.',
        95.00,
        58.00,
        'Dryck',
        80,
        true,
        true,
        true
      )
    ON CONFLICT (merchant_id, name) DO NOTHING;
  END IF;

  -- Hälsokost Sverige products
  IF v_halsokost_id IS NOT NULL THEN
    INSERT INTO products (
      merchant_id, name, description, price, cost_price,
      category, minimum_order_quantity, moq_enabled,
      is_active, is_available
    ) VALUES
      (
        v_halsokost_id,
        'Proteinbar 60g',
        'Proteinbar med 20g protein. Utan tillsatt socker.',
        25.00,
        15.00,
        'Hälsa',
        200,
        true,
        true,
        true
      ),
      (
        v_halsokost_id,
        'Energibollar 12-pack',
        'Energibollar med dadlar, nötter och kakao. Veganska.',
        65.00,
        38.00,
        'Hälsa',
        50,
        true,
        true,
        true
      )
    ON CONFLICT (merchant_id, name) DO NOTHING;
  END IF;

  -- Gourmet Nötter products
  IF v_notter_id IS NOT NULL THEN
    INSERT INTO products (
      merchant_id, name, description, price, cost_price,
      category, minimum_order_quantity, moq_enabled,
      is_active, is_available
    ) VALUES
      (
        v_notter_id,
        'Blandade Nötter 300g',
        'Mix av cashew, mandel, valnöt och hasselnöt. Lätt rostade.',
        75.00,
        45.00,
        'Snacks',
        60,
        true,
        true,
        true
      ),
      (
        v_notter_id,
        'Cashewnötter 250g',
        'Premium cashewnötter rostade med havssalt.',
        85.00,
        52.00,
        'Snacks',
        60,
        true,
        true,
        true
      )
    ON CONFLICT (merchant_id, name) DO NOTHING;
  END IF;
END $$;

-- ============================================
-- 3. VERIFY DATA
-- ============================================

-- Show inserted merchants and products
SELECT 
  m.name as merchant,
  COUNT(p.id) as product_count,
  ROUND(AVG((p.price - p.cost_price) / p.price * 100), 1) as avg_profit_pct
FROM merchants m
LEFT JOIN products p ON p.merchant_id = m.id
WHERE m.name IN (
  'Skånska Chips',
  'Chokladfabriken',
  'Ekologiskt Kaffe AB',
  'Hälsokost Sverige',
  'Gourmet Nötter'
)
GROUP BY m.name
ORDER BY m.name;

-- Show all calculator products
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
WHERE m.name IN (
  'Skånska Chips',
  'Chokladfabriken',
  'Ekologiskt Kaffe AB',
  'Hälsokost Sverige',
  'Gourmet Nötter'
)
ORDER BY m.name, p.name;

COMMENT ON TABLE merchants IS 'Sample merchants added for calculator demo - replace with real data';
COMMENT ON TABLE products IS 'Sample products added for calculator demo - replace with real data';
