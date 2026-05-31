-- 066_close_active_anon_read.sql
-- SECURITY FIX (Critical, follow-up to 065): besides "Public read for build",
-- the policies merchants_select_active / communities_select_active also grant
-- SELECT to PUBLIC (which includes the anon role) with USING (is_active = true).
-- Since every merchant/community row is active, anon could STILL read the full
-- row — including bank_account / iban / bic / org_number and contact PII.
--
-- Public listings must go through the safe views (public_merchants /
-- public_communities, created in 065) or the service-role API routes. We
-- therefore remove these blanket PUBLIC read policies. The remaining
-- *_select_own (owner-scoped) and *_service_role_all policies are kept.

BEGIN;

DROP POLICY IF EXISTS "merchants_select_active" ON public.merchants;
DROP POLICY IF EXISTS "communities_select_active" ON public.communities;

COMMIT;

-- Verification (run manually):
--   select c.relname, p.polname,
--     case when p.polroles = '{0}'::oid[] then 'PUBLIC'
--          else array_to_string(array(select rolname from pg_roles where oid = any(p.polroles)),', ') end as roles,
--     pg_get_expr(p.polqual, p.polrelid) as using_qual
--   from pg_policy p join pg_class c on c.oid=p.polrelid
--   join pg_namespace n on n.oid=c.relnamespace and n.nspname='public'
--   where c.relname in ('merchants','communities') order by c.relname, p.polname;
-- Expect only *_select_own and *_service_role_all to remain (no *_select_active).
