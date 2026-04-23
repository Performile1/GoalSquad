/**
 * ============================================================
 * MIGRATION 040 — MISSING TABLES (från snapshot 039)
 * ============================================================
 * Tabeller som saknades efter körning av 001–038:
 *   ad_payment_transactions, admin_fee_config,
 *   asn_notices, warehouse_events,
 *   leaderboards, user_achievements,
 *   campaigns, seo_settings, campaign_forms, campaign_form_submissions,
 *   pick_sessions, pick_session_items, product_barcodes
 *
 * Profiler: lägger till guardian_id (guardians API kräver det)
 * RLS: alla admin-policies standardiserade till gs_admin
 * ============================================================
 */

-- ============================================================
-- 1. AD PAYMENT TRANSACTIONS (migration 029 kördes ej)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ad_payment_transactions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id                    UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  transaction_type         TEXT NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'daily_charge')),
  amount                   DECIMAL(10,2) NOT NULL,
  currency                 TEXT DEFAULT 'SEK',
  status                   TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  stripe_payment_intent_id TEXT,
  stripe_charge_id         TEXT,
  metadata                 JSONB DEFAULT '{}',
  created_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_payment_transactions_ad     ON public.ad_payment_transactions(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_payment_transactions_type   ON public.ad_payment_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_ad_payment_transactions_status ON public.ad_payment_transactions(status);

ALTER TABLE public.ad_payment_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ad_payment_transactions_service_role" ON public.ad_payment_transactions;
CREATE POLICY "ad_payment_transactions_service_role"
  ON public.ad_payment_transactions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 2. ADMIN FEE CONFIG (migration 029 kördes ej)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_fee_config (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_type    TEXT NOT NULL UNIQUE CHECK (fee_type IN ('ad_rejection', 'daily_charge', 'other')),
  fee_percent INTEGER NOT NULL DEFAULT 5,
  fixed_fee   DECIMAL(10,2) DEFAULT 0,
  description TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.admin_fee_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_fee_config_service_role" ON public.admin_fee_config;
CREATE POLICY "admin_fee_config_service_role"
  ON public.admin_fee_config FOR ALL TO service_role USING (true) WITH CHECK (true);

INSERT INTO public.admin_fee_config (fee_type, fee_percent, fixed_fee, description) VALUES
  ('ad_rejection', 5,  50, 'Avgift för återbetalning vid avvisad annons'),
  ('daily_charge',  2,   0, 'Avgift för dagliga debiteringar')
ON CONFLICT (fee_type) DO NOTHING;

-- ============================================================
-- 3. ASN NOTICES (migration 034 kördes ej fullt)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.asn_notices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asn_number       VARCHAR(100) UNIQUE NOT NULL,
  merchant_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  warehouse_id     UUID REFERENCES public.consolidation_warehouses(id),
  status           VARCHAR(50) DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_transit', 'received', 'discrepancy', 'completed')),
  expected_arrival DATE,
  received_at      TIMESTAMP WITH TIME ZONE,
  items            JSONB DEFAULT '[]',
  discrepancies    JSONB DEFAULT '[]',
  notes            TEXT,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asn_notices_merchant  ON public.asn_notices(merchant_id);
CREATE INDEX IF NOT EXISTS idx_asn_notices_warehouse ON public.asn_notices(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_asn_notices_status    ON public.asn_notices(status);

ALTER TABLE public.asn_notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "asn_notices_service_role"  ON public.asn_notices;
DROP POLICY IF EXISTS "asn_notices_merchant_own"  ON public.asn_notices;
CREATE POLICY "asn_notices_service_role"
  ON public.asn_notices FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "asn_notices_merchant_own"
  ON public.asn_notices FOR SELECT TO authenticated USING (merchant_id = auth.uid());

-- ============================================================
-- 4. WAREHOUSE EVENTS (migration 034 kördes ej fullt)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.warehouse_events (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_partner_id TEXT,
  event_type           VARCHAR(100) NOT NULL,
  shipment_id          TEXT,
  order_id             TEXT,
  event_data           JSONB DEFAULT '{}',
  processed            BOOLEAN DEFAULT false,
  processed_at         TIMESTAMP WITH TIME ZONE,
  error_message        TEXT,
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warehouse_events_partner   ON public.warehouse_events(warehouse_partner_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_events_type      ON public.warehouse_events(event_type);
CREATE INDEX IF NOT EXISTS idx_warehouse_events_processed ON public.warehouse_events(processed) WHERE processed = false;

ALTER TABLE public.warehouse_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "warehouse_events_service_role" ON public.warehouse_events;
CREATE POLICY "warehouse_events_service_role"
  ON public.warehouse_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 5. LEADERBOARDS (migration 034 kördes ej fullt)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leaderboards (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leaderboard_type  VARCHAR(50) NOT NULL
    CHECK (leaderboard_type IN ('sales', 'xp', 'community', 'global')),
  entity_type       VARCHAR(50) NOT NULL
    CHECK (entity_type IN ('user', 'community', 'seller')),
  entity_id         UUID NOT NULL,
  score             DECIMAL(12,2) DEFAULT 0,
  rank              INTEGER,
  period            VARCHAR(20) DEFAULT 'all_time'
    CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
  period_start      DATE,
  period_end        DATE,
  metadata          JSONB DEFAULT '{}',
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaderboards_type_period ON public.leaderboards(leaderboard_type, period);
CREATE INDEX IF NOT EXISTS idx_leaderboards_entity      ON public.leaderboards(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_rank        ON public.leaderboards(rank);

ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leaderboards_service_role" ON public.leaderboards;
DROP POLICY IF EXISTS "leaderboards_public_read"  ON public.leaderboards;
CREATE POLICY "leaderboards_service_role"
  ON public.leaderboards FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "leaderboards_public_read"
  ON public.leaderboards FOR SELECT TO authenticated, anon USING (true);

-- ============================================================
-- 6. USER ACHIEVEMENTS (migration 034 kördes ej fullt)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id   UUID REFERENCES public.achievements(id) ON DELETE SET NULL,
  achievement_type VARCHAR(100) NOT NULL,
  title            VARCHAR(255) NOT NULL,
  description      TEXT,
  badge_icon       TEXT,
  xp_earned        INTEGER DEFAULT 0,
  earned_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata         JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user        ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON public.user_achievements(achievement_id);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_achievements_service_role" ON public.user_achievements;
DROP POLICY IF EXISTS "user_achievements_own_read"     ON public.user_achievements;
CREATE POLICY "user_achievements_service_role"
  ON public.user_achievements FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "user_achievements_own_read"
  ON public.user_achievements FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ============================================================
-- 7. CAMPAIGNS (migration 032 kördes ej)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 VARCHAR(255) NOT NULL,
  slug                  VARCHAR(255) UNIQUE NOT NULL,
  description           TEXT,
  content               JSONB DEFAULT '{}',
  campaign_type         VARCHAR(50) DEFAULT 'campaign'
    CHECK (campaign_type IN ('campaign', 'blog', 'landing_page', 'promotion')),
  status                VARCHAR(50) DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived', 'deleted')),
  seo_title             VARCHAR(255),
  seo_description       TEXT,
  seo_keywords          TEXT[],
  canonical_url         TEXT,
  og_image_url          TEXT,
  og_title              VARCHAR(255),
  og_description        TEXT,
  featured_image_url    TEXT,
  featured_image_alt    TEXT,
  featured_image_seo_tags JSONB DEFAULT '{}',
  published_at          TIMESTAMP WITH TIME ZONE,
  expires_at            TIMESTAMP WITH TIME ZONE,
  is_searchable         BOOLEAN DEFAULT true,
  created_by            UUID REFERENCES public.profiles(id),
  updated_by            UUID REFERENCES public.profiles(id),
  view_count            INTEGER DEFAULT 0,
  click_count           INTEGER DEFAULT 0,
  metadata              JSONB DEFAULT '{}',
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_slug       ON public.campaigns(slug);
CREATE INDEX IF NOT EXISTS idx_campaigns_status     ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type       ON public.campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_published  ON public.campaigns(published_at) WHERE status = 'published';

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "campaigns_select_published" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_select_all"       ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_insert_admin"     ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_update_admin"     ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_delete_admin"     ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_service_role"     ON public.campaigns;

CREATE POLICY "campaigns_service_role"
  ON public.campaigns FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "campaigns_select_published"
  ON public.campaigns FOR SELECT TO authenticated, anon USING (status = 'published');
CREATE POLICY "campaigns_insert_admin"
  ON public.campaigns FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gs_admin'));
CREATE POLICY "campaigns_update_admin"
  ON public.campaigns FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gs_admin'));
CREATE POLICY "campaigns_delete_admin"
  ON public.campaigns FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gs_admin'));

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON public.campaigns;
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 8. SEO SETTINGS (migration 032 kördes ej)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.seo_settings (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_title               VARCHAR(255),
  site_description         TEXT,
  site_keywords            TEXT[],
  default_og_image         TEXT,
  facebook_url             TEXT,
  twitter_handle           VARCHAR(255),
  instagram_handle         VARCHAR(255),
  linkedin_url             TEXT,
  google_analytics_id      VARCHAR(50),
  google_tag_manager_id    VARCHAR(50),
  google_site_verification TEXT,
  bing_site_verification   TEXT,
  robots_txt_content       TEXT,
  sitemap_enabled          BOOLEAN DEFAULT true,
  sitemap_frequency        VARCHAR(20) DEFAULT 'weekly',
  metadata                 JSONB DEFAULT '{}',
  updated_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by               UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "seo_settings_service_role"  ON public.seo_settings;
DROP POLICY IF EXISTS "seo_settings_select_admin"  ON public.seo_settings;
DROP POLICY IF EXISTS "seo_settings_update_admin"  ON public.seo_settings;
DROP POLICY IF EXISTS "seo_settings_insert_admin"  ON public.seo_settings;
CREATE POLICY "seo_settings_service_role"
  ON public.seo_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "seo_settings_admin"
  ON public.seo_settings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gs_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gs_admin'));

INSERT INTO public.seo_settings (site_title, site_description, site_keywords)
VALUES (
  'GoalSquad - Community Commerce för föreningar och klubbar',
  'GoalSquad hjälper idrottsföreningar, skolklasser och klubbar att finansiera sin verksamhet.',
  ARRAY['community commerce', 'försäljning', 'föreningar', 'klubbar', 'fundraising']
) ON CONFLICT DO NOTHING;

-- ============================================================
-- 9. CAMPAIGN FORMS + SUBMISSIONS (migration 032 kördes ej)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campaign_forms (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id      UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  form_name        VARCHAR(255) NOT NULL,
  form_config      JSONB DEFAULT '{}',
  submission_count INTEGER DEFAULT 0,
  metadata         JSONB DEFAULT '{}',
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_forms_campaign ON public.campaign_forms(campaign_id);

ALTER TABLE public.campaign_forms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "campaign_forms_service_role" ON public.campaign_forms;
CREATE POLICY "campaign_forms_service_role"
  ON public.campaign_forms FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.campaign_form_submissions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id          UUID NOT NULL REFERENCES public.campaign_forms(id) ON DELETE CASCADE,
  campaign_id      UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  submission_data  JSONB NOT NULL,
  submitter_name   VARCHAR(255),
  submitter_email  VARCHAR(255),
  submitter_phone  VARCHAR(50),
  status           VARCHAR(50) DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'converted', 'spam')),
  notes            TEXT,
  followed_up_at   TIMESTAMP WITH TIME ZONE,
  followed_up_by   UUID REFERENCES public.profiles(id),
  metadata         JSONB DEFAULT '{}',
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_form_submissions_form     ON public.campaign_form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_campaign_form_submissions_campaign ON public.campaign_form_submissions(campaign_id);

ALTER TABLE public.campaign_form_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "campaign_form_submissions_service_role" ON public.campaign_form_submissions;
DROP POLICY IF EXISTS "campaign_form_submissions_insert_anon"  ON public.campaign_form_submissions;
CREATE POLICY "campaign_form_submissions_service_role"
  ON public.campaign_form_submissions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "campaign_form_submissions_insert_anon"
  ON public.campaign_form_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ============================================================
-- 10. PICK SESSIONS + ITEMS + PRODUCT BARCODES (migration 037 kördes ej)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pick_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL,
  picker_id    UUID NOT NULL,
  warehouse_id UUID,
  started_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status       VARCHAR(20) DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  notes        TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pick_session_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID NOT NULL REFERENCES public.pick_sessions(id) ON DELETE CASCADE,
  order_item_id     UUID NOT NULL,
  product_id        UUID,
  sku               TEXT NOT NULL,
  required_quantity INTEGER NOT NULL,
  scanned_quantity  INTEGER DEFAULT 0,
  is_complete       BOOLEAN DEFAULT false,
  completed_at      TIMESTAMP WITH TIME ZONE,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_barcodes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL,
  barcode_type  VARCHAR(20) NOT NULL DEFAULT 'internal'
    CHECK (barcode_type IN ('ean13', 'ean8', 'upc', 'gs1', 'internal', 'qr')),
  barcode_value TEXT NOT NULL UNIQUE,
  is_primary    BOOLEAN DEFAULT false,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pick_sessions_order         ON public.pick_sessions(order_id);
CREATE INDEX IF NOT EXISTS idx_pick_sessions_picker        ON public.pick_sessions(picker_id);
CREATE INDEX IF NOT EXISTS idx_pick_session_items_session  ON public.pick_session_items(session_id);
CREATE INDEX IF NOT EXISTS idx_product_barcodes_value      ON public.product_barcodes(barcode_value);
CREATE INDEX IF NOT EXISTS idx_product_barcodes_product    ON public.product_barcodes(product_id);

ALTER TABLE public.pick_sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pick_session_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_barcodes    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pick_sessions_service_role"       ON public.pick_sessions;
DROP POLICY IF EXISTS "pick_sessions_authenticated"      ON public.pick_sessions;
DROP POLICY IF EXISTS "pick_session_items_service_role"  ON public.pick_session_items;
DROP POLICY IF EXISTS "pick_session_items_authenticated" ON public.pick_session_items;
DROP POLICY IF EXISTS "product_barcodes_read"            ON public.product_barcodes;
DROP POLICY IF EXISTS "product_barcodes_write"           ON public.product_barcodes;

CREATE POLICY "pick_sessions_service_role"       ON public.pick_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "pick_sessions_authenticated"      ON public.pick_sessions FOR ALL TO authenticated USING (picker_id = auth.uid()) WITH CHECK (true);
CREATE POLICY "pick_session_items_service_role"  ON public.pick_session_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "pick_session_items_authenticated" ON public.pick_session_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "product_barcodes_read"            ON public.product_barcodes FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "product_barcodes_write"           ON public.product_barcodes FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 11. FIX PROFILES — guardian_id (guardians API kräver det)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'guardian_id'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN guardian_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_profiles_guardian ON public.profiles(guardian_id) WHERE guardian_id IS NOT NULL;
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

-- ============================================================
-- 12. FIX BLOG POSTS RLS — 'admin' → 'gs_admin'
-- ============================================================
DROP POLICY IF EXISTS "Admins can view all posts"   ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can insert posts"     ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can update posts"     ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can delete posts"     ON public.blog_posts;

DROP POLICY IF EXISTS "blog_posts_admin_all" ON public.blog_posts;
CREATE POLICY "blog_posts_admin_all"
  ON public.blog_posts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gs_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gs_admin'));

DROP POLICY IF EXISTS "blog_posts_service_role" ON public.blog_posts;
CREATE POLICY "blog_posts_service_role"
  ON public.blog_posts FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 13. ADS — add missing payment columns (migration 029 kördes ej)
-- ============================================================
DO $$
BEGIN
  ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS approval_status          TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS payment_type             TEXT DEFAULT 'daily'   CHECK (payment_type   IN ('daily', 'advance'));
  ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS payment_status           TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'partial_refund'));
  ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS advance_discount_percent INTEGER DEFAULT 10;
  ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS original_price           DECIMAL(10,2);
  ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS discounted_price         DECIMAL(10,2);
  ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS admin_fee_percent        INTEGER DEFAULT 5;
  ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS refund_amount            DECIMAL(10,2);
  ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS refund_date              TIMESTAMP WITH TIME ZONE;
  ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS refund_reason            TEXT;
  ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
  ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS stripe_customer_id       TEXT;
  ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT;
  ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS save_card_for_daily_charges BOOLEAN DEFAULT false;
  ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS daily_charge_limit       DECIMAL(10,2);
  ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS last_daily_charge_date   TIMESTAMP WITH TIME ZONE;
  ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS total_daily_charged      DECIMAL(10,2) DEFAULT 0;
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_ads_approval_status ON public.ads(approval_status);
CREATE INDEX IF NOT EXISTS idx_ads_payment_status  ON public.ads(payment_status);

-- ============================================================
-- 14. FUNCTIONS (migration 029 kördes ej)
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_discounted_price(
  p_original_price DECIMAL,
  p_discount_percent INTEGER
) RETURNS DECIMAL AS $$
BEGIN
  RETURN ROUND(p_original_price * (1 - (p_discount_percent::DECIMAL / 100)), 2);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_refund_amount(
  p_paid_amount      DECIMAL,
  p_admin_fee_percent INTEGER,
  p_fixed_fee        DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  v_fee_amount    DECIMAL;
  v_refund_amount DECIMAL;
BEGIN
  v_fee_amount    := ROUND(p_paid_amount * (p_admin_fee_percent::DECIMAL / 100), 2) + p_fixed_fee;
  v_refund_amount := GREATEST(p_paid_amount - v_fee_amount, 0);
  RETURN v_refund_amount;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN RAISE NOTICE 'Migration 040: missing tables created successfully'; END $$;
