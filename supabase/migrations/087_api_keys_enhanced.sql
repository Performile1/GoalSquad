-- =====================================================================
-- GOALSQUAD MIGRATION: API KEYS ENHANCED
-- =====================================================================
-- Block 4: Uppdatera api_keys tabellen med säkrare struktur

BEGIN;

-- Ta bort befintlig api_keys tabell om den finns (återskapas med bättre struktur)
DROP TABLE IF EXISTS public.api_keys CASCADE;

-- ---------------------------------------------------------------------
-- 1. Externa API-nycklar (Integrationshantering)
-- ---------------------------------------------------------------------
CREATE TABLE public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    hashed_key TEXT NOT NULL UNIQUE,
    masked_key TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(hashed_key);
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON public.api_keys(status);

-- RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage api keys" ON public.api_keys;
CREATE POLICY "Admins can manage api keys" ON public.api_keys
    FOR ALL
    TO authenticated
    USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

COMMIT;

-- =====================================================================
-- NOTERINGAR
-- =====================================================================
-- Denna migration återskapar api_keys tabellen med:
-- - key_prefix för igenkänning i gränssnitt
-- - hashed_key för säker validering (SHA-256)
-- - masked_key för visning (t.ex. pk_live_************abcd)
-- - status för att kunna återkalla nycklar
