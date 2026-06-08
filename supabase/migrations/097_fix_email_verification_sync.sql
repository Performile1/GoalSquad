/**
 * ============================================================
 * MIGRATION 097 — FIX EMAIL VERIFICATION SYNC
 * ============================================================
 *
 * Root cause: `handle_new_user()` only runs on INSERT into auth.users
 * (at signup, when email_confirmed_at is still NULL → is_verified=false).
 * When the user later confirms their email, auth.users is UPDATED but no
 * trigger syncs profiles.is_verified, so accounts stay "ej verifierad"
 * forever.
 *
 * This migration:
 *   1. Adds an AFTER UPDATE trigger on auth.users that syncs
 *      profiles.is_verified when email_confirmed_at transitions to set.
 *   2. Backfills existing profiles whose email is already confirmed.
 *
 * NOTE: `is_verified` here means "email confirmed". Business-level
 * approval of merchants/warehouses should be tracked separately via the
 * entity tables (merchants.verification_status, warehouses status) and an
 * admin approval flow — do not conflate the two.
 * ============================================================
 */

-- 1. Function to sync verification status on email confirmation.
CREATE OR REPLACE FUNCTION public.sync_email_verification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND (OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at) THEN
    UPDATE public.profiles
    SET is_verified = true
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger on auth.users UPDATE.
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_email_verification();

-- 3. Backfill: mark profiles verified where the email is already confirmed.
UPDATE public.profiles p
SET is_verified = true
FROM auth.users u
WHERE p.id = u.id
  AND u.email_confirmed_at IS NOT NULL
  AND p.is_verified = false;
