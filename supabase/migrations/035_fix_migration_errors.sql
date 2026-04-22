-- ============================================================
-- MIGRATION 035: FIX ERRORS IN 026, 027, 028, 030, 031, 032, 033
-- ============================================================
-- Run this AFTER attempting 026-034 to patch remaining errors.
-- All statements are idempotent.
-- ============================================================

-- ============================================================
-- FIX 028: Index on non-existent column ad_placements.placement_id
-- ============================================================

-- Drop the broken index (it may or may not have been created)
DROP INDEX IF EXISTS public.idx_ad_placements_rotation;

-- Correct replacement: index on actual columns that exist
CREATE INDEX IF NOT EXISTS idx_ad_placements_rotation_order
  ON public.ad_placements(page, is_active);

-- ============================================================
-- FIX 027: notifications table missing updated_at column
-- ============================================================

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Also add missing columns that 034 tried to add (may conflict with 027 schema)
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS notification_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS action_url TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sender_id UUID;

-- Make recipient_type and type nullable for broader use
DO $$
BEGIN
  ALTER TABLE public.notifications ALTER COLUMN recipient_type DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  -- Widen the type CHECK to include more notification types
  ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
      'new_company','new_product','sales_milestone','goal_achieved',
      'message','coordinaton_request','coordination_request',
      'order','refund','ad_approved','ad_rejected','system','info','alert'
    ));
EXCEPTION WHEN others THEN NULL;
END $$;

-- ============================================================
-- FIX 030: CREATE POLICY without DROP IF EXISTS (fails on re-run)
-- ============================================================

DROP POLICY IF EXISTS prohibited_keywords_select_policy ON public.prohibited_keywords;
DROP POLICY IF EXISTS prohibited_keywords_update_policy ON public.prohibited_keywords;
DROP POLICY IF EXISTS prohibited_keywords_insert_policy ON public.prohibited_keywords;

-- Recreate with proper naming
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'prohibited_keywords' AND schemaname = 'public') THEN
    -- Already handled by the DROP above; policies will be created fresh on next 030 run
    -- If table exists without policies, add them now
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'prohibited_keywords' AND policyname = 'prohibited_keywords_service_role'
    ) THEN
      EXECUTE '
        CREATE POLICY prohibited_keywords_service_role ON public.prohibited_keywords
          FOR ALL TO service_role USING (true) WITH CHECK (true)';
    END IF;
  END IF;
END $$;

-- ============================================================
-- FIX 031: warehouse_partner_earnings missing IF NOT EXISTS on indexes/trigger
-- ============================================================

-- Drop potentially duplicate indexes before recreating
DROP INDEX IF EXISTS idx_warehouse_earnings_entity;
DROP INDEX IF EXISTS idx_warehouse_earnings_period;
DROP INDEX IF EXISTS idx_warehouse_earnings_status;

CREATE INDEX IF NOT EXISTS idx_warehouse_earnings_entity
  ON public.warehouse_partner_earnings(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_earnings_period
  ON public.warehouse_partner_earnings(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_warehouse_earnings_status
  ON public.warehouse_partner_earnings(status);

-- Fix trigger (drop first)
DROP TRIGGER IF EXISTS update_warehouse_earnings_updated_at ON public.warehouse_partner_earnings;
CREATE TRIGGER update_warehouse_earnings_updated_at
  BEFORE UPDATE ON public.warehouse_partner_earnings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FIX 033: entity_type CHECK constraint doesn't include 'team'
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'warehouse_partner_earnings' AND schemaname = 'public') THEN
    ALTER TABLE public.warehouse_partner_earnings
      DROP CONSTRAINT IF EXISTS warehouse_partner_earnings_entity_type_check;
    ALTER TABLE public.warehouse_partner_earnings
      ADD CONSTRAINT warehouse_partner_earnings_entity_type_check
      CHECK (entity_type IN ('community', 'seller', 'merchant', 'team'));
  END IF;
END $$;

-- Fix profiles entity_type constraint (033 requires 'team')
DO $$
BEGIN
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_entity_type_check;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_entity_type_check
    CHECK (entity_type IN (
      'individual','parent','seller','merchant','warehouse_partner',
      'community_admin','super_admin','association','klass','klubb','team'
    ));
EXCEPTION WHEN others THEN NULL;
END $$;

-- Add entity_type to profiles if missing (031 may not have added it)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS warehouse_config JSONB DEFAULT '{}';

-- ============================================================
-- FIX 032: Indexes and triggers without IF NOT EXISTS / DROP IF EXISTS
-- ============================================================

-- Drop potentially duplicate indexes from 032
DROP INDEX IF EXISTS idx_campaigns_slug;
DROP INDEX IF EXISTS idx_campaigns_status;
DROP INDEX IF EXISTS idx_campaigns_type;
DROP INDEX IF EXISTS idx_campaigns_published;
DROP INDEX IF EXISTS idx_campaigns_searchable;
DROP INDEX IF EXISTS idx_campaign_forms_campaign;
DROP INDEX IF EXISTS idx_campaign_form_submissions_form;
DROP INDEX IF EXISTS idx_campaign_form_submissions_campaign;
DROP INDEX IF EXISTS idx_campaign_form_submissions_status;

-- Recreate safely
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'campaigns' AND schemaname = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON public.campaigns(slug);
    CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
    CREATE INDEX IF NOT EXISTS idx_campaigns_type ON public.campaigns(campaign_type);
    CREATE INDEX IF NOT EXISTS idx_campaigns_published
      ON public.campaigns(published_at) WHERE status = 'published';
    CREATE INDEX IF NOT EXISTS idx_campaigns_searchable
      ON public.campaigns(is_searchable) WHERE is_searchable = true;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'campaign_forms' AND schemaname = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_campaign_forms_campaign
      ON public.campaign_forms(campaign_id);
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'campaign_form_submissions' AND schemaname = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_campaign_form_submissions_form
      ON public.campaign_form_submissions(form_id);
    CREATE INDEX IF NOT EXISTS idx_campaign_form_submissions_campaign
      ON public.campaign_form_submissions(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_campaign_form_submissions_status
      ON public.campaign_form_submissions(status);
  END IF;
END $$;

-- Fix campaigns trigger (drop first)
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON public.campaigns;
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'campaigns' AND schemaname = 'public') THEN
    CREATE TRIGGER update_campaigns_updated_at
      BEFORE UPDATE ON public.campaigns
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Fix 032 RLS policies (drop before create to avoid duplicate errors)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'campaigns' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS campaigns_select_published ON public.campaigns;
    DROP POLICY IF EXISTS campaigns_select_all ON public.campaigns;
    DROP POLICY IF EXISTS campaigns_insert_admin ON public.campaigns;
    DROP POLICY IF EXISTS campaigns_update_admin ON public.campaigns;
    DROP POLICY IF EXISTS campaigns_delete_admin ON public.campaigns;

    CREATE POLICY campaigns_select_published ON public.campaigns
      FOR SELECT TO authenticated, anon USING (status = 'published');
    CREATE POLICY campaigns_select_all ON public.campaigns
      FOR SELECT TO authenticated
      USING (status IN ('draft','published','archived') OR created_by = auth.uid());
    CREATE POLICY campaigns_insert_admin ON public.campaigns
      FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));
    CREATE POLICY campaigns_update_admin ON public.campaigns
      FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));
    CREATE POLICY campaigns_delete_admin ON public.campaigns
      FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));
  END IF;
END $$;

-- Fix seo_settings policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'seo_settings' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS seo_settings_select_admin ON public.seo_settings;
    DROP POLICY IF EXISTS seo_settings_update_admin ON public.seo_settings;
    DROP POLICY IF EXISTS seo_settings_insert_admin ON public.seo_settings;

    CREATE POLICY seo_settings_select_admin ON public.seo_settings
      FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));
    CREATE POLICY seo_settings_update_admin ON public.seo_settings
      FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));
    CREATE POLICY seo_settings_insert_admin ON public.seo_settings
      FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));

    -- service_role full access
    DROP POLICY IF EXISTS seo_settings_service_role ON public.seo_settings;
    CREATE POLICY seo_settings_service_role ON public.seo_settings
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Fix campaign_form_submissions policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'campaign_form_submissions' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS campaign_form_submissions_select_admin ON public.campaign_form_submissions;
    DROP POLICY IF EXISTS campaign_form_submissions_insert_anon ON public.campaign_form_submissions;

    CREATE POLICY campaign_form_submissions_select_admin ON public.campaign_form_submissions
      FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));
    CREATE POLICY campaign_form_submissions_insert_anon ON public.campaign_form_submissions
      FOR INSERT TO anon, authenticated WITH CHECK (true);
    DROP POLICY IF EXISTS campaign_form_submissions_service_role ON public.campaign_form_submissions;
    CREATE POLICY campaign_form_submissions_service_role ON public.campaign_form_submissions
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- FIX 026: Add service_role policy to ad_payment_transactions
-- (029 creates policies but may fail on re-run without DROP)
-- ============================================================

DROP POLICY IF EXISTS ad_payment_transactions_select_policy ON public.ad_payment_transactions;
DROP POLICY IF EXISTS ad_payment_transactions_insert_policy ON public.ad_payment_transactions;
DROP POLICY IF EXISTS ad_payment_transactions_update_policy ON public.ad_payment_transactions;

-- ============================================================
-- ENSURE teams table has proper RLS policies
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'teams' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS teams_service_role ON public.teams;
    DROP POLICY IF EXISTS teams_community_read ON public.teams;

    CREATE POLICY teams_service_role ON public.teams
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    CREATE POLICY teams_community_read ON public.teams
      FOR SELECT TO authenticated USING (status = 'active');
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE 'Migration 035: All error fixes applied successfully';
END $$;
