import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  const loggerContext = { route: '/api/admin/logistics/consolidate', method: 'POST' };

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || session.user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { campaignIds } = await request.json();
    if (!campaignIds || !Array.isArray(campaignIds)) {
      return NextResponse.json({ error: 'Missing campaignIds array' }, { status: 400 });
    }

    const { data: routingPlan, error: rpcError } = await supabaseAdmin
      .rpc('generate_multi_echelon_routing', { target_campaign_ids: campaignIds });

    if (rpcError) throw rpcError;
    if (!routingPlan || routingPlan.length === 0) {
      return NextResponse.json({ success: true, message: 'Inga artiklar att konsolidera för dessa kampanjer.' });
    }

    for (const row of routingPlan) {
      const { data: bulkShipment, error: shipmentError } = await supabaseAdmin
        .from('bulk_shipments')
        .insert({
          merchant_id: row.merchant_id,
          warehouse_id: row.central_warehouse_id,
          shipping_provider: 'Nätverksfrakt Linjebil',
          status: 'pending'
        })
        .select()
        .single();

      if (shipmentError) throw shipmentError;

      await supabaseAdmin.from('shipment_segments').insert({
        bulk_shipment_id: bulkShipment.id,
        segment_order: 1,
        from_entity_type: 'merchant',
        from_entity_id: row.merchant_id,
        to_entity_type: 'warehouse',
        to_entity_id: row.central_warehouse_id,
        status: 'pending'
      });

      if (row.central_warehouse_id !== row.local_warehouse_id) {
        await supabaseAdmin.from('shipment_segments').insert({
          bulk_shipment_id: bulkShipment.id,
          segment_order: 2,
          from_entity_type: 'warehouse',
          from_entity_id: row.central_warehouse_id,
          to_entity_type: 'warehouse',
          to_entity_id: row.local_warehouse_id,
          status: 'pending'
        });
      }

      await supabaseAdmin.from('warehouse_cross_dock_queue').insert({
        bulk_shipment_id: bulkShipment.id,
        sku: row.sku,
        quantity: row.total_quantity,
        origin_warehouse_id: row.central_warehouse_id,
        destination_warehouse_id: row.local_warehouse_id,
        metadata: { groups: row.campaign_group_names, product_name: row.product_name }
      });
    }

    await supabaseAdmin.from('audit_logs').insert({
      actor_id: session.user.id,
      action: 'LOGISTICS_BATCH_CONSOLIDATION',
      entity_type: 'bulk_shipments',
      changes: { processed_campaigns: campaignIds, total_routes_generated: routingPlan.length }
    });

    return NextResponse.json({
      success: true,
      routes_generated: routingPlan.length,
      plan: routingPlan
    });

  } catch (error: any) {
    console.error(JSON.stringify({ level: 'error', message: error.message, ...loggerContext }));
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
