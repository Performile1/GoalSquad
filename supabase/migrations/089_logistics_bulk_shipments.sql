-- =====================================================================
-- GOALSQUAD MIGRATION: LOGISTICS BULK SHIPMENTS
-- =====================================================================
-- Logistik: Tabell för samlade leveranser till lagföräldrar/föreningar

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Tabell för att spåra samlade leveranser (Bulk Shipments)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bulk_shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE RESTRICT,
    merchant_id UUID NOT NULL,
    warehouse_id UUID NOT NULL,
    shipping_provider TEXT NOT NULL,
    tracking_number TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'picking', 'shipped', 'delivered')),
    total_boxes INT DEFAULT 0,
    total_weight_kg NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index för snabb sökning per kampanj
CREATE INDEX IF NOT EXISTS idx_bulk_shipments_campaign ON public.bulk_shipments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_bulk_shipments_status ON public.bulk_shipments(status);
CREATE INDEX IF NOT EXISTS idx_bulk_shipments_merchant ON public.bulk_shipments(merchant_id);

-- ---------------------------------------------------------------------
-- 2. Index för order_items aggregering
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_order_items_aggregation 
ON public.order_items(order_id, product_id, quantity);

-- ---------------------------------------------------------------------
-- 3. RPC-funktion för aggregerad packsedel per kampanj
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_aggregated_campaign_picklist(target_campaign_id UUID)
RETURNS TABLE (
    sku TEXT,
    product_name TEXT,
    variant_name TEXT,
    total_quantity BIGINT,
    units_per_box INT,
    warehouse_location TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.sku,
        p.name as product_name,
        p.variant_name,
        SUM(oi.quantity) as total_quantity,
        p.units_per_box,
        p.warehouse_location
    FROM public.order_items oi
    JOIN public.orders o ON oi.order_id = o.id
    JOIN public.products p ON oi.product_id = p.id
    WHERE o.campaign_id = target_campaign_id 
      AND o.payment_status = 'paid'
    GROUP BY p.sku, p.name, p.variant_name, p.units_per_box, p.warehouse_location
    ORDER BY p.warehouse_location ASC;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 4. RLS för bulk_shipments
-- ---------------------------------------------------------------------
ALTER TABLE public.bulk_shipments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage bulk shipments" ON public.bulk_shipments;
CREATE POLICY "Admins can manage bulk shipments" ON public.bulk_shipments
    FOR ALL
    TO authenticated
    USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- ---------------------------------------------------------------------
-- 5. Grant execute på RPC-funktion
-- ---------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.get_aggregated_campaign_picklist(UUID) TO authenticated;

COMMIT;

-- =====================================================================
-- NOTERINGAR
-- =====================================================================
-- Denna migration lägger till:
-- 1. bulk_shipments tabell för spårning av samlade leveranser
-- 2. Index för snabb aggregering av order_items
-- 3. RPC-funktion get_aggregated_campaign_picklist för packsedelsgenerering
-- 4. RLS policies för bulk_shipments
--
-- RPC-funktionen returnerar aggregerad data för alla betalda ordrar i en kampanj,
-- sorterad efter lagerplats för optimerad plockstråk.
