/**
 * ============================================================
 * MIGRATION 096 — CAMPAIGN RELATION TABLES
 * ============================================================
 *
 * Creates persistent join tables for campaigns:
 * 1. campaign_products  — links products to campaigns
 * 2. campaign_sellers   — tracks which sellers joined a campaign
 * ============================================================
 */

-- 1. CAMPAIGN PRODUCTS
CREATE TABLE IF NOT EXISTS public.campaign_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  community_product_id UUID REFERENCES public.community_products(id) ON DELETE SET NULL,
  -- Campaign-specific pricing / MOQ overrides
  campaign_price DECIMAL(10,2),
  moq_per_seller INTEGER DEFAULT 1,
  -- Status
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Prevent duplicate product in same campaign
  UNIQUE(campaign_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_products_campaign ON public.campaign_products(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_products_product ON public.campaign_products(product_id);

ALTER TABLE public.campaign_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "campaign_products_public_read" ON public.campaign_products;
CREATE POLICY "campaign_products_public_read"
  ON public.campaign_products FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "campaign_products_service_role" ON public.campaign_products;
CREATE POLICY "campaign_products_service_role"
  ON public.campaign_products FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS update_campaign_products_updated_at ON public.campaign_products;
CREATE TRIGGER update_campaign_products_updated_at
  BEFORE UPDATE ON public.campaign_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. CAMPAIGN SELLERS (join tracking)
CREATE TABLE IF NOT EXISTS public.campaign_sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  -- Join metadata
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'left')),
  -- Sales tracking within campaign
  campaign_sales DECIMAL(12,2) DEFAULT 0,
  campaign_orders INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Prevent duplicate joins
  UNIQUE(campaign_id, seller_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_sellers_campaign ON public.campaign_sellers(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sellers_seller ON public.campaign_sellers(seller_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sellers_status ON public.campaign_sellers(status);

ALTER TABLE public.campaign_sellers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "campaign_sellers_own_read" ON public.campaign_sellers;
CREATE POLICY "campaign_sellers_own_read"
  ON public.campaign_sellers FOR SELECT TO authenticated
  USING (seller_id IN (SELECT id FROM public.seller_profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "campaign_sellers_public_read" ON public.campaign_sellers;
CREATE POLICY "campaign_sellers_public_read"
  ON public.campaign_sellers FOR SELECT USING (status = 'active');
DROP POLICY IF EXISTS "campaign_sellers_service_role" ON public.campaign_sellers;
CREATE POLICY "campaign_sellers_service_role"
  ON public.campaign_sellers FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS update_campaign_sellers_updated_at ON public.campaign_sellers;
CREATE TRIGGER update_campaign_sellers_updated_at
  BEFORE UPDATE ON public.campaign_sellers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
