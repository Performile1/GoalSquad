-- Add user_id to warehouse_partners to link to profiles

ALTER TABLE public.warehouse_partners
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_warehouse_partners_user ON public.warehouse_partners(user_id);
