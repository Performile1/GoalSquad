-- ============================================================
-- MIGRATION 106 — Capture remaining feature tables into history
-- ============================================================
--
-- These tables were defined in legacy database/*.sql scripts or only in
-- code comments, causing the drift detector to flag them. This migration
-- brings them under version control (idempotent — no-op where they exist).
--
-- NOTE: Because some of these tables may already exist in the DB with
-- fewer columns, every column is added defensively via ADD COLUMN IF NOT
-- EXISTS before any indexes are created.
-- ============================================================

-- ============================================================
-- 1. signatures
-- ============================================================
CREATE TABLE IF NOT EXISTS public.signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.signatures
  ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS action VARCHAR(100),
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS verification_method VARCHAR(50),
  ADD COLUMN IF NOT EXISTS otp_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS signature_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS ip_address INET,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS geo_location JSONB,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.signatures
  ALTER COLUMN entity_type SET NOT NULL,
  ALTER COLUMN entity_id SET NOT NULL,
  ALTER COLUMN action SET NOT NULL,
  ALTER COLUMN verification_method SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'signatures_verification_method_check'
  ) THEN
    ALTER TABLE public.signatures
      ADD CONSTRAINT signatures_verification_method_check
      CHECK (verification_method IN ('otp_sms', 'otp_email', 'magic_link'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'signatures_signature_hash_key'
  ) THEN
    ALTER TABLE public.signatures
      ADD CONSTRAINT signatures_signature_hash_key UNIQUE (signature_hash);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_signatures_entity ON public.signatures(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_signatures_hash ON public.signatures(signature_hash);

-- ============================================================
-- 2. contact_information
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contact_information (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.contact_information
  ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS mobile VARCHAR(50),
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS region VARCHAR(100),
  ADD COLUMN IF NOT EXISTS country VARCHAR(2),
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS facebook_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS twitter_url TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS business_hours JSONB,
  ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255),
  ADD COLUMN IF NOT EXISTS contact_role VARCHAR(100),
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.contact_information
  ALTER COLUMN entity_type SET NOT NULL,
  ALTER COLUMN entity_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contact_entity ON public.contact_information(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_contact_email ON public.contact_information(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_primary
  ON public.contact_information(entity_type, entity_id, is_primary) WHERE is_primary = true;

-- ============================================================
-- 3. order_aggregations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_aggregations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.order_aggregations
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES public.consolidation_warehouses(id),
  ADD COLUMN IF NOT EXISTS period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS target_quantity INTEGER,
  ADD COLUMN IF NOT EXISTS current_quantity INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_orders INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'collecting',
  ADD COLUMN IF NOT EXISTS moq_reached_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.order_aggregations
  ALTER COLUMN product_id SET NOT NULL,
  ALTER COLUMN merchant_id SET NOT NULL,
  ALTER COLUMN period_start SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_aggregations_product ON public.order_aggregations(product_id);
CREATE INDEX IF NOT EXISTS idx_aggregations_status ON public.order_aggregations(status);
CREATE INDEX IF NOT EXISTS idx_aggregations_warehouse ON public.order_aggregations(warehouse_id);

-- ============================================================
-- 4. pending_moq_orders
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pending_moq_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.pending_moq_orders
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS aggregation_id UUID REFERENCES public.order_aggregations(id),
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id),
  ADD COLUMN IF NOT EXISTS quantity INTEGER,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS delivery_postal_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS assigned_warehouse_id UUID REFERENCES public.consolidation_warehouses(id),
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS estimated_ship_date DATE,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.pending_moq_orders
  ALTER COLUMN product_id SET NOT NULL,
  ALTER COLUMN quantity SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pending_orders_product ON public.pending_moq_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_pending_orders_user ON public.pending_moq_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_orders_warehouse ON public.pending_moq_orders(assigned_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_pending_orders_status ON public.pending_moq_orders(status);

-- ============================================================
-- 5. conversation_participants
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.conversation_participants
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS muted BOOLEAN DEFAULT FALSE;

ALTER TABLE public.conversation_participants
  ALTER COLUMN conversation_id SET NOT NULL,
  ALTER COLUMN user_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'conversation_participants_role_check'
  ) THEN
    ALTER TABLE public.conversation_participants
      ADD CONSTRAINT conversation_participants_role_check
      CHECK (role IN ('admin', 'member'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'conversation_participants_conversation_id_user_id_key'
  ) THEN
    ALTER TABLE public.conversation_participants
      ADD CONSTRAINT conversation_participants_conversation_id_user_id_key
      UNIQUE (conversation_id, user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_conv_participants_conversation ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON public.conversation_participants(user_id);

-- ============================================================
-- 6. messages
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB,
  ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.messages(id),
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.messages
  ALTER COLUMN conversation_id SET NOT NULL,
  ALTER COLUMN sender_id SET NOT NULL,
  ALTER COLUMN content SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_message_type_check'
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_message_type_check
      CHECK (message_type IN ('text', 'image', 'file', 'system'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

-- ============================================================
-- 7. anti_cheat_flags
-- ============================================================
CREATE TABLE IF NOT EXISTS public.anti_cheat_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.anti_cheat_flags
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS flag_type TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS metadata JSONB,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS reviewed_by UUID,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

ALTER TABLE public.anti_cheat_flags
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN flag_type SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'anti_cheat_flags_status_check'
  ) THEN
    ALTER TABLE public.anti_cheat_flags
      ADD CONSTRAINT anti_cheat_flags_status_check
      CHECK (status IN ('pending_review', 'cleared', 'confirmed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_anti_cheat_flags_user ON public.anti_cheat_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_anti_cheat_flags_status ON public.anti_cheat_flags(status);

-- ============================================================
-- 8. community_campaigns
-- ============================================================
CREATE TABLE IF NOT EXISTS public.community_campaigns (
  id UUID PRIMARY KEY REFERENCES public.campaigns(id) ON DELETE CASCADE
);

ALTER TABLE public.community_campaigns
  ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES public.communities(id),
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_community_campaigns_community ON public.community_campaigns(community_id);
CREATE INDEX IF NOT EXISTS idx_community_campaigns_status ON public.community_campaigns(status);

-- ============================================================
-- RLS policies (defensive: only service_role for now)
-- ============================================================

ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_aggregations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_moq_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anti_cheat_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_campaigns ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'signatures' AND policyname = 'signatures_service'
  ) THEN
    CREATE POLICY signatures_service ON public.signatures FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'contact_information' AND policyname = 'contact_info_service'
  ) THEN
    CREATE POLICY contact_info_service ON public.contact_information FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'order_aggregations' AND policyname = 'order_agg_service'
  ) THEN
    CREATE POLICY order_agg_service ON public.order_aggregations FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pending_moq_orders' AND policyname = 'pending_moq_service'
  ) THEN
    CREATE POLICY pending_moq_service ON public.pending_moq_orders FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'conversation_participants' AND policyname = 'conv_part_service'
  ) THEN
    CREATE POLICY conv_part_service ON public.conversation_participants FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'messages_service'
  ) THEN
    CREATE POLICY messages_service ON public.messages FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'anti_cheat_flags' AND policyname = 'anti_cheat_service'
  ) THEN
    CREATE POLICY anti_cheat_service ON public.anti_cheat_flags FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'community_campaigns' AND policyname = 'community_campaigns_service'
  ) THEN
    CREATE POLICY community_campaigns_service ON public.community_campaigns FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;
