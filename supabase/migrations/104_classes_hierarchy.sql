/**
 * ============================================================
 * MIGRATION 104 — CLASS HIERARCHY (club → class → seller)
 * ============================================================
 *
 * Formalises the "class" concept which was previously only an
 * unstructured profiles.metadata->>'class_id' string. A class belongs to a
 * community (club/förening). Sellers link to a class via a real FK.
 *
 * NOTE: backfill from profiles.metadata->>'class_id' is intentionally NOT
 * automated here because those legacy values are free-text and may not map
 * to class UUIDs. Run a manual, data-aware backfill after seeding classes.
 * ============================================================
 */

CREATE TABLE IF NOT EXISTS public.classes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  name         VARCHAR(255) NOT NULL,
  description  TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (community_id, name)
);

CREATE INDEX IF NOT EXISTS idx_classes_community ON public.classes(community_id);
CREATE INDEX IF NOT EXISTS idx_classes_active    ON public.classes(community_id, is_active);

-- Link sellers to a class.
ALTER TABLE public.seller_profiles
  ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_seller_profiles_class ON public.seller_profiles(class_id);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS classes_service_role ON public.classes;
CREATE POLICY classes_service_role ON public.classes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS classes_member_select ON public.classes;
CREATE POLICY classes_member_select ON public.classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = classes.community_id
        AND cm.user_id = auth.uid()
    )
  );
