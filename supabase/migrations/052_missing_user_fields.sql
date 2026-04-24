-- Add missing fields for profiles, merchants and seller_profiles

DO $$
BEGIN

  -- ============================================
  -- PROFILES (consumer / guardian)
  -- ============================================

  -- Address
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'address_line1') THEN
    ALTER TABLE profiles ADD COLUMN address_line1 VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'address_line2') THEN
    ALTER TABLE profiles ADD COLUMN address_line2 VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'city') THEN
    ALTER TABLE profiles ADD COLUMN city VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'postal_code') THEN
    ALTER TABLE profiles ADD COLUMN postal_code VARCHAR(20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'country') THEN
    ALTER TABLE profiles ADD COLUMN country VARCHAR(2) DEFAULT 'SE';
  END IF;

  -- Personal identity (stored encrypted/hashed - never plain text in production)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'personal_id_number') THEN
    ALTER TABLE profiles ADD COLUMN personal_id_number VARCHAR(20);
  END IF;

  -- Guardian / parent link for minors
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'guardian_id') THEN
    ALTER TABLE profiles ADD COLUMN guardian_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_minor') THEN
    ALTER TABLE profiles ADD COLUMN is_minor BOOLEAN DEFAULT false;
  END IF;

  -- ============================================
  -- MERCHANTS (företag)
  -- ============================================

  -- Swedish org number
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'org_number') THEN
    ALTER TABLE merchants ADD COLUMN org_number VARCHAR(20);
  END IF;

  -- VAT / moms number
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'vat_number') THEN
    ALTER TABLE merchants ADD COLUMN vat_number VARCHAR(30);
  END IF;

  -- Primary contact person
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'contact_person') THEN
    ALTER TABLE merchants ADD COLUMN contact_person VARCHAR(255);
  END IF;

  -- Bank details for payouts
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'bank_account') THEN
    ALTER TABLE merchants ADD COLUMN bank_account VARCHAR(50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'bank_clearing') THEN
    ALTER TABLE merchants ADD COLUMN bank_clearing VARCHAR(10);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'bank_name') THEN
    ALTER TABLE merchants ADD COLUMN bank_name VARCHAR(100);
  END IF;

  -- IBAN / BIC for international
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'iban') THEN
    ALTER TABLE merchants ADD COLUMN iban VARCHAR(50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'bic') THEN
    ALTER TABLE merchants ADD COLUMN bic VARCHAR(20);
  END IF;

  -- ============================================
  -- SELLER_PROFILES (säljare)
  -- ============================================

  -- Personal identity
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'personal_id_number') THEN
    ALTER TABLE seller_profiles ADD COLUMN personal_id_number VARCHAR(20);
  END IF;

  -- Bank details for commission payouts
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'bank_account') THEN
    ALTER TABLE seller_profiles ADD COLUMN bank_account VARCHAR(50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'bank_clearing') THEN
    ALTER TABLE seller_profiles ADD COLUMN bank_clearing VARCHAR(10);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'bank_name') THEN
    ALTER TABLE seller_profiles ADD COLUMN bank_name VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'bank_account_verified') THEN
    ALTER TABLE seller_profiles ADD COLUMN bank_account_verified BOOLEAN DEFAULT false;
  END IF;

  -- Address for deliveries / tax
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'address_line1') THEN
    ALTER TABLE seller_profiles ADD COLUMN address_line1 VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'city') THEN
    ALTER TABLE seller_profiles ADD COLUMN city VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'postal_code') THEN
    ALTER TABLE seller_profiles ADD COLUMN postal_code VARCHAR(20);
  END IF;

END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_guardian ON profiles(guardian_id);
CREATE INDEX IF NOT EXISTS idx_profiles_minor ON profiles(is_minor) WHERE is_minor = true;

-- Verify
SELECT 'profiles' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('address_line1', 'city', 'postal_code', 'country', 'personal_id_number', 'guardian_id', 'is_minor')
UNION ALL
SELECT 'merchants' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'merchants'
  AND column_name IN ('org_number', 'vat_number', 'contact_person', 'bank_account', 'bank_clearing', 'bank_name', 'iban', 'bic')
UNION ALL
SELECT 'seller_profiles' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'seller_profiles'
  AND column_name IN ('personal_id_number', 'bank_account', 'bank_clearing', 'bank_name', 'bank_account_verified', 'address_line1', 'city', 'postal_code')
ORDER BY table_name, column_name;
