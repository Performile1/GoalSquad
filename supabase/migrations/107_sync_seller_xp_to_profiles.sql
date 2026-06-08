-- ============================================================
-- MIGRATION 107 — Sync seller_xp to seller_profiles (Fas 4)
-- ============================================================
--
-- Goal: eliminate duplication between seller_profiles (cached)
-- and seller_xp (canonical). The trigger keeps
-- seller_profiles.xp_total + current_level in sync with
-- seller_xp.total_xp_earned + current_level after every
-- insert or update on seller_xp.
-- ============================================================

-- ----------------------------------------------------------------
-- 1. Ensure columns exist on seller_profiles (defensive)
-- ----------------------------------------------------------------
ALTER TABLE public.seller_profiles
  ADD COLUMN IF NOT EXISTS xp_total INTEGER DEFAULT 0;

ALTER TABLE public.seller_profiles
  ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1;

-- ----------------------------------------------------------------
-- 2. Backfill from existing seller_xp rows
-- ----------------------------------------------------------------
UPDATE public.seller_profiles sp
SET
  xp_total = COALESCE(sx.total_xp_earned, 0),
  current_level = COALESCE(sx.current_level, 1)
FROM public.seller_xp sx
WHERE sx.seller_profile_id = sp.id;

-- ----------------------------------------------------------------
-- 3. Sync function + trigger
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_seller_xp_to_profiles()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.seller_profiles
  SET
    xp_total = COALESCE(NEW.total_xp_earned, 0),
    current_level = COALESCE(NEW.current_level, 1)
  WHERE id = NEW.seller_profile_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_seller_xp_to_profiles ON public.seller_xp;
CREATE TRIGGER trg_sync_seller_xp_to_profiles
  AFTER INSERT OR UPDATE ON public.seller_xp
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_seller_xp_to_profiles();
