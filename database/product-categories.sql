/**
 * Product Categories & Search
 * 
 * Hierarchical category system for products
 * Full-text search indexes
 */

-- Create categories table
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES product_categories(id),
  icon_emoji TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add category to products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id),
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create indexes for search
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON product_categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON product_categories(parent_id);

-- Full-text search trigger
CREATE OR REPLACE FUNCTION products_search_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('swedish', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('swedish', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('swedish', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_search_update ON products;
CREATE TRIGGER products_search_update
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION products_search_trigger();

-- Insert default categories
INSERT INTO product_categories (name, slug, icon_emoji, display_order) VALUES
  ('Choklad & Godis', 'choklad-godis', '🍫', 1),
  ('Hälsoprodukter', 'halsa', '💊', 2),
  ('Hushåll', 'hushall', '🏠', 3),
  ('Presenter & Gåvor', 'presenter', '🎁', 4),
  ('Sport & Fritid', 'sport', '⚽', 5),
  ('Skola & Kontor', 'skola', '📚', 6),
  ('Mat & Dryck', 'mat-dryck', '🍽️', 7),
  ('Trädgård', 'tradgard', '🌱', 8),
  ('Övrigt', 'ovrigt', '📦', 99)
ON CONFLICT (slug) DO NOTHING;

-- Function to get category tree
CREATE OR REPLACE FUNCTION get_category_tree()
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  icon_emoji TEXT,
  parent_id UUID,
  product_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.slug,
    c.icon_emoji,
    c.parent_id,
    COUNT(p.id) as product_count
  FROM product_categories c
  LEFT JOIN products p ON p.category_id = c.id AND p.status = 'active'
  WHERE c.is_active = true
  GROUP BY c.id, c.name, c.slug, c.icon_emoji, c.parent_id, c.display_order
  ORDER BY c.display_order, c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for advanced search
CREATE OR REPLACE FUNCTION search_all(
  search_query TEXT,
  search_type TEXT DEFAULT 'all', -- 'all', 'sellers', 'communities', 'products'
  result_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  name TEXT,
  description TEXT,
  image_url TEXT,
  metadata JSONB,
  rank REAL
) AS $$
BEGIN
  IF search_type IN ('all', 'sellers') THEN
    RETURN QUERY
    SELECT 
      p.id,
      'seller'::TEXT as type,
      p.full_name as name,
      CONCAT('Level ', sp.current_level, ' Seller') as description,
      p.avatar_url as image_url,
      jsonb_build_object(
        'communityName', c.name,
        'totalSales', sp.total_sales,
        'level', sp.current_level
      ) as metadata,
      ts_rank(
        to_tsvector('swedish', p.full_name),
        plainto_tsquery('swedish', search_query)
      ) as rank
    FROM profiles p
    JOIN seller_profiles sp ON sp.user_id = p.id
    LEFT JOIN communities c ON c.id = sp.community_id
    WHERE p.role = 'seller'
      AND to_tsvector('swedish', p.full_name) @@ plainto_tsquery('swedish', search_query)
    ORDER BY rank DESC
    LIMIT result_limit;
  END IF;

  IF search_type IN ('all', 'communities') THEN
    RETURN QUERY
    SELECT 
      c.id,
      'community'::TEXT as type,
      c.name,
      CONCAT(c.community_type, ' i ', c.city) as description,
      c.logo_url as image_url,
      jsonb_build_object(
        'city', c.city,
        'country', c.country,
        'totalMembers', c.total_members,
        'totalSales', c.total_sales
      ) as metadata,
      ts_rank(
        to_tsvector('swedish', c.name || ' ' || c.city),
        plainto_tsquery('swedish', search_query)
      ) as rank
    FROM communities c
    WHERE to_tsvector('swedish', c.name || ' ' || c.city) @@ plainto_tsquery('swedish', search_query)
    ORDER BY rank DESC
    LIMIT result_limit;
  END IF;

  IF search_type IN ('all', 'products') THEN
    RETURN QUERY
    SELECT 
      p.id,
      'product'::TEXT as type,
      p.name,
      p.description,
      p.image_url,
      jsonb_build_object(
        'price', p.price,
        'merchantName', m.name,
        'categoryId', p.category_id,
        'stock', p.stock_quantity
      ) as metadata,
      ts_rank(p.search_vector, plainto_tsquery('swedish', search_query)) as rank
    FROM products p
    LEFT JOIN merchants m ON m.id = p.merchant_id
    WHERE p.status = 'active'
      AND p.search_vector @@ plainto_tsquery('swedish', search_query)
    ORDER BY rank DESC
    LIMIT result_limit;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_category_tree() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION search_all(TEXT, TEXT, INTEGER) TO authenticated, anon;

COMMENT ON TABLE product_categories IS 'Hierarchical product category system';
COMMENT ON FUNCTION search_all IS 'Unified search across sellers, communities, and products';
