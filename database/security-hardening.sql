-- ============================================================================
-- GOALSQUAD SECURITY HARDENING
-- Based on Gemini Analysis 2026-04-15
-- ============================================================================

-- ============================================================================
-- 1. IMMUTABLE AUDIT LOG (Separate Schema)
-- ============================================================================

-- Create separate schema for audit logs (WORM-like behavior)
CREATE SCHEMA IF NOT EXISTS audit_vault;

-- Move audit signatures to vault with stricter permissions
CREATE TABLE IF NOT EXISTS audit_vault.immutable_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  ip_address INET,
  user_agent TEXT,
  otp_method TEXT CHECK (otp_method IN ('sms', 'email')),
  otp_verified BOOLEAN DEFAULT FALSE,
  signature TEXT NOT NULL, -- SHA-256 hash
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for fast lookups
CREATE INDEX idx_immutable_sig_user ON audit_vault.immutable_signatures(user_id);
CREATE INDEX idx_immutable_sig_entity ON audit_vault.immutable_signatures(entity_type, entity_id);
CREATE INDEX idx_immutable_sig_timestamp ON audit_vault.immutable_signatures(timestamp DESC);

-- Prevent ANY updates or deletes (WORM behavior)
CREATE OR REPLACE FUNCTION audit_vault.prevent_modifications()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable. No updates or deletes allowed.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER prevent_audit_updates
  BEFORE UPDATE OR DELETE ON audit_vault.immutable_signatures
  FOR EACH ROW EXECUTE FUNCTION audit_vault.prevent_modifications();

-- Only allow INSERT via secure function
REVOKE ALL ON audit_vault.immutable_signatures FROM PUBLIC;
GRANT SELECT ON audit_vault.immutable_signatures TO authenticated;

-- ============================================================================
-- 2. SECURITY DEFINER FUNCTIONS FOR FINANCIAL OPERATIONS
-- ============================================================================

-- Secure function for creating treasury holds
CREATE OR REPLACE FUNCTION create_treasury_hold_secure(
  p_order_id UUID,
  p_transaction_id UUID,
  p_holder_type TEXT,
  p_holder_id UUID,
  p_amount DECIMAL(12,2),
  p_currency TEXT,
  p_hold_days INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hold_id UUID;
  v_user_id UUID;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  
  -- Validate user has permission
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = v_user_id 
    AND role IN ('gs_admin', 'system')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only system can create treasury holds';
  END IF;

  -- Validate amount is positive
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Create hold
  INSERT INTO treasury_holds (
    order_id,
    transaction_id,
    holder_type,
    holder_id,
    amount,
    currency,
    hold_until,
    status
  ) VALUES (
    p_order_id,
    p_transaction_id,
    p_holder_type,
    p_holder_id,
    p_amount,
    p_currency,
    NOW() + (p_hold_days || ' days')::INTERVAL,
    'held'
  )
  RETURNING id INTO v_hold_id;

  -- Log to immutable audit
  INSERT INTO audit_vault.immutable_signatures (
    user_id,
    action,
    entity_type,
    entity_id,
    signature,
    metadata
  ) VALUES (
    v_user_id,
    'treasury_hold_created',
    'treasury_hold',
    v_hold_id,
    encode(digest(v_hold_id::TEXT || p_amount::TEXT || NOW()::TEXT, 'sha256'), 'hex'),
    jsonb_build_object(
      'amount', p_amount,
      'holder_type', p_holder_type,
      'holder_id', p_holder_id
    )
  );

  RETURN v_hold_id;
END;
$$;

-- Secure function for releasing holds
CREATE OR REPLACE FUNCTION release_treasury_hold_secure(
  p_hold_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hold RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  -- Get hold details
  SELECT * INTO v_hold
  FROM treasury_holds
  WHERE id = p_hold_id
  AND status = 'held';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Hold not found or already released';
  END IF;

  -- Check if hold period has expired
  IF v_hold.hold_until > NOW() THEN
    -- Only admins can release early
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = v_user_id 
      AND role = 'gs_admin'
    ) THEN
      RAISE EXCEPTION 'Hold period not expired. Only admins can release early.';
    END IF;
  END IF;

  -- Update hold status
  UPDATE treasury_holds
  SET status = 'released',
      released_at = NOW()
  WHERE id = p_hold_id;

  -- Create ledger entry
  INSERT INTO ledger_entries (
    wallet_id,
    amount,
    entry_type,
    reference_type,
    reference_id,
    description
  )
  SELECT 
    w.id,
    v_hold.amount,
    'credit',
    'treasury_release',
    p_hold_id,
    'Treasury hold released'
  FROM wallets w
  WHERE w.entity_type = v_hold.holder_type
  AND w.entity_id = v_hold.holder_id;

  -- Update wallet balance
  UPDATE wallets
  SET balance = balance + v_hold.amount
  WHERE entity_type = v_hold.holder_type
  AND entity_id = v_hold.holder_id;

  -- Immutable audit log
  INSERT INTO audit_vault.immutable_signatures (
    user_id,
    action,
    entity_type,
    entity_id,
    signature,
    metadata
  ) VALUES (
    v_user_id,
    'treasury_hold_released',
    'treasury_hold',
    p_hold_id,
    encode(digest(p_hold_id::TEXT || v_hold.amount::TEXT || NOW()::TEXT, 'sha256'), 'hex'),
    jsonb_build_object(
      'amount', v_hold.amount,
      'holder_type', v_hold.holder_type,
      'holder_id', v_hold.holder_id
    )
  );

  RETURN TRUE;
END;
$$;

-- ============================================================================
-- 3. GUARDIAN SECOND FACTOR FOR DESTRUCTIVE ACTIONS
-- ============================================================================

-- Table for pending destructive actions requiring guardian approval
CREATE TABLE IF NOT EXISTS guardian_action_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id UUID NOT NULL REFERENCES profiles(id),
  seller_id UUID NOT NULL REFERENCES profiles(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('delete_account', 'withdraw_funds', 'change_email', 'disable_account')),
  action_data JSONB,
  otp_code TEXT NOT NULL,
  otp_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_guardian_approvals_guardian ON guardian_action_approvals(guardian_id);
CREATE INDEX idx_guardian_approvals_seller ON guardian_action_approvals(seller_id);
CREATE INDEX idx_guardian_approvals_status ON guardian_action_approvals(status);

-- Function to request guardian approval
CREATE OR REPLACE FUNCTION request_guardian_approval(
  p_seller_id UUID,
  p_action_type TEXT,
  p_action_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_guardian_id UUID;
  v_approval_id UUID;
  v_otp_code TEXT;
BEGIN
  -- Get guardian
  SELECT guardian_id INTO v_guardian_id
  FROM profiles
  WHERE id = p_seller_id;

  IF v_guardian_id IS NULL THEN
    RAISE EXCEPTION 'No guardian found for seller';
  END IF;

  -- Generate OTP
  v_otp_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

  -- Create approval request
  INSERT INTO guardian_action_approvals (
    guardian_id,
    seller_id,
    action_type,
    action_data,
    otp_code,
    otp_expires_at
  ) VALUES (
    v_guardian_id,
    p_seller_id,
    p_action_type,
    p_action_data,
    v_otp_code,
    NOW() + INTERVAL '15 minutes'
  )
  RETURNING id INTO v_approval_id;

  -- TODO: Send OTP to guardian via SMS/Email
  -- This would be handled by the application layer

  RETURN v_approval_id;
END;
$$;

-- Function to verify guardian approval
CREATE OR REPLACE FUNCTION verify_guardian_approval(
  p_approval_id UUID,
  p_otp_code TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_approval RECORD;
BEGIN
  SELECT * INTO v_approval
  FROM guardian_action_approvals
  WHERE id = p_approval_id
  AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Approval request not found or already processed';
  END IF;

  -- Check expiration
  IF v_approval.otp_expires_at < NOW() THEN
    UPDATE guardian_action_approvals
    SET status = 'expired'
    WHERE id = p_approval_id;
    RAISE EXCEPTION 'OTP expired';
  END IF;

  -- Verify OTP
  IF v_approval.otp_code != p_otp_code THEN
    RAISE EXCEPTION 'Invalid OTP code';
  END IF;

  -- Approve
  UPDATE guardian_action_approvals
  SET status = 'approved',
      resolved_at = NOW()
  WHERE id = p_approval_id;

  -- Immutable audit log
  INSERT INTO audit_vault.immutable_signatures (
    user_id,
    action,
    entity_type,
    entity_id,
    signature,
    metadata
  ) VALUES (
    v_approval.guardian_id,
    'guardian_approval_granted',
    'guardian_action_approval',
    p_approval_id,
    encode(digest(p_approval_id::TEXT || NOW()::TEXT, 'sha256'), 'hex'),
    jsonb_build_object(
      'seller_id', v_approval.seller_id,
      'action_type', v_approval.action_type
    )
  );

  RETURN TRUE;
END;
$$;

-- ============================================================================
-- 4. CHARGEBACK RESERVE SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS chargeback_reserves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  reserve_amount DECIMAL(12,2) NOT NULL,
  reserve_percent DECIMAL(5,2) NOT NULL,
  status TEXT DEFAULT 'held' CHECK (status IN ('held', 'released', 'used')),
  held_until TIMESTAMP WITH TIME ZONE NOT NULL,
  released_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chargeback_reserves_order ON chargeback_reserves(order_id);
CREATE INDEX idx_chargeback_reserves_status ON chargeback_reserves(status);

-- Function to create chargeback reserve (called during order processing)
CREATE OR REPLACE FUNCTION create_chargeback_reserve(
  p_order_id UUID,
  p_goalsquad_margin DECIMAL(12,2)
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reserve_id UUID;
  v_reserve_percent DECIMAL(5,2) := 2.0; -- 2% default
  v_reserve_amount DECIMAL(12,2);
BEGIN
  -- Calculate reserve amount (2% of GoalSquad margin)
  v_reserve_amount := p_goalsquad_margin * (v_reserve_percent / 100);

  -- Create reserve
  INSERT INTO chargeback_reserves (
    order_id,
    reserve_amount,
    reserve_percent,
    held_until
  ) VALUES (
    p_order_id,
    v_reserve_amount,
    v_reserve_percent,
    NOW() + INTERVAL '90 days' -- Hold for 90 days (Stripe dispute window)
  )
  RETURNING id INTO v_reserve_id;

  RETURN v_reserve_id;
END;
$$;

-- ============================================================================
-- 5. MERCHANT TRUST SCORE & DYNAMIC ESCROW
-- ============================================================================

CREATE TABLE IF NOT EXISTS merchant_trust_scores (
  merchant_id UUID PRIMARY KEY REFERENCES merchants(id),
  trust_score INTEGER DEFAULT 50 CHECK (trust_score BETWEEN 0 AND 100),
  total_orders INTEGER DEFAULT 0,
  successful_orders INTEGER DEFAULT 0,
  disputed_orders INTEGER DEFAULT 0,
  refunded_orders INTEGER DEFAULT 0,
  average_delivery_days DECIMAL(5,2),
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to calculate merchant trust score
CREATE OR REPLACE FUNCTION calculate_merchant_trust_score(
  p_merchant_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats RECORD;
  v_trust_score INTEGER;
BEGIN
  -- Get merchant statistics
  SELECT 
    COUNT(*) as total_orders,
    COUNT(*) FILTER (WHERE status = 'delivered') as successful_orders,
    COUNT(*) FILTER (WHERE status = 'disputed') as disputed_orders,
    COUNT(*) FILTER (WHERE status = 'refunded') as refunded_orders
  INTO v_stats
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE oi.merchant_id = p_merchant_id;

  -- Calculate trust score (0-100)
  v_trust_score := 50; -- Base score

  -- Bonus for successful orders
  IF v_stats.total_orders > 0 THEN
    v_trust_score := v_trust_score + 
      (v_stats.successful_orders::DECIMAL / v_stats.total_orders * 30)::INTEGER;
  END IF;

  -- Penalty for disputes
  IF v_stats.disputed_orders > 0 THEN
    v_trust_score := v_trust_score - 
      (v_stats.disputed_orders::DECIMAL / v_stats.total_orders * 20)::INTEGER;
  END IF;

  -- Penalty for refunds
  IF v_stats.refunded_orders > 0 THEN
    v_trust_score := v_trust_score - 
      (v_stats.refunded_orders::DECIMAL / v_stats.total_orders * 15)::INTEGER;
  END IF;

  -- Bonus for volume (max +20)
  v_trust_score := v_trust_score + LEAST(v_stats.total_orders / 10, 20);

  -- Clamp to 0-100
  v_trust_score := GREATEST(0, LEAST(100, v_trust_score));

  -- Update or insert
  INSERT INTO merchant_trust_scores (
    merchant_id,
    trust_score,
    total_orders,
    successful_orders,
    disputed_orders,
    refunded_orders,
    last_calculated_at
  ) VALUES (
    p_merchant_id,
    v_trust_score,
    v_stats.total_orders,
    v_stats.successful_orders,
    v_stats.disputed_orders,
    v_stats.refunded_orders,
    NOW()
  )
  ON CONFLICT (merchant_id) DO UPDATE SET
    trust_score = v_trust_score,
    total_orders = v_stats.total_orders,
    successful_orders = v_stats.successful_orders,
    disputed_orders = v_stats.disputed_orders,
    refunded_orders = v_stats.refunded_orders,
    last_calculated_at = NOW();

  RETURN v_trust_score;
END;
$$;

-- Function to get dynamic escrow days based on trust score
CREATE OR REPLACE FUNCTION get_dynamic_escrow_days(
  p_merchant_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trust_score INTEGER;
  v_escrow_days INTEGER;
BEGIN
  -- Get or calculate trust score
  SELECT trust_score INTO v_trust_score
  FROM merchant_trust_scores
  WHERE merchant_id = p_merchant_id;

  IF v_trust_score IS NULL THEN
    v_trust_score := calculate_merchant_trust_score(p_merchant_id);
  END IF;

  -- Dynamic escrow based on trust score
  CASE
    WHEN v_trust_score >= 80 THEN v_escrow_days := 15; -- High trust: 15 days
    WHEN v_trust_score >= 60 THEN v_escrow_days := 20; -- Medium trust: 20 days
    WHEN v_trust_score >= 40 THEN v_escrow_days := 30; -- Low trust: 30 days
    ELSE v_escrow_days := 45; -- New/untrusted: 45 days
  END CASE;

  RETURN v_escrow_days;
END;
$$;

-- ============================================================================
-- 6. HARDENED RLS POLICIES
-- ============================================================================

-- Drop existing policies that might be too permissive
DROP POLICY IF EXISTS guardian_children_data ON seller_profiles;
DROP POLICY IF EXISTS seller_own_data ON seller_profiles;

-- Recreate with stricter controls
CREATE POLICY seller_own_data_strict ON seller_profiles
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY guardian_children_read_only ON seller_profiles
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM profiles 
      WHERE guardian_id = auth.uid()
      AND role = 'seller'
    )
  );

-- Guardians CANNOT update seller profiles directly
-- They must use secure functions that require second factor

-- Treasury holds can only be created/updated via secure functions
ALTER TABLE treasury_holds ENABLE ROW LEVEL SECURITY;

CREATE POLICY treasury_holds_read ON treasury_holds
  FOR SELECT
  USING (
    holder_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('gs_admin', 'community_treasurer')
    )
  );

-- No direct INSERT/UPDATE/DELETE - must use secure functions
CREATE POLICY treasury_holds_no_direct_write ON treasury_holds
  FOR ALL
  USING (FALSE);

-- Grant execute on secure functions
GRANT EXECUTE ON FUNCTION create_treasury_hold_secure TO authenticated;
GRANT EXECUTE ON FUNCTION release_treasury_hold_secure TO authenticated;
GRANT EXECUTE ON FUNCTION request_guardian_approval TO authenticated;
GRANT EXECUTE ON FUNCTION verify_guardian_approval TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_merchant_trust_score TO authenticated;
GRANT EXECUTE ON FUNCTION get_dynamic_escrow_days TO authenticated;

-- ============================================================================
-- COMMENTS & DOCUMENTATION
-- ============================================================================

COMMENT ON SCHEMA audit_vault IS 'Immutable audit log schema - WORM behavior enforced';
COMMENT ON TABLE audit_vault.immutable_signatures IS 'Write-once audit signatures - cannot be updated or deleted';
COMMENT ON FUNCTION create_treasury_hold_secure IS 'Security Definer function for creating treasury holds - bypasses RLS with validation';
COMMENT ON FUNCTION release_treasury_hold_secure IS 'Security Definer function for releasing treasury holds - enforces hold period';
COMMENT ON TABLE guardian_action_approvals IS 'Second factor approval for guardian destructive actions';
COMMENT ON TABLE chargeback_reserves IS 'Reserve fund to cover chargebacks (2% of GoalSquad margin, held 90 days)';
COMMENT ON TABLE merchant_trust_scores IS 'Merchant reputation score (0-100) for dynamic escrow calculation';
