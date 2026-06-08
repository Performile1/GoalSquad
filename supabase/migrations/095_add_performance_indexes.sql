/**
 * ============================================================
 * MIGRATION 095 — PERFORMANCE INDEXES FOR HOT TABLES
 * ============================================================
 *
 * Adds indexes on frequently queried foreign keys and status
 * columns to prevent full table scans as the dataset grows.
 * ============================================================
 */

-- Orders: seller lookups + status filtering
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_community_id ON public.orders(community_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Community products: active listings
CREATE INDEX IF NOT EXISTS idx_community_products_status ON public.community_products(status);
CREATE INDEX IF NOT EXISTS idx_community_products_approved_by ON public.community_products(approved_by);
CREATE INDEX IF NOT EXISTS idx_community_products_category ON public.community_products(category);

-- Campaigns: type + status lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON public.campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);

-- Seller profiles: user_id lookup (used in almost every seller API call)
CREATE INDEX IF NOT EXISTS idx_seller_profiles_user_id ON public.seller_profiles(user_id);

-- Ledger entries: seller balance calculations
CREATE INDEX IF NOT EXISTS idx_ledger_entries_wallet ON public.ledger_entries(wallet_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_type ON public.ledger_entries(entry_type);

-- Notifications: user inbox
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(recipient_id, read_at) WHERE read_at IS NULL;
