-- Add missing contact and organisation fields to communities table

DO $$
BEGIN
  -- Owner/admin user
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'owner_id') THEN
    ALTER TABLE communities ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- Contact info
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'contact_email') THEN
    ALTER TABLE communities ADD COLUMN contact_email VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'contact_phone') THEN
    ALTER TABLE communities ADD COLUMN contact_phone VARCHAR(50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'website') THEN
    ALTER TABLE communities ADD COLUMN website VARCHAR(255);
  END IF;

  -- Address
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'address_line1') THEN
    ALTER TABLE communities ADD COLUMN address_line1 VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'address_line2') THEN
    ALTER TABLE communities ADD COLUMN address_line2 VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'city') THEN
    ALTER TABLE communities ADD COLUMN city VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'postal_code') THEN
    ALTER TABLE communities ADD COLUMN postal_code VARCHAR(20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'country') THEN
    ALTER TABLE communities ADD COLUMN country VARCHAR(2) DEFAULT 'SE';
  END IF;

  -- Organisation
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'org_number') THEN
    ALTER TABLE communities ADD COLUMN org_number VARCHAR(20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'founded_year') THEN
    ALTER TABLE communities ADD COLUMN founded_year INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'member_count') THEN
    ALTER TABLE communities ADD COLUMN member_count INTEGER DEFAULT 0;
  END IF;

  -- profiles: add postal_code if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'postal_code') THEN
    ALTER TABLE profiles ADD COLUMN postal_code VARCHAR(20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'city') THEN
    ALTER TABLE profiles ADD COLUMN city VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'address_line1') THEN
    ALTER TABLE profiles ADD COLUMN address_line1 VARCHAR(255);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_communities_owner ON communities(owner_id);
CREATE INDEX IF NOT EXISTS idx_communities_postal ON communities(postal_code);

-- Verify result
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'communities'
ORDER BY ordinal_position;
