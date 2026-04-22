-- Migration 037: Pick & Pack support tables
-- Adds barcode, location, and pick session tracking to order system

-- Add barcode/EAN and location columns to order_items if they exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'order_items' AND schemaname = 'public') THEN
    ALTER TABLE public.order_items
      ADD COLUMN IF NOT EXISTS barcode TEXT,
      ADD COLUMN IF NOT EXISTS ean VARCHAR(20),
      ADD COLUMN IF NOT EXISTS location_code VARCHAR(50);
  END IF;
END $$;

-- Add pick tracking columns to orders
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'orders' AND schemaname = 'public') THEN
    ALTER TABLE public.orders
      ADD COLUMN IF NOT EXISTS pick_status VARCHAR(20) DEFAULT 'not_started'
        CHECK (pick_status IN ('not_started', 'in_progress', 'completed')),
      ADD COLUMN IF NOT EXISTS packed_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS tracking_number TEXT,
      ADD COLUMN IF NOT EXISTS warehouse_id UUID;
  END IF;
END $$;

-- Pick sessions table — one session per order pick
CREATE TABLE IF NOT EXISTS public.pick_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  picker_id UUID NOT NULL,
  warehouse_id UUID,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pick session items — track individual item scans
CREATE TABLE IF NOT EXISTS public.pick_session_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.pick_sessions(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL,
  product_id UUID,
  sku TEXT NOT NULL,
  required_quantity INTEGER NOT NULL,
  scanned_quantity INTEGER DEFAULT 0,
  is_complete BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product barcodes — support multiple barcodes per product (EAN, GS1, custom)
CREATE TABLE IF NOT EXISTS public.product_barcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  barcode_type VARCHAR(20) NOT NULL DEFAULT 'internal' CHECK (barcode_type IN ('ean13', 'ean8', 'upc', 'gs1', 'internal', 'qr')),
  barcode_value TEXT NOT NULL UNIQUE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add barcode to products if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'products' AND schemaname = 'public') THEN
    ALTER TABLE public.products
      ADD COLUMN IF NOT EXISTS primary_barcode TEXT,
      ADD COLUMN IF NOT EXISTS ean VARCHAR(20),
      ADD COLUMN IF NOT EXISTS warehouse_location VARCHAR(50);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pick_sessions_order ON public.pick_sessions(order_id);
CREATE INDEX IF NOT EXISTS idx_pick_sessions_picker ON public.pick_sessions(picker_id);
CREATE INDEX IF NOT EXISTS idx_pick_session_items_session ON public.pick_session_items(session_id);
CREATE INDEX IF NOT EXISTS idx_product_barcodes_value ON public.product_barcodes(barcode_value);
CREATE INDEX IF NOT EXISTS idx_product_barcodes_product ON public.product_barcodes(product_id);

-- RLS
ALTER TABLE public.pick_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pick_session_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_barcodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pick_sessions_service_role" ON public.pick_sessions;
DROP POLICY IF EXISTS "pick_sessions_authenticated" ON public.pick_sessions;
CREATE POLICY "pick_sessions_service_role" ON public.pick_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "pick_sessions_authenticated" ON public.pick_sessions FOR ALL TO authenticated USING (picker_id = auth.uid() OR true) WITH CHECK (true);

DROP POLICY IF EXISTS "pick_session_items_service_role" ON public.pick_session_items;
DROP POLICY IF EXISTS "pick_session_items_authenticated" ON public.pick_session_items;
CREATE POLICY "pick_session_items_service_role" ON public.pick_session_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "pick_session_items_authenticated" ON public.pick_session_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "product_barcodes_read" ON public.product_barcodes;
DROP POLICY IF EXISTS "product_barcodes_write" ON public.product_barcodes;
CREATE POLICY "product_barcodes_read" ON public.product_barcodes FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "product_barcodes_write" ON public.product_barcodes FOR ALL TO service_role USING (true) WITH CHECK (true);

DO $$ BEGIN RAISE NOTICE 'Migration 037: Pick & Pack tables created'; END $$;
