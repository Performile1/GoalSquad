-- Migration 036: Patch is_active column on tables that may have been
-- created without it (from partial migration runs)
-- Error: 42703: column "is_active" does not exist

DO $$
BEGIN
  -- consolidation_warehouses
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'consolidation_warehouses' AND schemaname = 'public') THEN
    ALTER TABLE public.consolidation_warehouses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
  END IF;
  -- squad_tiers
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'squad_tiers' AND schemaname = 'public') THEN
    ALTER TABLE public.squad_tiers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
  END IF;
  -- community_badges
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'community_badges' AND schemaname = 'public') THEN
    ALTER TABLE public.community_badges ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
  END IF;
  -- communities
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'communities' AND schemaname = 'public') THEN
    ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
  END IF;
  -- teams
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'teams' AND schemaname = 'public') THEN
    ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
  END IF;
  RAISE NOTICE 'Migration 036: is_active patch complete';
END $$;
