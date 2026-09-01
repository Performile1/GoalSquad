-- =========================================================
-- GoalSquad Safe Live Database Baseline
-- =========================================================
-- Purpose:
--   Create a safe, idempotent database baseline for an existing
--   Supabase project without dropping tables or resetting data.
--
-- Safety rules:
--   - No destructive operations
--   - No DROP TABLE / TRUNCATE / DROP DATABASE
--   - All creation is guarded with IF NOT EXISTS
--   - All constraint and policy creation is guarded
--   - Public access is intentionally minimal and safe
--
-- Run in the Supabase SQL editor or via CLI against the live DB.
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- 1. ORGANIZATIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  org_type VARCHAR(50) NOT NULL DEFAULT 'hub',
  legal_name VARCHAR(255),
  org_number VARCHAR(50),
  country VARCHAR(2) NOT NULL,
  city VARCHAR(255),
  postal_code VARCHAR(20),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  logo_url TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.organizations
  ALTER COLUMN org_type SET DEFAULT 'hub';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'active';
  END IF;
END $$;

DO $$
BEGIN
  ALTER TABLE public.organizations
    ADD CONSTRAINT organizations_org_type_check
    CHECK (org_type IN ('platform', 'merchant', 'hub', 'carrier', 'warehouse'));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.organizations
    ADD CONSTRAINT organizations_status_check
    CHECK (status IN ('pending', 'active', 'inactive', 'suspended', 'closed'));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_organizations_org_type ON public.organizations(org_type);
CREATE INDEX IF NOT EXISTS idx_organizations_country ON public.organizations(country);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(status);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'organizations' AND policyname = 'public_read_active_organizations'
  ) THEN
    CREATE POLICY "public_read_active_organizations"
      ON public.organizations FOR SELECT
      USING (status = 'active');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'organizations' AND policyname = 'service_role_full_access_organizations'
  ) THEN
    CREATE POLICY "service_role_full_access_organizations"
      ON public.organizations FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- =========================================================
-- 2. PROFILES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  avatar_url TEXT,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  language VARCHAR(10) DEFAULT 'sv',
  currency VARCHAR(3) DEFAULT 'SEK',
  timezone VARCHAR(50) DEFAULT 'Europe/Stockholm',
  metadata JSONB DEFAULT '{}',
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id) WHERE organization_id IS NOT NULL;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'users_select_own_profile'
  ) THEN
    CREATE POLICY "users_select_own_profile"
      ON public.profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'users_update_own_profile'
  ) THEN
    CREATE POLICY "users_update_own_profile"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'service_role_full_access_profiles'
  ) THEN
    CREATE POLICY "service_role_full_access_profiles"
      ON public.profiles FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- =========================================================
-- 3. COMMUNITIES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  community_type VARCHAR(50) NOT NULL DEFAULT 'association',
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  country VARCHAR(2) NOT NULL DEFAULT 'SE',
  city VARCHAR(100),
  postal_code VARCHAR(20),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  website VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'communities' AND column_name = 'community_type'
  ) THEN
    ALTER TABLE public.communities
      ADD COLUMN community_type VARCHAR(50) NOT NULL DEFAULT 'association';
  END IF;
END $$;

DO $$
BEGIN
  ALTER TABLE public.communities
    DROP CONSTRAINT IF EXISTS communities_community_type_check;

  ALTER TABLE public.communities
    ADD CONSTRAINT communities_community_type_check
    CHECK (
      community_type IN (
        'school_class',
        'sports_team',
        'youth_club',
        'scout_troop',
        'other',
        'club',
        'klass',
        'forening',
        'association',
        'school',
        'organization',
        'class'
      )
    );
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.communities
    DROP CONSTRAINT IF EXISTS communities_status_check;

  ALTER TABLE public.communities
    ADD CONSTRAINT communities_status_check
    CHECK (status IN ('pending', 'active', 'inactive', 'suspended', 'closed'));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_communities_slug ON public.communities(slug);
CREATE INDEX IF NOT EXISTS idx_communities_type ON public.communities(community_type);
CREATE INDEX IF NOT EXISTS idx_communities_org ON public.communities(organization_id);
CREATE INDEX IF NOT EXISTS idx_communities_status ON public.communities(status);

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'communities' AND policyname = 'public_select_active_communities_safe'
  ) THEN
    CREATE POLICY "public_select_active_communities_safe"
      ON public.communities FOR SELECT
      USING (status = 'active');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'communities' AND policyname = 'service_role_full_access_communities'
  ) THEN
    CREATE POLICY "service_role_full_access_communities"
      ON public.communities FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- =========================================================
-- 4. MERCHANTS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  merchant_name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(2) NOT NULL DEFAULT 'SE',
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'merchants' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.merchants ADD COLUMN status VARCHAR(50) DEFAULT 'active';
  END IF;
END $$;

DO $$
BEGIN
  ALTER TABLE public.merchants DROP CONSTRAINT IF EXISTS merchants_status_check;

  ALTER TABLE public.merchants
    ADD CONSTRAINT merchants_status_check
    CHECK (status IN ('pending', 'active', 'inactive', 'suspended', 'closed'));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_merchants_org ON public.merchants(organization_id);
CREATE INDEX IF NOT EXISTS idx_merchants_user ON public.merchants(user_id);
CREATE INDEX IF NOT EXISTS idx_merchants_slug ON public.merchants(slug);

ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'merchants' AND policyname = 'service_role_full_access_merchants'
  ) THEN
    CREATE POLICY "service_role_full_access_merchants"
      ON public.merchants FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- =========================================================
-- 5. CAMPAIGNS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  sales_goal NUMERIC(12,2),
  units_goal INTEGER,
  community_commission_percent NUMERIC(5,2) DEFAULT 20.00,
  seller_commission_percent NUMERIC(5,2) DEFAULT 10.00,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  ALTER TABLE public.campaigns
    ADD CONSTRAINT campaigns_status_check
    CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled'));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_campaigns_community ON public.campaigns(community_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'campaigns' AND policyname = 'service_role_full_access_campaigns'
  ) THEN
    CREATE POLICY "service_role_full_access_campaigns"
      ON public.campaigns FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- =========================================================
-- 6. SAFE PUBLIC VIEW
-- =========================================================
CREATE OR REPLACE VIEW public.public_communities_safe AS
SELECT
  id,
  name,
  slug,
  description,
  community_type,
  city,
  country,
  website,
  status,
  created_at
FROM public.communities
WHERE status = 'active';

ALTER VIEW public.public_communities_safe OWNER TO postgres;

-- =========================================================
-- 7. OPTIONAL: friendly helper function to keep updated_at fresh
-- =========================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'organizations_set_updated_at'
  ) THEN
    CREATE TRIGGER organizations_set_updated_at
      BEFORE UPDATE ON public.organizations
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'profiles_set_updated_at'
  ) THEN
    CREATE TRIGGER profiles_set_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'communities_set_updated_at'
  ) THEN
    CREATE TRIGGER communities_set_updated_at
      BEFORE UPDATE ON public.communities
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'merchants_set_updated_at'
  ) THEN
    CREATE TRIGGER merchants_set_updated_at
      BEFORE UPDATE ON public.merchants
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'campaigns_set_updated_at'
  ) THEN
    CREATE TRIGGER campaigns_set_updated_at
      BEFORE UPDATE ON public.campaigns
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- =========================================================
-- END
-- =========================================================
