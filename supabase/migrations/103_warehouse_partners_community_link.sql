/**
 * ============================================================
 * MIGRATION 103 — warehouse_partners community/owner link
 * ============================================================
 *
 * Consolidates the warehouse model onto warehouse_partners (canonical).
 * The checkout flow previously read a phantom `warehouses.community_id`;
 * this adds the column to warehouse_partners so the code can point at the
 * real table. `user_id` is ensured defensively (added earlier in 031/033
 * but kept idempotent here).
 * ============================================================
 */

ALTER TABLE public.warehouse_partners
  ADD COLUMN IF NOT EXISTS user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_warehouse_partners_community
  ON public.warehouse_partners(community_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_partners_user
  ON public.warehouse_partners(user_id);
