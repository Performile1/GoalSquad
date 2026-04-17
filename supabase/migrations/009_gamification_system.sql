/**
 * ============================================
 * GOALSQUAD - GAMIFICATION SYSTEM
 * ============================================
 * 
 * This migration adds a comprehensive gamification system:
 * - Seller gamification (The Hero's Journey): XP, levels, avatar evolution, quests, loot boxes, fire mode
 * - Community gamification (The Power of the Squad): Milestones, squad tiers, badges, leaderboards
 * - Customer gamification (The Supportive Fan): Impact tracker, collector badges, referral bonuses
 * 
 * XP Curve: XP = 100 * 1.5^(n-1) for balanced progression
 * ============================================
 */

-- ============================================
-- SELLER GAMIFICATION TABLES
-- ============================================

-- Seller XP and Levels
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'seller_xp') THEN
    CREATE TABLE seller_xp (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      seller_profile_id UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
      
      -- XP and Level
      current_xp INTEGER DEFAULT 0 CHECK (current_xp >= 0),
      current_level INTEGER DEFAULT 1 CHECK (current_level >= 1),
      total_xp_earned INTEGER DEFAULT 0 CHECK (total_xp_earned >= 0),
      
      -- XP Multiplier (Fire Mode)
      multiplier_active BOOLEAN DEFAULT false,
      multiplier_value DECIMAL(3, 2) DEFAULT 1.00 CHECK (multiplier_value >= 1.00),
      multiplier_expires_at TIMESTAMP WITH TIME ZONE,
      
      -- Streaks
      daily_streak INTEGER DEFAULT 0 CHECK (daily_streak >= 0),
      longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),
      last_active_date DATE,
      
      -- Stats
      total_sales INTEGER DEFAULT 0,
      total_orders INTEGER DEFAULT 0,
      unique_customers INTEGER DEFAULT 0,
      
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      UNIQUE(seller_profile_id)
    );

    CREATE INDEX idx_seller_xp_level ON seller_xp(current_level);
    CREATE INDEX idx_seller_xp_xp ON seller_xp(current_xp);
    CREATE INDEX idx_seller_xp_multiplier ON seller_xp(multiplier_active) WHERE multiplier_active = true;

    ALTER TABLE seller_xp ENABLE ROW LEVEL SECURITY;

    CREATE TRIGGER update_seller_xp_updated_at
      BEFORE UPDATE ON seller_xp
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Seller Avatar Equipment
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'seller_avatar_equipment') THEN
    CREATE TABLE seller_avatar_equipment (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      seller_profile_id UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
      
      -- Equipment slots
      head_item_id UUID,
      body_item_id UUID,
      accessory_item_id UUID,
      background_item_id UUID,
      
      -- Unlocked items
      unlocked_items UUID[] DEFAULT '{}',
      
      -- Current skin (Golden Hoodie, etc.)
      current_skin VARCHAR(100),
      
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      UNIQUE(seller_profile_id)
    );

    ALTER TABLE seller_avatar_equipment ENABLE ROW LEVEL SECURITY;

    CREATE TRIGGER update_seller_avatar_equipment_updated_at
      BEFORE UPDATE ON seller_avatar_equipment
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Avatar Items Store
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'avatar_items') THEN
    CREATE TABLE avatar_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      
      -- Item details
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(50), -- head, body, accessory, background, skin
      rarity VARCHAR(50) DEFAULT 'common', -- common, rare, epic, legendary
      image_url TEXT,
      
      -- Unlock requirements
      required_level INTEGER DEFAULT 1,
      required_xp INTEGER DEFAULT 0,
      required_sales INTEGER DEFAULT 0,
      required_achievement_id UUID,
      
      -- Unlock status
      is_active BOOLEAN DEFAULT true,
      is_exclusive BOOLEAN DEFAULT false, -- Limited edition items
      expires_at TIMESTAMP WITH TIME ZONE,
      
      -- XP bonus
      xp_bonus INTEGER DEFAULT 0,
      
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX idx_avatar_items_category ON avatar_items(category);
    CREATE INDEX idx_avatar_items_rarity ON avatar_items(rarity);
    CREATE INDEX idx_avatar_items_active ON avatar_items(is_active) WHERE is_active = true;

    ALTER TABLE avatar_items ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Daily & Weekly Quests
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'seller_quests') THEN
    CREATE TABLE seller_quests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      
      -- Quest details
      title VARCHAR(255) NOT NULL,
      description TEXT,
      quest_type VARCHAR(50), -- daily, weekly, special
      category VARCHAR(50), -- share_link, login_streak, first_sale, etc.
      
      -- Requirements
      target_value INTEGER DEFAULT 1,
      xp_reward INTEGER DEFAULT 10,
      coin_reward INTEGER DEFAULT 0,
      item_reward_id UUID REFERENCES avatar_items(id),
      
      -- Quest status
      is_active BOOLEAN DEFAULT true,
      expires_at TIMESTAMP WITH TIME ZONE,
      
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX idx_seller_quests_type ON seller_quests(quest_type);
    CREATE INDEX idx_seller_quests_active ON seller_quests(is_active) WHERE is_active = true;

    ALTER TABLE seller_quests ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Seller Quest Progress
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'seller_quest_progress') THEN
    CREATE TABLE seller_quest_progress (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      seller_profile_id UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
      quest_id UUID NOT NULL REFERENCES seller_quests(id) ON DELETE CASCADE,
      
      -- Progress
      current_value INTEGER DEFAULT 0,
      is_completed BOOLEAN DEFAULT false,
      completed_at TIMESTAMP WITH TIME ZONE,
      
      -- Reset tracking for daily/weekly quests
      quest_date DATE DEFAULT CURRENT_DATE,
      
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      UNIQUE(seller_profile_id, quest_id, quest_date)
    );

    CREATE INDEX idx_seller_quest_progress_seller ON seller_quest_progress(seller_profile_id);
    CREATE INDEX idx_seller_quest_progress_quest ON seller_quest_progress(quest_id);
    CREATE INDEX idx_seller_quest_progress_date ON seller_quest_progress(quest_date);

    ALTER TABLE seller_quest_progress ENABLE ROW LEVEL SECURITY;

    CREATE TRIGGER update_seller_quest_progress_updated_at
      BEFORE UPDATE ON seller_quest_progress
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Loot Boxes (Milestones)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'loot_boxes') THEN
    CREATE TABLE loot_boxes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      
      -- Box details
      name VARCHAR(255) NOT NULL,
      description TEXT,
      box_type VARCHAR(50) DEFAULT 'level', -- level, achievement, special
      rarity VARCHAR(50) DEFAULT 'common',
      
      -- Unlock requirements
      required_level INTEGER,
      required_achievement_id UUID,
      
      -- Rewards
      guaranteed_items UUID[] DEFAULT '{}',
      possible_items UUID[] DEFAULT '{}',
      
      -- Box status
      is_active BOOLEAN DEFAULT true,
      is_limited BOOLEAN DEFAULT false,
      available_until TIMESTAMP WITH TIME ZONE,
      
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX idx_loot_boxes_type ON loot_boxes(box_type);
    CREATE INDEX idx_loot_boxes_active ON loot_boxes(is_active) WHERE is_active = true;

    ALTER TABLE loot_boxes ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Seller Loot Box Inventory
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'seller_loot_boxes') THEN
    CREATE TABLE seller_loot_boxes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      seller_profile_id UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
      loot_box_id UUID NOT NULL REFERENCES loot_boxes(id),
      
      -- Box status
      is_opened BOOLEAN DEFAULT false,
      opened_at TIMESTAMP WITH TIME ZONE,
      
      -- Rewards received
      received_items UUID[] DEFAULT '{}',
      
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX idx_seller_loot_boxes_seller ON seller_loot_boxes(seller_profile_id);
    CREATE INDEX idx_seller_loot_boxes_opened ON seller_loot_boxes(is_opened) WHERE is_opened = false;

    ALTER TABLE seller_loot_boxes ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================
-- COMMUNITY GAMIFICATION TABLES
-- ============================================

-- Community Milestones
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'community_milestones') THEN
    CREATE TABLE community_milestones (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
      
      -- Milestone details
      name VARCHAR(255) NOT NULL,
      description TEXT,
      milestone_type VARCHAR(50), -- revenue, sales, members, special
      
      -- Targets
      target_value INTEGER DEFAULT 0,
      current_value INTEGER DEFAULT 0,
      is_achieved BOOLEAN DEFAULT false,
      achieved_at TIMESTAMP WITH TIME ZONE,
      
      -- Rewards
      reward_description TEXT,
      
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX idx_community_milestones_community ON community_milestones(community_id);
    CREATE INDEX idx_community_milestones_achieved ON community_milestones(is_achieved);

    ALTER TABLE community_milestones ENABLE ROW LEVEL SECURITY;

    CREATE TRIGGER update_community_milestones_updated_at
      BEFORE UPDATE ON community_milestones
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Squad Tiers
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'squad_tiers') THEN
    CREATE TABLE squad_tiers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
      
      -- Tier details
      tier_name VARCHAR(100) NOT NULL, -- Bronze, Silver, Gold, Platinum, Diamond, Elite
      tier_level INTEGER NOT NULL,
      
      -- Requirements
      required_revenue DECIMAL(12, 2),
      required_sales INTEGER,
      required_members INTEGER,
      
      -- Benefits
      benefits JSONB DEFAULT '{}',
      
      -- Tier status
      achieved_at TIMESTAMP WITH TIME ZONE,
      
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      UNIQUE(community_id, tier_level)
    );

    CREATE INDEX idx_squad_tiers_community ON squad_tiers(community_id);
    CREATE INDEX idx_squad_tiers_level ON squad_tiers(tier_level);

    ALTER TABLE squad_tiers ENABLE ROW LEVEL SECURITY;

    CREATE TRIGGER update_squad_tiers_updated_at
      BEFORE UPDATE ON squad_tiers
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Community Badges
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'community_badges') THEN
    CREATE TABLE community_badges (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
      
      -- Badge details
      name VARCHAR(255) NOT NULL,
      description TEXT,
      badge_type VARCHAR(50), -- achievement, milestone, special
      icon_url TEXT,
      
      -- Award criteria
      criteria JSONB DEFAULT '{}',
      
      -- Badge status
      awarded_at TIMESTAMP WITH TIME ZONE,
      
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX idx_community_badges_community ON community_badges(community_id);
    CREATE INDEX idx_community_badges_type ON community_badges(badge_type);

    ALTER TABLE community_badges ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================
-- CUSTOMER GAMIFICATION TABLES
-- ============================================

-- Customer Support Stats
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'customer_support_stats') THEN
    CREATE TABLE customer_support_stats (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Support tracking
      total_spent DECIMAL(12, 2) DEFAULT 0,
      total_orders INTEGER DEFAULT 0,
      
      -- Support by seller
      supported_sellers JSONB DEFAULT '{}', -- Map seller_id -> amount_spent
      
      -- Support by community
      supported_communities JSONB DEFAULT '{}', -- Map community_id -> amount_spent
      
      -- XP given to sellers
      xp_given_to_sellers INTEGER DEFAULT 0,
      
      -- Collector badges
      collector_badges UUID[] DEFAULT '{}',
      
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      UNIQUE(user_id)
    );

    CREATE INDEX idx_customer_support_stats_user ON customer_support_stats(user_id);

    ALTER TABLE customer_support_stats ENABLE ROW LEVEL SECURITY;

    CREATE TRIGGER update_customer_support_stats_updated_at
      BEFORE UPDATE ON customer_support_stats
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Customer Collector Badges
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'collector_badges') THEN
    CREATE TABLE collector_badges (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      
      -- Badge details
      name VARCHAR(255) NOT NULL,
      description TEXT,
      icon_url TEXT,
      
      -- Criteria
      criteria_type VARCHAR(50), -- same_seller_multiple, same_community_multiple, total_spent
      criteria_value INTEGER DEFAULT 0,
      
      -- Badge status
      is_active BOOLEAN DEFAULT true,
      
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX idx_collector_badges_type ON collector_badges(criteria_type);
    CREATE INDEX idx_collector_badges_active ON collector_badges(is_active) WHERE is_active = true;

    ALTER TABLE collector_badges ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Referral Bonuses
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'referral_bonuses') THEN
    CREATE TABLE referral_bonuses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      
      -- Referral details
      referrer_id UUID REFERENCES auth.users(id),
      referred_id UUID REFERENCES auth.users(id),
      seller_profile_id UUID REFERENCES seller_profiles(id),
      
      -- Bonus details
      xp_bonus INTEGER DEFAULT 0,
      coin_bonus INTEGER DEFAULT 0,
      
      -- Status
      is_paid BOOLEAN DEFAULT false,
      paid_at TIMESTAMP WITH TIME ZONE,
      
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX idx_referral_bonuses_referrer ON referral_bonuses(referrer_id);
    CREATE INDEX idx_referral_bonuses_seller ON referral_bonuses(seller_profile_id);

    ALTER TABLE referral_bonuses ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Cheer Messages (Interactive Support)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'cheer_messages') THEN
    CREATE TABLE cheer_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      
      -- Message details
      order_id UUID REFERENCES orders(id),
      customer_id UUID REFERENCES auth.users(id),
      seller_profile_id UUID REFERENCES seller_profiles(id),
      
      -- Message content
      message TEXT NOT NULL,
      
      -- Display
      is_displayed BOOLEAN DEFAULT false,
      displayed_at TIMESTAMP WITH TIME ZONE,
      
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX idx_cheer_messages_seller ON cheer_messages(seller_profile_id);
    CREATE INDEX idx_cheer_messages_order ON cheer_messages(order_id);
    CREATE INDEX idx_cheer_messages_displayed ON cheer_messages(is_displayed) WHERE is_displayed = false;

    ALTER TABLE cheer_messages ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================
-- XP CALCULATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION calculate_xp_for_level(p_level INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_xp INTEGER;
BEGIN
  -- XP = 100 * 1.5^(n-1)
  v_xp := FLOOR(100 * POWER(1.5, p_level - 1));
  RETURN v_xp;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION TO ADD XP TO SELLER
-- ============================================

CREATE OR REPLACE FUNCTION add_seller_xp(
  p_seller_profile_id UUID,
  p_xp_to_add INTEGER,
  p_multiplier DECIMAL DEFAULT 1.0
)
RETURNS RECORD AS $$
DECLARE
  v_seller_xp RECORD;
  v_current_xp INTEGER;
  v_required_xp INTEGER;
  v_new_level INTEGER;
  v_level_up BOOLEAN;
BEGIN
  -- Get current seller XP
  SELECT * INTO v_seller_xp
  FROM seller_xp
  WHERE seller_profile_id = p_seller_profile_id;
  
  IF NOT FOUND THEN
    -- Create new record
    INSERT INTO seller_xp (seller_profile_id, current_xp, current_level)
    VALUES (p_seller_profile_id, 0, 1)
    RETURNING * INTO v_seller_xp;
  END IF;
  
  -- Apply multiplier
  p_xp_to_add := FLOOR(p_xp_to_add * p_multiplier);
  
  -- Add XP
  v_current_xp := v_seller_xp.current_xp + p_xp_to_add;
  v_new_level := v_seller_xp.current_level;
  v_level_up := false;
  
  -- Check for level up
  LOOP
    v_required_xp := calculate_xp_for_level(v_new_level);
    EXIT WHEN v_current_xp < v_required_xp;
    
    v_current_xp := v_current_xp - v_required_xp;
    v_new_level := v_new_level + 1;
    v_level_up := true;
  END LOOP;
  
  -- Update seller XP
  UPDATE seller_xp
  SET 
    current_xp = v_current_xp,
    current_level = v_new_level,
    total_xp_earned = total_xp_earned + p_xp_to_add,
    updated_at = NOW()
  WHERE seller_profile_id = p_seller_profile_id
  RETURNING * INTO v_seller_xp;
  
  -- Award loot box on level up
  IF v_level_up THEN
    -- Check if there's a loot box for this level
    INSERT INTO seller_loot_boxes (seller_profile_id, loot_box_id)
    SELECT p_seller_profile_id, id
    FROM loot_boxes
    WHERE required_level = v_new_level AND is_active = true
    LIMIT 1;
  END IF;
  
  RETURN v_seller_xp;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION TO ACTIVATE FIRE MODE
-- ============================================

CREATE OR REPLACE FUNCTION activate_fire_mode(p_seller_profile_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_seller_xp RECORD;
BEGIN
  -- Activate fire mode for 1 hour
  UPDATE seller_xp
  SET 
    multiplier_active = true,
    multiplier_value = 2.0,
    multiplier_expires_at = NOW() + INTERVAL '1 hour'
  WHERE seller_profile_id = p_seller_profile_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION TO CHECK FIRE MODE
-- ============================================

CREATE OR REPLACE FUNCTION check_fire_mode()
RETURNS VOID AS $$
BEGIN
  -- Deactivate expired fire modes
  UPDATE seller_xp
  SET 
    multiplier_active = false,
    multiplier_value = 1.0,
    multiplier_expires_at = NULL
  WHERE multiplier_active = true
    AND multiplier_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
