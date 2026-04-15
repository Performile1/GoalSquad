/**
 * Merchant Branding & Company Information
 * 
 * Logos, brand colors, company info, contact persons
 */

-- Add branding fields to merchants
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS logo_square_url TEXT,        -- Square logo for icons
ADD COLUMN IF NOT EXISTS logo_horizontal_url TEXT,    -- Horizontal logo for headers
ADD COLUMN IF NOT EXISTS brand_colors JSONB DEFAULT '{"primary": "#0ea5e9", "secondary": "#06b6d4"}'::jsonb,
ADD COLUMN IF NOT EXISTS company_description TEXT,
ADD COLUMN IF NOT EXISTS founded_year INTEGER,
ADD COLUMN IF NOT EXISTS employee_count VARCHAR(50),  -- "1-10", "11-50", "51-200", etc
ADD COLUMN IF NOT EXISTS annual_revenue VARCHAR(50),  -- "< 1M", "1-10M", "10-50M", etc
ADD COLUMN IF NOT EXISTS company_registration VARCHAR(100), -- Org.nr
ADD COLUMN IF NOT EXISTS vat_number VARCHAR(100),     -- VAT/MOMS number
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_merchants_logo ON merchants(logo_url) WHERE logo_url IS NOT NULL;

-- Company contact persons
CREATE TABLE IF NOT EXISTS merchant_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  
  -- Person info
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(100),                    -- "VD", "Försäljningschef", "Kontaktperson"
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  
  -- Responsibilities
  is_primary BOOLEAN DEFAULT false,
  is_billing_contact BOOLEAN DEFAULT false,
  is_technical_contact BOOLEAN DEFAULT false,
  is_sales_contact BOOLEAN DEFAULT false,
  
  -- Additional
  photo_url TEXT,
  bio TEXT,
  linkedin_url TEXT,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_contacts_merchant ON merchant_contacts(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_contacts_primary ON merchant_contacts(merchant_id, is_primary) 
  WHERE is_primary = true;

-- Company certifications & awards
CREATE TABLE IF NOT EXISTS merchant_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  
  certification_type VARCHAR(100) NOT NULL, -- "ISO 9001", "Fairtrade", "Organic", etc
  certification_name TEXT NOT NULL,
  issuing_organization VARCHAR(255),
  certificate_number VARCHAR(100),
  issue_date DATE,
  expiry_date DATE,
  certificate_url TEXT,                     -- PDF/image of certificate
  
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_certifications_merchant ON merchant_certifications(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_certifications_active ON merchant_certifications(merchant_id, is_active) 
  WHERE is_active = true;

-- RLS Policies
ALTER TABLE merchant_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_certifications ENABLE ROW LEVEL SECURITY;

-- Public read for merchant info
CREATE POLICY "Public read merchant contacts"
  ON merchant_contacts FOR SELECT
  USING (true);

CREATE POLICY "Public read merchant certifications"
  ON merchant_certifications FOR SELECT
  USING (is_active = true);

-- Merchants manage their own data
CREATE POLICY "Merchants manage their contacts"
  ON merchant_contacts FOR ALL
  USING (
    merchant_id IN (
      SELECT merchant_id FROM merchant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Merchants manage their certifications"
  ON merchant_certifications FOR ALL
  USING (
    merchant_id IN (
      SELECT merchant_id FROM merchant_users WHERE user_id = auth.uid()
    )
  );

-- Helper view for complete merchant info
CREATE OR REPLACE VIEW merchants_complete AS
SELECT 
  m.*,
  COALESCE(
    (SELECT json_agg(
      json_build_object(
        'id', mc.id,
        'name', mc.full_name,
        'role', mc.role,
        'email', mc.email,
        'phone', mc.phone,
        'isPrimary', mc.is_primary,
        'photoUrl', mc.photo_url
      )
    )
    FROM merchant_contacts mc
    WHERE mc.merchant_id = m.id),
    '[]'::json
  ) as contacts,
  COALESCE(
    (SELECT json_agg(
      json_build_object(
        'id', cert.id,
        'type', cert.certification_type,
        'name', cert.certification_name,
        'issuer', cert.issuing_organization,
        'expiryDate', cert.expiry_date
      )
    )
    FROM merchant_certifications cert
    WHERE cert.merchant_id = m.id AND cert.is_active = true),
    '[]'::json
  ) as certifications
FROM merchants m;

GRANT SELECT ON merchants_complete TO authenticated, anon;

COMMENT ON TABLE merchant_contacts IS 'Contact persons for merchant companies';
COMMENT ON TABLE merchant_certifications IS 'Company certifications and awards';
