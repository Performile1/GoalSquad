-- Migration 032: Campaigns and SEO System
-- Features: Campaign pages with blog posts, forms, images, SEO settings, image SEO tags

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  
  -- Content
  content JSONB DEFAULT '{}', -- Rich text content, sections, etc.
  
  -- Campaign type
  campaign_type VARCHAR(50) DEFAULT 'campaign' CHECK (campaign_type IN ('campaign', 'blog', 'landing_page', 'promotion')),
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'deleted')),
  
  -- SEO
  seo_title VARCHAR(255),
  seo_description TEXT,
  seo_keywords TEXT[],
  canonical_url TEXT,
  og_image_url TEXT,
  og_title VARCHAR(255),
  og_description TEXT,
  
  -- Display settings
  featured_image_url TEXT,
  featured_image_alt TEXT,
  featured_image_seo_tags JSONB DEFAULT '{}',
  
  -- Visibility
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_searchable BOOLEAN DEFAULT true,
  
  -- Author
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_campaigns_slug ON campaigns(slug);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_type ON campaigns(campaign_type);
CREATE INDEX idx_campaigns_published ON campaigns(published_at) WHERE status = 'published';
CREATE INDEX idx_campaigns_searchable ON campaigns(is_searchable) WHERE is_searchable = true;

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- RLS policies for campaigns
CREATE POLICY campaigns_select_published ON campaigns
  FOR SELECT TO authenticated, anon
  USING (status = 'published');

CREATE POLICY campaigns_select_all ON campaigns
  FOR SELECT TO authenticated
  USING (
    status IN ('draft', 'published', 'archived') OR
    created_by = auth.uid()
  );

CREATE POLICY campaigns_insert_admin ON campaigns
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY campaigns_update_admin ON campaigns
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY campaigns_delete_admin ON campaigns
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique slug
CREATE OR REPLACE FUNCTION generate_campaign_slug(p_title VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  v_slug VARCHAR;
  v_counter INTEGER := 0;
BEGIN
  v_slug := lower(regexp_replace(p_title, '[^a-zA-Z0-9\s-]', '', 'g'));
  v_slug := regexp_replace(v_slug, '\s+', '-', 'g');
  v_slug := trim(v_slug, '-');
  
  WHILE EXISTS (SELECT 1 FROM campaigns WHERE slug = v_slug || CASE WHEN v_counter > 0 THEN '-' || v_counter ELSE '' END) LOOP
    v_counter := v_counter + 1;
  END LOOP;
  
  RETURN v_slug || CASE WHEN v_counter > 0 THEN '-' || v_counter ELSE '' END;
END;
$$ LANGUAGE plpgsql;

-- SEO settings table
CREATE TABLE IF NOT EXISTS seo_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Global settings
  site_title VARCHAR(255),
  site_description TEXT,
  site_keywords TEXT[],
  default_og_image TEXT,
  
  -- Social media
  facebook_url TEXT,
  twitter_handle VARCHAR(255),
  instagram_handle VARCHAR(255),
  linkedin_url TEXT,
  
  -- Analytics
  google_analytics_id VARCHAR(50),
  google_tag_manager_id VARCHAR(50),
  
  -- Verification
  google_site_verification TEXT,
  bing_site_verification TEXT,
  
  -- Robots.txt
  robots_txt_content TEXT,
  
  -- Sitemap
  sitemap_enabled BOOLEAN DEFAULT true,
  sitemap_frequency VARCHAR(20) DEFAULT 'weekly',
  
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

ALTER TABLE seo_settings ENABLE ROW LEVEL SECURITY;

-- Only admin can manage SEO settings
CREATE POLICY seo_settings_select_admin ON seo_settings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY seo_settings_update_admin ON seo_settings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY seo_settings_insert_admin ON seo_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Insert default SEO settings
INSERT INTO seo_settings (id, site_title, site_description, site_keywords)
VALUES (
  gen_random_uuid(),
  'GoalSquad - Community Commerce för föreningar och klubbar',
  'GoalSquad hjälper idrottsföreningar, skolklasser och klubbar att finansiera sin verksamhet genom smart digital försäljning.',
  ARRAY['community commerce', 'försäljning', 'föreningar', 'klubbar', 'fundraising']
) ON CONFLICT DO NOTHING;

-- Add sales_count to products table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sales_count') THEN
    ALTER TABLE products ADD COLUMN sales_count INTEGER DEFAULT 0;
    RAISE NOTICE 'Added sales_count to products';
  END IF;
END $$;

-- Add image SEO fields to products
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'image_seo_tags') THEN
    ALTER TABLE products ADD COLUMN image_seo_tags JSONB DEFAULT '{}';
    RAISE NOTICE 'Added image_seo_tags to products';
  END IF;
END $$;

-- Add image SEO fields to community_products
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_products' AND column_name = 'image_seo_tags') THEN
    ALTER TABLE community_products ADD COLUMN image_seo_tags JSONB DEFAULT '{}';
    RAISE NOTICE 'Added image_seo_tags to community_products';
  END IF;
END $$;

-- Add company description to merchants
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'company_description') THEN
    ALTER TABLE merchants ADD COLUMN company_description TEXT;
    RAISE NOTICE 'Added company_description to merchants';
  END IF;
END $$;

-- Add company slug for SEO-friendly URLs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'company_slug') THEN
    ALTER TABLE merchants ADD COLUMN company_slug VARCHAR(255) UNIQUE;
    RAISE NOTICE 'Added company_slug to merchants';
  END IF;
END $$;

-- Function to generate merchant slug
CREATE OR REPLACE FUNCTION generate_merchant_slug(p_name VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  v_slug VARCHAR;
  v_counter INTEGER := 0;
BEGIN
  v_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9\s-]', '', 'g'));
  v_slug := regexp_replace(v_slug, '\s+', '-', 'g');
  v_slug := trim(v_slug, '-');
  
  WHILE EXISTS (SELECT 1 FROM merchants WHERE company_slug = v_slug || CASE WHEN v_counter > 0 THEN '-' || v_counter ELSE '' END) LOOP
    v_counter := v_counter + 1;
  END LOOP;
  
  RETURN v_slug || CASE WHEN v_counter > 0 THEN '-' || v_counter ELSE '' END;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate merchant slug
CREATE OR REPLACE FUNCTION set_merchant_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.company_slug IS NULL OR NEW.company_slug = '' THEN
    NEW.company_slug := generate_merchant_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_merchant_slug ON merchants;
CREATE TRIGGER trigger_set_merchant_slug
  BEFORE INSERT OR UPDATE ON merchants
  FOR EACH ROW
  EXECUTE FUNCTION set_merchant_slug();

-- Campaign forms table (for collecting data via campaign pages)
CREATE TABLE IF NOT EXISTS campaign_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  
  form_name VARCHAR(255) NOT NULL,
  form_config JSONB DEFAULT '{}', -- Form fields, validation, etc.
  
  -- Form submissions
  submission_count INTEGER DEFAULT 0,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_campaign_forms_campaign ON campaign_forms(campaign_id);

ALTER TABLE campaign_forms ENABLE ROW LEVEL SECURITY;

-- Campaign form submissions table
CREATE TABLE IF NOT EXISTS campaign_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES campaign_forms(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  
  submission_data JSONB NOT NULL,
  
  -- Contact info
  submitter_name VARCHAR(255),
  submitter_email VARCHAR(255),
  submitter_phone VARCHAR(50),
  
  -- Status
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'spam')),
  
  -- Follow-up
  notes TEXT,
  followed_up_at TIMESTAMP WITH TIME ZONE,
  followed_up_by UUID REFERENCES profiles(id),
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_campaign_form_submissions_form ON campaign_form_submissions(form_id);
CREATE INDEX idx_campaign_form_submissions_campaign ON campaign_form_submissions(campaign_id);
CREATE INDEX idx_campaign_form_submissions_status ON campaign_form_submissions(status);

ALTER TABLE campaign_form_submissions ENABLE ROW LEVEL SECURITY;

-- RLS for form submissions - admin can see all
CREATE POLICY campaign_form_submissions_select_admin ON campaign_form_submissions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY campaign_form_submissions_insert_anon ON campaign_form_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DO $$
BEGIN
  RAISE NOTICE 'Campaigns and SEO migration completed';
END $$;
