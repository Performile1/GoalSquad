/**
 * ============================================================
 * MIGRATION 102 — community_selected_products (capture existing)
 * ============================================================
 *
 * This table is referenced by /api/communities/[id]/products but had no
 * migration (it existed in the live DB out-of-band). This migration
 * captures it in version control. Idempotent: CREATE TABLE IF NOT EXISTS
 * is a no-op where the table already exists, and the ADD COLUMNs backfill
 * any missing fields.
 * ============================================================
 */

CREATE TABLE IF NOT EXISTS public.community_selected_products (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id       UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  product_id         UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  merchant_id        UUID REFERENCES public.merchants(id) ON DELETE SET NULL,
  commission_percent NUMERIC(5,2) NOT NULL DEFAULT 12.00,
  is_featured        BOOLEAN NOT NULL DEFAULT false,
  priority           INTEGER NOT NULL DEFAULT 0,
  status             VARCHAR(50) NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active', 'inactive', 'archived')),
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Drift-safe column top-ups (no-op where they already exist).
ALTER TABLE public.community_selected_products
  ADD COLUMN IF NOT EXISTS merchant_id        UUID REFERENCES public.merchants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS commission_percent NUMERIC(5,2) NOT NULL DEFAULT 12.00,
  ADD COLUMN IF NOT EXISTS is_featured        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS priority           INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status             VARCHAR(50) NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS notes              TEXT;

CREATE INDEX IF NOT EXISTS idx_csp_community ON public.community_selected_products(community_id);
CREATE INDEX IF NOT EXISTS idx_csp_product   ON public.community_selected_products(product_id);
CREATE INDEX IF NOT EXISTS idx_csp_featured  ON public.community_selected_products(community_id, is_featured);

ALTER TABLE public.community_selected_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS csp_service_role ON public.community_selected_products;
CREATE POLICY csp_service_role ON public.community_selected_products
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS csp_member_select ON public.community_selected_products;
CREATE POLICY csp_member_select ON public.community_selected_products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_selected_products.community_id
        AND cm.user_id = auth.uid()
    )
  );
