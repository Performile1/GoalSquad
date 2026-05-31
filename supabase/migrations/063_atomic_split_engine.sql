-- ============================================================
-- 063_atomic_split_engine.sql
--
-- Moves the money-splitting logic out of the application layer
-- (lib/split-engine.ts) and into a single atomic Postgres function.
--
-- Why:
--   * Atomicity      — the whole split runs in ONE transaction. Any failure
--                      rolls everything back (no half-credited wallets).
--   * No race        — the order row is locked with FOR UPDATE, so concurrent
--                      Stripe webhook retries serialize instead of double-paying.
--   * Exact money    — DECIMAL math in Postgres is exact (no JS float drift).
--   * Idempotent     — re-running for the same order is a no-op.
--   * Residual model — platform share = total − (community+seller+warehouse+handling),
--                      so we can NEVER pay out more than we collected.
--   * Real escrow    — seller/warehouse shares go to treasury_holds (held),
--                      NOT credited to the wallet immediately. This removes the
--                      previous double-pay bug (wallet credit + parallel hold).
--
-- SAFETY: Review on a branch/staging DB with a backup before applying to prod.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Stripe event de-duplication table (webhook idempotency)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id           TEXT PRIMARY KEY,                 -- Stripe event id (evt_...)
  type         TEXT NOT NULL,
  received_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stripe_events_service_role" ON public.stripe_events;
CREATE POLICY "stripe_events_service_role"
  ON public.stripe_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 1b. Deduplicate wallets sharing (owner_type, owner_id)
--     The schema has two historical wallets definitions (034 vs 038), which
--     allowed duplicate owner rows (e.g. the platform wallet). We must merge
--     them BEFORE adding the unique index below.
--
--     Strategy: keep the OLDEST row per (owner_type, owner_id) as survivor,
--     repoint ledger references to it, fold the duplicates' balances in,
--     then delete the duplicates. Run inside one transaction (all-or-nothing).
-- ------------------------------------------------------------
DO $$
BEGIN
  DROP TABLE IF EXISTS _wallet_dups;

  -- Map every duplicate row to its survivor (oldest by created_at, then id).
  CREATE TEMP TABLE _wallet_dups AS
  SELECT id AS dup_id,
         FIRST_VALUE(id) OVER (
           PARTITION BY owner_type, owner_id
           ORDER BY created_at ASC, id ASC
         ) AS keep_id
  FROM public.wallets
  WHERE owner_type IS NOT NULL AND owner_id IS NOT NULL;

  DELETE FROM _wallet_dups WHERE dup_id = keep_id;  -- survivors aren't dups

  -- Repoint ledger entries to the survivor wallet.
  UPDATE public.ledger_entries le
     SET wallet_id = d.keep_id
    FROM _wallet_dups d
   WHERE le.wallet_id = d.dup_id;

  -- Repoint treasury_holds.released_to_wallet_id if that column exists.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'treasury_holds'
      AND column_name = 'released_to_wallet_id'
  ) THEN
    UPDATE public.treasury_holds th
       SET released_to_wallet_id = d.keep_id
      FROM _wallet_dups d
     WHERE th.released_to_wallet_id = d.dup_id;
  END IF;

  -- Fold duplicate balances into the survivor.
  UPDATE public.wallets w
     SET balance = w.balance + agg.extra, updated_at = NOW()
    FROM (
      SELECT d.keep_id, SUM(w2.balance) AS extra
        FROM _wallet_dups d
        JOIN public.wallets w2 ON w2.id = d.dup_id
       GROUP BY d.keep_id
    ) agg
   WHERE w.id = agg.keep_id;

  -- Remove the now-merged duplicates.
  DELETE FROM public.wallets WHERE id IN (SELECT dup_id FROM _wallet_dups);

  DROP TABLE IF EXISTS _wallet_dups;
END $$;

-- ------------------------------------------------------------
-- 2. Unique index on wallet ownership (required for safe upsert)
-- ------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallets_owner_unique
  ON public.wallets(owner_type, owner_id);

-- ------------------------------------------------------------
-- 3. The atomic split function
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_order_split(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  PLATFORM_OWNER  CONSTANT UUID := '00000000-0000-0000-0000-000000000001';
  HOLD_DAYS       CONSTANT INT  := 30;

  -- The order is read as JSONB (to_jsonb) so the function tolerates schema
  -- differences: a missing column simply yields NULL instead of erroring.
  v_order      JSONB;
  v_order_num  TEXT;
  v_community_id UUID;
  v_seller_id    UUID;
  v_warehouse_id UUID;

  v_cfg        RECORD;
  v_txn        UUID := gen_random_uuid();
  v_currency   TEXT;
  v_total      NUMERIC(12,2);
  v_handling   NUMERIC(12,2);
  v_community  NUMERIC(12,2);
  v_seller     NUMERIC(12,2);
  v_warehouse  NUMERIC(12,2);
  v_platform   NUMERIC(12,2);
  v_platform_wallet_id  UUID;
  v_community_wallet_id UUID;
BEGIN
  -- (a) Lock the order row — serializes concurrent webhook deliveries.
  PERFORM 1 FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found:%', p_order_id USING ERRCODE = 'no_data_found';
  END IF;

  -- Read the locked row as JSONB (schema-tolerant field access).
  SELECT to_jsonb(o) INTO v_order FROM public.orders o WHERE o.id = p_order_id;

  -- (b) Idempotency guard — already split? Return without doing anything.
  IF EXISTS (
    SELECT 1 FROM public.ledger_entries
    WHERE reference_type = 'order' AND reference_id = p_order_id
  ) THEN
    RETURN jsonb_build_object('status', 'already_processed', 'order_id', p_order_id);
  END IF;

  v_currency     := COALESCE(v_order->>'currency', 'SEK');
  v_total        := COALESCE((v_order->>'total_amount')::numeric, (v_order->>'total')::numeric, 0);
  v_order_num    := COALESCE(v_order->>'order_number', p_order_id::text);
  v_community_id := NULLIF(v_order->>'community_id', '')::uuid;
  v_seller_id    := NULLIF(v_order->>'seller_id', '')::uuid;
  v_warehouse_id := NULLIF(v_order->>'warehouse_id', '')::uuid;

  -- (c) Resolve the active split configuration (most specific first).
  SELECT * INTO v_cfg
  FROM public.split_configurations
  WHERE active = true
  ORDER BY (merchant_id IS NOT NULL) DESC, (community_id IS NOT NULL) DESC
  LIMIT 1;

  IF NOT FOUND THEN
    v_cfg.community_percent := 60;
    v_cfg.seller_percent    := 20;
    v_cfg.warehouse_percent := 8;
    v_cfg.handling_fee      := 25;
  END IF;

  v_handling  := COALESCE(v_cfg.handling_fee, 0);
  v_community := ROUND(v_total * v_cfg.community_percent / 100, 2);
  v_seller    := ROUND(v_total * v_cfg.seller_percent    / 100, 2);
  v_warehouse := ROUND(v_total * v_cfg.warehouse_percent / 100, 2);

  -- Parties not present on the order forfeit their share to the platform,
  -- guaranteeing the ledger balances to the total.
  IF v_community_id IS NULL THEN v_community := 0; END IF;
  IF v_seller_id    IS NULL THEN v_seller    := 0; END IF;
  IF v_warehouse_id IS NULL THEN v_warehouse := 0; END IF;

  -- (d) RESIDUAL platform share — never computed independently.
  v_platform := v_total - v_community - v_seller - v_warehouse - v_handling;

  -- (e) Minimum-order-value guard: never pay out more than collected.
  IF v_platform < 0 THEN
    RAISE EXCEPTION 'order_below_minimum:% (platform residual % < 0)', p_order_id, v_platform
      USING ERRCODE = 'check_violation';
  END IF;

  -- (f) Ensure + lock the platform wallet, credit platform share + handling fee.
  INSERT INTO public.wallets (owner_type, owner_id, currency, balance)
  VALUES ('platform', PLATFORM_OWNER, v_currency, 0)
  ON CONFLICT (owner_type, owner_id) DO NOTHING;

  UPDATE public.wallets
     SET balance = balance + v_platform + v_handling, updated_at = NOW()
   WHERE owner_type = 'platform' AND owner_id = PLATFORM_OWNER
  RETURNING id INTO v_platform_wallet_id;

  INSERT INTO public.ledger_entries
    (transaction_id, wallet_id, entry_type, amount, currency, reference_type, reference_id, description, metadata)
  VALUES
    (v_txn, v_platform_wallet_id, 'credit', v_platform, v_currency, 'order', p_order_id,
     'Platform share for order ' || v_order_num,
     jsonb_build_object('category', 'platform_share')),
    (v_txn, v_platform_wallet_id, 'fee', v_handling, v_currency, 'order', p_order_id,
     'Handling fee for order ' || v_order_num,
     jsonb_build_object('category', 'handling_fee'));

  -- (g) Community share — credited immediately (available).
  IF v_community > 0 THEN
    INSERT INTO public.wallets (owner_type, owner_id, currency, balance)
    VALUES ('community', v_community_id, v_currency, 0)
    ON CONFLICT (owner_type, owner_id) DO NOTHING;

    UPDATE public.wallets
       SET balance = balance + v_community, updated_at = NOW()
     WHERE owner_type = 'community' AND owner_id = v_community_id
    RETURNING id INTO v_community_wallet_id;

    INSERT INTO public.ledger_entries
      (transaction_id, wallet_id, entry_type, amount, currency, reference_type, reference_id, description, metadata)
    VALUES
      (v_txn, v_community_wallet_id, 'credit', v_community, v_currency, 'order', p_order_id,
       'Community share for order ' || v_order_num,
       jsonb_build_object('category', 'community_share'));
  END IF;

  -- (h) Seller share — 30-day ESCROW (held, NOT credited to wallet yet).
  IF v_seller > 0 THEN
    INSERT INTO public.treasury_holds
      (order_id, holder_type, holder_id, amount, currency, hold_days, hold_until, status)
    VALUES
      (p_order_id, 'seller', v_seller_id, v_seller, v_currency, HOLD_DAYS,
       NOW() + (HOLD_DAYS || ' days')::interval, 'held');

    INSERT INTO public.ledger_entries
      (transaction_id, wallet_id, entry_type, amount, currency, reference_type, reference_id, description, metadata)
    VALUES
      (v_txn, NULL, 'hold', v_seller, v_currency, 'order', p_order_id,
       'Seller escrow for order ' || v_order_num,
       jsonb_build_object('category', 'seller_share', 'holder_type', 'seller', 'holder_id', v_seller_id));
  END IF;

  -- (i) Warehouse share — 30-day ESCROW.
  IF v_warehouse > 0 THEN
    INSERT INTO public.treasury_holds
      (order_id, holder_type, holder_id, amount, currency, hold_days, hold_until, status)
    VALUES
      (p_order_id, 'warehouse', v_warehouse_id, v_warehouse, v_currency, HOLD_DAYS,
       NOW() + (HOLD_DAYS || ' days')::interval, 'held');

    INSERT INTO public.ledger_entries
      (transaction_id, wallet_id, entry_type, amount, currency, reference_type, reference_id, description, metadata)
    VALUES
      (v_txn, NULL, 'hold', v_warehouse, v_currency, 'order', p_order_id,
       'Warehouse escrow for order ' || v_order_num,
       jsonb_build_object('category', 'warehouse_share', 'holder_type', 'warehouse', 'holder_id', v_warehouse_id));
  END IF;

  RETURN jsonb_build_object(
    'status',         'processed',
    'order_id',       p_order_id,
    'transaction_id', v_txn,
    'total',          v_total,
    'splits', jsonb_build_object(
      'platform',  v_platform,
      'handling',  v_handling,
      'community', v_community,
      'seller',    v_seller,
      'warehouse', v_warehouse
    )
  );
END;
$$;

-- ------------------------------------------------------------
-- 4. Atomic escrow release (replaces read-modify-write in treasury.ts)
--    Conditionally flips status; only credits the wallet if THIS call won
--    the race (one row affected). Prevents double-release.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.release_treasury_hold(p_hold_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hold      RECORD;
  v_wallet_id UUID;
BEGIN
  -- Atomically claim the hold: only succeeds if it was still 'held'.
  UPDATE public.treasury_holds
     SET status = 'released', released_at = NOW(), updated_at = NOW()
   WHERE id = p_hold_id AND status = 'held'
  RETURNING * INTO v_hold;

  IF NOT FOUND THEN
    RETURN FALSE;  -- already processed / not found / lost the race
  END IF;

  INSERT INTO public.wallets (owner_type, owner_id, currency, balance)
  VALUES (v_hold.holder_type, v_hold.holder_id, v_hold.currency, 0)
  ON CONFLICT (owner_type, owner_id) DO NOTHING;

  UPDATE public.wallets
     SET balance = balance + v_hold.amount, updated_at = NOW()
   WHERE owner_type = v_hold.holder_type AND owner_id = v_hold.holder_id
  RETURNING id INTO v_wallet_id;

  INSERT INTO public.ledger_entries
    (transaction_id, wallet_id, entry_type, amount, currency, reference_type, reference_id, description, metadata)
  VALUES
    (gen_random_uuid(), v_wallet_id, 'release', v_hold.amount, v_hold.currency, 'order', v_hold.order_id,
     'Treasury release for order ' || v_hold.order_id::text,
     jsonb_build_object('category', v_hold.holder_type || '_payout', 'holder_type', v_hold.holder_type, 'holder_id', v_hold.holder_id));

  RETURN TRUE;
END;
$$;

-- Lock down execution: only the service role (server) may call these.
REVOKE ALL ON FUNCTION public.process_order_split(UUID)   FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_treasury_hold(UUID)  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_order_split(UUID)  TO service_role;
GRANT EXECUTE ON FUNCTION public.release_treasury_hold(UUID) TO service_role;
