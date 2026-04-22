-- ============================================================
-- MIGRATION 034: COMPREHENSIVE FIX & MISSING TABLES/COLUMNS
-- ============================================================
-- Purpose: Fix all known schema issues identified by codebase analysis
--
-- Issues fixed:
-- 1. ads table: missing columns expected by API routes
-- 2. Migration 028 bug: broken get_active_ads_for_placement function
-- 3. Migration 029 RLS bug: merchant_id → advertiser_id
-- 4. profiles table: missing stripe_customer_id, organization columns
-- 5. communities table: missing is_active, city, country, total_members
-- 6. Missing tables: product_flow_summary, consolidation_warehouses,
--    merchant_community_messages, broadcast_messages, broadcast_recipients,
--    customer_support_stats, coordination_messages, squad_tiers,
--    community_milestones, community_badges, entity_goals, wallets,
--    leaderboards, user_achievements, asn_notices, warehouse_inventory
-- ============================================================

-- ============================================================
-- SECTION 1: FIX PROFILES TABLE
-- ============================================================

-- stripe_customer_id used in stripe routes
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS organization_id UUID,
  ADD COLUMN IF NOT EXISTS organization_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS organization_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS share_commission BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- ============================================================
-- SECTION 2: FIX COMMUNITIES TABLE
-- ============================================================

-- Used by search/stats routes
ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS city VARCHAR(255),
  ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'SE',
  ADD COLUMN IF NOT EXISTS total_members INTEGER DEFAULT 0;

-- ============================================================
-- SECTION 3: FIX ADS TABLE - ALL MISSING COLUMNS
-- ============================================================

-- Columns referenced by ads/purchase route and admin/ads route
-- Most are already added by 028/029/030 but we ensure all exist
-- Wrapped in DO block so it skips safely if ads table doesn't exist yet

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'ads' AND schemaname = 'public') THEN
    ALTER TABLE public.ads
      ADD COLUMN IF NOT EXISTS placement_type TEXT DEFAULT 'rotating',
      ADD COLUMN IF NOT EXISTS daily_view_limit INTEGER DEFAULT 1000,
      ADD COLUMN IF NOT EXISTS daily_views_today INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS daily_views_reset_date DATE DEFAULT CURRENT_DATE,
      ADD COLUMN IF NOT EXISTS is_daily_limit_reached BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS link_type TEXT DEFAULT 'external',
      ADD COLUMN IF NOT EXISTS internal_link_path TEXT,
      ADD COLUMN IF NOT EXISTS button_config JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS auto_restart_next_day BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'daily',
      ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS advance_discount_percent INTEGER DEFAULT 10,
      ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS discounted_price DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS admin_fee_percent INTEGER DEFAULT 5,
      ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS refund_date TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS refund_reason TEXT,
      ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
      ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
      ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT,
      ADD COLUMN IF NOT EXISTS save_card_for_daily_charges BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS daily_charge_limit DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS last_daily_charge_date DATE,
      ADD COLUMN IF NOT EXISTS total_daily_charged DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS company_description TEXT,
      ADD COLUMN IF NOT EXISTS company_name TEXT,
      ADD COLUMN IF NOT EXISTS company_website TEXT,
      ADD COLUMN IF NOT EXISTS backlink_url TEXT,
      ADD COLUMN IF NOT EXISTS backlink_verified BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS backlink_discount_applied BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS content_flagged BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS flag_reason TEXT,
      ADD COLUMN IF NOT EXISTS url_scanned BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS url_scan_result JSONB;

    -- CHECK constraints
    BEGIN
      ALTER TABLE public.ads ADD CONSTRAINT ads_placement_type_check CHECK (placement_type IN ('fixed', 'rotating'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TABLE public.ads ADD CONSTRAINT ads_link_type_check CHECK (link_type IN ('internal', 'external'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TABLE public.ads ADD CONSTRAINT ads_approval_status_check CHECK (approval_status IN ('pending', 'approved', 'rejected'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TABLE public.ads ADD CONSTRAINT ads_payment_type_check CHECK (payment_type IN ('daily', 'advance'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TABLE public.ads ADD CONSTRAINT ads_payment_status_check CHECK (payment_status IN ('pending', 'paid', 'refunded', 'partial_refund'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TABLE public.ads DROP CONSTRAINT IF EXISTS ads_status_check;
      ALTER TABLE public.ads ADD CONSTRAINT ads_status_check
        CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'paused', 'completed', 'cancelled'));
    EXCEPTION WHEN others THEN NULL;
    END;
  ELSE
    RAISE NOTICE 'ads table does not exist yet - skipping Section 3 (will apply after migration 026 runs)';
  END IF;
END $$;

-- ============================================================
-- SECTION 4: FIX BROKEN FUNCTION FROM MIGRATION 028
-- The original get_active_ads_for_placement had wrong JOIN:
--   JOIN ad_placements ap ON a.id = ap.ad_id  ← WRONG
-- Correct: ads.placement_id → ad_placements.id
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'ads' AND schemaname = 'public') THEN
    CREATE OR REPLACE FUNCTION public.get_active_ads_for_placement(p_placement_id UUID)
    RETURNS TABLE (
      ad_id UUID,
      title TEXT,
      image_url TEXT,
      link_url TEXT,
      link_type TEXT,
      internal_link_path TEXT,
      button_config JSONB
    ) AS $func$
    BEGIN
      IF EXISTS (SELECT FROM pg_proc WHERE proname = 'reset_daily_ad_views') THEN
        PERFORM public.reset_daily_ad_views();
      END IF;
      IF EXISTS (SELECT FROM pg_proc WHERE proname = 'check_daily_ad_limits') THEN
        PERFORM public.check_daily_ad_limits();
      END IF;

      RETURN QUERY
      SELECT
        a.id,
        a.title,
        a.image_url,
        a.link_url,
        a.link_type,
        a.internal_link_path,
        a.button_config
      FROM public.ads a
      WHERE
        a.placement_id = p_placement_id
        AND a.status = 'active'
        AND a.approval_status = 'approved'
        AND a.is_daily_limit_reached = false
        AND a.start_date <= CURRENT_DATE
        AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE)
      ORDER BY a.priority DESC, random();
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;
  ELSE
    RAISE NOTICE 'ads table not found - skipping get_active_ads_for_placement function';
  END IF;
END $$;

-- ============================================================
-- SECTION 5: FIX BROKEN check_total_ad_limits FUNCTION
-- Original referenced non-existent columns total_views/total_days
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'ads' AND schemaname = 'public') THEN
    CREATE OR REPLACE FUNCTION public.check_total_ad_limits()
    RETURNS VOID AS $func$
    BEGIN
      UPDATE public.ads SET status = 'completed'
      WHERE status = 'active' AND purchase_type = 'views' AND max_views IS NOT NULL
        AND (SELECT COALESCE(SUM(views), 0) FROM public.ad_stats WHERE ad_stats.ad_id = public.ads.id) >= max_views;

      UPDATE public.ads SET status = 'completed'
      WHERE status = 'active' AND purchase_type = 'clicks' AND max_clicks IS NOT NULL
        AND (SELECT COALESCE(SUM(clicks), 0) FROM public.ad_stats WHERE ad_stats.ad_id = public.ads.id) >= max_clicks;

      UPDATE public.ads SET status = 'completed'
      WHERE status = 'active' AND purchase_type = 'days'
        AND end_date IS NOT NULL AND end_date < CURRENT_DATE;
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;
  ELSE
    RAISE NOTICE 'ads table not found - skipping check_total_ad_limits function';
  END IF;
END $$;

-- ============================================================
-- SECTION 6: FIX ad_payment_transactions RLS
-- Migration 029 used ads.merchant_id but column is advertiser_id
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'ad_payment_transactions' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS ad_payment_transactions_select_policy ON public.ad_payment_transactions;
    DROP POLICY IF EXISTS ad_payment_transactions_insert_policy ON public.ad_payment_transactions;
    DROP POLICY IF EXISTS ad_payment_transactions_update_policy ON public.ad_payment_transactions;
    DROP POLICY IF EXISTS ad_payment_transactions_select_own ON public.ad_payment_transactions;
    DROP POLICY IF EXISTS ad_payment_transactions_insert_own ON public.ad_payment_transactions;
    DROP POLICY IF EXISTS ad_payment_transactions_service_role ON public.ad_payment_transactions;

    CREATE POLICY "ad_payment_transactions_select_own" ON public.ad_payment_transactions
      FOR SELECT TO authenticated
      USING (
        EXISTS (SELECT 1 FROM public.ads WHERE ads.id = ad_payment_transactions.ad_id AND ads.advertiser_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      );
    CREATE POLICY "ad_payment_transactions_insert_own" ON public.ad_payment_transactions
      FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.ads WHERE ads.id = ad_payment_transactions.ad_id AND ads.advertiser_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      );
    CREATE POLICY "ad_payment_transactions_service_role" ON public.ad_payment_transactions
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  ELSE
    RAISE NOTICE 'ad_payment_transactions table not found - skipping Section 6';
  END IF;
END $$;

-- ============================================================
-- SECTION 7: FIX ads UPDATE RLS (028 used merchant_id)
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'ads' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS ads_update_policy ON public.ads;
    DROP POLICY IF EXISTS ads_update_own ON public.ads;
    CREATE POLICY "ads_update_own" ON public.ads
      FOR UPDATE TO authenticated
      USING (
        advertiser_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      )
      WITH CHECK (
        advertiser_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      );
  ELSE
    RAISE NOTICE 'ads table not found - skipping Section 7';
  END IF;
END $$;

-- ============================================================
-- SECTION 8: MISSING TABLES
-- ============================================================

-- 8.1 consolidation_warehouses (used by warehouses route)
CREATE TABLE IF NOT EXISTS public.consolidation_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  country VARCHAR(2) NOT NULL DEFAULT 'SE',
  city VARCHAR(255),
  address TEXT,
  postal_code VARCHAR(20),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  capacity_sqm INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.consolidation_warehouses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.consolidation_warehouses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "consolidation_warehouses_service_role" ON public.consolidation_warehouses;
DROP POLICY IF EXISTS "consolidation_warehouses_authenticated_read" ON public.consolidation_warehouses;
CREATE POLICY "consolidation_warehouses_service_role" ON public.consolidation_warehouses
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "consolidation_warehouses_authenticated_read" ON public.consolidation_warehouses
  FOR SELECT TO authenticated USING (is_active = true);

-- 8.2 warehouse_inventory
CREATE TABLE IF NOT EXISTS public.warehouse_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID REFERENCES public.consolidation_warehouses(id) ON DELETE CASCADE,
  product_id UUID,
  merchant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  sku VARCHAR(100),
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  location_code VARCHAR(50),
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.warehouse_inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "warehouse_inventory_service_role" ON public.warehouse_inventory;
CREATE POLICY "warehouse_inventory_service_role" ON public.warehouse_inventory
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 8.3 asn_notices (Advanced Shipment Notices)
CREATE TABLE IF NOT EXISTS public.asn_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asn_number VARCHAR(100) UNIQUE NOT NULL,
  merchant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES public.consolidation_warehouses(id),
  status VARCHAR(50) DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_transit', 'received', 'discrepancy', 'completed')),
  expected_arrival DATE,
  received_at TIMESTAMP WITH TIME ZONE,
  items JSONB DEFAULT '[]',
  discrepancies JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.asn_notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "asn_notices_service_role" ON public.asn_notices;
DROP POLICY IF EXISTS "asn_notices_merchant_own" ON public.asn_notices;
CREATE POLICY "asn_notices_service_role" ON public.asn_notices
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "asn_notices_merchant_own" ON public.asn_notices
  FOR SELECT TO authenticated USING (merchant_id = auth.uid());

-- 8.4 warehouse_events
CREATE TABLE IF NOT EXISTS public.warehouse_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_partner_id TEXT,
  event_type VARCHAR(100) NOT NULL,
  shipment_id TEXT,
  order_id TEXT,
  event_data JSONB DEFAULT '{}',
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.warehouse_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "warehouse_events_service_role" ON public.warehouse_events;
CREATE POLICY "warehouse_events_service_role" ON public.warehouse_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 8.5 product_flow_summary (used by products/[id]/flow-summary route)
CREATE TABLE IF NOT EXISTS public.product_flow_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  total_quantity_sold INTEGER DEFAULT 0,
  avg_order_value DECIMAL(10,2) DEFAULT 0,
  last_order_at TIMESTAMP WITH TIME ZONE,
  summary_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.product_flow_summary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "product_flow_summary_service_role" ON public.product_flow_summary;
DROP POLICY IF EXISTS "product_flow_summary_authenticated_read" ON public.product_flow_summary;
CREATE POLICY "product_flow_summary_service_role" ON public.product_flow_summary
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "product_flow_summary_authenticated_read" ON public.product_flow_summary
  FOR SELECT TO authenticated USING (true);

-- 8.6 entity_goals (used by entity_goals route)
CREATE TABLE IF NOT EXISTS public.entity_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('user', 'community', 'seller', 'merchant')),
  entity_id UUID NOT NULL,
  goal_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_value DECIMAL(12,2),
  current_value DECIMAL(12,2) DEFAULT 0,
  unit VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'cancelled')),
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entity_goals_entity ON public.entity_goals(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_goals_status ON public.entity_goals(status);

ALTER TABLE public.entity_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "entity_goals_service_role" ON public.entity_goals;
DROP POLICY IF EXISTS "entity_goals_authenticated_read" ON public.entity_goals;
DROP POLICY IF EXISTS "entity_goals_own_manage" ON public.entity_goals;
CREATE POLICY "entity_goals_service_role" ON public.entity_goals
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "entity_goals_authenticated_read" ON public.entity_goals
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "entity_goals_own_manage" ON public.entity_goals
  FOR ALL TO authenticated
  USING (entity_id = auth.uid())
  WITH CHECK (entity_id = auth.uid());

-- 8.7 wallets
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance DECIMAL(12,2) DEFAULT 0 CHECK (balance >= 0),
  currency VARCHAR(3) DEFAULT 'SEK',
  is_locked BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wallets_service_role" ON public.wallets;
DROP POLICY IF EXISTS "wallets_own_read" ON public.wallets;
CREATE POLICY "wallets_service_role" ON public.wallets
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "wallets_own_read" ON public.wallets
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 8.8 leaderboards
CREATE TABLE IF NOT EXISTS public.leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leaderboard_type VARCHAR(50) NOT NULL CHECK (leaderboard_type IN ('sales', 'xp', 'community', 'global')),
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('user', 'community', 'seller')),
  entity_id UUID NOT NULL,
  score DECIMAL(12,2) DEFAULT 0,
  rank INTEGER,
  period VARCHAR(20) DEFAULT 'all_time' CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
  period_start DATE,
  period_end DATE,
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaderboards_type_period ON public.leaderboards(leaderboard_type, period);
CREATE INDEX IF NOT EXISTS idx_leaderboards_rank ON public.leaderboards(rank);

ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leaderboards_service_role" ON public.leaderboards;
DROP POLICY IF EXISTS "leaderboards_public_read" ON public.leaderboards;
CREATE POLICY "leaderboards_service_role" ON public.leaderboards
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "leaderboards_public_read" ON public.leaderboards
  FOR SELECT TO authenticated USING (true);

-- 8.9 user_achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  badge_icon TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_achievements_service_role" ON public.user_achievements;
DROP POLICY IF EXISTS "user_achievements_own_read" ON public.user_achievements;
CREATE POLICY "user_achievements_service_role" ON public.user_achievements
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "user_achievements_own_read" ON public.user_achievements
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 8.10 squad_tiers (used by communities/[id]/squad-tiers route)
CREATE TABLE IF NOT EXISTS public.squad_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  min_members INTEGER DEFAULT 0,
  max_members INTEGER,
  benefits JSONB DEFAULT '[]',
  badge_icon TEXT,
  color VARCHAR(20),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_squad_tiers_community ON public.squad_tiers(community_id);

ALTER TABLE public.squad_tiers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.squad_tiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "squad_tiers_service_role" ON public.squad_tiers;
DROP POLICY IF EXISTS "squad_tiers_authenticated_read" ON public.squad_tiers;
CREATE POLICY "squad_tiers_service_role" ON public.squad_tiers
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "squad_tiers_authenticated_read" ON public.squad_tiers
  FOR SELECT TO authenticated USING (is_active = true);

-- 8.11 community_milestones
CREATE TABLE IF NOT EXISTS public.community_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  milestone_type VARCHAR(50) DEFAULT 'sales'
    CHECK (milestone_type IN ('sales', 'members', 'orders', 'revenue', 'custom')),
  target_value DECIMAL(12,2) NOT NULL,
  current_value DECIMAL(12,2) DEFAULT 0,
  reward_description TEXT,
  reward_amount DECIMAL(10,2),
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_milestones_community ON public.community_milestones(community_id);

ALTER TABLE public.community_milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "community_milestones_service_role" ON public.community_milestones;
DROP POLICY IF EXISTS "community_milestones_authenticated_read" ON public.community_milestones;
CREATE POLICY "community_milestones_service_role" ON public.community_milestones
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "community_milestones_authenticated_read" ON public.community_milestones
  FOR SELECT TO authenticated USING (true);

-- 8.12 community_badges
CREATE TABLE IF NOT EXISTS public.community_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon TEXT,
  color VARCHAR(20),
  badge_type VARCHAR(50) DEFAULT 'achievement'
    CHECK (badge_type IN ('achievement', 'rank', 'special', 'seasonal')),
  criteria JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_badges_community ON public.community_badges(community_id);

ALTER TABLE public.community_badges ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.community_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "community_badges_service_role" ON public.community_badges;
DROP POLICY IF EXISTS "community_badges_authenticated_read" ON public.community_badges;
CREATE POLICY "community_badges_service_role" ON public.community_badges
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "community_badges_authenticated_read" ON public.community_badges
  FOR SELECT TO authenticated USING (is_active = true);

-- 8.13 coordination_messages
CREATE TABLE IF NOT EXISTS public.coordination_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_type VARCHAR(50) DEFAULT 'all'
    CHECK (recipient_type IN ('all', 'sellers', 'admins', 'specific')),
  message_type VARCHAR(50) DEFAULT 'info'
    CHECK (message_type IN ('info', 'alert', 'task', 'announcement')),
  title VARCHAR(255),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.coordination_messages ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE;
ALTER TABLE public.coordination_messages ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.coordination_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE public.coordination_messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_coordination_messages_community ON public.coordination_messages(community_id);

ALTER TABLE public.coordination_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coordination_messages_service_role" ON public.coordination_messages;
DROP POLICY IF EXISTS "coordination_messages_authenticated" ON public.coordination_messages;
CREATE POLICY "coordination_messages_service_role" ON public.coordination_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "coordination_messages_authenticated" ON public.coordination_messages
  FOR SELECT TO authenticated USING (true);

-- 8.14 merchant_community_messages
CREATE TABLE IF NOT EXISTS public.merchant_community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject VARCHAR(255),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  thread_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_community_messages_merchant ON public.merchant_community_messages(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_community_messages_community ON public.merchant_community_messages(community_id);

ALTER TABLE public.merchant_community_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "merchant_community_messages_service_role" ON public.merchant_community_messages;
DROP POLICY IF EXISTS "merchant_community_messages_own" ON public.merchant_community_messages;
CREATE POLICY "merchant_community_messages_service_role" ON public.merchant_community_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "merchant_community_messages_own" ON public.merchant_community_messages
  FOR SELECT TO authenticated
  USING (merchant_id = auth.uid() OR sender_id = auth.uid());

-- 8.15 broadcast_messages
CREATE TABLE IF NOT EXISTS public.broadcast_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_type VARCHAR(50) DEFAULT 'all'
    CHECK (target_type IN ('all', 'sellers', 'merchants', 'communities', 'specific_community')),
  target_id UUID,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'sent', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "broadcast_messages_service_role" ON public.broadcast_messages;
DROP POLICY IF EXISTS "broadcast_messages_admin_read" ON public.broadcast_messages;
CREATE POLICY "broadcast_messages_service_role" ON public.broadcast_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "broadcast_messages_admin_read" ON public.broadcast_messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 8.16 broadcast_recipients
CREATE TABLE IF NOT EXISTS public.broadcast_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES public.broadcast_messages(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(broadcast_id, recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_recipient ON public.broadcast_recipients(recipient_id);

ALTER TABLE public.broadcast_recipients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "broadcast_recipients_service_role" ON public.broadcast_recipients;
DROP POLICY IF EXISTS "broadcast_recipients_own" ON public.broadcast_recipients;
CREATE POLICY "broadcast_recipients_service_role" ON public.broadcast_recipients
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "broadcast_recipients_own" ON public.broadcast_recipients
  FOR SELECT TO authenticated USING (recipient_id = auth.uid());

-- 8.17 customer_support_stats
CREATE TABLE IF NOT EXISTS public.customer_support_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  period_date DATE DEFAULT CURRENT_DATE,
  tickets_opened INTEGER DEFAULT 0,
  tickets_closed INTEGER DEFAULT 0,
  avg_response_time_minutes INTEGER,
  customer_satisfaction_score DECIMAL(3,2),
  community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.customer_support_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customer_support_stats_service_role" ON public.customer_support_stats;
DROP POLICY IF EXISTS "customer_support_stats_admin_read" ON public.customer_support_stats;
CREATE POLICY "customer_support_stats_service_role" ON public.customer_support_stats
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "customer_support_stats_admin_read" ON public.customer_support_stats
  FOR SELECT TO authenticated
  USING (
    agent_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- SECTION 9: FIX SELLER_PROFILES TABLE - MISSING COLUMNS
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'seller_profiles' AND schemaname = 'public') THEN
    ALTER TABLE public.seller_profiles
      ADD COLUMN IF NOT EXISTS shop_url VARCHAR(255),
      ADD COLUMN IF NOT EXISTS total_sales INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
  ELSE
    RAISE NOTICE 'seller_profiles table not found - skipping Section 9';
  END IF;
END $$;

-- ============================================================
-- SECTION 10: FIX ORGANIZATIONS TABLE
-- Missing columns: invite_code, type
-- ============================================================

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS invite_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS type VARCHAR(50);

DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_invite_code
    ON public.organizations(invite_code) WHERE invite_code IS NOT NULL;
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- ============================================================
-- SECTION 11: FIX MERCHANT_SHIPPING_PREFERENCES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.merchant_shipping_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  allows_individual_shipments BOOLEAN DEFAULT false,
  allows_bulk_shipments BOOLEAN DEFAULT true,
  individual_shipment_cost DECIMAL(10,2) DEFAULT 0,
  bulk_shipment_cost DECIMAL(10,2) DEFAULT 0,
  minimum_bulk_quantity INTEGER DEFAULT 10,
  shipping_regions JSONB DEFAULT '[]',
  delivery_time_days INTEGER DEFAULT 7,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.merchant_shipping_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "merchant_shipping_preferences_service_role" ON public.merchant_shipping_preferences;
DROP POLICY IF EXISTS "merchant_shipping_preferences_own" ON public.merchant_shipping_preferences;
CREATE POLICY "merchant_shipping_preferences_service_role" ON public.merchant_shipping_preferences
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "merchant_shipping_preferences_own" ON public.merchant_shipping_preferences
  FOR ALL TO authenticated
  USING (merchant_id = auth.uid())
  WITH CHECK (merchant_id = auth.uid());

-- ============================================================
-- SECTION 12: FIX NOTIFICATIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notification_type VARCHAR(100) NOT NULL,
  title VARCHAR(255),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  entity_type VARCHAR(50),
  entity_id UUID,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(recipient_id, is_read) WHERE is_read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_service_role" ON public.notifications;
DROP POLICY IF EXISTS "notifications_own" ON public.notifications;
CREATE POLICY "notifications_service_role" ON public.notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "notifications_own" ON public.notifications
  FOR ALL TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- ============================================================
-- SECTION 13: INDEXES FOR NEW COLUMNS ON ADS
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'ads' AND schemaname = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_ads_approval_status ON public.ads(approval_status);
    CREATE INDEX IF NOT EXISTS idx_ads_payment_status ON public.ads(payment_status);
    CREATE INDEX IF NOT EXISTS idx_ads_daily_limit_reached ON public.ads(is_daily_limit_reached);
    CREATE INDEX IF NOT EXISTS idx_ads_content_flagged ON public.ads(content_flagged);
  END IF;
END $$;

-- ============================================================
-- SECTION 14: ENSURE SERVICE ROLE FULL ACCESS ON ALL CORE TABLES
-- ============================================================

-- Profiles
DROP POLICY IF EXISTS "Service role full access on profiles" ON public.profiles;
CREATE POLICY "Service role full access on profiles"
  ON public.profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Communities
DROP POLICY IF EXISTS "Service role full access on communities" ON public.communities;
CREATE POLICY "Service role full access on communities"
  ON public.communities FOR ALL TO service_role USING (true) WITH CHECK (true);

DO $$
BEGIN
  RAISE NOTICE 'Migration 034: Comprehensive fix completed successfully';
END $$;
