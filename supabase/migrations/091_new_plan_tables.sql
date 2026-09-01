-- =====================================================================
-- GOALSQUAD MIGRATION: NEW PLAN TABLES (Fas 1-4)
-- =====================================================================
-- Databas-tabeller för logistik, analytics, UX och gamification med idempotency

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Tabell för sparade betalmetoder (Stripe Setup Intents)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_payment_method_id TEXT NOT NULL,
    brand TEXT,
    last4 TEXT,
    exp_month INT,
    exp_year INT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON public.customer_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON public.customer_payment_methods(user_id, is_default) WHERE is_default = true;

-- ---------------------------------------------------------------------
-- 2. Systemhälsa och övervakning av bakgrundsjobb (CRON-logs)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_worker_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'running')),
    duration_ms INT,
    error_message TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_worker_logs_name_date ON public.system_worker_logs(worker_name, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_worker_logs_status ON public.system_worker_logs(status);

-- ---------------------------------------------------------------------
-- 3. Supporter Orders med Idempotency Guard
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.supporter_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL,
    supporter_name VARCHAR(255) NOT NULL,
    supporter_email VARCHAR(255) NOT NULL,
    total_amount_sek NUMERIC(10, 2) NOT NULL,
    delivery_method VARCHAR(50) NOT NULL CHECK (delivery_method IN ('class_pickup', 'home_delivery')),
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_supporter_orders_campaign ON public.supporter_orders(campaign_id);
CREATE INDEX IF NOT EXISTS idx_supporter_orders_seller ON public.supporter_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_supporter_orders_idempotency ON public.supporter_orders(idempotency_key);

-- ---------------------------------------------------------------------
-- 4. Campaign Notifications med Idempotency Guard
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campaign_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    recipient_id VARCHAR(255) NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    channel VARCHAR(10) NOT NULL CHECK (channel IN ('sms', 'email')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    idempotency_lock VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_campaign_notifications_campaign ON public.campaign_notifications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_notifications_recipient ON public.campaign_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_campaign_notifications_lock ON public.campaign_notifications(idempotency_lock);

-- ---------------------------------------------------------------------
-- 5. Hub Payouts Receipts med Utlämningslås
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hub_payouts_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    seller_id VARCHAR(255) NOT NULL,
    scanned_by UUID NOT NULL REFERENCES auth.users(id),
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
    payout_lock VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hub_payouts_campaign ON public.hub_payouts_receipts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_hub_payouts_seller ON public.hub_payouts_receipts(seller_id);
CREATE INDEX IF NOT EXISTS idx_hub_payouts_lock ON public.hub_payouts_receipts(payout_lock);

-- ---------------------------------------------------------------------
-- 6. Seller Leaderboard Stats (Cachad säljarstatistik)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seller_leaderboard_stats (
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    seller_id VARCHAR(255) NOT NULL,
    seller_name VARCHAR(255) NOT NULL,
    total_units_sold INT DEFAULT 0,
    total_revenue_sek NUMERIC(10, 2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (campaign_id, seller_id)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_campaign ON public.seller_leaderboard_stats(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_units ON public.seller_leaderboard_stats(total_units_sold DESC);

-- ---------------------------------------------------------------------
-- 7. Seller Badges med Idempotency Guard
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seller_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    seller_id VARCHAR(255) NOT NULL,
    badge_type VARCHAR(50) NOT NULL CHECK (badge_type IN ('first_sale', 'ten_club', 'top_gun', 'marathon_seller')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    badge_lock VARCHAR(255) NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_seller_badges_campaign ON public.seller_badges(campaign_id);
CREATE INDEX IF NOT EXISTS idx_seller_badges_seller ON public.seller_badges(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_badges_lock ON public.seller_badges(badge_lock);

-- ---------------------------------------------------------------------
-- 8. Financial Settlements Ledger
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financial_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    total_revenue_sek NUMERIC(10, 2) NOT NULL,
    platform_cut_sek NUMERIC(10, 2) NOT NULL,
    payout_class_sek NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
    payout_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_financial_settlements_campaign ON public.financial_settlements(campaign_id);
CREATE INDEX IF NOT EXISTS idx_financial_settlements_status ON public.financial_settlements(status);

-- ---------------------------------------------------------------------
-- 9. Index för prestandaoptimering på befintliga tabeller
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_discrepancies_sku_type ON public.warehouse_discrepancies(sku, discrepancy_type);

-- ---------------------------------------------------------------------
-- 10. RLS Policies för nya tabeller
-- ---------------------------------------------------------------------
ALTER TABLE public.customer_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_worker_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supporter_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_payouts_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_leaderboard_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_settlements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'customer_payment_methods' AND policyname = 'users_view_own_payment_methods'
  ) THEN
    CREATE POLICY "users_view_own_payment_methods" ON public.customer_payment_methods FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'customer_payment_methods' AND policyname = 'users_insert_own_payment_methods'
  ) THEN
    CREATE POLICY "users_insert_own_payment_methods" ON public.customer_payment_methods FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'customer_payment_methods' AND policyname = 'users_update_own_payment_methods'
  ) THEN
    CREATE POLICY "users_update_own_payment_methods" ON public.customer_payment_methods FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'customer_payment_methods' AND policyname = 'users_delete_own_payment_methods'
  ) THEN
    CREATE POLICY "users_delete_own_payment_methods" ON public.customer_payment_methods FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'system_worker_logs' AND policyname = 'admins_view_worker_logs'
  ) THEN
    CREATE POLICY "admins_view_worker_logs" ON public.system_worker_logs FOR SELECT TO authenticated USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'supporter_orders' AND policyname = 'users_view_own_supporter_orders'
  ) THEN
    CREATE POLICY "users_view_own_supporter_orders" ON public.supporter_orders FOR SELECT TO authenticated USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'supporter_orders' AND policyname = 'system_insert_supporter_orders'
  ) THEN
    CREATE POLICY "system_insert_supporter_orders" ON public.supporter_orders FOR INSERT TO authenticated WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'campaign_notifications' AND policyname = 'admins_view_campaign_notifications'
  ) THEN
    CREATE POLICY "admins_view_campaign_notifications" ON public.campaign_notifications FOR SELECT TO authenticated USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'campaign_notifications' AND policyname = 'system_insert_campaign_notifications'
  ) THEN
    CREATE POLICY "system_insert_campaign_notifications" ON public.campaign_notifications FOR INSERT TO authenticated WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'hub_payouts_receipts' AND policyname = 'admins_view_hub_payouts_receipts'
  ) THEN
    CREATE POLICY "admins_view_hub_payouts_receipts" ON public.hub_payouts_receipts FOR SELECT TO authenticated USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'hub_payouts_receipts' AND policyname = 'system_insert_hub_payouts_receipts'
  ) THEN
    CREATE POLICY "system_insert_hub_payouts_receipts" ON public.hub_payouts_receipts FOR INSERT TO authenticated WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'seller_leaderboard_stats' AND policyname = 'authenticated_view_seller_leaderboard_stats'
  ) THEN
    CREATE POLICY "authenticated_view_seller_leaderboard_stats" ON public.seller_leaderboard_stats
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'seller_leaderboard_stats' AND policyname = 'admins_update_seller_leaderboard_stats'
  ) THEN
    CREATE POLICY "admins_update_seller_leaderboard_stats" ON public.seller_leaderboard_stats FOR UPDATE TO authenticated USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'seller_badges' AND policyname = 'authenticated_view_seller_badges'
  ) THEN
    CREATE POLICY "authenticated_view_seller_badges" ON public.seller_badges
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'seller_badges' AND policyname = 'admins_insert_seller_badges'
  ) THEN
    CREATE POLICY "admins_insert_seller_badges" ON public.seller_badges FOR INSERT TO authenticated WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'financial_settlements' AND policyname = 'admins_view_financial_settlements'
  ) THEN
    CREATE POLICY "admins_view_financial_settlements" ON public.financial_settlements FOR SELECT TO authenticated USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'financial_settlements' AND policyname = 'admins_insert_financial_settlements'
  ) THEN
    CREATE POLICY "admins_insert_financial_settlements" ON public.financial_settlements FOR INSERT TO authenticated WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
  END IF;
END $$;
    FOR INSERT TO authenticated
    WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Admins can update settlements" ON public.financial_settlements;
CREATE POLICY "Admins can update settlements" ON public.financial_settlements
    FOR UPDATE TO authenticated
    USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

COMMIT;

-- =====================================================================
-- NOTERINGAR
-- =====================================================================
-- Denna migration lägger till:
-- 1. customer_payment_methods - Sparade betalmetoder
-- 2. system_worker_logs - CRON-jobb logs
-- 3. supporter_orders - Supporter orders med idempotency
-- 4. campaign_notifications - Aviseringslogg med idempotency
-- 5. hub_payouts_receipts - Utlämningslås
-- 6. seller_leaderboard_stats - Cachad säljarstatistik
-- 7. seller_badges - Badge-liggare med idempotency
-- 8. financial_settlements - Ekonomisk slutavräkning
-- 9. Index för prestandaoptimering
-- 10. RLS policies för alla nya tabeller
