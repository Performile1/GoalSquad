/**
 * ============================================================
 * MIGRATION 038 — FULL DATABASE AUDIT & MISSING TABLE FIXES
 * ============================================================
 * 
 * Sammanfattning av vad som finns (✅) och vad som skapas här (🔧)
 *
 * BEFINTLIGA TABELLER (skapade i 001–037):
 *   organizations, profiles, communities, community_members
 *   merchants, products, community_products, blog_posts
 *   seller_profiles, warehouse_partners, consolidation_warehouses
 *   warehouse_inventory, product_flow_summary, orders, order_items
 *   conversations, merchant_community_messages, invitations
 *   seller_xp, seller_avatar_equipment, avatar_items
 *   seller_quests, seller_quest_progress, loot_boxes, seller_loot_boxes
 *   community_milestones, squad_tiers, community_badges
 *   customer_support_stats, collector_badges, referral_bonuses, cheer_messages
 *   ad_placements, ads, ad_stats, ad_payments
 *   asn_notices, warehouse_events, entity_goals, wallets
 *   leaderboards, user_achievements, coordination_messages
 *   broadcast_messages, broadcast_recipients, merchant_shipping_preferences
 *   notifications, pick_sessions, pick_session_items, product_barcodes
 *   campaigns, seo_settings
 *
 * SAKNADE / FELAKTIGA TABELLER SOM SKAPAS/FIXAS HÄR (🔧):
 *   1. treasury_holds       — används av lib/treasury.ts
 *   2. ledger_entries       — används av lib/split-engine.ts
 *   3. split_configurations — används av lib/split-engine.ts
 *   4. achievements         — separat achievements-katalog (refereras av sellers/[id]/stats)
 *   5. shipments            — används av lib/split-engine.ts (orderbaserad, ej merchant_shipments)
 *   6. wallets: lägger till owner_type + owner_id (split-engine kräver det)
 *   7. profiles: lägger till display_name (alias för full_name), seller_id, community_id, merchant_id
 *   8. merchants: lägger till business_name (alias för merchant_name, används i leaderboard)
 *   9. communities: lägger till total_sales (används av leaderboard)
 *  10. products: lägger till name, is_active, cost_price (refereras av API:er)
 *
 * ENVIRONMENT VARIABLES KRÄVS (dokumentation längst ned)
 * ============================================================
 */

-- ============================================================
-- 1. TREASURY HOLDS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.treasury_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  holder_type VARCHAR(50) NOT NULL CHECK (holder_type IN ('community', 'seller', 'merchant', 'warehouse', 'platform')),
  holder_id UUID NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'SEK',
  hold_days INTEGER DEFAULT 14,
  hold_until TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'held' CHECK (status IN ('held', 'released', 'disputed', 'refunded')),
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_treasury_holds_order ON public.treasury_holds(order_id);
CREATE INDEX IF NOT EXISTS idx_treasury_holds_holder ON public.treasury_holds(holder_type, holder_id);
CREATE INDEX IF NOT EXISTS idx_treasury_holds_status ON public.treasury_holds(status);
CREATE INDEX IF NOT EXISTS idx_treasury_holds_until ON public.treasury_holds(hold_until) WHERE status = 'held';

ALTER TABLE public.treasury_holds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "treasury_holds_service_role" ON public.treasury_holds;
CREATE POLICY "treasury_holds_service_role"
  ON public.treasury_holds FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "treasury_holds_own_read" ON public.treasury_holds;
CREATE POLICY "treasury_holds_own_read"
  ON public.treasury_holds FOR SELECT TO authenticated
  USING (holder_id = auth.uid());

DROP TRIGGER IF EXISTS update_treasury_holds_updated_at ON public.treasury_holds;
CREATE TRIGGER update_treasury_holds_updated_at
  BEFORE UPDATE ON public.treasury_holds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. LEDGER ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL,
  wallet_id UUID,
  entry_type VARCHAR(50) NOT NULL CHECK (entry_type IN ('credit', 'debit', 'hold', 'release', 'fee')),
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'SEK',
  reference_type VARCHAR(50),
  reference_id UUID,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_transaction ON public.ledger_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_wallet ON public.ledger_entries(wallet_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_created ON public.ledger_entries(created_at DESC);

ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ledger_entries_service_role" ON public.ledger_entries;
CREATE POLICY "ledger_entries_service_role"
  ON public.ledger_entries FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "ledger_entries_own_read" ON public.ledger_entries;
CREATE POLICY "ledger_entries_own_read"
  ON public.ledger_entries FOR SELECT TO authenticated
  USING (
    wallet_id IN (
      SELECT id FROM public.wallets WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 3. SPLIT CONFIGURATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.split_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  active BOOLEAN DEFAULT true,
  community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE SET NULL,
  product_category VARCHAR(100),
  -- Split percentages (must sum to 100)
  platform_percent DECIMAL(5,2) NOT NULL DEFAULT 12.00,
  community_percent DECIMAL(5,2) NOT NULL DEFAULT 60.00,
  seller_percent DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  warehouse_percent DECIMAL(5,2) NOT NULL DEFAULT 8.00,
  -- Fees
  handling_fee DECIMAL(10,2) DEFAULT 0,
  shipping_spread_percent DECIMAL(5,2) DEFAULT 100.00,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT split_config_sum CHECK (
    platform_percent + community_percent + seller_percent + warehouse_percent <= 100.01
  )
);

INSERT INTO public.split_configurations (name, active, platform_percent, community_percent, seller_percent, warehouse_percent)
VALUES ('Standard GoalSquad Split', true, 12.00, 60.00, 20.00, 8.00)
ON CONFLICT DO NOTHING;

ALTER TABLE public.split_configurations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "split_config_service_role" ON public.split_configurations;
CREATE POLICY "split_config_service_role"
  ON public.split_configurations FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "split_config_read" ON public.split_configurations;
CREATE POLICY "split_config_read"
  ON public.split_configurations FOR SELECT TO authenticated USING (active = true);

-- ============================================================
-- 4. ACHIEVEMENTS (katalog — refereras i sellers/[id]/stats)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('sales', 'streak', 'community', 'gamification', 'general')),
  xp_reward INTEGER DEFAULT 0,
  badge_type VARCHAR(50),
  requirement_type VARCHAR(50),
  requirement_value INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_active ON public.achievements(is_active) WHERE is_active = true;

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "achievements_public_read" ON public.achievements;
CREATE POLICY "achievements_public_read"
  ON public.achievements FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "achievements_service_role" ON public.achievements;
CREATE POLICY "achievements_service_role"
  ON public.achievements FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Add FK from user_achievements to achievements (if table + column don't exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_achievements')
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_name = 'user_achievements' AND column_name = 'achievement_id'
     )
  THEN
    ALTER TABLE public.user_achievements ADD COLUMN achievement_id UUID REFERENCES public.achievements(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 5. SHIPMENTS (order-based, ≠ merchant_shipments)
--    Refereras av lib/split-engine.ts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES public.consolidation_warehouses(id),
  carrier VARCHAR(100),
  tracking_number VARCHAR(255),
  shipping_label_url TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'delivered', 'returned', 'failed')),
  estimated_delivery DATE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  shipping_cost DECIMAL(10,2),
  weight_grams INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_order ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON public.shipments(tracking_number) WHERE tracking_number IS NOT NULL;

ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shipments_service_role" ON public.shipments;
CREATE POLICY "shipments_service_role"
  ON public.shipments FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "shipments_customer_read" ON public.shipments;
CREATE POLICY "shipments_customer_read"
  ON public.shipments FOR SELECT TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE customer_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS update_shipments_updated_at ON public.shipments;
CREATE TRIGGER update_shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. WALLETS — skapa om saknas, fixa kolumner
--    split-engine.ts kräver owner_type ('platform','merchant','carrier','hub')
--    Migration 034 skapade wallets med user_id ONLY → mismatch
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_type VARCHAR(50) DEFAULT 'user',
  owner_id UUID,
  balance DECIMAL(12,2) DEFAULT 0 CHECK (balance >= 0),
  currency VARCHAR(3) DEFAULT 'SEK',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wallets_service_role" ON public.wallets;
CREATE POLICY "wallets_service_role"
  ON public.wallets FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "wallets_own_read" ON public.wallets;
CREATE POLICY "wallets_own_read"
  ON public.wallets FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Lägg till saknade kolumner om tabellen redan fanns utan dem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name = 'owner_type'
  ) THEN
    ALTER TABLE public.wallets ADD COLUMN owner_type VARCHAR(50) DEFAULT 'user';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE public.wallets ADD COLUMN owner_id UUID;
  END IF;

  -- Gör user_id nullable så icke-användar-plånböcker kan existera
  BEGIN
    ALTER TABLE public.wallets ALTER COLUMN user_id DROP NOT NULL;
  EXCEPTION WHEN others THEN NULL;
  END;
END $$;

CREATE INDEX IF NOT EXISTS idx_wallets_owner ON public.wallets(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON public.wallets(user_id) WHERE user_id IS NOT NULL;

-- Seed: plattformsplånbok
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.wallets WHERE owner_type = 'platform'
  ) THEN
    INSERT INTO public.wallets (owner_type, owner_id, balance)
    VALUES ('platform', '00000000-0000-0000-0000-000000000001', 0);
  END IF;
END $$;

-- ============================================================
-- 7. FIX PROFILES — lägg till kolumner som används i kodbas
-- ============================================================
DO $$
BEGIN
  -- display_name används i admin/users page (alias för full_name)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN display_name VARCHAR(255)
      GENERATED ALWAYS AS (COALESCE(full_name, email)) STORED;
  END IF;
EXCEPTION WHEN feature_not_supported THEN
  -- Om GENERATED kolumner inte stöds, lägg till som vanlig kolumn
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN display_name VARCHAR(255);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'seller_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN seller_id UUID REFERENCES public.seller_profiles(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'community_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'merchant_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN merchant_id UUID REFERENCES public.merchants(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='seller_id') THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_seller_id ON public.profiles(seller_id) WHERE seller_id IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='community_id') THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_community_id ON public.profiles(community_id) WHERE community_id IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='merchant_id') THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_merchant_id ON public.profiles(merchant_id) WHERE merchant_id IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='organization_id') THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id) WHERE organization_id IS NOT NULL;
  END IF;
END $$;

-- ============================================================
-- 8. FIX MERCHANTS — business_name (leaderboard route refererar det)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'merchants' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE public.merchants ADD COLUMN business_name VARCHAR(255)
      GENERATED ALWAYS AS (merchant_name) STORED;
  END IF;
EXCEPTION WHEN feature_not_supported THEN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'merchants' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE public.merchants ADD COLUMN business_name VARCHAR(255);
    UPDATE public.merchants SET business_name = merchant_name WHERE business_name IS NULL;
  END IF;
END $$;

-- ============================================================
-- 9. FIX COMMUNITIES — total_sales (leaderboard route refererar det)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'communities' AND column_name = 'total_sales'
  ) THEN
    ALTER TABLE public.communities ADD COLUMN total_sales DECIMAL(14,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'communities' AND column_name = 'total_members'
  ) THEN
    ALTER TABLE public.communities ADD COLUMN total_members INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'communities' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.communities ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='communities' AND column_name='total_sales') THEN
    CREATE INDEX IF NOT EXISTS idx_communities_total_sales ON public.communities(total_sales DESC);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='communities' AND column_name='is_active') THEN
    CREATE INDEX IF NOT EXISTS idx_communities_is_active ON public.communities(is_active) WHERE is_active = true;
  END IF;
END $$;

-- ============================================================
-- 10. FIX PRODUCTS — saknade kolumner från API-anrop
-- ============================================================
DO $$
BEGIN
  -- 'name' används i shop/[sellerId] och products/calculator-products
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'name'
  ) THEN
    ALTER TABLE public.products ADD COLUMN name VARCHAR(255)
      GENERATED ALWAYS AS (title) STORED;
  END IF;
EXCEPTION WHEN feature_not_supported THEN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'name'
  ) THEN
    ALTER TABLE public.products ADD COLUMN name VARCHAR(255);
    UPDATE public.products SET name = title WHERE name IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  -- is_active används i stats/calculator
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.products ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;

  -- cost_price används i stats/calculator (profit margin)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'cost_price'
  ) THEN
    ALTER TABLE public.products ADD COLUMN cost_price DECIMAL(10,2);
  END IF;

  -- image_url används i product listings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.products ADD COLUMN image_url TEXT;
  END IF;

  -- image_urls (array) används i shop page
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'image_urls'
  ) THEN
    ALTER TABLE public.products ADD COLUMN image_urls TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- ============================================================
-- 11. FIX ORDERS — total_amount refereras av stats/calculator
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'total_amount'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN total_amount DECIMAL(10,2)
      GENERATED ALWAYS AS (total) STORED;
  END IF;
EXCEPTION WHEN feature_not_supported THEN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'total_amount'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN total_amount DECIMAL(10,2);
    UPDATE public.orders SET total_amount = total WHERE total_amount IS NULL;
  END IF;
END $$;

-- ============================================================
-- 12. FIX ORGANIZATIONS — invite_code + type (refereras av sellers/register)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'invite_code'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN invite_code VARCHAR(50) UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'type'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN type VARCHAR(50) DEFAULT 'hub';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_organizations_invite_code ON public.organizations(invite_code) WHERE invite_code IS NOT NULL;

-- ============================================================
-- VALIDATION QUERY — kör detta för att verifiera allt finns
-- Klistra in nedanstående i Supabase SQL Editor
-- ============================================================

/*
-- VALIDERING: Alla förväntade tabeller
SELECT 
  t.expected_table,
  CASE WHEN pt.tablename IS NOT NULL THEN '✅ FINNS' ELSE '❌ SAKNAS' END AS status
FROM (VALUES
  ('organizations'), ('profiles'), ('communities'), ('community_members'),
  ('merchants'), ('products'), ('community_products'), ('blog_posts'),
  ('seller_profiles'), ('warehouse_partners'), ('consolidation_warehouses'),
  ('warehouse_inventory'), ('product_flow_summary'), ('orders'), ('order_items'),
  ('conversations'), ('merchant_community_messages'), ('invitations'),
  ('seller_xp'), ('avatar_items'), ('seller_quests'), ('seller_quest_progress'),
  ('loot_boxes'), ('seller_loot_boxes'), ('community_milestones'), ('squad_tiers'),
  ('community_badges'), ('ad_placements'), ('ads'), ('ad_stats'), ('ad_payments'),
  ('asn_notices'), ('warehouse_events'), ('entity_goals'), ('wallets'),
  ('leaderboards'), ('user_achievements'), ('achievements'), ('coordination_messages'),
  ('broadcast_messages'), ('broadcast_recipients'), ('merchant_shipping_preferences'),
  ('notifications'), ('pick_sessions'), ('pick_session_items'), ('product_barcodes'),
  ('campaigns'), ('seo_settings'), ('treasury_holds'), ('ledger_entries'),
  ('split_configurations'), ('shipments')
) AS t(expected_table)
LEFT JOIN pg_tables pt ON pt.tablename = t.expected_table AND pt.schemaname = 'public'
ORDER BY status, t.expected_table;

-- VALIDERING: Kritiska kolumner på profiles
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- VALIDERING: Räkna poster per tabell
SELECT 
  tablename,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = tablename) AS col_count
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
*/

-- ============================================================
-- ENVIRONMENT VARIABLES DOKUMENTATION
-- ============================================================
-- 
-- KRÄVS I VERCEL (alla miljöer: Production, Preview, Development):
--
-- SUPABASE (⚠️ NOTERA: 2 olika namn används i kodbas!)
--   NEXT_PUBLIC_SUPABASE_URL       ← används i lib/supabase.ts
--   SUPABASE_URL                   ← används direkt i många API-routes
--   NEXT_PUBLIC_SUPABASE_ANON_KEY  ← publik anon-nyckel
--   SUPABASE_SERVICE_ROLE_KEY      ← privat, ALDRIG exponera client-side
--
-- STRIPE
--   STRIPE_SECRET_KEY              ← Stripe server-nyckel (sk_live_/sk_test_)
--   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ← Stripe publik nyckel (pk_live_/pk_test_)
--   STRIPE_WEBHOOK_SECRET          ← Webhook signing secret (whsec_)
--
-- CRON
--   CRON_SECRET                    ← Skyddar /api/cron/webhook-worker
--
-- BILD-TJÄNSTER (valfria, en av dem krävs för bakgrundsradering)
--   REMOVE_BG_API_KEY              ← remove.bg API nyckel
--   CLOUDINARY_URL                 ← Cloudinary URL (alternativ)
--   CLOUDINARY_CLOUD_NAME          ← Cloudinary cloud name
--   CLOUDINARY_API_KEY             ← Cloudinary API key
--   CLOUDINARY_API_SECRET          ← Cloudinary API secret
--
-- APP URL
--   NEXT_PUBLIC_APP_URL            ← https://goalsquad.se (din domän)
--
-- ⚠️ DUPLICAT-PROBLEM: SUPABASE_URL vs NEXT_PUBLIC_SUPABASE_URL
--    Många API-routes använder process.env.SUPABASE_URL men lib/supabase.ts
--    använder NEXT_PUBLIC_SUPABASE_URL.
--    LÖSNING: Sätt BÅDA i Vercel med samma värde, ELLER standardisera koden
--    till att alltid använda NEXT_PUBLIC_SUPABASE_URL.
-- ============================================================
