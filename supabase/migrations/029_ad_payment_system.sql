-- Migration 029: Ad Payment System
-- Features: Advance payments, refunds with admin fee, card saving for daily charges

-- Add new columns to ads table for payment tracking
ALTER TABLE ads
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'daily' CHECK (payment_type IN ('daily', 'advance')),
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'partial_refund')),
  ADD COLUMN IF NOT EXISTS advance_discount_percent INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS discounted_price DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS admin_fee_percent INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS refund_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS refund_reason TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT,
  ADD COLUMN IF NOT EXISTS save_card_for_daily_charges BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS daily_charge_limit DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS last_daily_charge_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS total_daily_charged DECIMAL(10, 2) DEFAULT 0;

-- Create table for payment transactions
CREATE TABLE IF NOT EXISTS ad_payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'daily_charge')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'SEK',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'
);

-- Create table for admin fee configuration
CREATE TABLE IF NOT EXISTS admin_fee_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_type TEXT NOT NULL UNIQUE CHECK (fee_type IN ('ad_rejection', 'daily_charge', 'other')),
  fee_percent INTEGER NOT NULL DEFAULT 5,
  fixed_fee DECIMAL(10, 2) DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin fee configurations
INSERT INTO admin_fee_config (fee_type, fee_percent, fixed_fee, description) VALUES
  ('ad_rejection', 5, 50, 'Avgift för återbetalning vid avvisad annons'),
  ('daily_charge', 2, 0, 'Avgift för dagliga debiteringar')
ON CONFLICT (fee_type) DO NOTHING;

-- Create index for payment transactions
CREATE INDEX IF NOT EXISTS idx_ad_payment_transactions_ad_id ON ad_payment_transactions(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_payment_transactions_type ON ad_payment_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_ad_payment_transactions_status ON ad_payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_ads_approval_status ON ads(approval_status);
CREATE INDEX IF NOT EXISTS idx_ads_payment_status ON ads(payment_status);

-- Create function to calculate discounted price
CREATE OR REPLACE FUNCTION calculate_discounted_price(p_original_price DECIMAL, p_discount_percent INTEGER)
RETURNS DECIMAL AS $$
BEGIN
  RETURN ROUND(p_original_price * (1 - (p_discount_percent::DECIMAL / 100)), 2);
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate refund amount with admin fee
CREATE OR REPLACE FUNCTION calculate_refund_amount(p_paid_amount DECIMAL, p_admin_fee_percent INTEGER, p_fixed_fee DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
  v_fee_amount DECIMAL;
  v_refund_amount DECIMAL;
BEGIN
  v_fee_amount = ROUND(p_paid_amount * (p_admin_fee_percent::DECIMAL / 100), 2) + p_fixed_fee;
  v_refund_amount = p_paid_amount - v_fee_amount;
  RETURN GREATEST(v_refund_amount, 0); -- Ensure refund is not negative
END;
$$ LANGUAGE plpgsql;

-- Create function to check if daily charge is needed
CREATE OR REPLACE FUNCTION should_charge_daily(p_ad_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_ad RECORD;
  v_days_charged INTEGER;
  v_should_charge BOOLEAN;
BEGIN
  SELECT * INTO v_ad FROM ads WHERE id = p_ad_id;
  
  IF NOT v_ad.save_card_for_daily_charges THEN
    RETURN FALSE;
  END IF;
  
  IF v_ad.payment_type != 'daily' THEN
    RETURN FALSE;
  END IF;
  
  IF v_ad.payment_status != 'paid' THEN
    RETURN FALSE;
  END IF;
  
  IF v_ad.approval_status != 'approved' THEN
    RETURN FALSE;
  END IF;
  
  -- Check if already charged today
  IF v_ad.last_daily_charge_date = CURRENT_DATE THEN
    RETURN FALSE;
  END IF;
  
  -- Check if within date range
  IF CURRENT_DATE < v_ad.start_date THEN
    RETURN FALSE;
  END IF;
  
  IF v_ad.end_date IS NOT NULL AND CURRENT_DATE > v_ad.end_date THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate daily charge amount
CREATE OR REPLACE FUNCTION calculate_daily_charge_amount(p_ad_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_ad RECORD;
  v_daily_cost DECIMAL;
  v_admin_fee_percent INTEGER;
  v_fixed_fee DECIMAL;
  v_final_amount DECIMAL;
BEGIN
  SELECT * INTO v_ad FROM ads WHERE id = p_ad_id;
  
  -- Get daily cost based on pricing type
  CASE v_ad.purchase_type
    WHEN 'days' THEN v_daily_cost = v_ad.price_paid / v_ad.purchased_quantity;
    WHEN 'views' THEN v_daily_cost = (v_ad.price_paid / v_ad.purchased_quantity) * 100; -- Estimate
    WHEN 'clicks' THEN v_daily_cost = (v_ad.price_paid / v_ad.purchased_quantity) * 10; -- Estimate
    ELSE v_daily_cost = v_ad.price_paid / 30; -- Default to 30 days
  END CASE;
  
  -- Get admin fee for daily charges
  SELECT fee_percent, fixed_fee INTO v_admin_fee_percent, v_fixed_fee
  FROM admin_fee_config
  WHERE fee_type = 'daily_charge' AND is_active = TRUE
  LIMIT 1;
  
  IF v_admin_fee_percent IS NULL THEN
    v_admin_fee_percent := 2;
  END IF;
  
  v_fixed_fee := COALESCE(v_fixed_fee, 0);
  
  -- Calculate final amount with admin fee
  v_final_amount = ROUND(v_daily_cost * (1 + (v_admin_fee_percent::DECIMAL / 100)) + v_fixed_fee, 2);
  
  -- Check against daily charge limit
  IF v_ad.daily_charge_limit IS NOT NULL AND v_final_amount > v_ad.daily_charge_limit THEN
    v_final_amount = v_ad.daily_charge_limit;
  END IF;
  
  RETURN v_final_amount;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ad_payment_transactions_updated_at
  BEFORE UPDATE ON ad_payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_fee_config_updated_at
  BEFORE UPDATE ON admin_fee_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update RLS policies for payment transactions
ALTER TABLE ad_payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY ad_payment_transactions_select_policy ON ad_payment_transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM ads WHERE ads.id = ad_payment_transactions.ad_id AND ads.merchant_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY ad_payment_transactions_insert_policy ON ad_payment_transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM ads WHERE ads.id = ad_payment_transactions.ad_id AND ads.merchant_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY ad_payment_transactions_update_policy ON ad_payment_transactions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Update RLS policies for admin fee config
ALTER TABLE admin_fee_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_fee_config_select_policy ON admin_fee_config
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY admin_fee_config_update_policy ON admin_fee_config
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY admin_fee_config_insert_policy ON admin_fee_config
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DO $$
BEGIN
  RAISE NOTICE 'Ad payment system created successfully';
END $$;
