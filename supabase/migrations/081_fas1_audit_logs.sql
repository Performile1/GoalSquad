-- =====================================================================
-- GOALSQUAD MIGRATION: FAS 1 - AUDIT LOGS ONLY
-- =====================================================================
-- Note: returns, return_items, warehouse_inventory already exist
-- This migration only adds the missing audit_logs table

BEGIN;

-- ---------------------------------------------------------------------
-- 0. TRIGGERS (Förberedelser)
-- ---------------------------------------------------------------------

-- Standardfunktion för att uppdatera updated_at-tidsstämplar
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';


-- ---------------------------------------------------------------------
-- 1. IMMUTABLE SÄKERHETSLOGG (audit_logs)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Vem gjorde det?
    action TEXT NOT NULL, -- T.ex. "ORDER_CANCELLED", "STOCK_ADJUST"
    entity_type TEXT NOT NULL, -- T.ex. "orders", "inventory"
    entity_id UUID NOT NULL, -- ID på den påverkade raden
    changes JSONB NOT NULL, -- Innehåller { before: {...}, after: {...} }
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);


-- ---------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- ---------------------------------------------------------------------

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 2.1 POLICIES FOR: audit_logs (Immutable - Endast INSERT från server/admin, endast SELECT för admin)
DROP POLICY IF EXISTS "Endast admins kan läsa audit logs" ON public.audit_logs;
CREATE POLICY "Endast admins kan läsa audit logs" ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (auth.uid() IN (
        SELECT id FROM public.profiles 
        WHERE role = 'admin' OR detailed_role = 'platform_admin'
    ));

DROP POLICY IF EXISTS "Server/Admin kan skriva audit logs" ON public.audit_logs;
CREATE POLICY "Server/Admin kan skriva audit logs" ON public.audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true); -- Tillåter backend (via supabaseAdmin eller autentiserade anrop) att logga

-- Ingen UPDATE eller DELETE policy gör tabellen immutable

COMMIT;

-- =====================================================================
-- VERIFICATION
-- =====================================================================
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'audit_logs'
ORDER BY ordinal_position;
