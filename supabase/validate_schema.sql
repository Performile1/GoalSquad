-- Complete schema validation for all user types
-- Run this to see current state and what might be missing

-- ============================================
-- 1. PROFILES (consumer / guardian / all users)
-- ============================================
SELECT 'profiles' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================
-- 2. COMMUNITIES (förening / klubb / skolklass)
-- ============================================
SELECT 'communities' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'communities'
ORDER BY ordinal_position;

-- ============================================
-- 3. MERCHANTS (företag)
-- ============================================
SELECT 'merchants' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'merchants'
ORDER BY ordinal_position;

-- ============================================
-- 4. SELLER_PROFILES (säljare)
-- ============================================
SELECT 'seller_profiles' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'seller_profiles'
ORDER BY ordinal_position;

-- ============================================
-- 5. WAREHOUSE_PARTNERS (lagerpartner)
-- ============================================
SELECT 'warehouse_partners' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'warehouse_partners'
ORDER BY ordinal_position;

-- ============================================
-- 6. QUICK CHECKLIST - expected fields per table
-- ============================================
SELECT 
  t.table_name,
  t.expected_column,
  CASE WHEN c.column_name IS NOT NULL THEN '✅ finns' ELSE '❌ saknas' END as status,
  COALESCE(c.data_type, '–') as data_type
FROM (VALUES
  -- profiles
  ('profiles', 'email'),
  ('profiles', 'full_name'),
  ('profiles', 'phone'),
  ('profiles', 'date_of_birth'),
  ('profiles', 'address_line1'),
  ('profiles', 'address_line2'),
  ('profiles', 'city'),
  ('profiles', 'postal_code'),
  ('profiles', 'country'),
  ('profiles', 'personal_id_number'),
  ('profiles', 'guardian_id'),
  ('profiles', 'is_minor'),
  ('profiles', 'role'),
  ('profiles', 'is_active'),
  ('profiles', 'is_verified'),
  ('profiles', 'avatar_url'),
  -- communities
  ('communities', 'name'),
  ('communities', 'owner_id'),
  ('communities', 'community_type'),
  ('communities', 'contact_email'),
  ('communities', 'contact_phone'),
  ('communities', 'website'),
  ('communities', 'address_line1'),
  ('communities', 'city'),
  ('communities', 'postal_code'),
  ('communities', 'country'),
  ('communities', 'org_number'),
  ('communities', 'founded_year'),
  ('communities', 'member_count'),
  ('communities', 'logo_url'),
  ('communities', 'description'),
  -- merchants
  ('merchants', 'user_id'),
  ('merchants', 'merchant_name'),
  ('merchants', 'business_name'),
  ('merchants', 'email'),
  ('merchants', 'phone'),
  ('merchants', 'address_line1'),
  ('merchants', 'address_line2'),
  ('merchants', 'city'),
  ('merchants', 'postal_code'),
  ('merchants', 'country'),
  ('merchants', 'org_number'),
  ('merchants', 'vat_number'),
  ('merchants', 'contact_person'),
  ('merchants', 'bank_account'),
  ('merchants', 'bank_clearing'),
  ('merchants', 'bank_name'),
  ('merchants', 'iban'),
  ('merchants', 'bic'),
  ('merchants', 'logo_url'),
  ('merchants', 'verification_status'),
  ('merchants', 'onboarding_completed'),
  -- seller_profiles
  ('seller_profiles', 'user_id'),
  ('seller_profiles', 'personal_id_number'),
  ('seller_profiles', 'address_line1'),
  ('seller_profiles', 'city'),
  ('seller_profiles', 'postal_code'),
  ('seller_profiles', 'bank_account'),
  ('seller_profiles', 'bank_clearing'),
  ('seller_profiles', 'bank_name'),
  ('seller_profiles', 'bank_account_verified'),
  ('seller_profiles', 'shop_url'),
  ('seller_profiles', 'shop_bio'),
  ('seller_profiles', 'xp_total'),
  ('seller_profiles', 'current_level'),
  ('seller_profiles', 'onboarding_completed'),
  -- warehouse_partners
  ('warehouse_partners', 'user_id'),
  ('warehouse_partners', 'partner_name'),
  ('warehouse_partners', 'contact_email'),
  ('warehouse_partners', 'contact_phone'),
  ('warehouse_partners', 'territory'),
  ('warehouse_partners', 'postal_code'),
  ('warehouse_partners', 'postal_code_ranges'),
  ('warehouse_partners', 'api_key'),
  ('warehouse_partners', 'status')
) AS t(table_name, expected_column)
LEFT JOIN information_schema.columns c
  ON c.table_name = t.table_name
  AND c.column_name = t.expected_column
ORDER BY t.table_name, t.expected_column;
