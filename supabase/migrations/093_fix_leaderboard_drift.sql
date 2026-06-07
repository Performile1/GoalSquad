-- ====================================================================
-- 093_fix_leaderboard_drift.sql
--
-- Closes two schema-drift gaps discovered during Fas 4:
--   1. xp_events table — referenced by GamificationEngine.awardXP (insert)
--      and AntiCheat.getRecentXPEvents (read), but missing from the DB,
--      so XP logging fails silently today.
--   2. get_seller_leaderboard(date_filter, result_limit) — called by
--      /api/leaderboard but missing, forcing the route into its fallback.
--
-- IMPORTANT: column/param shapes below match the ACTUAL application code,
-- not a generic draft:
--   * awardXP inserts: user_id, event_type, xp_amount, reference_id, metadata
--   * leaderboard route calls rpc('get_seller_leaderboard',
--       { date_filter, result_limit }) and maps rows to
--       user_id, full_name, avatar_url, community_name,
--       total_sales, total_orders, current_level.
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. xp_events — XP audit log
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.xp_events (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL,
    event_type   VARCHAR(50) NOT NULL,   -- 'sale_completed', 'streak_bonus', 'achievement_unlocked', ...
    xp_amount    INTEGER NOT NULL,
    reference_id TEXT,                    -- order id / achievement id (kept TEXT: not always a UUID)
    metadata     JSONB,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xp_events_user_created
    ON public.xp_events(user_id, created_at DESC);

ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

-- Writes happen via the service role (bypasses RLS). Users may read their own log.
DROP POLICY IF EXISTS "xp_events_owner_read" ON public.xp_events;
CREATE POLICY "xp_events_owner_read" ON public.xp_events
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "xp_events_service_all" ON public.xp_events;
CREATE POLICY "xp_events_service_all" ON public.xp_events
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- --------------------------------------------------------------------
-- 2. get_seller_leaderboard — matches the caller's signature
--    Params are named date_filter / result_limit to match the
--    PostgREST rpc() call. Ranking uses the cached seller_profiles
--    aggregates (total_sales), so period filtering via date_filter is
--    NOT applied here (the route's fallback ignores period too).
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_seller_leaderboard(
    date_filter   TEXT DEFAULT '',
    result_limit  INTEGER DEFAULT 50
)
RETURNS TABLE (
    user_id        UUID,
    full_name      TEXT,
    avatar_url     TEXT,
    community_name TEXT,
    total_sales    NUMERIC,
    total_orders   INTEGER,
    current_level  INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        sp.user_id,
        p.full_name::TEXT,
        p.avatar_url::TEXT,
        c.name::TEXT          AS community_name,
        COALESCE(sp.total_sales, 0)  AS total_sales,
        COALESCE(sp.total_orders, 0) AS total_orders,
        COALESCE(sp.current_level, 1) AS current_level
    FROM public.seller_profiles sp
    LEFT JOIN public.profiles    p ON p.id = sp.user_id
    LEFT JOIN public.communities c ON c.id = sp.community_id
    ORDER BY sp.total_sales DESC NULLS LAST, sp.xp_total DESC NULLS LAST
    LIMIT result_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.get_seller_leaderboard(TEXT, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_seller_leaderboard(TEXT, INTEGER) TO service_role, authenticated;
