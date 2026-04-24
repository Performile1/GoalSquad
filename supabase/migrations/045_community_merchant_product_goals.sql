-- Add community-merchant relationships and product-specific goals

-- 1. Community-Merchant Relationships
CREATE TABLE IF NOT EXISTS public.community_merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
  commission_percent NUMERIC(5,2) DEFAULT 12.00 CHECK (commission_percent >= 0 AND commission_percent <= 100),
  terms_accepted BOOLEAN DEFAULT false,
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT community_merchants_unique UNIQUE (community_id, merchant_id)
);

CREATE INDEX IF NOT EXISTS idx_community_merchants_community ON public.community_merchants(community_id);
CREATE INDEX IF NOT EXISTS idx_community_merchants_merchant ON public.community_merchants(merchant_id);
CREATE INDEX IF NOT EXISTS idx_community_merchants_status ON public.community_merchants(status);

ALTER TABLE public.community_merchants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_merchants_service_role" ON public.community_merchants;
DROP POLICY IF EXISTS "community_merchants_community_read" ON public.community_merchants;
DROP POLICY IF EXISTS "community_merchants_merchant_read" ON public.community_merchants;

CREATE POLICY "community_merchants_service_role" ON public.community_merchants
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "community_merchants_community_read" ON public.community_merchants
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM community_members 
      WHERE community_id = community_merchants.community_id 
      AND user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "community_merchants_merchant_read" ON public.community_merchants
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM merchants 
      WHERE id = community_merchants.merchant_id 
      AND user_id = auth.uid()
    )
  );

-- 2. Add product_id to entity_goals for product-specific goals
ALTER TABLE public.entity_goals
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS period VARCHAR(50) DEFAULT 'monthly' CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'));

CREATE INDEX IF NOT EXISTS idx_entity_goals_product ON public.entity_goals(product_id);
CREATE INDEX IF NOT EXISTS idx_entity_goals_period ON public.entity_goals(period);

-- 3. Consumer product preferences (for nearest community earnings)
CREATE TABLE IF NOT EXISTS public.consumer_product_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  preferred_community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT consumer_product_preferences_unique UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_consumer_product_preferences_user ON public.consumer_product_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_consumer_product_preferences_product ON public.consumer_product_preferences(product_id);
CREATE INDEX IF NOT EXISTS idx_consumer_product_preferences_community ON public.consumer_product_preferences(preferred_community_id);

ALTER TABLE public.consumer_product_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consumer_product_preferences_service_role" ON public.consumer_product_preferences;
DROP POLICY IF EXISTS "consumer_product_preferences_own" ON public.consumer_product_preferences;

CREATE POLICY "consumer_product_preferences_service_role" ON public.consumer_product_preferences
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "consumer_product_preferences_own" ON public.consumer_product_preferences
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Add trigger for updated_at on new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_community_merchants_updated_at ON public.community_merchants;
CREATE TRIGGER update_community_merchants_updated_at
  BEFORE UPDATE ON public.community_merchants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_consumer_product_preferences_updated_at ON public.consumer_product_preferences;
CREATE TRIGGER update_consumer_product_preferences_updated_at
  BEFORE UPDATE ON public.consumer_product_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Add view for community selected merchants
CREATE OR REPLACE VIEW public.community_selected_merchants AS
SELECT 
  cm.id,
  cm.community_id,
  c.name as community_name,
  cm.merchant_id,
  m.business_name as merchant_name,
  m.company_description,
  cm.status,
  cm.commission_percent,
  cm.terms_accepted,
  cm.terms_accepted_at,
  cm.notes,
  cm.created_at,
  cm.updated_at
FROM community_merchants cm
JOIN communities c ON cm.community_id = c.id
JOIN merchants m ON cm.merchant_id = m.id;

-- 6. Add view for community product goals
CREATE OR REPLACE VIEW public.community_product_goals AS
SELECT 
  eg.id,
  eg.entity_id as community_id,
  eg.entity_type,
  eg.goal_type,
  eg.goal_title as title,
  eg.description,
  eg.product_id,
  p.name as product_name,
  p.title as product_title,
  eg.target_value,
  eg.current_value,
  eg.unit,
  eg.period,
  eg.status,
  eg.start_date,
  eg.end_date,
  COALESCE(eg.metadata, '{}'::jsonb) as metadata,
  eg.created_at,
  eg.updated_at
FROM entity_goals eg
LEFT JOIN products p ON eg.product_id = p.id
WHERE eg.entity_type = 'community'
  AND eg.product_id IS NOT NULL;

-- Verify the new tables
SELECT 
  'community_merchants' as table_name,
  COUNT(*) as row_count
FROM community_merchants
UNION ALL
SELECT 
  'consumer_product_preferences' as table_name,
  COUNT(*) as row_count
FROM consumer_product_preferences;
