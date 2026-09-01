-- =====================================================================
-- GOALSQUAD MIGRATION: ADMIN PERMISSIONS & PLATFORM SETTINGS
-- =====================================================================
-- Block 1 & 4: Rättigheter, Roller och Plattformsinställningar

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Plattformens globala inställningar
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'platform_settings' AND policyname = 'admins_view_platform_settings'
  ) THEN
    CREATE POLICY "admins_view_platform_settings" ON public.platform_settings
      FOR SELECT TO authenticated
      USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'platform_settings' AND policyname = 'admins_update_platform_settings'
  ) THEN
    CREATE POLICY "admins_update_platform_settings" ON public.platform_settings
      FOR UPDATE TO authenticated
      USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
      WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'platform_settings' AND policyname = 'admins_insert_platform_settings'
  ) THEN
    CREATE POLICY "admins_insert_platform_settings" ON public.platform_settings
      FOR INSERT TO authenticated
      WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 2. Granulära rättigheter
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- t.ex. 'reports:generate', 'inventory:adjust'
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---------------------------------------------------------------------
-- 3. Kopplingstabell: Profiler till specifika extra-rättigheter
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profile_permissions (
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (profile_id, permission_id)
);

-- Indexering för snabba behörighetskontroller
CREATE INDEX IF NOT EXISTS idx_profile_permissions_user ON public.profile_permissions(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_permissions_permission ON public.profile_permissions(permission_id);

-- RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_permissions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'permissions' AND policyname = 'authenticated_view_permissions'
  ) THEN
    CREATE POLICY "authenticated_view_permissions" ON public.permissions
      FOR SELECT TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profile_permissions' AND policyname = 'admins_view_all_profile_permissions'
  ) THEN
    CREATE POLICY "admins_view_all_profile_permissions" ON public.profile_permissions
      FOR SELECT TO authenticated
      USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profile_permissions' AND policyname = 'users_view_own_permissions'
  ) THEN
    CREATE POLICY "users_view_own_permissions" ON public.profile_permissions
      FOR SELECT TO authenticated USING (profile_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profile_permissions' AND policyname = 'admins_manage_profile_permissions'
  ) THEN
    CREATE POLICY "admins_manage_profile_permissions" ON public.profile_permissions
      FOR ALL TO authenticated
      USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
      WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 4. Populera standardrättigheter
-- ---------------------------------------------------------------------
INSERT INTO public.permissions (code, name, description) VALUES
    ('reports:generate', 'Skapa Rapporter', 'Rättighet att generera och ladda ner ekonomiska rapporter och plocklistor'),
    ('inventory:adjust', 'Inventera Lager', 'Tillåter manuella ändringar av lagersaldon och justering av hyllplatser'),
    ('backups:execute', 'Hantera Säkerhetskopior', 'Rättighet att initiera systembackups och ladda ner systemdumps'),
    ('apikeys:manage', 'Administrera API-nycklar', 'Skapa, rotera eller spärra integrationsnycklar till externa system'),
    ('users:modify', 'Modifiera Användare', 'Ändra användarprofiler och behörigheter'),
    ('orders:modify', 'Modifiera Ordrar', 'Ändra orderstatus och orderdata'),
    ('returns:approve', 'Godkänna Returer', 'Godkänna eller avvisa returförfrågningar'),
    ('campaigns:manage', 'Hantera Kampanjer', 'Skapa och redigera säljkampanjer')
ON CONFLICT (code) DO NOTHING;

COMMIT;

-- =====================================================================
-- NOTERINGAR
-- =====================================================================
-- Denna migration lägger till:
-- 1. platform_settings - globala systeminställningar (key-value)
-- 2. permissions - granulära rättighetskoder
-- 3. profile_permissions - koppling mellan profiler och rättigheter
--
-- Standardrättigheter populeras automatiskt för reports, inventory, backups, apikeys, users, orders, returns och campaigns.
