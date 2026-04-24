-- Fix missing columns found in schema validation

DO $$
BEGIN

  -- ============================================
  -- MERCHANTS: address fields
  -- ============================================
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'address_line1') THEN
    ALTER TABLE merchants ADD COLUMN address_line1 VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'address_line2') THEN
    ALTER TABLE merchants ADD COLUMN address_line2 VARCHAR(255);
  END IF;

  -- merchant_name may exist as business_name in production DB
  -- Add merchant_name if missing (business_name is the actual column)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'merchant_name') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'business_name') THEN
      -- business_name exists, add merchant_name as copy for backward compat
      ALTER TABLE merchants ADD COLUMN merchant_name VARCHAR(255);
      UPDATE merchants SET merchant_name = business_name WHERE merchant_name IS NULL;
    ELSE
      ALTER TABLE merchants ADD COLUMN merchant_name VARCHAR(255);
    END IF;
  END IF;

  -- ============================================
  -- WAREHOUSE_PARTNERS: postal code fields
  -- ============================================
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouse_partners' AND column_name = 'postal_code') THEN
    ALTER TABLE warehouse_partners ADD COLUMN postal_code VARCHAR(20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouse_partners' AND column_name = 'postal_code_ranges') THEN
    ALTER TABLE warehouse_partners ADD COLUMN postal_code_ranges TEXT[];
  END IF;

  -- Also add address fields to warehouse_partners for completeness
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouse_partners' AND column_name = 'address_line1') THEN
    ALTER TABLE warehouse_partners ADD COLUMN address_line1 VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouse_partners' AND column_name = 'city') THEN
    ALTER TABLE warehouse_partners ADD COLUMN city VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouse_partners' AND column_name = 'country') THEN
    ALTER TABLE warehouse_partners ADD COLUMN country VARCHAR(2) DEFAULT 'SE';
  END IF;

END $$;

CREATE INDEX IF NOT EXISTS idx_warehouse_partners_postal ON warehouse_partners(postal_code);

-- Re-run checklist to verify
SELECT 
  t.table_name,
  t.expected_column,
  CASE WHEN c.column_name IS NOT NULL THEN '✅ finns' ELSE '❌ saknas' END as status
FROM (VALUES
  ('merchants', 'address_line1'),
  ('merchants', 'address_line2'),
  ('merchants', 'merchant_name'),
  ('warehouse_partners', 'postal_code'),
  ('warehouse_partners', 'postal_code_ranges'),
  ('warehouse_partners', 'address_line1'),
  ('warehouse_partners', 'city'),
  ('warehouse_partners', 'country')
) AS t(table_name, expected_column)
LEFT JOIN information_schema.columns c
  ON c.table_name = t.table_name
  AND c.column_name = t.expected_column
ORDER BY t.table_name, t.expected_column;
