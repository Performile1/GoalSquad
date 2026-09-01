-- Fix duplicate policies error
-- Migration: 011_fix_duplicate_policies.sql

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'discount_codes' AND table_schema = 'public') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'discount_codes' AND policyname = 'allow_authenticated_view_active_discount_codes'
    ) THEN
      CREATE POLICY "allow_authenticated_view_active_discount_codes"
        ON public.discount_codes FOR SELECT TO authenticated
        USING (is_active = true);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'discount_codes' AND policyname = 'allow_service_role_full_access_discount_codes'
    ) THEN
      CREATE POLICY "allow_service_role_full_access_discount_codes"
        ON public.discount_codes FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_auctions' AND table_schema = 'public') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'product_auctions' AND policyname = 'allow_sellers_view_their_auctions'
    ) THEN
      CREATE POLICY "allow_sellers_view_their_auctions"
        ON public.product_auctions FOR SELECT TO authenticated
        USING (seller_id = auth.uid());
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'product_auctions' AND policyname = 'allow_community_members_view_community_auctions'
    ) THEN
      CREATE POLICY "allow_community_members_view_community_auctions"
        ON public.product_auctions FOR SELECT TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.communities c
            WHERE c.id = public.product_auctions.community_id
              AND c.id IN (
                SELECT community_id FROM public.community_members WHERE user_id = auth.uid()
              )
          )
        );
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'product_auctions' AND policyname = 'allow_service_role_full_access_product_auctions'
    ) THEN
      CREATE POLICY "allow_service_role_full_access_product_auctions"
        ON public.product_auctions FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
  END IF;
END $$;
