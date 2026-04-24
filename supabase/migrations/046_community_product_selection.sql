-- Add community-product selection table

-- Communities can select specific products from merchants to promote/sell
CREATE TABLE IF NOT EXISTS public.community_selected_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'hidden', 'removed')),
  commission_percent NUMERIC(5,2) DEFAULT 12.00 CHECK (commission_percent >= 0 AND commission_percent <= 100),
  is_featured BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT community_selected_products_unique UNIQUE (community_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_community_selected_products_community ON public.community_selected_products(community_id);
CREATE INDEX IF NOT EXISTS idx_community_selected_products_product ON public.community_selected_products(product_id);
CREATE INDEX IF NOT EXISTS idx_community_selected_products_merchant ON public.community_selected_products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_community_selected_products_status ON public.community_selected_products(status);
CREATE INDEX IF NOT EXISTS idx_community_selected_products_featured ON public.community_selected_products(is_featured) WHERE is_featured = TRUE;

ALTER TABLE public.community_selected_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_selected_products_service_role" ON public.community_selected_products;
DROP POLICY IF EXISTS "community_selected_products_community_read" ON public.community_selected_products;
DROP POLICY IF EXISTS "community_selected_products_community_write" ON public.community_selected_products;

CREATE POLICY "community_selected_products_service_role" ON public.community_selected_products
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "community_selected_products_community_read" ON public.community_selected_products
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM community_members 
      WHERE community_id = community_selected_products.community_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "community_selected_products_community_write" ON public.community_selected_products
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM community_members 
      WHERE community_id = community_selected_products.community_id 
      AND user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_members 
      WHERE community_id = community_selected_products.community_id 
      AND user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_community_selected_products_updated_at ON public.community_selected_products;
CREATE TRIGGER update_community_selected_products_updated_at
  BEFORE UPDATE ON public.community_selected_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add view for community selected products with full details
CREATE OR REPLACE VIEW public.community_products_view AS
SELECT 
  csp.id,
  csp.community_id,
  c.name as community_name,
  csp.product_id,
  p.name as product_name,
  p.title as product_title,
  p.description as product_description,
  p.price as product_price,
  p.image_urls,
  csp.merchant_id,
  m.business_name as merchant_name,
  m.company_description,
  csp.status,
  csp.commission_percent,
  csp.is_featured,
  csp.priority,
  csp.notes,
  csp.metadata,
  csp.created_at,
  csp.updated_at
FROM community_selected_products csp
JOIN communities c ON csp.community_id = c.id
JOIN products p ON csp.product_id = p.id
JOIN merchants m ON csp.merchant_id = m.id;

-- Verify the new table
SELECT 
  'community_selected_products' as table_name,
  COUNT(*) as row_count
FROM community_selected_products;
