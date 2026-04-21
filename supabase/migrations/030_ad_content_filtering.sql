-- Migration 030: Ad Content Filtering and Company Description
-- Features: Company description, prohibited content detection, backlink tracking

-- Add company description field to ads table
ALTER TABLE ads
  ADD COLUMN IF NOT EXISTS company_description TEXT,
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS company_website TEXT,
  ADD COLUMN IF NOT EXISTS backlink_url TEXT,
  ADD COLUMN IF NOT EXISTS backlink_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS backlink_discount_applied BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS content_flagged BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS flag_reason TEXT,
  ADD COLUMN IF NOT EXISTS url_scanned BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS url_scan_result JSONB,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create table for prohibited content keywords
CREATE TABLE IF NOT EXISTS prohibited_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('casino', 'porn', 'gambling', 'loans', 'weapons', 'drugs', 'illegal')),
  severity TEXT DEFAULT 'high' CHECK (severity IN ('low', 'medium', 'high')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default prohibited keywords
INSERT INTO prohibited_keywords (keyword, category, severity) VALUES
  -- Casino/Gambling
  ('casino', 'casino', 'high'),
  ('betting', 'gambling', 'high'),
  ('poker', 'gambling', 'high'),
  ('blackjack', 'gambling', 'high'),
  ('roulette', 'gambling', 'high'),
  ('slots', 'gambling', 'high'),
  ('spela', 'gambling', 'high'),
  ('odds', 'gambling', 'high'),
  ('sportsbook', 'gambling', 'high'),
  ('bonus', 'gambling', 'medium'),
  ('free spins', 'gambling', 'high'),
  ('no deposit', 'gambling', 'high'),
  ('welcome bonus', 'gambling', 'medium'),
  ('jackpot', 'gambling', 'medium'),
  
  -- Adult content
  ('porn', 'porn', 'high'),
  ('xxx', 'porn', 'high'),
  ('adult', 'porn', 'medium'),
  ('sex', 'porn', 'high'),
  ('nude', 'porn', 'high'),
  ('escort', 'porn', 'high'),
  ('cam', 'porn', 'high'),
  ('dating', 'porn', 'low'),
  
  -- Loans/Financial
  ('sms lån', 'loans', 'high'),
  ('snabblån', 'loans', 'high'),
  ('kredit', 'loans', 'medium'),
  ('låna pengar', 'loans', 'medium'),
  ('payday loan', 'loans', 'high'),
  ('quick loan', 'loans', 'high'),
  
  -- Weapons
  ('vapen', 'weapons', 'high'),
  ('weapon', 'weapons', 'high'),
  ('gun', 'weapons', 'high'),
  ('rifle', 'weapons', 'high'),
  ('pistol', 'weapons', 'high'),
  ('ammunition', 'weapons', 'high'),
  
  -- Drugs
  ('droger', 'drugs', 'high'),
  ('drugs', 'drugs', 'high'),
  ('cannabis', 'drugs', 'high'),
  ('marijuana', 'drugs', 'high'),
  ('cocaine', 'drugs', 'high'),
  ('heroin', 'drugs', 'high'),
  ('lsd', 'drugs', 'high'),
  ('mdma', 'drugs', 'high')
ON CONFLICT (keyword) DO NOTHING;

-- Create function to check for prohibited keywords
CREATE OR REPLACE FUNCTION check_prohibited_content(p_text TEXT)
RETURNS TABLE (keyword TEXT, category TEXT, severity TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT pk.keyword, pk.category, pk.severity
  FROM prohibited_keywords pk
  WHERE pk.is_active = TRUE
    AND (LOWER(p_text) LIKE '%' || pk.keyword || '%'
         OR p_text ~* '\y' || pk.keyword || '\y');
END;
$$ LANGUAGE plpgsql;

-- Create function to flag ad content
CREATE OR REPLACE FUNCTION flag_ad_content(p_ad_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_ad RECORD;
  v_flagged BOOLEAN := FALSE;
  v_flag_reason TEXT := '';
  v_prohibited RECORD;
BEGIN
  SELECT * INTO v_ad FROM ads WHERE id = p_ad_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check title
  FOR prohibited IN SELECT * FROM check_prohibited_content(v_ad.title) LOOP
    v_flagged := TRUE;
    v_flag_reason := v_flag_reason || 'Title contains prohibited keyword: ' || prohibited.keyword || ' (' || prohibited.category || '); ';
  END LOOP;
  
  -- Check description
  FOR prohibited IN SELECT * FROM check_prohibited_content(v_ad.description) LOOP
    v_flagged := TRUE;
    v_flag_reason := v_flag_reason || 'Description contains prohibited keyword: ' || prohibited.keyword || ' (' || prohibited.category || '); ';
  END LOOP;
  
  -- Check company description
  FOR prohibited IN SELECT * FROM check_prohibited_content(v_ad.company_description) LOOP
    v_flagged := TRUE;
    v_flag_reason := v_flag_reason || 'Company description contains prohibited keyword: ' || prohibited.keyword || ' (' || prohibited.category || '); ';
  END LOOP;
  
  -- Check link URL
  FOR prohibited IN SELECT * FROM check_prohibited_content(v_ad.link_url) LOOP
    v_flagged := TRUE;
    v_flag_reason := v_flag_reason || 'Link URL contains prohibited keyword: ' || prohibited.keyword || ' (' || prohibited.category || '); ';
  END LOOP;
  
  -- Update ad if flagged
  IF v_flagged THEN
    UPDATE ads
    SET 
      content_flagged = TRUE,
      flag_reason = v_flag_reason,
      approval_status = 'rejected',
      rejection_reason = 'Prohibited content detected: ' || v_flag_reason
    WHERE id = p_ad_id;
  END IF;
  
  RETURN v_flagged;
END;
$$ LANGUAGE plpgsql;

-- Create function to verify backlink
CREATE OR REPLACE FUNCTION verify_backlink(p_ad_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_ad RECORD;
  v_backlink_verified BOOLEAN := FALSE;
BEGIN
  SELECT * INTO v_ad FROM ads WHERE id = p_ad_id;
  
  IF NOT FOUND OR v_ad.backlink_url IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- In production, this would make an HTTP request to verify the backlink
  -- For now, we'll set it to TRUE if the backlink URL is provided
  v_backlink_verified := TRUE;
  
  UPDATE ads
  SET backlink_verified = v_backlink_verified
  WHERE id = p_ad_id;
  
  RETURN v_backlink_verified;
END;
$$ LANGUAGE plpgsql;

-- Create index for prohibited keywords
CREATE INDEX IF NOT EXISTS idx_prohibited_keywords_category ON prohibited_keywords(category);
CREATE INDEX IF NOT EXISTS idx_prohibited_keywords_active ON prohibited_keywords(is_active);
CREATE INDEX IF NOT EXISTS idx_ads_content_flagged ON ads(content_flagged);
CREATE INDEX IF NOT EXISTS idx_ads_backlink_verified ON ads(backlink_verified);

-- Update RLS policies for prohibited keywords
ALTER TABLE prohibited_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY prohibited_keywords_select_policy ON prohibited_keywords
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY prohibited_keywords_update_policy ON prohibited_keywords
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY prohibited_keywords_insert_policy ON prohibited_keywords
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Trigger for updated_at on prohibited_keywords
CREATE TRIGGER update_prohibited_keywords_updated_at
  BEFORE UPDATE ON prohibited_keywords
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DO $$
BEGIN
  RAISE NOTICE 'Ad content filtering created successfully';
END $$;
