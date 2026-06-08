/**
 * ============================================================
 * MIGRATION 100 — SELLER ACTIVE FLAG
 * ============================================================
 *
 * Admin seller endpoints (/api/admin/sellers, .../activate, .../deactivate)
 * toggle an `is_active` flag, but `seller_profiles` had no such column.
 * (The code previously targeted a non-existent `sellers` table.)
 * ============================================================
 */

ALTER TABLE public.seller_profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_seller_profiles_active
  ON public.seller_profiles(is_active);
