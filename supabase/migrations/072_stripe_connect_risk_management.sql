-- Migration 072: Stripe Connect Risk Management & On-Demand Payouts
-- Lägger till frysskydd, manuella utbetalningar och plattformsinställningar

-- 1. Lägg till frysskydd till stripe_account_status
ALTER TABLE stripe_account_status 
ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS frozen_reason TEXT;

-- 2. Lägg till avgift-kolumn till stripe_payouts för spårbarhet
ALTER TABLE stripe_payouts 
ADD COLUMN IF NOT EXISTS fee_charged NUMERIC(10, 2) DEFAULT 0;

-- 3. Skapa platform_settings tabell för konfiguration
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lägg till standardavgiften på 25 kr (sparas i ören för precision, 2500 ören = 25 SEK)
INSERT INTO platform_settings (key, value) 
VALUES ('manual_payout_config', '{"fee_sek": 25, "min_payout_sek": 100}')
ON CONFLICT (key) DO NOTHING;

-- RLS för platform_settings (endast service role)
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on platform_settings"
  ON platform_settings FOR ALL
  USING (auth.role() = 'service_role');

-- 4. RPC-funktion för att låsa plånbok för manuellt uttag
CREATE OR REPLACE FUNCTION get_and_lock_wallet_for_manual_payout(
  p_profile_id UUID, 
  p_min_required NUMERIC
)
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
    AND w.balance >= p_min_required
  FOR UPDATE OF w; -- Låser raden till transaktionen slutförts
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC-funktion för att utföra manuell payout-deduktion
CREATE OR REPLACE FUNCTION execute_manual_payout_deduction(
  p_wallet_id UUID, 
  p_total_deducted NUMERIC, 
  p_fee_retained NUMERIC,
  p_stripe_transfer_id TEXT,
  p_profile_id UUID
) RETURNS VOID AS $$
BEGIN
  -- Minska saldet till 0 (eller dra av hela beloppet)
  UPDATE wallets 
  SET balance = balance - p_total_deducted 
  WHERE id = p_wallet_id;

  -- Skapa post i utbetalningshistoriken
  INSERT INTO stripe_payouts (
    wallet_id, 
    profile_id,
    stripe_account_id,
    stripe_transfer_id,
    amount,
    fee_charged,
    currency,
    status,
    payout_run,
    created_at
  ) VALUES (
    p_wallet_id,
    p_profile_id,
    (SELECT stripe_account_id FROM profiles WHERE id = p_profile_id),
    p_stripe_transfer_id,
    (p_total_deducted - p_fee_retained),
    p_fee_retained,
    'SEK',
    'in_transit',
    'manual',
    NOW()
  );

  -- Skapa ledger entry för hela avdraget
  INSERT INTO ledger_entries (
    wallet_id,
    amount,
    currency,
    entry_type,
    description,
    metadata
  ) VALUES (
    p_wallet_id,
    -p_total_deducted,
    'SEK',
    'payout',
    'Manual on-demand payout',
    jsonb_build_object(
      'stripe_transfer_id', p_stripe_transfer_id,
      'payout_type', 'manual_on_demand',
      'fee_retained', p_fee_retained,
      'net_sent', (p_total_deducted - p_fee_retained)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC-funktion för att frysa/avfrysa konto
CREATE OR REPLACE FUNCTION toggle_account_freeze(
  p_profile_id UUID,
  p_freeze BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_stripe_account_id TEXT;
BEGIN
  -- Hämta stripe_account_id
  SELECT stripe_account_id INTO v_stripe_account_id
  FROM profiles
  WHERE id = p_profile_id;

  IF v_stripe_account_id IS NULL THEN
    RAISE EXCEPTION 'No Stripe account found for profile';
  END IF;

  -- Uppdatera freeze-status
  UPDATE stripe_account_status
  SET 
    is_frozen = p_freeze,
    frozen_reason = p_reason,
    updated_at = NOW()
  WHERE profile_id = p_profile_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Vy för payout analytics rollup (för dashboard)
CREATE OR REPLACE VIEW payout_analytics_rollup AS
SELECT 
  w.owner_id AS profile_id,
  w.owner_type,
  w.balance AS available_balance,
  COALESCE(
    SUM(CASE WHEN le.entry_type = 'payout' AND le.amount < 0 THEN ABS(le.amount) ELSE 0 END)
    FILTER (WHERE le.metadata->>'payout_status' = 'pending'),
    0
  ) AS processing_balance,
  COALESCE(
    SUM(sp.amount)
    FILTER (WHERE sp.status IN ('paid', 'settled')),
    0
  ) AS total_paid_out,
  COUNT(sp.id) FILTER (WHERE sp.status IN ('paid', 'settled')) AS payout_count
FROM wallets w
LEFT JOIN ledger_entries le ON le.wallet_id = w.id
LEFT JOIN stripe_payouts sp ON sp.wallet_id = w.id
WHERE w.owner_type IN ('community', 'seller')
GROUP BY w.owner_id, w.owner_type, w.balance;

-- Index för prestanda på analytics-vyn
CREATE INDEX IF NOT EXISTS idx_ledger_entries_wallet_type ON ledger_entries(wallet_id, entry_type);
CREATE INDEX IF NOT EXISTS idx_stripe_payouts_status ON stripe_payouts(status);

-- Kommentarer
COMMENT ON TABLE platform_settings IS 'Central konfiguration för plattformsinställningar (avgifter, gränser, etc)';
COMMENT ON COLUMN stripe_account_status.is_frozen IS 'Risk kill-switch: om true blockeras alla utbetalningar';
COMMENT ON COLUMN stripe_payouts.fee_charged IS 'Avgift som behållits av plattformen för denna utbetalning';
COMMENT ON VIEW payout_analytics_rollup IS 'Aggregerad finansiell översikt för dashboard (tillgängligt, processas, utbetalt)';
