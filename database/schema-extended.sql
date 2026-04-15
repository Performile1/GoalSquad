-- GoalSquad Extended Schema v2.0
-- Adds: RBAC, Communities, Gamification, Treasury, Warehouse Integration
-- Run this AFTER schema.sql

-- ============================================================================
-- ROLE-BASED ACCESS CONTROL (RBAC)
-- ============================================================================

-- User roles enum
CREATE TYPE user_role AS ENUM (
  'gs_admin',                    -- GoalSquad Global Admin
  'gs_compliance',               -- Compliance Officer
  'community_treasurer',         -- Kassör (Financial responsible)
  'community_admin',             -- Squad Leader (Campaign manager)
  'community_distributor',       -- Local logistics manager
  'seller',                      -- Youth seller
  'guardian',                    -- Parent/Legal guardian
  'merchant_admin',              -- Merchant strategic lead
  'merchant_staff',              -- Merchant warehouse staff
  'hub_admin',                   -- 3PL Hub administrator
  'hub_staff'                    -- 3PL Warehouse staff
);

-- Extended user profiles with roles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    role user_role NOT NULL,
    
    -- Guardian relationship (for sellers)
    guardian_id UUID REFERENCES profiles(id),
    
    -- Organization relationship
    organization_id UUID REFERENCES organizations(id),
    
    -- Community relationship (for sellers, admins, etc.)
    community_id UUID,  -- Will reference communities table
    
    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    avatar_url TEXT,
    bio TEXT,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role user_role NOT NULL,
    
    -- Financial permissions
    can_access_financials BOOLEAN DEFAULT FALSE,
    can_approve_payouts BOOLEAN DEFAULT FALSE,
    can_view_treasury BOOLEAN DEFAULT FALSE,
    
    -- Logistics permissions
    can_scan_logistics BOOLEAN DEFAULT FALSE,
    can_manage_shipments BOOLEAN DEFAULT FALSE,
    
    -- Product permissions
    can_manage_products BOOLEAN DEFAULT FALSE,
    can_view_products BOOLEAN DEFAULT TRUE,
    
    -- Community permissions
    can_manage_campaigns BOOLEAN DEFAULT FALSE,
    can_manage_sellers BOOLEAN DEFAULT FALSE,
    
    -- Admin permissions
    can_manage_users BOOLEAN DEFAULT FALSE,
    can_view_audit_logs BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(role)
);

-- Insert default permissions
INSERT INTO permissions (role, can_access_financials, can_approve_payouts, can_view_treasury, can_scan_logistics, can_manage_shipments, can_manage_products, can_manage_campaigns, can_manage_sellers, can_manage_users, can_view_audit_logs) VALUES
('gs_admin', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE),
('gs_compliance', TRUE, FALSE, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, TRUE),
('community_treasurer', TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE),
('community_admin', FALSE, FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, TRUE, FALSE, FALSE),
('community_distributor', FALSE, FALSE, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE),
('seller', FALSE, FALSE, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE),
('guardian', FALSE, FALSE, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE),
('merchant_admin', TRUE, FALSE, FALSE, FALSE, FALSE, TRUE, FALSE, FALSE, FALSE, FALSE),
('merchant_staff', FALSE, FALSE, FALSE, TRUE, FALSE, TRUE, FALSE, FALSE, FALSE, FALSE),
('hub_admin', TRUE, FALSE, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE),
('hub_staff', FALSE, FALSE, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE)
ON CONFLICT (role) DO NOTHING;

-- ============================================================================
-- COMMUNITIES (The Squad System)
-- ============================================================================

CREATE TABLE IF NOT EXISTS communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic info
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    
    -- Type
    community_type VARCHAR(50) CHECK (community_type IN ('school_class', 'sports_team', 'youth_club', 'scout_troop', 'other')),
    
    -- Organization link
    organization_id UUID REFERENCES organizations(id),
    
    -- Leadership
    treasurer_id UUID REFERENCES profiles(id),
    admin_id UUID REFERENCES profiles(id),
    distributor_id UUID REFERENCES profiles(id),
    
    -- Location
    country VARCHAR(2) NOT NULL,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    
    -- Treasury settings
    treasury_enabled BOOLEAN DEFAULT TRUE,
    treasury_lock_days INTEGER DEFAULT 30,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'closed')),
    
    -- Branding
    logo_url TEXT,
    banner_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#0ea5e9',
    
    -- Stats
    total_members INTEGER DEFAULT 0,
    total_sales DECIMAL(12, 2) DEFAULT 0,
    total_commission DECIMAL(12, 2) DEFAULT 0,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES communities(id);

-- Campaigns (Sales periods for communities)
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    
    -- Campaign info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Period
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Goals
    sales_goal DECIMAL(12, 2),
    units_goal INTEGER,
    
    -- Product selection
    allowed_products JSONB DEFAULT '[]', -- Array of product IDs
    
    -- Commission settings
    community_commission_percent DECIMAL(5, 2) DEFAULT 20.00,
    seller_commission_percent DECIMAL(5, 2) DEFAULT 10.00,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    
    -- Stats
    total_sales DECIMAL(12, 2) DEFAULT 0,
    total_units_sold INTEGER DEFAULT 0,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- GAMIFICATION ENGINE
-- ============================================================================

-- Seller profiles (extended gamification data)
CREATE TABLE IF NOT EXISTS seller_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    community_id UUID REFERENCES communities(id),
    
    -- Avatar system
    avatar_data JSONB DEFAULT '{
        "base": "default",
        "gear": [],
        "background": "blue",
        "unlocked_items": []
    }',
    
    -- Progression
    xp_total INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    
    -- Streaks
    streak_days INTEGER DEFAULT 0,
    last_sale_date DATE,
    
    -- Stats
    total_sales DECIMAL(12, 2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_commission DECIMAL(12, 2) DEFAULT 0,
    
    -- Personal shop
    shop_url VARCHAR(255) UNIQUE,
    shop_bio TEXT,
    shop_video_url TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Achievement info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url TEXT,
    
    -- Requirements
    requirement_type VARCHAR(50) NOT NULL CHECK (requirement_type IN (
        'total_sales',
        'total_orders',
        'consecutive_days',
        'first_sale',
        'international_sale',
        'team_goal',
        'level_reached'
    )),
    requirement_value INTEGER,
    
    -- Rewards
    reward_xp INTEGER DEFAULT 0,
    reward_item_id TEXT, -- Reference to avatar gear
    
    -- Rarity
    rarity VARCHAR(50) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    
    -- Seasonal
    is_seasonal BOOLEAN DEFAULT FALSE,
    season_start DATE,
    season_end DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements (unlocked)
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id),
    
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, achievement_id)
);

-- Avatar items (gear, backgrounds, etc.)
CREATE TABLE IF NOT EXISTS avatar_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Item info
    item_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Type
    item_type VARCHAR(50) CHECK (item_type IN ('hat', 'shirt', 'pants', 'shoes', 'accessory', 'background', 'emote')),
    
    -- Unlock requirements
    unlock_type VARCHAR(50) CHECK (unlock_type IN ('default', 'achievement', 'level', 'purchase', 'seasonal')),
    unlock_requirement INTEGER, -- Level or achievement ID
    
    -- Rarity
    rarity VARCHAR(50) DEFAULT 'common',
    
    -- Visual
    image_url TEXT,
    
    -- Seasonal
    is_seasonal BOOLEAN DEFAULT FALSE,
    season_name VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- XP events log
CREATE TABLE IF NOT EXISTS xp_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Event type
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'sale_completed',
        'daily_login',
        'shop_customized',
        'achievement_unlocked',
        'streak_bonus',
        'team_challenge'
    )),
    
    -- XP awarded
    xp_amount INTEGER NOT NULL,
    
    -- Reference
    reference_id UUID, -- Order ID, achievement ID, etc.
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leaderboards (cached for performance)
CREATE TABLE IF NOT EXISTS leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Scope
    leaderboard_type VARCHAR(50) CHECK (leaderboard_type IN ('global', 'community', 'campaign')),
    scope_id UUID, -- Community ID or Campaign ID
    
    -- Period
    period VARCHAR(50) CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
    period_start DATE,
    period_end DATE,
    
    -- Rankings (JSONB array for fast access)
    rankings JSONB DEFAULT '[]',
    
    -- Last updated
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TREASURY (30-Day Escrow System)
-- ============================================================================

CREATE TABLE IF NOT EXISTS treasury_holds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Order reference
    order_id UUID NOT NULL REFERENCES orders(id),
    transaction_id UUID NOT NULL,
    
    -- Holder
    holder_type VARCHAR(50) CHECK (holder_type IN ('merchant', 'community', 'seller')),
    holder_id UUID NOT NULL,
    
    -- Amount
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NOK',
    
    -- Hold period
    hold_until TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'held' CHECK (status IN ('held', 'released', 'disputed', 'refunded')),
    
    -- Release info
    released_at TIMESTAMP WITH TIME ZONE,
    released_to_wallet_id UUID REFERENCES wallets(id),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- WAREHOUSE INTEGRATION (3PL Representative)
-- ============================================================================

-- Warehouse partners
CREATE TABLE IF NOT EXISTS warehouse_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    
    -- Partner info
    partner_name VARCHAR(255) NOT NULL,
    partner_code VARCHAR(50) UNIQUE NOT NULL,
    
    -- Type
    hub_type VARCHAR(50) CHECK (hub_type IN ('consolidation', 'split', 'both')),
    
    -- Territory
    territory VARCHAR(2) NOT NULL, -- Country code
    
    -- Contact
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    
    -- API credentials
    api_key VARCHAR(255),
    webhook_url TEXT,
    webhook_secret VARCHAR(255),
    
    -- SLA
    sla_throughput_hours INTEGER DEFAULT 24,
    sla_accuracy_percent DECIMAL(5, 2) DEFAULT 99.8,
    
    -- Pricing
    price_per_inbound DECIMAL(10, 2),
    price_per_pallet DECIMAL(10, 2),
    price_per_split DECIMAL(10, 2),
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
    partner_tier VARCHAR(50) DEFAULT 'standard' CHECK (partner_tier IN ('standard', 'gold', 'platinum')),
    
    -- Stats
    total_processed INTEGER DEFAULT 0,
    accuracy_rate DECIMAL(5, 2),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Warehouse events (webhook logs)
CREATE TABLE IF NOT EXISTS warehouse_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_partner_id UUID NOT NULL REFERENCES warehouse_partners(id),
    
    -- Event type
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'inbound_received',
        'inbound_verified',
        'linehaul_ready',
        'linehaul_dispatched',
        'split_started',
        'split_completed',
        'outbound_scanned',
        'damage_reported'
    )),
    
    -- References
    shipment_id UUID REFERENCES shipments(id),
    order_id UUID REFERENCES orders(id),
    
    -- Event data
    event_data JSONB NOT NULL,
    
    -- Processing
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ASN (Advanced Shipping Notice)
CREATE TABLE IF NOT EXISTS asn_notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asn_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Destination
    warehouse_partner_id UUID NOT NULL REFERENCES warehouse_partners(id),
    
    -- Shipment info
    expected_arrival TIMESTAMP WITH TIME ZONE,
    carrier_name VARCHAR(100),
    tracking_number VARCHAR(255),
    
    -- Contents (manifest)
    manifest JSONB NOT NULL, -- Array of {sku, quantity, order_id}
    
    -- Status
    status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('sent', 'acknowledged', 'received', 'discrepancy')),
    
    -- Acknowledgment
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    received_at TIMESTAMP WITH TIME ZONE,
    
    -- Discrepancies
    discrepancies JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_community ON profiles(community_id);
CREATE INDEX IF NOT EXISTS idx_profiles_guardian ON profiles(guardian_id);

-- Communities
CREATE INDEX IF NOT EXISTS idx_communities_slug ON communities(slug);
CREATE INDEX IF NOT EXISTS idx_communities_status ON communities(status);

-- Campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_community ON campaigns(community_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON campaigns(start_date, end_date);

-- Seller profiles
CREATE INDEX IF NOT EXISTS idx_seller_profiles_user ON seller_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_community ON seller_profiles(community_id);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_level ON seller_profiles(current_level);

-- Achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);

-- XP events
CREATE INDEX IF NOT EXISTS idx_xp_events_user ON xp_events(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_created ON xp_events(created_at DESC);

-- Treasury
CREATE INDEX IF NOT EXISTS idx_treasury_order ON treasury_holds(order_id);
CREATE INDEX IF NOT EXISTS idx_treasury_holder ON treasury_holds(holder_type, holder_id);
CREATE INDEX IF NOT EXISTS idx_treasury_status ON treasury_holds(status);
CREATE INDEX IF NOT EXISTS idx_treasury_hold_until ON treasury_holds(hold_until);

-- Warehouse
CREATE INDEX IF NOT EXISTS idx_warehouse_events_partner ON warehouse_events(warehouse_partner_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_events_shipment ON warehouse_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_events_type ON warehouse_events(event_type);
CREATE INDEX IF NOT EXISTS idx_warehouse_events_processed ON warehouse_events(processed);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_events ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can see their own profile
CREATE POLICY profiles_select_own ON profiles
    FOR SELECT USING (id = auth.uid());

-- Communities: Members can see their community
CREATE POLICY communities_select_member ON communities
    FOR SELECT USING (
        id IN (SELECT community_id FROM profiles WHERE id = auth.uid())
    );

-- Seller profiles: Sellers can see their own profile
CREATE POLICY seller_profiles_select_own ON seller_profiles
    FOR SELECT USING (user_id = auth.uid());

-- Seller profiles: Guardians can see their children's profiles
CREATE POLICY seller_profiles_select_guardian ON seller_profiles
    FOR SELECT USING (
        user_id IN (SELECT id FROM profiles WHERE guardian_id = auth.uid())
    );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger for new tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON communities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seller_profiles_updated_at BEFORE UPDATE ON seller_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warehouse_partners_updated_at BEFORE UPDATE ON warehouse_partners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default achievements
INSERT INTO achievements (name, description, requirement_type, requirement_value, reward_xp, rarity) VALUES
('First Sale', 'Complete your first sale', 'first_sale', 1, 100, 'common'),
('Rising Star', 'Reach 1000 NOK in total sales', 'total_sales', 1000, 500, 'rare'),
('Sales Pro', 'Complete 50 orders', 'total_orders', 50, 1000, 'epic'),
('Legend', 'Reach level 10', 'level_reached', 10, 2000, 'legendary'),
('Fire Streak', 'Sell for 7 consecutive days', 'consecutive_days', 7, 750, 'epic'),
('International Star', 'Make your first international sale', 'international_sale', 1, 300, 'rare')
ON CONFLICT DO NOTHING;

-- Insert default avatar items
INSERT INTO avatar_items (item_id, name, description, item_type, unlock_type, rarity) VALUES
('base_default', 'Default Avatar', 'Your starting look', 'base', 'default', 'common'),
('hat_cap', 'Team Cap', 'Classic team cap', 'hat', 'default', 'common'),
('hat_gold', 'Gold Crown', 'For the champions', 'hat', 'achievement', 'legendary'),
('bg_blue', 'Blue Sky', 'Clear blue background', 'background', 'default', 'common'),
('bg_stars', 'Starry Night', 'Reach for the stars', 'background', 'level', 'epic')
ON CONFLICT (item_id) DO NOTHING;
