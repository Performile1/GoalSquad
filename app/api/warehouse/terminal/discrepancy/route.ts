import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || !['warehouse_partner', 'admin'].includes(session.user.user_metadata?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { bulkShipmentId, sku, expectedQty, actualQty, type, notes } = await request.json();

    if (!bulkShipmentId || !sku || actualQty === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: discrepancy, error: dbError } = await supabaseAdmin
      .from('warehouse_discrepancies')
      .insert({
        bulk_shipment_id: bulkShipmentId,
        reported_by: session.user.id,
        sku,
        expected_quantity: expectedQty,
        actual_quantity: actualQty,
        discrepancy_type: type,
        notes
      })
      .select()
      .single();

    if (dbError) throw dbError;

    await supabaseAdmin
      .from('warehouse_cross_dock_queue')
      .update({ 
        quantity: actualQty,
        metadata: { discrepancy_flagged: true, original_quantity: expectedQty }
      })
      .eq('bulk_shipment_id', bulkShipmentId)
      .eq('sku', sku);

    await supabaseAdmin.from('audit_logs').insert({
      actor_id: session.user.id,
      action: 'WAREHOUSE_DISCREPANCY_REPORTED',
      entity_type: 'warehouse_discrepancies',
      entity_id: discrepancy.id,
      changes: { sku, shortfall: expectedQty - actualQty, type }
    });

    return NextResponse.json({ success: true, discrepancyId: discrepancy.id });

  } catch (error: any) {
    console.error('[WAREHOUSE_API_ERROR]', error.message);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
