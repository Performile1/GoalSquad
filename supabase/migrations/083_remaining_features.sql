-- =====================================================================
-- GOALSQUAD MIGRATION: REMAINING FEATURES FROM GAP ANALYSIS
-- =====================================================================
-- Denna migration lägger till de mest kritiska saknade tabellarna
-- för att komplettera core features implementationen

BEGIN;

-- ---------------------------------------------------------------------
-- 1. ADDRESS BOOK TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.address_book (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    full_name TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'SE',
    phone TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_address_book_user_id ON public.address_book(user_id);
CREATE INDEX IF NOT EXISTS idx_address_book_is_default ON public.address_book(user_id, is_default);

-- Trigger för updated_at
CREATE OR REPLACE FUNCTION address_book_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS address_book_updated_at_trigger ON public.address_book;
CREATE TRIGGER address_book_updated_at_trigger
    BEFORE UPDATE ON public.address_book
    FOR EACH ROW
    EXECUTE FUNCTION address_book_updated_at();

-- RLS
ALTER TABLE public.address_book ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'address_book' AND policyname = 'Users can view their own addresses'
  ) THEN
    CREATE POLICY "Users can view their own addresses" ON public.address_book
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'address_book' AND policyname = 'Users can insert their own addresses'
  ) THEN
    CREATE POLICY "Users can insert their own addresses" ON public.address_book
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'address_book' AND policyname = 'Users can update their own addresses'
  ) THEN
    CREATE POLICY "Users can update their own addresses" ON public.address_book
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'address_book' AND policyname = 'Users can delete their own addresses'
  ) THEN
    CREATE POLICY "Users can delete their own addresses" ON public.address_book
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 2. PRODUCT REVIEWS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    verified_purchase BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, product_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON public.product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON public.product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created_at ON public.product_reviews(created_at DESC);

-- Trigger för updated_at
DROP TRIGGER IF EXISTS product_reviews_updated_at_trigger ON public.product_reviews;
CREATE TRIGGER product_reviews_updated_at_trigger
    BEFORE UPDATE ON public.product_reviews
    FOR EACH ROW
    EXECUTE FUNCTION address_book_updated_at();

-- RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'product_reviews' AND policyname = 'authenticated_view_reviews'
  ) THEN
    CREATE POLICY "authenticated_view_reviews"
      ON public.product_reviews FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'product_reviews' AND policyname = 'users_insert_own_reviews'
  ) THEN
    CREATE POLICY "users_insert_own_reviews" ON public.product_reviews
      FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE POLICY "users_update_own_reviews" ON public.product_reviews
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_delete_own_reviews" ON public.product_reviews
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.product_reviews;
CREATE POLICY "Users can update their own reviews" ON public.product_reviews
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.product_reviews;
CREATE POLICY "Users can delete their own reviews" ON public.product_reviews
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 3. REFERRALS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    referral_code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
    bonus_amount DECIMAL(10, 2) DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);

-- RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own referrals" ON public.referrals;
CREATE POLICY "Users can view their own referrals" ON public.referrals
    FOR SELECT
    TO authenticated
    USING (referrer_id = auth.uid() OR referred_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert referrals" ON public.referrals;
CREATE POLICY "Users can insert referrals" ON public.referrals
    FOR INSERT
    TO authenticated
    WITH CHECK (referrer_id = auth.uid());

-- ---------------------------------------------------------------------
-- 4. LOYALTY POINTS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loyalty_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    points INTEGER NOT NULL DEFAULT 0,
    tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    points_earned INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_points_user_id ON public.loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_tier ON public.loyalty_points(tier);

-- Trigger för updated_at
DROP TRIGGER IF EXISTS loyalty_points_updated_at_trigger ON public.loyalty_points;
CREATE TRIGGER loyalty_points_updated_at_trigger
    BEFORE UPDATE ON public.loyalty_points
    FOR EACH ROW
    EXECUTE FUNCTION address_book_updated_at();

-- RLS
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own loyalty points" ON public.loyalty_points;
CREATE POLICY "Users can view their own loyalty points" ON public.loyalty_points
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 5. LOYALTY TRANSACTIONS TABLE (för spårning av poäng)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earned', 'redeemed', 'expired', 'adjusted')),
    reason TEXT,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON public.loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type ON public.loyalty_transactions(type);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON public.loyalty_transactions(created_at DESC);

-- RLS
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own loyalty transactions" ON public.loyalty_transactions;
CREATE POLICY "Users can view their own loyalty transactions" ON public.loyalty_transactions
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 6. RETURN LABELS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.return_labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID NOT NULL REFERENCES public.returns(id) ON DELETE CASCADE,
    label_url TEXT NOT NULL,
    tracking_number TEXT,
    carrier TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_return_labels_return_id ON public.return_labels(return_id);
CREATE INDEX IF NOT EXISTS idx_return_labels_tracking_number ON public.return_labels(tracking_number);

-- RLS
ALTER TABLE public.return_labels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view labels for their returns" ON public.return_labels;
CREATE POLICY "Users can view labels for their returns" ON public.return_labels
    FOR SELECT
    TO authenticated
    USING (
      return_id IN (
        SELECT id FROM public.returns 
        WHERE customer_id = auth.uid()
      )
    );

-- ---------------------------------------------------------------------
-- 7. RETURN REFUNDS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.return_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID NOT NULL REFERENCES public.returns(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'SEK',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    refund_method TEXT,
    refund_id TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_return_refunds_return_id ON public.return_refunds(return_id);
CREATE INDEX IF NOT EXISTS idx_return_refunds_status ON public.return_refunds(status);

-- RLS
ALTER TABLE public.return_refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view refunds for their returns" ON public.return_refunds;
CREATE POLICY "Users can view refunds for their returns" ON public.return_refunds
    FOR SELECT
    TO authenticated
    USING (
      return_id IN (
        SELECT id FROM public.returns 
        WHERE customer_id = auth.uid()
      )
    );

-- ---------------------------------------------------------------------
-- 8. API KEYS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);

-- RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'api_keys' AND policyname = 'users_view_own_api_keys'
  ) THEN
    CREATE POLICY "users_view_own_api_keys" ON public.api_keys
      FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'api_keys' AND policyname = 'users_insert_own_api_keys'
  ) THEN
    CREATE POLICY "users_insert_own_api_keys" ON public.api_keys
      FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'api_keys' AND policyname = 'users_update_own_api_keys'
  ) THEN
    CREATE POLICY "users_update_own_api_keys" ON public.api_keys
      FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'api_keys' AND policyname = 'users_delete_own_api_keys'
  ) THEN
    CREATE POLICY "users_delete_own_api_keys" ON public.api_keys
      FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

COMMIT;

-- =====================================================================
-- NOTERINGAR
-- =====================================================================
-- Denna migration lägger till de mest kritiska saknade tabellarna:
-- 1. address_book - för hantering av flera leveransadresser
-- 2. product_reviews - för produktrecensioner och betyg
-- 3. referrals - för referralsystem
-- 4. loyalty_points & loyalty_transactions - för lojalitetsprogram
-- 5. return_labels - för returfraktslabels
-- 6. return_refunds - för returåterbetalningar
-- 7. api_keys - för API-nyckelhantering
--
-- Alla tabeller har RLS policies för säker åtkomstkontroll
