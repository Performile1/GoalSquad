-- ============================================================
-- 064_audit_otps.sql
--
-- Secure server-side store for audit-signature OTPs.
--
-- Fixes the "answer key" vulnerability where lib/audit-signature.ts returned
-- the OTP hash to the client and then trusted a client-supplied hash on verify.
-- Now the truth lives ONLY in the database: hashed OTP + TTL + attempt counter.
-- Service-role only (the server writes/reads these; clients never touch them).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_otps (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type  TEXT NOT NULL,                 -- e.g. 'approve_transfer', 'sign_contract'
  hashed_otp   TEXT NOT NULL,                 -- sha256(otp + OTP_SECRET)
  attempts     INTEGER NOT NULL DEFAULT 0,
  expires_at   TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fast lookup of the active code per (user, action) and cheap expiry sweeps.
CREATE INDEX IF NOT EXISTS idx_audit_otps_user_action ON public.audit_otps(user_id, action_type);
CREATE INDEX IF NOT EXISTS idx_audit_otps_expires ON public.audit_otps(expires_at);

-- Lock down: only the service role may access pending OTPs.
ALTER TABLE public.audit_otps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_otps_service_role" ON public.audit_otps;
CREATE POLICY "audit_otps_service_role"
  ON public.audit_otps FOR ALL TO service_role USING (true) WITH CHECK (true);
