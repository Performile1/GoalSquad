-- =====================================================================
-- GOALSQUAD MIGRATION: MULTI-ECHELON CROSS-DOCKING LOGISTICS
-- =====================================================================
-- Avancerad logistikmotor för hub-to-hub bulkning och konsolidering

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Definiera relationer mellan lagerhubbar för Hub-to-Hub bulkning
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.warehouse_network (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_warehouse_id UUID REFERENCES public.consolidation_warehouses(id) ON DELETE CASCADE,
    child_warehouse_id UUID REFERENCES public.consolidation_warehouses(id) ON DELETE CASCADE,
    shipping_cost_multiplier NUMERIC(3,2) DEFAULT 1.00,
    delivery_lead_time_days INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_warehouse_network_parent ON public.warehouse_network(parent_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_network_child ON public.warehouse_network(child_warehouse_id);

-- ---------------------------------------------------------------------
-- 2. Utöka sändningstabellen för att hantera delsträckor (Legs)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipment_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bulk_shipment_id UUID REFERENCES public.bulk_shipments(id) ON DELETE CASCADE,
    segment_order INT NOT NULL,
    from_entity_type TEXT NOT NULL CHECK (from_entity_type IN ('merchant', 'warehouse')),
    from_entity_id UUID NOT NULL,
    to_entity_type TEXT NOT NULL CHECK (to_entity_type IN ('warehouse', 'community', 'consumer')),
    to_entity_id UUID NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'arrived', 'ready_for_pickup')),
    tracking_number TEXT,
    arrived_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_segments_routing ON public.shipment_segments(from_entity_id, to_entity_id);
CREATE INDEX IF NOT EXISTS idx_segments_bulk ON public.shipment_segments(bulk_shipment_id);
CREATE INDEX IF NOT EXISTS idx_segments_status ON public.shipment_segments(status);

-- ---------------------------------------------------------------------
-- 3. Kötabell för fysisk cross-docking-instruktion på lagret
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.warehouse_cross_dock_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bulk_shipment_id UUID REFERENCES public.bulk_shipments(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    quantity INT NOT NULL,
    origin_warehouse_id UUID REFERENCES public.consolidation_warehouses(id),
    destination_warehouse_id UUID REFERENCES public.consolidation_warehouses(id),
    status TEXT DEFAULT 'awaiting_inbound' CHECK (status IN ('awaiting_inbound', 'ready_to_sort', 'consolidated')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cross_dock_status ON public.warehouse_cross_dock_queue(origin_warehouse_id, status);
CREATE INDEX IF NOT EXISTS idx_cross_dock_destination ON public.warehouse_cross_dock_queue(destination_warehouse_id);

-- ---------------------------------------------------------------------
-- 4. Tabell för logistiska avvikelser
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.warehouse_discrepancies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bulk_shipment_id UUID REFERENCES public.bulk_shipments(id) ON DELETE CASCADE,
    reported_by UUID NOT NULL REFERENCES public.profiles(id),
    sku TEXT NOT NULL,
    expected_quantity INT NOT NULL,
    actual_quantity INT NOT NULL,
    discrepancy_type TEXT CHECK (discrepancy_type IN ('damaged_goods', 'inventory_shortage', 'wrong_item')),
    resolution_status TEXT DEFAULT 'pending' CHECK (resolution_status IN ('pending', 'merchant_notified', 'refund_triggered', 'ignored')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_discrepancy_status ON public.warehouse_discrepancies(resolution_status);

-- ---------------------------------------------------------------------
-- 5. Lägg till is_central_hub fält till consolidation_warehouses om det inte finns
-- ---------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'consolidation_warehouses' 
        AND column_name = 'is_central_hub'
    ) THEN
        ALTER TABLE public.consolidation_warehouses ADD COLUMN is_central_hub BOOLEAN DEFAULT false;
    END IF;
END $$;

-- ---------------------------------------------------------------------
-- 6. Lägg till zip_code fält till consolidation_warehouses om det inte finns
-- ---------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'consolidation_warehouses' 
        AND column_name = 'zip_code'
    ) THEN
        ALTER TABLE public.consolidation_warehouses ADD COLUMN zip_code TEXT;
    END IF;
END $$;

-- ---------------------------------------------------------------------
-- 7. RLS för nya tabeller
-- ---------------------------------------------------------------------
ALTER TABLE public.warehouse_network ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_cross_dock_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_discrepancies ENABLE ROW LEVEL SECURITY;

-- Policies för warehouse_network
DROP POLICY IF EXISTS "Admins can manage warehouse_network" ON public.warehouse_network;
CREATE POLICY "Admins can manage warehouse_network" ON public.warehouse_network
    FOR ALL TO authenticated
    USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- Policies för shipment_segments
DROP POLICY IF EXISTS "Admins can manage shipment_segments" ON public.shipment_segments;
CREATE POLICY "Admins can manage shipment_segments" ON public.shipment_segments
    FOR ALL TO authenticated
    USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- Policies för warehouse_cross_dock_queue
DROP POLICY IF EXISTS "Warehouse partners can view their queue" ON public.warehouse_cross_dock_queue;
CREATE POLICY "Warehouse partners can view their queue" ON public.warehouse_cross_dock_queue
    FOR SELECT TO authenticated
    USING (
        auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR
        auth.jwt() -> 'user_metadata' ->> 'warehouse_id'::text = origin_warehouse_id::text
    );

DROP POLICY IF EXISTS "Admins can update cross_dock_queue" ON public.warehouse_cross_dock_queue;
CREATE POLICY "Admins can update cross_dock_queue" ON public.warehouse_cross_dock_queue
    FOR UPDATE TO authenticated
    USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Admins can delete cross_dock_queue" ON public.warehouse_cross_dock_queue;
CREATE POLICY "Admins can delete cross_dock_queue" ON public.warehouse_cross_dock_queue
    FOR DELETE TO authenticated
    USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Admins can insert cross_dock_queue" ON public.warehouse_cross_dock_queue;
CREATE POLICY "Admins can insert cross_dock_queue" ON public.warehouse_cross_dock_queue
    FOR INSERT TO authenticated
    WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- Policies för warehouse_discrepancies
DROP POLICY IF EXISTS "Warehouse partners can report discrepancies" ON public.warehouse_discrepancies;
CREATE POLICY "Warehouse partners can report discrepancies" ON public.warehouse_discrepancies
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR
        auth.jwt() -> 'user_metadata' ->> 'role' = 'warehouse_partner'
    );

DROP POLICY IF EXISTS "Admins can view discrepancies" ON public.warehouse_discrepancies;
CREATE POLICY "Admins can view discrepancies" ON public.warehouse_discrepancies
    FOR SELECT TO authenticated
    USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- ---------------------------------------------------------------------
-- 8. RPC: Hitta optimal lokal lagerhubb baserat på postnummer
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.find_optimal_local_warehouse(target_zip TEXT)
RETURNS UUID AS $$
DECLARE
    selected_warehouse_id UUID;
BEGIN
    -- Sök efter det lager som hanterar denna regions postnummer (första 2 siffrorna)
    SELECT id INTO selected_warehouse_id
    FROM public.consolidation_warehouses
    WHERE left(zip_code, 2) = left(target_zip, 2)
      AND is_central_hub = false
    LIMIT 1;

    -- Fallback: Om ingen lokal hubb matchar, välj den angivna huvud-centralhubben
    IF selected_warehouse_id IS NULL THEN
        SELECT id INTO selected_warehouse_id FROM public.consolidation_warehouses WHERE is_central_hub = true LIMIT 1;
    END IF;

    RETURN selected_warehouse_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------
-- 9. RPC: Aggregera och räkna ut konsolideringsrutter för stängda kampanjer
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_multi_echelon_routing(target_campaign_ids UUID[])
RETURNS TABLE (
    merchant_id UUID,
    merchant_name TEXT,
    sku TEXT,
    product_name TEXT,
    total_quantity BIGINT,
    central_warehouse_id UUID,
    local_warehouse_id UUID,
    campaign_group_names TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.merchant_id,
        m.company_name as merchant_name,
        p.sku,
        p.name as product_name,
        SUM(oi.quantity)::BIGINT as total_quantity,
        p.default_warehouse_id as central_warehouse_id,
        public.find_optimal_local_warehouse(o.shipping_zip) as local_warehouse_id,
        array_agg(DISTINCT c.name) as campaign_group_names
    FROM public.order_items oi
    JOIN public.orders o ON oi.order_id = o.id
    JOIN public.products p ON oi.product_id = p.id
    JOIN public.merchants m ON p.merchant_id = m.id
    JOIN public.campaigns c ON o.campaign_id = c.id
    WHERE o.campaign_id = ANY(target_campaign_ids)
      AND o.payment_status = 'paid'
    GROUP BY 
        p.merchant_id, 
        m.company_name, 
        p.sku, 
        p.name, 
        p.default_warehouse_id, 
        public.find_optimal_local_warehouse(o.shipping_zip);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------
-- 10. Grant execute på RPC-funktioner
-- ---------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.find_optimal_local_warehouse(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_multi_echelon_routing(UUID[]) TO authenticated;

COMMIT;

-- =====================================================================
-- NOTERINGAR
-- =====================================================================
-- Denna migration lägger till:
-- 1. warehouse_network - Relationer mellan lagerhubbar
-- 2. shipment_segments - Delsträckor i transportkedjan
-- 3. warehouse_cross_dock_queue - Kö för cross-docking-instruktioner
-- 4. warehouse_discrepancies - Avvikelsehantering
-- 5. Uppdateringar till consolidation_warehouses-tabellen
-- 6. RLS policies för alla nya tabeller
