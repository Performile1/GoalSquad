-- Create product_suggestions table
CREATE TABLE IF NOT EXISTS public.product_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  suggestion_type VARCHAR(50) NOT NULL CHECK (suggestion_type IN ('product_url', 'company', 'product_info', 'category')),
  product_url TEXT,
  company VARCHAR(255),
  product_info TEXT,
  category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_suggestions_user ON public.product_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_product_suggestions_status ON public.product_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_product_suggestions_type ON public.product_suggestions(suggestion_type);

ALTER TABLE public.product_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "product_suggestions_service_role" ON public.product_suggestions;
DROP POLICY IF EXISTS "product_suggestions_user_read_own" ON public.product_suggestions;
DROP POLICY IF EXISTS "product_suggestions_user_insert_own" ON public.product_suggestions;

CREATE POLICY "product_suggestions_service_role"
  ON public.product_suggestions FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "product_suggestions_user_insert_own"
  ON public.product_suggestions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "product_suggestions_user_read_own"
  ON public.product_suggestions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
