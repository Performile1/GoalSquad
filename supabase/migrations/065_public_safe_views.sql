-- 065_public_safe_views.sql
-- SECURITY FIX (Critical): the "Public read for build" RLS policies used
-- USING (true) for the anon role, which exposed EVERY column of these tables
-- to anyone holding the public anon key — including merchant bank details
-- (bank_account, iban, bic), org/VAT numbers, and contact PII.
--
-- All genuinely public pages read these tables through service-role API
-- routes (/api/merchants/showcase, /api/communities/featured,
-- /api/communities/[id]/merchants, /api/leaderboard), which bypass RLS and do
-- NOT rely on this anon policy. We therefore drop the blanket anon policies and
-- expose only non-sensitive columns through dedicated public views.

BEGIN;

-- 1) Remove the over-permissive anon read policies.
DROP POLICY IF EXISTS "Public read for build" ON public.merchants;
DROP POLICY IF EXISTS "Public read for build" ON public.communities;
DROP POLICY IF EXISTS "Public read for build" ON public.warehouse_inventory;

-- 2) Safe public view of merchants — branding/location only, NO financial/PII.
--    Excludes: bank_account, bank_clearing, bank_name, iban, bic, org_number,
--    vat_number, company_registration, contact_person, email, phone,
--    contact_email, contact_phone, stripe_account_id, annual_revenue,
--    settings, metadata, address*, postal_code, organization_id.
CREATE OR REPLACE VIEW public.public_merchants AS
SELECT
  id,
  user_id,
  name,
  merchant_name,
  business_name,
  description,
  logo_url,
  logo_square_url,
  logo_horizontal_url,
  primary_color,
  secondary_color,
  brand_colors,
  slug,
  city,
  country,
  website,
  website_url,
  founded_year,
  employee_count,
  is_active,
  is_verified,
  created_at
FROM public.merchants;

-- 3) Safe public view of communities — branding/location/aggregate only.
--    Excludes: contact_email, contact_phone, owner_id, address*, postal_code,
--    org_number, organization_id, warehouse_config.
CREATE OR REPLACE VIEW public.public_communities AS
SELECT
  id,
  name,
  description,
  type,
  community_type,
  logo_url,
  logo_square_url,
  logo_horizontal_url,
  logo_banner_url,
  logo_icon_url,
  primary_color,
  secondary_color,
  brand_colors,
  slug,
  city,
  country,
  website,
  status,
  is_active,
  show_on_homepage,
  total_sales,
  total_members,
  member_count,
  founded_year,
  created_at
FROM public.communities;

-- 4) Lock down access and grant read only on the safe views.
--    Views run with the owner's privileges (security_invoker = off, the
--    Postgres 15 default), so they intentionally surface the safe columns
--    while the base tables stay protected by their own RLS.
REVOKE ALL ON public.public_merchants FROM PUBLIC;
REVOKE ALL ON public.public_communities FROM PUBLIC;
GRANT SELECT ON public.public_merchants TO anon, authenticated;
GRANT SELECT ON public.public_communities TO anon, authenticated;

COMMIT;

-- Verification (run manually):
--   select * from pg_policies where policyname = 'Public read for build';   -- expect 0 rows on merchants/communities/warehouse_inventory
--   select table_name from information_schema.views where table_name in ('public_merchants','public_communities');
