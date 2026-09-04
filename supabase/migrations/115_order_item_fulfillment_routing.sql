-- Persist per-item fulfillment routing for multi-warehouse orders.
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS origin_warehouse_partner_id UUID REFERENCES public.warehouse_partners(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS destination_warehouse_id UUID REFERENCES public.consolidation_warehouses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS fulfillment_route_status TEXT NOT NULL DEFAULT 'planned';

CREATE INDEX IF NOT EXISTS idx_order_items_origin_warehouse
  ON public.order_items(origin_warehouse_partner_id);
CREATE INDEX IF NOT EXISTS idx_order_items_destination_warehouse
  ON public.order_items(destination_warehouse_id);

COMMENT ON COLUMN public.order_items.origin_warehouse_partner_id IS 'Warehouse partner selected for the product fulfillment origin.';
COMMENT ON COLUMN public.order_items.destination_warehouse_id IS 'Consolidation/distribution warehouse nearest to the customer or club.';
COMMENT ON COLUMN public.order_items.fulfillment_route_status IS 'planned, allocated, picked, packed, shipped, delivered, cancelled.';

GRANT ALL ON TABLE public.order_items TO service_role;
GRANT SELECT ON TABLE public.order_items TO authenticated;
