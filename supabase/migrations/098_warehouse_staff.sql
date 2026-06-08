/**
 * ============================================================
 * MIGRATION 098 — WAREHOUSE STAFF REGISTER
 * ============================================================
 *
 * Personnel register per warehouse. Lets a warehouse partner manage
 * the people who work at their hub (pickers, supervisors, admins),
 * independent of platform auth accounts.
 * ============================================================
 */

CREATE TABLE IF NOT EXISTS public.warehouse_staff (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES public.warehouse_partners(id) ON DELETE CASCADE,
  full_name    VARCHAR(255) NOT NULL,
  email        VARCHAR(255),
  phone        VARCHAR(50),
  staff_role   VARCHAR(50) NOT NULL DEFAULT 'picker'
                 CHECK (staff_role IN ('picker', 'supervisor', 'warehouse_admin', 'driver')),
  pin_code     VARCHAR(10),
  is_active    BOOLEAN NOT NULL DEFAULT true,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_warehouse_staff_warehouse
  ON public.warehouse_staff(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_staff_active
  ON public.warehouse_staff(warehouse_id, is_active);

ALTER TABLE public.warehouse_staff ENABLE ROW LEVEL SECURITY;

-- Service-role (server API) bypasses RLS; these policies allow the
-- warehouse owner to read their own staff under the anon/auth client.
DROP POLICY IF EXISTS warehouse_staff_owner_select ON public.warehouse_staff;
CREATE POLICY warehouse_staff_owner_select ON public.warehouse_staff
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.warehouse_partners wp
      WHERE wp.id = warehouse_staff.warehouse_id
        AND wp.user_id = auth.uid()
    )
  );
