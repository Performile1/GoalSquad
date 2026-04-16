-- Migration: Community Marketplace Products
-- Allows associations, classes, and individual sellers to list their own products
-- GoalSquad takes a platform_fee_percent on each sale
-- Run with: supabase db push  OR  paste into Supabase SQL editor

CREATE TABLE IF NOT EXISTS community_products (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                VARCHAR(255) NOT NULL,
  description          TEXT NOT NULL,
  price                NUMERIC(10,2) NOT NULL CHECK (price > 0),
  category             VARCHAR(50) NOT NULL DEFAULT 'other',
  seller_type          VARCHAR(20) NOT NULL DEFAULT 'individual'
                         CHECK (seller_type IN ('community', 'class', 'individual')),
  seller_name          VARCHAR(255) NOT NULL,
  community_name       VARCHAR(255),
  location             VARCHAR(255),
  stock                INTEGER NOT NULL DEFAULT 1 CHECK (stock >= 0),
  shipping_info        TEXT NOT NULL,
  contact_email        VARCHAR(255) NOT NULL,
  image_urls           TEXT[] DEFAULT '{}',
  platform_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 12.00,
  status               VARCHAR(30) NOT NULL DEFAULT 'pending_review'
                         CHECK (status IN ('pending_review', 'approved', 'rejected', 'sold_out', 'removed')),
  rejection_reason     TEXT,
  approved_at          TIMESTAMP WITH TIME ZONE,
  approved_by          UUID REFERENCES auth.users(id),
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_community_products_status   ON community_products(status);
CREATE INDEX IF NOT EXISTS idx_community_products_category ON community_products(category);
CREATE INDEX IF NOT EXISTS idx_community_products_created  ON community_products(created_at DESC);

-- RLS
ALTER TABLE community_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating (idempotent)
DROP POLICY IF EXISTS "Public read approved"        ON community_products;
DROP POLICY IF EXISTS "Authenticated users can create" ON community_products;
DROP POLICY IF EXISTS "Sellers update own"          ON community_products;

-- Anyone can view approved products
CREATE POLICY "Public read approved"
  ON community_products FOR SELECT
  USING (status = 'approved');

-- Authenticated users can insert (status defaults to pending_review)
CREATE POLICY "Authenticated users can create"
  ON community_products FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Sellers can update their own listings (e.g., stock, description)
CREATE POLICY "Sellers update own"
  ON community_products FOR UPDATE
  TO authenticated
  USING (contact_email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
  ));

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_community_products_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_community_products_updated_at ON community_products;
CREATE TRIGGER trg_community_products_updated_at
  BEFORE UPDATE ON community_products
  FOR EACH ROW EXECUTE FUNCTION update_community_products_updated_at();
