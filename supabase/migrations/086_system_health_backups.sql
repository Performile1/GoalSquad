-- =====================================================================
-- GOALSQUAD MIGRATION: SYSTEM HEALTH & BACKUP LOGS
-- =====================================================================
-- Block 3: Systemhälsa och Backup-loggar

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Systemmätetal (Telemetri och hälsa)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
    latency_ms INT NOT NULL,
    error_rate_pct NUMERIC(5, 2) DEFAULT 0.00,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_metrics_service_time ON public.system_metrics(service_name, recorded_at DESC);

-- ---------------------------------------------------------------------
-- 2. Backuplogg (Historik över databas-dumps)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.backup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_name TEXT NOT NULL,
    size_mb NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
    storage_path TEXT,
    error_message TEXT,
    initiated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_backup_logs_created_at ON public.backup_logs(created_at DESC);

-- RLS
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage system metrics" ON public.system_metrics;
CREATE POLICY "Admins can manage system metrics" ON public.system_metrics
    FOR ALL
    TO authenticated
    USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Admins can manage backup logs" ON public.backup_logs;
CREATE POLICY "Admins can manage backup logs" ON public.backup_logs
    FOR ALL
    TO authenticated
    USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

COMMIT;

-- =====================================================================
-- NOTERINGAR
-- =====================================================================
-- Denna migration lägger till:
-- 1. system_metrics - telemetri för systemkomponenter
-- 2. backup_logs - historik över databas-backups
--
-- Strikt RLS: Endast admins har tillgång till dessa tabeller.
