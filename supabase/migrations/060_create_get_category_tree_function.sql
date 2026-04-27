-- Create get_category_tree function for category hierarchy
-- This function returns a hierarchical tree of product categories

CREATE OR REPLACE FUNCTION public.get_category_tree()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  parent_id uuid,
  icon_emoji text,
  description text,
  level integer,
  path text[]
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE category_tree AS (
    -- Base case: root categories (no parent)
    SELECT 
      id,
      name,
      slug,
      parent_id,
      icon_emoji,
      description,
      0 as level,
      ARRAY[name] as path
    FROM product_categories
    WHERE parent_id IS NULL
    
    UNION ALL
    
    -- Recursive case: child categories
    SELECT 
      c.id,
      c.name,
      c.slug,
      c.parent_id,
      c.icon_emoji,
      c.description,
      ct.level + 1,
      ct.path || c.name
    FROM product_categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.id
  )
  SELECT * FROM category_tree
  ORDER BY path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_category_tree() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_category_tree() TO anon;
