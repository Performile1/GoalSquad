-- =====================================================================
-- GOALSQUAD MIGRATION: ANALYTICS SNAPSHOTS & REPORTS
-- =====================================================================
-- Block 2: Analyscache och Rapportgenerering

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Analyscache / Snapshots för Grupper och Säljare
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.group_members(id) ON DELETE CASCADE,
    total_orders_count INT DEFAULT 0,
    total_items_sold INT DEFAULT 0,
    gross_sales_amount NUMERIC(10, 2) DEFAULT 0.00,
    group_profit_amount NUMERIC(10, 2) DEFAULT 0.00,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analytics_group ON public.analytics_snapshots(group_id) WHERE member_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_member ON public.analytics_snapshots(member_id) WHERE member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_calculated_at ON public.analytics_snapshots(calculated_at DESC);

-- ---------------------------------------------------------------------
-- 2. Rapportregister (Metadata över genererade CSV/PDF-filer)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN ('batch_picking', 'financial_settlement', 'seller_performance')),
    scope_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    file_url TEXT,
    generated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_reports_scope ON public.reports(scope_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);

-- RLS
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Analytics snapshots policies
DROP POLICY IF EXISTS "Admins and leaders can view analytics" ON public.analytics_snapshots;
CREATE POLICY "Admins and leaders can view analytics" ON public.analytics_snapshots
    FOR SELECT
    TO authenticated
    USING (
        auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' 
        OR group_id IN (SELECT id FROM public.groups WHERE leader_id = auth.uid())
    );

DROP POLICY IF EXISTS "Admins can insert analytics" ON public.analytics_snapshots;
CREATE POLICY "Admins can insert analytics" ON public.analytics_snapshots
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- Reports policies
DROP POLICY IF EXISTS "Admins and creators can view reports" ON public.reports;
CREATE POLICY "Admins and creators can view reports" ON public.reports
    FOR SELECT
    TO authenticated
    USING (
        auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
        OR generated_by = auth.uid()
    );

DROP POLICY IF EXISTS "Admins can insert reports" ON public.reports;
CREATE POLICY "Admins can insert reports" ON public.reports
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
CREATE POLICY "Admins can update reports" ON public.reports
    FOR UPDATE
    TO authenticated
    USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

COMMIT;

-- =====================================================================
-- NOTERINGAR
-- =====================================================================
-- Denna migration lägger till:
-- 1. analytics_snapshots - aggregerad säljdata för snabb dashboard
-- 2. reports - metadata över genererade rapporter (CSV/PDF)
--
-- RLS policies tillåter admins och lagföräldrar att se analytics,
-- samt admins och rapportskapare att se reports.
