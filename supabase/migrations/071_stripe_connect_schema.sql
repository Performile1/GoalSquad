-- Migration 071: Stripe Connect Schema
-- Lägger till stöd för Stripe Connected Accounts (Express)
-- För både privatpersoner och företag

-- Lägg till kolumner till profiles-tabellen
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_business_type TEXT DEFAULT 'individual';

-- Skapa tabell för Stripe-konto-status
CREATE TABLE IF NOT EXISTS stripe_account_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL UNIQUE,
  onboarding_status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  payouts_enabled BOOLEAN DEFAULT FALSE,
  charges_enabled BOOLEAN DEFAULT FALSE,
  requirements JSONB DEFAULT '{}',
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skapa index för snabb uppslagning
CREATE INDEX IF NOT EXISTS idx_stripe_account_status_profile_id ON stripe_account_status(profile_id);
CREATE INDEX IF NOT EXISTS idx_stripe_account_status_stripe_id ON stripe_account_status(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_stripe_account_status_payouts_enabled ON stripe_account_status(payouts_enabled) WHERE payouts_enabled = TRUE;

-- Skapa tabell för payout-historik (för spårbarhet)
CREATE TABLE IF NOT EXISTS stripe_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL,
  stripe_transfer_id TEXT NOT NULL UNIQUE,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'SEK',
  status TEXT DEFAULT 'pending', -- 'pending', 'in_transit', 'paid', 'failed'
  payout_run TEXT NOT NULL, -- Format: '2024-W22'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skapa index för payout-historik
CREATE INDEX IF NOT EXISTS idx_stripe_payouts_wallet_id ON stripe_payouts(wallet_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payouts_profile_id ON stripe_payouts(profile_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payouts_status ON stripe_payouts(status);
CREATE INDEX IF NOT EXISTS idx_stripe_payouts_run ON stripe_payouts(payout_run);

-- RLS policies för stripe_account_status
ALTER TABLE stripe_account_status ENABLE ROW LEVEL SECURITY;

-- Användare kan bara se sin egen status
CREATE POLICY "Users can view own stripe status"
  ON stripe_account_status FOR SELECT
  USING (auth.uid() = profile_id);

-- Service role har full åtkomst
CREATE POLICY "Service role full access on stripe_account_status"
  ON stripe_account_status FOR ALL
  USING (auth.role() = 'service_role');

-- RLS policies för stripe_payouts
ALTER TABLE stripe_payouts ENABLE ROW LEVEL SECURITY;

-- Användare kan bara se sina egna payouts
CREATE POLICY "Users can view own payouts"
  ON stripe_payouts FOR SELECT
  USING (auth.uid() = profile_id);

-- Service role har full åtkomst
CREATE POLICY "Service role full access on stripe_payouts"
  ON stripe_payouts FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger för updated_at
CREATE OR REPLACE FUNCTION update_stripe_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stripe_account_status
  BEFORE UPDATE ON stripe_account_status
  FOR EACH ROW
  EXECUTE FUNCTION update_stripe_updated_at();

CREATE TRIGGER trigger_update_stripe_payouts
  BEFORE UPDATE ON stripe_payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_stripe_updated_at();

-- RPC-funktion för att låsa wallet för payout (förhindrar race conditions)
CREATE OR REPLACE FUNCTION get_and_lock_wallet_for_payout(p_profile_id UUID)
RETURNS TABLE (
  id UUID,
  balance NUMERIC,
  currency TEXT,
  owner_type TEXT,
  owner_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT w.id, w.balance, w.currency, w.owner_type, w.owner_id
  FROM wallets w
  WHERE w.owner_id = p_profile_id
    AND w.owner_type IN ('community', 'seller')
  FOR UPDATE OF w; -- Låser raden
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC-funktion för att utföra payout-deduktion atomiskt
CREATE OR REPLACE FUNCTION execute_payout_deduction(
  p_wallet_id UUID,
  p_amount NUMERIC,
  p_stripe_transfer_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_balance NUMERIC;
BEGIN
  -- Hämta nuvarande saldo med radlås
  SELECT balance INTO v_current_balance
  FROM wallets
  WHERE id = p_wallet_id
  FOR UPDATE;

  -- Verifiera att tillräckligt saldo finns
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance for payout';
  END IF;

  -- Dra av från wallet
  UPDATE wallets
  SET balance = balance - p_amount
  WHERE id = p_wallet_id;

  -- Skapa ledger entry
  INSERT INTO ledger_entries (
    wallet_id,
    amount,
    currency,
    entry_type,
    description,
    metadata
  ) VALUES (
    p_wallet_id,
    -p_amount,
    'SEK',
    'payout',
    'Stripe Connect payout',
    jsonb_build_object(
      'stripe_transfer_id', p_stripe_transfer_id,
      'payout_type', 'stripe_connect'
    )
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC-funktion för att skapa payout-post
CREATE OR REPLACE FUNCTION create_payout_record(
  p_wallet_id UUID,
  p_profile_id UUID,
  p_stripe_account_id TEXT,
  p_stripe_transfer_id TEXT,
  p_amount NUMERIC,
  p_payout_run TEXT
)
RETURNS UUID AS $$
DECLARE
  v_payout_id UUID;
BEGIN
  INSERT INTO stripe_payouts (
    wallet_id,
    profile_id,
    stripe_account_id,
    stripe_transfer_id,
    amount,
    currency,
    status,
    payout_run
  ) VALUES (
    p_wallet_id,
    p_profile_id,
    p_stripe_account_id,
    p_stripe_transfer_id,
    p_amount,
    'SEK',
    'in_transit',
    p_payout_run
  )
  RETURNING id INTO v_payout_id;

  RETURN v_payout_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kommentar för dokumentation
COMMENT ON TABLE stripe_account_status IS 'Spårar Stripe Connected Account status för onboarding och payouts';
COMMENT ON TABLE stripe_payouts IS 'Historik över alla Stripe Connect payouts för spårbarhet och reconciliation';
COMMENT ON FUNCTION get_and_lock_wallet_for_payout IS 'Låser wallet rad för payout för att förhindra race conditions';
COMMENT ON FUNCTION execute_payout_deduction IS 'Atomiskt drar av saldo och skapar ledger entry för payout';
COMMENT ON FUNCTION create_payout_record IS 'Skapar payout-post i historiken';
