-- Migration: Organizations Table
-- Core table for organizations (hubs, merchants, warehouses)
-- Run with: supabase db push OR paste into Supabase SQL editor

CREATE TABLE IF NOT EXISTS organizations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 VARCHAR(255) NOT NULL,
  org_type             VARCHAR(50) NOT NULL DEFAULT 'hub'
                       CHECK (org_type IN ('hub', 'merchant', 'warehouse')),
  country              VARCHAR(2) NOT NULL,
  city                 VARCHAR(255),
  postal_code          VARCHAR(20),
  address              TEXT,
  phone                VARCHAR(50),
  email                VARCHAR(255),
  logo_url             TEXT,
  status               VARCHAR(30) NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active', 'inactive', 'suspended')),
  metadata             JSONB DEFAULT '{}',
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_org_type ON organizations(org_type);
CREATE INDEX IF NOT EXISTS idx_organizations_country   ON organizations(country);
CREATE INDEX IF NOT EXISTS idx_organizations_status    ON organizations(status);

-- RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating (idempotent)
DROP POLICY IF EXISTS "Public read active" ON organizations;
DROP POLICY IF EXISTS "Service role full access" ON organizations;

-- Anyone can view active organizations
CREATE POLICY "Public read active"
  ON organizations FOR SELECT
  USING (status = 'active');

-- Service role (admin) has full access
CREATE POLICY "Service role full access"
  ON organizations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language plpgsql;

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
