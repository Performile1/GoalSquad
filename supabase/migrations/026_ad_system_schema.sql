-- ============================================
-- ADVERTISEMENT SYSTEM SCHEMA
-- ============================================
-- This migration creates tables for:
-- - ad_placements: Where ads can be displayed (pages, positions)
-- - ads: The actual advertisements
-- - ad_stats: Tracking views, clicks, impressions
-- - ad_payments: Payment records for ad purchases

-- ============================================
-- AD PLACEMENTS
-- ============================================
-- Defines where ads can be displayed (pages, positions)
CREATE TABLE IF NOT EXISTS public.ad_placements (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  page VARCHAR(100) NOT NULL, -- e.g., 'homepage', 'products', 'seller-dashboard'
  position VARCHAR(50) NOT NULL, -- e.g., 'hero', 'sidebar', 'footer', 'banner'
  width INTEGER,
  height INTEGER,
  is_active BOOLEAN DEFAULT true,
  max_ads INTEGER DEFAULT 1, -- Max number of ads in this placement
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT ad_placements_pkey PRIMARY KEY (id),
  CONSTRAINT ad_placements_name_unique UNIQUE (name)
);

-- ============================================
-- ADS
-- ============================================
-- The actual advertisements
CREATE TABLE IF NOT EXISTS public.ads (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT NOT NULL,
  alt_text VARCHAR(200),
  
  -- Purchase details
  purchase_type VARCHAR(20) NOT NULL CHECK (purchase_type IN ('days', 'views', 'clicks')),
  purchased_quantity INTEGER NOT NULL CHECK (purchased_quantity > 0),
  price_paid NUMERIC NOT NULL CHECK (price_paid >= 0),
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'completed', 'cancelled')),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Scheduling
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Placement
  placement_id UUID NOT NULL REFERENCES public.ad_placements(id) ON DELETE RESTRICT,
  priority INTEGER DEFAULT 0, -- Higher priority shows first
  
  -- Tracking limits
  max_views INTEGER,
  max_clicks INTEGER,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT ads_pkey PRIMARY KEY (id),
  CONSTRAINT ads_end_date_after_start CHECK (end_date IS NULL OR end_date >= start_date)
);

-- ============================================
-- AD STATS
-- ============================================
-- Tracks views, clicks, and other metrics
CREATE TABLE IF NOT EXISTS public.ad_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER DEFAULT 0 CHECK (views >= 0),
  clicks INTEGER DEFAULT 0 CHECK (clicks >= 0),
  impressions INTEGER DEFAULT 0 CHECK (impressions >= 0),
  
  -- Tracking by user (optional, for unique views/clicks)
  unique_viewers INTEGER DEFAULT 0 CHECK (unique_viewers >= 0),
  unique_clickers INTEGER DEFAULT 0 CHECK (unique_clickers >= 0),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT ad_stats_pkey PRIMARY KEY (id),
  CONSTRAINT ad_stats_ad_date_unique UNIQUE (ad_id, stat_date)
);

-- ============================================
-- AD PAYMENTS
-- ============================================
-- Payment records for ad purchases
CREATE TABLE IF NOT EXISTS public.ad_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  payer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Payment details
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'SEK',
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  
  -- Stripe integration
  stripe_payment_intent_id VARCHAR(255),
  stripe_invoice_id VARCHAR(255),
  
  -- Receipt
  receipt_url TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT ad_payments_pkey PRIMARY KEY (id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ads_advertiser_id ON public.ads(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_ads_status ON public.ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_placement_id ON public.ads(placement_id);
CREATE INDEX IF NOT EXISTS idx_ads_dates ON public.ads(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_ads_priority ON public.ads(priority DESC);
CREATE INDEX IF NOT EXISTS idx_ad_stats_ad_id ON public.ad_stats(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_stats_date ON public.ad_stats(stat_date);
CREATE INDEX IF NOT EXISTS idx_ad_payments_ad_id ON public.ad_payments(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_payments_payer_id ON public.ad_payments(payer_id);
CREATE INDEX IF NOT EXISTS idx_ad_payments_status ON public.ad_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_ad_placements_page ON public.ad_placements(page);
CREATE INDEX IF NOT EXISTS idx_ad_placements_active ON public.ad_placements(is_active);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE public.ad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_payments ENABLE ROW LEVEL SECURITY;

-- Ad placements - service role full access
DROP POLICY IF EXISTS "Service role full access on ad_placements" ON public.ad_placements;
CREATE POLICY "Service role full access on ad_placements"
  ON public.ad_placements FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ad placements - authenticated can view active
DROP POLICY IF EXISTS "Authenticated can view active ad_placements" ON public.ad_placements;
CREATE POLICY "Authenticated can view active ad_placements"
  ON public.ad_placements FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Ads - service role full access
DROP POLICY IF EXISTS "Service role full access on ads" ON public.ads;
CREATE POLICY "Service role full access on ads"
  ON public.ads FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ads - advertisers can view their own ads
DROP POLICY IF EXISTS "Advertisers can view own ads" ON public.ads;
CREATE POLICY "Advertisers can view own ads"
  ON public.ads FOR SELECT
  TO authenticated
  USING (advertiser_id = auth.uid());

-- Ads - advertisers can create ads
DROP POLICY IF EXISTS "Advertisers can create ads" ON public.ads;
CREATE POLICY "Advertisers can create ads"
  ON public.ads FOR INSERT
  TO authenticated
  WITH CHECK (advertiser_id = auth.uid());

-- Ads - authenticated can view approved/active ads
DROP POLICY IF EXISTS "Authenticated can view approved ads" ON public.ads;
CREATE POLICY "Authenticated can view approved ads"
  ON public.ads FOR SELECT
  TO authenticated
  USING (status IN ('approved', 'active'));

-- Ad stats - service role full access
DROP POLICY IF EXISTS "Service role full access on ad_stats" ON public.ad_stats;
CREATE POLICY "Service role full access on ad_stats"
  ON public.ad_stats FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ad stats - advertisers can view their ad stats
DROP POLICY IF EXISTS "Advertisers can view own ad_stats" ON public.ad_stats;
CREATE POLICY "Advertisers can view own ad_stats"
  ON public.ad_stats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ads 
      WHERE ads.id = ad_stats.ad_id 
      AND ads.advertiser_id = auth.uid()
    )
  );

-- Ad payments - service role full access
DROP POLICY IF EXISTS "Service role full access on ad_payments" ON public.ad_payments;
CREATE POLICY "Service role full access on ad_payments"
  ON public.ad_payments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ad payments - payers can view their own payments
DROP POLICY IF EXISTS "Payers can view own ad_payments" ON public.ad_payments;
CREATE POLICY "Payers can view own ad_payments"
  ON public.ad_payments FOR SELECT
  TO authenticated
  USING (payer_id = auth.uid());

-- ============================================
-- TRIGGERS
-- ============================================
-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ad_placements_updated_at ON public.ad_placements;
CREATE TRIGGER update_ad_placements_updated_at
  BEFORE UPDATE ON public.ad_placements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ads_updated_at ON public.ads;
CREATE TRIGGER update_ads_updated_at
  BEFORE UPDATE ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ad_stats_updated_at ON public.ad_stats;
CREATE TRIGGER update_ad_stats_updated_at
  BEFORE UPDATE ON public.ad_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ad_payments_updated_at ON public.ad_payments;
CREATE TRIGGER update_ad_payments_updated_at
  BEFORE UPDATE ON public.ad_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get active ads for a placement
CREATE OR REPLACE FUNCTION get_active_ads(p_placement_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  ad_id UUID,
  title VARCHAR,
  image_url TEXT,
  link_url TEXT,
  priority INTEGER,
  advertiser_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.image_url,
    a.link_url,
    a.priority,
    a.advertiser_id
  FROM public.ads a
  WHERE a.placement_id = p_placement_id
    AND a.status = 'active'
    AND a.start_date <= CURRENT_DATE
    AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE)
    AND (a.max_views IS NULL OR (
      SELECT COALESCE(SUM(views), 0) 
      FROM public.ad_stats s 
      WHERE s.ad_id = a.id
    ) < a.max_views)
    AND (a.max_clicks IS NULL OR (
      SELECT COALESCE(SUM(clicks), 0) 
      FROM public.ad_stats s 
      WHERE s.ad_id = a.id
    ) < a.max_clicks)
  ORDER BY a.priority DESC, a.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record ad view
CREATE OR REPLACE FUNCTION record_ad_view(p_ad_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.ad_stats (ad_id, stat_date, views)
  VALUES (p_ad_id, CURRENT_DATE, 1)
  ON CONFLICT (ad_id, stat_date)
  DO UPDATE SET 
    views = ad_stats.views + 1,
    updated_at = NOW();
    
  -- Check if ad has reached max views and deactivate if needed
  UPDATE public.ads
  SET status = 'completed'
  WHERE id = p_ad_id
    AND max_views IS NOT NULL
    AND (
      SELECT COALESCE(SUM(views), 0)
      FROM public.ad_stats
      WHERE ad_stats.ad_id = public.ads.id
    ) >= public.ads.max_views;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record ad click
CREATE OR REPLACE FUNCTION record_ad_click(p_ad_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.ad_stats (ad_id, stat_date, clicks)
  VALUES (p_ad_id, CURRENT_DATE, 1)
  ON CONFLICT (ad_id, stat_date)
  DO UPDATE SET 
    clicks = ad_stats.clicks + 1,
    updated_at = NOW();
    
  -- Check if ad has reached max clicks and deactivate if needed
  UPDATE public.ads
  SET status = 'completed'
  WHERE id = p_ad_id
    AND max_clicks IS NOT NULL
    AND (
      SELECT COALESCE(SUM(clicks), 0)
      FROM public.ad_stats
      WHERE ad_stats.ad_id = public.ads.id
    ) >= public.ads.max_clicks;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if ad should be active based on purchase type
CREATE OR REPLACE FUNCTION check_ad_status(p_ad_id UUID)
RETURNS VOID AS $$
DECLARE
  v_ad RECORD;
  v_total_views INTEGER;
  v_total_clicks INTEGER;
  v_days_remaining INTEGER;
BEGIN
  SELECT * INTO v_ad FROM public.ads WHERE id = p_ad_id;
  
  -- Calculate totals
  SELECT COALESCE(SUM(views), 0) INTO v_total_views
  FROM public.ad_stats WHERE ad_id = p_ad_id;
  
  SELECT COALESCE(SUM(clicks), 0) INTO v_total_clicks
  FROM public.ad_stats WHERE ad_id = p_ad_id;
  
  SELECT GREATEST(0, v_ad.end_date - CURRENT_DATE) INTO v_days_remaining
  FROM public.ads WHERE id = p_ad_id;
  
  -- Update status based on limits
  IF v_ad.status = 'active' THEN
    IF v_ad.purchase_type = 'views' AND v_total_views >= v_ad.purchased_quantity THEN
      UPDATE public.ads SET status = 'completed' WHERE id = p_ad_id;
    ELSIF v_ad.purchase_type = 'clicks' AND v_total_clicks >= v_ad.purchased_quantity THEN
      UPDATE public.ads SET status = 'completed' WHERE id = p_ad_id;
    ELSIF v_ad.purchase_type = 'days' AND v_days_remaining <= 0 THEN
      UPDATE public.ads SET status = 'completed' WHERE id = p_ad_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INITIAL AD PLACEMENTS
-- ============================================
INSERT INTO public.ad_placements (name, description, page, position, width, height) VALUES
  ('homepage_hero', 'Hero banner on homepage', 'homepage', 'hero', 1200, 400),
  ('homepage_sidebar', 'Sidebar on homepage', 'homepage', 'sidebar', 300, 250),
  ('products_top', 'Top banner on products page', 'products', 'top', 1200, 200),
  ('seller_dashboard_sidebar', 'Sidebar on seller dashboard', 'seller-dashboard', 'sidebar', 300, 250),
  ('merchant_dashboard_sidebar', 'Sidebar on merchant dashboard', 'merchant-dashboard', 'sidebar', 300, 250)
ON CONFLICT (name) DO NOTHING;

DO $$
BEGIN
  RAISE NOTICE 'Ad system schema created successfully';
END $$;
