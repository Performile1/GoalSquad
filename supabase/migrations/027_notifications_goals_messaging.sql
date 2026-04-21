-- ============================================
-- NOTIFICATIONS, GOALS, INTER-CLUB MESSAGING, SHIPPING
-- ============================================

-- ============================================
-- NOTIFICATIONS
-- ============================================
-- Table for notifications to entities about new companies/products
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_type VARCHAR(50) NOT NULL CHECK (recipient_type IN ('community', 'seller', 'merchant', 'warehouse')),
  type VARCHAR(50) NOT NULL CHECK (type IN ('new_company', 'new_product', 'sales_milestone', 'goal_achieved', 'message', 'coordinaton_request')),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_type ON public.notifications(recipient_type);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on notifications" ON public.notifications;
CREATE POLICY "Service role full access on notifications"
  ON public.notifications FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid());

-- ============================================
-- SALES ANALYTICS
-- ============================================
-- Table for tracking sales analytics per entity
CREATE TABLE IF NOT EXISTS public.entity_sales_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('community', 'seller', 'merchant', 'warehouse')),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  category_id UUID,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  quantity_sold INTEGER DEFAULT 0 CHECK (quantity_sold >= 0),
  revenue NUMERIC DEFAULT 0 CHECK (revenue >= 0),
  commission NUMERIC DEFAULT 0 CHECK (commission >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT entity_sales_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT entity_sales_analytics_period_check CHECK (period_end >= period_start)
);

CREATE INDEX IF NOT EXISTS idx_entity_sales_entity ON public.entity_sales_analytics(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_sales_entity_type ON public.entity_sales_analytics(entity_type);
CREATE INDEX IF NOT EXISTS idx_entity_sales_product ON public.entity_sales_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_entity_sales_period ON public.entity_sales_analytics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_entity_sales_quantity ON public.entity_sales_analytics(quantity_sold DESC);

ALTER TABLE public.entity_sales_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on entity_sales_analytics" ON public.entity_sales_analytics;
CREATE POLICY "Service role full access on entity_sales_analytics"
  ON public.entity_sales_analytics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Entities can view own sales analytics" ON public.entity_sales_analytics;
CREATE POLICY "Entities can view own sales analytics"
  ON public.entity_sales_analytics FOR SELECT
  TO authenticated
  USING (entity_id = auth.uid());

-- ============================================
-- GOALS / TARGETS
-- ============================================
-- Table for goals/targets for associations, classes, clubs
CREATE TABLE IF NOT EXISTS public.entity_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('community', 'seller')),
  goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN ('revenue', 'products_sold', 'new_customers', 'commission', 'custom')),
  goal_title VARCHAR(200) NOT NULL,
  target_value NUMERIC NOT NULL CHECK (target_value > 0),
  current_value NUMERIC DEFAULT 0 CHECK (current_value >= 0),
  unit VARCHAR(50) DEFAULT 'kr',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'failed', 'cancelled')),
  achieved_at TIMESTAMP WITH TIME ZONE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT entity_goals_pkey PRIMARY KEY (id),
  CONSTRAINT entity_goals_period_check CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_entity_goals_entity ON public.entity_goals(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_goals_entity_type ON public.entity_goals(entity_type);
CREATE INDEX IF NOT EXISTS idx_entity_goals_status ON public.entity_goals(status);
CREATE INDEX IF NOT EXISTS idx_entity_goals_period ON public.entity_goals(start_date, end_date);

ALTER TABLE public.entity_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on entity_goals" ON public.entity_goals;
CREATE POLICY "Service role full access on entity_goals"
  ON public.entity_goals FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Entities can view own goals" ON public.entity_goals;
CREATE POLICY "Entities can view own goals"
  ON public.entity_goals FOR SELECT
  TO authenticated
  USING (entity_id = auth.uid());

DROP POLICY IF EXISTS "Entities can create own goals" ON public.entity_goals;
CREATE POLICY "Entities can create own goals"
  ON public.entity_goals FOR INSERT
  TO authenticated
  WITH CHECK (entity_id = auth.uid());

DROP POLICY IF EXISTS "Entities can update own goals" ON public.entity_goals;
CREATE POLICY "Entities can update own goals"
  ON public.entity_goals FOR UPDATE
  TO authenticated
  USING (entity_id = auth.uid());

-- ============================================
-- INTER-CLUB MESSAGING
-- ============================================
-- Table for coordination messages between clubs/communities
CREATE TABLE IF NOT EXISTS public.coordination_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_type VARCHAR(50) CHECK (recipient_type IN ('specific', 'nearby', 'all')),
  message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('sales_help', 'product_share', 'coordination', 'general')),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity_needed INTEGER,
  location_area VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT coordination_messages_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_coordination_sender ON public.coordination_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_coordination_recipient ON public.coordination_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_coordination_type ON public.coordination_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_coordination_status ON public.coordination_messages(status);
CREATE INDEX IF NOT EXISTS idx_coordination_location ON public.coordination_messages(location_area);

ALTER TABLE public.coordination_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on coordination_messages" ON public.coordination_messages;
CREATE POLICY "Service role full access on coordination_messages"
  ON public.coordination_messages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own coordination messages" ON public.coordination_messages;
CREATE POLICY "Users can view own coordination messages"
  ON public.coordination_messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can create coordination messages" ON public.coordination_messages;
CREATE POLICY "Users can create coordination messages"
  ON public.coordination_messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own coordination messages" ON public.coordination_messages;
CREATE POLICY "Users can update own coordination messages"
  ON public.coordination_messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid());

-- ============================================
-- COMPANY SHIPPING PREFERENCES
-- ============================================
-- Table for company shipping preferences
CREATE TABLE IF NOT EXISTS public.merchant_shipping_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  allow_individual_shipments BOOLEAN DEFAULT false,
  allow_bulk_shipments BOOLEAN DEFAULT true,
  min_bulk_quantity INTEGER DEFAULT 10,
  individual_shipping_cost NUMERIC DEFAULT 0,
  bulk_shipping_cost NUMERIC DEFAULT 0,
  shipping_regions TEXT[],
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT merchant_shipping_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT merchant_shipping_preferences_merchant_unique UNIQUE (merchant_id)
);

CREATE INDEX IF NOT EXISTS idx_merchant_shipping_merchant ON public.merchant_shipping_preferences(merchant_id);

ALTER TABLE public.merchant_shipping_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on merchant_shipping_preferences" ON public.merchant_shipping_preferences;
CREATE POLICY "Service role full access on merchant_shipping_preferences"
  ON public.merchant_shipping_preferences FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Merchants can view own shipping preferences" ON public.merchant_shipping_preferences;
CREATE POLICY "Merchants can view own shipping preferences"
  ON public.merchant_shipping_preferences FOR SELECT
  TO authenticated
  USING (merchant_id = auth.uid());

DROP POLICY IF EXISTS "Merchants can update own shipping preferences" ON public.merchant_shipping_preferences;
CREATE POLICY "Merchants can update own shipping preferences"
  ON public.merchant_shipping_preferences FOR UPDATE
  TO authenticated
  USING (merchant_id = auth.uid());

-- ============================================
-- COMPANY TO ENTITY COMMUNICATION
-- ============================================
-- Table for company messages to entities (good job, etc.)
CREATE TABLE IF NOT EXISTS public.merchant_entity_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('good_job', 'milestone', 'announcement', 'incentive')),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT merchant_entity_messages_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_merchant_entity_merchant ON public.merchant_entity_messages(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_entity_recipient ON public.merchant_entity_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_merchant_entity_type ON public.merchant_entity_messages(message_type);

ALTER TABLE public.merchant_entity_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on merchant_entity_messages" ON public.merchant_entity_messages;
CREATE POLICY "Service role full access on merchant_entity_messages"
  ON public.merchant_entity_messages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Merchants can view sent messages" ON public.merchant_entity_messages;
CREATE POLICY "Merchants can view sent messages"
  ON public.merchant_entity_messages FOR SELECT
  TO authenticated
  USING (merchant_id = auth.uid());

DROP POLICY IF EXISTS "Recipients can view received messages" ON public.merchant_entity_messages;
CREATE POLICY "Recipients can view received messages"
  ON public.merchant_entity_messages FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Merchants can create messages" ON public.merchant_entity_messages;
CREATE POLICY "Merchants can create messages"
  ON public.merchant_entity_messages FOR INSERT
  TO authenticated
  WITH CHECK (merchant_id = auth.uid());

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp
DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_entity_sales_updated_at ON public.entity_sales_analytics;
CREATE TRIGGER update_entity_sales_updated_at
  BEFORE UPDATE ON public.entity_sales_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_entity_goals_updated_at ON public.entity_goals;
CREATE TRIGGER update_entity_goals_updated_at
  BEFORE UPDATE ON public.entity_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_coordination_messages_updated_at ON public.coordination_messages;
CREATE TRIGGER update_coordination_messages_updated_at
  BEFORE UPDATE ON public.coordination_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_merchant_shipping_updated_at ON public.merchant_shipping_preferences;
CREATE TRIGGER update_merchant_shipping_updated_at
  BEFORE UPDATE ON public.merchant_shipping_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to create notification for new company
CREATE OR REPLACE FUNCTION notify_new_company(p_merchant_id UUID, p_merchant_name VARCHAR)
RETURNS VOID AS $$
DECLARE
  v_recipient RECORD;
BEGIN
  -- Notify all communities, sellers about new company
  FOR v_recipient IN 
    SELECT id, 'community' as type FROM profiles WHERE role = 'community'
    UNION
    SELECT id, 'seller' as type FROM profiles WHERE role = 'seller'
  LOOP
    INSERT INTO notifications (recipient_id, recipient_type, type, title, message, data)
    VALUES (
      v_recipient.id,
      v_recipient.type,
      'new_company',
      'Nytt företag anslutet',
      p_merchant_name || ' har anslutit till GoalSquad. Kolla in deras produkter!',
      jsonb_build_object('merchant_id', p_merchant_id, 'merchant_name', p_merchant_name)
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification for new product
CREATE OR REPLACE FUNCTION notify_new_product(p_merchant_id UUID, p_product_name VARCHAR, p_category VARCHAR)
RETURNS VOID AS $$
DECLARE
  v_recipient RECORD;
BEGIN
  -- Notify communities and sellers connected to this merchant's region
  FOR v_recipient IN 
    SELECT id, 'community' as type FROM profiles WHERE role = 'community'
    UNION
    SELECT id, 'seller' as type FROM profiles WHERE role = 'seller'
  LOOP
    INSERT INTO notifications (recipient_id, recipient_type, type, title, message, data)
    VALUES (
      v_recipient.id,
      v_recipient.type,
      'new_product',
      'Ny produkt tillgänglig',
      p_product_name || ' är nu tillgänglig från ' || p_category || '.',
      jsonb_build_object('merchant_id', p_merchant_id, 'product_name', p_product_name, 'category', p_category)
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and update goal progress
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_goal RECORD;
BEGIN
  -- Check if any goals need to be marked as achieved
  FOR v_goal IN 
    SELECT id FROM entity_goals 
    WHERE status = 'active' 
      AND current_value >= target_value
  LOOP
    UPDATE entity_goals 
    SET status = 'achieved', 
        achieved_at = NOW(),
        updated_at = NOW()
    WHERE id = v_goal.id;
    
    -- Create notification for goal achievement
    INSERT INTO notifications (recipient_id, recipient_type, type, title, message)
    VALUES (
      (SELECT entity_id FROM entity_goals WHERE id = v_goal.id),
      (SELECT entity_type FROM entity_goals WHERE id = v_goal.id),
      'goal_achieved',
      'Mål uppnått!',
      'Grattis! Du har nått ditt mål.'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for goal progress check
DROP TRIGGER IF EXISTS check_goal_progress_trigger ON entity_goals;
CREATE TRIGGER check_goal_progress_trigger
  AFTER UPDATE OF current_value ON entity_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_progress();

DO $$
BEGIN
  RAISE NOTICE 'Notifications, goals, messaging, and shipping schema created successfully';
END $$;
