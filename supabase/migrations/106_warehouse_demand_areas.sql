-- Aggregated, non-customer warehouse demand used by the admin map.
CREATE TABLE IF NOT EXISTS public.warehouse_demand_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  latitude NUMERIC(9, 6) NOT NULL,
  longitude NUMERIC(9, 6) NOT NULL,
  order_count INTEGER NOT NULL DEFAULT 0 CHECK (order_count >= 0),
  radius_km NUMERIC(8, 2) NOT NULL DEFAULT 10 CHECK (radius_km > 0),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warehouse_demand_areas_orders
  ON public.warehouse_demand_areas(order_count DESC);

ALTER TABLE public.warehouse_demand_areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS warehouse_demand_areas_admin_read ON public.warehouse_demand_areas;
CREATE POLICY warehouse_demand_areas_admin_read
  ON public.warehouse_demand_areas FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gs_admin'));