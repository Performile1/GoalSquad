-- Comprehensive RLS policy fix for all entity tables
-- This ensures authenticated users can read their own records

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_select_own'
  ) THEN
    CREATE POLICY "profiles_select_own" ON public.profiles
      FOR SELECT TO authenticated USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'merchants' AND policyname = 'merchants_select_own'
  ) THEN
    CREATE POLICY "merchants_select_own" ON public.merchants
      FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'communities' AND policyname = 'communities_select_own'
  ) THEN
    CREATE POLICY "communities_select_own" ON public.communities
      FOR SELECT TO authenticated USING (auth.uid() = owner_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'seller_profiles' AND policyname = 'seller_profiles_select_own'
  ) THEN
    CREATE POLICY "seller_profiles_select_own" ON public.seller_profiles
      FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'warehouse_partners' AND policyname = 'warehouse_partners_select_own'
  ) THEN
    CREATE POLICY "warehouse_partners_select_own" ON public.warehouse_partners
      FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_partners ENABLE ROW LEVEL SECURITY;

-- Verify policies are active
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('profiles', 'merchants', 'communities', 'seller_profiles', 'warehouse_partners')
ORDER BY tablename, policyname;
